import { getProductList } from "../src/lib/catalog-api";

async function run() {
  console.log("Testing exact match (boligrafo):");
  const res1 = await getProductList({ search: "boligrafo", limit: 3 });
  console.log(res1.products.map(p => p.name));

  console.log("\nTesting typo (bolifrafo):");
  const res2 = await getProductList({ search: "bolifrafo", limit: 3 });
  console.log(res2.products.map(p => p.name));

  console.log("\nTesting plural (mochilas):");
  const res3 = await getProductList({ search: "mochilas", limit: 3 });
  console.log(res3.products.map(p => p.name));
  
  process.exit(0);
}

run().catch(console.error);
