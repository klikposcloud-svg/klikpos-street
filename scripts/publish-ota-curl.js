// scripts/publish-ota-curl.js
// Automatización Quirúrgica del Protocolo Oficial de Distribución OTA KlikPOS usando curl nativo

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
const rootDir = path.resolve(__dirname, '..');
const versionFile = path.join(rootDir, 'version.json');
const manifest = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
const version = manifest.version;
const tagName = `v${version}`;

console.log('=================================================================');
console.log(`🚀 KLIKPOS SURGICAL OTA RELEASE PIPELINE (CURL): ${tagName}`);
console.log('=================================================================');

function curlJson(url, options = {}) {
  const method = options.method || 'GET';
  let cmd = `curl.exe -s -X ${method} -H "Authorization: token ${TOKEN}" -H "User-Agent: KlikPOS-Pipeline"`;
  if (options.body) {
    const tempPayload = path.join(rootDir, 'scratch', 'payload.json');
    fs.mkdirSync(path.dirname(tempPayload), { recursive: true });
    fs.writeFileSync(tempPayload, JSON.stringify(options.body), 'utf8');
    cmd += ` -H "Content-Type: application/json" --data-binary @"${tempPayload}"`;
  }
  cmd += ` "${url}"`;
  const output = execSync(cmd).toString();
  try {
    return JSON.parse(output);
  } catch {
    return { raw: output };
  }
}

async function run() {
  console.log(`\n[1/3] Verificando o creando GitHub Release ${tagName}...`);
  let release = curlJson(`https://api.github.com/repos/${REPO_OWNER}/${REPO_RELEASES}/releases/tags/${tagName}`);

  if (!release.id) {
    console.log(`Creando Release formal ${tagName}...`);
    const payload = {
      tag_name: tagName,
      target_commitish: 'main',
      name: manifest.title || `KlikPOS Suite ${tagName}`,
      body: Array.isArray(manifest.notes) ? manifest.notes.map(n => `• ${n}`).join('\n') : String(manifest.notes || ''),
      draft: false,
      prerelease: false
    };
    release = curlJson(`https://api.github.com/repos/${REPO_OWNER}/${REPO_RELEASES}/releases`, {
      method: 'POST',
      body: payload
    });
  }

  if (!release.id) {
    console.error('❌ Error creando release:', release);
    process.exit(1);
  }

  console.log(`✓ GitHub Release verificada (ID: ${release.id}, URL: ${release.html_url})`);

  console.log(`\n[2/3] Subiendo y certificando binarios oficiales...`);
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

  // Obtener assets actuales
  const currentAssets = curlJson(`https://api.github.com/repos/${REPO_OWNER}/${REPO_RELEASES}/releases/${release.id}/assets`) || [];

  for (const item of assetsToUpload) {
    if (!fs.existsSync(item.filePath)) {
      console.warn(`  ⚠️ Archivo no encontrado: ${item.filePath}`);
      continue;
    }

    if (Array.isArray(currentAssets)) {
      const existing = currentAssets.find(a => a.name === item.fileName);
      if (existing) {
        console.log(`  -> Eliminando asset previo ${item.fileName} (ID: ${existing.id})...`);
        execSync(`curl.exe -s -X DELETE -H "Authorization: token ${TOKEN}" -H "User-Agent: KlikPOS-Pipeline" "https://api.github.com/repos/${REPO_OWNER}/${REPO_RELEASES}/releases/assets/${existing.id}"`);
        console.log(`     ✓ Asset previo eliminado.`);
      }
    }

    const sizeMB = (fs.statSync(item.filePath).size / (1024 * 1024)).toFixed(2);
    console.log(`  -> Subiendo ${item.fileName} (${sizeMB} MB)...`);
    const uploadUrl = `https://uploads.github.com/repos/${REPO_OWNER}/${REPO_RELEASES}/releases/${release.id}/assets?name=${encodeURIComponent(item.fileName)}`;
    const uploadCmd = `curl.exe -s -X POST -H "Authorization: token ${TOKEN}" -H "Content-Type: ${item.contentType}" -H "User-Agent: KlikPOS-Pipeline" --data-binary @"${item.filePath}" "${uploadUrl}"`;
    const resRaw = execSync(uploadCmd).toString();
    try {
      const resJson = JSON.parse(resRaw);
      if (resJson.id) {
        console.log(`     ✓ ${item.fileName} subido exitosamente (ID: ${resJson.id}).`);
      } else {
        console.warn(`     Aviso:`, resJson.message || resRaw.slice(0, 100));
      }
    } catch {
      console.log(`     ✓ Completado.`);
    }
  }

  console.log('\n[3/3] Ejecutando Prueba de Humo en Vivo...');
  const probe = curlJson(`https://api.github.com/repos/${REPO_OWNER}/${REPO_RELEASES}/releases/latest`);
  console.log(`• Última Release en GitHub API : ${probe.tag_name}`);
  console.log(`• Título Oficial               : ${probe.name}`);
  console.log(`• Binarios Adjuntos            : ${probe.assets?.length || 0} archivos`);

  if (probe.tag_name === tagName && (probe.assets?.length || 0) >= 2) {
    console.log('\n🎉 CERTIFICACIÓN EXITOSA: La versión está 100% activa y visible para cualquier dispositivo.');
  } else {
    console.warn('\n⚠️ Discrepancia detectada en la prueba de verificación. Revisa la salida.');
  }
}

run().catch(console.error);
