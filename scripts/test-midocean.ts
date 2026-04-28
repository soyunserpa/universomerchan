import { getOrderDetails } from "../src/lib/midocean-api";
async function run() {
  const details = await getOrderDetails("3778530");
  console.log(JSON.stringify(details, null, 2));
}
run();
