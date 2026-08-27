const puppeteer = require('puppeteer');
const fs = require('fs');

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
  
  // take screenshot of just the input if it exists
  const input = await page.$('input[value=""]'); // The editing text input is the one without placeholder? No wait, let's find all text inputs.
  const inputs = await page.$$('input[type="text"]');
  console.log('Found ' + inputs.length + ' text inputs.');
  
  // The first input without placeholder is ours
  for (let i = 0; i < inputs.length; i++) {
    const handle = inputs[i];
    const html = await page.evaluate(el => el.outerHTML, handle);
    console.log('Input ' + i + ': ' + html);
  }
  
  await page.screenshot({ path: 'puppeteer_final_screenshot.png' });
  
  await browser.close();
})();
