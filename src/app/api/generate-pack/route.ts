import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { getProductList } from '../../../lib/catalog-api';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { company_name, industry, objective } = await req.json();

    // --- SYSTEM-FIRST: buscar productos relevantes por industria + objetivo ---
    // Construir query de búsqueda combinando industria y objetivo del cliente
    const searchTerms = `${industry} ${objective}`.trim();

    // Buscar productos relevantes al contexto del cliente (sistema primero)
    const res = await getProductList({
      search: searchTerms,
      limit: 8,
      sort: 'newest'
    });

    // Si no hay resultados relevantes, hacer búsqueda más genérica
    let products = res.products;
    if (products.length < 4) {
      const fallback = await getProductList({
        search: industry,
        limit: 8,
        sort: 'newest'
      });
      products = fallback.products;
    }

    // Seleccionar 4-5 productos del resultado
    const selection = products.slice(0, Math.min(5, Math.max(4, products.length)));

    // Preparar contexto de productos compacto (optimizar tokens)
    const productContext = selection.map(p => (
      `- ${p.name} (Ref: ${p.masterCode}, ~${p.startingPrice ?? 'consultar'}€/ud)`
    )).join('\n');

    // --- AI-SECOND: prompt enfocado solo en la narrativa emocional ---
    const prompt = `Crea un pack de regalos corporativos con estos productos reales:
${productContext}

Cliente: ${company_name} | Sector: ${industry} | Objetivo: ${objective}

Responde en Markdown:
1. Saludo breve
2. Nombre emocional del Pack
3. Lista de cada producto con una frase que justifique su elección para el objetivo
4. Párrafo inspirador narrando cómo el pack cumple el objetivo

Tono: empático, B2B, profesional. Máximo 300 palabras.`;

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
    });

    let markdownOutput = text;

    // Adjuntar bloque de productos reales con enlaces
    markdownOutput += `\n\n### 🎁 Productos Seleccionados\n\n`;
    selection.forEach(p => {
      const url = `https://universomerchan.com/product/${p.masterCode}`;
      markdownOutput += `- **[${p.name}](${url})** *(Ref: ${p.masterCode})*\n`;
    });

    markdownOutput += `\n\n💬 **¿Te encaja o prefieres que ajustemos algo?** Habla con nuestro equipo por [WhatsApp](https://api.whatsapp.com/send/?phone=34614446640&text&type=phone_number&app_absent=0) para un presupuesto sin compromiso.`;

    return NextResponse.json({ markdown: markdownOutput });
  } catch (err: any) {
    console.error('Error in generate-pack:', err);
    return NextResponse.json({ error: 'Ha ocurrido un error creando el pack' }, { status: 500 });
  }
}
