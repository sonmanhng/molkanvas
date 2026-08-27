const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });
  
  page.on('console', msg => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`);
  });
  
  await page.goto('http://localhost:5174');
  await page.waitForSelector('svg');
  
  await page.mouse.click(300, 300);
  await new Promise(r => setTimeout(r, 100));
  
  await browser.close();
})();
