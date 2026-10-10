// Telegram Remote Bridge for KlikPOS Street Development
// Native Node.js long-polling - Zero extra dependencies required

const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');

const MASTER_SIGNING_SALT = 'VENEMATIC_SEC_SALT_2026_AIVYNTRAX_PRO_POS_V2';

const PLAN_CONFIG = {
  street_contado: { planInternal: 'starter_full',  prefix: 'STR', label: '⭐ Plan 1: Contado Street ($15 USD) - Permanente', days: null },
  street_credito: { planInternal: 'starter_trial', prefix: 'STT', label: '💳 Plan 2: Financiado Street ($20 USD) - 1ra Cuota $10 (15 días)', days: 15 },
  street_vip:     { planInternal: 'pro_full',      prefix: 'PRO', label: '👑 Plan 3: Completo Vitalicio Pro ($50 USD)', days: null },
  contado_15:     { planInternal: 'starter_full',  prefix: 'STR', label: '⭐ Plan 1: Contado Street ($15 USD) - Permanente', days: null },
  credito_20:     { planInternal: 'starter_trial', prefix: 'STT', label: '💳 Plan 2: Financiado Street ($20 USD) - 1ra Cuota $10 (15 días)', days: 15 },
  vip_50:         { planInternal: 'pro_full',      prefix: 'PRO', label: '👑 Plan 3: Completo Vitalicio Pro ($50 USD)', days: null },
  promo_6m:       { planInternal: 'promo_6m',      prefix: 'PRM', label: 'Promo 6 Meses con Nube ($35)', days: 180 },
  basico_local:   { planInternal: 'basico_local',  prefix: 'BAS', label: 'Basico Local - PERMANENTE ($40)', days: null },
  pro_full:       { planInternal: 'pro_full',      prefix: 'PRO', label: 'Pro Full Empresarial - PERMANENTE ($75)', days: null },
  demo:           { planInternal: 'demo',          prefix: 'DMO', label: 'Demo Evaluacion (15 dias)', days: 15 },
  vitalicia:      { planInternal: 'vitalicia',     prefix: 'VIT', label: 'Vitalicia Permanente', days: null },
};

function computeSignature(hwid, rif, plan, expiresAt) {
  const cleanHwid = hwid.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanRif  = rif.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const payloadStr = `${cleanHwid}#${cleanRif}#${plan}#${expiresAt}#${MASTER_SIGNING_SALT}`;
  const fullHash = crypto.createHash('sha256').update(payloadStr, 'utf8').digest('hex').toUpperCase();
  return `${fullHash.slice(0,4)}-${fullHash.slice(4,8)}-${fullHash.slice(8,12)}-${fullHash.slice(12,16)}`;
}

function generateLicenseKey(hwid, rif, plan) {
  let mappedPlan = plan;
  if (plan === '1' || plan === 'plan1' || plan === 'contado' || plan === '15') mappedPlan = 'street_contado';
  else if (plan === '2' || plan === 'plan2' || plan === 'credito' || plan === 'financiado' || plan === '10' || plan === '20') mappedPlan = 'street_credito';
  else if (plan === '3' || plan === 'plan3' || plan === 'vip' || plan === '50') mappedPlan = 'street_vip';

  const cfg = PLAN_CONFIG[mappedPlan] || PLAN_CONFIG['street_contado'];
  let expires;
  let expCode;

  if (cfg.days === null) {
    expires = 'NEVER';
    expCode = 'PERP';
  } else {
    const d = new Date(Date.now() + cfg.days * 86400000);
    const yy = d.getFullYear().toString().slice(2);
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    expires = `20${yy}-${mm}-28`;
    expCode = `${yy}${mm}`;
  }

  const planForSig = cfg.planInternal || mappedPlan;
  const sig = computeSignature(hwid, rif || 'V-PENDIENTE', planForSig, expires);
  return {
    key: `VNK-${cfg.prefix}-${expCode}-${sig}`,
    label: cfg.label,
    expires
  };
}

const TOKEN = '8699572842:AAHyw4tBMMC6YdqeGexrOqhQzNf2NdnH--M';
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const CAPTURAS_DIR = path.join(WORKSPACE_ROOT, 'capturas-calle');
const AUDIOS_DIR = path.join(CAPTURAS_DIR, 'audios');
const LOG_FILE = path.join(CAPTURAS_DIR, 'instrucciones.log');

// Ensure directories exist
if (!fs.existsSync(CAPTURAS_DIR)) fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
if (!fs.existsSync(AUDIOS_DIR)) fs.mkdirSync(AUDIOS_DIR, { recursive: true });

