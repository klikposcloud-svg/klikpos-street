const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (!fs.existsSync(edgePath)) {
    console.error('Edge executable not found at:', edgePath);
    process.exit(1);
  }

  console.log('Launching Edge...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1024,768']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });

  console.log('Navigating to http://localhost:3000/tablet-pos ...');
  try {
    await page.goto('http://localhost:3000/tablet-pos', { waitUntil: 'networkidle2', timeout: 25000 });
  } catch (e) {
    console.warn('Navigation warning:', e.message);
  }

  // Esperar 1.5s para asegurar que cualquier animación termine
  await new Promise(r => setTimeout(r, 1500));

  const outDir = path.join(__dirname, '..', 'scratch');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const screenshotPath = path.join(outDir, 'live_street_view.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Main view screenshot saved to:', screenshotPath);

  // Ahora probemos hacer click en "Cobro" o navegar al tab de cobro para validar el checkout
  try {
    const cobroBtn = await page.$('button[data-tab="acciones"]');
    // Naveguemos a cobro directamente en el state si es posible
    await page.evaluate(() => {
      // Buscar botón de cobrar o invocar cambio de tab si existe
      const btns = Array.from(document.querySelectorAll('button'));
      const cobrar = btns.find(b => b.textContent && b.textContent.includes('Cobrar'));
      if (cobrar) cobrar.click();
    });
    await new Promise(r => setTimeout(r, 800));
    const cobroScreenshot = path.join(outDir, 'live_cobro_view.png');
    await page.screenshot({ path: cobroScreenshot });
    console.log('Cobro view screenshot saved to:', cobroScreenshot);
  } catch (err) {
    console.warn('Could not capture cobro tab:', err.message);
  }

  await browser.close();
  console.log('Visual audit capture complete!');
})();
