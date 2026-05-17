const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Go to product page
  await page.goto('https://universomerchan.com/product/mo8432-camiseta-imperial-de-manga-corta-y-cuello-redondo', { waitUntil: 'networkidle2' });
  
  // Wait for the inputs to load
  await page.waitForSelector('input[type="number"]', { timeout: 10000 });
  
  // Take screenshot of initial state
  await page.screenshot({ path: 'initial_state.png', fullPage: true });
  
  // Type 5 in the first available size input
  const inputs = await page.$$('input[type="number"]');
  for (const input of inputs) {
      const isDisabled = await page.evaluate(el => el.disabled, input);
      if (!isDisabled) {
          await input.type('5');
          break;
      }
  }
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Take screenshot after typing
  await page.screenshot({ path: 'after_typing.png', fullPage: true });
  
  await browser.close();
})();
