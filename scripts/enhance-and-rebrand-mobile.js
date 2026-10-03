const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const androidPublic = path.join(root, 'venematic-desktop', 'android', 'app', 'src', 'main', 'assets', 'public');
const tabletHtmlSrc = path.join(root, '.next', 'server', 'app', 'tablet-pos.html');
const nextStaticSrc = path.join(root, '.next', 'static');
const publicSrc = path.join(root, 'public');

console.log('=== SINCRONIZANDO TABLET POS AUTÓNOMO A ANDROID ASSETS ===');

if (!fs.existsSync(tabletHtmlSrc)) {
  throw new Error(`No se encontró el HTML compilado de tablet-pos en: ${tabletHtmlSrc}. Ejecuta 'npm run build' primero.`);
}

// 1. Limpiar completamente assets/public para asegurar frescura absoluta
if (fs.existsSync(androidPublic)) {
  fs.rmSync(androidPublic, { recursive: true, force: true });
}
fs.mkdirSync(androidPublic, { recursive: true });

// 2. Estilo de Arranque Rápido para WebView (0ms splash oscuro sin romper cambio de tema)
const darkShieldHeadStyle = `
  <style id="klikpos-street-dark-shield">
    :root:not([data-theme="light"]):not([data-canvas="light-graphite"]),
    :root:not([data-theme="light"]):not([data-canvas="light-graphite"]) body {
      background-color: #040711;
      color: #f8fafc;
      color-scheme: dark;
    }
  </style>
</head>`;

// 2. Leer tablet-pos.html e inyectar blindaje dark
let html = fs.readFileSync(tabletHtmlSrc, 'utf8');
html = html.replace(/<title>.*?<\/title>/, '<title>KlikPOS Street v1.0</title>');
html = html.replace('</head>', darkShieldHeadStyle);

// Guardar como index.html y tablet-pos.html
fs.writeFileSync(path.join(androidPublic, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(androidPublic, 'tablet-pos.html'), html, 'utf8');
console.log('✓ Guardado tablet-pos como index.html y tablet-pos.html con Blindaje Dark Inyectado (' + html.length + ' bytes)');

// 2b. Copiar scanner.html si existe
const scannerHtmlSrc = path.join(root, '.next', 'server', 'app', 'scanner.html');
if (fs.existsSync(scannerHtmlSrc)) {
  let scannerHtml = fs.readFileSync(scannerHtmlSrc, 'utf8');
  scannerHtml = scannerHtml.replace('</head>', darkShieldHeadStyle);
  fs.writeFileSync(path.join(androidPublic, 'scanner.html'), scannerHtml, 'utf8');
  console.log('✓ Guardado scanner.html en assets/public/ (' + scannerHtml.length + ' bytes)');
}

// 2c. Copiar menu.html si existe
const menuHtmlSrc = path.join(root, '.next', 'server', 'app', 'menu.html');
if (fs.existsSync(menuHtmlSrc)) {
  let menuHtml = fs.readFileSync(menuHtmlSrc, 'utf8');
  menuHtml = menuHtml.replace('</head>', darkShieldHeadStyle);
  fs.writeFileSync(path.join(androidPublic, 'menu.html'), menuHtml, 'utf8');
  console.log('✓ Guardado menu.html en assets/public/ (' + menuHtml.length + ' bytes)');
}

// 3. Copiar .next/static actualizado
const nextStaticDest = path.join(androidPublic, '_next', 'static');
fs.cpSync(nextStaticSrc, nextStaticDest, { recursive: true, force: true });
console.log('✓ Sincronizado .next/static a assets/public/_next/static');

// 4. Copiar assets de public/ (logos, favicon, version-street.json, etc.)
fs.cpSync(publicSrc, androidPublic, { recursive: true, force: true });
console.log('✓ Sincronizado public/* a assets/public/');

console.log('=== SINCRONIZACIÓN MÓVIL FULL FINALIZADA CON ÉXITO ===');
