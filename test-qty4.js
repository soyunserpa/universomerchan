const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://universomerchan.com/product/mo8432-camiseta-imperial-de-manga-corta-y-cuello-redondo', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'initial_state.png', fullPage: true });
  console.log("Screenshot taken.");
  await browser.close();
})();
