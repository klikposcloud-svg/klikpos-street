/**
 * scripts/sync-version.js
 * Sincronizador Maestro Universal de Versiones para KlikPOS Enterprise
 * Garantiza que todos los manifiestos, instaladores y repositorios estén 100% en sincronía
 * evitando discrepancias entre la versión compilada y el actualizador en la nube.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'version.json');

if (!fs.existsSync(manifestPath)) {
  console.error(`[ERROR] No se encontró el manifiesto maestro en: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = (process.argv[2] || manifest.version || '').trim();

if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`[ERROR] Versión inválida: "${version}". Debe tener formato semántico X.Y.Z`);
  process.exit(1);
}

manifest.version = version;
manifest.releaseDate = manifest.releaseDate || new Date().toISOString().split('T')[0];
manifest.windowsUrl = `https://github.com/klikposcloud-svg/klikpos-releases/releases/download/v${version}/KlikPOS_Desktop_Full_Setup.exe`;
manifest.androidUrl = `https://github.com/klikposcloud-svg/klikpos-releases/releases/download/v${version}/KlikPOS_Movil_Full.apk`;

const manifestStr = JSON.stringify(manifest, null, 2) + '\n';

console.log('===============================================================');
console.log(`  SINCRONIZANDO VERSION MAESTRA KLIKPOS ENTERPRISE: v${version}`);
console.log('===============================================================');

// 1. Guardar version.json en raíz
fs.writeFileSync(manifestPath, manifestStr, 'utf8');
console.log(' [✓] version.json (raíz)');

// 2. Actualizar package.json en raíz
const rootPkgPath = path.join(rootDir, 'package.json');
if (fs.existsSync(rootPkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
  pkg.version = version;
  fs.writeFileSync(rootPkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(' [✓] package.json (raíz)');
}

// 3. Sincronizar public/version.json
const publicManifestPath = path.join(rootDir, 'public', 'version.json');
fs.writeFileSync(publicManifestPath, manifestStr, 'utf8');
console.log(' [✓] public/version.json');

// 4. Sincronizar dist-installer/version.json
const distInstallerDir = path.join(rootDir, 'dist-installer');
if (!fs.existsSync(distInstallerDir)) fs.mkdirSync(distInstallerDir, { recursive: true });
fs.writeFileSync(path.join(distInstallerDir, 'version.json'), manifestStr, 'utf8');
console.log(' [✓] dist-installer/version.json');

// 5. Sincronizar repositorio klikpos-releases/version.json
const releasesDir = path.join(rootDir, 'klikpos-releases');
if (fs.existsSync(releasesDir)) {
  const releasesManifestPath = path.join(releasesDir, 'version.json');
  fs.writeFileSync(releasesManifestPath, manifestStr, 'utf8');
  console.log(' [✓] klikpos-releases/version.json');

  // Intentar git add/commit automático en el subdirectorio de releases
  try {
    execSync('git add version.json', { cwd: releasesDir, stdio: 'pipe' });
    const diff = execSync('git diff --staged', { cwd: releasesDir, stdio: 'pipe' }).toString();
    if (diff.trim().length > 0) {
      execSync(`git commit -m "release(manifest): actualizar manifiesto oficial a v${version}"`, {
        cwd: releasesDir,
        stdio: 'pipe',
      });
      console.log(' [✓] klikpos-releases git commit registrado localmente');
    }
  } catch (err) {
    // Si no hay cambios o git local no está configurado, continuar pacíficamente
  }
}

// 6. Sincronizar venematic-desktop
const desktopDir = path.join(rootDir, 'venematic-desktop');
if (fs.existsSync(desktopDir)) {
  fs.writeFileSync(path.join(desktopDir, 'version.json'), manifestStr, 'utf8');
  console.log(' [✓] venematic-desktop/version.json');

  const desktopPkgPath = path.join(desktopDir, 'package.json');
  if (fs.existsSync(desktopPkgPath)) {
    const dPkg = JSON.parse(fs.readFileSync(desktopPkgPath, 'utf8'));
    dPkg.version = version;
    fs.writeFileSync(desktopPkgPath, JSON.stringify(dPkg, null, 2) + '\n', 'utf8');
    console.log(' [✓] venematic-desktop/package.json');
  }

  // 7. Sincronizar installer.iss
  const issPath = path.join(desktopDir, 'installer.iss');
  if (fs.existsSync(issPath)) {
    let issContent = fs.readFileSync(issPath, 'utf8');
    issContent = issContent.replace(/^AppVersion=.*/m, `AppVersion=${version}`);
    issContent = issContent.replace(/^OutputBaseFilename=.*/m, `OutputBaseFilename=KlikPOS-Enterprise-Setup-v${version}`);
    fs.writeFileSync(issPath, issContent, 'utf8');
    console.log(' [✓] venematic-desktop/installer.iss');
  }
}

console.log('---------------------------------------------------------------');
console.log(`¡Todas las referencias sincronizadas exitosamente a v${version}!`);
console.log('===============================================================\n');
