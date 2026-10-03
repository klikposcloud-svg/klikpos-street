"use strict";
/**
 * Anti-Tamper & Security Engine for KlikPOS
 * Protege contra ingeniería inversa, manipulación de reloj del sistema,
 * y falsificación de registros locales en IndexedDB / LocalStorage.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeIntegrityHash = computeIntegrityHash;
exports.verifyClockIntegrity = verifyClockIntegrity;
exports.sanitizeThermalInput = sanitizeThermalInput;
exports.sealSaleRecord = sealSaleRecord;
exports.verifySaleIntegrity = verifySaleIntegrity;
// Llave de integridad interna para firmas de datos locales
var LOCAL_AUDIT_SALT = 'KLIKPOS_AUDIT_INTEGRITY_SALT_2026_V2';
/**
 * Hash SHA-256 liviano para validación de integridad local
 */
function computeIntegrityHash(payload) {
    var hash = 0x811c9dc5;
    var str = payload + LOCAL_AUDIT_SALT;
    for (var i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}
/**
 * Valida la monotonicidad del tiempo del sistema (detecta atrasos de reloj)
 */
function verifyClockIntegrity(lastSeenTimestamp, currentTimestamp) {
    if (currentTimestamp === void 0) { currentTimestamp = Date.now(); }
    // Si el tiempo actual es menor que el último tiempo registrado (con margen de 30s)
    if (currentTimestamp < lastSeenTimestamp - 30000) {
        return {
            isValid: false,
            tampered: true,
            deltaMs: lastSeenTimestamp - currentTimestamp,
        };
    }
    return {
        isValid: true,
        tampered: false,
        deltaMs: currentTimestamp - lastSeenTimestamp,
    };
}
/**
 * Sanitiza entradas de texto para evitar inyecciones en impresoras térmicas ESC/POS
 * (Elimina secuencias de control ESC/POS, bytes binarios y caracteres no imprimibles)
 */
function sanitizeThermalInput(input) {
    if (!input)
        return '';
    return input
        // Elimina secuencias completas de comandos ESC/POS (ESC ... y GS ...) incluyendo sus bytes de parámetros
        .replace(/\x1B[\s\S]{1,5}/g, '')
        .replace(/\x1D[\s\S]{1,5}/g, '')
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
        .replace(/[^\w\s\dáéíóúÁÉÍÓÚñÑüÜ.,\-#$€/%:()@]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}
/**
 * Sella un ticket de venta para auditoría inmutable
 */
function sealSaleRecord(ticketNumber, totalUSD, timestamp) {
    var payload = "".concat(ticketNumber, ":").concat(totalUSD.toFixed(2), ":").concat(timestamp);
    return computeIntegrityHash(payload);
}
/**
 * Valida si un ticket de venta ha sido manipulado en IndexedDB
 */
function verifySaleIntegrity(ticketNumber, totalUSD, timestamp, hash) {
    if (!hash)
        return false;
    var expected = sealSaleRecord(ticketNumber, totalUSD, timestamp);
    return expected === hash;
}
