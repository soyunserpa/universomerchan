import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { quizEvents } from "@/lib/schema";

export async function POST(req: Request) {
  try {
    const { sessionId, step, metadata } = await req.json();

    if (!sessionId || !step) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await db.insert(quizEvents).values({
      sessionId,
      step,
      metadata: metadata || {},
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Quiz Analytics API Error:", err);
    return NextResponse.json({ error: "Could not record analytics" }, { status: 500 });
  }
}
