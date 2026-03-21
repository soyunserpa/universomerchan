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


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || undefined;

  const result = await getPublishedPosts({ page, search });
  return NextResponse.json(result);
}


