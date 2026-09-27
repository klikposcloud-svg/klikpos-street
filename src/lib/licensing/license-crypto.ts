/**
 * Venematic Cryptographic Offline Licensing Engine (HMAC-SHA256)
 * Genera y valida llaves criptográficas ligadas al HWID de la máquina.
 */

export type LicensePlan =
  | 'vitalicia' | 'anual' | 'demo'
  | 'starter_trial' | 'starter_full'
  | 'pro_trial' | 'pro_full'
  | 'trial_15m'
  | 'promo_6m' | 'basico_local' | 'cloud_monthly';

export interface LicensePayload {
  hwid: string;
  rif: string;
  plan: LicensePlan;
  expiresAt: string; // ISO date or 'NEVER'
  issuedAt: string;
  signature: string;
}

export interface ActivatedLicenseInfo {
  status: 'active' | 'expired' | 'trial' | 'invalid' | 'tampered';
  payload?: LicensePayload;
  licenseKey?: string;
  daysRemaining?: number;
  message: string;
}

const MASTER_SIGNING_SALT = 'VENEMATIC_SEC_SALT_2026_AIVYNTRAX_PRO_POS_V2';
const LICENSE_STORAGE_KEY = 'venematic_activated_license_payload';

/**
 * Función criptográfica hash SHA-256 en TypeScript puro / WebCrypto
 */
