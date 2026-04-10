import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { getProductList } from '../../../lib/catalog-api';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * Selecciona productos variados: máximo 1 por categoría, priorizando los que tienen imagen.
 */
function selectDiverseProducts(
  products: Array<{ mainImage: string; category: string; [key: string]: any }>,
  count: number
) {
  const selected: typeof products = [];
  const usedCategories = new Set<string>();

  // Primera pasada: 1 producto con imagen por categoría
  for (const p of products) {
    if (selected.length >= count) break;
    if (!usedCategories.has(p.category) && p.mainImage) {
      selected.push(p);
      usedCategories.add(p.category);
    }
  }

  // Segunda pasada: rellenar con productos de categorías ya usadas (si faltan)
  if (selected.length < count) {
    for (const p of products) {
      if (selected.length >= count) break;
      if (!selected.includes(p) && p.mainImage) {
        selected.push(p);
      }
    }
  }

  // Tercera pasada: sin imagen si aún faltan
  if (selected.length < count) {
    for (const p of products) {
      if (selected.length >= count) break;
      if (!selected.includes(p)) {
        selected.push(p);
      }
    }
  }

  return selected;
}

export async function POST(req: Request) {
  try {
    const { company_name, industry, objective } = await req.json();

    // --- SYSTEM-FIRST: buscar productos variados ---
    // Traer bastantes para poder diversificar por categoría
    let products = (await getProductList({ search: `${industry} ${objective}`.trim(), limit: 25, sort: 'newest' })).products;

    if (products.length < 8) {
      const more = (await getProductList({ search: industry, limit: 25, sort: 'newest' })).products;
      const ids = new Set(products.map(p => p.masterCode));
      products = [...products, ...more.filter(p => !ids.has(p.masterCode))];
    }

    if (products.length < 8) {
      const more = (await getProductList({ limit: 25, sort: 'stock' })).products;
      const ids = new Set(products.map(p => p.masterCode));
      products = [...products, ...more.filter(p => !ids.has(p.masterCode))];
    }

    // Seleccionar 4-5 productos DIVERSOS (máx 1 por categoría)
    const selection = selectDiverseProducts(products, 5);

    // --- AI: generar justificaciones por producto en JSON ---
    const productList = selection.map((p, i) =>
      `${i + 1}. "${p.name}" (categoría: ${p.category})`
    ).join('\n');

    const prompt = `Genera un pack de regalos corporativos en JSON.

PRODUCTOS (usa EXACTAMENTE estos nombres):
${productList}

CLIENTE: ${company_name} | SECTOR: ${industry} | OBJETIVO: ${objective}

Responde SOLO un JSON válido (sin markdown, sin backticks):
{
  "packName": "Nombre emocional del pack",
  "greeting": "Saludo breve al cliente (1 línea)",
  "products": [
    { "index": 1, "justification": "Frase breve justificando este producto para el objetivo" },
    ...
  ],
  "closing": "Párrafo final inspirador (máx 2 líneas)"
}

REGLAS: Usa SOLO los productos listados. No inventes otros. Máximo 30 palabras por justificación. Tono empático, B2B, profesional.`;

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
    });

    // Parsear respuesta de la IA
    let aiData: {
      packName: string;
      greeting: string;
      products: Array<{ index: number; justification: string }>;
      closing: string;
    };

    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiData = JSON.parse(cleaned);
    } catch {
      // Fallback si el JSON falla
      aiData = {
        packName: 'Pack Personalizado',
        greeting: `¡Hola equipo de ${company_name}!`,
        products: selection.map((_, i) => ({ index: i + 1, justification: 'Seleccionado especialmente para tu campaña.' })),
        closing: 'Esperamos que este pack os ayude a alcanzar vuestros objetivos.',
      };
    }

    // --- CONSTRUIR MARKDOWN con productos integrados en la narrativa ---
    let md = `### 🎁 ${aiData.packName}\n\n`;
    md += `${aiData.greeting}\n\n`;

    selection.forEach((p, i) => {
      const url = `https://universomerchan.com/product/${p.masterCode}`;
      const img = p.mainImage;
      const justification = aiData.products[i]?.justification || '';
      // startingPrice ya incluye "€" (ej: "11.91€")
      const price = p.startingPrice ? `desde ~${p.startingPrice}/ud` : '';

      if (img) {
        md += `[![${p.name}](${img})](${url})\n\n`;
      }
      md += `**[${p.name}](${url})**`;
      if (price) md += ` — *${price}*`;
      md += `\n\n`;
      if (justification) md += `${justification}\n\n`;
      md += `---\n\n`;
    });

    md += `${aiData.closing}\n\n`;
    md += `💬 **¿Te encaja o prefieres que ajustemos algo?** Habla con nuestro equipo por [WhatsApp](https://api.whatsapp.com/send/?phone=34614446640&text&type=phone_number&app_absent=0) para un presupuesto sin compromiso.`;

    return NextResponse.json({ markdown: md });
  } catch (err: any) {
    console.error('Error in generate-pack:', err);
    return NextResponse.json({ error: 'Ha ocurrido un error creando el pack' }, { status: 500 });
  }
}
