'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export const CURRENT_STREET_VERSION = '1.0.0';

export interface StreetVersionManifest {
  version: string;
  buildNumber?: number;
  releaseDate: string;
  title: string;
  notes: string[];
  apkUrl?: string;
  fallbackApkUrl?: string;
  mandatory?: boolean;
}

const MANIFEST_URLS = [
  'https://raw.githubusercontent.com/klikposcloud-svg/klikpos-street/main/version.json',
  '/version-street.json',
  '/version.json'
];

export function compareVersions(v1: string, v2: string): number {
  const clean1 = (v1 || '').replace(/^v/i, '').trim();
  const clean2 = (v2 || '').replace(/^v/i, '').trim();
  const p1 = clean1.split('.').map(n => parseInt(n, 10) || 0);
  const p2 = clean2.split('.').map(n => parseInt(n, 10) || 0);
  const maxLen = Math.max(p1.length, p2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export const StreetAutoUpdater: React.FC = () => {
  const [manifest, setManifest] = useState<StreetVersionManifest | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  useEffect(() => {
    // Comprobación silenciosa diferida 3s tras iniciar la terminal para no interferir con la apertura
    const timer = setTimeout(() => {
      checkStreetUpdates();
    }, 3500);

    // Verificación periódica cada 30 minutos si hay conexión a internet activa
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        checkStreetUpdates();
      }
    }, 30 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const checkStreetUpdates = async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;

    for (const url of MANIFEST_URLS) {
      try {
        const cacheBuster = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
        const res = await fetch(cacheBuster, {
          cache: 'no-store',
          headers: { Accept: 'application/json' }
        });

        if (res.ok) {
          const data: StreetVersionManifest = await res.json();
          if (data && data.version) {
            const isNewer = compareVersions(data.version, CURRENT_STREET_VERSION) > 0;
            if (isNewer) {
              setManifest(data);
              setHasUpdate(true);
              setIsDismissed(false);
              return;
            }
          }
        }
      } catch (err) {
        // Silencioso: las terminales de calle pueden tener internet intermitente
      }
    }
  };

  const handleApplyUpdate = async () => {
    if (!manifest) return;
    setIsUpdating(true);

    try {
      // 1. Purgar caché de Service Worker
      if (typeof window !== 'undefined' && 'caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }

      // 2. Notificar Service Worker si existe
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          await reg.update().catch(() => {});
        }
      }

      // 3. Si tiene APK Url y está en Android, iniciar descarga directa
      const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
      const downloadTarget = manifest.apkUrl || manifest.fallbackApkUrl;

      if (isAndroid && downloadTarget) {
        const link = document.createElement('a');
        link.href = downloadTarget;
        link.download = `KlikPOS_Street_v${manifest.version}.apk`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // En entorno web/PWA o recarga en caliente
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch (e) {
      console.warn('[AutoUpdater] Fallback reload:', e);
      window.location.reload();
    } finally {
      setTimeout(() => setIsUpdating(false), 2000);
    }
  };

  if (!hasUpdate || isDismissed || !manifest) {
    return null;
  }

  return (
    <>
      {/* Toast flotante superior de actualización */}
      <aside 
        aria-label="Aviso de actualización disponible"
        className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[94%] max-w-[480px] bg-[#0c1220]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-[0_10px_35px_rgba(245,158,11,0.25)] p-3 text-white flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-bold text-white tracking-wide truncate">
                Actualización v{manifest.version}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950">
                NUEVO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {manifest.title || 'Mejoras y nuevas funciones listas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowNotesModal(true)}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Ver
          </button>
          <button
            onClick={handleApplyUpdate}
            disabled={isUpdating}
            className="px-3 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
          >
            {isUpdating ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            <span>{isUpdating ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
            title="Descartar por ahora"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Modal detallado con notas de la versión */}
      {showNotesModal && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#090d16] border border-white/10 rounded-2xl p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">
                  KlikPOS Street v{manifest.version}
                </h3>
              </div>
              <button
                onClick={() => setShowNotesModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
                Novedades de esta versión:
              </p>
              <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(manifest.notes || []).map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-white/5"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  handleApplyUpdate();
                }}
                disabled={isUpdating}
                className="px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar Actualización</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
