import { NextResponse } from "next/server";
import { getAdminPosts } from "@/lib/cms-content";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await getAdminPosts({ page: 1, limit: 20 });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
