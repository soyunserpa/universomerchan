import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { trafficSessions } from "@/lib/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, url, referrer } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing session ID" }, { status: 400 });
    }

    // Determine source
    let source = "Directo";
    let medium = "none";

    if (referrer) {
      const refUrl = new URL(referrer);
      const hostname = refUrl.hostname.toLowerCase();

      if (hostname.includes("google")) {
        source = "Google";
        medium = "organic";
      } else if (hostname.includes("instagram") || hostname.includes("l.instagram.com")) {
        source = "Instagram";
        medium = "social";
      } else if (hostname.includes("facebook") || hostname.includes("l.facebook.com")) {
        source = "Facebook";
        medium = "social";
      } else if (hostname.includes("tiktok")) {
        source = "TikTok";
        medium = "social";
      } else if (hostname.includes("linkedin")) {
        source = "LinkedIn";
        medium = "social";
      } else if (hostname.includes("bing") || hostname.includes("yahoo")) {
        source = "Buscadores (Otros)";
        medium = "organic";
      } else if (!hostname.includes("universomerchan.com")) {
        source = "Otros Referidos";
        medium = hostname;
      }
    }

    // Check UTMs in URL
    if (url) {
      try {
        const currentUrl = new URL(url);
        const utmSource = currentUrl.searchParams.get("utm_source");
        const utmMedium = currentUrl.searchParams.get("utm_medium");
        
        if (utmSource) {
          source = utmSource.charAt(0).toUpperCase() + utmSource.slice(1);
        }
        if (utmMedium) medium = utmMedium;
      } catch (e) {
        // invalid URL format, ignore
      }
    }

    // Insert to database, ignoring if session_id already exists (unique constraint)
    try {
      await db.insert(trafficSessions).values({
        sessionId,
        source,
        medium,
        url: url ? url.substring(0, 1000) : null, // Limit length just in case
      });
    } catch (dbError: any) {
      // 23505 is PostgreSQL unique_violation error code.
      // If it exists, we just ignore it (the user refreshed the page or navigated)
      if (dbError.code !== '23505') {
        console.error("Error inserting traffic session:", dbError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Traffic track error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
