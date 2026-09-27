const puppeteer = require('c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/dashboard/pos', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('aside nav button');
  const btns = await page.$$('aside nav button');
  await btns[2].hover();
  await new Promise(r => setTimeout(r, 400));

  const details = await page.evaluate(() => {
    const tooltip = document.querySelectorAll('aside nav button div.absolute')[2];
    const s1 = tooltip.children[0];
    
    const matchedRules = [];
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (const r of rules) {
          if (r.selectorText && s1.matches(r.selectorText)) {
            if (r.style && (r.style.backgroundColor || r.style.background)) {
              matchedRules.push({
                selector: r.selectorText,
                bg: r.style.backgroundColor || r.style.background,
                css: r.cssText
              });
            }
          }
        }
      } catch(e) {}
    }
    return matchedRules;
  });

  console.log(JSON.stringify(details, null, 2));
  await browser.close();
})();
