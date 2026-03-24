import { midocean } from "./src/lib/midocean.ts";
async function run() {
  const pd = await midocean.getPrintData("MO2762");
  console.log("== PRINT ZONES ==");
  pd.forEach((p: any) => {
    (p.printing_positions || []).forEach((pos: any) => {
      console.log(`Pos: ${pos.position_name}`);
      console.log(JSON.stringify(pos.images, null, 2));
    });
  });
  process.exit(0);
}
run().catch(console.error);
