const https = require('https');
https.get('https://universomerchan.com/product/S11500', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (match) {
      const json = JSON.parse(match[1]);
      const product = json.props.pageProps.product || json.props.pageProps.fallback?.['/api/catalog/product/S11500'];
      console.log("Found Next Data");
    } else {
      // App Router stores data differently
      const match2 = data.match(/self\.__next_f\.push\(\[1,"(.*?)"]/);
      console.log("Match2 length:", match2 ? match2[1].length : 0);
      const fs = require('fs');
      fs.writeFileSync('s11500.html', data);
      console.log("Saved to s11500.html");
    }
  });
});
