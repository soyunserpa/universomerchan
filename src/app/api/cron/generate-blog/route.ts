import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { db } from "@/lib/database";
import { blogPosts } from "@/lib/schema";
import { uploadArtwork } from "@/lib/artwork-upload";
import { revalidatePath } from "next/cache";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Ensure the endpoint doesn't timeout if it executes a heavy GPT-4 + DallE task.
// Next.js config allows increasing serverless timeout up to 60s/300s max usually (if properly set).
export const maxDuration = 120; // 2 minutes should be plenty for GPT+DALL-E

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const url = new URL(req.url);
    const searchSecret = url.searchParams.get("secret");

    const cronSecret = process.env.CRON_SECRET || "universomerchancron!123";

    if (authHeader !== `Bearer ${cronSecret}` && searchSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in environment variables" }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const categories = [
      "Regalos Corporativos",
      "Merchandising Sostenible (Eco)",
      "Bienestar del Empleado (Welcome Packs)",
      "Retención de talento con Merchandising",
      "Tendencias de Merchandising 2024",
      "Regalos para fidelizar Clientes"
    ];
    
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    console.log(`[Blog Cron] Iniciando generación automática. Categoría elegida: ${randomCategory}`);

    // ======================================
    // 1. GENERAR TEXTO CON GPT-4o
    // ======================================
    console.log(`[Blog Cron] Llamando a OpenAI GPT-4o...`);
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Eres el creador principal de contenido para 'Universo Merchan', una de las principales tiendas online B2B en España que vende regalos corporativos personalizados y merchandising para empresas. 

Tu tono debe ser profesional pero cercano, enfocado 50% en ser un 'blog informativo B2B' y 50% en 'Catálogo/Venta B2B'. Escribe con fluidez en español de España. Tus artículos deben ayudar a las empresas a tomar decisiones sobre sus campañas promocionales, fidelización de clientes o retención de empleados mediante el uso de tus productos.

