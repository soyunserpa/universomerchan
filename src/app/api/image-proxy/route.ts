// ============================================================
// /api/image-proxy — Server-side image proxy for Midocean CDN
// ============================================================
// Midocean CDN (printposition-img-api-v2.cdn.midocean.com and
// cdn1.midocean.com) doesn't send CORS headers. Fabric.js needs
// same-origin images to render on canvas. This route fetches the
// image server-side and pipes it back to the browser.
// ============================================================

import { NextRequest, NextResponse } from "next/server";

const ALLOWED_DOMAINS = [
  "printposition-img-api-v2.cdn.midocean.com",
  "cdn1.midocean.com",
  "cdn2.midocean.com",
  "image.midocean.com",
  "images.midocean.com",
];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Validate domain whitelist
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!ALLOWED_DOMAINS.some(d => parsedUrl.hostname === d || parsedUrl.hostname.endsWith("." + d))) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "UniversoMerchan/1.0",
        "Accept": "image/*",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: response.status }
      );
    }

    let contentType = response.headers.get("content-type") || "";
    // Midocean CDN often returns application/octet-stream — detect by extension
    if (!contentType || contentType === "application/octet-stream" || !contentType.startsWith("image/")) {
      const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
      const mimeMap: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml" };
      contentType = mimeMap[ext || ""] || "image/jpeg";
    }
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("[image-proxy] Error fetching:", url, err.message);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 502 }
    );
  }
}
