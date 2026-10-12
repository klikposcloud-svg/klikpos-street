'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X, Sparkles, CheckCircle2, ChevronRight, Smartphone, Monitor } from 'lucide-react';
import { CURRENT_VERSION, compareVersions } from '@/lib/services/update-service';

export interface StreetVersionManifest {
  version: string;
  buildNumber?: number;
  releaseDate: string;
  title: string;
  notes: string[];
  apkUrl?: string;
  fallbackApkUrl?: string;
  windowsUrl?: string;
  mandatory?: boolean;
  announcement?: string;
}

interface StreetAutoUpdaterProps {
  isLight?: boolean;
  onOpenFullModal?: () => void;
}

const OFFICIAL_RELEASE_MANIFESTS = [
  'https://raw.githubusercontent.com/klikposcloud-svg/klikpos-releases/main/version.json',
  'https://api.github.com/repos/klikposcloud-svg/klikpos-releases/releases/latest',
  '/version.json'
];

export const StreetAutoUpdater: React.FC<StreetAutoUpdaterProps> = ({
  isLight = false,
  onOpenFullModal
}) => {
  const [manifest, setManifest] = useState<StreetVersionManifest | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkOfficialUpdates();
    }, 6000);

    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        checkOfficialUpdates();
      }
    }, 20 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const checkOfficialUpdates = async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;

    for (const url of OFFICIAL_RELEASE_MANIFESTS) {
      try {
        const isApi = url.includes('api.github.com');
        const reqUrl = isApi ? url : `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
        
        const res = await fetch(reqUrl, {
          cache: 'no-store',
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          const raw = await res.json();
          let parsedManifest: StreetVersionManifest | null = null;

          if (isApi && raw.tag_name) {
            const verClean = raw.tag_name.replace(/^v/i, '').trim();
            const apkAsset = raw.assets?.find((a: any) => a.name.toLowerCase().includes('street') && a.name.toLowerCase().endsWith('.apk'))
              || raw.assets?.find((a: any) => a.name.toLowerCase().endsWith('.apk'));
            const exeAsset = raw.assets?.find((a: any) => a.name.toLowerCase().endsWith('.exe'));

            parsedManifest = {
              version: verClean,
              releaseDate: raw.published_at || new Date().toISOString(),
              title: raw.name || `KlikPOS Suite v${verClean}`,
              notes: raw.body ? raw.body.split('\n').filter((l: string) => l.trim().length > 0) : ['Nuevas optimizaciones en vivo'],
              apkUrl: apkAsset?.browser_download_url || 'https://github.com/klikposcloud-svg/klikpos-releases/releases/latest/download/KlikPOS_Street.apk',
              windowsUrl: exeAsset?.browser_download_url || 'https://github.com/klikposcloud-svg/klikpos-releases/releases/latest/download/KlikPOS_Desktop_Full_Setup.exe'
            };
          } else if (raw && raw.version) {
            const verClean = String(raw.version).replace(/^v/i, '').trim();
            parsedManifest = {
              version: verClean,
              buildNumber: raw.buildNumber || 1,
              releaseDate: raw.releaseDate || new Date().toISOString(),
              title: raw.title || `KlikPOS Suite v${verClean}`,
              notes: Array.isArray(raw.notes) ? raw.notes : ['Nuevas mejoras de rendimiento y estabilidad'],
              apkUrl: raw.androidUrl || raw.apkUrl || 'https://github.com/klikposcloud-svg/klikpos-releases/releases/latest/download/KlikPOS_Street.apk',
              windowsUrl: raw.windowsUrl || 'https://github.com/klikposcloud-svg/klikpos-releases/releases/latest/download/KlikPOS_Desktop_Full_Setup.exe',
              mandatory: Boolean(raw.mandatory)
            };
          }

          if (parsedManifest && parsedManifest.version) {
            const isNewer = compareVersions(parsedManifest.version, CURRENT_VERSION) > 0;
            if (isNewer) {
              const dismissed = localStorage.getItem(`klikpos_dismissed_update_${parsedManifest.version}`);
              if (dismissed === 'true' && !parsedManifest.mandatory) {
                setHasUpdate(false);
                return;
              }
              setManifest(parsedManifest);
              setHasUpdate(true);
              setIsDismissed(false);
              return;
            }
          }
        }
      } catch {}
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (manifest?.version) {
      try {
        localStorage.setItem(`klikpos_dismissed_update_${manifest.version}`, 'true');
      } catch {}
    }
  };

  const handleDownloadUpdate = async () => {
    if (!manifest) return;
    setIsDownloading(true);

    try {
      const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
      const downloadTarget = isAndroid
        ? (manifest.apkUrl || manifest.fallbackApkUrl || 'https://github.com/klikposcloud-svg/klikpos-releases/releases/latest/download/KlikPOS_Street.apk')
        : (manifest.windowsUrl || 'https://github.com/klikposcloud-svg/klikpos-releases/releases/latest/download/KlikPOS_Desktop_Full_Setup.exe');

      const link = document.createElement('a');
      link.href = downloadTarget;
      link.download = isAndroid ? `KlikPOS_Street_v${manifest.version}.apk` : `KlikPOS_Desktop_v${manifest.version}.exe`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setIsDismissed(true);
        if (manifest?.version) {
          localStorage.setItem(`klikpos_dismissed_update_${manifest.version}`, 'true');
        }
      }, 1000);
    } catch (e) {
      console.warn('[AutoUpdater] Error en descarga:', e);
      if (manifest?.windowsUrl) window.open(manifest.windowsUrl, '_blank');
    } finally {
      setTimeout(() => setIsDownloading(false), 2000);
    }
  };

  if (!hasUpdate || isDismissed || !manifest) {
    return null;
  }

  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  return (
    <>
      <aside
        aria-label="Aviso de nueva actualización disponible"
        className={`fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-[60] w-[94%] max-w-[440px] rounded-3xl border-2 shadow-[0_16px_50px_rgba(0,0,0,0.8)] p-4 select-none animate-in fade-in slide-in-from-bottom-5 duration-300 transition-all ${
          isLight
            ? 'bg-white border-amber-400 text-slate-900'
            : 'bg-[#060a14] border-amber-400 text-white'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-md shadow-amber-500/25 mt-0.5">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wide shadow-xs">
                  NUEVA VERSIÓN v{manifest.version}
                </span>
                <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Oficial en la Nube
                </span>
              </div>

              <h4 className={`text-sm font-black tracking-tight mt-1 truncate ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}>
                {manifest.title || `KlikPOS v${manifest.version} Lista`}
              </h4>
              <p className={`text-xs mt-0.5 leading-snug line-clamp-2 ${
                isLight ? 'text-slate-600 font-medium' : 'text-slate-300 font-normal'
              }`}>
                {manifest.notes && manifest.notes[0]
                  ? manifest.notes[0]
                  : 'Nuevas mejoras de rendimiento, contraste y estabilidad listas para usar.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
              isLight
                ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Posponer aviso"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              if (onOpenFullModal) {
                onOpenFullModal();
              } else {
                setShowNotesModal(true);
              }
            }}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span>Ver Novedades</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDownloadUpdate}
            disabled={isDownloading}
            className="flex-1 px-4 py-2 text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isDownloading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Download className="w-4 h-4 stroke-[2.5] text-slate-950" />
            )}
            <span>
              {isDownloading
                ? 'Iniciando Descarga...'
                : isAndroid
                ? 'Descargar APK'
                : 'Descargar Actualización'}
            </span>
          </button>
        </div>
      </aside>

      {showNotesModal && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 space-y-5 ${
            isLight
              ? 'bg-white border-amber-400 text-slate-900'
              : 'bg-[#080d1a] border-amber-400 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className={`font-black text-base tracking-tight ${
                  isLight ? 'text-slate-950' : 'text-white'
                }`}>
                  KlikPOS Suite v{manifest.version}
                </h3>
              </div>
              <button
                onClick={() => setShowNotesModal(false)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black text-amber-500 uppercase tracking-wider">
                Novedades de esta versión:
              </p>
              <ul className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {(manifest.notes || []).map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span className={`leading-snug ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowNotesModal(false)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  handleDownloadUpdate();
                }}
                disabled={isDownloading}
                className="px-5 py-2 text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Descargar Ahora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
