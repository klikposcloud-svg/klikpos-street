import crypto from 'crypto';
import readline from 'readline';

const MASTER_SIGNING_SALT = 'VENEMATIC_SEC_SALT_2026_AIVYNTRAX_PRO_POS_V2';

function computeSignature(hwid, rif, plan, expiresAt) {
  const cleanHwid = hwid.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanRif = rif.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const payloadStr = `${cleanHwid}#${cleanRif}#${plan}#${expiresAt}#${MASTER_SIGNING_SALT}`;
  const fullHash = crypto.createHash('sha256').update(payloadStr, 'utf8').digest('hex').toUpperCase();
  return `${fullHash.slice(0, 4)}-${fullHash.slice(4, 8)}-${fullHash.slice(8, 12)}-${fullHash.slice(12, 16)}`;
}

export function generateLicenseKey(hwid, rif, plan, expiresAtDateStr) {
  const planPrefix = plan === 'vitalicia' ? 'VIT' : plan === 'anual' ? 'ANL' : 'DMO';
  const expires = plan === 'vitalicia' ? 'NEVER' : (expiresAtDateStr || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]);
  const sig = computeSignature(hwid, rif, plan, expires);
  const expCode = expires === 'NEVER' ? 'PERP' : expires.replace(/-/g, '').slice(2, 6);
  return `VNK-${planPrefix}-${expCode}-${sig}`;
}

// Ejecución interactiva por consola
if (process.argv[1] && process.argv[1].endsWith('generar-licencia.mjs')) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

console.log('================================================================');
console.log('       VENEMATIC POS - GENERADOR MAESTRO DE LICENCIAS OFFLINE    ');
console.log('================================================================\n');

rl.question('1. Ingrese el HWID del cliente (ej: VN8F-3A12-9C84-7F21): ', (hwid) => {
  if (!hwid.trim()) {
    console.log('\n[ERROR] El HWID es obligatorio.');
    rl.close();
    return;
  }

  rl.question('2. Ingrese el RIF o Cédula del comercio (ej: J-12345678-9): ', (rif) => {
    if (!rif.trim()) {
      console.log('\n[ERROR] El RIF es obligatorio.');
      rl.close();
      return;
    }

    console.log('\nSeleccione el tipo de plan:');
    console.log('  [1] Vitalicia / Perpetua (Pago único, sin vencimiento)');
    console.log('  [2] Anual (Suscripción válida por 365 días)');
    console.log('  [3] Demo / Prueba (Válida por 30 días)');
    
    rl.question('\nOpción [1-3, por defecto 1]: ', (planOpt) => {
      let plan = 'vitalicia';
      if (planOpt.trim() === '2') plan = 'anual';
      if (planOpt.trim() === '3') plan = 'demo';

      const key = generateLicenseKey(hwid, rif, plan);

      console.log('\n================================================================');
      console.log('                     LICENCIA GENERADA CON ÉXITO                ');
      console.log('================================================================');
      console.log(`Cliente / RIF : ${rif.toUpperCase()}`);
      console.log(`HWID Destino  : ${hwid.toUpperCase()}`);
      console.log(`Plan Emitido  : ${plan.toUpperCase()}`);
      console.log('----------------------------------------------------------------');
      console.log(`CLAVE PRODUCTO: ${key}`);
      console.log('================================================================\n');
      console.log('Copie y envíe esta clave a su cliente para que la pegue en el POS.\n');

      rl.close();
    });
  });
});
}
