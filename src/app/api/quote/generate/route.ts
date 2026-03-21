import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { QuotePDFV2 } from "@/lib/quote-pdf-v2";
import type { QuoteDataV2 } from "@/lib/quote-pdf-v2";
import { generateQuoteNumber, generateBuyUrl } from "@/lib/quote-pdf";
import { writeFile, mkdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/universomerchan/uploads";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

// Convert a local mockup URL to base64 by reading from disk
// Avoids @react-pdf/renderer doing HTTP self-requests
async function localUrlToBase64(url: string): Promise<string | undefined> {
  try {
    const urlObj = new URL(url);
    const relativePath = urlObj.pathname; // e.g. /uploads/mockups/2026/03/mockup_xxx.jpg
    const filePath = path.join("/var/www/universomerchan", relativePath);
    if (!existsSync(filePath)) {
      console.warn("[Quote] File not found on disk:", filePath);
      return undefined;
    }
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase().replace(".", "");
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch (err: any) {
    console.warn("[Quote] Failed to read file from disk:", err.message);
    return undefined;
  }
}

// Fetch any external URL (e.g. Midocean CDN) and convert to base64
// @react-pdf/renderer can fail fetching external URLs; base64 is more reliable
async function externalUrlToBase64(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "UniversoMerchan/1.0", Accept: "image/*" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return undefined;
    const buffer = Buffer.from(await res.arrayBuffer());
    let contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
      contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    }
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (err: any) {
    console.warn("[Quote] Failed to fetch external image:", url, err.message);
    return undefined;
  }
}

// Convert any image URL to base64 — local or external
async function imageToBase64(url: string | undefined): Promise<string | undefined> {
  if (!url) return undefined;
  if (url.startsWith("data:")) return url; // Already base64
  if (url.includes("universomerchan.com/uploads/")) return localUrlToBase64(url);
  return externalUrlToBase64(url);
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    console.log("[Quote] Zones received:", (body.zones || []).length);

    const sequentialId = Math.floor(Date.now() / 1000) % 100000;
    const quoteNumber = generateQuoteNumber(sequentialId);
    const now = new Date();
    const dateStr = now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const validUntilStr = validUntil.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

    // Convert product image to base64 (Midocean CDN → base64)
    const productImageB64 = await imageToBase64(body.product?.imageUrl);

    // Process zones — convert all mockup URLs/dataUrls to base64
    const zonesForPdf: QuoteDataV2["zones"] = [];
    const zonesForDb: any[] = [];

    for (const zone of body.zones || []) {
      let mockupB64: string | undefined;
      let mockupPublicUrl: string | undefined;

      if (zone.mockupUrl) {
        // Already uploaded — read from disk
        mockupPublicUrl = zone.mockupUrl;
        mockupB64 = await imageToBase64(zone.mockupUrl);
      } else if (zone.mockupDataUrl) {
        // Raw base64 passed inline
        mockupB64 = zone.mockupDataUrl;
      }

      zonesForPdf.push({
        positionId: zone.positionId || "",
        positionName: zone.positionName || "",
        techniqueId: zone.techniqueId || "",
        techniqueName: zone.techniqueName || "",
        numColors: zone.numColors || 1,
        printWidthMm: zone.printWidthMm || 0,
        printHeightMm: zone.printHeightMm || 0,
        mockupDataUrl: mockupB64,
      });

      zonesForDb.push({
        positionId: zone.positionId,
        positionName: zone.positionName,
        techniqueId: zone.techniqueId,
        techniqueName: zone.techniqueName,
        numColors: zone.numColors,
        printWidthMm: zone.printWidthMm,
        printHeightMm: zone.printHeightMm,
        mockupUrl: mockupPublicUrl,
      });
    }

    const quoteData: QuoteDataV2 = {
      quoteNumber, date: dateStr, validUntil: validUntilStr,
      clientName: body.clientName || "Cliente",
      clientEmail: body.clientEmail || "",
      clientCompany: body.clientCompany || undefined,
      buyUrl: generateBuyUrl(quoteNumber),
      product: {
        name: body.product?.name || "Producto",
        masterCode: body.product?.masterCode || "",
        color: body.product?.color || "",
        colorCode: body.product?.colorCode || "",
        size: body.product?.size || undefined,
        imageUrl: productImageB64 || undefined, // base64, not URL
        quantity: body.product?.quantity || 1,
      },
      pricing: {
        unitProductPrice: body.pricing?.unitProductPrice || 0,
        productTotal: body.pricing?.productTotal || 0,
        setupCost: body.pricing?.setupCost || 0,
        printPerUnit: body.pricing?.printPerUnit || 0,
        printTotal: body.pricing?.printTotal || 0,
        handlingPerUnit: body.pricing?.handlingPerUnit || 0,
        handlingTotal: body.pricing?.handlingTotal || 0,
        grandTotal: body.pricing?.grandTotal || 0,
        perUnit: body.pricing?.perUnit || 0,
      },
      zones: zonesForPdf,
    };

    console.log("[Quote] Generating PDF:", zonesForPdf.length, "zones,",
      zonesForPdf.filter(z => z.mockupDataUrl).length, "with mockups,",
      productImageB64 ? "product image OK" : "no product image");

    const pdfElement = createElement(QuotePDFV2, { data: quoteData });
    const buffer = await renderToBuffer(pdfElement as any);

    // Save PDF to disk
    const yearMonth = now.getFullYear() + "/" + String(now.getMonth() + 1).padStart(2, "0");
    const pdfDir = path.join(UPLOAD_DIR, "quotes", yearMonth);
    if (!existsSync(pdfDir)) await mkdir(pdfDir, { recursive: true });
    const pdfFileName = quoteNumber + ".pdf";
    await writeFile(path.join(pdfDir, pdfFileName), buffer);
    const pdfUrl = SITE_URL + "/uploads/quotes/" + yearMonth + "/" + pdfFileName;
    console.log("[Quote] Generated:", quoteNumber, "(" + Math.round(buffer.length / 1024) + "KB)");

    // Save to DB
    try {
      await db.insert(schema.quotes).values({
        quoteNumber,
        guestEmail: body.clientEmail || null,
        cartSnapshot: { product: quoteData.product, pricing: quoteData.pricing, zones: zonesForDb },
        totalPrice: String(quoteData.pricing.grandTotal),
        pdfUrl,
        expiresAt: validUntil,
      });
    } catch (dbErr: any) {
      console.error("[Quote] DB save error (non-fatal):", dbErr.message);
    }

    return new NextResponse(buffer, { status: 200, headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="' + quoteNumber + '.pdf"',
      "Cache-Control": "no-store",
    }});
  } catch (error: any) {
    console.error("[Quote] PDF generation error:", error);
    return NextResponse.json(
      { error: "Error al generar el presupuesto", details: error?.message },
      { status: 500 }
    );
  }
}
