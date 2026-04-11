import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getProductList } from '../../../lib/catalog-api';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const systemPrompt = `Eres el Asistente IA de Universo Merchan, expertos en merchandising corporativo B2B.
Ayudas a encontrar productos promocionales y recomendar opciones según presupuesto.
Si el usuario te ha rellenado un cuestionario para un 'pack corporativo', crea el pack completo eligiendo los mejores productos basándote en la información que buscaste.

REGLAS GLOBALES:
- USA SIEMPRE la herramienta 'searchCatalog' para buscar productos reales. NUNCA inventes productos por tu cuenta.
- Cuando crees un pack o recomiendes, elige artículos VARIADOS (no recomiendes 4 libretas seguidas ni 4 prendas de ropa, mézclalo: 1 taza, 1 cuaderno, 1 bolsa, etc).
- Responde siempre en Markdown. Para cada producto muestra PRIMERO su imagen y link así: [![Nombre](image_url)](url) seguido de **[Nombre](url)** — *~precio€/ud*. Nunca JSON crudo.
- Precios: "desde ~X€/ud (varía según cantidades y personalización)". Nunca des precios definitivos sin consultarlo.
- Tono: amable, B2B, persuasivo. Usa emojis relevantes.
- Si el cliente rechaza algún artículo (ej "no me des ropa"), vuelve a buscar en el catálogo excluyendo lo que no quiso y genérale un pack completamente nuevo con lo que encuentre.
- Si el cliente parece decidido, recomienda hablar con asesor: [WhatsApp](https://api.whatsapp.com/send/?phone=34614446640&text&type=phone_number&app_absent=0).
- Sé conciso y visualmente atractivo.`;

  const result = await streamText({
    model: openai('gpt-4o-mini'), // Optimizar tokens: el sistema busca primero, la IA solo presenta
    system: systemPrompt,
    messages,
    tools: {
      searchCatalog: tool({
        inputSchema: z.object({
          query: z.string().describe('Término o frase de búsqueda, ej. "Mochilas ecológicas", "Bolígrafos", "Ideas para oficina". Si el usuario no pide nada en particular pero debes buscar, usa "general" o un sinónimo representativo.'),
        }),
        // @ts-ignore
        execute: async (args: any) => {
          const { query } = args;
          // LLamada interna a la BD con los helper functions de catálogo
          // Devolvemos 15 para darle libertad a la IA de elegir los mejores y más variados.
          const res = await getProductList({
            search: query !== "general" ? query : undefined,
            limit: 15,
            sort: 'newest'
          });
          
          return res.products.map(p => ({
            id: p.masterCode,
            name: p.name,
            priceFrom: p.startingPrice || 'Bajo consulta',
            image: p.mainImage || '',
            colors: p.variants.length > 0 ? Array.from(new Set(p.variants.map(v => v.color))).join(', ') : 'Varios',
            url: `https://universomerchan.com/product/${p.masterCode}`
          }));
        },
      }),
    },
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
