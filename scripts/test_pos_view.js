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
  
  // Esperar a que IndexedDB cargue los productos
  console.log('Esperando carga de catálogo...');
  await page.waitForFunction(() => {
    const text = document.body.innerText;
    return text.includes('Hamburguesas') || text.includes('Víveres') || text.includes('Todos') || document.querySelectorAll('button').length > 20;
  }, { timeout: 15000 }).catch(() => {});

  await new Promise(r => setTimeout(r, 2000));

  // Clic en el botón "Minimalista"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const minBtn = buttons.find(b => b.textContent && b.textContent.includes('Minimalista'));
    if (minBtn) minBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/pos_minimalist_final_light.png' });
  console.log('CAPTURED: pos_minimalist_final_light.png');

  // Modo Oscuro
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/pos_minimalist_final_dark.png' });
  console.log('CAPTURED: pos_minimalist_final_dark.png');

  await browser.close();
})().catch(e => console.error(e));
