const puppeteer = require('c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/dashboard/pos', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2500));

  // Si aún no han cargado productos por IndexedDB inicial, recargar una vez
  const hasProducts = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.some(b => b.classList.contains('pos-minimal-card') || b.classList.contains('pos-white-card'));
  });

  if (!hasProducts) {
    console.log('Esperando hidratación y recargando catálogo...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2500));
  }

  // Clic en el botón "Minimalista"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const minBtn = buttons.find(b => b.textContent && b.textContent.includes('Minimalista'));
    if (minBtn) minBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Capturar vista en Modo Claro con Sidebar Compacto, Categorías Arriba y Cards Holgadas
  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/pos_minimalist_spacious_light.png' });
  console.log('CAPTURED: pos_minimalist_spacious_light.png');

  // Alternar a Modo Oscuro
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await new Promise(r => setTimeout(r, 1000));

  // Capturar vista en Modo Oscuro
  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/pos_minimalist_spacious_dark.png' });
  console.log('CAPTURED: pos_minimalist_spacious_dark.png');

  await browser.close();
})().catch(e => console.error(e));
