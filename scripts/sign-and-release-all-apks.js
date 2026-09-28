const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'venematic-desktop', 'android');
const appGradle = path.join(androidDir, 'app', 'build.gradle');
const stringsXml = path.join(androidDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const manifestXml = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
const publicDir = path.join(androidDir, 'app', 'src', 'main', 'assets', 'public');
const publicIndex = path.join(publicDir, 'index.html');
const keystorePath = path.join(androidDir, 'klikpos-release.jks');

const apksignerBat = 'C:\\Users\\pcpro\\AppData\\Local\\Android\\Sdk\\build-tools\\35.0.0\\apksigner.bat';

const distDir = path.join(root, 'dist-apk');
const distFolder = path.join(root, 'DISTRIBUCION_KLIKPOS');
const devToolsFolder = path.join(distFolder, '00_Herramientas_Desarrollador');
const combo1Folder = path.join(distFolder, '01_Combo_Basico_Desktop_Satelite');
const combo1Contingencia = path.join(distFolder, '01_KlikPOS_Satelite_PC_Contingencia');
const combo2Folder = path.join(distFolder, '02_Combo_Empresarial_Full');
const combo3Folder = path.join(distFolder, '03_Movil_Full_Autonomo');
const combo3Mesas = path.join(distFolder, '03_KlikPOS_Tablet_Standalone_Mesas');
const combo4Folder = path.join(distFolder, '04_KlikPOS_Movil_Full_Autonomo_Nube');
const combo5Folder = path.join(distFolder, '05_KlikPOS_Movil_Full_Para_PC');

process.env.JAVA_HOME = 'C:\\Users\\pcpro\\AppData\\Local\\Programs\\Java\\jdk-21.0.12.1+1';
process.env.ANDROID_HOME = 'C:\\Users\\pcpro\\AppData\\Local\\Android\\Sdk';

[distDir, distFolder, devToolsFolder, combo1Folder, combo1Contingencia, combo2Folder, combo3Folder, combo3Mesas, combo4Folder, combo5Folder].forEach(d => {
  fs.mkdirSync(d, { recursive: true });
});

function ensureKeystore() {
  if (!fs.existsSync(keystorePath)) {
    console.log('Generando Keystore Release Oficial: ' + keystorePath);
    const keytool = 'C:\\Users\\pcpro\\AppData\\Local\\Programs\\Java\\jdk-21.0.12.1+1\\bin\\keytool.exe';
    const cmd = `"${keytool}" -genkeypair -v -keystore "${keystorePath}" -alias klikpos -keyalg RSA -keysize 2048 -validity 10000 -storepass klikpos2026 -keypass klikpos2026 -dname "CN=KlikPOS Enterprise, OU=Mobile Division, O=KlikPOS Cloud Inc, L=Caracas, ST=Miranda, C=VE"`;
    execSync(cmd, { stdio: 'inherit' });
  }
}

function verifyApk(apkPath) {
  console.log(`  [✓] Verificando firma criptográfica (V1 + V2 + V3)...`);
  execSync(`cmd.exe /c ""${apksignerBat}" verify --verbose "${apkPath}""`, { stdio: 'inherit' });
}

function stopGradleDaemon() {
  try {
    execSync('cmd.exe /c ".\\gradlew.bat --stop"', { cwd: androidDir, stdio: 'ignore' });
  } catch (e) {}
}

function syncAssetsBase() {
  console.log('Sincronizando assets estáticos de Next.js...');
  execSync(`node "${path.join(root, 'scripts', 'enhance-and-rebrand-mobile.js')}"`, { stdio: 'inherit' });
}

// =============================================================================
// FASE 1: KLIKPOS KEYGEN APK (com.klikpos.keygen)
// =============================================================================
function buildKeygenApk() {
  console.log('\n===============================================================');
  console.log('>>> [FASE 1/3] COMPILANDO: KLIKPOS KEYGEN (com.klikpos.keygen)');
  console.log('===============================================================');

  stopGradleDaemon();
  const bakGradle = fs.readFileSync(appGradle, 'utf8');
  const bakStrings = fs.readFileSync(stringsXml, 'utf8');
  const bakManifest = fs.readFileSync(manifestXml, 'utf8');
  let bakIndex = '';
  if (fs.existsSync(publicIndex)) bakIndex = fs.readFileSync(publicIndex, 'utf8');

  try {
    let gradle = bakGradle.replace(/applicationId\s+"[^"]+"/, 'applicationId "com.klikpos.keygen"');
    fs.writeFileSync(appGradle, gradle, 'utf8');

    const keygenStrings = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">KlikPOS Keygen</string>
    <string name="title_activity_main">KlikPOS Keygen</string>
    <string name="package_name">com.klikpos.keygen</string>
    <string name="custom_url_scheme">com.klikpos.keygen</string>
</resources>`;
    fs.writeFileSync(stringsXml, keygenStrings, 'utf8');

    const keygenManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/AppTheme">
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
</manifest>`;
    fs.writeFileSync(manifestXml, keygenManifest, 'utf8');

    fs.mkdirSync(publicDir, { recursive: true });
    fs.copyFileSync(path.join(root, 'public', 'keygen-app.html'), publicIndex);

    console.log('Ejecutando Gradle assembleRelease para Keygen...');
    execSync('cmd.exe /c ".\\gradlew.bat assembleRelease --no-daemon"', {
      cwd: androidDir,
      stdio: 'inherit',
      env: { ...process.env }
    });

    const rawApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
    const signedKeygenApk = path.join(distDir, 'KlikPOS_Keygen.apk');

    fs.copyFileSync(rawApk, signedKeygenApk);
    verifyApk(signedKeygenApk);

    const targets = [
      path.join(distDir, 'KlikPOS_Keygen_Master.apk'),
      path.join(devToolsFolder, 'KlikPOS_Keygen.apk'),
      path.join(distFolder, 'KlikPOS_Keygen.apk')
    ];
    for (const t of targets) {
      fs.copyFileSync(signedKeygenApk, t);
      console.log('  [✓] Copiado a: ' + t);
    }

    console.log('>>> ¡KLIKPOS KEYGEN RELEASE APK GENERADA CON ÉXITO!');

  } finally {
    fs.writeFileSync(appGradle, bakGradle, 'utf8');
    fs.writeFileSync(stringsXml, bakStrings, 'utf8');
    fs.writeFileSync(manifestXml, bakManifest, 'utf8');
    if (bakIndex) fs.writeFileSync(publicIndex, bakIndex, 'utf8');
  }
}

// =============================================================================
// FASE 2: KLIKPOS MÓVIL RETAIL & SCANNER (com.klikpos.movil)
// Interfaz: scanner.html (Punto de venta móvil con inventario, escáner, balanza y sync PC)
// =============================================================================
function buildMovilRetailApk() {
  console.log('\n===============================================================');
  console.log('>>> [FASE 2/3] COMPILANDO: KLIKPOS MÓVIL RETAIL & SCANNER (com.klikpos.movil)');
  console.log('    (Punto de venta con Inventario, Balanza, Escáner y Conexión PC)');
  console.log('===============================================================');

  stopGradleDaemon();
  syncAssetsBase();

  const bakGradle = fs.readFileSync(appGradle, 'utf8');
  const bakStrings = fs.readFileSync(stringsXml, 'utf8');
  const bakManifest = fs.readFileSync(manifestXml, 'utf8');
  let bakIndex = '';
  if (fs.existsSync(publicIndex)) bakIndex = fs.readFileSync(publicIndex, 'utf8');

  try {
    let gradle = bakGradle.replace(/applicationId\s+"[^"]+"/, 'applicationId "com.klikpos.movil"');
    fs.writeFileSync(appGradle, gradle, 'utf8');

    const movilStrings = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">KlikPOS Móvil</string>
    <string name="title_activity_main">KlikPOS Móvil</string>
    <string name="package_name">com.klikpos.movil</string>
    <string name="custom_url_scheme">com.klikpos.movil</string>
</resources>`;
    fs.writeFileSync(stringsXml, movilStrings, 'utf8');

    // Inyectar scanner.html (Retail, Inventario, Balanza, Escáner, Venta) como pantalla principal
    const scannerHtmlSrc = path.join(publicDir, 'scanner.html');
    if (fs.existsSync(scannerHtmlSrc)) {
      fs.copyFileSync(scannerHtmlSrc, publicIndex);
    }

    console.log('Ejecutando Gradle assembleRelease para KlikPOS Móvil Retail & Scanner...');
    execSync('cmd.exe /c ".\\gradlew.bat assembleRelease --no-daemon"', {
      cwd: androidDir,
      stdio: 'inherit',
      env: { ...process.env }
    });

    const rawApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
    const signedMovilApk = path.join(distDir, 'KlikPOS_Movil_Full.apk');
    const signedSateliteApk = path.join(distDir, 'KlikPOS_Movil_Satelite.apk');

    fs.copyFileSync(rawApk, signedMovilApk);
    fs.copyFileSync(rawApk, signedSateliteApk);
    verifyApk(signedMovilApk);

    // Distribuir a los combos móviles y satélites
    const targets = [
      path.join(combo1Folder, 'KlikPOS_Movil_Satelite.apk'),
      path.join(combo1Contingencia, 'KlikPOS_Movil_Satelite.apk'),
      path.join(combo2Folder, 'KlikPOS_Movil_Satelite.apk'),
      path.join(combo3Folder, 'KlikPOS_Movil_Full.apk'),
      path.join(combo4Folder, 'KlikPOS_Movil_Full.apk'),
      path.join(combo4Folder, 'KlikPOS_Movil_Full_Autonomo.apk'),
      path.join(combo5Folder, 'KlikPOS_Movil_Full.apk'),
      path.join(combo5Folder, 'KlikPOS_Movil_Full_PC.apk')
    ];
    for (const t of targets) {
      fs.copyFileSync(signedMovilApk, t);
      console.log('  [✓] Copiado a: ' + t);
    }

    console.log('>>> ¡KLIKPOS MÓVIL RETAIL & SCANNER RELEASE GENERADA CON ÉXITO!');

  } finally {
    fs.writeFileSync(appGradle, bakGradle, 'utf8');
    fs.writeFileSync(stringsXml, bakStrings, 'utf8');
    fs.writeFileSync(manifestXml, bakManifest, 'utf8');
    if (bakIndex) fs.writeFileSync(publicIndex, bakIndex, 'utf8');
  }
}

// =============================================================================
// FASE 3: KLIKPOS TABLET POS & MESAS (com.klikpos.tablet)
// Interfaz: tablet-pos.html (Docker lateral flotante, botón COBRAR, mesas y catálogo)
// =============================================================================
function buildTabletMesasApk() {
  console.log('\n===============================================================');
  console.log('>>> [FASE 3/3] COMPILANDO: KLIKPOS TABLET & MESAS (com.klikpos.tablet)');
  console.log('    (Punto de Venta Tablet con Docker Flotante, Botón COBRAR y Mesas)');
  console.log('===============================================================');

  stopGradleDaemon();
  syncAssetsBase();

  const bakGradle = fs.readFileSync(appGradle, 'utf8');
  const bakStrings = fs.readFileSync(stringsXml, 'utf8');

  try {
    let gradle = bakGradle.replace(/applicationId\s+"[^"]+"/, 'applicationId "com.klikpos.tablet"');
    fs.writeFileSync(appGradle, gradle, 'utf8');

    const tabletStrings = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">KlikPOS Tablet</string>
    <string name="title_activity_main">KlikPOS Tablet</string>
    <string name="package_name">com.klikpos.tablet</string>
    <string name="custom_url_scheme">com.klikpos.tablet</string>
</resources>`;
    fs.writeFileSync(stringsXml, tabletStrings, 'utf8');

    // Inyectar tablet-pos.html (Docker, Botón COBRAR, Mesas, Catálogo con fotos)
    const tabletHtmlSrc = path.join(publicDir, 'tablet-pos.html');
    if (fs.existsSync(tabletHtmlSrc)) {
      fs.copyFileSync(tabletHtmlSrc, publicIndex);
    }

    console.log('Ejecutando Gradle assembleRelease para KlikPOS Tablet & Mesas...');
    execSync('cmd.exe /c ".\\gradlew.bat assembleRelease --no-daemon"', {
      cwd: androidDir,
      stdio: 'inherit',
      env: { ...process.env }
    });

    const rawApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
    const signedTabletApk = path.join(distDir, 'KlikPOS_Tablet_Standalone_Mesas.apk');

    fs.copyFileSync(rawApk, signedTabletApk);
    verifyApk(signedTabletApk);

    const targets = [
      path.join(combo2Folder, 'KlikPOS_Movil_Administrador.apk'),
      path.join(combo3Mesas, 'KlikPOS_Tablet_Standalone.apk'),
      path.join(combo3Mesas, 'KlikPOS_Tablet_Standalone_Mesas.apk')
    ];
    for (const t of targets) {
      fs.copyFileSync(signedTabletApk, t);
      console.log('  [✓] Copiado a: ' + t);
    }

    console.log('>>> ¡KLIKPOS TABLET & MESAS RELEASE GENERADA CON ÉXITO!');

  } finally {
    fs.writeFileSync(appGradle, bakGradle, 'utf8');
    fs.writeFileSync(stringsXml, bakStrings, 'utf8');
  }
}

ensureKeystore();
buildKeygenApk();
buildMovilRetailApk();
buildTabletMesasApk();

console.log('\n===============================================================');
console.log(' ¡LAS 3 APLICACIONES ANDROID RELEASE HAN SIDO GENERADAS!');
console.log(' 1. KlikPOS Keygen       (Package: com.klikpos.keygen)  -> Claves de Licencia');
console.log(' 2. KlikPOS Móvil        (Package: com.klikpos.movil)   -> Retail, Inventario, Balanza, Escáner');
console.log(' 3. KlikPOS Tablet Mesas (Package: com.klikpos.tablet)  -> Docker Lateral, Mesas, Botón COBRAR');
console.log('===============================================================\n');
