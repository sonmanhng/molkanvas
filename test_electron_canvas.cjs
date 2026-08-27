const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:5174');
  await page.waitForSelector('svg');
  
  // Create an atom first
  await page.mouse.click(300, 300);
  console.log('Placed atom C');
  await new Promise(r => setTimeout(r, 100));
  
  // Select TEXT tool
  const textBtn = await page.$('button[title="Text"]');
  if (textBtn) {
    await textBtn.click();
    console.log('Clicked Text tool');
  }
  await new Promise(r => setTimeout(r, 100));
  
  // Click the atom we just placed
  await page.mouse.click(300, 300);
  console.log('Clicked on atom C with TEXT tool');
  await new Promise(r => setTimeout(r, 200));
  
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type,
      value: i.value,
      display: window.getComputedStyle(i).display,
      parentPos: window.getComputedStyle(i.parentElement).position,
      left: i.parentElement.style.left,
      top: i.parentElement.style.top
    }));
  });
  console.log('Inputs:', inputs);
  
  await browser.close();
})();
