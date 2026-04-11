// src/app/api/chat/route.ts
// ═══════════════════════════════════════════════════════════════
// CHATBOT PACK CORPORATIVO — Backend
// Flujo: 3 respuestas del wizard → consulta catálogo BD → OpenAI → pack formateado
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { sql } from "drizzle-orm";

// ─── TYPES ───
type CatalogProduct = {
  master_code: string;
  name: string;
  description: string;
  category_level1: string;
  category_level2: string;
  category_level3: string;
  image_url: string;
  price: string | null;
  colors: string;
};

type PackProduct = {
  masterCode: string;
  name: string;
  image: string;
  price: string | null;
  url: string;
  justification: string;
};

type PackResponse = {
  title: string;
  intro: string;
  products: PackProduct[];
  closing: string;
};

// ═══════════════════════════════════════════════════════════════
// 1. FETCH CATALOG SUMMARY FROM DB
// ═══════════════════════════════════════════════════════════════

async function getCatalogSummary(): Promise<CatalogProduct[]> {
  // Traemos un resumen compacto: nombre, categoría, precio, imagen, colores
  // No enviamos los 2400 productos enteros — solo los campos esenciales
  // Limitamos a ~300 productos representativos para no saturar el prompt
  const result = await db.execute(sql`
    SELECT 
      p.master_code,
      p.name,
      COALESCE(p.description, '') as description,
      COALESCE(p.category_level1, '') as category_level1,
      COALESCE(p.category_level2, '') as category_level2,
      COALESCE(p.category_level3, '') as category_level3,
      COALESCE(p.main_image, '') as image_url,
      (
        SELECT ROUND(MIN(pr.price::numeric) * 1.4, 2)::text
        FROM product_prices pr 
        WHERE pr.master_code = p.master_code
      ) as price,
      COALESCE(
        (SELECT string_agg(DISTINCT c.description, ', ' ORDER BY c.description)
         FROM product_colors c 
         WHERE c.master_code = p.master_code
         LIMIT 5),
        ''
      ) as colors
    FROM products p
    WHERE p.master_code IS NOT NULL
      AND p.name IS NOT NULL
      AND p.name != ''
    ORDER BY p.master_code
  `);

  return (result.rows || []) as CatalogProduct[];
}

// Versión compacta del catálogo para el prompt (reducir tokens)
function buildCatalogContext(products: CatalogProduct[]): string {
  // Agrupamos por categoría para que la IA entienda la oferta
  const byCategory: Record<string, CatalogProduct[]> = {};

  for (const p of products) {
    const cat = p.category_level1 || "Otros";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p);
  }

  let context = "";
  for (const [cat, prods] of Object.entries(byCategory)) {
    context += `\n## ${cat}\n`;
    for (const p of prods.slice(0, 50)) {
      // Formato ultra-compacto: CODE|nombre|precio|categoría2
      const price = p.price ? `${p.price}€` : "consultar";
      context += `- ${p.master_code} | ${p.name} | ${price} | ${p.category_level2 || ""}\n`;
    }
    if (prods.length > 50) {
      context += `  ... y ${prods.length - 50} productos más en esta categoría\n`;
    }
  }

  return context;
}

// ═══════════════════════════════════════════════════════════════
// 2. CALL OPENAI
// ═══════════════════════════════════════════════════════════════

