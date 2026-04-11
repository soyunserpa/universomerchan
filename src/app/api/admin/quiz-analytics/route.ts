import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { quizEvents } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const allEvents = await db.select().from(quizEvents);
    
    // Group by step using unique sessionIds
    const stepCounts = {
      opened: new Set(),
      started_wizard: new Set(),
      answered_company_name: new Set(),
      answered_industry: new Set(),
      answered_objective: new Set(),
      answered_email: new Set(),
      completed_lead: new Set()
    };
    
    allEvents.forEach(e => {
        const key = e.step as keyof typeof stepCounts;
        if (stepCounts[key]) {
            stepCounts[key].add(e.sessionId);
        }
    });

    const totalOpens = stepCounts.opened.size;
    const totalLeads = stepCounts.completed_lead.size;
    const conversionRate = totalOpens > 0 ? ((totalLeads / totalOpens) * 100).toFixed(1) : 0;

    const funnel = [
        { id: "opened", step: "Abrieron el Chat", count: stepCounts.opened.size },
        { id: "started_wizard", step: "Iniciaron el Quiz", count: stepCounts.started_wizard.size },
        { id: "answered_company_name", step: "Dieron Nombre Empresa", count: stepCounts.answered_company_name.size },
        { id: "answered_industry", step: "Dieron Sector", count: stepCounts.answered_industry.size },
        { id: "answered_objective", step: "Dieron Objetivo", count: stepCounts.answered_objective.size },
        { id: "answered_email", step: "Dieron Email", count: stepCounts.answered_email.size },
        { id: "completed_lead", step: "Completaron Lead", count: totalLeads },
    ];

    // Ensure funnel descends strictly (if someone skipped a step due to cache, keep it flat at max)
    let max = funnel[0].count;
    for (let i = 0; i < funnel.length; i++) {
        if (funnel[i].count > max) funnel[i].count = max;
        max = funnel[i].count;
    }

    return NextResponse.json({ 
        success: true, 
        funnel,
        summary: {
           totalOpens,
           conversionRate,
           totalLeads
        } 
    });

  } catch (err: any) {
    console.error("Error fetching quiz analytics:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
