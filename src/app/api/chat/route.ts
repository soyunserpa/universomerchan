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

REGLAS:
- USA SIEMPRE la herramienta 'searchCatalog' para buscar productos reales. No inventes productos.
- Responde en Markdown. Presenta productos con negritas/cursivas, nunca JSON crudo.
- Precios: "desde ~X€/ud (varía según cantidades y personalización)". Nunca des precios definitivos.
- Tono: amable, B2B, persuasivo. Usa emojis relevantes.
- Si el cliente parece decidido, recomienda hablar con asesor: [WhatsApp](https://api.whatsapp.com/send/?phone=34614446640&text&type=phone_number&app_absent=0).
- Sé conciso. Respuestas cortas y útiles.`;

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
          // Usamos `limit: 5` para que la respuesta de búsqueda sea rápida y el contexto de LLM no reviente.
          const res = await getProductList({
            search: query !== "general" ? query : undefined,
            limit: 5,
            sort: 'newest'
          });
          
          return res.products.map(p => ({
            id: p.masterCode,
            name: p.name,
            priceFrom: p.startingPrice || 'Bajo consulta',
            colors: p.variants.length > 0 ? Array.from(new Set(p.variants.map(v => v.color))).join(', ') : 'Varios',
            url: `https://universomerchan.com/product/${p.masterCode}`
          }));
        },
      }),
    },
    maxSteps: 5,
  });

  return result.toUIMessageStreamResponse();
}
