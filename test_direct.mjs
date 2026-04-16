const token = "***REMOVED***";

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
