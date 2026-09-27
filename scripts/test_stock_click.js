const puppeteer = require('c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 892, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/scanner', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  const btns = await page.$$('nav button');
  console.log('Found nav buttons:', btns.length);
  if (btns.length >= 4) {
    console.log('Clicking button 3 (Stock)...');
    await btns[3].tap ? await btns[3].tap() : await btns[3].click();
    await new Promise(r => setTimeout(r, 1500));
  }
  
  await page.screenshot({ path: 'test_stock_click.png' });
  await browser.close();
  console.log('Saved test_stock_click.png');
})();
