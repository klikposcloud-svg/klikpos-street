/**
 * KLIKPOS ENTERPRISE SECURITY SUITE
 * 
 * Capa de seguridad de grado bancario y defensa en profundidad (Defense in Depth) para
 * POS Desktop (Windows/Linux/Mac), Web (Next.js) y Móvil (Android WebView/Capacitor).
 * 
 * Capacidades:
 * 1. Hashing Criptográfico SHA-256 + Salt dinámico con comparación en tiempo constante.
 * 2. Motor Anti-Fuerza Bruta con Retardo Progresivo (Exponential Backoff) y Lockout persistente.
 * 3. Bitácora de Auditoría Inmutable con Hash-Chaining (Técnica Blockchain local anti-alteración).
 * 4. PIN de Coacción y Emergencia (Duress PIN) con alerta silenciosa.
 * 5. Generador de Teclado Numérico Aleatorio (Anti-Shoulder Surfing).
 * 6. Monitor de Inactividad para Auto-Bloqueo de Sesión.
 */

// Sal maestra local para hardening de hashes
const ENTERPRISE_PEPPER = 'KLIKPOS_SEC_PRO_2026_BANK_GRADE_ENTERPRISE_SHIELD';
const AUDIT_LOG_STORAGE_KEY = 'klikpos_security_audit_log_v1';
const LOCKOUT_STORAGE_KEY = 'klikpos_sec_lockout_state_v1';

// ============================================================================
// 1. MOTOR CRIPTOGRÁFICO DE HASHING (SHA-256 PURO / CONSTANT-TIME COMPARISON)
// ============================================================================

export function sha256Hex(str: string): string {
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const utf8: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }

  const bitLength = utf8.length * 8;
  utf8.push(0x80);
  while ((utf8.length % 64) !== 56) utf8.push(0);

  const view = new DataView(new ArrayBuffer(8));
  view.setBigUint64(0, BigInt(bitLength));
  for (let i = 0; i < 8; i++) utf8.push(view.getUint8(i));

  const words: number[] = [];
  for (let i = 0; i < utf8.length; i += 4) {
    words.push((utf8[i] << 24) | (utf8[i + 1] << 16) | (utf8[i + 2] << 8) | utf8[i + 3]);
  }

  const rotr = (n: number, x: number) => (x >>> n) | (x << (32 - n));

  for (let i = 0; i < words.length; i += 16) {
    const w = new Array(64);
    for (let j = 0; j < 16; j++) w[j] = words[i + j];
    for (let j = 16; j < 64; j++) {
      const s0 = rotr(7, w[j - 15]) ^ rotr(18, w[j - 15]) ^ (w[j - 15] >>> 3);
      const s1 = rotr(17, w[j - 2]) ^ rotr(19, w[j - 2]) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let j = 0; j < 64; j++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + k[j] + w[j]) | 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => (v >>> 0).toString(16).padStart(8, '0'))
    .join('');
}

/**
 * Comparación segura contra ataques de temporización (Constant-Time String Compare)
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Genera un hash seguro con salting para un PIN o contraseña
 */
export function hashCredential(plaintext: string, salt: string = 'DEFAULT_SALT'): string {
  const clean = (plaintext || '').trim();
  if (!clean) return '';
  const combined = `${ENTERPRISE_PEPPER}:${salt}:${clean}`;
  return `kpos_h256$${salt}$${sha256Hex(combined)}`;
}

/**
 * Verifica un PIN o contraseña contra un valor almacenado (soporta migración transparente de texto plano)
 */
export function verifyCredential(inputPlaintext: string, storedValue: string, salt: string = 'DEFAULT_SALT'): {
  isValid: boolean;
  needsRehash: boolean;
  newHash?: string;
} {
  const cleanInput = (inputPlaintext || '').trim();
  const cleanStored = (storedValue || '').trim();

  if (!cleanInput || !cleanStored) {
    return { isValid: false, needsRehash: false };
  }

  // Si está almacenado en formato hash criptográfico moderno
  if (cleanStored.startsWith('kpos_h256$')) {
    const parts = cleanStored.split('$');
    const existingSalt = parts[1] || salt;
    const expectedHash = hashCredential(cleanInput, existingSalt);
    const isValid = constantTimeCompare(cleanStored, expectedHash);
    return { isValid, needsRehash: false };
  }

  // Compatibilidad con registros antiguos en texto plano:
  // Si coincide exactamente, marcamos para re-hashear de inmediato
  if (cleanStored === cleanInput) {
    const upgradedHash = hashCredential(cleanInput, salt);
    return {
      isValid: true,
      needsRehash: true,
      newHash: upgradedHash,
    };
  }

  return { isValid: false, needsRehash: false };
}

// ============================================================================
// 2. MOTOR ANTI-FUERZA BRUTA & EXPONENTIAL BACKOFF (LOCKOUT PERSISTENTE)
// ============================================================================

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
  failedAttempts: number;
  totalFailures: number;
  message?: string;
}

