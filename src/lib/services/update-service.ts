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
  autoApplySilently: boolean;        // Actualizar automáticamente sin preguntar
  scheduledCheckEnabled: boolean;    // Comprobación a hora fija nocturna
  scheduledTime: string;             // Hora programada (ej: "00:00")
  updateManifestUrl: string;
  lastChecked?: string;
  lastUpdated?: string;
}

import manifestJson from '../../../version.json';

export const CURRENT_VERSION = manifestJson.version || '2.4.7';

const DEFAULT_MANIFEST_URL = 'https://raw.githubusercontent.com/klikposcloud-svg/klikpos-releases/main/version.json';
const FALLBACK_MANIFEST_URLS = [
  'https://raw.githubusercontent.com/klikposcloud-svg/klikpos-releases/main/version.json',
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
    autoApplySilently: true,
    scheduledCheckEnabled: true,
    scheduledTime: '00:00',
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

    // Tomar en cuenta versiones aplicadas en caliente previamente para evitar bucles
    const appliedPwaVersion = typeof window !== 'undefined' ? localStorage.getItem('klikpos_applied_pwa_version') : null;
    const effectiveVersion = (appliedPwaVersion && compareVersions(appliedPwaVersion, CURRENT_VERSION) > 0)
      ? appliedPwaVersion
      : CURRENT_VERSION;

    const hasUpdate = compareVersions(manifest.version, effectiveVersion) > 0;
    this.saveConfig({ lastChecked: new Date().toISOString() });

    return {
      hasUpdate,
      currentVersion: effectiveVersion,
      latestManifest: manifest,
    };
  }

  // Descarga manual del paquete instalador para uso fuera de línea o nueva instalación
  public downloadInstaller(manifest: VersionManifest): { success: boolean; message: string; downloadUrl?: string } {
    if (typeof window === 'undefined') return { success: false, message: 'Entorno no soportado.' };

    const isAndroid = /android/i.test(navigator.userAgent);
    const downloadUrl = isAndroid ? (manifest.androidUrl || manifest.windowsUrl) : manifest.windowsUrl;

    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadUrl.split('/').pop() || 'KlikPOS-Update.exe';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return {
        success: true,
        message: 'Descargando paquete de instalación...',
        downloadUrl,
      };
    }

    return { success: false, message: 'No hay URL de instalador configurada en el manifiesto.' };
  }

  // Actualización en caliente instantánea estilo Web PWA (1 solo clic, limpia caché y recarga)
  public async applyPwaUpdate(targetVersion?: string): Promise<{ success: boolean; message: string }> {
    if (typeof window === 'undefined') return { success: false, message: 'Entorno no soportado.' };

    try {
      if (targetVersion) {
        localStorage.setItem('klikpos_applied_pwa_version', targetVersion);
      }

      // 1. Purgar cachés de Service Worker y almacenamiento temporal de scripts
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      // 2. Activar el nuevo Service Worker inmediatamente
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          await reg.update();
        }
      }

      // 3. Registrar fecha de última actualización
      this.saveConfig({ lastUpdated: new Date().toISOString() });

      // 4. Recargar la interfaz en caliente
      setTimeout(() => {
        window.location.reload();
      }, 500);

      return { success: true, message: '¡Actualización aplicada con éxito! Recargando...' };
    } catch (err: any) {
      console.warn('[PWA Update Refresh]', err);
      window.location.reload();
      return { success: true, message: 'Recargando aplicación con la nueva versión...' };
    }
  }

  // Actualización automática desatendida para entorno de escritorio Windows (descarga y ejecuta el instalador en segundo plano)
  public async applyDesktopSilentUpdate(manifest: VersionManifest): Promise<{ success: boolean; message: string }> {
    if (typeof window === 'undefined') return { success: false, message: 'Entorno no soportado.' };

    try {
      if (manifest.version) {
        localStorage.setItem('klikpos_applied_pwa_version', manifest.version);
      }

      const res = await fetch('/api/system/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          windowsUrl: manifest.windowsUrl,
          version: manifest.version,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      // Una vez disparado el instalador silencioso en el backend, purgar caché cliente y refrescar
      await this.applyPwaUpdate(manifest.version);
      return {
        success: true,
        message: '¡Actualización instalada automáticamente! Reiniciando KlikPOS...',
      };
    } catch (err: any) {
      console.warn('[Desktop Silent Update Fallback to PWA]', err);
      return this.applyPwaUpdate(manifest.version);
    }
  }

  // Método unificado de actualización
  public applyUpdate(
    manifest: VersionManifest,
    mode: 'pwa' | 'installer' = 'pwa'
  ): { success: boolean; message: string; downloadUrl?: string } {
    if (mode === 'installer') {
      return this.downloadInstaller(manifest);
    }
    this.applyPwaUpdate(manifest.version);
    return { success: true, message: 'Aplicando actualización en vivo...' };
  }
}

export const updateService = new UpdateService();
