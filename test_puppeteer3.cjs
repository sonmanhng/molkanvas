const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  await page.goto('http://localhost:5174');
  await page.waitForSelector('svg');
  
  const textBtn = await page.$('button[title="Text"]');
  if (textBtn) {
    await textBtn.click();
    console.log('Clicked Text tool');
  }
  
  await new Promise(r => setTimeout(r, 200));
  
  await page.mouse.click(400, 300);
  console.log('Clicked canvas');
  
  await new Promise(r => setTimeout(r, 200));
  
  await browser.close();
})();
