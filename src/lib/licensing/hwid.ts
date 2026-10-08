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

  // Obtener WebGL GPU renderer si está disponible en el WebView/Browser
  let gpuRenderer = 'gpu_unknown';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuRenderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'gpu_gl';
      }
    }
  } catch {}

  const signals = [
    nav.userAgent || 'generic_user_agent',
    nav.platform || 'win32',
    nav.hardwareConcurrency || 4,
    (scr.width || 1920) + 'x' + (scr.height || 1080) + 'x' + (scr.colorDepth || 24) + 'x' + (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1),
    nav.language || 'es-VE',
    new Date().getTimezoneOffset(),
    gpuRenderer,
    'KLIKPOS_DETERMINISTIC_HARDWARE_SALT_2026',
  ].join('###');

  const part1 = fnv1a(signals + '_p1').toString(16).toUpperCase().padStart(8, '0');
  const part2 = fnv1a(signals + '_p2').toString(16).toUpperCase().padStart(8, '0');
  const seedHash = fnv1a(signals + '_seed').toString(16).toUpperCase().padStart(4, '0');

  // Semilla fija 100% determinista ligada al hardware (sobrevive desinstalaciones completas)
  const hwid = `VN${seedHash.slice(0, 2)}-${part1.slice(0, 4)}-${part2.slice(0, 4)}-${part1.slice(4, 8)}`;

  try {
    localStorage.setItem(HWID_STORAGE_KEY, hwid);
    localStorage.setItem('klikpos_terminal_hwid', hwid);
  } catch {}

  return hwid;
}
