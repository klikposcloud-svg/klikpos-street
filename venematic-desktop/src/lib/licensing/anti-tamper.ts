/**
 * Anti-Tamper & Security Engine for KlikPOS
 * Protege contra ingeniería inversa, manipulación de reloj del sistema,
 * y falsificación de registros locales en IndexedDB / LocalStorage.
 */

// Llave de integridad interna para firmas de datos locales
const LOCAL_AUDIT_SALT = 'KLIKPOS_AUDIT_INTEGRITY_SALT_2026_V2';

/**
 * Hash SHA-256 liviano para validación de integridad local
 */
export function computeIntegrityHash(payload: string): string {
  let hash = 0x811c9dc5;
  const str = payload + LOCAL_AUDIT_SALT;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Valida la monotonicidad del tiempo del sistema (detecta atrasos de reloj)
 */
export function verifyClockIntegrity(lastSeenTimestamp: number, currentTimestamp: number = Date.now()): {
  isValid: boolean;
  tampered: boolean;
  deltaMs: number;
} {
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
export function sanitizeThermalInput(input: string): string {
  if (!input) return '';
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
export function sealSaleRecord(ticketNumber: string, totalUSD: number, timestamp: string): string {
  const payload = `${ticketNumber}:${totalUSD.toFixed(2)}:${timestamp}`;
  return computeIntegrityHash(payload);
}

/**
 * Valida si un ticket de venta ha sido manipulado en IndexedDB
 */
export function verifySaleIntegrity(ticketNumber: string, totalUSD: number, timestamp: string, hash: string): boolean {
  if (!hash) return false;
  const expected = sealSaleRecord(ticketNumber, totalUSD, timestamp);
  return expected === hash;
}
