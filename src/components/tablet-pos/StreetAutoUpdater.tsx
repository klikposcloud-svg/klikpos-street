'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db as firestoreDb, isFirebaseConfigured } from '@/lib/firebase/config';

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
  announcement?: string;
  hotPatchCss?: string;
}

// Manifiestos de respaldo HTTP
const MANIFEST_URLS = [
  'https://raw.githubusercontent.com/klikposcloud-svg/klikpos-street/main/version-street.json',
  '/version-street.json'
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
    // 1. Conexión en TIEMPO REAL a Firestore (Colección system_updates/street)
    let unsubscribeFirestore: (() => void) | null = null;

    if (isFirebaseConfigured() && typeof window !== 'undefined') {
      try {
        const updateDocRef = doc(firestoreDb, 'system_updates', 'street');
        unsubscribeFirestore = onSnapshot(updateDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const remoteData = snapshot.data() as any;
            if (remoteData && remoteData.version) {
              console.log(`[RemoteOTA] 📡 Actualización detectada en Firestore en vivo: v${remoteData.version}`);

              // Aplicar Hot-Patch CSS de emergencia si viene en Firestore
              if (remoteData.hotPatchCss) {
                let styleTag = document.getElementById('remote-hotpatch-css');
                if (!styleTag) {
                  styleTag = document.createElement('style');
                  styleTag.id = 'remote-hotpatch-css';
                  document.head.appendChild(styleTag);
                }
                styleTag.innerHTML = remoteData.hotPatchCss;
              }

              const isNewer = compareVersions(remoteData.version, CURRENT_STREET_VERSION) > 0;
              if (isNewer) {
                const dismissedVer = localStorage.getItem('klikpos_street_dismissed_version');
                if (dismissedVer === remoteData.version && !remoteData.mandatory) {
                  setHasUpdate(false);
                } else {
                  setManifest({
                    version: remoteData.version,
                    buildNumber: remoteData.buildNumber || 1,
                    releaseDate: remoteData.releaseDate || new Date().toISOString(),
                    title: remoteData.title || 'Actualización Oficial Disponible',
                    notes: Array.isArray(remoteData.notes) ? remoteData.notes : ['Mejoras de rendimiento y estabilidad'],
                    apkUrl: remoteData.apkUrl,
                    fallbackApkUrl: remoteData.fallbackApkUrl,
                    mandatory: Boolean(remoteData.mandatory),
                    announcement: remoteData.announcement,
                  });
                  setHasUpdate(true);
                  setIsDismissed(false);
                }
              }
            }
          }
        }, (err) => {
          console.warn('[RemoteOTA] Firestore listener fallback:', err);
        });
      } catch (err) {
        console.warn('[RemoteOTA] Error conectando a Firestore system_updates:', err);
      }
    }

    // 2. Verificación de respaldo HTTP inicial tras 5 segundos
    const timer = setTimeout(() => {
      checkStreetUpdates();
    }, 5000);

    // Verificación periódica cada 30 minutos si hay internet
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        checkStreetUpdates();
      }
    }, 30 * 60 * 1000);

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
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
            const dismissedVer = localStorage.getItem('klikpos_street_dismissed_version');
            if (dismissedVer === data.version && !data.mandatory) {
              setHasUpdate(false);
              return;
            }

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
        // Silencioso: terminal offline
      }
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (manifest?.version) {
      try {
        localStorage.setItem('klikpos_street_dismissed_version', manifest.version);
      } catch (e) {}
    }
  };

  const handleApplyUpdate = async () => {
    if (!manifest) return;
    setIsUpdating(true);

    try {
      if (manifest?.version) {
        try {
          localStorage.setItem('klikpos_street_dismissed_version', manifest.version);
        } catch (e) {}
      }

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
      {/* Toast flotante superior de actualización con CONTRASTE WCAG AAA (>= 7:1) */}
      <aside 
        aria-label="Aviso de actualización disponible"
        className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[94%] max-w-[500px] bg-[#000000] border-2 border-amber-400 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.9)] p-3 text-white flex items-center justify-between gap-3 select-none animate-in fade-in slide-in-from-top-4 duration-300"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center shrink-0 font-black shadow-md">
            <Sparkles className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white tracking-wide truncate">
                Actualización v{manifest.version}
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-black uppercase">
                NUEVO
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-200 truncate mt-0.5">
              {manifest.title || 'Mejoras y optimizaciones listas para instalar'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowNotesModal(true)}
            className="px-2.5 py-1 text-[11px] font-bold text-white hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            Ver
          </button>
          <button
            onClick={handleApplyUpdate}
            disabled={isUpdating}
            className="px-3.5 py-1.5 text-[11px] font-black bg-amber-400 hover:bg-amber-300 text-black rounded-lg shadow-md flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isUpdating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>{isUpdating ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer"
            title="Descartar por ahora"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </aside>

      {/* Modal detallado con notas de la versión - CONTRASTE WCAG AAA (>= 7:1) */}
      {showNotesModal && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#000000] border-2 border-amber-400 rounded-3xl p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-black flex items-center justify-center font-black">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-white tracking-tight">
                  KlikPOS Street v{manifest.version}
                </h3>
              </div>
              <button
                onClick={() => setShowNotesModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Novedades de esta versión:
              </p>
              <ul className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {(manifest.notes || []).map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs font-medium text-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span className="leading-snug">{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  handleApplyUpdate();
                }}
                disabled={isUpdating}
                className="px-5 py-2 text-xs font-black bg-amber-400 hover:bg-amber-300 text-black rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Instalar Actualización</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
