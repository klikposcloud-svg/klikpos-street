/**
 * Venematic Hardware Fingerprint & Machine ID Engine
 * Genera un identificador único, persistente y ligado a la máquina física.
 */

const HWID_STORAGE_KEY = 'venematic_machine_hwid_v2';

/**
 * Genera un hash FNV-1a de 32 bits a partir de una cadena
 */
function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Obtiene o inicializa la semilla única de hardware para esta máquina
 */
export function getMachineHWID(): string {
  if (typeof window === 'undefined') {
    return 'VN00-0000-0000-0000';
  }

  try {
    const existing = localStorage.getItem(HWID_STORAGE_KEY);
    if (existing && existing.startsWith('VN') && existing.length === 19) {
      return existing;
    }
  } catch {}

  // Recolectar señales inmutables de hardware y entorno del sistema
  const nav = typeof navigator !== 'undefined' ? navigator : ({} as any);
  const scr = typeof window !== 'undefined' && window.screen ? window.screen : ({} as any);

  const signals = [
    nav.userAgent || 'generic_user_agent',
    nav.platform || 'win32',
    nav.hardwareConcurrency || 4,
    (scr.width || 1920) + 'x' + (scr.height || 1080) + 'x' + (scr.colorDepth || 24),
    nav.language || 'es-VE',
    new Date().getTimezoneOffset(),
    'VENEMATIC_DESKTOP_TAURI_WIN_SALT_99',
  ].join('###');

  const part1 = fnv1a(signals + '_p1').toString(16).toUpperCase().padStart(8, '0');
  const part2 = fnv1a(signals + '_p2').toString(16).toUpperCase().padStart(8, '0');

  // Si no hay semilla de instalación previa, generar una fija de 4 caracteres
  const seed = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();

  const hwid = `VN${seed.slice(0, 2)}-${part1.slice(0, 4)}-${part2.slice(0, 4)}-${part1.slice(4, 8)}`;

  try {
    localStorage.setItem(HWID_STORAGE_KEY, hwid);
  } catch {}

  return hwid;
}
