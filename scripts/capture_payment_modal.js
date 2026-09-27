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

  // Escanear 0206
  await page.keyboard.type('0206');
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 800));

  // Clic en COBRAR VENTA
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pay = btns.find(b => b.textContent && b.textContent.includes('COBRAR VENTA'));
    if (pay) pay.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Clic en Pago Móvil
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pm = btns.find(b => b.textContent && b.textContent.includes('Pago Móvil'));
    if (pm) pm.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Escribir referencia
  const input = await page.$('input[placeholder*="00123456789"]');
  if (input) {
    await input.type('76543210');
  }
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: 'C:/Users/pcpro/.gemini/antigravity-ide/brain/68b7f349-bb9c-4c0d-a3d6-76560e054f4f/pos_antifraud_badge.png' });
  console.log('CAPTURED_SUCCESS: pos_antifraud_badge.png');

  await browser.close();
})().catch(e => console.error(e));
