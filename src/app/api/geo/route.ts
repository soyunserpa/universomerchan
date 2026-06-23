import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

// Devuelve el país (ISO-2) del visitante a partir de la cabecera CF-IPCountry que
// añade Cloudflare. El checkout lo usa para pre-seleccionar el país de envío.
// Valores especiales de Cloudflare: "XX" (desconocido), "T1" (red Tor) → sin país.
export async function GET() {
  const h = headers();
  let country = (h.get("cf-ipcountry") || "").toUpperCase();
  if (country === "XX" || country === "T1" || country.length !== 2) {
    country = "";
  }
  return NextResponse.json(
    { country: country || null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
