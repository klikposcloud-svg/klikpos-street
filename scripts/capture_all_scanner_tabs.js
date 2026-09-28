const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const androidPublic = path.join(root, 'venematic-desktop', 'android', 'app', 'src', 'main', 'assets', 'public');

// Servidor estático local instantáneo
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '/scanner') reqPath = '/scanner.html';
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
  server.listen(4895, async () => {
    console.log('Servidor corriendo en http://localhost:4895');
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      headless: 'new',
      args: ['--no-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    await page.goto('http://localhost:4895/scanner.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // 1. Captura Tab Venta
    await page.screenshot({ path: path.join(root, 'docs', 'movil_tab1_venta.png') });
    console.log('✓ Tab Venta capturado: docs/movil_tab1_venta.png');

    // 2. Click en Tab Stock / Inventario
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const stockBtn = btns.find(b => b.textContent.includes('Stock') || b.textContent.includes('Inventario'));
      if (stockBtn) stockBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(root, 'docs', 'movil_tab2_stock.png') });
    console.log('✓ Tab Stock / Inventario capturado: docs/movil_tab2_stock.png');

    // 3. Click en Tab Balanza
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const balanzaBtn = btns.find(b => b.textContent.includes('Balanza'));
      if (balanzaBtn) balanzaBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(root, 'docs', 'movil_tab3_balanza.png') });
    console.log('✓ Tab Balanza capturado: docs/movil_tab3_balanza.png');

    // 4. Click en Tab +Artículo
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const artBtn = btns.find(b => b.textContent.includes('+Artículo') || b.textContent.includes('Artículo'));
      if (artBtn) artBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(root, 'docs', 'movil_tab4_articulo.png') });
    console.log('✓ Tab +Artículo capturado: docs/movil_tab4_articulo.png');

    await browser.close();
    server.close();
    console.log('=== CAPTURAS DE TODAS LAS VISTAS FINALIZADAS CON ÉXITO ===');
    process.exit(0);
  });
}

main().catch(e => {
  console.error(e);
  server.close();
  process.exit(1);
});
