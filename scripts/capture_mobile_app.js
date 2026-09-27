const puppeteer = require('c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/scanner', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/mobile_scanner_light.png' });
  console.log('CAPTURED: mobile_scanner_light.png');

  // Toggle dark mode
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/mobile_scanner_dark.png' });
  console.log('CAPTURED: mobile_scanner_dark.png');

  await browser.close();
})().catch(e => console.error(e));
