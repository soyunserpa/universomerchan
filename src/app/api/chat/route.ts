import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getProductList } from "../../../lib/catalog-api";

export const maxDuration = 60;

// Esquema Zod garantizado para la salida
const PackSchema = z.object({
  title: z.string().describe("Nombre creativo e inspirador del pack"),
  intro: z.string().describe("Breve bienvenida mencionando a la empresa y objetivo"),
  products: z.array(
    z.object({
      masterCode: z.string(),
      name: z.string(),
      image: z.string(),
      price: z.string().nullable(),
      url: z.string(),
      justification: z.string().describe("Por qué encaja con la empresa")
    })
  ).describe("Array de 4-5 productos variados"),
  closing: z.string().describe("Mensaje de cierre animando a pedir presupuesto")
});

const SwapSchema = z.object({
  masterCode: z.string(),
  name: z.string(),
  image: z.string(),
  price: z.string().nullable(),
  url: z.string(),
  justification: z.string()
});

// Función auxiliar para obtener contexto sin quemar tokens excesivos ni bucles de tools
async function getContextForLLM(queryTerm: string) {
  try {
    let res = await getProductList({ search: queryTerm, limit: 40 });
    if (!res || !res.products || res.products.length < 10) {
      // Si la búsqueda por industria no da muchos frutos, traemos genéricos y populares
      res = await getProductList({ limit: 40, sort: 'newest' });
    }
    
    return res.products.map((p: any) => ({
      masterCode: p.masterCode,
      name: p.name,
      price: p.startingPrice ? `${p.startingPrice}` : null,
      image: p.mainImage || '',
      url: `/product/${p.masterCode}`
    }));
  } catch (e) {
    console.error("Error obteniendo catálogo:", e);
    return []; // fallback gracefully
  }
}

async function generatePack(companyName: string, industry: string, objective: string) {
  // Buscamos productos localmente usando la industria como base heurística
  const catalogSubset = await getContextForLLM(industry);
  
  if (catalogSubset.length === 0) {
    throw new Error("El catálogo está vacío o no responde. Intenta más tarde.");
  }

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: PackSchema,
    system: `Eres un experto en merchandising corporativo B2B. Crea un pack de regalo corporativo (4 a 5 artículos variados) seleccionando EXCLUSIVAMENTE de los productos provistos en el Catálogo a continuación.
REGLAS:
1. No inventes productos. Usa SOLO los del Catálogo provisto.
2. Mezcla artículos de distintas categorías (ej: no repitas prendas o libretas idénticas).
3. Conserva escrupulosamente el masterCode, name, image, price y url exactamente como vienen en el Catálogo.

CATÁLOGO DISPONIBLE:
${JSON.stringify(catalogSubset, null, 2)}
`,
    prompt: `Empresa: ${companyName}\nSector/Industria: ${industry}\nObjetivo: ${objective}\nSelecciona los mejores y crea el pack para ellos.`
  });

  return object;
}

async function swapProduct(companyName: string, industry: string, objective: string, masterCodeToReplace: string, currentPackCodes: string[]) {
  const catalogSubset = await getContextForLLM(industry);
  
  if (catalogSubset.length === 0) throw new Error("Catálogo no disponible.");

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: SwapSchema,
    system: `Eres un experto en merchandising B2B. El cliente quiere reemplazar uno de los productos de su pack actual por otro diferente de este Catálogo.
REGLAS:
1. Elige un producto del Catálogo Exclusivo provisto.
2. NO SUGIERAS los que ya están en el pack: ${currentPackCodes.join(", ")} ni tampoco el actual ${masterCodeToReplace}.
3. Conserva escrupulosamente las URLs e imágenes tal cual vienen en el Catálogo provisto.

CATÁLOGO EXCLUSIVO:
${JSON.stringify(catalogSubset, null, 2)}
`,
    prompt: `Empresa: ${companyName}\nObjetivo: ${objective}\nEl cliente ya no quiere el producto "${masterCodeToReplace}". Busca y devuelve una estupenda alternativa.`
  });

  return object;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, company_name, industry, objective } = body;

    if (action === "generate_pack" || action === "regenerate_pack") {
      if (!company_name || !industry || !objective) return NextResponse.json({ error: "Faltan datos obligatorios." }, { status: 400 });
      const pack = await generatePack(company_name, industry, objective);
      return NextResponse.json({ pack });
    }

    if (action === "swap_product") {
      const { masterCodeToReplace, currentPack } = body;
      if (!masterCodeToReplace || !currentPack || !currentPack.products) return NextResponse.json({ error: "Faltan datos del pack." }, { status: 400 });
      const currentCodes = currentPack.products.map((p: any) => p.masterCode);
      const product = await swapProduct(company_name || "", industry || "", objective || "", masterCodeToReplace, currentCodes);
      return NextResponse.json({ product });
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
