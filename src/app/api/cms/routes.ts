// ============================================================
// UNIVERSO MERCHAN — CMS API Routes
// ============================================================
// Public:
//   GET  /api/blog                 — List published posts
//   GET  /api/blog/[slug]          — Single post
//   GET  /api/pages/[slug]         — Static page content
//
// Admin (requires admin auth):
//   GET  /api/admin/blog           — List all posts (inc. drafts)
//   POST /api/admin/blog           — Create post
//   PUT  /api/admin/blog/[id]      — Update post
//   DELETE /api/admin/blog/[id]    — Delete post
//   POST /api/admin/blog/upload    — Upload featured image
//   PUT  /api/admin/pages/[slug]   — Update static page
// ============================================================

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

// ============================================================
// PUBLIC — Blog
// ============================================================

// GET /api/blog?page=1&search=...
export async function GET_blogList(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || undefined;

  const result = await getPublishedPosts({ page, search });
  return NextResponse.json(result);
}

// GET /api/blog/[slug]
export async function GET_blogPost(req: NextRequest, slug: string) {
  const post = await getPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
  }
  return NextResponse.json(post);
}

// ============================================================
// PUBLIC — Static Pages
// ============================================================

// GET /api/pages/[slug]
export async function GET_staticPage(req: NextRequest, slug: string) {
  const page = await getStaticPage(slug);
  if (!page) {
    return NextResponse.json({ error: "Página no encontrada" }, { status: 404 });
  }
  return NextResponse.json(page);
}

// ============================================================
// ADMIN — Blog CRUD
// ============================================================

// GET /api/admin/blog?page=1
export async function GET_adminBlogList(req: NextRequest) {
  const auth = await requireAuth(req.headers.get("authorization"), "admin");
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");

  const result = await getAdminPosts({ page });
  return NextResponse.json(result);
}

// POST /api/admin/blog
export async function POST_adminCreatePost(req: NextRequest) {
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

// PUT /api/admin/blog/[id]
export async function PUT_adminUpdatePost(req: NextRequest, postId: string) {
  const auth = await requireAuth(req.headers.get("authorization"), "admin");
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    await updateBlogPost(parseInt(postId), body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al actualizar el artículo" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/blog/[id]
export async function DELETE_adminDeletePost(req: NextRequest, postId: string) {
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

// POST /api/admin/blog/upload — Upload featured image for blog post
export async function POST_adminUploadImage(req: NextRequest) {
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
      auth.user.id
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

// PUT /api/admin/pages/[slug]
export async function PUT_adminUpdatePage(req: NextRequest, slug: string) {
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
