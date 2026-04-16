const token = "***REMOVED***";

async function main() {
  const r = await fetch("https://api.linkedin.com/v2/organizationAcls?q=roleAssignee", {
    headers: { "Authorization": `Bearer ${token}`, "X-RestLi-Protocol-Version": "2.0.0"}
  });
  const text = await r.json();
  console.log("ACL2 Response:");
  console.log(text);
}
main();
