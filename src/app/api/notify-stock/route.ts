import { NextResponse } from "next/server";
import { sendStockNotifyRequest } from "@/lib/email-service";

export const dynamic = "force-dynamic";

// Recibe el email de un cliente que quiere aviso de un producto agotado
// y manda una notificación a operaciones (universomerchan7@gmail.com).
export async function POST(req: Request) {
  try {
    const { email, productName, masterCode } = await req.json();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    await sendStockNotifyRequest({
      customerEmail: String(email).slice(0, 200),
      productName: String(productName || "Producto").slice(0, 200),
      masterCode: String(masterCode || "").slice(0, 50),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
