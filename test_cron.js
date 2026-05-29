fetch("https://universomerchan.com/api/cron/generate-blog", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ***REMOVED***"
  }
}).then(r => r.json()).then(console.log).catch(console.error);