let lastUpdateId = 0;
let isPolling = false;
let lastPollTime = Date.now();

// Helper to make Telegram API requests with anti-hang watchdog
function telegramRequest(method, payload = {}) {
  return new Promise((resolve, reject) => {
    let finished = false;
    const data = JSON.stringify(payload);
    const url = new URL(`${BASE_URL}/${method}`);

    const safeReject = (err) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        reject(err);
      }
    };

    const safeResolve = (val) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve(val);
      }
    };

    const timer = setTimeout(() => {
      try { req.destroy(new Error('Watchdog timeout')); } catch {}
      safeReject(new Error('Telegram request timeout (watchdog)'));
    }, 40000);

    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      agent: false, // Evita conexiones socket zombis en Windows
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          safeResolve(parsed);
        } catch (e) {
          safeResolve({ ok: false, error: e.message, raw: body });
        }
      });
      res.on('error', safeReject);
    });

    req.on('error', safeReject);
    req.write(data);
    req.end();
  });
}

// Send text message
async function sendMessage(chatId, text, parseMode = 'Markdown') {
  try {
    return await telegramRequest('sendMessage', {
      chat_id: chatId,
      text: text,
      parse_mode: parseMode,
    });
  } catch (err) {
    console.error(`[Telegram] Error sending message:`, err.message);
  }
}

