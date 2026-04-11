import { NextResponse } from "next/server";
import { sendQuizProposalEmail } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    const { email, pack } = await req.json();

    if (!email || !pack) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const emailSent = await sendQuizProposalEmail(email, pack);

    if (emailSent) {
      return NextResponse.json({ success: true, message: "Email sent successfully" });
    } else {
      return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Error sending proposal email:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
