import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { users, leads } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const downloadCsv = searchParams.get("format") === "csv";

    const allUsers = await db.select().from(users);
    const allLeads = await db.select().from(leads);

    const contactMap = new Map();

    // 1. Process Users (Customers)
    allUsers.forEach(u => {
      if (!u.email) return;
      contactMap.set(u.email.toLowerCase(), {
        origen: "Cliente Registrado",
        nombre: u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : "",
        empresa: u.company || "",
        email: u.email,
        telefono: u.phone || "",
        sector: "",
        presupuesto: "",
        volumen: "",
        fecha: u.createdAt ? new Date(u.createdAt).toISOString() : ""
      });
    });

    // 2. Process Leads (CRM)
    allLeads.forEach(l => {
      if (!l.email) return;
      const key = l.email.toLowerCase();
      
      if (contactMap.has(key)) {
        const existing = contactMap.get(key);
        existing.origen = "Cliente + Lead";
        existing.empresa = existing.empresa || l.companyName || "";
        existing.telefono = existing.telefono || l.phone || "";
        existing.sector = l.industry || "";
      } else {
        contactMap.set(key, {
          origen: "Lead (CRM)",
          nombre: "",
          empresa: l.companyName || "",
          email: l.email,
          telefono: l.phone || "",
          sector: l.industry || "",
          presupuesto: l.budget || "",
          volumen: l.volume || "",
          fecha: l.createdAt ? new Date(l.createdAt).toISOString() : ""
        });
      }
    });

    const contactList = Array.from(contactMap.values()).sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    if (downloadCsv) {
      const headers = ["Origen", "Nombre", "Empresa", "Email", "Teléfono", "Sector", "Presupuesto", "Volumen", "Fecha Registro"];
      const rows = contactList.map(c => [
        `"${c.origen}"`,
        `"${c.nombre}"`,
        `"${c.empresa}"`,
        `"${c.email}"`,
        `"${c.telefono}"`,
        `"${c.sector}"`,
        `"${c.presupuesto}"`,
        `"${c.volumen}"`,
        `"${new Date(c.fecha).toLocaleDateString()}"`
      ]);

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const bom = "\uFEFF";
  
      return new NextResponse(bom + csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="contactos_globales_${new Date().toISOString().slice(0,10)}.csv"`
        }
      });
    }

    // Return JSON
    return NextResponse.json({ success: true, contacts: contactList });

  } catch (err: any) {
    console.error("Error fetching contacts:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