// Download file from Telegram
function downloadTelegramFile(filePath, destPath) {
  return new Promise((resolve, reject) => {
    const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${filePath}`;
    const fileStream = fs.createWriteStream(destPath);

    https.get(fileUrl, (res) => {
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(destPath);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// Get timestamp string
function getTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

// Process single message
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const fromName = msg.from ? (msg.from.first_name || msg.from.username || 'Desarrollador') : 'Desarrollador';
  const timestamp = getTimestamp();

  console.log(`[Telegram] Mensaje recibido de ${fromName} (${chatId})`);
  try {
    fs.writeFileSync(path.join(CAPTURAS_DIR, 'last_chat_id.txt'), String(chatId), 'utf-8');
  } catch {}

  // 1. Manejo de Fotos / Capturas de Pantalla
  if (msg.photo && msg.photo.length > 0) {
    // Tomar la versión de mayor resolución (última en el array)
    const bestPhoto = msg.photo[msg.photo.length - 1];
    const caption = msg.caption || '(Sin texto adjunto)';

    await sendMessage(chatId, `📥 *Descargando captura en tu PC...*`);

    try {
      const fileInfo = await telegramRequest('getFile', { file_id: bestPhoto.file_id });
      if (fileInfo.ok && fileInfo.result.file_path) {
        const ext = path.extname(fileInfo.result.file_path) || '.jpg';
        const filename = `captura_${timestamp}${ext}`;
        const savePath = path.join(CAPTURAS_DIR, filename);

        await downloadTelegramFile(fileInfo.result.file_path, savePath);

        // Guardar metadata e instrucción
        const metaPath = path.join(CAPTURAS_DIR, `captura_${timestamp}.txt`);
        const metaContent = `Fecha: ${new Date().toISOString()}\nDe: ${fromName}\nArchivo: ${filename}\nInstruccion: ${caption}\n`;
        fs.writeFileSync(metaPath, metaContent, 'utf-8');

        // Registrar en log general
        fs.appendFileSync(LOG_FILE, `[${new Date().toLocaleTimeString()}] CAPTURA: ${filename} | NOTA: ${caption}\n`);

        await sendMessage(chatId, 
          `✅ *¡Captura guardada en tu PC!*\n\n` +
          `📁 *Archivo:* \`${filename}\`\n` +
          `📝 *Instrucción:* _${caption}_\n\n` +
          `⚙️ *Antigravity tiene acceso inmediato a esta imagen para aplicar los ajustes.*`
        );
      }
    } catch (err) {
      console.error(`[Telegram] Error al descargar foto:`, err);
      await sendMessage(chatId, `❌ Error guardando captura: ${err.message}`);
    }
    return;
  }

  // 2. Manejo de Notas de Voz / Audios
  if (msg.voice || msg.audio) {
    const audioObj = msg.voice || msg.audio;
    try {
      const fileInfo = await telegramRequest('getFile', { file_id: audioObj.file_id });
      if (fileInfo.ok && fileInfo.result.file_path) {
        const ext = path.extname(fileInfo.result.file_path) || '.oga';
        const filename = `audio_${timestamp}${ext}`;
        const savePath = path.join(AUDIOS_DIR, filename);

        await downloadTelegramFile(fileInfo.result.file_path, savePath);
        fs.appendFileSync(LOG_FILE, `[${new Date().toLocaleTimeString()}] AUDIO: ${filename}\n`);

        await sendMessage(chatId, `🎙️ *Nota de voz guardada en tu PC:* \`${filename}\``);
      }
    } catch (err) {
      console.error(`[Telegram] Error guardando audio:`, err);
    }
    return;
  }

  // 3. Manejo de Comandos de Texto
  if (msg.text) {
    const text = msg.text.trim();

    if (text === '/start') {
      await sendMessage(chatId,
        `👋 *¡Hola ${fromName}! Servidor KlikPOS conectado en tu PC.*\n\n` +
        `Estás enlazado directamente a tu entorno de desarrollo.\n\n` +
        `📲 *¿Qué puedes hacer desde la calle?*\n` +
        `• 📸 *Mandar capturas de pantalla:* Tómalas y envíalas aquí con un texto explicativo (ej. _"Aumenta el contraste de los botones"_).\n` +
        `• 🎙️ *Mandar notas de voz:* Se guardan al instante en tu PC.\n` +
        `• \`/status\` - Ver estado del proyecto y servidor local.\n` +
        `• \`/check\` - Verificar si el código compila sin errores.\n` +
        `• \`/help\` - Ver ayuda de comandos.\n\n` +
        `🚀 _Todo lo que envíes queda guardado en la carpeta del proyecto en tu computadora._`
      );
      return;
    }

    if (text === '/status') {
      await sendMessage(chatId, `🔍 *Consultando estado del proyecto...*`);
      exec('git status --short', { cwd: WORKSPACE_ROOT }, (err, stdout) => {
        const changes = stdout ? stdout.trim().split('\n').length : 0;
        sendMessage(chatId,
          `📊 *Estado de KlikPOS en tu PC:*\n` +
          `• 📁 Directorio: \`venematic-master\`\n` +
          `• 📝 Archivos modificados: *${changes}*\n` +
          `• 🌐 Servidor Dev: *Activo en puerto 3000*\n` +
          (changes > 0 ? `\n\`\`\`\n${stdout.substring(0, 400)}\n\`\`\`` : `\n_El proyecto está limpio y sincronizado._`)
        );
      });
      return;
    }

    if (text === '/check') {
      await sendMessage(chatId, `⏳ *Ejecutando chequeo TypeScript en tu PC...*`);
      exec('npx tsc --noEmit', { cwd: WORKSPACE_ROOT }, (err, stdout, stderr) => {
        if (!err) {
          sendMessage(chatId, `✅ *TypeScript impecable:* 0 errores encontrados. Código listo.`);
        } else {
          sendMessage(chatId, `⚠️ *Errores encontrados:*\n\`\`\`\n${(stdout || stderr).substring(0, 500)}\n\`\`\``);
        }
      });
      return;
    }

    const lower = text.toLowerCase();
    if (lower.includes('compila') || lower.includes('release') || lower.includes('publica') || lower.includes('actualiza')) {
      await sendMessage(chatId, `🚀 *Orden de Compilación Recibida:* Iniciando Protocolo Quirúrgico de Publicación OTA...`);
      exec('node scripts/publish-release.js', { cwd: WORKSPACE_ROOT, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
        if (!err && (stdout || '').includes('CERTIFICACIÓN EXITOSA')) {
          sendMessage(chatId, `🎉 *¡Compilación y Release finalizadas con éxito!*\n\nLa versión está 100% activa en GitHub y lista para OTA en tus dispositivos.`);
        } else {
          sendMessage(chatId, `⚠️ *Detalle de ejecución:*\n\`\`\`\n${(stdout || stderr || '').slice(-400)}\n\`\`\``);
        }
      });
      return;
    }

    if (text === '/help') {
      await sendMessage(chatId,
        `📋 *CENTRO DE MANDO KLIKPOS - COMANDOS DISPONIBLES:*\n\n` +
        `🔑 \`/licencia <HWID> [Nombre] [1|2|3]\`\n` +
        `Genera licencia oficial y enlace WhatsApp 1-tap.\n` +
        `• 1: Contado Street ($15 permanente)\n` +
        `• 2: Financiado Street ($10 cuota inicial)\n` +
        `• 3: Vitalicio Pro ($50 completo)\n` +
        `_Ejemplo: \`/licencia ANDR-48F1-2B88 Juan 1\`_\n\n` +
        `⛔ \`/suspender <HWID> [Motivo]\` - Desactiva/bloquea remotamente una terminal activa.\n` +
        `✅ \`/reactivar <HWID>\` - Desbloquea y reactiva una terminal suspendida.\n\n` +
        `📊 \`/status\` - Ver estado del proyecto y git en tu PC.\n` +
        `🧪 \`/check\` - Ejecutar verificación TypeScript.\n` +
        `🚀 \`/release\` - Compilar y publicar release en GitHub y OTA.\n` +
        `📸 *Mandar fotos:* Se descargan a tu PC para revisión de la IA.\n` +
        `🎙️ *Mandar audio:* Se guarda la nota de voz en tu PC.`
      );
      return;
    }

    if (text.startsWith('/suspender') || text.startsWith('/desactivar') || text.startsWith('/bloquear')) {
      const parts = text.split(/\s+/);
      const hwid = parts[1];
      const motivo = parts.slice(2).join(' ') || 'Falta de pago de cuota o mora';

      if (!hwid) {
        await sendMessage(chatId, `⚠️ *Uso:* \`/suspender <HWID> [Motivo]\`\n\nEjemplo:\n\`/suspender ANDR-48F1-2B88 Pago cuota 2 vencido\``);
        return;
      }

      await sendMessage(chatId, `⏳ *Suspendiendo terminal ${hwid} en la nube...*`);
      try {
        const cleanHwid = hwid.trim().toUpperCase();
        const url = `https://firestore.googleapis.com/v1/projects/klikpos-cloud/databases/(default)/documents/pos_installations/${cleanHwid}?updateMask.fieldPaths=status&updateMask.fieldPaths=suspensionReason&key=AIzaSyDT26ff7t-W5WZKZktPWLZ_D79QHGh6sEg`;
        const postData = JSON.stringify({
          fields: {
            status: { stringValue: 'suspended' },
            suspensionReason: { stringValue: motivo }
          }
        });

        const req = https.request(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          }
        }, (res) => {
          if (res.statusCode === 200) {
            sendMessage(chatId,
              `⛔ *¡TERMINAL SUSPENDIDA EXITOSAMENTE!*\n\n` +
              `🆔 *HWID:* \`${cleanHwid}\`\n` +
              `📋 *Motivo:* ${motivo}\n\n` +
              `🔒 *Efecto:* Apenas el dispositivo tenga conexión a internet, la aplicación revocará su licencia local y bloqueará el acceso al POS.\n\n` +
              `_Para reactivarla cuando paguen: \`/reactivar ${cleanHwid}\`_`
            );
          } else {
            sendMessage(chatId, `⚠️ Error en Firestore (código ${res.statusCode}). Verifique el HWID.`);
          }
        });
        req.on('error', (e) => sendMessage(chatId, `❌ Error de red: ${e.message}`));
        req.write(postData);
        req.end();
      } catch (err) {
        await sendMessage(chatId, `❌ Error: ${err.message}`);
      }
      return;
    }

    if (text.startsWith('/reactivar') || text.startsWith('/desbloquear')) {
      const parts = text.split(/\s+/);
      const hwid = parts[1];

      if (!hwid) {
        await sendMessage(chatId, `⚠️ *Uso:* \`/reactivar <HWID>\``);
        return;
      }

      await sendMessage(chatId, `⏳ *Reactivando terminal ${hwid} en la nube...*`);
      try {
        const cleanHwid = hwid.trim().toUpperCase();
        const url = `https://firestore.googleapis.com/v1/projects/klikpos-cloud/databases/(default)/documents/pos_installations/${cleanHwid}?updateMask.fieldPaths=status&updateMask.fieldPaths=suspensionReason&key=AIzaSyDT26ff7t-W5WZKZktPWLZ_D79QHGh6sEg`;
        const postData = JSON.stringify({
          fields: {
            status: { stringValue: 'active' },
            suspensionReason: { stringValue: '' }
          }
        });

        const req = https.request(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          }
        }, (res) => {
          if (res.statusCode === 200) {
            sendMessage(chatId,
              `✅ *¡TERMINAL REACTIVADA CON ÉXITO!*\n\n` +
              `🆔 *HWID:* \`${cleanHwid}\`\n` +
              `🟢 *Estado:* ACTIVO\n\n` +
              `El bloqueo remoto ha sido retirado. El cliente ya puede seguir facturando normalmente.`
            );
          } else {
            sendMessage(chatId, `⚠️ Error reactivando en Firestore (código ${res.statusCode}).`);
          }
        });
        req.on('error', (e) => sendMessage(chatId, `❌ Error de red: ${e.message}`));
        req.write(postData);
        req.end();
      } catch (err) {
        await sendMessage(chatId, `❌ Error: ${err.message}`);
      }
      return;
    }

    if (text.startsWith('/licencia') || text.startsWith('/activar')) {
      const parts = text.split(/\s+/);
      const hwid = parts[1];
      const clientName = parts[2] || 'Cliente';
      const plan = parts[3] || 'promo_6m';

      if (!hwid) {
        await sendMessage(chatId,
          `⚠️ *Formato incorrecto.*\n\n` +
          `Uso: \`/licencia <HWID> [Nombre] [Plan]\`\n\n` +
          `*Planes disponibles:*\n` +
          `• \`promo_6m\` (Promo 6 Meses con Nube $35)\n` +
          `• \`basico_local\` (Básico Permanente $40)\n` +
          `• \`pro_full\` (Pro Full Permanente $75)\n` +
          `• \`pro_trial\` (Crédito Pro 1ra cuota $37.50)\n` +
          `• \`starter_full\` (Starter Permanente $50)\n` +
          `• \`demo\` (Evaluación 15 días)\n\n` +
          `*Ejemplo:*\n\`/licencia ANDR-48F1-2B88 BodegaElSol promo_6m\``
        );
        return;
      }

      try {
        const result = generateLicenseKey(hwid, 'V-CLIENTE', plan);
        const waMsg = encodeURIComponent(
          `¡Hola ${clientName}! 🚀 Tu licencia oficial de KlikPOS ha sido activada con éxito.\n\n` +
          `🔑 *Clave de Activación:* ${result.key}\n` +
          `💻 *ID Terminal:* ${hwid}\n` +
          `📦 *Plan:* ${result.label}\n` +
          `⏳ *Vence:* ${result.expires}\n\n` +
          `Para activarlo: Abre KlikPOS > Menú > Activar Licencia > Pega la clave y presiona Activar. ¡Gracias por tu compra!`
        );
        const waUrl = `https://wa.me/?text=${waMsg}`;

        await sendMessage(chatId,
          `🎉 *¡LICENCIA CRIPTOGRÁFICA GENERADA!*\n\n` +
          `👤 *Cliente:* ${clientName}\n` +
          `💻 *Terminal (HWID):* \`${hwid}\`\n` +
          `📦 *Plan:* ${result.label}\n` +
          `⏳ *Vence:* ${result.expires}\n\n` +
          `🔑 *Clave Oficial:*\n\`${result.key}\`\n\n` +
          `📲 [👉 TOCAR AQUÍ PARA ENVIAR POR WHATSAPP](${waUrl})`
        );
      } catch (err) {
        await sendMessage(chatId, `❌ Error generando clave: ${err.message}`);
      }
      return;
    }

    // Texto libre (Instrucción de desarrollo)
    fs.appendFileSync(LOG_FILE, `[${new Date().toLocaleTimeString()}] INSTRUCCION: ${text}\n`);
    await sendMessage(chatId, 
      `📝 *Instrucción registrada en tu PC:*\n"${text}"\n\n` +
      `📌 _Quedó guardada en el registro de trabajo de Antigravity._`
    );
  }
}

