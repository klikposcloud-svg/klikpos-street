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
  
  // Click big button "Ir a Stock para Agregar Productos"
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.textContent && x.textContent.includes('Ir a Stock'));
    if (b) {
      b.click();
      return true;
    }
    return false;
  });
  console.log('Clicked big button:', clicked);
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'test_stock_view_screen.png' });
  await browser.close();
  console.log('Saved test_stock_view_screen.png');
})();
