// FILE: scripts/key-manager.mjs
import nacl from 'tweetnacl';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRIVATE_KEY_PATH = path.join(__dirname, '..', 'master_private_key.txt');
const PUBLIC_KEY_PATH = path.join(__dirname, '..', 'master_public_key.txt');

const COMMAND = process.argv[2];

if (COMMAND === 'generate') {
    console.log('⏳ Generando par de claves Ed25519 de grado militar...');
    const keyPair = nacl.sign.keyPair();
    
    // Clave pública: 32 bytes (64 caracteres hex)
    const publicKeyHex = Buffer.from(keyPair.publicKey).toString('hex');
    
    // Semilla privada: 32 bytes (los primeros 32 bytes del secretKey de 64 bytes de tweetnacl).
    // Esto es EXACTAMENTE lo que ed25519-dalek en Rust espera para from_bytes().
    const seedHex = Buffer.from(keyPair.secretKey.slice(0, 32)).toString('hex');
    
    // Clave secreta completa para firmar (64 bytes, necesaria para tweetnacl)
    const fullSecretHex = Buffer.from(keyPair.secretKey).toString('hex');

    // Guardar en archivos locales de forma segura
    fs.writeFileSync(PRIVATE_KEY_PATH, fullSecretHex, 'utf8');
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKeyHex, 'utf8');

    console.log('=========================================================');
    console.log('✅ CLAVES GENERADAS Y GUARDADAS LOCALMENTE');
    console.log('---------------------------------------------------------');
    console.log('🔑 CLAVE PÚBLICA (Copia esto en tu main.rs de Tauri):');
    console.log(publicKeyHex);
    console.log('---------------------------------------------------------');
    console.log(`🔒 CLAVE PRIVADA: Guardada automáticamente en 'master_private_key.txt'`);
    console.log('⚠️  CRÍTICO: NUNCA subas "master_private_key.txt" a Git.');
    console.log('=========================================================');

} else if (COMMAND === 'sign') {
    const hwid = process.argv[3];
    const type = process.argv[4] || 'VIT'; // VIT (Perpetua), ANL (Anual), DMO (Demo)

    if (!hwid) {
        console.error('❌ ERROR: Debes proporcionar el HWID.');
        console.error('Uso: node scripts/key-manager.mjs sign <HW_ID> [VIT|ANL|DMO]');
        process.exit(1);
    }

    if (!fs.existsSync(PRIVATE_KEY_PATH)) {
        console.error(`❌ ERROR: No se encuentra ${PRIVATE_KEY_PATH}. Ejecuta primero: node scripts/key-manager.mjs generate`);
        process.exit(1);
    }

    // Cargar la clave privada completa (64 bytes) para firmar
    const fullSecretHex = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8').trim();
    const secretKey = new Uint8Array(Buffer.from(fullSecretHex, 'hex'));

    // Construir payload inmutable
    let expiration = null;
    if (type === 'ANL') expiration = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    if (type === 'DMO') expiration = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

    const payload = {
        hwid: hwid,
        type: type,
        issued_at: new Date().toISOString(),
        expires_at: expiration
    };

    const payloadString = JSON.stringify(payload);
    const payloadUint8 = new TextEncoder().encode(payloadString);
    
    // Firmar criptográficamente
    const signature = nacl.sign.detached(payloadUint8, secretKey);
    const signatureHex = Buffer.from(signature).toString('hex');
    const payloadBase64 = Buffer.from(payloadString).toString('base64');

    const licenseToken = `${payloadBase64}.${signatureHex}`;

    console.log('=========================================================');
    console.log(`✅ LICENCIA GENERADA PARA: ${hwid} (${type})`);
    console.log('---------------------------------------------------------');
    console.log('Copia este token y pégalo en la ventana de activación:');
    console.log(licenseToken);
    console.log('=========================================================');

} else {
    console.log('🛠️  GESTOR DE CLAVES VENEMATIC POS');
    console.log('Uso:');
    console.log('  1. Generar claves maestras: node scripts/key-manager.mjs generate');
    console.log('  2. Firmar licencia cliente: node scripts/key-manager.mjs sign <HW_ID> [VIT|ANL|DMO]');
}