// Watchdog de reconexión continua: si la conexión se congela más de 50s, reactiva el bucle
setInterval(() => {
  if (Date.now() - lastPollTime > 50000) {
    console.warn(`[Watchdog Telegram] Reconectando bucle de polling (inactivo > 50s)...`);
    isPolling = false;
    pollUpdates();
  }
}, 15000);

// Long-polling loop anti-bloqueo
async function pollUpdates() {
  if (isPolling) return;
  isPolling = true;
  lastPollTime = Date.now();

  try {
    const res = await telegramRequest('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 25,
      allowed_updates: ['message'],
    });

    lastPollTime = Date.now();

    if (res && res.ok && Array.isArray(res.result)) {
      for (const update of res.result) {
        lastUpdateId = update.update_id;
        if (update.message) {
          await handleMessage(update.message);
        }
      }
    }
  } catch (err) {
    console.error(`[Telegram Polling Error]:`, err.message);
    await new Promise(r => setTimeout(r, 2500));
  } finally {
    isPolling = false;
    lastPollTime = Date.now();
    setTimeout(pollUpdates, 300);
  }
}

// Protección contra caídas silenciosas
process.on('uncaughtException', (err) => {
  console.error('[Telegram Bridge] Excepción no controlada capturada (proceso preservado):', err.message);
  isPolling = false;
  setTimeout(pollUpdates, 2000);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Telegram Bridge] Rechazo no controlado capturado (proceso preservado):', reason);
});

console.log(`====================================================`);
console.log(`🤖 KlikPOS Telegram Remote Bridge ACTIVO`);
console.log(`📁 Carpeta de capturas: ${CAPTURAS_DIR}`);
console.log(`🛡️ Watchdog de reconexión automática activado`);
console.log(`====================================================`);

pollUpdates();
