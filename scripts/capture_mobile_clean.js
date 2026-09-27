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
  await new Promise(r => setTimeout(r, 1500));

  // Capture 1: Pantalla inicial POS Móvil
  await page.screenshot({ path: 'mobile_screen_1_pos.png' });

  // Click Tab 4: Stock
  await page.evaluate(() => {
    const navButtons = document.querySelectorAll('nav button');
    // Button 3 is Stock (index 3)
    if (navButtons[3]) navButtons[3].click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'mobile_screen_2_stock.png' });

  // Click on the first product card in Stock to add to cart
  await page.evaluate(() => {
    const cards = document.querySelectorAll('main button');
    if (cards.length > 0) cards[0].click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Click Tab 1: Venta (con item en carrito)
  await page.evaluate(() => {
    const navButtons = document.querySelectorAll('nav button');
    if (navButtons[0]) navButtons[0].click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'mobile_screen_3_cart.png' });

  // Click Tab 2: Balanza
  await page.evaluate(() => {
    const navButtons = document.querySelectorAll('nav button');
    if (navButtons[1]) navButtons[1].click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'mobile_screen_4_balanza.png' });

  // Click Tab 3: Escanear
  await page.evaluate(() => {
    const navButtons = document.querySelectorAll('nav button');
    if (navButtons[2]) navButtons[2].click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'mobile_screen_5_scanner.png' });

  await browser.close();
  console.log('Mobile screenshots captured cleanly!');
})();
