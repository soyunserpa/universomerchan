import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { getProductList } from '../../../lib/catalog-api';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { company_name, industry, objective } = await req.json();

    // --- SYSTEM-FIRST: buscar productos relevantes por industria + objetivo ---
    const searchTerms = `${industry} ${objective}`.trim();

    // Intentar búsqueda relevante, luego fallbacks progresivos
    let products = (await getProductList({ search: searchTerms, limit: 10, sort: 'newest' })).products;

    if (products.length < 4) {
      products = (await getProductList({ search: industry, limit: 10, sort: 'newest' })).products;
    }

    if (products.length < 4) {
      products = (await getProductList({ limit: 10, sort: 'newest' })).products;
    }

    // Priorizar productos con imagen
    const withImage = products.filter(p => p.mainImage);
    const withoutImage = products.filter(p => !p.mainImage);
    const sorted = [...withImage, ...withoutImage];

    // Seleccionar 4-5 productos
    const selection = sorted.slice(0, Math.min(5, Math.max(4, sorted.length)));

    // --- PRODUCTOS PRIMERO: tarjetas visuales con imagen, nombre, precio y link ---
    let markdownOutput = '';
    selection.forEach(p => {
      const url = `https://universomerchan.com/product/${p.masterCode}`;
      const img = p.mainImage;
      if (img) {
        markdownOutput += `[![${p.name}](${img})](${url})\n\n`;
      }
      markdownOutput += `**[${p.name}](${url})** — *desde ~${p.startingPrice ?? 'consultar'}€/ud*\n\n---\n\n`;
    });

    // --- AI-SECOND: narrativa emocional SOLO con los nombres reales ---
    const productList = selection.map((p, i) => `${i + 1}. "${p.name}"`).join('\n');

    const prompt = `Crea una narrativa para un pack de regalos corporativos.

PRODUCTOS DEL PACK (usa EXACTAMENTE estos nombres, NO inventes otros):
${productList}

CLIENTE: ${company_name} | SECTOR: ${industry} | OBJETIVO: ${objective}

FORMATO (Markdown):
1. Saludo breve al cliente por nombre de empresa
2. Nombre emocional del Pack (inventado por ti)
3. Para CADA producto de la lista anterior, una frase breve justificando su elección para el objetivo
4. Párrafo final inspirador (máx 3 líneas)

IMPORTANTE: Usa SOLO los productos listados arriba. No añadas ni inventes productos. Máximo 250 palabras. Tono empático, B2B, profesional.`;

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
    });

    markdownOutput += `\n${text}`;

    markdownOutput += `\n\n💬 **¿Te encaja o prefieres que ajustemos algo?** Habla con nuestro equipo por [WhatsApp](https://api.whatsapp.com/send/?phone=34614446640&text&type=phone_number&app_absent=0) para un presupuesto sin compromiso.`;

    return NextResponse.json({ markdown: markdownOutput });
  } catch (err: any) {
    console.error('Error in generate-pack:', err);
    return NextResponse.json({ error: 'Ha ocurrido un error creando el pack' }, { status: 500 });
  }
}
