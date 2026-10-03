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

  const outDir = path.join(__dirname, '..', 'scratch');

  // 1. Click en Pedidos
  await page.evaluate(() => {
    const btn = document.querySelector('button[data-tab="pedidos"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'live_pedidos_tab.png') });
  console.log('Pedidos tab captured');

  // 2. Click en Delivery
  await page.evaluate(() => {
    const btn = document.querySelector('button[data-tab="delivery"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'live_delivery_tab.png') });
  console.log('Delivery tab captured');

  // 3. Click en Docker
  await page.evaluate(() => {
    const btn = document.querySelector('button[data-tab="docker"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'live_docker_open.png') });
  console.log('Docker captured');

  await browser.close();
  console.log('All tabs audit captured successfully');
})();
