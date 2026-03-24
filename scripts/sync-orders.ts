import 'dotenv/config';
import { syncActiveOrders } from "../src/lib/sync-engine";
import { checkPendingProofs } from "../src/lib/proof-reminders";

async function main() {
  console.log("[Sync] Starting order sync job...");
  try {
    const { checked, updated } = await syncActiveOrders();
    console.log(`[Sync] Checked ${checked} active orders. Updates found: ${updated}`);
    
    console.log("[Sync] Checking for pending proofs to remind...");
    await checkPendingProofs();
    
    console.log("[Sync] Order sync job completed successfully.");
    process.exit(0);
  } catch (error: any) {
    console.error("[Sync] Order sync job failed:", error.message);
    process.exit(1);
  }
}

main();
