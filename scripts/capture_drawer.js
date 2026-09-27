const puppeteer = require('c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/node_modules/puppeteer');
const os = require('os');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\pcpro\\.gemini\\antigravity-ide\\brain\\68b7f349-bb9c-4c0d-a3d6-76560e054f4f';

(async () => {
  const tmpDir = path.join(os.tmpdir(), 'pptr_drw_' + Date.now());
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--user-data-dir=${tmpDir}`]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 890, deviceScaleFactor: 2 });

  await page.goto('http://localhost:3000/tablet-pos', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  // Clic en el botón Ajustes usando el selector de título
  await page.evaluate(() => {
    const btn = document.querySelector('button[title*="Ajustes"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'tablet_pos_settings_color_branding.png') });

  await browser.close();
  console.log('Settings drawer captured!');
})();
