const puppeteer = require('puppeteer');

(async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({ 
    headless: 'new', 
    executablePath: edgePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915 });
  await page.goto('http://localhost:3000/scanner', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  
  const navBtns = await page.$$('nav button');
  console.log('Nav buttons count:', navBtns.length);
  if (navBtns[3]) {
    await navBtns[3].click();
    console.log('Clicked stock button via puppeteer click!');
  }
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/klikpos_mobile_scanner_stock_tab.png' });

  // Now click on Quick Sale button (the amber button on Venta) or Balanza
  if (navBtns[1]) {
    await navBtns[1].click();
    console.log('Clicked scale button!');
  }
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/klikpos_mobile_scanner_scale_tab.png' });

  await browser.close();
  console.log('Finished capturing!');
})();
