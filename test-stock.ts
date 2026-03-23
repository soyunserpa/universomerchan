import { config } from "dotenv";
config();
async function run() {
  const res = await fetch("https://api.midocean.com/gateway/stock/2.0", {
    headers: { "x-Gateway-APIKey": process.env.MIDOCEAN_API_KEY!, "Accept": "text/json" },
    redirect: "manual"
  });
  console.log("Status:", res.status);
  console.log("Location:", res.headers.get("location"));
  const text = await res.text();
  console.log("Body starts with:", text.substring(0, 100));
}
run();
