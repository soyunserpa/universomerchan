import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-service";
import {
  getAdminPostById,
  updateBlogPost,
  deleteBlogPost,
} from "@/lib/cms-content";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req.headers.get("authorization"), "admin");
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const post = await getAdminPostById(parseInt(params.id));
    if (!post) {
      return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al cargar el artículo" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req.headers.get("authorization"), "admin");
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    await updateBlogPost(parseInt(params.id), body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al actualizar el artículo" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req.headers.get("authorization"), "admin");
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await deleteBlogPost(parseInt(params.id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al eliminar el artículo" }, { status: 500 });
  }
}
