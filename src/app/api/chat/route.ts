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

const SearchQueriesSchema = z.object({
  queries: z.array(z.string()).max(5).describe("Array de 3 a 5 palabras clave de búsqueda (1-2 palabras máximo cada una) ultra-relacionadas con el sector u objetivo")
});

// Función auxiliar para obtener contexto sin quemar tokens excesivos ni bucles de tools
async function getContextForLLM(companyName: string, industry: string, objective: string) {
  try {
    // Paso 1: Agente pre-buscador. Le preguntamos a la IA qué categorías o keywords serían perfectas.
    const { object: searchPlan } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: SearchQueriesSchema,
      system: `Eres un estratega de merchandising. Tu tarea es generar 3 a 5 palabras clave en español para buscar en una base de datos de productos promocionales. 
Ejemplos:
- Gimnasio -> ["toalla", "botella", "deporte", "mochila"]
- Club de lujo -> ["vino", "cuero", "premium", "funda"]
- Oficina tech -> ["usb", "auriculares", "raton", "libreta"]
Limítate a palabras muy genéricas y sustantivos simples para maximizar los resultados.`,
      prompt: `Empresa: ${companyName}\nSector/Industria: ${industry}\nObjetivo: ${objective}\nGenera las búsquedas exactas.`
    });

    let queries = searchPlan.queries;
    if (!queries || queries.length === 0) {
      queries = ['libreta', 'botella', 'boligrafo', 'mochila'];
    }

    // Paso 2: Ejecutamos todas las búsquedas sugeridas en paralelo
    const promises = queries.map(term => getProductList({ search: term, limit: 12 }));
    if (industry && industry.trim().toLowerCase() !== "general") {
       promises.push(getProductList({ search: industry, limit: 10 }));
    }

    const results = await Promise.all(promises);
    const allProducts: any[] = [];
    for (const res of results) {
      if (res && res.products) allProducts.push(...res.products);
    }

    // Deduplicar por masterCode
    const unique = new Map();
    for (const p of allProducts) {
      unique.set(p.masterCode, p);
    }
    
    let diverseList = Array.from(unique.values());

    // Si la IA fue demasiado restrictiva y no encontró casi nada, rellenamos con genéricos
    if (diverseList.length < 15) {
       const anchorTerms = ['taza', 'boligrafo', 'paraguas', 'bolsa'];
       const fallbackRes = await Promise.all(anchorTerms.map(t => getProductList({ search: t, limit: 5 })));
       for (const res of fallbackRes) {
         if (res && res.products) {
           for (const p of res.products) {
             unique.set(p.masterCode, p);
           }
         }
       }
       diverseList = Array.from(unique.values());
    }

    // Barajar aleatoriamente y seleccionar top 60 opciones altamente relevantes
    diverseList = diverseList.sort(() => Math.random() - 0.5).slice(0, 60);
    
    return diverseList.map((p: any) => ({
      masterCode: p.masterCode,
      name: p.name,
      price: p.startingPrice ? `${p.startingPrice}` : null,
      image: p.mainImage || '',
      url: `/product/${p.masterCode}`
    }));
  } catch (e) {
    console.error("Error obteniendo catálogo semántico:", e);
    return []; // fallback gracefully
  }
}

async function generatePack(companyName: string, industry: string, objective: string) {
  // Buscamos productos localmente usando la industria como base heurística
  const catalogSubset = await getContextForLLM(companyName, industry, objective);
  
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
  const catalogSubset = await getContextForLLM(companyName, industry, objective);
  
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
