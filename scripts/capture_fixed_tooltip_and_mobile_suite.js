const puppeteer = require('c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Verify Desktop Fixed Tooltip
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1366, height: 768 });
  await desktopPage.goto('http://localhost:3000/dashboard/pos', { waitUntil: 'domcontentloaded' });
  await desktopPage.waitForSelector('aside nav button');
  const btns = await desktopPage.$$('aside nav button');
  
  // Hover 3rd button (Ventas)
  await btns[2].hover();
  await new Promise(r => setTimeout(r, 600));

  await desktopPage.screenshot({
    path: 'sidebar_tooltip_fixed.png',
    clip: { x: 0, y: 70, width: 320, height: 420 }
  });

  // Check computed styles of tooltip
  const tooltipStyle = await desktopPage.evaluate(() => {
    const el = document.querySelectorAll('aside nav button div.sidebar-tooltip')[2];
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    const s1 = el.children[0];
    const s2 = el.children[1];
    return {
      tooltipBg: cs.backgroundColor,
      tooltipColor: cs.color,
      s1Text: s1.innerText,
      s1Bg: window.getComputedStyle(s1).backgroundColor,
      s1Color: window.getComputedStyle(s1).color,
      s1Fill: window.getComputedStyle(s1).webkitTextFillColor,
      s2Text: s2.innerText,
      s2Bg: window.getComputedStyle(s2).backgroundColor,
      s2Color: window.getComputedStyle(s2).color
    };
  });
  console.log('Fixed Tooltip Verification:', JSON.stringify(tooltipStyle, null, 2));

  // 2. Mobile Suite (iPhone 14 / 390x844)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  });

  await mobilePage.goto('http://localhost:3000/scanner', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot 1: Mobile Venta (POS)
  await mobilePage.screenshot({ path: 'mobile_tab_venta.png' });

  // Click on "Stock" in bottom navigation
  await mobilePage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button, footer button, button'));
    const stockBtn = btns.find(b => b.textContent && b.textContent.includes('Stock'));
    if (stockBtn) stockBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot 2: Mobile Stock / Catálogo
  await mobilePage.screenshot({ path: 'mobile_tab_stock.png' });

  // Click on "Balanza"
  await mobilePage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button, footer button, button'));
    const balanzaBtn = btns.find(b => b.textContent && b.textContent.includes('Balanza'));
    if (balanzaBtn) balanzaBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Screenshot 3: Mobile Balanza
  await mobilePage.screenshot({ path: 'mobile_tab_balanza.png' });

  await browser.close();
  console.log('Mobile Suite Captures Done!');
})();
