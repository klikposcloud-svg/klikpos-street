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

// 1. Asegurar directorio assets/public
fs.mkdirSync(androidPublic, { recursive: true });

// 2. Copiar tablet-pos.html como index.html y tablet-pos.html
let html = fs.readFileSync(tabletHtmlSrc, 'utf8');
html = html.replace(/<title>.*?<\/title>/, '<title>KlikPOS Móvil Enterprise</title>');
fs.writeFileSync(path.join(androidPublic, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(androidPublic, 'tablet-pos.html'), html, 'utf8');
console.log('✓ Guardado tablet-pos como index.html y tablet-pos.html (' + html.length + ' bytes)');

// 2b. Copiar scanner.html si existe
const scannerHtmlSrc = path.join(root, '.next', 'server', 'app', 'scanner.html');
if (fs.existsSync(scannerHtmlSrc)) {
  let scannerHtml = fs.readFileSync(scannerHtmlSrc, 'utf8');
  scannerHtml = scannerHtml.replace(/<title>.*?<\/title>/, '<title>KlikPOS Móvil Scanner & Retail</title>');
  fs.writeFileSync(path.join(androidPublic, 'scanner.html'), scannerHtml, 'utf8');
  console.log('✓ Guardado scanner.html en assets/public/ (' + scannerHtml.length + ' bytes)');
}

// 3. Copiar .next/static a assets/public/_next/static
const nextStaticDest = path.join(androidPublic, '_next', 'static');
fs.cpSync(nextStaticSrc, nextStaticDest, { recursive: true, force: true });
console.log('✓ Sincronizado .next/static a assets/public/_next/static');

// 4. Copiar assets de public/ (logos, favicon, etc.)
fs.cpSync(publicSrc, androidPublic, { recursive: true, force: true });
console.log('✓ Sincronizado public/* a assets/public/');

console.log('=== SINCRONIZACIÓN MÓVIL FULL FINALIZADA CON ÉXITO ===');
