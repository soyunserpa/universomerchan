const token = "***REMOVED***";
fetch("https://api.linkedin.com/v2/organizations?q=roleAssignee", {
    headers: { "Authorization": `Bearer ${token}` }
}).then(res => res.text()).then(console.log);
