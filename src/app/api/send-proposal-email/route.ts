import { NextResponse } from "next/server";
import { sendQuizProposalEmail } from "@/lib/email-service";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";

export async function POST(req: Request) {
  try {
    const { email, pack } = await req.json();

    if (!email || !pack) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const emailSent = await sendQuizProposalEmail(email, pack);

    if (emailSent) {
      // Register in Admin Email Logs
      try {
        await db.insert(schema.emailLog).values({
          recipientEmail: email,
          recipientType: "customer",
          emailType: "quiz_proposal",
          subject: `Tu propuesta mágica: ${pack.title}`,
          deliveryStatus: "sent"
        });
      } catch (err) {
        console.error("Failed to log email to db:", err);
      }

      return NextResponse.json({ success: true, message: "Email sent successfully" });
    } else {
      return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Error sending proposal email:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
