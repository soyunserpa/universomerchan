import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { leads } from '@/lib/schema';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Almacenamos el lead en la DB
    const newLead = await db.insert(leads).values({
      email: body.email,
      phone: body.phone || null,
      companyName: body.companyName || null,
      industry: body.industry || null,
      budget: body.budget || null,
      objective: body.objective || null,
      volume: body.volume || null,
      status: "NEW",
    }).returning();
    
    console.log("🔥 [NUEVO LEAD DE QUIZ GUARDADO EN CRM] 🔥", newLead[0]?.email);
    
    return NextResponse.json({ success: true, lead: newLead[0] });
  } catch (error) {
    console.error("Error procesando lead del Quiz:", error);
    return NextResponse.json({ success: false, error: "Failed to process lead" }, { status: 500 });
  }
}