Estructura tu respuesta exactamente como un archivo JSON con los siguientes campos sin usar backticks extra en la salida (debes responder SÓLO JSON puro):
{
  "title": "Un título pegadizo para el artículo (máx. 65 caracteres)",
  "metaDescription": "Metadescripción apta para SEO (máx. 155 caracteres)",
  "excerpt": "Un breve párrafo resumen para mostrar en el catálogo del blog",
  "linkedinPost": "Un micro-post brutal y viral para publicar en LinkedIn con emojis y hashtags B2B (máximo 1200 caracteres, con un final de 'Lee el artículo completo en nuestro blog').",
  "imagePrompt": "Un prompt en inglés descriptivo ultra-detallado para DALL-E 3 que genere la imagen perfecta para acompañar el artículo (sin texto en la imagen, estilo foto de estudio, alta calidad, fotorealista, producto corporativo)",
  "body": "El artículo en MERO CÓDIGO HTML semántico (usando <h2>, <h3>, <p>, <ul>, <strong>). No incluyas tags <html>, <head> o <body>, solo el interior (empezando directamente desde tu primer <p> introductorio). Evita estilos en línea, usa puros tags estructurales y cuida el SEO (palabras clave)."
}`
        },
        {
          role: "user",
          content: `Genera un post extenso e interesante alrededor del nicho: '${randomCategory}'. Crea un artículo de valor para empresas españolas.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const rawJson = chatResponse.choices[0].message.content;
    if (!rawJson) throw new Error("No response from GPT-4o");
    
    const articleData = JSON.parse(rawJson);

    // ======================================
    // 2. GENERAR IMAGEN CON DALL-E 3
    // ======================================
    console.log(`[Blog Cron] Llamando a DALL-E 3 para la imagen... Prompt: ${articleData.imagePrompt.substring(0, 50)}...`);
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: articleData.imagePrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });

    const dallEUrl = imageResponse.data[0].url;
    if (!dallEUrl) throw new Error("No URL returned from DALL-E 3");

    // ======================================
    // 3. DESCARGAR Y GUARDAR IMAGEN EN SERVIDOR
    // ======================================
    console.log(`[Blog Cron] Descargando imagen...`);
    const imageFetch = await fetch(dallEUrl);
    const arrayBuffer = await imageFetch.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // We use your local uploadArtwork utility
    const uploadRes = await uploadArtwork(
      buffer,
      `ai-blog-${Date.now()}.png`,
      "image/png",
      -1, // System UID
      "blog-portadas"
    );

    let featuredImageUrl = "";
    if (uploadRes.success && uploadRes.fileUrl) {
      featuredImageUrl = uploadRes.fileUrl;
      console.log(`[Blog Cron] Imagen guardada en: ${featuredImageUrl}`);
    } else {
      console.warn(`[Blog Cron] Fallo al guardar la imagen de forma permanente, usando temporal URL. Error: ${uploadRes.error}`);
      featuredImageUrl = dallEUrl; // fallback
    }

    // ======================================
    // 4. GUARDAR EN BASE DE DATOS
    // ======================================
    const baseSlug = generateSlug(articleData.title);
    const uniqueSlug = `${baseSlug}-${Math.floor(Math.random() * 100)}`;

    console.log(`[Blog Cron] Guardando post en BD. Título: ${articleData.title}`);
    const [newPost] = await db.insert(blogPosts).values({
      title: articleData.title,
      slug: uniqueSlug,
      excerpt: articleData.excerpt,
      body: articleData.body,
      featuredImageUrl: featuredImageUrl,
      metaTitle: articleData.title,
      metaDescription: articleData.metaDescription,
      authorName: "Equipo Universo Merchan",
      isPublished: true,
      publishedAt: new Date(),
    }).returning();

    // ======================================
    // 5. CACHE INVALIDATION
    // ======================================
    revalidatePath("/blog", "layout");
    revalidatePath("/", "layout"); // Home (if recent posts shown)

    console.log(`[Blog Cron] Éxito. Post insertado ID: ${newPost.id}`);
    
    // ======================================
    // 6. PUBLICAR EN LINKEDIN
    // ======================================
    let linkedinStatus = "Skipped (No Token Configured)";
    if (process.env.LINKEDIN_ACCESS_TOKEN) {
      console.log(`[Blog Cron] Token de LinkedIn detectado. Preparando envío...`);
      try {
        const token = process.env.LINKEDIN_ACCESS_TOKEN;
        
        // 1. Obtener la Identidad del Autor (Member o Company)
        let authorUrn = "";
        if (process.env.LINKEDIN_ORGANIZATION_ID) {
          authorUrn = `urn:li:organization:${process.env.LINKEDIN_ORGANIZATION_ID}`;
          console.log(`[Blog Cron] Publicando como Empresa: ${authorUrn}`);
        } else {
          // Si no hay ID de empresa, leemos de quién es el token personal
          const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const meData = await meRes.json();
          if (meData.sub) {
            authorUrn = `urn:li:person:${meData.sub}`;
            console.log(`[Blog Cron] Publicando como Persona: ${authorUrn}`);
          }
        }

        if (authorUrn) {
          const absoluteUrl = `https://universomerchan.com/blog/${newPost.slug}`;
          
          const linkedinPayload = {
            author: authorUrn,
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                  text: articleData.linkedinPost || `¡Nuevo artículo en el blog! ${articleData.title}`
                },
                shareMediaCategory: "ARTICLE",
                media: [
                  {
                    status: "READY",
                    description: { text: articleData.metaDescription },
                    originalUrl: absoluteUrl,
                    title: { text: articleData.title }
                  }
                ]
              }
            },
            visibility: {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
          };

          const linkedinRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "X-Restli-Protocol-Version": "2.0.0",
              "Content-Type": "application/json"
            },
            body: JSON.stringify(linkedinPayload)
          });

          if (linkedinRes.ok) {
            const data = await linkedinRes.json();
            linkedinStatus = `Success (URN: ${data.id})`;
            console.log(`[Blog Cron] LinkedIn postiado con éxito: ${data.id}`);
          } else {
            const errBody = await linkedinRes.text();
            linkedinStatus = `API Error: ${linkedinRes.status}`;
            console.error(`[Blog Cron] Error de LinkedIn API:`, errBody);
          }
        } else {
          linkedinStatus = "Failed to determine Author URN";
        }
      } catch (liErr: any) {
        linkedinStatus = `Error: ${liErr.message}`;
        console.error(`[Blog Cron] Excepción en LinkedIn Post:`, liErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Daily AI Blog Generated",
      post: {
        id: newPost.id,
        title: newPost.title,
        slug: newPost.slug
      },
      linkedin: linkedinStatus
    });

  } catch (error: any) {
    console.error(`[Blog Cron] Error:`, error.message);
    return NextResponse.json({ error: "Failed to generate AI blog", details: error.message }, { status: 500 });
  }
}
