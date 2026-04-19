async function run() {
  console.log("Triggering live cron endpoint...");
  const res = await fetch("https://universomerchan.com/api/cron/generate-blog");
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Raw Response:", text);
}
run();
