const fs = require('fs');
const path = require('path');

const TOKEN = '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';
const TAG = 'v2.4.6';
const REPO = 'klikposcloud-svg/klikpos-releases';
const TITLE = 'KlikPOS Enterprise v2.4.6 - Modo Oscuro Personalizable WCAG AAA, Modo Esmerilado Diferenciado y Calculadora de Alto Contraste';
const NOTES = `### Novedades en KlikPOS Enterprise v2.4.6:
- **Modo Oscuro Personalizable con Motor WCAG AAA:**
  - 6 Presets de matiz ambiental: Negro Puro OLED (#000000), Carbón Neutral (#121212), Azul Medianoche (#0a192f), Esmeralda Nocturno (#051814), Púrpura Nocturno (#0f0d24) y Selector Hexadecimal libre.
  - Calibración automática de ratio de contraste en tiempo real (≥ 12:1) con badge de cumplimiento accesible.
- **Diferenciación Visual Radical del Modo Esmerilado (Frosted Glass):**
  - Ambient multi-point mesh gradient tricolor (#070e17 base) con paneles de vidrio satinado y desenfoque óptico de 16px.
- **Teclado Numérico y Calculadora POS de Alto Contraste:**
  - Números y caracteres 100% nítidos en blanco puro (#ffffff) sobre teclas slate en Modo Oscuro y cristal esmerilado, eliminando cualquier invisibilidad.
- **Botón 'Regresar al Punto de Venta':**
  - Ajustado con texto negro nítido (#0f172a) sobre fondo blanco (#ffffff) de acuerdo con los estándares de diseño.
- **Ícono Activo de la Barra Lateral:**
  - Ícono blanco puro (#ffffff) con relleno y trazo nítido al estar seleccionado sobre contenedor azul.
- **APKs Móviles Distribuidas:**
  - Actualizadas en DISTRIBUCION_KLIKPOS/03_Movil_Full_Autonomo/ y combos satélite.`;

async function main() {
  console.log(`[1/4] Creando / verificando Release ${TAG} en https://github.com/${REPO}...`);
  
  // 1. Obtener o crear Release
  let release;
  const listRes = await fetch(`https://api.github.com/repos/${REPO}/releases`, {
    headers: { Authorization: `token ${TOKEN}`, 'User-Agent': 'KlikPOS-Publisher' }
  });
  const releases = await listRes.json();
  release = releases.find(r => r.tag_name === TAG);

  if (!release) {
    const createRes = await fetch(`https://api.github.com/repos/${REPO}/releases`, {
      method: 'POST',
      headers: {
        Authorization: `token ${TOKEN}`,
        'User-Agent': 'KlikPOS-Publisher',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tag_name: TAG,
        target_commitish: 'main',
        name: TITLE,
        body: NOTES,
        draft: false,
        prerelease: false
      })
    });
    release = await createRes.json();
    if (!release.id) {
      throw new Error(`Fallo al crear release: ${JSON.stringify(release)}`);
    }
    console.log(`Release creada exitosamente (ID: ${release.id}). URL: ${release.html_url}`);
  } else {
    console.log(`Release existente encontrada (ID: ${release.id}). URL: ${release.html_url}`);
  }

  // 2. Subir binario Windows Oficial
  const exePath = path.resolve(__dirname, '../DISTRIBUCION_KLIKPOS/02_Combo_Empresarial_Full/KlikPOS_Desktop_Full_Setup.exe');
  if (fs.existsSync(exePath)) {
    const exeName = 'KlikPOS_Desktop_Full_Setup.exe';
    console.log(`[2/4] Subiendo instalador oficial de Windows: ${exeName} (${(fs.statSync(exePath).size / (1024*1024)).toFixed(2)} MB)...`);
    await uploadAsset(release, exePath, exeName, 'application/vnd.microsoft.portable-executable');
  } else {
    console.warn(`[!] No se encontro el ejecutable en ${exePath}`);
  }

  // 3. Subir APK Android Oficial
  const apkPath = path.resolve(__dirname, '../DISTRIBUCION_KLIKPOS/03_Movil_Full_Autonomo/KlikPOS_Movil_Full.apk');
  if (fs.existsSync(apkPath)) {
    const apkName = 'KlikPOS_Movil_Full.apk';
    console.log(`[3/4] Subiendo APK Android: ${apkName} (${(fs.statSync(apkPath).size / (1024*1024)).toFixed(2)} MB)...`);
    await uploadAsset(release, apkPath, apkName, 'application/vnd.android.package-archive');
  }

  console.log(`[4/4] Proceso finalizado. Los binarios están disponibles públicamente en:`);
  console.log(`Windows: https://github.com/${REPO}/releases/download/${TAG}/KlikPOS_Desktop_Full_Setup.exe`);
  console.log(`Android: https://github.com/${REPO}/releases/download/${TAG}/KlikPOS_Movil_Full.apk`);
}

async function uploadAsset(release, filePath, fileName, contentType) {
  // Eliminar asset previo con el mismo nombre si existe
  if (release.assets && release.assets.length > 0) {
    const existing = release.assets.find(a => a.name === fileName);
    if (existing) {
      console.log(`Eliminando asset previo ${fileName} (ID: ${existing.id})...`);
      await fetch(`https://api.github.com/repos/${REPO}/releases/assets/${existing.id}`, {
        method: 'DELETE',
        headers: { Authorization: `token ${TOKEN}`, 'User-Agent': 'KlikPOS-Publisher' }
      });
    }
  }

  const uploadUrl = release.upload_url.replace(/\{.*\}/, `?name=${encodeURIComponent(fileName)}`);
  const fileBuffer = fs.readFileSync(filePath);

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `token ${TOKEN}`,
      'User-Agent': 'KlikPOS-Publisher',
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length
    },
    body: fileBuffer
  });

  const data = await res.json();
  if (data.id) {
    console.log(`   OK Asset ${fileName} subido exitosamente (ID: ${data.id})`);
    console.log(`   Descarga directa: ${data.browser_download_url}`);
  } else {
    console.error(`   Error al subir asset ${fileName}:`, data);
  }
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
