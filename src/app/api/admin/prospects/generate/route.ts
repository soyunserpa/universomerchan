import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getProductList } from "@/lib/catalog-api";

export const maxDuration = 60;

const ProspectEmailSchema = z.object({
  subject: z.string().describe("El asunto del correo, llamativo, corto y personalizado para B2B"),
  htmlBody: z.string().describe("El cuerpo del correo en HTML limpio. Usa tu creatividad para inyectar una propueta de 3 productos, usando variables {{PRODUCT_1}}, {{PRODUCT_2}} y {{PRODUCT_3}} donde quieras que aparezcan las tarjetas visuales de los productos en el correo."),
  selectedMasterCodes: z.array(z.string()).min(3).max(3).describe("Elige OBLIGATORIAMENTE 3 masterCodes seleccionados de la lista de productos proporcionados."),
});

export async function POST(req: NextRequest) {
  try {
    const { companyName, industry, notes, logoUrl } = await req.json();

    if (!companyName) {
      return NextResponse.json({ error: "El nombre de la empresa es obligatorio." }, { status: 400 });
    }

    // --- STEP 1: Determine English search keywords for the Industry ---
    const { object: searchObj } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({ 
        primaryKeyword: z.string().describe("A single, very broad english keyword for promotional items matching this company (e.g. 'tech', 'drinkware', 'bag', 'office', 'sport', 'health'). If unsure, use something generic like 'notebook' or 'pen' or 'cup'.") 
      }),
      system: "You map a company name and industry to a broad english search term for the Midocean promotional products catalog.",
      prompt: `Company: ${companyName}\nIndustry: ${industry || 'Unknown'}\nNotes: ${notes || ''}`
    });

    // --- STEP 2: Fetch Products ---
    console.log("Searching Midocean for:", searchObj.primaryKeyword);
    const productData = await getProductList({ search: searchObj.primaryKeyword, limit: 100 });
    let candidateProducts = productData.products.filter(p => p.mainImage && p.startingPriceRaw > 0);

    if (candidateProducts.length < 3) {
      // Fallback
      console.log("Fewer than 3 products found, falling back to filling with random popular items");
      const fallbackData = await getProductList({ limit: 100 });
      const validFallbacks = fallbackData.products.filter(p => p.mainImage && p.startingPriceRaw > 0);
      candidateProducts = [...candidateProducts, ...validFallbacks];
    }

    // Deduplicate in case fallbacks overlap
    const seen = new Set();
    candidateProducts = candidateProducts.filter(p => {
      if (seen.has(p.masterCode)) return false;
      seen.add(p.masterCode);
      return true;
    });

    // Limit to 60 for the LLM context limits (to save tokens)
    candidateProducts = candidateProducts.slice(0, 60);

    // Create a simplified JSON for the LLM
    const simplifiedCatalog = candidateProducts.map(p => ({
      masterCode: p.masterCode,
      name: p.name,
      description: p.shortDescription || "",
      category: p.category,
      price: p.startingPriceRaw
    }));

    // --- STEP 3: Generate the Email & Pick Top 3 ---
    const systemPrompt = `
Eres el Director Comercial de "Universo Merchan". Vas a redactar un correo B2B en frío (Cold Outreach) altamente persuasivo, corto y directo.
Tienes una lista de productos en formato JSON disponible. DEBES seleccionar exactamente 3 'masterCodes' que mejor encajen con el prospecto, considerando su industria y notas.

Reglas Inquebrantables:
1. El correo debe ir dirigido a compras o marketing.
2. Quien lo firma abajo del todo es "El equipo de Universo Merchan". NO firmes como Marina.
3. NUNCA ofrezcas "muestras físicas sin coste", sólo ofrecemos "Bocetos visuales interactivos" a través de nuestro configurador usando su logotipo incrustado.
4. El tono debe ser profesional, fresco y corto. NUNCA uses emojis, emoticonos o símbolos raros (como 👍, 🚀,🎶, etc.), ya que el sistema de correo los reescribe como signos de interrogación (???).
5. DEBES inyectar los marcadores {{PRODUCT_1}}, {{PRODUCT_2}} y {{PRODUCT_3}} de forma intercalada en el cuerpo del HTML (por ejemplo dentro de una celda, tabla, o bloque div alineado). El backend sustituirá esas etiquetas por tarjetas completas y diseñadas con la foto, nombre y precio del producto.
6. MUY IMPORTANTE: NO escribas tú el nombre del producto, la descripción ni los precios en el texto debajo o encima de la etiqueta {{PRODUCT_X}}. La tarjeta ya lo incluye todo. Si por algún motivo debes mencionar un precio en el saludo, usa SIEMPRE euros (€) y nunca dólares ($).
7. Devuelve un HTML válido y limpio.
`;

    const userPrompt = `
Empresa Objetivo: ${companyName}
Industria de la Empresa: ${industry || "General"}
Notas extras: ${notes || "Preséntate brevemente y ofréceles nuestro catálogo infinito y la creación de un Auto-Mockup en tiempo real."}

CATÁLOGO DONDE ELEGIR 3 PRODUCTOS:
${JSON.stringify(simplifiedCatalog, null, 2)}
`;

    const { object: emailObj } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: ProspectEmailSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    // --- STEP 4: Render the Rich HTML ---
    // Substitute the markers with gorgeous HTML cards containing Auto-Mockup links.
    let finalHtml = emailObj.htmlBody;

    emailObj.selectedMasterCodes.slice(0, 3).forEach((mCode, index) => {
      const p = candidateProducts.find(cp => cp.masterCode === mCode);
      if (!p) return;

      const slug = `${p.masterCode.toLowerCase()}-${p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")}`;
      // Attach the global logo GET query param so they jump directly into Auto-Mockup!
      const productLink = logoUrl 
        ? `https://universomerchan.com/product/${slug}?logo=${encodeURIComponent(logoUrl)}` 
        : `https://universomerchan.com/product/${slug}`;

      // A simple beautiful table-based card (Email safe)
      const productCardHTML = `
<!-- Product Card ${index + 1} -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; margin: 20px 0; font-family: sans-serif; background: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
  <tr>
    <td width="130" style="background: #f9fafb; padding: 10px; text-align: center; vertical-align: middle;">
      <a href="${productLink}" target="_blank">
        <img src="${p.mainImage}" alt="${p.name}" width="100" style="max-width: 100px; height: auto; mix-blend-mode: multiply; border-radius: 8px;" />
      </a>
    </td>
    <td style="padding: 15px; vertical-align: middle;">
      <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #111827;">${p.name}</h3>
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #6b7280;">Desde ${p.startingPriceRaw.toFixed(2)}€/ud</p>
      <a href="${productLink}" style="display: inline-block; background: #e50000; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold;">
        ${logoUrl ? 'Ver con tu Logotipo' : 'Personalizar Producto'}
      </a>
    </td>
  </tr>
</table>
      `;

      finalHtml = finalHtml.replace(`{{PRODUCT_${index + 1}}}`, productCardHTML);
    });

    // Fallback if the LLM forgot to include the markers
    for (let i = 0; i < 3; i++) {
        finalHtml = finalHtml.replace(`{{PRODUCT_${i + 1}}}`, "");
    }

    return NextResponse.json({ 
      success: true, 
      emailDraft: {
        subject: emailObj.subject,
        htmlBody: finalHtml
      } 
    });

  } catch (error: any) {
    console.error("AI Prospecting Error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno generando la propuesta B2B" },
      { status: 500 }
    );
  }
}
