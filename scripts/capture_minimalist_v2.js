const puppeteer = require('c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/dashboard/pos', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  // Clic en el botón "Minimalista" en la barra de vistas
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const minBtn = buttons.find(b => b.textContent && b.textContent.includes('Minimalista'));
    if (minBtn) minBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot modo Claro Minimalista
  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/pos_minimalist_theme_v2_light.png' });
  console.log('CAPTURED: pos_minimalist_theme_v2_light.png');

  // Alternar a modo oscuro si hay botón de tema o toggle dark class
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/pos_minimalist_theme_v2_dark.png' });
  console.log('CAPTURED: pos_minimalist_theme_v2_dark.png');

  await browser.close();
})().catch(e => console.error(e));
