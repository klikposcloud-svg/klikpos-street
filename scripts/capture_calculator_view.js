const puppeteer = require('c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/node_modules/puppeteer');
const os = require('os');
const path = require('path');

(async () => {
  const tmpDir = path.join(os.tmpdir(), 'pptr_calc_' + Date.now());
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--user-data-dir=${tmpDir}`]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/dashboard/pos', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Capture Header Clock (Full)
  await page.screenshot({
    path: 'header_clock_perfect.png',
    clip: { x: 800, y: 0, width: 640, height: 75 }
  });

  // 2. Set theme to Glassmorphism
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'glass');
    document.documentElement.setAttribute('data-ui-style', 'glassmorphism');
    document.documentElement.classList.add('dark');
  });
  await new Promise(r => setTimeout(r, 600));

  // Find numpad position
  const numpadRect = await page.evaluate(() => {
    const el = document.querySelector('div.grid.grid-cols-4');
    if (!el) return null;
    const parent = el.closest('div.pos-white-card') || el.parentElement;
    const r = parent.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });

  console.log('Numpad Rect:', numpadRect);

  if (numpadRect) {
    await page.screenshot({
      path: 'calculator_glass_perfect.png',
      clip: {
        x: Math.max(0, numpadRect.x - 10),
        y: Math.max(0, numpadRect.y - 10),
        width: Math.min(1440, numpadRect.width + 20),
        height: Math.min(900, numpadRect.height + 20)
      }
    });
  }

  // 3. Set theme to Dark (Azul Marino profundo)
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('data-ui-style', 'industrial');
    document.documentElement.classList.add('dark');
  });
  await new Promise(r => setTimeout(r, 600));

  if (numpadRect) {
    await page.screenshot({
      path: 'calculator_dark_perfect.png',
      clip: {
        x: Math.max(0, numpadRect.x - 10),
        y: Math.max(0, numpadRect.y - 10),
        width: Math.min(1440, numpadRect.width + 20),
        height: Math.min(900, numpadRect.height + 20)
      }
    });
  }

  await browser.close();
  console.log('Finished capturing calculator and clock!');
})();
