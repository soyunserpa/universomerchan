import fs from "fs";
const token = fs.readFileSync("/Users/universomerchan/universomerchanweb/universomerchan/Token Linkedin/token-linkedin.txt", "utf8").trim();

async function main() {
  const r = await fetch("https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR", {
    headers: { "Authorization": `Bearer ${token}`, "X-RestLi-Protocol-Version": "2.0.0"}
  });
  const text = await r.text();
  console.log("ACL2 Response:");
  console.log(text);
}
main();
