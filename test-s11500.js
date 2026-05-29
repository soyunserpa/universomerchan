const https = require('https');
https.get('https://universomerchan.com/api/catalog/search?q=S11500', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data.substring(0, 500));
  });
});