async function generatePack(
  companyName: string,
  industry: string,
  objective: string,
  catalogContext: string
): Promise<PackResponse> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");

  const systemPrompt = `Eres un experto en merchandising corporativo y regalos de empresa con 15 años de experiencia en fidelización de clientes, employee branding y marketing experiencial.

Tu trabajo: crear packs de merchandising personalizados que sean estratégicos, no genéricos. Cada producto debe tener un "por qué" claro conectado con la empresa, su sector y su objetivo.

CATÁLOGO DISPONIBLE (productos reales de Universo Merchan):
${catalogContext}

REGLAS ESTRICTAS:
1. SOLO puedes recomendar productos que existan en el catálogo anterior. Usa los MASTER_CODES exactos.
2. Elige entre 3 y 5 productos VARIADOS (no 3 bolígrafos — mezcla categorías).
3. Cada producto debe tener una justificación de 1-2 frases conectada con la empresa y su objetivo.
4. Dale al pack un título inspirador y creativo (no genérico como "Pack Corporativo").
5. Los precios son orientativos "desde X€/ud" — el precio final depende de cantidad y marcaje.

FORMATO DE RESPUESTA — Responde EXCLUSIVAMENTE en este JSON (sin markdown, sin backticks, sin texto fuera del JSON):
{
  "title": "Nombre creativo del pack",
  "intro": "Frase de bienvenida personalizada para la empresa (1-2 frases, menciona el nombre de la empresa)",
  "products": [
    {
      "masterCode": "CÓDIGO_EXACTO",
      "name": "Nombre del producto",
      "justification": "Por qué este producto para esta empresa y objetivo"
    }
  ],
  "closing": "Frase de cierre motivadora (1 frase)"
}`;

  const userPrompt = `Crea un pack de merchandising para:
- Empresa: ${companyName}
- Sector: ${industry}
- Objetivo: ${objective}

Elige los productos más estratégicos del catálogo para este perfil.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // Rápido y barato — suficiente para esta tarea
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenAI error:", err);
    throw new Error("OpenAI API error");
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || "";

  // Parse JSON (strip posible markdown wrapping)
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const parsed = JSON.parse(cleaned) as {
    title: string;
    intro: string;
    products: { masterCode: string; name: string; justification: string }[];
    closing: string;
  };

  return parsed as PackResponse;
}

// ═══════════════════════════════════════════════════════════════
// 3. ENRICH PACK WITH REAL DATA (images, prices, URLs)
// ═══════════════════════════════════════════════════════════════

async function enrichPack(
  pack: PackResponse,
  allProducts: CatalogProduct[]
): Promise<PackResponse> {
  const productMap = new Map<string, CatalogProduct>();
  for (const p of allProducts) {
    productMap.set(p.master_code, p);
  }

  const enriched: PackProduct[] = [];

  for (const item of pack.products) {
    const real = productMap.get(item.masterCode);
    if (real) {
      enriched.push({
        masterCode: item.masterCode,
        name: real.name || item.name,
        image: real.image_url || "",
        price: real.price || null,
        url: `/productos/${item.masterCode.toLowerCase()}`,
        justification: item.justification,
      });
    } else {
      // Producto no encontrado — lo incluimos sin imagen
      enriched.push({
        masterCode: item.masterCode,
        name: item.name,
        image: "",
        price: null,
        url: `/productos/${item.masterCode.toLowerCase()}`,
        justification: item.justification,
      });
    }
  }

  return {
    ...pack,
    products: enriched,
  };
}

// ═══════════════════════════════════════════════════════════════
// 4. API ROUTE
// ═══════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, company_name, industry, objective } = body;

    // ─── PACK GENERATION ───
    if (action === "generate_pack") {
      if (!company_name || !industry || !objective) {
        return NextResponse.json(
          { error: "Faltan datos: company_name, industry, objective" },
          { status: 400 }
        );
      }

      // 1. Fetch catalog
      const catalog = await getCatalogSummary();
      if (catalog.length === 0) {
        return NextResponse.json(
          { error: "No se pudo cargar el catálogo" },
          { status: 500 }
        );
      }

      // 2. Build compact context
      const catalogContext = buildCatalogContext(catalog);

      // 3. Generate pack with OpenAI
      const rawPack = await generatePack(company_name, industry, objective, catalogContext);

      // 4. Enrich with real images, prices, URLs
      const enrichedPack = await enrichPack(rawPack, catalog);

      return NextResponse.json({ pack: enrichedPack });
    }

    // ─── REGENERATE (same data, new pack) ───
    if (action === "regenerate_pack") {
      const catalog = await getCatalogSummary();
      const catalogContext = buildCatalogContext(catalog);
      const rawPack = await generatePack(
        company_name || "",
        industry || "",
        objective || "",
        catalogContext
      );
      const enrichedPack = await enrichPack(rawPack, catalog);
      return NextResponse.json({ pack: enrichedPack });
    }

    // ─── SWAP PRODUCT (replace one product) ───
    if (action === "swap_product") {
      const { masterCodeToReplace, currentPack } = body;
      const catalog = await getCatalogSummary();
      const catalogContext = buildCatalogContext(catalog);

      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");

      const currentCodes = (currentPack?.products || []).map((p: any) => p.masterCode);

      const swapPrompt = `El cliente tiene este pack actual: ${currentCodes.join(", ")}
Quiere reemplazar el producto ${masterCodeToReplace}.
La empresa es "${company_name}" del sector "${industry}" con objetivo "${objective}".

CATÁLOGO:
${catalogContext}

Elige UN solo producto alternativo que NO sea ninguno de los actuales (${currentCodes.join(", ")}).
Responde SOLO en JSON:
{"masterCode": "CÓDIGO", "name": "nombre", "justification": "por qué este producto es mejor alternativa"}`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Eres un experto en merchandising corporativo. Responde SOLO en JSON válido sin markdown." },
            { role: "user", content: swapPrompt },
          ],
          temperature: 0.8,
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content || "";
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const newProduct = JSON.parse(cleaned);

      // Enrich
      const realProduct = catalog.find((p) => p.master_code === newProduct.masterCode);
      const enrichedProduct: PackProduct = {
        masterCode: newProduct.masterCode,
        name: realProduct?.name || newProduct.name,
        image: realProduct?.image_url || "",
        price: realProduct?.price || null,
        url: `/productos/${newProduct.masterCode.toLowerCase()}`,
        justification: newProduct.justification,
      };

      return NextResponse.json({ product: enrichedProduct });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
