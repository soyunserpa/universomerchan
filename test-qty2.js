const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // We need to bypass the database check if possible? No, we just need to hit the page.
  // The dev server is running on port 3000.
  // Let's hope it loads.
  
  await page.goto('http://localhost:3000/product/MO8432', { waitUntil: 'networkidle2' });
  
  try {
      await page.waitForSelector('input[type="number"]', { timeout: 10000 });
      const inputs = await page.$$('input[type="number"]');
      console.log("Found inputs:", inputs.length);
      
      // Get the value of the first input
      let val = await page.evaluate(el => el.value, inputs[0]);
      console.log("Initial value:", val);
      
      // Type 5
      await inputs[0].type('5');
      await new Promise(r => setTimeout(r, 500));
      
      val = await page.evaluate(el => el.value, inputs[0]);
      console.log("After typing value:", val);
      
      // Check the button text
      const buttonText = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent.includes('sin personalizar'));
        return btn ? btn.textContent : 'Not found';
      });
      console.log("Button text:", buttonText);
      
      // Check the price box
      const priceBoxText = await page.evaluate(() => {
        const span = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('Producto ('));
        return span ? span.textContent : 'Not found';
      });
      console.log("Price box text:", priceBoxText);
  } catch (e) {
      console.log("Error:", e.message);
  }

  await browser.close();
})();
