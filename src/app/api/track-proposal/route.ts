import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, option, timestamp } = body;
    
    const logEntry = JSON.stringify({
      timestamp: timestamp || new Date().toISOString(),
      action: action || "view",
      option: option || "none",
      userAgent: req.headers.get("user-agent") || "unknown"
    }) + "\n";

    const logPath = path.join(process.cwd(), "proposal_leads.log");
    fs.appendFileSync(logPath, logEntry);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
