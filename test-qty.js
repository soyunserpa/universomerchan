const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/product/MO8432');
  await page.waitForSelector('input[type="number"]');
  // Type 5 in the first size input
  const inputs = await page.$$('input[type="number"]');
  await inputs[0].type('5');
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 1000));
  
  // Get text of the primary button
  const buttonText = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('sin personalizar'));
    return btn ? btn.textContent : 'Not found';
  });
  console.log("Button text:", buttonText);
  await browser.close();
})();
