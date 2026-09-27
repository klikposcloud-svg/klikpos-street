const puppeteer = require('c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/node_modules/puppeteer');
const os = require('os');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\pcpro\\.gemini\\antigravity-ide\\brain\\68b7f349-bb9c-4c0d-a3d6-76560e054f4f';

(async () => {
  const tmpDir = path.join(os.tmpdir(), 'pptr_pos_' + Date.now());
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

  // 1. VISTA FOOD (Cards Grandes)
  console.log('Capturing Food View...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'tablet_pos_view_food.png') });

  // 2. VISTA CUADRÍCULA
  console.log('Capturing Cuadrícula View...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Cuadrícula'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'tablet_pos_view_cuadricula.png') });

  // 3. VISTA LISTA
  console.log('Capturing Lista View...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Lista'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'tablet_pos_view_lista.png') });

  // 4. VISTA MINIMALISTA
  console.log('Capturing Minimalista View...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Minimalista'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'tablet_pos_view_minimalista.png') });

  // 5. MODAL DE PERSONALIZACIÓN / NOTAS (volver a Food y abrir modal)
  console.log('Capturing Customizer Modal...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btnFood = buttons.find(b => b.textContent && b.textContent.includes('Food'));
    if (btnFood) btnFood.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const noteBtn = document.querySelector('button[title*="Personalizar"]');
    if (noteBtn) noteBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'tablet_pos_view_food_notes_modal.png') });

  // 6. VISTA TABLET (820x1180)
  console.log('Capturing Tablet Food View...');
  await page.evaluate(() => {
    // Cerrar modal de notas si está abierto
    const closeBtns = Array.from(document.querySelectorAll('button'));
    const xBtn = closeBtns.find(b => b.innerHTML.includes('svg') && b.closest('.fixed'));
    if (xBtn) xBtn.click();
  });
  await page.setViewport({ width: 820, height: 1180, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'tablet_pos_view_food_tablet.png') });

  await browser.close();
  console.log('All 4 views captured successfully!');
})();
