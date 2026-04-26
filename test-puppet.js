const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  console.log('Navigating to product page with logo...');
  try {
    await page.goto('https://universomerchan.com/product/mo2230-bai-roll?logo=https%3A%2F%2Funiversomerchan.com%2Fimg%2Flogo.png', { waitUntil: 'networkidle0' });
    console.log('Page loaded successfully');
  } catch (e) {
    console.error('Navigation error:', e);
  }
  
  await browser.close();
})();
