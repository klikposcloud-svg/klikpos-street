const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Inspect Desktop Sidebar Tooltip
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto('http://localhost:3000/dashboard/pos', { waitUntil: 'networkidle2' });

  // Wait for sidebar
  await page.waitForSelector('aside nav button');
  const buttons = await page.$$('aside nav button');
  console.log('Found sidebar buttons:', buttons.length);

  if (buttons.length >= 3) {
    // Hover over the 3rd button (Ventas)
    await buttons[2].hover();
    await new Promise(r => setTimeout(r, 600));

    // Get computed style of the tooltip
    const tooltipInfo = await page.evaluate(() => {
      const tooltips = document.querySelectorAll('aside nav button div.absolute');
      const results = [];
      tooltips.forEach((t, i) => {
        const style = window.getComputedStyle(t);
        const children = Array.from(t.children).map(c => {
          const cs = window.getComputedStyle(c);
          return {
            tag: c.tagName,
            text: c.innerText,
            className: c.className,
            color: cs.color,
            bgColor: cs.backgroundColor,
            boxShadow: cs.boxShadow
          };
        });
        results.push({
          index: i,
          opacity: style.opacity,
          color: style.color,
          bgColor: style.backgroundColor,
          border: style.borderColor,
          children
        });
      });
      return results;
    });

    console.log('Tooltip Info:', JSON.stringify(tooltipInfo, null, 2));

    await page.screenshot({ path: 'sidebar_tooltip_debug.png', clip: { x: 0, y: 50, width: 350, height: 450 } });
  }

  // 2. Capture Live Mobile Version (KlikPOS Móvil)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  });

  await mobilePage.goto('http://localhost:3000/scanner', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  await mobilePage.screenshot({ path: 'mobile_live_interface.png', fullPage: false });

  // Click on "Catálogo" or "Inventario" tab to capture catalog
  const tabButtons = await mobilePage.$$('nav button, header button, div button');
  for (const b of tabButtons) {
    const text = await mobilePage.evaluate(el => el.textContent, b);
    if (text && (text.includes('Inventario') || text.includes('Catálogo') || text.includes('Productos'))) {
      await b.click();
      await new Promise(r => setTimeout(r, 800));
      break;
    }
  }

  await mobilePage.screenshot({ path: 'mobile_live_catalog.png', fullPage: false });

  await browser.close();
  console.log('Done screenshots!');
})();
