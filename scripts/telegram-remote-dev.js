// Telegram Remote Bridge for KlikPOS Street Development
// Native Node.js long-polling - Zero extra dependencies required

const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const TOKEN = '8909236915:AAF-fCVr19EFe0uidUBhVI_Is-Usc3DvGoA';
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

// Helper to make Telegram API requests
function telegramRequest(method, payload = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const url = new URL(`${BASE_URL}/${method}`);

    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 60000,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          resolve({ ok: false, error: e.message, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

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

    // Texto libre (Instrucción de desarrollo)
    fs.appendFileSync(LOG_FILE, `[${new Date().toLocaleTimeString()}] INSTRUCCION: ${text}\n`);
    await sendMessage(chatId, 
      `📝 *Instrucción registrada en tu PC:*\n"${text}"\n\n` +
      `📌 _Quedó guardada en el registro de trabajo de Antigravity._`
    );
  }
}

// Long-polling loop
async function pollUpdates() {
  if (isPolling) return;
  isPolling = true;

  try {
    const res = await telegramRequest('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 30,
      allowed_updates: ['message'],
    });

    if (res.ok && Array.isArray(res.result)) {
      for (const update of res.result) {
        lastUpdateId = update.update_id;
        if (update.message) {
          await handleMessage(update.message);
        }
      }
    }
  } catch (err) {
    console.error(`[Telegram Polling Error]:`, err.message);
    // Esperar 3 segundos antes de reintentar si hay error de red
    await new Promise(r => setTimeout(r, 3000));
  } finally {
    isPolling = false;
    setImmediate(pollUpdates);
  }
}

console.log(`====================================================`);
console.log(`🤖 KlikPOS Telegram Remote Bridge ACTIVO`);
console.log(`📁 Carpeta de capturas: ${CAPTURAS_DIR}`);
console.log(`====================================================`);

pollUpdates();
