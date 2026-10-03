const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  console.log('Navegando a http://localhost:3000/tablet-pos...');
  await page.goto('http://localhost:3000/tablet-pos', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForNetworkIdle({ idleTime: 1000, timeout: 30000 }).catch(() => {});
  
  await new Promise(r => setTimeout(r, 2000));

  // Screenshot del catálogo completo con los productos street auténticos
  const screenshotPath = 'C:/Users/pcpro/.gemini/antigravity-ide/brain/8a831fb4-2143-4be1-99c4-afe4be2b6d80/catalog_street_products_live.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot guardado en:', screenshotPath);

  // Inspeccionar si las imágenes cargaron correctamente
  const imgStatus = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img')).filter(img => img.src.includes('packs/comida-street'));
    return imgs.map(img => ({
      src: img.src,
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    }));
  });
  console.log('Imágenes de productos street detectadas en el DOM:', JSON.stringify(imgStatus, null, 2));

  await browser.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
