const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Expose a function to collect logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('https://universomerchan.com/product/mo8432-camiseta-imperial-de-manga-corta-y-cuello-redondo', { waitUntil: 'networkidle2' });
  
  // Inject a script to modify the component or read its state if possible? No, we can't easily read React state.
  // But we can read the DOM!
  
  try {
      await page.waitForSelector('input[type="number"]', { timeout: 10000 });
      const inputs = await page.$$('input[type="number"]');
      
      // Type 5 in the first enabled input
      for (const input of inputs) {
          const isDisabled = await page.evaluate(el => el.disabled, input);
          if (!isDisabled) {
              await input.type('5');
              break;
          }
      }
      
      await new Promise(r => setTimeout(r, 1000));
      
      // Check the button text
      const buttonText = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent.includes('sin personalizar'));
        return btn ? btn.textContent : 'Not found';
      });
      console.log("Button text:", buttonText);
      
      // Check the quantity at the bottom
      const summaryText = await page.evaluate(() => {
        const span = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('Cantidad'));
        if (span) {
           return span.parentElement.textContent;
        }
        return 'Not found';
      });
      console.log("Summary text:", summaryText);
      
  } catch (e) {
      console.log("Error:", e.message);
  }

  await browser.close();
})();
