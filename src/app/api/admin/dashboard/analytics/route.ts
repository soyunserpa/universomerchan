import { NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { headers } from "next/headers";
import { jwtVerify } from "jose";

export async function GET(request: Request) {
  try {
    const authHeader = headers().get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET || "universo-merchan-default-secret-change-me"));
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const propertyId = process.env.GA_PROPERTY_ID;
    const clientEmail = process.env.GA_CLIENT_EMAIL;
    // Replace literal escaped newlines with actual newlines
    const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!propertyId || !clientEmail || !privateKey) {
      return NextResponse.json({ error: "Google Analytics is not configured" }, { status: 500 });
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        { startDate: "7daysAgo", endDate: "today" },
      ],
      metrics: [
        { name: "activeUsers" },
        { name: "screenPageViews" },
        { name: "sessions" },
      ],
    });

    const metrics = {
      users: parseInt(response.rows?.[0]?.metricValues?.[0]?.value || "0", 10),
      pageViews: parseInt(response.rows?.[0]?.metricValues?.[1]?.value || "0", 10),
      sessions: parseInt(response.rows?.[0]?.metricValues?.[2]?.value || "0", 10),
    };

    return NextResponse.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error("Error fetching Google Analytics data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
