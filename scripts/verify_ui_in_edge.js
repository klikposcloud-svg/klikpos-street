const puppeteer = require('puppeteer');
const os = require('os');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\pcpro\\.gemini\\antigravity-ide\\brain\\58590ab9-a190-4a6a-b4d8-221049533012';

(async () => {
  console.log('🚀 Iniciando verificación de UI en Microsoft Edge en vivo...');

  const tmpDir = path.join(os.tmpdir(), 'pptr_edge_ui_' + Date.now());
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  const browser = await puppeteer.launch({
    executablePath: fs.existsSync(edgePath) ? edgePath : undefined,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--user-data-dir=${tmpDir}`]
  });

  const page = await browser.newPage();
  
  // 1. Tablet POS (1024x768)
  await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 2 });
  console.log('📱 Navegando a http://localhost:3000/tablet-pos en Edge (1024x768)...');
  await page.goto('http://localhost:3000/tablet-pos', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));

  // 2. Abrir Docker Vertical Pill Flotante
  console.log('✨ Abriendo Docker Vertical Pill Flotante...');
  await page.evaluate(() => {
    // Click on the collapsed DOCK pill
    const dockBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('DOCK'));
    if (dockBtn) dockBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  const pathDock = path.join(ARTIFACTS_DIR, 'edge_tablet_pos_docker_open.png');
  await page.screenshot({ path: pathDock });
  console.log(`✅ Captura 2 (Docker Vertical Pill Abierto) guardada: ${pathDock}`);

  // 3. Abrir Modal QR desde el Docker
  console.log('📲 Clickeando Icono QR desde el Docker...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const qrBtn = buttons.find(b => b.title && b.title.includes('Menú Digital QR'));
    if (qrBtn) qrBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  const pathQr = path.join(ARTIFACTS_DIR, 'edge_tablet_pos_qr_modal.png');
  await page.screenshot({ path: pathQr });
  console.log(`✅ Captura 3 (Modal QR) guardada: ${pathQr}`);

  // 4. Vista Móvil (412x890) para validar Navbar con Botón Cobrar Hero +20%
  console.log('📱 Navegando en Vista Móvil (412x890)...');
  await page.setViewport({ width: 412, height: 890, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 1000));
  const pathMobile = path.join(ARTIFACTS_DIR, 'edge_mobile_pos_elastic_nav.png');
  await page.screenshot({ path: pathMobile });
  console.log(`✅ Captura 4 (Móvil Navbar) guardada: ${pathMobile}`);

  // 5. Vista del Menú Digital para Clientes (/menu)
  console.log('🍔 Navegando a http://localhost:3000/menu en Edge...');
  await page.goto('http://localhost:3000/menu', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));
  const pathMenu = path.join(ARTIFACTS_DIR, 'edge_menu_digital_cliente.png');
  await page.screenshot({ path: pathMenu });
  console.log(`✅ Captura 5 (Menú Digital) guardada: ${pathMenu}`);

  await browser.close();
  console.log('🎉 Verificación en Microsoft Edge completada con éxito.');
})();
