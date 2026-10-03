const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const androidPublic = path.join(root, 'venematic-desktop', 'android', 'app', 'src', 'main', 'assets', 'public');
const tabletHtmlSrc = path.join(root, '.next', 'server', 'app', 'tablet-pos.html');
const nextStaticSrc = path.join(root, '.next', 'static');
const publicSrc = path.join(root, 'public');

const { execSync } = require('child_process');

console.log('=== SINCRONIZANDO TABLET POS AUTÓNOMO A ANDROID ASSETS ===');

// --- AUTOMATED FRESHNESS GUARD (PREVIENE EMPAQUETAR CÓDIGO VIEJO) ---
function checkAndEnforceFreshBuild() {
  if (!fs.existsSync(tabletHtmlSrc)) {
    console.log('⚡ [FRESHNESS GUARD] No se encontró .next compilado. Ejecutando "npx next build"...');
    execSync('npx next build', { cwd: root, stdio: 'inherit' });
    return;
  }

  const buildTime = fs.statSync(tabletHtmlSrc).mtimeMs;
  
  // Recursivamente revisar si algún archivo de código fuente es más nuevo que el build
  function hasNewerFiles(dir) {
    if (!fs.existsSync(dir)) return false;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.next') {
          if (hasNewerFiles(fullPath)) return true;
        }
      } else {
        if (fs.statSync(fullPath).mtimeMs > buildTime) {
          return true;
        }
      }
    }
    return false;
  }

  const isStale = hasNewerFiles(path.join(root, 'src')) || 
    (fs.existsSync(path.join(root, 'version.json')) && fs.statSync(path.join(root, 'version.json')).mtimeMs > buildTime);

  if (isStale) {
    console.log('⚡ [FRESHNESS GUARD] Se detectaron cambios en el código fuente posteriores a la última compilación.');
    console.log('⚡ Compilando producción fresca de Next.js automáticamente para garantizar que la APK tenga la última versión...');
    execSync('npx next build', { cwd: root, stdio: 'inherit' });
  } else {
    console.log('✓ [FRESHNESS GUARD] Compilación .next verificada: 100% fresca y sincronizada con el código fuente.');
  }
}

checkAndEnforceFreshBuild();

// 1. Limpiar completamente assets/public para asegurar frescura absoluta
if (fs.existsSync(androidPublic)) {
  fs.rmSync(androidPublic, { recursive: true, force: true });
}
fs.mkdirSync(androidPublic, { recursive: true });

// 2. Estilo de Arranque Rápido para WebView (0ms splash oscuro e inquebrantable en Android)
const darkShieldHeadStyle = `
  <style id="klikpos-street-dark-shield">
    html, body {
      background-color: #040711 !important;
      color: #f8fafc !important;
      color-scheme: dark;
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
    }
    aside.street-floating-docker,
    .street-floating-docker,
    #klikpos-street-root aside.street-floating-docker {
      background-color: #090d16 !important;
      border: 1px solid rgba(255, 255, 255, 0.16) !important;
      color: #f8fafc !important;
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
