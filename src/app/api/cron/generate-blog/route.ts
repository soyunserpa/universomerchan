import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { db } from "@/lib/database";
import { blogPosts, products } from "@/lib/schema";
import { uploadArtwork } from "@/lib/artwork-upload";
import { notifyAdminSystemAlert } from "@/lib/email-service";
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

    const strategies = [
      {
        type: "Guía de Compra",
        topics: [
          "Cómo elegir el mejor regalo corporativo según tu presupuesto",
          "Guía de botellas personalizadas: materiales y precios",
          "Regalos para clientes VIP: ideas premium",
          "Regalos empresa por menos de 3€ que no parecen baratos",
          "Guía de tazas personalizadas para empresas"
        ],
        prompt: `Escribe una guía de compra de [TEMA] para empresas españolas que buscan merchandising personalizado. Estructura exacta: 1. Título H1 con keyword (máx 65 char), 2. Intro de 100 palabras: problema + para quién es esta guía, 3. H2: Qué mirar antes de comprar, 4. H2: Comparativa de opciones, 5. H2: Recomendación según tipo de empresa/evento, 6. H2: Preguntas frecuentes (3-4), 7. CTA final. Tono profesional, directo, sin frases vacías y con precios orientativos reales.`
      },
      {
        type: "Comparativa Técnica",
        topics: [
          "Serigrafía vs grabado láser vs DTF vs sublimación",
          "Acero inoxidable vs vidrio vs bambú para botellas",
          "Algodón orgánico vs RPET vs yute para bolsas",
          "Cerámica vs vidrio vs acero para tazas"
        ],
        prompt: `Escribe una comparativa técnica entre [TEMA] para merchandising corporativo en España. Estructura: 1. Título H1 formato '[A] vs [B]: guía', 2. Intro breve, 3. Tabla comparativa HTML con 5 criterios, 4. H2 detalle de cada opción, 5. H2 'Cuándo elegir cada una', 6. CTA final. Precios reales en euros, tono directo.`
      },
      {
        type: "Checklist / How-To",
        topics: [
          "Checklist: cómo preparar el merchandising para una feria",
          "Cómo hacer tu primer pedido de merchandising personalizado",
          "Cómo calcular el coste real de un regalo corporativo",
          "7 errores al pedir merchandising por primera vez"
        ],
        prompt: `Escribe un artículo práctico tipo checklist sobre [TEMA] para responsables de RRHH o compras. Estructura: 1. Título práctico H1, 2. Intro del problema, 3. Checklist de 6-10 pasos numerados, 4. Sección de 3-5 errores comunes, 5. CTA final. Tono directo, sin relleno, aportando valor práctico.`
      },
      {
        type: "Caso de Uso por Sector",
        topics: [
          "Merchandising para gimnasios y centros fitness",
          "Regalos corporativos para empresas tech y startups",
          "Merchandising para el sector educativo",
          "Regalos empresa para el sector salud y farmacéutico"
        ],
        prompt: `Escribe un artículo sobre cómo el sector de [TEMA] puede usar merchandising. Estructura: 1. Título H1 'Merchandising para [sector]: X ideas', 2. Intro del contexto, 3. 4-5 ideas de productos concretos con link, 4. Ejemplo práctico realista (sin inventar marcas), 5. CTA a landing. Sin emojis ni relleno.`
      },
      {
        type: "FAQ / Educativo corto",
        topics: [
          "¿Cuál es la cantidad mínima para personalizar productos?",
          "¿Cuánto tarda un pedido de merchandising personalizado?",
          "¿Qué diferencia hay entre serigrafía y tampografía?",
          "¿Se puede personalizar con colores Pantone exactos?"
        ],
        prompt: `Responde la pregunta «[TEMA]» para alguien que busca merchandising en España. Estructura: 1. H1: la pregunta exacta, 2. Respuesta directa en 2 frases, 3. Explicación detallada, 4. Ejemplo práctico, 5. CTA breve. Al grano y muy útil.`
      }
    ];

    const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];
    const randomTopic = randomStrategy.topics[Math.floor(Math.random() * randomStrategy.topics.length)];
    const specificPrompt = randomStrategy.prompt.replace("[TEMA]", randomTopic);

    console.log(`[Blog Cron] Iniciando estrategia: ${randomStrategy.type} | Tema: ${randomTopic}`);

    let productContext = "";
    try {
      const dbProducts = await db.select({
        masterCode: products.masterCode,
        productName: products.productName
      }).from(products).limit(300);
      
      const shuffled = dbProducts.sort(() => 0.5 - Math.random()).slice(0, 3);
      if (shuffled.length > 0) {
        productContext = `\n\nPRODUCTOS DESTACADOS (OBLIGATORIO):
Encuentra una forma natural de mencionar y enlazar al menos 1 o 2 de los siguientes productos TOP VENTAS de nuestro catálogo. Usa la URL exacta proporcionada en el href del tag <a>:
${shuffled.map(p => `- ${p.productName} -> URL: https://universomerchan.com/product/${p.masterCode}`).join('\n')}`;
      }
    } catch (err) {
      console.error("[Blog Cron] No se pudieron cargar productos para el contexto", err);
    }

    // ======================================
    // 0. COMPROBAR CADUCIDAD DE TOKEN LINKEDIN
    // ======================================
    try {
      const EXPIRATION_DATE = new Date("2027-04-12T00:00:00Z"); // Token generado el 12 de Abril de 2026
      const today = new Date();
      const diffTime = EXPIRATION_DATE.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      // Si quedan 15 días o menos, o ya ha caducado, enviar alerta (sólo una vez al día porque es un cron diario)
      if (diffDays <= 15 && diffDays > -5) {
        await notifyAdminSystemAlert({
          subject: diffDays <= 0 ? "¡URGENTE! El Token de LinkedIn ha CADUCADO" : `El Token de LinkedIn caduca en ${diffDays} días`,
          message: `El token de autenticación configurado para publicar en LinkedIn caduca el 12 de Abril de 2027. Por favor, genera un nuevo Token entrando en el portal de LinkedIn Developers (https://www.linkedin.com/developers/tools/oauth/token-generator) y actualízalo en el servidor.`,
          alertLevel: diffDays <= 3 ? "CRITICAL" : "WARNING"
        });
        console.log(`[Blog Cron] Alerta de caducidad de token enviada. Quedan ${diffDays} días.`);
      }
    } catch (e) {
      console.error("[Blog Cron] Error comprobando caducidad de token", e);
    }

    // ======================================
    // 1. GENERAR TEXTO CON GPT-4o
    // ======================================
    console.log(`[Blog Cron] Llamando a OpenAI GPT-4o...`);
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Eres el creador principal de contenido experto en SEO y B2B para 'Universo Merchan', tienda de merchandising en España.
REGLAS DE ORO:
- Tono profesional pero directo. Escribe como alguien del sector.
- PROHIBIDOS los emojis en el artículo del blog. Prohibidas frases vacías como "¡tu marca merece lo mejor!".
- Nunca empieces con frases genéricas como "En el mundo actual...".
- Usa "tú", no "usted". Máximo 1 exclamación por artículo.
- Integra mínimo 3 hipervínculos internamente a categorías en el HTML simulado de manera natural y no forzada.

