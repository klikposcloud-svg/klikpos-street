const fs = require('fs');
const path = require('path');

const TOKEN = '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';
const TAG = 'v2.4.5';
const REPO = 'klikposcloud-svg/klikpos-releases';
const TITLE = 'KlikPOS Enterprise v2.4.5 - Modo Standalone Tablet & Móvil, Dock Curvo Animado y 4 Estilos de Cards';
const NOTES = `### Novedades en KlikPOS Enterprise v2.4.5:
- **Modo Standalone Tablet / Móvil (/tablet-pos):** Interfaz táctil 100% autónoma para puestos de comida rápida, food trucks y comercio ambulante sin requerir PC/laptop.
- **Dock Inferior Curvo Animado:** Dock orgánico con hendidura cóncava y botón central flotante sobredimensionado 'Cobrar' con pulso de aura en vivo.
- **4 Estilos de Vista de Cards:**
  1. *Food:* Cards grandes con foto hero de alta resolución, chips de ingredientes, tiempo de preparación y etiquetas.
  2. *Cuadrícula:* Estándar ergonómica de 2 a 4 columnas sin truncamiento de títulos.
  3. *Lista:* Alta densidad para inventario masivo en abastos y bodegas.
  4. *Minimalista:* Botones táctiles de alto contraste para máxima velocidad en horas pico.
- **Identidad Oficial KlikPOS:** Blanco Puro con logotipo y acentos en Gris Grafito (#1e293b / #0f172a).
- **Selector de Branding de Colores:** En el cajón de ajustes permite alternar al instante entre 9 paletas (Grafito, Esmeralda, Petróleo, Azul, etc.) y modo oscuro.
- **Modal de Personalización de Comida:** Opciones rápidas de 1-tap (Con todo, Sin cebolla, Extra tártara/ajo, etc.).
- **Doble Cajón Deslizable:** Ajustes con Menú QR WhatsApp e Impresora Bluetooth a la izquierda; Comanda activa a la derecha.`;

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
