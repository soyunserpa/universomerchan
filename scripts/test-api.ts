async function run() {
  const r = await fetch("https://universomerchan.com/api/product/S11388");
  const data = await r.json();
  console.log("Product:", data.product.masterCode, data.product.productName);
  console.log("Prices:", data.product.productPrices.map((p:any) => p.costPrice).join(", "));
  console.log("Techniques:", data.printData?.techniques?.map((t:any) => t.id).join(", "));
}
run();
