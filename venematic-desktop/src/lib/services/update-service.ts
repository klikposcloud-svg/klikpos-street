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

export const CURRENT_VERSION = '2.4.0';

const DEFAULT_MANIFEST_URL = 'https://raw.githubusercontent.com/klikposcloud-svg/klikpos/main/klikpos-releases/version.json';
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
        this.config = { ...this.config, ...JSON.parse(saved) };
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

  // Comprueba si hay una nueva versión disponible consultando el servidor remoto
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

    try {
      const url = this.config.updateManifestUrl || DEFAULT_MANIFEST_URL;
      // Añadir timestamp para evitar caché agresivo de CDNs
      const bustCacheUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;

      const res = await fetch(bustCacheUrl, {
        headers: { Accept: 'application/json' },
        cache: 'no-cache',
      });

      if (!res.ok) {
        throw new Error(`Servidor de actualizaciones respondió con estado ${res.status}`);
      }

      const manifest: VersionManifest = await res.json();
      const hasUpdate = compareVersions(manifest.version, CURRENT_VERSION) > 0;

      this.saveConfig({ lastChecked: new Date().toISOString() });

      return {
        hasUpdate,
        currentVersion: CURRENT_VERSION,
        latestManifest: manifest,
      };
    } catch (err: any) {
      return {
        hasUpdate: false,
        currentVersion: CURRENT_VERSION,
        latestManifest: null,
        error: err.message || 'No se pudo contactar el servidor de actualizaciones en línea.',
      };
    }
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
