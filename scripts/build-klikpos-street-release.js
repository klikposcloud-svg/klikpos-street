const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const desktopDir = path.join(root, 'venematic-desktop');
const androidDir = path.join(desktopDir, 'android');
const appGradle = path.join(androidDir, 'app', 'build.gradle');
const stringsXml = path.join(androidDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const manifestXml = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
const publicDir = path.join(androidDir, 'app', 'src', 'main', 'assets', 'public');
const publicIndex = path.join(publicDir, 'index.html');
const keystorePath = path.join(androidDir, 'klikpos-release.jks');
const issPath = path.join(desktopDir, 'installer.iss');

const apksignerBat = 'C:\\Users\\pcpro\\AppData\\Local\\Android\\Sdk\\build-tools\\35.0.0\\apksigner.bat';
const isccCandidates = [
  path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Inno Setup 6', 'ISCC.exe'),
  'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe',
  'C:\\Program Files\\Inno Setup 6\\ISCC.exe'
];

let isccPath = isccCandidates.find(p => fs.existsSync(p));

const distApkDir = path.join(root, 'dist-apk');
const distInstallerDir = path.join(root, 'dist-installer');
const releaseRoot = path.join(root, 'KlikPOS Release');
const releaseMobile = path.join(releaseRoot, '04_Apps_Moviles_Android');
const releaseStreetDesktop = path.join(releaseRoot, '03_KlikPOS_Street_Desktop');
const distFolder = path.join(root, 'DISTRIBUCION_KLIKPOS');
const combo3Mesas = path.join(distFolder, '03_KlikPOS_Tablet_Standalone_Mesas');

process.env.JAVA_HOME = 'C:\\Users\\pcpro\\AppData\\Local\\Programs\\Java\\jdk-21.0.12.1+1';
process.env.ANDROID_HOME = 'C:\\Users\\pcpro\\AppData\\Local\\Android\\Sdk';

[distApkDir, distInstallerDir, releaseRoot, releaseMobile, releaseStreetDesktop, distFolder, combo3Mesas].forEach(d => {
  fs.mkdirSync(d, { recursive: true });
});

const manifestJson = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
const currentVersion = manifestJson.version || '3.0.4';

console.log('===============================================================');
console.log(`>>> [COMPILACIÓN OFICIAL] KLIKPOS STREET v${currentVersion} (APK & INNO SETUP)`);
console.log('===============================================================');

// 0. Compilación fresca obligatoria de Next.js (Evita empaquetar código viejo)
if (!process.argv.includes('--skip-next-build')) {
  console.log('\n[0/4] Compilando producción fresca de Next.js (npx next build)...');
  execSync('npx next build', { cwd: root, stdio: 'inherit' });
}

// 1. Sincronizar assets de Next.js a Android
console.log('\n[1/4] Sincronizando assets de Next.js para Android...');
execSync(`node "${path.join(root, 'scripts', 'enhance-and-rebrand-mobile.js')}"`, { stdio: 'inherit' });

// 2. Compilar APK Release con Gradle
console.log('\n[2/4] Compilando APK Release con Gradle (com.klikpos.street v1.0)...');
try {
  execSync('powershell -Command "Get-Process -Name java, javaw, gradle -ErrorAction SilentlyContinue | Stop-Process -Force"', { stdio: 'ignore' });
} catch (e) {}

const appBuildDir = path.join(androidDir, 'app', 'build');
if (fs.existsSync(appBuildDir)) {
  try {
    fs.rmSync(appBuildDir, { recursive: true, force: true });
    console.log('✓ Limpiado directorio app/build para compilación limpia.');
  } catch (e) {
    console.warn('Aviso al limpiar app/build:', e.message);
  }
}

const bakGradle = fs.readFileSync(appGradle, 'utf8');
const bakStrings = fs.readFileSync(stringsXml, 'utf8');
const bakManifest = fs.readFileSync(manifestXml, 'utf8');
let bakIndex = '';
if (fs.existsSync(publicIndex)) bakIndex = fs.readFileSync(publicIndex, 'utf8');

try {
  let gradle = bakGradle.replace(/applicationId\s+"[^"]+"/, 'applicationId "com.klikpos.street"');
  gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${currentVersion}"`);
  fs.writeFileSync(appGradle, gradle, 'utf8');

  const streetStrings = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">KlikPOS Street</string>
    <string name="title_activity_main">KlikPOS Street</string>
    <string name="package_name">com.klikpos.street</string>
    <string name="custom_url_scheme">com.klikpos.street</string>
</resources>`;
  fs.writeFileSync(stringsXml, streetStrings, 'utf8');

  const tabletHtmlSrc = path.join(publicDir, 'tablet-pos.html');
  if (fs.existsSync(tabletHtmlSrc)) {
    fs.copyFileSync(tabletHtmlSrc, publicIndex);
  }

  execSync('cmd.exe /c ".\\gradlew.bat assembleRelease --no-daemon"', {
    cwd: androidDir,
    stdio: 'inherit',
    env: { ...process.env }
  });

  const rawApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  const signedStreetApk = path.join(distApkDir, `KlikPOS_Street_v${currentVersion}.apk`);
  fs.copyFileSync(rawApk, signedStreetApk);

  console.log('Verificando firma criptográfica del APK...');
  execSync(`cmd.exe /c ""${apksignerBat}" verify --verbose "${signedStreetApk}""`, { stdio: 'inherit' });

  const apkTargets = [
    path.join(distApkDir, 'KlikPOS_Street.apk'),
    path.join(distApkDir, `KlikPOS_Street_v${currentVersion}.apk`),
    path.join(distApkDir, 'KlikPOS_Street_v1.0.apk'),
    path.join(releaseMobile, 'KlikPOS_Street.apk'),
    path.join(releaseMobile, `KlikPOS_Street_v${currentVersion}.apk`),
    path.join(releaseMobile, 'KlikPOS_Street_v1.0.apk'),
    path.join(releaseMobile, 'KlikPOS_Tablet_Standalone.apk'),
    path.join(combo3Mesas, 'KlikPOS_Street.apk'),
    path.join(combo3Mesas, `KlikPOS_Street_v${currentVersion}.apk`),
    path.join(distFolder, 'KlikPOS_Street.apk')
  ];

  for (const target of apkTargets) {
    fs.copyFileSync(signedStreetApk, target);
    console.log('  [✓ APK Copiado]: ' + target);
  }

  console.log(`>>> ¡APK KLIKPOS STREET v${currentVersion} GENERADA CON ÉXITO!`);

} finally {
  fs.writeFileSync(appGradle, bakGradle, 'utf8');
  fs.writeFileSync(stringsXml, bakStrings, 'utf8');
  fs.writeFileSync(manifestXml, bakManifest, 'utf8');
  // bakIndex revert removed to keep fresh Street index.html
}

// 3. Compilar Instalador Inno Setup para Windows (KlikPOS Street)
if (isccPath) {
  console.log('\n[3/4] Generando Staging y Compilando con Inno Setup (' + isccPath + ')...');
  
  // Preparar staging de desktop
  try {
    execSync(`powershell -ExecutionPolicy Bypass -File "${path.join(desktopDir, 'script', 'build-staging.ps1')}" -Edition KLIKPOS_ELITE`, { stdio: 'inherit' });
  } catch (err) {
    console.log('Aviso preparando staging: ' + err.message);
  }

  const outBase = `KlikPOS_Street_v${currentVersion}_Setup`;
  const innoCmd = `"${isccPath}" "/O${releaseStreetDesktop}" "/F${outBase}" "/DAppName=KlikPOS Street" "/DAppEdition=KLIKPOS_STREET" "/DAppVersion=${currentVersion}" "${issPath}"`;
  console.log('Ejecutando Inno Setup: ' + innoCmd);
  execSync(innoCmd, { stdio: 'inherit' });

  const builtExe = path.join(releaseStreetDesktop, `${outBase}.exe`);
  if (fs.existsSync(builtExe)) {
    const distExe = path.join(distInstallerDir, `${outBase}.exe`);
    fs.copyFileSync(builtExe, distExe);
    fs.copyFileSync(builtExe, path.join(distInstallerDir, 'KlikPOS_Desktop_Full_Setup.exe'));
    console.log('  [✓ Instalador Windows Generado]: ' + builtExe);
    console.log('  [✓ Copiado a dist-installer]: ' + distExe);

    // Crear lanzador BAT de desbloqueo rápido
    const batContent = `@echo off
title Instalador KlikPOS Street v${currentVersion}
echo ===============================================================
echo   INSTALADOR OFICIAL: KlikPOS Street v${currentVersion}
echo   Desbloqueando archivo de seguridad SmartScreen de Windows...
echo ===============================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0' -Filter '*.exe' | Unblock-File" 2>nul
echo Iniciando asistente de instalacion...
start "" "%~dp0${outBase}.exe"
exit
`;
    fs.writeFileSync(path.join(releaseStreetDesktop, 'INSTALAR_KLIKPOS_STREET.bat'), batContent, 'ascii');
    fs.writeFileSync(path.join(releaseStreetDesktop, 'DESBLOQUEAR_Y_EJECUTAR.bat'), batContent, 'ascii');
  }
} else {
  console.log('\n[3/4] Aviso: Compilador Inno Setup no encontrado en las rutas estándar.');
}

console.log('\n===============================================================');
console.log('>>> ¡PROCESO DE COMPILACIÓN COMPLETADO EXITOSAMENTE!');
console.log('===============================================================');
