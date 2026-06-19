import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { db } from "@/lib/database";
import { blogPosts, products } from "@/lib/schema";
import { eq } from "drizzle-orm";
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

    const cronSecret = process.env.CRON_SECRET || "***REMOVED***";

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
          "¿Cómo elegir el mejor regalo corporativo según tu presupuesto?",
          "¿Qué materiales y precios tienen las botellas personalizadas?",
          "¿Cuáles son los mejores regalos premium para clientes VIP?",
          "¿Qué regalos de empresa por menos de 3€ no parecen baratos?",
          "¿Cómo elegir tazas personalizadas para mi empresa?"
        ],
        prompt: `Escribe una guía de compra sobre [TEMA] para empresas españolas que buscan merchandising personalizado. Estructura exacta: 1. Intro de 100 palabras: problema + para quién es esta guía, 2. H2: Qué mirar antes de comprar, 3. H2: Comparativa de opciones, 4. H2: Recomendación según tipo de empresa/evento, 5. H2: Preguntas frecuentes (3-4), 6. Conclusión persuasiva animando a comprar (usa un H2 natural, NUNCA escribas la palabra "CTA"). Tono profesional, directo, sin frases vacías y con precios orientativos reales.`
      },
      {
        type: "Comparativa Técnica",
        topics: [
          "¿Qué técnica elegir: Serigrafía, grabado láser, DTF o sublimación?",
          "¿Qué material es mejor para botellas: Acero inoxidable, vidrio o bambú?",
          "¿Algodón orgánico, RPET o yute para bolsas?",
          "¿Es mejor cerámica, vidrio o acero para tazas de empresa?"
        ],
        prompt: `Escribe una comparativa técnica sobre [TEMA] para merchandising corporativo en España. Estructura: 1. Intro breve, 2. Tabla comparativa HTML con 5 criterios, 3. H2 detalle de cada opción, 4. H2 'Cuándo elegir cada una', 5. Conclusión persuasiva (NUNCA uses la palabra "CTA" en el subtítulo). Precios reales en euros, tono directo.`
      },
      {
        type: "Checklist / How-To",
        topics: [
          "¿Cómo preparar correctamente el merchandising para una feria?",
          "¿Cómo hacer tu primer pedido de merchandising personalizado?",
          "¿Cómo calcular el coste real de un regalo corporativo?",
          "¿Cuáles son los 7 errores al pedir merchandising por primera vez?"
        ],
        prompt: `Escribe un artículo práctico tipo checklist sobre [TEMA] para responsables de RRHH o compras. Estructura: 1. Intro del problema, 2. H2: Checklist de 6-10 pasos numerados, 3. H2: Sección de 3-5 errores comunes, 4. Párrafo de cierre animando a comprar (NUNCA escribas la palabra "CTA"). Tono directo, sin relleno, aportando valor práctico.`
      },
      {
        type: "Caso de Uso por Sector",
        topics: [
          "¿Cómo usar el merchandising en gimnasios y centros fitness?",
          "¿Qué regalos corporativos funcionan en empresas tech y startups?",
          "¿Qué merchandising elegir para el sector educativo?",
          "¿Cuáles son los mejores regalos para el sector salud y farmacéutico?"
        ],
        prompt: `Escribe un artículo sobre [TEMA]. Estructura: 1. Intro del contexto, 2. H2: 4-5 ideas de productos concretos con link, 3. H2: Ejemplo práctico realista (sin inventar marcas), 4. Cierre persuasivo hacia nuestra tienda (NUNCA escribas la palabra "CTA"). Sin emojis ni relleno.`
      },
      {
        type: "FAQ / Educativo corto",
        topics: [
          "¿Cuál es la cantidad mínima para personalizar productos?",
          "¿Cuánto tarda un pedido de merchandising personalizado?",
          "¿Qué diferencia hay entre serigrafía y tampografía?",
          "¿Se puede personalizar con colores Pantone exactos?"
        ],
        prompt: `Responde la pregunta «[TEMA]» para alguien que busca merchandising en España. Estructura: 1. Respuesta directa en 2 frases, 2. H2: Explicación detallada, 3. H2: Ejemplo práctico, 4. Despedida y llamada a la acción (NUNCA escribas la palabra "CTA"). Al grano y muy útil.`
      }
    ];

    const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];
    const randomTopic = randomStrategy.topics[Math.floor(Math.random() * randomStrategy.topics.length)];
    const specificPrompt = randomStrategy.prompt.replace("[TEMA]", randomTopic);

    console.log(`[Blog Cron] Iniciando estrategia: ${randomStrategy.type} | Tema: ${randomTopic}`);

    let productContext = "";
    try {
      // Obtenemos un conjunto grande de productos con su categoría para tener diversidad
      const dbProducts = await db.select({
        masterCode: products.masterCode,
        productName: products.productName,
        category: products.categoryLevel1
      }).from(products).limit(1000); // 1000 es suficientemente grande para tener surtido
      
      // Shuffle para aleatorizar y extraemos 40 productos
      const shuffled = dbProducts.sort(() => 0.5 - Math.random()).slice(0, 40);
      
      if (shuffled.length > 0) {
        const catalogJson = shuffled.map(p => ({
          nombre: p.productName,
          categoria: p.category || "General",
          url: `https://universomerchan.com/product/${p.masterCode}`
        }));

        productContext = `\n\nCATÁLOGO DE PRODUCTOS DISPONIBLES (JSON):
${JSON.stringify(catalogJson, null, 2)}

INSTRUCCIÓN VITAL: 
Arriba tienes un JSON con una muestra de nuestro catálogo actual categorizado. 
DEBES elegir 1, 2 o 3 productos de ese JSON que SEAN TOTALMENTE COHERENTES con el tema que estás tratando (ej. si hablas de botellas, busca en el JSON algo que sea botella, no uses bolsas). 
Menciónalos de forma natural en tu artículo usando EXACTAMENTE la 'url' proporcionada en el JSON para el atributo href.`;
      }
    } catch (err) {
      console.error("[Blog Cron] No se pudieron cargar productos para el contexto", err);
    }

    let recentTitlesContext = "";
    try {
      const recentPosts = await db.query.blogPosts.findMany({
        columns: { title: true },
        orderBy: (posts, { desc }) => [desc(posts.publishedAt)],
        limit: 10
      });
      if (recentPosts.length > 0) {
        recentTitlesContext = `\n\nARTÍCULOS PUBLICADOS RECIENTEMENTE (PROHIBIDO REPETIR ESTOS TEMAS EXACTOS):\n${recentPosts.map(p => `- ${p.title}`).join('\n')}`;
      }
    } catch (err) {
      console.error("[Blog Cron] No se pudieron cargar artículos recientes para el contexto", err);
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
    console.log(`[Blog Cron] Llamando a OpenAI GPT-5.4...`);
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-5.4",
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
- VERIFICACIÓN CRÍTICA DE PRODUCTOS: Es un error gravísimo hablar de "una taza" y enlazar a "una camiseta". Consulta el CATÁLOGO JSON que se te proporciona y escoge SOLO productos cuya 'categoria' o 'nombre' tengan coherencia directa con lo que estás escribiendo.
- SEO AVANZADO: A Google le gusta la semántica clara. Prioriza la indexabilidad estructurando correctamente los H2 y H3. OBLIGATORIO: Integra de forma completamente natural en el texto las palabras clave estratégicas "camisetas personalizadas" y "regalos corporativos sostenibles" al menos una vez cuando el contexto lo permita.
- ESTRATEGIA DE LINKEDIN INTACTA: Mantén la estrategia actual de LinkedIn devolviendo correctamente el objeto JSON con el post corto que genera valor directo y el comentario con el enlace, no alteres esta estructura técnica.

Estructura tu respuesta SÓLO como un archivo JSON puro, sin backticks:
{
  "title": "Título EN FORMATO DE PREGUNTA que incluya la keyword (estrictamente entre 50 y 60 caracteres)",
  "metaDescription": "Metadescripción atractiva (máx. 155 caracteres)",
  "excerpt": "Párrafo breve introductorio.",
  "linkedinPost": "Un micro-post B2B para LinkedIn: 1) Hook inicial sin emoji, 2) Cuerpo aportando valor real, 3) 3 hashtags del sector.",
  "linkedinComment": "Texto simple exacto: 'La guía completa la tienes aquí: [enlace]'.",
  "imagePrompt": "Un prompt en inglés descriptivo ultra-detallado para gpt-image-2 que genere la imagen corporativa fotorealista perfecta para el artículo. (Sin texto)",
  "body": "El artículo en HTML semántico (<h2>, <h3>, <p>, <ul>, <strong>). MUY IMPORTANTE: ESTÁ ESTRICTAMENTE PROHIBIDO USAR LA ETIQUETA <h1> DENTRO DEL BODY. El artículo debe empezar directamente con párrafos introductorios o <h2>. Siguiendo las instrucciones de estructura pedidas."
}`
        },
        {
          role: "user",
          content: specificPrompt + productContext + recentTitlesContext
        }
      ],
      response_format: { type: "json_object" }
    });

    const rawJson = chatResponse.choices[0].message.content;
    if (!rawJson) throw new Error("No response from GPT-5.4");
    
    const articleData = JSON.parse(rawJson);

    // ======================================
    // 2. GENERAR IMAGEN CON GPT-IMAGE-2
    // ======================================
    console.log(`[Blog Cron] Llamando a gpt-image-2 para la imagen... Prompt: ${articleData.imagePrompt.substring(0, 50)}...`);
    const imageResponse = await openai.images.generate({
      model: "gpt-image-2",
      prompt: articleData.imagePrompt,
      n: 1,
      size: "1024x1024"
    });

    const b64Data = imageResponse.data[0].b64_json;
    if (!b64Data) throw new Error("No image data returned from gpt-image-2");

    // ======================================
    // 3. DESCARGAR Y GUARDAR IMAGEN EN SERVIDOR
    // ======================================
    console.log(`[Blog Cron] Procesando imagen base64...`);
    const buffer = Buffer.from(b64Data, "base64");

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
      console.warn(`[Blog Cron] Fallo al guardar la imagen de forma permanente. Error: ${uploadRes.error}`);
      featuredImageUrl = "https://universomerchan.com/images/default-blog.png"; // fallback
    }

    // ======================================
    // 4. GUARDAR EN BASE DE DATOS
    // ======================================
    const baseSlug = generateSlug(articleData.title);
    let uniqueSlug = baseSlug;
    let slugCounter = 1;

    while (true) {
      const existing = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.slug, uniqueSlug)
      });
      if (!existing) break;
      uniqueSlug = `${baseSlug}-${slugCounter}`;
      slugCounter++;
    }

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
          // The user specifically wants the text string in the post, and because of 403 Forbidden errors with socialActions API, we also explicitly inject the link as fallback without confusing terms.
          postText = `${postText}\n\n👇 Tienes el artículo al completo aquí:\n🔗 ${absoluteUrl}`;
          
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
