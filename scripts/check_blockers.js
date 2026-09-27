const puppeteer = require('c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 892, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/scanner', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  const blockers = await page.evaluate(() => {
    const el1 = document.elementFromPoint(200, 400);
    const el2 = document.elementFromPoint(200, 850);
    const zIndexes = [];
    document.querySelectorAll('*').forEach(el => {
      const z = window.getComputedStyle(el).zIndex;
      if (z && !isNaN(parseInt(z)) && parseInt(z) > 10) {
        zIndexes.push({ tag: el.tagName, className: el.className, z: parseInt(z) });
      }
    });
    return {
      atCenter: { tag: el1?.tagName, className: el1?.className },
      atBottom: { tag: el2?.tagName, className: el2?.className },
      highZ: zIndexes.slice(0, 10)
    };
  });
  console.log('Blocker analysis:', JSON.stringify(blockers, null, 2));
  await browser.close();
})();
