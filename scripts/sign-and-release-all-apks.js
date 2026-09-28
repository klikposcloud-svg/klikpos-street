const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'venematic-desktop', 'android');
const appGradle = path.join(androidDir, 'app', 'build.gradle');
const stringsXml = path.join(androidDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const manifestXml = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
const publicIndex = path.join(androidDir, 'app', 'src', 'main', 'assets', 'public', 'index.html');
const keystorePath = path.join(androidDir, 'klikpos-release.jks');

const zipalignExe = 'C:\\Users\\pcpro\\AppData\\Local\\Android\\Sdk\\build-tools\\35.0.0\\zipalign.exe';
const apksignerBat = 'C:\\Users\\pcpro\\AppData\\Local\\Android\\Sdk\\build-tools\\35.0.0\\apksigner.bat';

const distDir = path.join(root, 'dist-apk');
const distFolder = path.join(root, 'DISTRIBUCION_KLIKPOS');
const devToolsFolder = path.join(distFolder, '00_Herramientas_Desarrollador');
const combo1Folder = path.join(distFolder, '01_Combo_Basico_Desktop_Satelite');
const combo2Folder = path.join(distFolder, '02_Combo_Empresarial_Full');
const combo3Folder = path.join(distFolder, '03_Movil_Full_Autonomo');

process.env.JAVA_HOME = 'C:\\Users\\pcpro\\AppData\\Local\\Programs\\Java\\jdk-21.0.12.1+1';
process.env.ANDROID_HOME = 'C:\\Users\\pcpro\\AppData\\Local\\Android\\Sdk';

[distDir, distFolder, devToolsFolder, combo1Folder, combo2Folder, combo3Folder].forEach(d => {
  fs.mkdirSync(d, { recursive: true });
});

// 1. Asegurar Keystore Release oficial
function ensureKeystore() {
  if (!fs.existsSync(keystorePath)) {
    console.log('Generando Keystore Release Oficial: ' + keystorePath);
    const keytool = 'C:\\Users\\pcpro\\AppData\\Local\\Programs\\Java\\jdk-21.0.12.1+1\\bin\\keytool.exe';
    const cmd = `"${keytool}" -genkeypair -v -keystore "${keystorePath}" -alias klikpos -keyalg RSA -keysize 2048 -validity 10000 -storepass klikpos2026 -keypass klikpos2026 -dname "CN=KlikPOS Enterprise, OU=Mobile Division, O=KlikPOS Cloud Inc, L=Caracas, ST=Miranda, C=VE"`;
    execSync(cmd, { stdio: 'inherit' });
  }
}

// 2. Firmar y Alinear APK con zipalign y apksigner (V1, V2, V3)
function signAndAlignApk(rawApkPath, finalApkPath) {
  const alignedApk = path.join(path.dirname(rawApkPath), 'aligned-temp.apk');
  if (fs.existsSync(alignedApk)) {
    try { fs.unlinkSync(alignedApk); } catch (e) {}
  }

  // Alinear a 4 bytes
  console.log(`  [1/2] Alineando APK con zipalign: ${path.basename(finalApkPath)}...`);
  execSync(`"${zipalignExe}" -f -p 4 "${rawApkPath}" "${alignedApk}"`, { stdio: 'inherit' });

  // Firmar con Release Keystore V1 + V2 + V3
  console.log(`  [2/2] Firmando con apksigner (V1 + V2 + V3 Release)...`);
  execSync(`cmd.exe /c ""${apksignerBat}" sign --ks "${keystorePath}" --ks-key-alias klikpos --ks-pass pass:klikpos2026 --key-pass pass:klikpos2026 --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true "${alignedApk}""`, { stdio: 'inherit' });

  // Verificar firma
  console.log(`  [✓] Verificando firma criptográfica con apksigner...`);
  execSync(`cmd.exe /c ""${apksignerBat}" verify --verbose "${alignedApk}""`, { stdio: 'inherit' });

  fs.copyFileSync(alignedApk, finalApkPath);
  try { fs.unlinkSync(alignedApk); } catch (e) {}
}

function stopGradleDaemon() {
  try {
    execSync('cmd.exe /c ".\\gradlew.bat --stop"', { cwd: androidDir, stdio: 'ignore' });
  } catch (e) {}
}

// =============================================================================
// A. COMPILAR KLIKPOS KEYGEN APK (LIMPIO DE PERMISOS SMS / SIN PLAY PROTECT RISK)
// =============================================================================
function buildKeygenApk() {
  console.log('\n===============================================================');
  console.log('>>> [FASE 1] COMPILANDO: KLIKPOS KEYGEN (APK PARA CELULAR)');
  console.log('===============================================================');

  stopGradleDaemon();
  const bakGradle = fs.readFileSync(appGradle, 'utf8');
  const bakStrings = fs.readFileSync(stringsXml, 'utf8');
  const bakManifest = fs.readFileSync(manifestXml, 'utf8');
  let bakIndex = '';
  if (fs.existsSync(publicIndex)) bakIndex = fs.readFileSync(publicIndex, 'utf8');

  try {
    // Strings
    const keygenStrings = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">KlikPOS Keygen</string>
    <string name="title_activity_main">KlikPOS Keygen</string>
    <string name="package_name">com.klikpos.keygen</string>
    <string name="custom_url_scheme">com.klikpos.keygen</string>
</resources>`;
    fs.writeFileSync(stringsXml, keygenStrings, 'utf8');

    // Manifest limpio (Sin SMS, sin Receiver, sin riesgo de Play Protect)
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

    // Inyectar HTML
    fs.mkdirSync(path.dirname(publicIndex), { recursive: true });
    fs.copyFileSync(path.join(root, 'public', 'keygen-app.html'), publicIndex);

    // Compilar
    console.log('Ejecutando Gradle assembleDebug...');
    execSync('cmd.exe /c ".\\gradlew.bat assembleDebug --no-daemon"', {
      cwd: androidDir,
      stdio: 'inherit',
      env: { ...process.env }
    });

    const rawApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    const signedKeygenApk = path.join(distDir, 'KlikPOS_Keygen.apk');

    signAndAlignApk(rawApk, signedKeygenApk);

    // Distribuir
    const targets = [
      path.join(distDir, 'KlikPOS_Keygen_Master.apk'),
      path.join(devToolsFolder, 'KlikPOS_Keygen.apk'),
      path.join(distFolder, 'KlikPOS_Keygen.apk')
    ];
    for (const t of targets) {
      fs.copyFileSync(signedKeygenApk, t);
      console.log('  [✓] Copiado a: ' + t);
    }

    console.log('>>> ¡KLIKPOS KEYGEN APK FIRMADA Y BLINDADA CON ÉXITO!');

  } finally {
    fs.writeFileSync(appGradle, bakGradle, 'utf8');
    fs.writeFileSync(stringsXml, bakStrings, 'utf8');
    fs.writeFileSync(manifestXml, bakManifest, 'utf8');
    if (bakIndex) fs.writeFileSync(publicIndex, bakIndex, 'utf8');
  }
}

// =============================================================================
// B. COMPILAR KLIKPOS MÓVIL / TABLET POS (CON RELEASE SIGNATURE & ASSETS FRESH)
// =============================================================================
function buildPosApk() {
  console.log('\n===============================================================');
  console.log('>>> [FASE 2] COMPILANDO: KLIKPOS MÓVIL / TABLET POS (PRODUCCIÓN)');
  console.log('===============================================================');

  stopGradleDaemon();

  // 1. Sincronizar assets de Next.js compilado
  console.log('Sincronizando HTML y static bundle de tablet-pos...');
  execSync(`node "${path.join(root, 'scripts', 'enhance-and-rebrand-mobile.js')}"`, { stdio: 'inherit' });

  // 2. Compilar
  console.log('Ejecutando Gradle assembleDebug para POS Móvil...');
  execSync('cmd.exe /c ".\\gradlew.bat assembleDebug --no-daemon"', {
    cwd: androidDir,
    stdio: 'inherit',
    env: { ...process.env }
  });

  const rawApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  const signedPosApk = path.join(distDir, 'KlikPOS_Movil_Full.apk');

  signAndAlignApk(rawApk, signedPosApk);

  // Distribuir a combos
  const targets = [
    path.join(distDir, 'KlikPOS_Movil_Satelite.apk'),
    path.join(distDir, 'VenematicPOS-Full-Mobile.apk'),
    path.join(distDir, 'VenematicPOS-Caja-Mobile.apk'),
    path.join(combo3Folder, 'KlikPOS_Movil_Full.apk'),
    path.join(combo1Folder, 'KlikPOS_Movil_Satelite.apk'),
    path.join(combo2Folder, 'KlikPOS_Movil_Satelite.apk')
  ];
  for (const t of targets) {
    fs.copyFileSync(signedPosApk, t);
    console.log('  [✓] Copiado a: ' + t);
  }

  console.log('>>> ¡KLIKPOS MÓVIL FULL / TABLET POS FIRMADA Y DISTRIBUIDA CON ÉXITO!');
}

ensureKeystore();
buildKeygenApk();
buildPosApk();

console.log('\n===============================================================');
console.log(' ¡TODAS LAS APKS HAN SIDO FIRMADAS CON CERTIFICADO RELEASE OFICIAL!');
console.log(' - KlikPOS Keygen (Celular): DISTRIBUCION_KLIKPOS/00_Herramientas_Desarrollador/KlikPOS_Keygen.apk');
console.log(' - KlikPOS Móvil Full (Tablet): DISTRIBUCION_KLIKPOS/03_Movil_Full_Autonomo/KlikPOS_Movil_Full.apk');
console.log('===============================================================\n');
