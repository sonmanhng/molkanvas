const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Expose function to log
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:5174');
  
  // Wait for the app to load
  await page.waitForSelector('svg');
  
  // Click the Text tool
  // The Text tool should have title "Text"
  const textBtn = await page.$('button[title="Text"]');
  if (textBtn) {
    console.log('Found Text button, clicking...');
    await textBtn.click();
  } else {
    console.log('Could not find Text button');
  }
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 500));
  
  // Click the center of the SVG
  const svg = await page.$('svg');
  const box = await svg.boundingBox();
  console.log('SVG bounding box:', box);
  
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  console.log('Clicked center of canvas');
  
  await new Promise(r => setTimeout(r, 500));
  
  // Check if an input exists
  const input = await page.$('input[type="text"]');
  if (input) {
    console.log('INPUT FOUND IN DOM!');
    const box2 = await input.boundingBox();
    console.log('Input bounding box:', box2);
  } else {
    console.log('NO INPUT FOUND IN DOM!');
    const bodyHtml = await page.evaluate(() => document.body.innerHTML);
    const fs = require('fs');
    fs.writeFileSync('dom_dump.html', bodyHtml);
    console.log('Dumped DOM to dom_dump.html');
  }
  
  await browser.close();
})();
