import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { QuotePDFV2 } from "@/lib/quote-pdf-v2";
import type { QuoteDataV2 } from "@/lib/quote-pdf-v2";
import { generateQuoteNumber, generateBuyUrl } from "@/lib/quote-pdf";
import { uploadMockup } from "@/lib/artwork-upload";
import { writeFile, mkdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/universomerchan/uploads";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

// Convert a public mockup URL to a base64 data URL by reading from disk
// This avoids @react-pdf/renderer needing to HTTP-fetch from its own server
async function mockupUrlToBase64(url: string): Promise<string | undefined> {
  try {
    // URL like https://universomerchan.com/uploads/mockups/2026/03/mockup_xxx.jpeg
    // → file path: /var/www/universomerchan/uploads/mockups/2026/03/mockup_xxx.jpeg
    const urlObj = new URL(url);
    const relativePath = urlObj.pathname; // /uploads/mockups/2026/03/mockup_xxx.jpeg
    const filePath = path.join("/var/www/universomerchan", relativePath);
    if (!existsSync(filePath)) {
      console.warn("[Quote] Mockup file not found:", filePath);
      return undefined;
    }
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase().replace(".", "");
    const mime = ext === "png" ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch (err: any) {
    console.warn("[Quote] Failed to read mockup from disk:", err.message);
    return undefined;
  }
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

    // Process each zone: if mockupUrl provided (already uploaded), read from disk as base64
    // If mockupDataUrl provided (raw base64), save to disk first then use
    const zonesForPdf: QuoteDataV2["zones"] = [];
    const zonesForDb: any[] = [];

    for (const zone of body.zones || []) {
      let mockupForPdf: string | undefined;
      let mockupPublicUrl: string | undefined;

      if (zone.mockupUrl) {
        // Already uploaded to server — read from disk as base64 for @react-pdf
        mockupPublicUrl = zone.mockupUrl;
        mockupForPdf = await mockupUrlToBase64(zone.mockupUrl);
      } else if (zone.mockupDataUrl) {
        // Raw base64 — save to disk first
        const saved = await uploadMockup(zone.mockupDataUrl, quoteNumber + "-" + zone.positionId);
        if (saved) {
          mockupPublicUrl = saved;
          mockupForPdf = zone.mockupDataUrl; // already base64
        }
      }

      zonesForPdf.push({
        positionId: zone.positionId || "",
        positionName: zone.positionName || "",
        techniqueId: zone.techniqueId || "",
        techniqueName: zone.techniqueName || "",
        numColors: zone.numColors || 1,
        printWidthMm: zone.printWidthMm || 0,
        printHeightMm: zone.printHeightMm || 0,
        mockupDataUrl: mockupForPdf,
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
        imageUrl: body.product?.imageUrl || undefined,
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

    console.log("[Quote] Generating PDF with", zonesForPdf.length, "zones,", zonesForPdf.filter(z => z.mockupDataUrl).length, "with mockups");
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
