const puppeteer = require('c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/node_modules/puppeteer');

(async () => {
  const os = require('os');
  const path = require('path');
  const tmpDir = path.join(os.tmpdir(), 'pptr_edge_test_' + Date.now());
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--user-data-dir=${tmpDir}`]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/dashboard/pos', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Capture Header Clock
  await page.screenshot({
    path: 'header_clock_verified.png',
    clip: { x: 900, y: 0, width: 540, height: 80 }
  });

  // 2. Switch to Dark/Glass mode to capture calculator numpad
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'glass');
    document.documentElement.setAttribute('data-ui-style', 'glassmorphism');
    document.documentElement.classList.add('dark');
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({
    path: 'pos_calculator_dark_glass_verified.png',
    clip: { x: 1000, y: 350, width: 440, height: 350 }
  });

  // 3. Capture Full Mobile View (390x844)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await mobilePage.goto('http://localhost:3000/scanner', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  await mobilePage.screenshot({ path: 'mobile_full_edge_view.png' });

  await browser.close();
  console.log('Verification screenshots captured!');
})();
