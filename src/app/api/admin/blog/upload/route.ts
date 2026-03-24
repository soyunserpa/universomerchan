import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-service";
import {
  getPublishedPosts,
  getPostBySlug,
  getAdminPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getStaticPage,
  updateStaticPage,
} from "@/lib/cms-content";
import { uploadArtwork, formatFileSize } from "@/lib/artwork-upload";


export async function POST(req: NextRequest) {
  const auth = await requireAuth(req.headers.get("authorization"), "admin");
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se ha proporcionado imagen" },
        { status: 400 }
      );
    }

    // Validate it's an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen (JPG, PNG, WebP)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadArtwork(
      buffer,
      `blog-${Date.now()}-${file.name}`,
      file.type,
      auth.user.id,
      "blog-portadas"
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.fileUrl,
      fileName: result.fileName,
      fileSize: formatFileSize(result.fileSize || 0),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al subir la imagen" },
      { status: 500 }
    );
  }
}

// ============================================================
// ADMIN — Static Pages
// ============================================================


