/**
 * KlikPOS Defensive Security & Anti-Tamper Verification Suite
 * Ejecuta pruebas automatizadas de resistencia a ingeniería inversa y ataques locales.
 */

const { 
  computeIntegrityHash, 
  verifyClockIntegrity, 
  sanitizeThermalInput, 
  sealSaleRecord, 
  verifySaleIntegrity 
} = require('../src/lib/licensing/anti-tamper.ts');

console.log('===========================================================');
console.log('🛡️ INICIANDO SUITE DE PRUEBAS DE SEGURIDAD DEFENSIVA KLIKPOS');
console.log('===========================================================\n');

let testsPassed = 0;
let totalTests = 0;

function assertTest(name, condition, details) {
  totalTests++;
  if (condition) {
    testsPassed++;
    console.log(`✅ [PASS] ${name}`);
    if (details) console.log(`   Detalle: ${details}`);
  } else {
    console.error(`❌ [FAIL] ${name}`);
    if (details) console.error(`   Falla: ${details}`);
  }
}

// ---------------------------------------------------------
// PRUEBA 1: ATAQUE DE INYECCIÓN DE COMANDOS ESC/POS A IMPRESORA
// ---------------------------------------------------------
console.log('\n--- 1. Prueba de Sanitización de Inyección Térmica ESC/POS ---');
const maliciousClientName = 'Restaurante\x1B\x70\x00\x19\xFA Gamberro\x1D\x56\x00'; // Secuencias ESC p (abrir gaveta) y GS V (cortar papel)
const sanitized = sanitizeThermalInput(maliciousClientName);
const containsEsc = sanitized.includes('\x1B') || sanitized.includes('\x1D') || sanitized.includes('\x00');
const isSafe = !containsEsc && sanitized.length > 0;

assertTest(
  'Filtro de Inyección ESC/POS',
  isSafe,
  `Comandos ESC/POS neutralizados exitosamente: "${sanitized}"`
);

// ---------------------------------------------------------
// PRUEBA 2: ATAQUE DE MANIPULACIÓN DEL RELOJ DEL SISTEMA (TIME ROLLBACK)
// ---------------------------------------------------------
console.log('\n--- 2. Prueba de Detección de Retroceso de Reloj (Trial Bypass) ---');
const lastRecordedTime = Date.now();
const rollbackedClockTime = lastRecordedTime - (1000 * 60 * 60 * 24); // Retrocedido 24 horas

const clockCheck = verifyClockIntegrity(lastRecordedTime, rollbackedClockTime);
assertTest(
  'Detección de Manipulación de Reloj',
  clockCheck.tampered === true && clockCheck.isValid === false,
  `Anomalía detectada con delta de ${clockCheck.deltaMs / 1000}s retrocedidos`
);

// ---------------------------------------------------------
// PRUEBA 3: ATAQUE DE ALTERACIÓN DE TICKETS EN INDEXEDDB / LOCALSTORAGE
// ---------------------------------------------------------
console.log('\n--- 3. Prueba de Integridad Criptográfica de Tickets (Hash Chaining) ---');
const ticketNo = 'TK-982314';
const originalTotal = 45.50;
const saleTimestamp = '2026-10-01 20:30';
const originalSeal = sealSaleRecord(ticketNo, originalTotal, saleTimestamp);

// Intento de ataque: El cajero altera el monto de $45.50 a $15.50 en IndexedDB
const tamperedTotal = 15.50;
const isTamperedDetected = !verifySaleIntegrity(ticketNo, tamperedTotal, saleTimestamp, originalSeal);

assertTest(
  'Detección de Modificación Fraudulenta de Venta',
  isTamperedDetected,
  `Firma original rechaza el monto adulterado de $${tamperedTotal}`
);

// Verificación con ticket legítimo
const isLegitValid = verifySaleIntegrity(ticketNo, originalTotal, saleTimestamp, originalSeal);
assertTest(
  'Validación de Ticket Legítimo No Alterado',
  isLegitValid,
  `Ticket con hash ${originalSeal} verificado exitosamente`
);

// ---------------------------------------------------------
// RESUMEN FINAL
// ---------------------------------------------------------
console.log('\n===========================================================');
console.log(`📊 RESULTADO FINAL: ${testsPassed} de ${totalTests} pruebas superadas (${((testsPassed / totalTests) * 100).toFixed(0)}%)`);
console.log('===========================================================');
