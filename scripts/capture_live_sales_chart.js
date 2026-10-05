const puppeteer = require('puppeteer');
const os = require('os');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\pcpro\\.gemini\\antigravity-ide\\brain\\a0044775-5462-4f22-95cd-0bcb2628ced6';

(async () => {
  console.log('🚀 Capturando vista en vivo con Gráficos WOW...');

  const tmpDir = path.join(os.tmpdir(), 'pptr_edge_chart_' + Date.now());
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  const browser = await puppeteer.launch({
    executablePath: fs.existsSync(edgePath) ? edgePath : undefined,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--user-data-dir=${tmpDir}`]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 2 });
  
  console.log('Navegando a http://localhost:3000/tablet-pos...');
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('klikpos_onboarding_completed', 'true');
  });
  await page.goto('http://localhost:3000/tablet-pos', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Sembrar ventas demostrativas para que el gráfico brille con el efecto WOW
  await page.evaluate(async () => {
    // Acceder a indexedDB Dexie
    const req = indexedDB.open('VenematicDB');
    req.onsuccess = (e) => {
      const idb = e.target.result;
      if (!idb.objectStoreNames.contains('sales')) return;
      const tx = idb.transaction('sales', 'readwrite');
      const store = tx.objectStore('sales');
      
      const now = new Date();
      const todayISO = now.toISOString().slice(0, 10);
      
      const sampleSales = [
        {
          receiptNumber: 'TKT-101',
          timestamp: `${todayISO}T09:30:00Z`,
          totalUSD: 16.50,
          totalVES: 16.50 * 871.37,
          bcvRate: 871.37,
          payments: [{ method: 'cash_usd', amountUSD: 16.50, amountVES: 0 }],
          items: [{ name: 'Combo 4 Perros + Refresco', qty: 2, priceUSD: 8.25, totalUSD: 16.50 }]
        },
        {
          receiptNumber: 'TKT-102',
          timestamp: `${todayISO}T13:15:00Z`,
          totalUSD: 42.00,
          totalVES: 42.00 * 871.37,
          bcvRate: 871.37,
          payments: [{ method: 'pago_movil', amountUSD: 42.00, amountVES: 42.00 * 871.37 }],
          items: [{ name: 'Hamburguesa Doble Especial', qty: 4, priceUSD: 10.50, totalUSD: 42.00 }]
        },
        {
          receiptNumber: 'TKT-103',
          timestamp: `${todayISO}T17:45:00Z`,
          totalUSD: 24.50,
          totalVES: 24.50 * 871.37,
          bcvRate: 871.37,
          payments: [{ method: 'card_debit', amountUSD: 24.50, amountVES: 24.50 * 871.37 }],
          items: [{ name: 'Cachapa con Cochino', qty: 3, priceUSD: 8.16, totalUSD: 24.50 }]
        },
        {
          receiptNumber: 'TKT-104',
          timestamp: `${todayISO}T21:00:00Z`,
          totalUSD: 58.00,
          totalVES: 58.00 * 871.37,
          bcvRate: 871.37,
          payments: [
            { method: 'cash_usd', amountUSD: 30.00, amountVES: 0 },
            { method: 'zelle', amountUSD: 28.00, amountVES: 0 }
          ],
          items: [{ name: 'Salchipapa Familiar + Refrescos', qty: 2, priceUSD: 29.00, totalUSD: 58.00 }]
        }
      ];

      sampleSales.forEach(s => store.put(s));
    };
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Clickeando botón Respaldo en Navbar inferior...');
  await page.evaluate(() => {
    // Si hay algún botón de cerrar o modal abierto, cerrarlo
    const closeBtns = Array.from(document.querySelectorAll('button'));
    const xBtn = closeBtns.find(b => b.querySelector('svg.lucide-x') || b.textContent === 'X' || (b.title && b.title.includes('Cerrar')));
    if (xBtn) xBtn.click();

    // Clic directo al botón Respaldo
    const respaldoBtn = document.querySelector('button[data-tab="respaldo"]');
    if (respaldoBtn) respaldoBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const chartImg = path.join(ARTIFACTS_DIR, 'live_sales_chart_wow.png');
  await page.screenshot({ path: chartImg });
  console.log(`✅ Captura guardada: ${chartImg}`);

  await browser.close();
})();
