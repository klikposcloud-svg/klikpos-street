const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'venematic-desktop', 'android');
const appGradle = path.join(androidDir, 'app', 'build.gradle');
const stringsXml = path.join(androidDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const publicIndex = path.join(androidDir, 'app', 'src', 'main', 'assets', 'public', 'index.html');
const distDir = path.join(root, 'dist-apk');
const distFolder = path.join(root, 'DISTRIBUCION_KLIKPOS');
const devToolsFolder = path.join(distFolder, '00_Herramientas_Desarrollador');

// Environment for Java and Android SDK
process.env.JAVA_HOME = 'C:\\Users\\pcpro\\AppData\\Local\\Programs\\Java\\jdk-21.0.12.1+1';
process.env.ANDROID_HOME = 'C:\\Users\\pcpro\\AppData\\Local\\Android\\Sdk';

const bakDir = path.join(root, 'venematic-desktop', 'scratch', 'bak-keygen');
fs.mkdirSync(bakDir, { recursive: true });
fs.mkdirSync(devToolsFolder, { recursive: true });
fs.mkdirSync(distDir, { recursive: true });

console.log('[1/5] Deteniendo demonios de Gradle y limpiando temporales...');
try {
  execSync('cmd.exe /c ".\\gradlew.bat --stop"', { cwd: androidDir, stdio: 'ignore' });
} catch (e) {}

const intermediates = path.join(androidDir, 'app', 'build', 'intermediates');
if (fs.existsSync(intermediates)) {
  try { fs.rmSync(intermediates, { recursive: true, force: true }); } catch (e) {}
}

fs.copyFileSync(appGradle, path.join(bakDir, 'build.gradle.bak'));
fs.copyFileSync(stringsXml, path.join(bakDir, 'strings.xml.bak'));
if (fs.existsSync(publicIndex)) {
  fs.copyFileSync(publicIndex, path.join(bakDir, 'index.html.bak'));
}

try {
  console.log('[2/5] Configurando nombre "KlikPOS Keygen" e inyectando app...');
  
  // 1. Modificar strings.xml a KlikPOS Keygen
  const xml = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">KlikPOS Keygen</string>
    <string name="title_activity_main">KlikPOS Keygen</string>
    <string name="package_name">com.klikpos.keygen</string>
    <string name="custom_url_scheme">com.klikpos.keygen</string>
</resources>`;
  fs.writeFileSync(stringsXml, xml, 'utf8');

  // 2. Copiar keygen-app.html como index.html
  fs.mkdirSync(path.dirname(publicIndex), { recursive: true });
  fs.copyFileSync(path.join(root, 'public', 'keygen-app.html'), publicIndex);

  console.log('[3/5] Compilando con Gradle assembleDebug...');
  execSync('cmd.exe /c ".\\gradlew.bat assembleDebug --no-daemon"', {
    cwd: androidDir,
    stdio: 'inherit',
    env: { ...process.env }
  });

  const outputApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  if (!fs.existsSync(outputApk)) {
    throw new Error('No se encontró el APK generado en: ' + outputApk);
  }

  console.log('[4/5] Exportando KlikPOS_Keygen.apk a dist-apk y DISTRIBUCION_KLIKPOS...');
  const targets = [
    path.join(distDir, 'KlikPOS_Keygen.apk'),
    path.join(distDir, 'KlikPOS_Keygen_Master.apk'),
    path.join(devToolsFolder, 'KlikPOS_Keygen.apk'),
    path.join(distFolder, 'KlikPOS_Keygen.apk')
  ];

  for (const tgt of targets) {
    fs.copyFileSync(outputApk, tgt);
    console.log('  [✓] Creado: ' + tgt);
  }

  console.log('======================================================');
  console.log(' ¡KLIKPOS KEYGEN APK GENERADA Y LISTA PARA TU CELULAR!');
  console.log(' Ubicación: DISTRIBUCION_KLIKPOS/00_Herramientas_Desarrollador/KlikPOS_Keygen.apk');
  console.log('======================================================');

} finally {
  console.log('[5/5] Restaurando configuración POS...');
  if (fs.existsSync(path.join(bakDir, 'build.gradle.bak'))) {
    fs.copyFileSync(path.join(bakDir, 'build.gradle.bak'), appGradle);
  }
  if (fs.existsSync(path.join(bakDir, 'strings.xml.bak'))) {
    fs.copyFileSync(path.join(bakDir, 'strings.xml.bak'), stringsXml);
  }
  if (fs.existsSync(path.join(bakDir, 'index.html.bak'))) {
    fs.copyFileSync(path.join(bakDir, 'index.html.bak'), publicIndex);
  }
  fs.rmSync(bakDir, { recursive: true, force: true });
}
