const puppeteer = require('puppeteer');

(async () => {
  console.log('Iniciando verificación de botones Sincronizar Data y Actualizar Software...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/tablet-pos', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForNetworkIdle({ idleTime: 1000, timeout: 30000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  // 1. Captura del Header con los dos nuevos botones visibles
  const headerScreenshot = 'C:/Users/pcpro/.gemini/antigravity-ide/brain/8a831fb4-2143-4be1-99c4-afe4be2b6d80/header_with_sync_and_update_live.png';
  await page.screenshot({ path: headerScreenshot });
  console.log('✓ Captura del Header guardada en:', headerScreenshot);

  // 2. Abrir Modal de Sincronizar Data
  console.log('Abriendo modal de Sincronizar Data...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const syncBtn = btns.find(b => b.textContent && b.textContent.includes('Sincronizar Data'));
    if (syncBtn) syncBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const syncModalScreenshot = 'C:/Users/pcpro/.gemini/antigravity-ide/brain/8a831fb4-2143-4be1-99c4-afe4be2b6d80/sync_data_modal_live.png';
  await page.screenshot({ path: syncModalScreenshot });
  console.log('✓ Captura de Modal Sincronizar Data guardada en:', syncModalScreenshot);

  // Cerrar modal de sincronización
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find(b => b.textContent && b.textContent.includes('Cerrar'));
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // 3. Abrir Modal de Actualizar Software
  console.log('Abriendo modal de Actualizar Software...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const updateBtn = btns.find(b => b.textContent && b.textContent.includes('Actualizar Software'));
    if (updateBtn) updateBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const updateModalScreenshot = 'C:/Users/pcpro/.gemini/antigravity-ide/brain/8a831fb4-2143-4be1-99c4-afe4be2b6d80/software_update_modal_live.png';
  await page.screenshot({ path: updateModalScreenshot });
  console.log('✓ Captura de Modal Actualizar Software guardada en:', updateModalScreenshot);

  await browser.close();
  console.log('¡Verificación completa exitosa!');
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
