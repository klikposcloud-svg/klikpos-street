const fs = require('fs');
const path = require('path');

const TOKEN = process.env.GITHUB_RELEASE_TOKEN || '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';
const REPO = 'klikposcloud-svg/klikpos-releases';

// Cargar dinámicamente del manifiesto maestro version.json
const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'version.json');
if (!fs.existsSync(manifestPath)) {
  throw new Error(`No se encontró version.json en ${manifestPath}`);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const TAG = `v${manifest.version.replace(/^v/, '')}`;
const TITLE = manifest.title || `KlikPOS Enterprise ${TAG}`;
const NOTES = Array.isArray(manifest.notes)
  ? `### Novedades en KlikPOS Enterprise ${TAG}:\n` + manifest.notes.map(n => `- ${n}`).join('\n')
  : (manifest.notes || `Lanzamiento de ${TAG}`);

const { execSync } = require('child_process');

async function main() {
  console.log(`[1/5] Sincronizando repositorio klikpos-releases hacia GitHub...`);
  const releasesDir = path.join(rootDir, 'klikpos-releases');
  if (fs.existsSync(releasesDir)) {
    try {
      execSync('git add -A', { cwd: releasesDir, stdio: 'pipe' });
      const status = execSync('git status --porcelain', { cwd: releasesDir, stdio: 'pipe' }).toString();
      if (status.trim().length > 0) {
        execSync(`git commit -m "release: actualizar manifiesto a ${TAG}"`, { cwd: releasesDir, stdio: 'pipe' });
      }
      execSync('git push origin main', { cwd: releasesDir, stdio: 'pipe' });
      console.log(' [✓] Repositorio klikpos-releases sincronizado y pusheado exitosamente.');
    } catch (err) {
      console.warn(' [!] Advertencia al sincronizar klikpos-releases:', err.message);
    }
  }

  console.log(`[2/5] Creando / verificando Release ${TAG} en https://github.com/${REPO}...`);
  
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

  // 2. Subir binarios Windows Oficiales desde 'KlikPOS Release'
  const windowsAssets = [
    { name: 'KlikPOS_Lite_Setup.exe', relPath: 'KlikPOS Release/01_KlikPOS_Lite_Desktop/KlikPOS_Lite_Setup.exe' },
    { name: 'KlikPOS_Pro_Setup.exe', relPath: 'KlikPOS Release/02_KlikPOS_Pro_Desktop/KlikPOS_Pro_Setup.exe' },
    { name: 'KlikPOS_Elite_Setup.exe', relPath: 'KlikPOS Release/03_KlikPOS_Elite_Desktop/KlikPOS_Elite_Setup.exe' },
    { name: 'KlikPOS_Desktop_Full_Setup.exe', relPath: 'KlikPOS Release/03_KlikPOS_Elite_Desktop/KlikPOS_Elite_Setup.exe' }
  ];

  for (const win of windowsAssets) {
    const p = path.resolve(rootDir, win.relPath);
    if (fs.existsSync(p)) {
      console.log(`[3/5] Subiendo instalador Windows: ${win.name} (${(fs.statSync(p).size / (1024*1024)).toFixed(2)} MB)...`);
      await uploadAsset(release, p, win.name, 'application/vnd.microsoft.portable-executable');
    }
  }

  // 3. Subir APKs Android Oficiales desde 'KlikPOS Release'
  const androidAssets = [
    { name: 'KlikPOS_Movil.apk', relPath: 'KlikPOS Release/04_Apps_Moviles_Android/KlikPOS_Movil.apk' },
    { name: 'KlikPOS_Movil_Full.apk', relPath: 'KlikPOS Release/04_Apps_Moviles_Android/KlikPOS_Movil.apk' },
    { name: 'KlikPOS_Satelite.apk', relPath: 'KlikPOS Release/04_Apps_Moviles_Android/KlikPOS_Satelite.apk' },
    { name: 'KlikPOS_Movil_Satelite.apk', relPath: 'KlikPOS Release/04_Apps_Moviles_Android/KlikPOS_Satelite.apk' },
    { name: 'KlikPOS_Street.apk', relPath: 'KlikPOS Release/04_Apps_Moviles_Android/KlikPOS_Street.apk' },
    { name: 'KlikPOS_Tablet_Standalone_Mesas.apk', relPath: 'KlikPOS Release/04_Apps_Moviles_Android/KlikPOS_Street.apk' },
    { name: 'KlikAdmin.apk', relPath: 'KlikPOS Release/04_Apps_Moviles_Android/KlikAdmin.apk' },
    { name: 'KlikPOS_Keygen.apk', relPath: 'KlikPOS Release/00_Herramientas_Desarrollador/KlikPOS_Keygen.apk' }
  ];

  for (const apk of androidAssets) {
    const p = path.resolve(rootDir, apk.relPath);
    if (fs.existsSync(p)) {
      console.log(`[4/5] Subiendo APK Android: ${apk.name} (${(fs.statSync(p).size / (1024*1024)).toFixed(2)} MB)...`);
      await uploadAsset(release, p, apk.name, 'application/vnd.android.package-archive');
    }
  }

  // 4. Verificación en vivo del endpoint remoto
  console.log(`[5/5] Verificando disponibilidad pública del manifiesto en GitHub...`);
  try {
    const verifyRes = await fetch(`https://raw.githubusercontent.com/${REPO}/main/version.json?_t=${Date.now()}`, {
      cache: 'no-cache'
    });
    if (verifyRes.ok) {
      const liveManifest = await verifyRes.json();
      console.log(` [✓] Verificación en vivo exitosa: Servidor responde versión v${liveManifest.version}`);
    } else {
      console.warn(` [!] Endpoint respondió con código HTTP ${verifyRes.status}`);
    }
  } catch (err) {
    console.warn(' [!] Error al contactar endpoint de verificación:', err.message);
  }

  console.log(`\n===============================================================`);
  console.log(`  ¡PUBLICACIÓN EN LA NUBE COMPLETADA CON ÉXITO!`);
  console.log(`  Windows: https://github.com/${REPO}/releases/download/${TAG}/KlikPOS_Desktop_Full_Setup.exe`);
  console.log(`  Android: https://github.com/${REPO}/releases/download/${TAG}/KlikPOS_Movil_Full.apk`);
  console.log(`===============================================================\n`);
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
