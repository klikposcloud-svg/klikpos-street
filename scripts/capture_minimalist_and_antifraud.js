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

  // Clic en el primer card de producto para agregar al carrito
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('button.pos-white-card'));
    if (cards.length > 0) cards[0].click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Abrir Modal de Cobro pulsando el botón de cobrar
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const payBtn = buttons.find(b => b.textContent && b.textContent.includes('COBRAR VENTA'));
    if (payBtn) payBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Seleccionar Pago Móvil
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const pmBtn = buttons.find(b => b.textContent && b.textContent.includes('Pago Móvil'));
    if (pmBtn) pmBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Escribir referencia
  const refInput = await page.$('input[placeholder*="00123456789"]');
  if (refInput) {
    await refInput.type('98765432');
  }
  await new Promise(r => setTimeout(r, 800));

  // Screenshot del Modal de Cobro con el Escudo Antifraude en Vivo
  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/pos_antifraud_badge.png' });
  console.log('CAPTURED: pos_antifraud_badge.png');

  await browser.close();
})().catch(e => console.error(e));
