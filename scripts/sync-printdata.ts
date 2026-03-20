const API_KEY = process.env.MIDOCEAN_API_KEY;
const DB_URL = process.env.DATABASE_URL;
if (!API_KEY || !DB_URL) { console.error("Missing env vars"); process.exit(1); }
import postgres from "postgres";
const sql = postgres(DB_URL);
async function main() {
  console.log("[PrintData] Fetching...");
  const res = await fetch("https://api.midocean.com/gateway/printdata/1.0", { headers: { "x-Gateway-APIKey": API_KEY! } });
  const data = await res.json();
  const techs: Record<string,string> = {};
  for (const t of data.printing_technique_descriptions || []) {
    techs[t.id] = t.name?.find((n:any) => n.es)?.es || t.name?.find((n:any) => n.en)?.en || t.id;
  }
  console.log("[PrintData] " + Object.keys(techs).length + " techniques");
  const products = data.products || [];
  console.log("[PrintData] " + products.length + " products");
  await sql`DELETE FROM print_positions`;
  let ins = 0;
  for (const prod of products) {
    const mc = prod.master_code;
    if (!mc) continue;
    const ex = await sql`SELECT id FROM products WHERE master_code = ${mc}`;
    if (ex.length === 0) continue;
    for (const pos of prod.printing_positions || []) {
      const availTechs = (pos.printing_techniques || []).map((t:any) => ({
        technique_id: t.id,
        technique_description: techs[t.id] || t.id,
        max_colors: parseInt(t.max_colours || "1"),
        is_default: t.default || false
      }));
      const img = pos.images?.[0]?.print_position_image_with_area || pos.images?.[0]?.print_position_image_blank || null;
      await sql`INSERT INTO print_positions (master_code, position_id, position_description, max_print_width, max_print_height, print_position_image, available_techniques) VALUES (${mc}, ${pos.position_id || "default"}, ${pos.position_id || "default"}, ${pos.max_print_size_width || 0}, ${pos.max_print_size_height || 0}, ${img}, ${JSON.stringify(availTechs)})`;
      ins++;
    }
    if (ins % 500 === 0 && ins > 0) console.log("  " + ins + "...");
  }
  await sql`UPDATE products SET printable = true WHERE master_code IN (SELECT DISTINCT master_code FROM print_positions)`;
  await sql`UPDATE products SET printable = false WHERE master_code NOT IN (SELECT DISTINCT master_code FROM print_positions)`;
  console.log("Done! " + ins + " positions");
  await sql.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
