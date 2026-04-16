const token = "AQVKJHK2maZxHnWLxerx0DClxT9GChhatJ-yCxXwIwVQrzXhB3vp3jZ8iVtkCEjCHH9KadEoeBa8t7r-enT60Vi0SG36z3k-EPS3Lh1_I9S63CyWVmbv7323VqQCtJHzNQXgK1BlP6IfHQUxsmwWoTlS9cLSD8Q-jKPCcYKJ-i8raR5PMdR7MnSCvb6CSsD-vBiLZ0OlvyFbN4n2po2u0bjMlHTz6hwjf4U5m_D94CkBewOTm6Rk4KVO55UyPxT06juVVkyMsdOdklzqb-F4mWWAMkbHYJ0IsR1L2MlPtyA9pIhKoHvTatsQSZZq6-LG8PQW7Mg_fzOoQDh3Q35CLmjPZGTPjA";

const payload = {
    "author": "urn:li:organization:106915932",
    "lifecycleState": "PUBLISHED",
    "specificContent": {
        "com.linkedin.ugc.ShareContent": {
            "shareCommentary": {
                "text": "Hello World!"
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
