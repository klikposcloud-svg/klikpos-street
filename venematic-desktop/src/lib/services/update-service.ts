// update-service.ts - Gestor Integral de Auto-Actualizaciones en Línea y Fuera de Línea
// Soporta: Windows Desktop (Launcher / Inno Setup), Android (APK) y Web PWA (Cache Refresh)

export interface VersionManifest {
  version: string;
  releaseDate: string;
  title: string;
  notes: string[];
  windowsUrl?: string;
  androidUrl?: string;
  mandatory?: boolean;
}

export interface UpdateConfig {
  autoCheckOnStartup: boolean;
  updateManifestUrl: string;
  lastChecked?: string;
}

export const CURRENT_VERSION = '2.4.1';

const DEFAULT_MANIFEST_URL = 'https://raw.githubusercontent.com/klikposcloud-svg/klikpos-releases/main/version.json';
const FALLBACK_MANIFEST_URLS = [
  'https://raw.githubusercontent.com/klikposcloud-svg/klikpos-releases/main/version.json',
  'https://raw.githubusercontent.com/klikposcloud-svg/klikpos/main/version.json',
  '/version.json',
];
const UPDATE_CONFIG_KEY = 'klikpos_update_config';

export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const parts2 = v2.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

class UpdateService {
  private config: UpdateConfig = {
    autoCheckOnStartup: true,
    updateManifestUrl: DEFAULT_MANIFEST_URL,
  };

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(UPDATE_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Autocorrección de URLs obsoletas o rutas internas rotas
        if (
          !parsed.updateManifestUrl ||
          parsed.updateManifestUrl.includes('venematic-releases') ||
          parsed.updateManifestUrl.includes('klikpos/main/klikpos-releases')
        ) {
          parsed.updateManifestUrl = DEFAULT_MANIFEST_URL;
        }
        this.config = { ...this.config, ...parsed };
      }
    } catch {}
  }

  public saveConfig(newConfig: Partial<UpdateConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(UPDATE_CONFIG_KEY, JSON.stringify(this.config));
      } catch {}
    }
  }

  public getConfig(): UpdateConfig {
    return { ...this.config };
  }

  public getCurrentVersion(): string {
    return CURRENT_VERSION;
  }

  // Comprueba si hay una nueva versión disponible consultando los servidores remotos
  public async checkForUpdates(): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestManifest: VersionManifest | null;
    error?: string;
  }> {
    if (typeof window === 'undefined') {
      return { hasUpdate: false, currentVersion: CURRENT_VERSION, latestManifest: null };
    }

    // Si el dispositivo está sin conexión a internet, retornar pacíficamente
    if (!navigator.onLine) {
      return {
        hasUpdate: false,
        currentVersion: CURRENT_VERSION,
        latestManifest: null,
        error: 'Sin conexión a internet. El sistema continuará operando en modo local fuera de línea.',
      };
    }

    const candidateUrls = [
      this.config.updateManifestUrl,
      DEFAULT_MANIFEST_URL,
      ...FALLBACK_MANIFEST_URLS,
    ].filter((u, i, arr): u is string => !!u && arr.indexOf(u) === i);

    let lastError = 'No se pudo contactar el servidor de actualizaciones en línea.';
    let manifest: VersionManifest | null = null;

    for (const rawUrl of candidateUrls) {
      try {
        const bustCacheUrl = `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
        const res = await fetch(bustCacheUrl, {
          headers: { Accept: 'application/json' },
          cache: 'no-cache',
        });

        if (res.ok) {
          manifest = await res.json();
          if (manifest && manifest.version) {
            break;
          }
        } else {
          lastError = `Servidor de actualizaciones respondió con estado ${res.status}`;
        }
      } catch (err: any) {
        lastError = err?.message || lastError;
      }
    }

    if (!manifest) {
      return {
        hasUpdate: false,
        currentVersion: CURRENT_VERSION,
        latestManifest: null,
        error: lastError,
      };
    }

    const hasUpdate = compareVersions(manifest.version, CURRENT_VERSION) > 0;
    this.saveConfig({ lastChecked: new Date().toISOString() });

    return {
      hasUpdate,
      currentVersion: CURRENT_VERSION,
      latestManifest: manifest,
    };
  }

  // Ejecuta la actualización según el entorno de ejecución
  public applyUpdate(manifest: VersionManifest): { success: boolean; message: string; downloadUrl?: string } {
    if (typeof window === 'undefined') return { success: false, message: 'Entorno no soportado.' };

    const isAndroid = /android/i.test(navigator.userAgent);
    const downloadUrl = isAndroid ? (manifest.androidUrl || manifest.windowsUrl) : manifest.windowsUrl;

    if (downloadUrl) {
      // Disparar la descarga del instalador / APK directamente en el navegador
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadUrl.split('/').pop() || 'Venematic-Update';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return {
        success: true,
        message: 'Descargando instalador de actualización...',
        downloadUrl,
      };
    }

    // Si es aplicación Web/PWA sin instalador externo, forzar recarga de Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.update();
        }
      });
    }

    window.location.reload();
    return { success: true, message: 'Aplicación actualizada y recargada.' };
  }
}

export const updateService = new UpdateService();
