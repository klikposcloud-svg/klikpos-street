const puppeteer = require('c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Capturar POS en Modo Fast Food (Claro)
  console.log('Navegando a POS...');
  await page.goto('http://localhost:3000/dashboard/pos', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  // Cambiar a tema claro primero por si acaso
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
  });

  // Clic en el botón Comida Rápida
  const fastfoodBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent && b.textContent.includes('Comida Rápida'));
  });

  if (fastfoodBtn && fastfoodBtn.asElement()) {
    await fastfoodBtn.asElement().click();
    await new Promise(r => setTimeout(r, 800));
  }

  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/pos_fastfood_mode_light.png' });
  console.log('Capturado: pos_fastfood_mode_light.png');

  // 2. Capturar POS en Modo Oscuro (Fondo azul marino + Cards blancas)
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/pos_fastfood_mode_dark.png' });
  console.log('Capturado: pos_fastfood_mode_dark.png');

  // 3. Capturar Modal de Inventario con Precio Fijo en Bs.
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
  });
  await page.goto('http://localhost:3000/dashboard/inventory', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  // Clic en Nuevo Producto
  const newProdBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent && b.textContent.includes('Nuevo Producto'));
  });

  if (newProdBtn && newProdBtn.asElement()) {
    await newProdBtn.asElement().click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/inventory_fixed_price_modal.png' });
    console.log('Capturado: inventory_fixed_price_modal.png');
  }

  await browser.close();
  console.log('TODAS LAS CAPTURAS COMPLETADAS EXITOSAMENTE');
})().catch(err => {
  console.error('ERROR CAPTURA:', err);
  process.exit(1);
});
