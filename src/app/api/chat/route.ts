import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getProductList } from '../../../lib/catalog-api';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const systemPrompt = `
  Eres el Asistente de Inteligencia Artificial de Universo Merchan, expertos en merchandising corporativo y B2B.
  Tu objetivo es ayudar a los clientes a encontrar productos promocionales para sus campañas, recomendarles opciones basadas en sus necesidades de presupuesto e indicarles los precios.
  
  Tienes disponible una herramienta (Tool) llamada 'searchCatalog' que puedes usar para buscar en nuestra base de datos real.
  Siempre que un cliente pida recomendaciones, USA LA HERRAMIENTA para buscar y no te inventes productos.
  
  TUS RESPUESTAS ESTARÁN EN FORMATO MARKDOWN.
  En particular, cuando expongas productos, no escupas un JSON, decóralos visualmente usando Markdown (negritas, cursivas).
  Si la herramienta te devuelve precios 'priceFrom', asume que ese es el precio aproximado por unidad con 1 color o precio base, pero SIEMPRE añade este matiz: "aproximadamente desde X€/ud (este precio puede variar según las cantidades y colores de logotipo que necesites)".
  
  NUNCA des precios definitivos porque todos dependen del presupuesto a medida que hace el comercial.
  Tu tono tiene que ser amable, enfocado a B2B (empresas), persuasivo y servicial.
  Añade emojis pertinentes a tu texto.
  
  Si el cliente ya parece decidido o ha explorado suficientes opciones, recomiéndale encarecidamente que hable con un asesor por WhatsApp para que le pase una oferta formal e instantánea gratis, invitándole a pulsar el botón flotante de WhatsApp que encontrará en la propia web o dándole este enlace de forma clara en Markdown: [Hablar con Asesor en WhatsApp](https://api.whatsapp.com/send/?phone=34614446640&text&type=phone_number&app_absent=0).
  `;

  const result = await streamText({
    model: openai('gpt-4o', { structuredOutputs: false }), // Fix OpenAI strict schema format error
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
