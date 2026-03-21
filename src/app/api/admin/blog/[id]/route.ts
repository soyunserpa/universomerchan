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


export async function DELETE(req: NextRequest, { params }: { params: { postId: string } }) {
  const postId = params.postId;

  const auth = await requireAuth(req.headers.get("authorization"), "admin");
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await deleteBlogPost(parseInt(postId));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al eliminar el artículo" },
      { status: 500 }
    );
  }
}


