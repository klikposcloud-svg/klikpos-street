const fs = require('fs');
const path = require('path');

const TOKEN = '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';
const TAG = 'v2.4.7';
const REPO = 'klikposcloud-svg/klikpos-releases';
const TITLE = 'KlikPOS Enterprise v2.4.7 - 5 Ediciones Oficiales, Modo Oscuro con Coloración Total y Sincronización Firestore';
const NOTES = `### Novedades en KlikPOS Enterprise v2.4.7:
- **Modo Oscuro con Coloración Total Personalizable:**
  - Se eliminaron las reglas forzadas de color azul para permitir que la pantalla completa adopte el tono seleccionado: Negro Puro OLED (#000000), Grafito Carbón (#121212), Esmeralda Nocturno (#051814), Púrpura Nocturno (#0f0d24), Azul Medianoche (#0a192f) o cualquier código hexadecimal libre con contraste WCAG AAA.
- **Lanzamiento de las 5 Ediciones Oficiales de KlikPOS:**
  - 01_KlikPOS_Satelite_PC_Contingencia: Companion para PC con escáner y venta sin luz.
  - 02_Combo_Empresarial_Full: Versión Windows completa con balanza, lector, impresora y servidor local.
  - 03_KlikPOS_Tablet_Standalone_Mesas: 100% desligada de PC para restaurantes, mesas, comanda y Pago Móvil.
  - 04_KlikPOS_Movil_Full_Autonomo_Nube: Retail autónomo en teléfono con escáner láser y balanza.
  - 05_KlikPOS_Movil_Full_Para_PC: Companion remoto total conectado al servidor de la PC.
- **Botón Central Diferenciado en Barra Inferior:**
  - Botón COBRAR (CircleDollarSign) para la edición Tablet Mesas.
  - Botón ESCÁNER (Cámara 60 FPS) para las ediciones Retail, Satélite y Companion.
- **Librería de Sincronización en la Nube Firestore:**
  - Colecciones estructuradas por edición, comercio y licencia con actualización automática de tasas BCV en vivo.`;

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
