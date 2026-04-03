import { getProductList } from "./src/lib/catalog-api";

async function run() {
  try {
    console.log("Searching for 'mochila'...");
    const res = await getProductList({ search: "mochila", limit: 5 });
    console.log("Total found:", res.total);
    console.log("Products:", res.products.map(p => p.name));

    console.log("\nSearching for 'Z01' (Master code)...");
    const res2 = await getProductList({ search: "Z01", limit: 5 });
    console.log("Total found:", res2.total);
    console.log("Products:", res2.products.map(p => p.name));
  } catch (e: any) {
    console.error("Error during search:", e.message);
  }
}

run().then(() => process.exit(0));
