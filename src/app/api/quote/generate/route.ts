import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { QuotePDFV2 } from "@/lib/quote-pdf-v2";
import type { QuoteDataV2 } from "@/lib/quote-pdf-v2";
import { generateQuoteNumber, generateBuyUrl } from "@/lib/quote-pdf";
import { uploadMockup } from "@/lib/artwork-upload";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/universomerchan/uploads";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

export async function POST(req: NextRequest) {
  try {
    // Read body as text first (bypasses default 1MB json limit)
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    console.log("[Quote] Zones received:", (body.zones || []).length);
    console.log("[Quote] Zones with mockup:", (body.zones || []).filter((z: any) => z.mockupDataUrl).length);
    if (body.zones?.[0]?.mockupDataUrl) console.log("[Quote] First mockup length:", body.zones[0].mockupDataUrl.length);
    const sequentialId = Math.floor(Date.now() / 1000) % 100000;
    const quoteNumber = generateQuoteNumber(sequentialId);
    const now = new Date();
    const dateStr = now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const validUntilStr = validUntil.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

    // Save mockups to disk
    const zonesWithUrls: any[] = [];
    for (const zone of body.zones || []) {
      let mockupPublicUrl: string | undefined;
      if (zone.mockupDataUrl) {
        const saved = await uploadMockup(zone.mockupDataUrl, quoteNumber + "-" + zone.positionId);
        if (saved) mockupPublicUrl = saved;
      }
      zonesWithUrls.push({ ...zone, mockupPublicUrl });
    }

    const quoteData: QuoteDataV2 = {
      quoteNumber, date: dateStr, validUntil: validUntilStr,
      clientName: body.clientName || "Cliente", clientEmail: body.clientEmail || "", clientCompany: body.clientCompany || undefined,
      buyUrl: generateBuyUrl(quoteNumber),
      product: {
        name: body.product?.name || "Producto", masterCode: body.product?.masterCode || "",
        color: body.product?.color || "", colorCode: body.product?.colorCode || "",
        size: body.product?.size || undefined, imageUrl: body.product?.imageUrl || undefined,
        quantity: body.product?.quantity || 1,
      },
      pricing: {
        unitProductPrice: body.pricing?.unitProductPrice || 0, productTotal: body.pricing?.productTotal || 0,
        setupCost: body.pricing?.setupCost || 0, printPerUnit: body.pricing?.printPerUnit || 0,
        printTotal: body.pricing?.printTotal || 0, handlingPerUnit: body.pricing?.handlingPerUnit || 0,
        handlingTotal: body.pricing?.handlingTotal || 0, grandTotal: body.pricing?.grandTotal || 0,
        perUnit: body.pricing?.perUnit || 0,
      },
      zones: (body.zones || []).map((z: any) => ({
        positionId: z.positionId || "", positionName: z.positionName || "",
        techniqueId: z.techniqueId || "", techniqueName: z.techniqueName || "",
        numColors: z.numColors || 1, printWidthMm: z.printWidthMm || 0, printHeightMm: z.printHeightMm || 0,
        mockupDataUrl: z.mockupDataUrl || z.mockupUrl || undefined,
      })),
    };

    const pdfElement = createElement(QuotePDFV2, { data: quoteData });
    const buffer = await renderToBuffer(pdfElement as any);

    // Save PDF to disk
    const yearMonth = now.getFullYear() + "/" + String(now.getMonth() + 1).padStart(2, "0");
    const pdfDir = path.join(UPLOAD_DIR, "quotes", yearMonth);
    if (!existsSync(pdfDir)) await mkdir(pdfDir, { recursive: true });
    const pdfFileName = quoteNumber + ".pdf";
    await writeFile(path.join(pdfDir, pdfFileName), buffer);
    const pdfUrl = SITE_URL + "/uploads/quotes/" + yearMonth + "/" + pdfFileName;
    console.log("[Quote] Generated: " + quoteNumber + " (" + Math.round(buffer.length / 1024) + "KB)");

    // Save to DB
    try {
      await db.insert(schema.quotes).values({
        quoteNumber, guestEmail: body.clientEmail || null,
        cartSnapshot: { product: quoteData.product, pricing: quoteData.pricing, zones: zonesWithUrls.map((z: any) => ({ positionId: z.positionId, positionName: z.positionName, techniqueId: z.techniqueId, techniqueName: z.techniqueName, numColors: z.numColors, printWidthMm: z.printWidthMm, printHeightMm: z.printHeightMm, mockupUrl: z.mockupPublicUrl })) },
        totalPrice: String(quoteData.pricing.grandTotal), pdfUrl, expiresAt: validUntil,
      });
    } catch (dbErr: any) { console.error("[Quote] DB save error (non-fatal):", dbErr.message); }

    return new NextResponse(buffer, { status: 200, headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="' + quoteNumber + '.pdf"',
      "Cache-Control": "no-store",
    }});
  } catch (error: any) {
    console.error("[Quote] PDF generation error:", error);
    return NextResponse.json({ error: "Error al generar el presupuesto", details: error?.message }, { status: 500 });
  }
}
