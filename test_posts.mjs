const token = "***REMOVED***";

async function main() {
  const r = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${token}`, 
      "LinkedIn-Version": "202401",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "author": "urn:li:organization:106915932",
      "commentary": "test",
      "visibility": "PUBLIC",
      "distribution": {
        "feedDistribution": "MAIN_FEED",
        "targetEntities": [],
        "thirdPartyDistributionChannels": []
      },
      "lifecycleState": "PUBLISHED"
    })
  });
  const text = await r.json();
  console.log("REST /posts Response:");
  console.log(text);
}
main();