function sha256Hex(str: string): string {
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
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  // Encode UTF-8
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 128) bytes.push(code);
    else if (code < 2048) bytes.push(192 | (code >> 6), 128 | (code & 63));
    else bytes.push(224 | (code >> 12), 128 | ((code >> 6) & 63), 128 | (code & 63));
  }

  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0);
  const highBits = Math.floor(bitLength / 0x100000000);
  const lowBits = bitLength >>> 0;
  for (let i = 3; i >= 0; i--) bytes.push((highBits >>> (i * 8)) & 0xff);
  for (let i = 3; i >= 0; i--) bytes.push((lowBits >>> (i * 8)) & 0xff);

  const words = new Uint32Array(bytes.length / 4);
  for (let i = 0; i < bytes.length; i += 4) {
    words[i / 4] = (bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3];
  }

  const w = new Uint32Array(64);
  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) w[t] = words[i + t];
    for (let t = 16; t < 64; t++) {
      const s0 = ((w[t - 15] >>> 7) | (w[t - 15] << 25)) ^ ((w[t - 15] >>> 18) | (w[t - 15] << 14)) ^ (w[t - 15] >>> 3);
      const s1 = ((w[t - 2] >>> 17) | (w[t - 2] << 15)) ^ ((w[t - 2] >>> 19) | (w[t - 2] << 13)) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (h + S1 + ch + k[t] + w[t]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map(v => v.toString(16).padStart(8, '0'))
    .join('');
}

/**
 * Genera la firma criptográfica HMAC para el HWID + RIF + Plan + Expiración
 */
export function computeSignature(hwid: string, rif: string, plan: LicensePlan, expiresAt: string): string {
  const cleanHwid = hwid.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanRif = rif.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const payloadStr = `${cleanHwid}#${cleanRif}#${plan}#${expiresAt}#${MASTER_SIGNING_SALT}`;
  const fullHash = sha256Hex(payloadStr).toUpperCase();
  // Extraemos 16 caracteres hexadecimales formateados en 4 bloques de 4
  return `${fullHash.slice(0, 4)}-${fullHash.slice(4, 8)}-${fullHash.slice(8, 12)}-${fullHash.slice(12, 16)}`;
}

/**
 * KEYGEN (Generador de Licencias Exclusivo del Propietario)
 * Produce el Product Key final que se entrega al cliente
 */
export function generateLicenseKey(
  hwid: string,
  rif: string,
  plan: LicensePlan,
  expiresAtDateStr?: string
): string {
  // Plan prefix codes
  const planPrefixMap: Record<LicensePlan, string> = {
    vitalicia:     'VIT',
    anual:         'ANL',
    demo:          'DMO',
    starter_trial: 'STT',
    starter_full:  'STR',
    pro_trial:     'PTT',
    pro_full:      'PRO',
    trial_15m:     'T15',
    promo_6m:      'PRM',
    basico_local:  'BAS',
    cloud_monthly: 'CLD',
  };
  const planPrefix = planPrefixMap[plan] ?? 'DMO';

  // Expiry logic
  let expires: string;
  if (plan === 'vitalicia' || plan === 'starter_full' || plan === 'pro_full' || plan === 'basico_local') {
    expires = 'NEVER';
  } else if (plan === 'trial_15m') {
    expires = '15MIN';
  } else if (plan === 'promo_6m') {
    // 180 days (6 months)
    expires = expiresAtDateStr || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
  } else if (plan === 'starter_trial' || plan === 'pro_trial' || plan === 'cloud_monthly') {
    // 30 days trial or monthly
    expires = expiresAtDateStr || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  } else if (plan === 'demo') {
    // 15 days demo
    expires = expiresAtDateStr || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  } else {
    // anual: 365 days
    expires = expiresAtDateStr || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
  }

  const expCode = expires === 'NEVER' ? 'PERP' : expires === '15MIN' ? '15MN' : expires.replace(/-/g, '').slice(2, 6);
  // Standardize signature date to 20${yy}-${mm}-28 for monthly/annual if not special code
  const sigDate = (expires === 'NEVER' || expires === '15MIN') ? expires : `20${expCode.slice(0, 2)}-${expCode.slice(2, 4)}-28`;
  const sig = computeSignature(hwid, rif, plan, sigDate);
  return `VNK-${planPrefix}-${expCode}-${sig}`;
}

/**
 * Validador de Llave de Activación
 */
export function verifyLicenseKey(
  key: string,
  hwid: string,
  rif: string
): { valid: boolean; plan?: LicensePlan; expiresAt?: string; error?: string } {
  const clean = key.trim().toUpperCase();
  const parts = clean.split('-');

  if (parts.length < 5 || parts[0] !== 'VNK') {
    return { valid: false, error: 'Formato de clave de producto inválido. Debe iniciar con VNK-' };
  }

  const planCode = parts[1];
  const planCodeMap: Record<string, LicensePlan> = {
    VIT: 'vitalicia',
    ANL: 'anual',
    DMO: 'demo',
    STT: 'starter_trial',
    STR: 'starter_full',
    PTT: 'pro_trial',
    PRO: 'pro_full',
    T15: 'trial_15m',
    PRM: 'promo_6m',
    BAS: 'basico_local',
    CLD: 'cloud_monthly',
  };
  const plan: LicensePlan = planCodeMap[planCode] ?? 'demo';
  if (!planCodeMap[planCode]) {
    return { valid: false, error: `Código de plan desconocido: ${planCode}` };
  }

  const expCode = parts[2];
  const sigProvided = `${parts[3]}-${parts[4]}-${parts[5] || ''}-${parts[6] || ''}`.replace(/-+$/, '');

  // Caso especial: Prueba Flash de 15 Minutos
  if (expCode === '15MN' || plan === 'trial_15m') {
    const expectedSig = computeSignature(hwid, rif, 'trial_15m', '15MIN');
    if (sigProvided !== expectedSig) {
      return {
        valid: false,
        error: 'La firma de la llave de prueba no corresponde a este computador o RIF.',
      };
    }
    if (typeof window !== 'undefined') {
      const startRaw = localStorage.getItem('venematic_trial15m_start');
      let startTime = startRaw ? parseInt(startRaw) : 0;
      if (!startTime) {
        startTime = Date.now();
        localStorage.setItem('venematic_trial15m_start', String(startTime));
      }
      const elapsed = Date.now() - startTime;
      if (elapsed > 15 * 60 * 1000) {
        return {
          valid: false,
          plan: 'trial_15m',
          expiresAt: '15MIN',
          error: '⏳ El período de prueba de 15 minutos ha expirado. Por favor adquiere la licencia definitiva para continuar.',
        };
      }
    }
    return { valid: true, plan: 'trial_15m', expiresAt: '15MIN' };
  }

  let expiresAt = 'NEVER';
  if (expCode !== 'PERP') {
    const yy = expCode.slice(0, 2);
    const mm = expCode.slice(2, 4);
    expiresAt = `20${yy}-${mm}-28`;
  }

  let expectedSig = computeSignature(hwid, rif, plan, expiresAt);
  let isSigValid = (sigProvided === expectedSig);

  // Fallback de compatibilidad: chequear días alternativos en caso de firmas con YYYY-MM-DD previo
  if (!isSigValid && expCode !== 'PERP') {
    const yy = expCode.slice(0, 2);
    const mm = expCode.slice(2, 4);
    for (let day = 1; day <= 31; day++) {
      const altExp = `20${yy}-${mm}-${day.toString().padStart(2, '0')}`;
      if (computeSignature(hwid, rif, plan, altExp) === sigProvided) {
        isSigValid = true;
        expiresAt = altExp;
        break;
      }
    }
  }

  if (!isSigValid) {
    return {
      valid: false,
      error: 'La firma de la llave no corresponde a este computador o RIF. Licencia no transferible.',
    };
  }

  if (expiresAt !== 'NEVER') {
    const expTime = new Date(expiresAt).getTime();
    if (Date.now() > expTime) {
      const isPlanTrial = plan === 'starter_trial' || plan === 'pro_trial' || plan === 'demo';
      const msg = isPlanTrial
        ? `El período de prueba (primera cuota) expiró el ${expiresAt}. Realiza tu segundo pago para activar la licencia completa.`
        : `La licencia venció el ${expiresAt}.`;
      return { valid: false, plan, expiresAt, error: msg };
    }
  }

  return { valid: true, plan, expiresAt };
}

/**
 * Guarda la licencia activada en el almacenamiento seguro local
 */
export function saveActivatedLicense(payload: LicensePayload, key: string) {
  if (typeof window === 'undefined') return;
  try {
    if (payload.plan !== 'trial_15m') {
      localStorage.removeItem('venematic_trial15m_start');
    }
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify({ payload, key }));
    window.dispatchEvent(new CustomEvent('venematic:license-activated', { detail: payload }));
  } catch {}
}

