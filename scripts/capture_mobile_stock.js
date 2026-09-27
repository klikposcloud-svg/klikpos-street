const puppeteer = require('puppeteer');

(async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({ 
    headless: 'new', 
    executablePath: edgePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/scanner', { waitUntil: 'networkidle2', timeout: 15000 });
  
  // Click on Stock button directly
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const stockBtn = btns.find(b => b.textContent.includes('Ir a Stock') || b.textContent.includes('Stock'));
    if (stockBtn) stockBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/klikpos_mobile_scanner_stock.png' });

  // Add an item to cart if any item exists
  await page.evaluate(() => {
    const addBtns = Array.from(document.querySelectorAll('button'));
    const plusBtn = addBtns.find(b => b.textContent.includes('+') || b.querySelector('svg'));
    if (plusBtn) plusBtn.click();
  });

  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/klikpos_mobile_scanner_cart.png' });

  await browser.close();
  console.log('Mobile stock and cart screenshots captured successfully!');
})();
