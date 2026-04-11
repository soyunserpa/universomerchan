import { NextRequest, NextResponse } from "next/server";
import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getProductList } from "../../../lib/catalog-api";

export const maxDuration = 60; // Allow enough time for tool calling and reasoning

// Shared search tool definition to reuse in generate and swap
const searchCatalogTool = tool({
  description: 'Busca productos promocionales y de empresa en el catálogo de Universo Merchan.',
  inputSchema: z.object({ 
    query: z.string().describe('Término de búsqueda descriptivo de lo que se busca (ej. libretas ecologicas, mochilas, termos, etc)') 
  }),
  execute: async ({ query }) => {
    try {
      const res = await getProductList({
        search: query && query.toLowerCase() !== "general" ? query : undefined,
        limit: 30, // Get a good variety
        sort: 'newest'
      });
      
      return res.products.map((p: any) => ({
        masterCode: p.masterCode,
        name: p.name,
        price: p.startingPrice ? `${p.startingPrice}` : null,
        image: p.mainImage || '',
        url: `/product/${p.masterCode}`
      }));
    } catch (e) {
      console.error("Error searching catalog in tool:", e);
      return [];
    }
  }
});

async function generatePack(companyName: string, industry: string, objective: string) {
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    maxSteps: 3, // Allowing the model to use the tool and then respond
    system: `Eres un experto en merchandising corporativo B2B. Tu objetivo es armar un pack de regalo corporativo (4 a 5 artículos variados) usando productos REALES del catálogo.
DEBES usar SIEMPRE la herramienta 'searchCatalog' para encontrar opciones antes de recomendar.

REGLAS:
1. No inventes productos. Usa SOLO lo que te devuelva la herramienta.
2. Selecciona artículos de categorías variadas (por ejemplo: evita poner 3 bolígrafos o 3 libretas, mézclalo: 1 taza, 1 cuaderno, 1 bolsa, 1 bolígrafo premium).
3. Tu salida FINAL debe ser ÚNICA y EXCLUSIVAMENTE en formato JSON válido. Ni una sola palabra fuera del JSON.

ESTRUCTURA EXACTA REQUERIDA (JSON):
{
  "title": "Nombre creativo e inspirador del pack",
  "intro": "Párrafo breve dando la bienvenida a la empresa y elogiando su objetivo (1-2 frases)",
  "products": [
    {
      "masterCode": "CÓDIGO del artículo devuelto",
      "name": "Nombre original devuelto",
      "image": "URL de la imagen devuelta",
      "price": "precio devuelto (sin símbolos de moneda, solo el número o null)",
      "url": "url relativa devuelta",
      "justification": "Escribe un breve motivo específico de por qué este producto encaja con su sector y objetivo"
    }
  ],
  "closing": "Mensaje final animándoles a solicitar el presupuesto o buscar más opciones."
}`,
    prompt: `Empresa: ${companyName}\nSector/Industria: ${industry}\nObjetivo: ${objective}\nRevisa el catálogo y genera el pack exacto en formato JSON tal y como se indica.`,
    tools: {
      searchCatalog: searchCatalogTool
    }
  });

  const cleaned = result.text.replace(/```json\s*/ig, "").replace(/```\s*/ig, "").trim();
  return JSON.parse(cleaned);
}

async function swapProduct(companyName: string, industry: string, objective: string, masterCodeToReplace: string, currentPackCodes: string[]) {
  const currentExcl = currentPackCodes.join(", ");
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    maxSteps: 3,
    system: `Eres un experto en merchandising B2B. El cliente quiere reemplazar uno de los productos que le habías sugerido por una opción diferente y novedosa.
DEBES usar la herramienta 'searchCatalog' para buscar una alternativa. 

REGLAS:
1. Usa SOLO productos devueltos por la herramienta.
2. NO SUGIERAS ninguno de estos masterCodes que ya están en el pack: ${currentExcl} ni el actual ${masterCodeToReplace}.
3. Responde FINALMENTE y solo como objeto JSON válido, sin bloques de markdown.

ESTRUCTURA EXACTA REQUERIDA (JSON):
{
  "masterCode": "NUEVO_CÓDIGO",
  "name": "Nombre original",
  "image": "URL imagen",
  "price": "Precio",
  "url": "Url",
  "justification": "Por qué es una excelente alternativa para ellos."
}`,
    prompt: `Empresa: ${companyName}\nSector/Industria: ${industry}\nObjetivo: ${objective}\nEl cliente ya no quiere el producto con masterCode "${masterCodeToReplace}". Busca algo distinto y entrégame el JSON del nuevo producto de reemplazo.`,
    tools: {
      searchCatalog: searchCatalogTool
    }
  });

  const cleaned = result.text.replace(/```json\s*/ig, "").replace(/```\s*/ig, "").trim();
  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, company_name, industry, objective } = body;

    // Acción para generar un pack inicial o re-generar otro
    if (action === "generate_pack" || action === "regenerate_pack") {
      if (!company_name || !industry || !objective) {
        return NextResponse.json(
          { error: "Faltan datos obligatorios requeridos (company_name, industry, objective)" },
          { status: 400 }
        );
      }
      
      const rawPackObj = await generatePack(company_name, industry, objective);
      return NextResponse.json({ pack: rawPackObj });
    }

    // Acción para reemplazar puntualmente un producto
    if (action === "swap_product") {
      const { masterCodeToReplace, currentPack } = body;
      if (!masterCodeToReplace || !currentPack || !currentPack.products) {
        return NextResponse.json({ error: "Faltan datos del pack o producto a reemplazar" }, { status: 400 });
      }

      const currentCodes = currentPack.products.map((p: any) => p.masterCode);
      const newProductObj = await swapProduct(
        company_name || "Cliente Corporativo",
        industry || "General",
        objective || "Regalo promocional",
        masterCodeToReplace,
        currentCodes
      );
      
      return NextResponse.json({ product: newProductObj });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno generando pack" },
      { status: 500 }
    );
  }
}
