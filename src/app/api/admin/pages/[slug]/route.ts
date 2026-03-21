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


export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;

  const auth = await requireAuth(req.headers.get("authorization"), "admin");
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    await updateStaticPage(slug, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al actualizar la página" },
      { status: 500 }
    );
  }
}