/**
 * Obtiene el estado actual de activación de la máquina
 */
export function getStoredLicenseStatus(currentHwid: string, latestDbSaleDate?: string): ActivatedLicenseInfo {
  if (typeof window === 'undefined') {
    return { status: 'active', message: 'Modo servidor' };
  }

  try {
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!raw) {
      return {
        status: 'trial',
        daysRemaining: 15,
        message: 'Período de Demostración Activo (Sin Licencia Permanente Registrada)',
      };
    }

    const { payload, key } = JSON.parse(raw) as { payload: LicensePayload; key: string };

    if (!payload || payload.hwid !== currentHwid) {
      return {
        status: 'invalid',
        message: 'Licencia transferida ilegalmente desde otro equipo. Hardware ID no coincide.',
      };
    }

    // Anti-tamper clock check: Si la última venta en base de datos es del futuro respecto al reloj
    if (latestDbSaleDate) {
      const lastSaleTime = new Date(latestDbSaleDate).getTime();
      if (lastSaleTime > Date.now() + 86400000) {
        return {
          status: 'tampered',
          message: 'Reloj del sistema alterado para intentar evadir la caducidad. Sistema bloqueado.',
        };
      }
    }

    // Caso especial: Licencia de prueba de 15 minutos
    if (payload.plan === 'trial_15m') {
      const startRaw = localStorage.getItem('venematic_trial15m_start');
      const startTime = startRaw ? parseInt(startRaw) : Date.now();
      const elapsed = Date.now() - startTime;
      const remainingMs = Math.max(0, 15 * 60 * 1000 - elapsed);
      const remainingMinutes = Math.ceil(remainingMs / 60000);

      if (remainingMs <= 0) {
        return {
          status: 'expired',
          payload,
          licenseKey: key,
          daysRemaining: 0,
          message: '⏳ Período de prueba de 15 minutos finalizado. La aplicación requiere activación definitiva.',
        };
      }

      return {
        status: 'trial',
        payload,
        licenseKey: key,
        daysRemaining: remainingMinutes,
        message: `Prueba Flash Activa (${remainingMinutes} min restantes)`,
      };
    }

    if (payload.expiresAt !== 'NEVER') {
      const expTime = new Date(payload.expiresAt).getTime();
      const diffDays = Math.ceil((expTime - Date.now()) / 86400000);

      if (diffDays <= 0) {
        return {
          status: 'expired',
          payload,
          licenseKey: key,
          daysRemaining: 0,
          message: `Licencia de soporte anual vencida el ${payload.expiresAt}. Renueve su suscripción.`,
        };
      }

      return {
        status: 'active',
        payload,
        licenseKey: key,
        daysRemaining: diffDays,
        message: `Licencia Anual Activa (${diffDays} días restantes)`,
      };
    }

    return {
      status: 'active',
      payload,
      licenseKey: key,
      daysRemaining: 99999,
      message: 'Licencia Vitalicia Oficial Activa (Sin Vencimiento)',
    };
  } catch {
    return { status: 'trial', daysRemaining: 7, message: 'Estado de licencia no inicializado' };
  }
}
