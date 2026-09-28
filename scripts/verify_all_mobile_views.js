const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const androidPublic = path.join(root, 'venematic-desktop', 'android', 'app', 'src', 'main', 'assets', 'public');

// Servidor estático local simple
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(androidPublic, reqPath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

async function main() {
  server.listen(4892, async () => {
    console.log('Servidor de prueba corriendo en http://localhost:4892');
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      headless: 'new',
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    // 1. Probar Keygen
    fs.copyFileSync(path.join(root, 'public', 'keygen-app.html'), path.join(androidPublic, 'test-keygen.html'));
    await page.goto('http://localhost:4892/test-keygen.html', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(root, 'docs', 'screenshot_apk_keygen.png') });
    console.log('✓ Captura Keygen tomada: docs/screenshot_apk_keygen.png');

    // 2. Probar Scanner Satélite
    await page.goto('http://localhost:4892/scanner.html', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(root, 'docs', 'screenshot_apk_satelite.png') });
    console.log('✓ Captura Satélite Scanner tomada: docs/screenshot_apk_satelite.png');

    // 3. Probar Tablet POS / Móvil Full
    await page.goto('http://localhost:4892/tablet-pos.html', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(root, 'docs', 'screenshot_apk_movil_full.png') });
    console.log('✓ Captura Móvil Full tomada: docs/screenshot_apk_movil_full.png');

    await browser.close();
    server.close();
    console.log('=== VERIFICACIÓN VISUAL COMPLETADA ===');
    process.exit(0);
  });
}

main().catch(e => {
  console.error(e);
  server.close();
  process.exit(1);
});