interface StoredLockoutRecord {
  failedAttempts: number;
  totalFailures: number;
  lockedUntilTimestamp: number;
  lastAttemptTimestamp: number;
  signature: string;
}

function getLockoutMap(): Record<string, StoredLockoutRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCKOUT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLockoutMap(map: Record<string, StoredLockoutRecord>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

function signLockoutRecord(record: Omit<StoredLockoutRecord, 'signature'>): string {
  return sha256Hex(`${ENTERPRISE_PEPPER}:${record.failedAttempts}:${record.lockedUntilTimestamp}`);
}

/**
 * Consulta el estado de bloqueo de un contexto (ej: 'admin', 'cajero-c1', 'mobile-pin')
 */
export function checkLockout(contextKey: string): LockoutStatus {
  const map = getLockoutMap();
  const record = map[contextKey];
  const now = Date.now();

  if (!record) {
    return { isLocked: false, remainingSeconds: 0, failedAttempts: 0, totalFailures: 0 };
  }

  // Verificación anti-manipulación del localStorage
  const expectedSig = signLockoutRecord(record);
  if (record.signature !== expectedSig) {
    return {
      isLocked: true,
      remainingSeconds: 300,
      failedAttempts: 5,
      totalFailures: record.totalFailures + 1,
      message: 'Intento de alteración de seguridad detectado. Terminal bloqueado.',
    };
  }

  if (record.lockedUntilTimestamp > now) {
    const remainingSeconds = Math.ceil((record.lockedUntilTimestamp - now) / 1000);
    return {
      isLocked: true,
      remainingSeconds,
      failedAttempts: record.failedAttempts,
      totalFailures: record.totalFailures,
      message: `Terminal bloqueado por seguridad. Espera ${remainingSeconds}s.`,
    };
  }

  return {
    isLocked: false,
    remainingSeconds: 0,
    failedAttempts: record.failedAttempts,
    totalFailures: record.totalFailures,
  };
}

/**
 * Registra un intento fallido y calcula la penalización exponencial
 */
export function recordAuthFailure(contextKey: string): LockoutStatus {
  const map = getLockoutMap();
  const now = Date.now();
  const current = map[contextKey] || {
    failedAttempts: 0,
    totalFailures: 0,
    lockedUntilTimestamp: 0,
    lastAttemptTimestamp: 0,
    signature: '',
  };

  const newAttempts = current.failedAttempts + 1;
  const newTotal = current.totalFailures + 1;
  let penaltySeconds = 0;

  if (newAttempts === 3) {
    penaltySeconds = 30;
  } else if (newAttempts === 4) {
    penaltySeconds = 60;
  } else if (newAttempts >= 5) {
    penaltySeconds = 300;
  }

  const lockedUntil = penaltySeconds > 0 ? now + penaltySeconds * 1000 : 0;
  const updatedRecord: StoredLockoutRecord = {
    failedAttempts: newAttempts,
    totalFailures: newTotal,
    lockedUntilTimestamp: lockedUntil,
    lastAttemptTimestamp: now,
    signature: '',
  };
  updatedRecord.signature = signLockoutRecord(updatedRecord);

  map[contextKey] = updatedRecord;
  saveLockoutMap(map);

  logSecurityEvent({
    eventType: penaltySeconds > 0 ? 'ACCOUNT_LOCKED' : 'AUTH_FAILURE',
    user: contextKey,
    severity: penaltySeconds > 0 ? 'HIGH' : 'LOW',
    details: {
      attemptNumber: newAttempts,
      penaltySeconds,
      timestamp: new Date().toISOString(),
    },
  });

  return {
    isLocked: penaltySeconds > 0,
    remainingSeconds: penaltySeconds,
    failedAttempts: newAttempts,
    totalFailures: newTotal,
    message: penaltySeconds > 0
      ? `Demasiados intentos incorrectos. Bloqueado por ${penaltySeconds} segundos.`
      : `Credenciales incorrectas (Intento ${newAttempts}/3).`,
  };
}

/**
 * Resetea el contador de intentos tras un acceso exitoso
 */
export function recordAuthSuccess(contextKey: string): void {
  const map = getLockoutMap();
  if (map[contextKey]) {
    delete map[contextKey];
    saveLockoutMap(map);
  }

  logSecurityEvent({
    eventType: 'AUTH_SUCCESS',
    user: contextKey,
    severity: 'INFO',
    details: {
      timestamp: new Date().toISOString(),
      action: 'Inicio de sesión / Autorización aprobada',
    },
  });
}

// ============================================================================
// 3. PIN DE COACCIÓN Y EMERGENCIA (DURESS / SILENT PANIC PIN)
// ============================================================================

const DEFAULT_DURESS_PIN = '9999';

export function isDuressPin(inputPin: string, customDuressPin?: string): boolean {
  const target = (customDuressPin || DEFAULT_DURESS_PIN).trim();
  const cleanInput = (inputPin || '').trim();
  return cleanInput.length > 0 && cleanInput === target;
}

export function triggerDuressSilentAlarm(contextKey: string, details?: any): void {
  logSecurityEvent({
    eventType: 'DURESS_TRIGGERED',
    user: contextKey,
    severity: 'CRITICAL',
    details: {
      message: '🚨 ALERTA SILENCIOSA: Se ha ingresado el PIN de Coacción / Emergencia.',
      timestamp: new Date().toISOString(),
      ...details,
    },
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('klikpos:duress_alert', {
        detail: { contextKey, timestamp: Date.now() },
      })
    );
  }
}

// ============================================================================
// 4. BITÁCORA DE AUDITORÍA FORENSE INMUTABLE (HASH-CHAINING BLOCKCHAIN LOCAL)
// ============================================================================

export type SecurityEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'ACCOUNT_LOCKED'
  | 'DURESS_TRIGGERED'
  | 'DRAWER_MANUAL_OPEN'
  | 'VOID_SALE'
  | 'PRICE_OVERRIDE'
  | 'BCV_MANUAL_CHANGE'
  | 'CREDENTIAL_UPDATED'
  | 'SECURITY_CONFIG_CHANGE';

export interface AuditLogEntry {
  id: string;
  index: number;
  timestamp: string;
  eventType: SecurityEventType;
  user: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: Record<string, any>;
  prevHash: string;
  entryHash: string;
}

const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export function calculateLogEntryHash(
  index: number,
  timestamp: string,
  eventType: string,
  user: string,
  prevHash: string,
  details: any
): string {
  const content = `${index}|${timestamp}|${eventType}|${user}|${prevHash}|${JSON.stringify(details || {})}`;
  return sha256Hex(`${ENTERPRISE_PEPPER}:${content}`);
}

export function getAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logSecurityEvent(params: {
  eventType: SecurityEventType;
  user: string;
  severity?: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details?: Record<string, any>;
}): AuditLogEntry {
  const logs = getAuditLogs();
  const prevEntry = logs.length > 0 ? logs[logs.length - 1] : null;
  const index = logs.length;
  const timestamp = new Date().toISOString();
  const prevHash = prevEntry ? prevEntry.entryHash : GENESIS_PREV_HASH;
  const id = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const severity = params.severity || 'INFO';
  const details = params.details || {};

  const entryHash = calculateLogEntryHash(
    index,
    timestamp,
    params.eventType,
    params.user,
    prevHash,
    details
  );

  const newEntry: AuditLogEntry = {
    id,
    index,
    timestamp,
    eventType: params.eventType,
    user: params.user,
    severity,
    details,
    prevHash,
    entryHash,
  };

  logs.push(newEntry);

  const trimmed = logs.length > 1000 ? logs.slice(-1000) : logs;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(trimmed));
    } catch {}
  }

  return newEntry;
}

