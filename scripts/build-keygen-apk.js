const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const desktopDir = path.join(root, 'venematic-desktop');
const androidDir = path.join(desktopDir, 'android');
const appGradle = path.join(androidDir, 'app', 'build.gradle');
const stringsXml = path.join(androidDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const resDir = path.join(androidDir, 'app', 'src', 'main', 'res');
const publicIndex = path.join(androidDir, 'app', 'src', 'main', 'assets', 'public', 'index.html');
const distDir = path.join(root, 'dist-apk');
const distFolder = path.join(root, 'DISTRIBUCION_KLIKPOS');
const devToolsFolder = path.join(distFolder, '00_Herramientas_Desarrollador');
const apksignerBat = 'C:\\Users\\pcpro\\AppData\\Local\\Android\\Sdk\\build-tools\\35.0.0\\apksigner.bat';

process.env.JAVA_HOME = 'C:\\Users\\pcpro\\AppData\\Local\\Programs\\Java\\jdk-21.0.12.1+1';
process.env.ANDROID_HOME = 'C:\\Users\\pcpro\\AppData\\Local\\Android\\Sdk';

const bakDir = path.join(desktopDir, 'scratch', 'bak-keygen');
fs.mkdirSync(bakDir, { recursive: true });
fs.mkdirSync(devToolsFolder, { recursive: true });
fs.mkdirSync(distDir, { recursive: true });

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function applyEditionIcons(edition) {
  const srcDir = path.join(desktopDir, 'android-icons', edition);
  if (!fs.existsSync(srcDir)) {
    console.warn('Aviso: Directorio de iconos no encontrado:', srcDir);
    return;
  }
  const bgSrc = path.join(srcDir, 'values', 'ic_launcher_background.xml');
  const bgDest = path.join(resDir, 'values', 'ic_launcher_background.xml');
  if (fs.existsSync(bgSrc)) fs.copyFileSync(bgSrc, bgDest);

  const densities = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
  for (const d of densities) {
    const s = path.join(srcDir, d);
    const dst = path.join(resDir, d);
    if (fs.existsSync(s)) {
      copyDirRecursive(s, dst);
    }
  }
  console.log(`✓ Iconos de edición "${edition}" aplicados correctamente a res/`);
}

console.log('===============================================================');
console.log('>>> [COMPILACIÓN] KLIKPOS KEYGEN (com.klikpos.keygen)');
console.log('===============================================================');

console.log('[1/5] Deteniendo demonios de Gradle y respaldando estado...');
try {
  execSync('cmd.exe /c ".\\gradlew.bat --stop"', { cwd: androidDir, stdio: 'ignore' });
} catch (e) {}

// Respaldar archivos y carpeta de recursos original
fs.copyFileSync(appGradle, path.join(bakDir, 'build.gradle.bak'));
fs.copyFileSync(stringsXml, path.join(bakDir, 'strings.xml.bak'));
if (fs.existsSync(publicIndex)) {
  fs.copyFileSync(publicIndex, path.join(bakDir, 'index.html.bak'));
}
const bakIconsDir = path.join(bakDir, 'original-icons');
fs.mkdirSync(bakIconsDir, { recursive: true });
const densities = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
for (const d of densities) {
  copyDirRecursive(path.join(resDir, d), path.join(bakIconsDir, d));
}
const bgFile = path.join(resDir, 'values', 'ic_launcher_background.xml');
if (fs.existsSync(bgFile)) {
  fs.copyFileSync(bgFile, path.join(bakIconsDir, 'ic_launcher_background.xml'));
}

try {
  console.log('[2/5] Inyectando applicationId "com.klikpos.keygen", strings e iconos exclusivos...');

  // 1. Inyectar applicationId único en build.gradle
  const bakGradle = fs.readFileSync(appGradle, 'utf8');
  const newGradle = bakGradle.replace(/applicationId\s+"[^"]+"/, 'applicationId "com.klikpos.keygen"');
  fs.writeFileSync(appGradle, newGradle, 'utf8');

  // 2. Modificar strings.xml con package y scheme único
  const xml = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">KlikPOS Keygen</string>
    <string name="title_activity_main">KlikPOS Keygen</string>
    <string name="package_name">com.klikpos.keygen</string>
    <string name="custom_url_scheme">com.klikpos.keygen</string>
</resources>`;
  fs.writeFileSync(stringsXml, xml, 'utf8');

  // 3. Aplicar iconos diferenciados de Keygen (Fondo Obsidian / Isotipo Dorado)
  applyEditionIcons('keygen');

  // 4. Inyectar index.html de Keygen
  fs.mkdirSync(path.dirname(publicIndex), { recursive: true });
  fs.copyFileSync(path.join(root, 'public', 'keygen-app.html'), publicIndex);

  console.log('[3/5] Compilando APK Release con Gradle assembleRelease...');
  execSync('cmd.exe /c ".\\gradlew.bat assembleRelease --no-daemon"', {
    cwd: androidDir,
    stdio: 'inherit',
    env: { ...process.env }
  });

  const rawApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  if (!fs.existsSync(rawApk)) {
    throw new Error('No se encontró el APK generado en: ' + rawApk);
  }

  const signedKeygenApk = path.join(distDir, 'KlikPOS_Keygen.apk');
  fs.copyFileSync(rawApk, signedKeygenApk);

  console.log('Verificando firma del APK...');
  if (fs.existsSync(apksignerBat)) {
    execSync(`cmd.exe /c ""${apksignerBat}" verify --verbose "${signedKeygenApk}""`, { stdio: 'inherit' });
  }

  console.log('[4/5] Exportando KlikPOS_Keygen.apk...');
  const targets = [
    path.join(distDir, 'KlikPOS_Keygen_Master.apk'),
    path.join(devToolsFolder, 'KlikPOS_Keygen.apk'),
    path.join(distFolder, 'KlikPOS_Keygen.apk')
  ];

  for (const tgt of targets) {
    fs.copyFileSync(signedKeygenApk, tgt);
    console.log('  [✓] Creado: ' + tgt);
  }

  console.log('===============================================================');
  console.log(' ¡KLIKPOS KEYGEN APK GENERADA CON IDENTIFICADOR Y LOGO ÚNICOS!');
  console.log(' Package ID: com.klikpos.keygen (CERO colisiones con Street)');
  console.log('===============================================================');

} finally {
  console.log('[5/5] Restaurando configuración POS y recursos originales...');
  if (fs.existsSync(path.join(bakDir, 'build.gradle.bak'))) {
    fs.copyFileSync(path.join(bakDir, 'build.gradle.bak'), appGradle);
  }
  if (fs.existsSync(path.join(bakDir, 'strings.xml.bak'))) {
    fs.copyFileSync(path.join(bakDir, 'strings.xml.bak'), stringsXml);
  }
  if (fs.existsSync(path.join(bakDir, 'index.html.bak'))) {
    fs.copyFileSync(path.join(bakDir, 'index.html.bak'), publicIndex);
  }
  // Restaurar iconos originales
  for (const d of densities) {
    copyDirRecursive(path.join(bakIconsDir, d), path.join(resDir, d));
  }
  if (fs.existsSync(path.join(bakIconsDir, 'ic_launcher_background.xml'))) {
    fs.copyFileSync(path.join(bakIconsDir, 'ic_launcher_background.xml'), bgFile);
  }
  fs.rmSync(bakDir, { recursive: true, force: true });
}
