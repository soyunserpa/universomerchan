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


export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;

  const page = await getStaticPage(slug);
  if (!page) {
    return NextResponse.json({ error: "Página no encontrada" }, { status: 404 });
  }
  return NextResponse.json(page);
}

// ============================================================
// ADMIN — Blog CRUD
// ============================================================


