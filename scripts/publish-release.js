// scripts/publish-release.js
// Automatización Quirúrgica del Protocolo Oficial de Distribución OTA KlikPOS

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let TOKEN = process.env.GITHUB_RELEASE_TOKEN || process.env.GITHUB_TOKEN;
if (!TOKEN) {
  try {
    const gitUrl = execSync('git remote get-url origin').toString().trim();
    const match = gitUrl.match(/https:\/\/[^:]+:([^@]+)@/);
    if (match) TOKEN = match[1];
  } catch {}
}
const REPO_OWNER = 'klikposcloud-svg';
const REPO_RELEASES = 'klikpos-releases';

async function main() {
  console.log('=================================================================');
  console.log('🚀 KLIKPOS SURGICAL OTA RELEASE PIPELINE');
  console.log('=================================================================');

  const rootDir = path.resolve(__dirname, '..');
  const versionFile = path.join(rootDir, 'version.json');

  if (!fs.existsSync(versionFile)) {
    console.error('❌ No se encontró version.json en la raíz');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
  const version = manifest.version;
  const tagName = `v${version}`;

  console.log(`📌 Versión a certificar y publicar: ${version} (${tagName})`);
  console.log(`📌 Título: ${manifest.title}`);

  // 1. Validar TypeScript
  console.log('\n[Paso 1/5] Validando integridad TypeScript (tsc --noEmit)...');
  try {
    execSync('npx tsc --noEmit', { cwd: rootDir, stdio: 'inherit' });
    console.log('✓ TypeScript verificado (0 errores)');
  } catch (err) {
    console.error('❌ Error de compilación TypeScript. Corrige los tipos antes de publicar.');
    process.exit(1);
  }

  // 2. Commit y Push a repositorios de código
  console.log('\n[Paso 2/5] Sincronizando repositorios de código (origin y street)...');
  try {
    execSync('git add .', { cwd: rootDir, stdio: 'inherit' });
    try {
      execSync(`git commit -m "release: bump and sync to ${tagName}"`, { cwd: rootDir, stdio: 'inherit' });
    } catch {}
    execSync('git push origin main', { cwd: rootDir, stdio: 'inherit' });
    execSync('git push street main', { cwd: rootDir, stdio: 'inherit' });
    console.log('✓ Código sincronizado en origin y street');
  } catch (err) {
    console.warn('Nota en git push código:', err.message);
  }

  // 3. Sincronizar repositorio klikpos-releases
  console.log('\n[Paso 3/5] Sincronizando repositorio klikpos-releases...');
  const tempReleasesDir = path.join(rootDir, '..', 'temp-releases-sync');
  if (fs.existsSync(tempReleasesDir)) {
    fs.rmSync(tempReleasesDir, { recursive: true, force: true });
  }

  try {
    const cloneUrl = `https://${REPO_OWNER}:${TOKEN}@github.com/${REPO_OWNER}/${REPO_RELEASES}.git`;
    execSync(`git clone ${cloneUrl} "${tempReleasesDir}"`, { stdio: 'inherit' });
    
    // Copiar version.json
    fs.copyFileSync(versionFile, path.join(tempReleasesDir, 'version.json'));

    execSync('git config user.email "klikposcloud@gmail.com"', { cwd: tempReleasesDir });
    execSync('git config user.name "KlikPOS Team"', { cwd: tempReleasesDir });
    execSync('git add version.json', { cwd: tempReleasesDir });
    try {
      execSync(`git commit -m "release: publish manifest for ${tagName}"`, { cwd: tempReleasesDir, stdio: 'inherit' });
    } catch {}
    execSync('git push origin main', { cwd: tempReleasesDir, stdio: 'inherit' });
    execSync(`git tag -f ${tagName}`, { cwd: tempReleasesDir });
    execSync(`git push origin -f ${tagName}`, { cwd: tempReleasesDir, stdio: 'inherit' });
    console.log(`✓ Manifiesto y tag ${tagName} sincronizados en ${REPO_RELEASES}`);
  } catch (err) {
    console.error('Error sincronizando repo releases:', err);
  } finally {
    try {
      if (fs.existsSync(tempReleasesDir)) {
        fs.rmSync(tempReleasesDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
      }
    } catch (e) {}
  }

  // 4. Crear o Actualizar Objeto GitHub Release vía API
  console.log('\n[Paso 4/5] Publicando GitHub Release formal vía API...');
  let releaseId = null;

  try {
    const checkRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_RELEASES}/releases/tags/${tagName}`, {
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent': 'KlikPOS-Pipeline'
      }
    });

    if (checkRes.ok) {
      const existing = await checkRes.json();
      releaseId = existing.id;
      console.log(`✓ GitHub Release existente detectada (ID: ${releaseId})`);
    } else {
      const createRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_RELEASES}/releases`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'KlikPOS-Pipeline'
        },
        body: JSON.stringify({
          tag_name: tagName,
          target_commitish: 'main',
          name: manifest.title || `KlikPOS Suite ${tagName}`,
          body: Array.isArray(manifest.notes) ? manifest.notes.map(n => `• ${n}`).join('\n') : String(manifest.notes || ''),
          draft: false,
          prerelease: false
        })
      });

      const newRel = await createRes.json();
      if (newRel.id) {
        releaseId = newRel.id;
        console.log(`✓ ¡GitHub Release creada exitosamente! (ID: ${releaseId})`);
      } else {
        throw new Error(JSON.stringify(newRel));
      }
    }
  } catch (err) {
    console.error('Error creando GitHub Release:', err);
  }

  // 5. Subir Binarios Oficiales
  console.log('\n[Paso 5/5] Verificando y subiendo binarios (APK / EXE)...');
  const assetsToUpload = [
    {
      filePath: path.join(rootDir, 'dist-apk', 'KlikPOS_Street.apk'),
      fileName: 'KlikPOS_Street.apk',
      contentType: 'application/vnd.android.package-archive'
    },
    {
      filePath: path.join(rootDir, 'dist-apk', `KlikPOS_Street_${tagName}.apk`),
      fileName: `KlikPOS_Street_${tagName}.apk`,
      contentType: 'application/vnd.android.package-archive'
    },
    {
      filePath: path.join(rootDir, 'DISTRIBUCION_KLIKPOS', 'KlikPOS_Movil_Full.apk'),
      fileName: 'KlikPOS_Movil_Full.apk',
      contentType: 'application/vnd.android.package-archive'
    },
    {
      filePath: path.join(rootDir, 'dist-apk', 'KlikPOS_Keygen.apk'),
      fileName: 'KlikPOS_Keygen.apk',
      contentType: 'application/vnd.android.package-archive'
    },
    {
      filePath: path.join(rootDir, 'dist-installer', 'KlikPOS_Desktop_Full_Setup.exe'),
      fileName: 'KlikPOS_Desktop_Full_Setup.exe',
      contentType: 'application/octet-stream'
    },
    {
      filePath: path.join(rootDir, 'dist-installer', `KlikPOS_Street_${tagName}_Setup.exe`),
      fileName: `KlikPOS_Street_${tagName}_Setup.exe`,
      contentType: 'application/octet-stream'
    }
  ];

  if (releaseId) {
    // Obtener lista actual de assets de la release
    let currentAssets = [];
    try {
      const aRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_RELEASES}/releases/${releaseId}/assets`, {
        headers: {
          'Authorization': `token ${TOKEN}`,
          'User-Agent': 'KlikPOS-Pipeline'
        }
      });
      if (aRes.ok) {
        currentAssets = await aRes.json();
      }
    } catch (e) {}

    for (const item of assetsToUpload) {
      if (fs.existsSync(item.filePath)) {
        try {
          // Si el asset ya existe, eliminarlo para reemplazarlo con la versión fresca
          const existing = currentAssets.find(a => a.name === item.fileName);
          if (existing) {
            console.log(`  -> Reemplazando asset previo ${item.fileName} (ID: ${existing.id})...`);
            await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_RELEASES}/releases/assets/${existing.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `token ${TOKEN}`,
                'User-Agent': 'KlikPOS-Pipeline'
              }
            });
            console.log(`     ✓ Asset anterior eliminado.`);
          }

          console.log(`  -> Subiendo ${item.fileName} (${(fs.statSync(item.filePath).size / (1024*1024)).toFixed(2)} MB)...`);
          const fileData = fs.readFileSync(item.filePath);
          const uploadUrl = `https://uploads.github.com/repos/${REPO_OWNER}/${REPO_RELEASES}/releases/${releaseId}/assets?name=${item.fileName}`;

          const upRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `token ${TOKEN}`,
              'Content-Type': item.contentType,
              'Content-Length': fileData.length,
              'User-Agent': 'KlikPOS-Pipeline'
            },
            body: fileData
          });

          if (upRes.ok) {
            console.log(`     ✓ ${item.fileName} adjuntado con éxito.`);
          } else {
            const errJson = await upRes.json().catch(() => ({}));
            console.warn(`     Aviso al subir ${item.fileName}:`, errJson.message || upRes.status);
          }
        } catch (upErr) {
          console.warn(`     Error subiendo ${item.fileName}:`, upErr.message);
        }
      } else {
        console.warn(`  ⚠️ Archivo no encontrado localmente: ${item.filePath}`);
      }
    }
  }

  // PRUEBA DE HUMO FINAL EN VIVO
  console.log('\n=================================================================');
  console.log('🔍 PRUEBA DE HUMO EN VIVO (AUDITORÍA FINAL)');
  console.log('=================================================================');
  try {
    const probeRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_RELEASES}/releases/latest`, {
      headers: { 'User-Agent': 'KlikPOS-Probe' }
    });
    const probe = await probeRes.json();

    console.log(`• Última Release en GitHub API : ${probe.tag_name}`);
    console.log(`• Título Oficial               : ${probe.name}`);
    console.log(`• Binarios Adjuntos            : ${probe.assets?.length || 0} archivos`);

    if (probe.tag_name === tagName && (probe.assets?.length || 0) >= 2) {
      console.log('\n🎉 CERTIFICACIÓN EXITOSA: La versión está 100% activa y visible para cualquier dispositivo.');
    } else {
      console.warn('\n⚠️ Discrepancia detectada en la prueba de verificación. Revisa la salida.');
    }
  } catch (probeErr) {
    console.error('Error en prueba de verificación:', probeErr.message);
  }
}

main().catch(console.error);