Estructura tu respuesta SÓLO como un archivo JSON puro, sin backticks:
{
  "title": "Título con keyword (máx. 65 caracteres)",
  "metaDescription": "Metadescripción con CTA (máx. 155 caracteres)",
  "excerpt": "Párrafo breve introductorio.",
  "linkedinPost": "Un micro-post B2B para LinkedIn: 1) Hook inicial sin emoji, 2) Cuerpo aportando valor real, 3) 3 hashtags del sector.",
  "linkedinComment": "Texto simple exacto: 'La guía completa la tienes aquí: [enlace]'.",
  "imagePrompt": "Un prompt en inglés descriptivo ultra-detallado para DALL-E 3 que genere la imagen corporativa fotorealista perfecta para el artículo. (Sin texto)",
  "body": "El artículo en HTML semántico (<h2>, <p>, <ul>, <strong>). Siguiendo las instrucciones de estructura exactas pedidas por el usuario. Directamente los elementos interiores sin html ni body."
}`
        },
        {
          role: "user",
          content: specificPrompt + productContext
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
        let isPerson = false;
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
            isPerson = true;
            console.log(`[Blog Cron] Publicando como Persona: ${authorUrn}`);
          }
        }

        if (authorUrn) {
          const absoluteUrl = `https://universomerchan.com/blog/${newPost.slug}`;
          
          // --- STEP 1: Register Image Upload ---
          console.log(`[Blog Cron] Registrando imagen en LinkedIn...`);
          const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "X-Restli-Protocol-Version": "2.0.0",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              registerUploadRequest: {
                recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
                owner: authorUrn,
                serviceRelationships: [
                  { identifier: "urn:li:userGeneratedContent", relationshipType: "OWNER" }
                ]
              }
            })
          });
          
          if (!registerRes.ok) {
            throw new Error(`Failed to register image: ${await registerRes.text()}`);
          }
          
          const registerData = await registerRes.json();
          const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
          const assetUrn = registerData.value.asset;
          
          // --- STEP 2: Upload Image Binary ---
          console.log(`[Blog Cron] Subiendo binario de imagen a LinkedIn...`);
          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
               "Authorization": `Bearer ${token}`,
               "Content-Type": "image/png" // the image uploaded is an ai-generated png from buffer
            },
            body: buffer
          });
          
          if (!uploadRes.ok) {
            throw new Error(`Failed to upload image binary: ${await uploadRes.text()}`);
          }
          console.log(`[Blog Cron] Imagen subida a LinkedIn correctamente: ${assetUrn}`);

          // --- STEP 3: Create Post ---
          let postText = articleData.linkedinPost || `Nuevo artículo en el blog.`;
          // The user specifically wants the text string in the post, and because of 403 Forbidden errors with socialActions API, we also explicitly inject the link as fallback.
          postText = `\${postText}\n\n👇 Enlace de la entrada completa en el primer comentario (o aquí debajo):\n🔗 \${absoluteUrl}`;
          
          const linkedinPayload = {
            author: authorUrn,
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: { text: postText },
                shareMediaCategory: "IMAGE",
                media: [
                  {
                    status: "READY",
                    description: { text: articleData.metaDescription },
                    title: { text: articleData.title },
                    media: assetUrn
                  }
                ]
              }
            },
            visibility: {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
          };

          const linkedinPostRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "X-Restli-Protocol-Version": "2.0.0",
              "Content-Type": "application/json"
            },
            body: JSON.stringify(linkedinPayload)
          });

          if (linkedinPostRes.ok) {
            const data = await linkedinPostRes.json();
            const createdUgUrn = data.id; 
            console.log(`[Blog Cron] LinkedIn postiado con éxito: ${createdUgUrn}`);
            
            // --- STEP 4: Add Comment with Link ---
            console.log(`[Blog Cron] Añadiendo primer comentario con el enlace...`);
            let commentText = articleData.linkedinComment || `La guía completa la tienes aquí: [enlace]`;
            commentText = commentText.replace(/\[enlace\]/gi, absoluteUrl);
            
            const commentPayload = {
               actor: authorUrn,
               object: createdUgUrn,
               message: { text: commentText }
            };
            
            const commentRes = await fetch(`https://api.linkedin.com/rest/socialActions/${encodeURIComponent(createdUgUrn)}/comments`, {
               method: "POST",
               headers: {
                  "Authorization": `Bearer ${token}`,
                  "LinkedIn-Version": "202604", 
                  "X-Restli-Protocol-Version": "2.0.0",
                  "Content-Type": "application/json"
               },
               body: JSON.stringify(commentPayload)
            });
            
            if (commentRes.ok) {
               console.log(`[Blog Cron] Comentario añadido correctamente.`);
               linkedinStatus = `Success Post & Comment (URN: ${createdUgUrn})`;
            } else {
               const errText = await commentRes.text();
               console.error(`[Blog Cron] Fallo al añadir comentario:`, errText);
               linkedinStatus = `Success Post (URN: ${createdUgUrn}) but Comment Failed: ${commentRes.status}`;
            }

          } else {
            const errBody = await linkedinPostRes.text();
            linkedinStatus = `API Error: ${linkedinPostRes.status}`;
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
