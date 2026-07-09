import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { CatalogPDF } from "@/lib/catalog-pdf";
import { getMagazineData, getCatalogCouponCode, PDF_PRODUCTS_PER_CATEGORY } from "@/lib/catalog-magazine";
import React from "react";

export const runtime = "nodejs";

// Genera el catálogo branded en PDF a partir de los productos en vivo.
export async function GET() {
  try {
    const [data, coupon] = await Promise.all([
      getMagazineData(PDF_PRODUCTS_PER_CATEGORY),
      getCatalogCouponCode(),
    ]);
    const year = new Date().getFullYear();

    const stream = await renderToStream(
      React.createElement(CatalogPDF, { data, coupon, year })
    );

    return new Response(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="catalogo-universo-merchan-${year}.pdf"`,
        // Cacheamos 1h en CDN/navegador (el contenido cambia poco).
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err: any) {
    console.error("[catalog/pdf] Error generando PDF:", err?.message);
    return new NextResponse("Error generando el catálogo", { status: 500 });
  }
}