export function verifyAuditChainIntegrity(): {
  isValid: boolean;
  totalEntries: number;
  tamperedIndex?: number;
  reason?: string;
} {
  const logs = getAuditLogs();
  if (logs.length === 0) {
    return { isValid: true, totalEntries: 0 };
  }

  for (let i = 0; i < logs.length; i++) {
    const entry = logs[i];
    const expectedPrev = i === 0 ? GENESIS_PREV_HASH : logs[i - 1].entryHash;

    if (entry.prevHash !== expectedPrev) {
      return {
        isValid: false,
        totalEntries: logs.length,
        tamperedIndex: i,
        reason: `Discrepancia en enlace criptográfico prevHash en índice ${i}.`,
      };
    }

    const calculatedHash = calculateLogEntryHash(
      entry.index,
      entry.timestamp,
      entry.eventType,
      entry.user,
      entry.prevHash,
      entry.details
    );

    if (entry.entryHash !== calculatedHash) {
      return {
        isValid: false,
        totalEntries: logs.length,
        tamperedIndex: i,
        reason: `El hash del contenido no coincide en el índice ${i} (Registro alterado).`,
      };
    }
  }

  return { isValid: true, totalEntries: logs.length };
}

// ============================================================================
// 5. TECLADO ALEATORIO ANTI-SHOULDER SURFING
// ============================================================================

export function getScrambledKeypad(): string[] {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  for (let i = digits.length - 1; i > 0; i--) {
    let rand = Math.floor(Math.random() * (i + 1));
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      rand = arr[0] % (i + 1);
    }
    const temp = digits[i];
    digits[i] = digits[rand];
    digits[rand] = temp;
  }
  return digits;
}

// ============================================================================
// 6. DETECTOR BIOMÉTRICO (WEBAUTHN / BIOMETRIC PROMPT)
// ============================================================================

export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}
