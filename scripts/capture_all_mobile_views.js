const puppeteer = require('c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 412,
    height: 892,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  });

  await page.goto('http://localhost:3000/scanner', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Capture Tab: Stock / Catálogo
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const stockBtn = btns.find(b => b.textContent && b.textContent.includes('Stock'));
    if (stockBtn) stockBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'mobile_view_stock.png' });

  // 2. Add an item to cart from Stock tab (click first product card)
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('button'));
    const itemCard = cards.find(b => b.textContent && (b.textContent.includes('Bs.') || b.textContent.includes('$')));
    if (itemCard) itemCard.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // 3. Capture Tab: Venta (Carrito activo)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const ventaBtn = btns.find(b => b.textContent && b.textContent.includes('Venta'));
    if (ventaBtn) ventaBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'mobile_view_venta.png' });

  // 4. Capture Tab: Balanza
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const balanzaBtn = btns.find(b => b.textContent && b.textContent.includes('Balanza'));
    if (balanzaBtn) balanzaBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'mobile_view_balanza.png' });

  // 5. Capture Tab: Escanear
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const escanearBtn = btns.find(b => b.textContent && b.textContent.includes('Escanear'));
    if (escanearBtn) escanearBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'mobile_view_escanear.png' });

  await browser.close();
  console.log('All mobile views captured successfully!');
})();
