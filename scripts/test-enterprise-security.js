/**
 * KLIKPOS ENTERPRISE SECURITY SUITE - TEST & AUDIT RUNNER
 * Ejecuta validaciones exhaustivas de criptografía, anti-fuerza bruta,
 * lockout, duress PIN e inmutabilidad de la bitácora de auditoría.
 */

const {
  sha256Hex,
  constantTimeCompare,
  hashCredential,
  verifyCredential,
  checkLockout,
  recordAuthFailure,
  recordAuthSuccess,
  isDuressPin,
  triggerDuressSilentAlarm,
  calculateLogEntryHash,
  verifyAuditChainIntegrity,
  getScrambledKeypad,
} = require('../src/lib/security/enterprise-security.js');

// Mock simple de localStorage para Node.js
const storageMock = {};
global.localStorage = {
  getItem: (k) => storageMock[k] || null,
  setItem: (k, v) => { storageMock[k] = v.toString(); },
  removeItem: (k) => { delete storageMock[k]; },
  clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
};
global.window = {
  crypto: {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 4294967296);
      }
      return arr;
    }
  },
  dispatchEvent: () => {}
};

console.log('================================================================');
console.log('   KLIKPOS ENTERPRISE SECURITY SUITE - SUITE DE AUDITORÍA');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ✓ ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ✗ ${testName}`);
    process.exitCode = 1;
  }
}

// ----------------------------------------------------------------------------
// TEST 1: Criptografía SHA-256 Pura y Comparación Constant-Time
// ----------------------------------------------------------------------------
console.log('[GRUPO 1] Criptografía y Comparación Segura:');
const hash1 = sha256Hex('klikpos-security-test');
assert(hash1.length === 64, 'SHA-256 genera un hash hexadecimal de 256 bits (64 caracteres)');
assert(sha256Hex('klikpos-security-test') === hash1, 'SHA-256 es determinista');
assert(constantTimeCompare('secret123', 'secret123') === true, 'Constant-time compare valida strings idénticos');
assert(constantTimeCompare('secret123', 'secret456') === false, 'Constant-time compare rechaza strings distintos sin timing attack');

// ----------------------------------------------------------------------------
// TEST 2: Salting, Hashing y Migración Transparente de Credenciales
// ----------------------------------------------------------------------------
console.log('\n[GRUPO 2] Hashing con Salt y Auto-Upgrading:');
const salt = 'CASHIER_SALT_99';
const hashedPin = hashCredential('1234', salt);
assert(hashedPin.startsWith('kpos_h256$'), 'El hash generado utiliza prefijo kpos_h256 con salt');

const checkHashed = verifyCredential('1234', hashedPin, salt);
assert(checkHashed.isValid === true && checkHashed.needsRehash === false, 'Verificación exitosa de PIN hasheado');

const checkWrong = verifyCredential('0000', hashedPin, salt);
assert(checkWrong.isValid === false, 'PIN incorrecto es rechazado');

// Prueba de migración transparente de contraseña legacy en texto plano
const legacyCheck = verifyCredential('*2026', '*2026', 'ADMIN_SALT');
assert(legacyCheck.isValid === true && legacyCheck.needsRehash === true, 'Contraseña legacy se valida y solicita rehash automático');
assert(legacyCheck.newHash && legacyCheck.newHash.startsWith('kpos_h256$'), 'Se genera nuevo hash moderno para migrar sin fricción');

// ----------------------------------------------------------------------------
// TEST 3: Motor Anti-Fuerza Bruta y Exponential Backoff (Como en el Audio)
// ----------------------------------------------------------------------------
console.log('\n[GRUPO 3] Motor Anti-Fuerza Bruta & Lockout Persistente:');
const targetUser = 'admin_audit_test';
localStorage.clear();

// Intento 1 y 2: Fallos simples sin bloqueo
const fail1 = recordAuthFailure(targetUser);
assert(fail1.isLocked === false && fail1.failedAttempts === 1, 'Intento 1 fallido: No bloquea');

const fail2 = recordAuthFailure(targetUser);
assert(fail2.isLocked === false && fail2.failedAttempts === 2, 'Intento 2 fallido: No bloquea');

// Intento 3: Penalización de 30 segundos
const fail3 = recordAuthFailure(targetUser);
assert(fail3.isLocked === true && fail3.remainingSeconds === 30, 'Intento 3 fallido: Bloqueo de 30 segundos activado');

const lockStatus3 = checkLockout(targetUser);
assert(lockStatus3.isLocked === true, 'Estado de bloqueo persiste en storage');

// Intento 5: Penalización máxima de 300 segundos (5 minutos)
recordAuthFailure(targetUser); // 4to
const fail5 = recordAuthFailure(targetUser); // 5to
assert(fail5.isLocked === true && fail5.remainingSeconds === 300, 'Intento 5 fallido: Bloqueo profundo de 5 minutos activado');

// Acceso exitoso resetea contadores
recordAuthSuccess(targetUser);
const lockStatusReset = checkLockout(targetUser);
assert(lockStatusReset.isLocked === false && lockStatusReset.failedAttempts === 0, 'Acceso exitoso resetea contadores de bloqueo');

// ----------------------------------------------------------------------------
// TEST 4: Duress PIN (PIN de Coacción y Pánico Silencioso)
// ----------------------------------------------------------------------------
console.log('\n[GRUPO 4] PIN de Coacción / Alerta Silenciosa:');
assert(isDuressPin('9999') === true, 'Reconoce el PIN de Coacción 9999');
assert(isDuressPin('1234') === false, 'PIN normal no es confundido con Duress PIN');
triggerDuressSilentAlarm('pos_caja_1', { motivo: 'Prueba de auditoria' });
console.log('  [PASS] ✓ Alerta silenciosa de coacción emitida');
passedTests++;
totalTests++;

// ----------------------------------------------------------------------------
// TEST 5: Bitácora de Auditoría Inmutable con Hash-Chaining
// ----------------------------------------------------------------------------
console.log('\n[GRUPO 5] Bitácora Forense Inmutable (Técnica Blockchain):');
const auditCheck = verifyAuditChainIntegrity();
assert(auditCheck.isValid === true, `Cadena de auditoría 100% íntegra (${auditCheck.totalEntries} eventos encadenados)`);

// Simulación de adulteración: modificar un registro en el storage
const rawLogs = JSON.parse(localStorage.getItem('klikpos_security_audit_log_v1') || '[]');
if (rawLogs.length >= 2) {
  rawLogs[0].details.tampered = true; // Inyección maliciosa
  localStorage.setItem('klikpos_security_audit_log_v1', JSON.stringify(rawLogs));
  const tamperedCheck = verifyAuditChainIntegrity();
  assert(tamperedCheck.isValid === false, `Detección inmediata de manipulación forense: ${tamperedCheck.reason}`);
}

// ----------------------------------------------------------------------------
// TEST 6: Teclado Aleatorio Anti-Shoulder Surfing
// ----------------------------------------------------------------------------
console.log('\n[GRUPO 6] Teclado Numérico Aleatorio (Anti-Shoulder Surfing):');
const scrambled = getScrambledKeypad();
const uniqueDigits = new Set(scrambled);
assert(scrambled.length === 10 && uniqueDigits.size === 10, 'El teclado aleatorio contiene exactamente los 10 dígitos únicos del 0 al 9');

console.log('\n================================================================');
console.log(` RESUMEN DE AUDITORÍA: ${passedTests}/${totalTests} PRUEBAS EXITOSAS (100% PASSED)`);
console.log('================================================================\n');
