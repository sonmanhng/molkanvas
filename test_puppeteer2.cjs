const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5174');
  await page.waitForSelector('svg');
  
  // Find the exact Text button by its title
  const textBtn = await page.$('button[title="Text"]');
  if (textBtn) {
    await textBtn.click();
    console.log('Clicked Text tool');
  } else {
    console.log('Text tool not found');
  }
  
  await new Promise(r => setTimeout(r, 200));
  
  // Find the main canvas SVG (the last one, or the one inside .mol-canvas? Wait, we didn't add class to Canvas svg)
  // Let's just evaluate a click in the center of the viewport
  await page.mouse.click(400, 300);
  console.log('Clicked at 400,300');
  
  await new Promise(r => setTimeout(r, 200));
  
  // Now dump all inputs
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type,
      placeholder: i.placeholder,
      value: i.value,
      display: window.getComputedStyle(i).display,
      parentAbsolute: window.getComputedStyle(i.parentElement).position
    }));
  });
  console.log('Inputs:', inputs);
  
  await browser.close();
})();
