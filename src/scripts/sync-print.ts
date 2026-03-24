import { syncPrintData } from "../lib/sync-engine";

async function main() {
  console.log("Forcing manual Midocean Print Data Sync to backfill coordinates...");
  try {
    const result = await syncPrintData();
    console.log("Sync complete! Updated:", result.updated);
    process.exit(0);
  } catch (error) {
    console.error("Sync failed:", error);
    process.exit(1);
  }
}

main();
