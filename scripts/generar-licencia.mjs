import crypto from 'crypto';
import readline from 'readline';

const MASTER_SIGNING_SALT = 'VENEMATIC_SEC_SALT_2026_AIVYNTRAX_PRO_POS_V2';

const PLAN_CONFIG = {
  starter_trial: { prefix: 'STT', label: 'Starter - 1ra Cuota ($25)',           desc: '30 dias (espera 2do pago $25)',    days: 30   },
  starter_full:  { prefix: 'STR', label: 'Starter - Licencia Completa ($50)',    desc: 'PERMANENTE sin vencimiento',       days: null },
  pro_trial:     { prefix: 'PTT', label: 'Pro     - 1ra Cuota ($37.50)',         desc: '30 dias (espera 2do pago $37.50)', days: 30   },
  pro_full:      { prefix: 'PRO', label: 'Pro     - Licencia Completa ($75)',     desc: 'PERMANENTE sin vencimiento',       days: null },
  demo:          { prefix: 'DMO', label: 'Demo / Evaluacion (GRATIS)',            desc: '15 dias, sin pago',               days: 15   },
  anual:         { prefix: 'ANL', label: 'Anual (365 dias) [legacy]',            desc: 'Renovacion anual',                days: 365  },
  vitalicia:     { prefix: 'VIT', label: 'Vitalicia [legacy]',                   desc: 'PERMANENTE',                      days: null },
  trial_15m:     { prefix: 'T15', label: 'Prueba Flash - 15 Minutos (Pre-pago)', desc: '15 minutos exactos (se desactiva)', days: '15m' },
};

function computeSignature(hwid, rif, plan, expiresAt) {
  const cleanHwid = hwid.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanRif  = rif.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const payloadStr = `${cleanHwid}#${cleanRif}#${plan}#${expiresAt}#${MASTER_SIGNING_SALT}`;
  const fullHash = crypto.createHash('sha256').update(payloadStr, 'utf8').digest('hex').toUpperCase();
  return `${fullHash.slice(0,4)}-${fullHash.slice(4,8)}-${fullHash.slice(8,12)}-${fullHash.slice(12,16)}`;
}

export function generateLicenseKey(hwid, rif, plan, expiresAtDateStr) {
  const cfg = PLAN_CONFIG[plan] || PLAN_CONFIG['demo'];
  let expires;
  let expCode;

  if (cfg.days === null) {
    expires = 'NEVER';
    expCode = 'PERP';
  } else if (cfg.days === '15m') {
    expires = '15MIN';
    expCode = '15MN';
  } else {
    expires = expiresAtDateStr || new Date(Date.now() + cfg.days * 86400000).toISOString().split('T')[0];
    expCode = expires.replace(/-/g, '').slice(2, 6);
  }

  const sig = computeSignature(hwid, rif, plan, expires);
  return `VNK-${cfg.prefix}-${expCode}-${sig}`;
}

if (process.argv[1] && process.argv[1].endsWith('generar-licencia.mjs')) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('');
  console.log('=================================================================');
  console.log('       VENEMATIC POS - GENERADOR MAESTRO DE LICENCIAS v2        ');
  console.log('=================================================================\n');

  rl.question('1. HWID del cliente (ej: VN8F-3A12-9C84-7F21 o ANDR-...): ', (hwid) => {
    if (!hwid.trim()) { console.log('\n[ERROR] HWID obligatorio.'); rl.close(); return; }

    rl.question('2. RIF o Cedula del comercio (ej: J-12345678-9): ', (rif) => {
      if (!rif.trim()) { console.log('\n[ERROR] RIF obligatorio.'); rl.close(); return; }

      console.log('\n--- PLANES DISPONIBLES ---');
      console.log('  [1] Starter - 1ra Cuota      $25     -> 30 dias Starter completo');
      console.log('  [2] Starter - Licencia Full  $50     -> PERMANENTE (2da cuota pagada)');
      console.log('  [3] Pro     - 1ra Cuota      $37.50  -> 30 dias Pro completo');
      console.log('  [4] Pro     - Licencia Full  $75     -> PERMANENTE (2da cuota pagada)');
      console.log('  [5] Demo / Evaluacion        GRATIS  -> 15 dias');
      console.log('  [6] Anual (legacy)                   -> 365 dias');
      console.log('  [7] Prueba Flash - 15 Min    PRUEBA  -> 15 minutos (se bloquea si no paga)');
      console.log('');
      console.log('  STARTER: POS + Inventario + Impresion + Etiquetas + 2 cajeros');
      console.log('  PRO agrega: +Nube Firebase +Gmail Pago Movil +Balanza +Reportes +Cajeros ilimitados\n');

      rl.question('Opcion [1-7, ENTER=1]: ', (opt) => {
        const planMap = { 
          '1':'starter_trial',
          '2':'starter_full',
          '3':'pro_trial',
          '4':'pro_full',
          '5':'demo',
          '6':'anual',
          '7':'trial_15m'
        };
        const plan = planMap[opt.trim()] || 'starter_trial';
        const cfg = PLAN_CONFIG[plan];
        const key = generateLicenseKey(hwid, rif, plan);
        const expiryInfo = cfg.days === null 
          ? 'SIN VENCIMIENTO (Permanente)' 
          : cfg.days === '15m' 
            ? '15 MINUTOS desde la activacion (se desactiva automaticamente)' 
            : `Valida ${cfg.days} dias desde activacion`;

        console.log('\n=================================================================');
        console.log('                  LICENCIA GENERADA CON EXITO                   ');
        console.log('=================================================================');
        console.log(`  RIF/Cedula     : ${rif.trim().toUpperCase()}`);
        console.log(`  HWID Destino   : ${hwid.trim().toUpperCase()}`);
        console.log(`  Plan           : ${cfg.label}`);
        console.log(`  Vencimiento    : ${expiryInfo}`);
        console.log('-----------------------------------------------------------------');
        console.log(`  CLAVE PRODUCTO : ${key}`);
        console.log('=================================================================\n');

        if (plan === 'trial_15m') {
          console.log('>> AVISO PRUEBA FLASH 15 MIN:');
          console.log('   La app se desbloqueara solo por 15 minutos en el dispositivo.');
          console.log('   Al cumplirse los 15 minutos exactos, la app se bloqueara automaticamente');
          console.log('   mostrando la pantalla de compra. Cuando el cliente pague, generala con');
          console.log('   la opcion [1] Starter ($25) o [2] Full ($50) usando el mismo HWID y RIF.\n');
        } else if (plan === 'starter_trial') {
          console.log('>> RECORDATORIO 1ra cuota Starter: cobrar $25 restantes en ~15 dias.');
          console.log('   Al recibir pago, generar clave opcion [2] con el mismo HWID y RIF.\n');
        } else if (plan === 'pro_trial') {
          console.log('>> RECORDATORIO 1ra cuota Pro: cobrar $37.50 restantes en ~15 dias.');
          console.log('   Al recibir pago, generar clave opcion [4] con el mismo HWID y RIF.\n');
        }

        rl.close();
      });
    });
  });
}
