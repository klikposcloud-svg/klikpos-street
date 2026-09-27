const puppeteer = require('c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/node_modules/puppeteer');
const os = require('os');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\pcpro\\.gemini\\antigravity-ide\\brain\\68b7f349-bb9c-4c0d-a3d6-76560e054f4f';

(async () => {
  const tmpDir = path.join(os.tmpdir(), 'pptr_brand_' + Date.now());
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--user-data-dir=${tmpDir}`]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 890, deviceScaleFactor: 2 });

  console.log('Navigating to http://localhost:3000/tablet-pos...');
  await page.goto('http://localhost:3000/tablet-pos', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // 1. VISTA 1: FOOD CON CARDS GRANDES (Modo Blanco Oficial + Grafito)
  console.log('Capturing Brand White Food View...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'tablet_pos_brand_white_food.png') });

  // 2. VISTA 2: CUADRÍCULA
  console.log('Capturing Brand White Cuadrícula...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Cuadrícula'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'tablet_pos_brand_white_cuadricula.png') });

  // 3. VISTA 3: LISTA
  console.log('Capturing Brand White Lista...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Lista'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'tablet_pos_brand_white_lista.png') });

  // 4. VISTA 4: MINIMALISTA
  console.log('Capturing Brand White Minimalista...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Minimalista'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'tablet_pos_brand_white_minimalista.png') });

  // 5. DRAWER DE AJUSTES CON SELECTOR DE BRANDING DE COLORES
  console.log('Capturing Brand Settings Drawer with Color Branding...');
  await page.evaluate(() => {
    const btnAjustes = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Ajustes'));
    if (btnAjustes) btnAjustes.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'tablet_pos_settings_color_branding.png') });

  await browser.close();
  console.log('All captures with official branding completed successfully!');
})();
