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
    const body = await req.json();

    if (!body.title || !body.body) {
      return NextResponse.json(
        { error: "Título y contenido son obligatorios" },
        { status: 400 }
      );
    }

    const result = await createBlogPost({
      ...body,
      authorId: auth.user.id,
      authorName: `${auth.user.firstName} ${auth.user.lastName}`.trim(),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    if (error.message?.includes("unique")) {
      return NextResponse.json(
        { error: "Ya existe un artículo con ese slug" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Error al crear el artículo" },
      { status: 500 }
    );
  }
}


