import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db
      .select({
        id: schema.products.masterCode,
        title: schema.products.productName,
        description: schema.products.shortDescription,
        imageAssets: schema.products.digitalAssets,
        brand: schema.products.brand,
        category: schema.products.categoryLevel1,
        priceScales: schema.productPrices.priceScales,
      })
      .from(schema.products)
      .leftJoin(
        schema.productPrices,
        eq(schema.products.masterCode, schema.productPrices.masterCode)
      )
      .where(eq(schema.products.isVisible, true));

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Universo Merchan</title>
<link>https://universomerchan.com</link>
<description>Catálogo de regalos corporativos y merchandising para empresas</description>
`;

    for (const p of result) {
      if (!p.id || !p.title) continue;

      let price = "0.00";
      if (p.priceScales) {
        try {
          const scales = Array.isArray(p.priceScales) ? p.priceScales : JSON.parse(p.priceScales as string);
          // Get the cheapest per-unit price (highest quantity scale)
          const sorted = [...scales].sort((a: any, b: any) => {
            const minA = a.minimumQuantity || a.minimum_quantity || 0;
            const minB = b.minimumQuantity || b.minimum_quantity || 0;
            return minB - minA;
          });
          if (sorted[0]) {
            const cheapest = sorted[0].price || sorted[0].costPrice || 0;
            price = (Math.round(cheapest * 1.40 * 100) / 100).toFixed(2);
          }
        } catch (e) { }
      }

      let img = "";
      if (p.imageAssets) {
        try {
          const assets = Array.isArray(p.imageAssets) ? p.imageAssets : JSON.parse(p.imageAssets as string);
          const front = assets.find((a: any) => a.subtype?.includes("front"));
          if (front) {
            img = front.url_highress || front.url_highres || front.url;
          } else if (assets.length > 0) {
            img = assets[0].url_highress || assets[0].url_highres || assets[0].url;
          }
        } catch (e) { }
      }

      if (!img) continue; // Merchant center strictly requires image

      // XML escape helpers
      const escapeXml = (unsafe: string) => {
        return (unsafe || "").replace(/[<>&'"]/g, function (c) {
          switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
          }
        });
      };

      xml += `<item>
<g:id>${escapeXml(p.id)}</g:id>
<g:title>${escapeXml(p.title).substring(0, 149)}</g:title>
<g:description>${escapeXml(p.description || p.title).substring(0, 4900)}</g:description>
<g:link>https://universomerchan.com/product/${escapeXml(p.id.toLowerCase())}</g:link>
<g:image_link>${escapeXml(img)}</g:image_link>
<g:condition>new</g:condition>
<g:availability>in_stock</g:availability>
<g:price>${price} EUR</g:price>
<g:brand>${escapeXml(p.brand || "Universo Merchan")}</g:brand>
${p.category ? `<g:product_type>${escapeXml(p.category)}</g:product_type>` : ''}
</item>
`;
    }

    xml += `</channel></rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error generating merchant feed", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
