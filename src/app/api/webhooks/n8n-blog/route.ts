import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { blogPosts } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import { uploadArtwork } from "@/lib/artwork-upload";

// Replace this with a strong secret key in production .env -> process.env.N8N_WEBHOOK_SECRET
const N8N_SECRET = process.env.N8N_WEBHOOK_SECRET || "n8n_super_secret_universe_123!";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate Request
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== N8N_SECRET) {
      return NextResponse.json({ error: "Invalid authorization token" }, { status: 403 });
    }

    // 2. Parse Payload
    const data = await req.json();
    const {
      title,
      excerpt,
      body,
      featuredImageUrl,
      metaTitle,
      metaDescription,
      authorName = "Redacción Universo Merchan"
    } = data;

    if (!title || !body) {
      return NextResponse.json({ error: "Title and body are required fields." }, { status: 400 });
    }

    // 3. Prepare Data
    // Ensure slug is uniquely collision-safe
    const baseSlug = generateSlug(title);
    const uniqueSlug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;

    let finalImageUrl = featuredImageUrl || "";

    // 3.5 Persist Remote Images (prevent DALL-E expiration)
    if (finalImageUrl && finalImageUrl.startsWith("http")) {
      try {
        console.log(`[n8n Webhook] Descargando imagen remota: ${finalImageUrl.substring(0, 50)}...`);
        const imgRes = await fetch(finalImageUrl);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const uploadRes = await uploadArtwork(
            buffer,
            `automation-blog-${Date.now()}.png`,
            "image/png",
            -1, // System admin UID
            "blog-portadas"
          );
          if (uploadRes.success && uploadRes.fileUrl) {
            finalImageUrl = uploadRes.fileUrl;
            console.log(`[n8n Webhook] Imagen persistida con éxito: ${finalImageUrl}`);
          }
        }
      } catch (err) {
        console.error("[n8n Webhook] Error al descargar imagen remota:", err);
        // Fallback to the original URL if local save fails
      }
    }

    // 4. Insert into Database
    const [newPost] = await db.insert(blogPosts).values({
      title,
      slug: uniqueSlug,
      excerpt,
      body,
      featuredImageUrl: finalImageUrl, // Use the persistent local URL
      metaTitle: metaTitle || title,
      metaDescription,
      authorName,
      isPublished: true,
      publishedAt: new Date(),
    }).returning();

    // 5. Invalidate Public Cache
    revalidatePath("/blog", "layout");
    revalidatePath("/", "layout"); // Optionally flush home if there's a recent posts widget

    return NextResponse.json({
      success: true,
      message: "Post successfully injected from n8n",
      post: newPost
    });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
