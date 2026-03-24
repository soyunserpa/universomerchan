import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { getAdminPosts, getPublishedPosts } from "./src/lib/cms-content";

async function main() {
  console.log("Testing getPublishedPosts...");
  try {
    const pub = await getPublishedPosts();
    console.log(`Pub returned: ${pub.total} posts`);
  } catch (e) {
    console.log("Pub CRASHED:", e);
  }

  console.log("\nTesting getAdminPosts...");
  try {
    const admin = await getAdminPosts();
    console.log(`Admin returned: ${admin.total} posts`);
    console.log(admin);
  } catch (e) {
    console.log("Admin CRASHED:", e);
  }
  process.exit(0);
}
main();
