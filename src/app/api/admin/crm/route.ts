import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { leads } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const allLeads = await db.select().from(leads).orderBy(desc(leads.createdAt));
    return NextResponse.json({ success: true, leads: allLeads });
  } catch (err: any) {
    console.error("Error fetching leads:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { leadId, newStatus } = await req.json();

    if (!leadId || !newStatus) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const updatedLead = await db.update(leads)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(leads.id, Number(leadId)))
      .returning();

    if (!updatedLead.length) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead: updatedLead[0] });
  } catch (err: any) {
    console.error("Error updating lead:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("id");

    if (!leadId) {
      return NextResponse.json({ success: false, error: "Missing lead ID" }, { status: 400 });
    }

    const deletedLead = await db.delete(leads)
      .where(eq(leads.id, Number(leadId)))
      .returning();

    if (!deletedLead.length) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead: deletedLead[0] });
  } catch (err: any) {
    console.error("Error deleting lead:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
