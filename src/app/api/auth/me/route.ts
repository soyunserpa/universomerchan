import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-service";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const result = await requireAuth(authHeader);
    
    if ('error' in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Error validando sesión" },
      { status: 500 }
    );
  }
}
