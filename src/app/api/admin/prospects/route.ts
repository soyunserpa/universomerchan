import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Admin auth check
// import { verifyAuth } from "@/lib/auth-service"; // to be implemented later if strict backend validation is needed

export const maxDuration = 60;

const ProspectEmailSchema = z.object({
  subject: z.string().describe("El asunto del correo, llamativo, corto y personalizado para B2B"),
  htmlBody: z.string().describe("El cuerpo del correo en HTML limpio usando <p>, <strong>, y <br>. Debe usar un tono directo y B2B, sin rodeos."),
});

export async function POST(req: NextRequest) {
  try {
    const { companyName, industry, notes } = await req.json();

    if (!companyName) {
      return NextResponse.json({ error: "El nombre de la empresa es obligatorio." }, { status: 400 });
    }

    const systemPrompt = `
Eres el Director Comercial de "Universo Merchan". Vas a redactar un correo B2B en frío (Cold Outreach) altamente persuasivo, corto y directo.
Reglas Inquebrantables:
1. El correo debe ir dirigido al equipo de compras o marketing de la empresa objetivo.
2. Quien lo firma abajo del todo es "El equipo de Universo Merchan". NO firmes como "Marina".
3. NUNCA ofrezcas "muestras físicas sin coste" o "cosas gratis". Lo único gratuito y alucinante que ofrecemos es crear su "boceto 3D inicial / Auto-Mockup" para que visualicen cómo quedará el logotipo en los productos.
4. Tu objetivo es animarles a solicitarnos una propuesta de merchandising a medida que pueden comprar a precios ultra-competitivos.
5. El tono debe ser profesional, fresco y al grano. Usa formato HTML simple (<p>, <strong>).
`;

    const userPrompt = `
Empresa Objetivo: ${companyName}
Industria de la Empresa: ${industry || "General"}
Notas/Estrategia Específica que incluir en el correo: ${notes || "Preséntate brevemente y ofréceles nuestro catálogo infinito y la creación de un Auto-Mockup de su logotipo gratuito."}

Genera el 'Subject' y el 'htmlBody'.  
`;

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: ProspectEmailSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return NextResponse.json({ success: true, emailDraft: object });
  } catch (error: any) {
    console.error("AI Prospecting Error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno generando la propuesta B2B" },
      { status: 500 }
    );
  }
}
