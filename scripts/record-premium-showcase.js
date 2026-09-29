const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'DISTRIBUCION_KLIKPOS', '00_Recursos_Marketing_Videos');

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🎬 Iniciando sesión de grabación y renderizado cinemático...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();

  // Función para inyectar animación CSS de acercamiento suave (Ken Burns / Pan Zoom)
  async function applySmoothZoomEffect(targetSelector, scale = 1.08, origin = 'center center', duration = '3s') {
    await page.evaluate((sel, sc, orig, dur) => {
      const el = sel ? document.querySelector(sel) : document.body;
      if (el) {
        el.style.transition = `transform ${dur} cubic-bezier(0.25, 1, 0.5, 1), filter ${dur} ease-in-out`;
        el.style.transformOrigin = orig;
        el.style.transform = `scale(${sc})`;
      }
    }, targetSelector, scale, origin, duration);
  }

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Escena 1: POS Overview & Catálogo 4K
  console.log('📸 Capturando Escena 1: POS Principal...');
  await page.goto('http://localhost:3000/dashboard/pos', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_POS_General_HD.png'), fullPage: false });

  // Zoom suave sobre el catálogo y Balanza
  await applySmoothZoomEffect(null, 1.12, 'top left', '2s');
  await delay(2200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_POS_Zoom_Catalogo_Balanza.png') });

  // Reset zoom
  await applySmoothZoomEffect(null, 1.0, 'center center', '1s');
  await delay(1200);

  // Escena 2: Simular agregar producto y zoom en el Carrito Multimoneda
  console.log('📸 Capturando Escena 2: Carrito y Totales Multimoneda...');
  // Zoom sobre panel derecho (carrito / totales)
  await applySmoothZoomEffect(null, 1.18, 'top right', '2s');
  await delay(2200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_POS_Zoom_Carrito_Multimoneda.png') });

  // Reset zoom
  await applySmoothZoomEffect(null, 1.0, 'center center', '1s');
  await delay(1000);

  // Escena 3: Pantalla de Planes SaaS & Licenciamiento
  console.log('📸 Capturando Escena 3: Planes SaaS (Lite, Pro, Elite)...');
  await page.goto('http://localhost:3000/dashboard/licensing', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_Planes_SaaS_General.png') });

  // Zoom suave sobre las tarjetas de planes
  await applySmoothZoomEffect(null, 1.15, 'center top', '2.5s');
  await delay(2600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_Planes_SaaS_Zoom_Detalle.png') });

  // Zoom hacia la sección de soporte WhatsApp y activación
  await applySmoothZoomEffect(null, 1.12, 'center bottom', '2s');
  await delay(2200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_Planes_Activacion_WhatsApp.png') });

  // Reset zoom
  await applySmoothZoomEffect(null, 1.0, 'center center', '1s');
  await delay(1000);

  // Escena 4: Formato Vertical para TikTok / Reels / Shorts (1080 x 1920)
  console.log('📱 Capturando tomas verticales para Reels/TikTok (1080x1920)...');
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 });
  
  await page.goto('http://localhost:3000/dashboard/pos', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_Reels_POS_Vertical.png') });

  await page.goto('http://localhost:3000/dashboard/licensing', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_Reels_Planes_Vertical.png') });

  await browser.close();
  console.log('✅ Todas las tomas cinemáticas de marketing generadas con éxito en:');
  console.log(OUTPUT_DIR);
}

main().catch(err => {
  console.error('Error generando tomas cinemáticas:', err);
  process.exit(1);
});
