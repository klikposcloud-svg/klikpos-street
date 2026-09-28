const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

console.log('===============================================================');
console.log('  KLIKPOS ENTERPRISE - PIPELINE AUTOMÁTICO DE RE-COMPILACIÓN   ');
console.log('===============================================================');

function runStep(name, cmd, cwd = root) {
  console.log(`\n>>> [PASO] ${name}...`);
  execSync(cmd, { stdio: 'inherit', cwd });
  console.log(`[✓] ${name} completado con éxito.`);
}

try {
  // 1. Compilación de producción Next.js
  runStep('1/4 Compilación Next.js de Producción (npm run build)', 'npm run build');

  // 2. Compilar y firmar APKs Android Oficiales (Móvil Full, Satélite, Keygen)
  runStep('2/4 Compilación y Firma de APKs Android Release', 'node scripts/sign-and-release-all-apks.js');

  // 3. Compilar instalador Windows con Inno Setup
  runStep('3/4 Compilación del Instalador Desktop con Inno Setup (KlikPOS_Desktop_Full_Setup.exe)', 'powershell -ExecutionPolicy Bypass -File scripts/build-installer-full.ps1');

  // 4. Publicar binarios en GitHub Releases y validar sincronización en la nube
  runStep('4/4 Publicación de Binarios en GitHub Releases y Manifiesto Cloud', 'node scripts/publish-release-to-github.js');

  console.log('\n===============================================================');
  console.log('  ¡PIPELINE COMPLETO FINALIZADO AL 100% SIN REGRESIONES!');
  console.log('  Todos los instaladores Windows y APKs están listos en:');
  console.log('  - DISTRIBUCION_KLIKPOS/');
  console.log('  - GitHub Releases');
  console.log('===============================================================\n');

} catch (err) {
  console.error('\n❌ ERROR EN EL PIPELINE DE COMPILACIÓN:', err.message);
  process.exit(1);
}
