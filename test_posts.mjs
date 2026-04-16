const token = "AQXCizt9s5m5C7S7GV9HG0vzw1tekqYmbmIGRYueaE89v6pNwaVqPEvEA-za2b9tzaegFpO6ryzoEL89SFnVpsePWd5CCFZQC7KctkL0AIchS5nVgLBgrrdM5tstY8cfjfNVW6_gLw9bycQutkQxk5oGvrB5aJsQaCjCtgkHA8yg16tszZPwlNHpBxCYAS7JK6wUNx41bgiFPpuFKbmVSxKB2lEpW1KFwpXzY9Q-sPnRiB4oD_CU9JafIh5bnIVPs3z2Mn7MAjcweNGjvmXNhCE_JUfyM5VK8yOIVhnZe4OZxS6OWzZePLmEbEWgom8i8Bh25LBR8S85ggQqfJx7YfFFo0oaQA";

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
