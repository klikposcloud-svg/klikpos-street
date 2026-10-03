const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1024,768']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });

  await page.goto('http://localhost:3000/tablet-pos', { waitUntil: 'networkidle2', timeout: 25000 });
  await new Promise(r => setTimeout(r, 1000));

  // Ir a Cobro
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cobrar = btns.find(b => b.textContent && b.textContent.includes('Cobrar'));
    if (cobrar) cobrar.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Hacer scroll en el contenedor con overflow
  await page.evaluate(() => {
    const scrollable = document.querySelector('.overflow-y-auto') || window;
    if (scrollable.scrollTo) {
      scrollable.scrollTo({ top: 1000, behavior: 'instant' });
    }
    // Tambien intentar buscar todos los scrollable containers
    document.querySelectorAll('*').forEach(el => {
      if (el.scrollHeight > el.clientHeight) {
        el.scrollTop = el.scrollHeight;
      }
    });
  });

  await new Promise(r => setTimeout(r, 500));

  const outDir = path.join(__dirname, '..', 'scratch');
  const scrollScreenshot = path.join(outDir, 'live_cobro_scrolled.png');
  await page.screenshot({ path: scrollScreenshot });
  console.log('Scrolled Cobro screenshot saved to:', scrollScreenshot);

  await browser.close();
})();
