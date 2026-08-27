const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5174');
  await page.waitForSelector('svg');
  
  const textBtn = await page.$('button[title="Text"]');
  if (textBtn) {
    await textBtn.click();
    console.log('Clicked Text tool');
  }
  
  await new Promise(r => setTimeout(r, 200));
  
  await page.mouse.click(400, 300);
  console.log('Clicked at 400,300');
  
  await new Promise(r => setTimeout(r, 200));
  
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type,
      value: i.value,
      display: window.getComputedStyle(i).display
    }));
  });
  console.log('Inputs:', inputs);
  
  await browser.close();
})();
