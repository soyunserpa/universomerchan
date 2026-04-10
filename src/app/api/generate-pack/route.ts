import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { getProductList } from '../../../lib/catalog-api';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { company_name, industry, purpose, objective } = await req.json();

    // Obtener productos aleatorios del catálogo (en el PHP antiguo se cogían de un JSON)
    const res = await getProductList({
      limit: 5,
      sort: 'newest'
    });
    
    const selection = res.products.slice(0, Math.floor(Math.random() * 2) + 4); // 4 a 5 productos
    const productNames = selection.map(p => p.name).join(', ');

    const prompt = `Eres un asesor experto en branding emocional y merchandising corporativo.
Debes crear un pack de regalos corporativos utilizando EXACTAMENTE los siguientes productos reales de nuestro catálogo: ${productNames}.

La empresa cliente se llama ${company_name}, se dedica a ${industry}.
Su propósito o filosofía es: ${purpose}.
El objetivo específico de la campaña o acción es: ${objective}.

Genera una respuesta en Markdown siguiendo este formato estricto:
1. Empieza con un saludo cordial.
2. Dale un "Nombre emocional" potente al Pack que has creado.
3. Enumera cada producto asignado, pero hazlo en una lista donde incluyas una frase que justifique emocional y funcionalmente su elección relacionándola con la filosofía u objetivo. Usa negritas para el nombre del producto.
4. Escribe un párrafo final e inspirador (una Experiencia Integrada) donde narres brevemente un momento de la vida real de la persona que recibirá el pack entero, imaginando cómo todos los productos conectados cumplen el objetivo de la campaña (${objective}).

Mantén un tono empático, B2B, entusiasta y muy profesional.`;

    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt: prompt,
    });

    let markdownOutput = text;
    
    // Adjuntamos un bloque de productos reales y llamadas a la acción al final
    markdownOutput += `\n\n### Productos Seleccionados en tu Pack\n\n`;
    selection.forEach(p => {
      const url = `https://universomerchan.com/product/${p.masterCode}`;
      const img = p.images[0] ? `\n![${p.name}](${p.images[0]})\n` : '';
      markdownOutput += `- **[${p.name}](${url})** *(Ref: ${p.masterCode})* \n`;
    });

    markdownOutput += `\n\n💬 **¿Te encaja o prefieres que ajustemos algo?** Entra a nuestra web o habla con nuestro equipo comercial por WhatsApp para un presupuesto ajustado sin compromiso!`;

    return NextResponse.json({ markdown: markdownOutput });
  } catch (err: any) {
    console.error('Error in generate-pack:', err);
    return NextResponse.json({ error: 'Ha ocurrido un error creando el pack' }, { status: 500 });
  }
}
