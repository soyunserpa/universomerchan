const token = "AQXCizt9s5m5C7S7GV9HG0vzw1tekqYmbmIGRYueaE89v6pNwaVqPEvEA-za2b9tzaegFpO6ryzoEL89SFnVpsePWd5CCFZQC7KctkL0AIchS5nVgLBgrrdM5tstY8cfjfNVW6_gLw9bycQutkQxk5oGvrB5aJsQaCjCtgkHA8yg16tszZPwlNHpBxCYAS7JK6wUNx41bgiFPpuFKbmVSxKB2lEpW1KFwpXzY9Q-sPnRiB4oD_CU9JafIh5bnIVPs3z2Mn7MAjcweNGjvmXNhCE_JUfyM5VK8yOIVhnZe4OZxS6OWzZePLmEbEWgom8i8Bh25LBR8S85ggQqfJx7YfFFo0oaQA";

const payload = {
    "author": "urn:li:organization:106915932",
    "lifecycleState": "PUBLISHED",
    "specificContent": {
        "com.linkedin.ugc.ShareContent": {
            "shareCommentary": {
                "text": "Prueba técnica!"
            },
            "shareMediaCategory": "NONE"
        }
    },
    "visibility": {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
    }
};

fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
        "Authorization": `Bearer ${token}`,
        "X-RestLi-Protocol-Version": "2.0.0",
        "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
}).then(res => res.text()).then(console.log).catch(console.error);
