'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X, Sparkles, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, Smartphone, Monitor } from 'lucide-react';

interface SoftwareUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion?: string;
  isLight?: boolean;
}

interface GithubReleaseInfo {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
}

import { CURRENT_VERSION } from '@/lib/services/update-service';

export const SoftwareUpdateModal: React.FC<SoftwareUpdateModalProps> = ({
  isOpen,
  onClose,
  currentVersion: propVersion,
  isLight = false
}) => {
  const currentVersion = propVersion || (typeof window !== 'undefined' ? localStorage.getItem('klikpos_applied_pwa_version') : null) || `v${CURRENT_VERSION}`;
  const [isLoading, setIsLoading] = useState(true);
  const [releaseInfo, setReleaseInfo] = useState<GithubReleaseInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isHotReloading, setIsHotReloading] = useState(false);

  const handleHotReload = async () => {
    setIsHotReloading(true);
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          await reg.unregister();
        }
      }
      if (releaseInfo?.tag_name) {
        localStorage.setItem('klikpos_applied_pwa_version', releaseInfo.tag_name.replace(/^v/i, ''));
      }
      setTimeout(() => {
        window.location.href = window.location.pathname + '?_t=' + Date.now();
      }, 300);
    } catch {
      window.location.reload();
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkForUpdates();
    }
  }, [isOpen]);

  const checkForUpdates = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Consultar la API oficial de GitHub Releases
      const res = await fetch('https://api.github.com/repos/klikposcloud-svg/klikpos-releases/releases/latest', {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });

      if (res.ok) {
        const data: GithubReleaseInfo = await res.json();
        setReleaseInfo(data);
        const remoteTag = (data.tag_name || '').replace(/^v/i, '').trim();
        const localTag = currentVersion.replace(/^v/i, '').trim();
        setHasUpdate(remoteTag !== localTag);
      } else {
        // Fallback a version.json en raw.githubusercontent.com
        const rawRes = await fetch('https://raw.githubusercontent.com/klikposcloud-svg/klikpos-releases/main/version.json');
        if (rawRes.ok) {
          const rawData = await rawRes.json();
          setReleaseInfo({
            tag_name: `v${rawData.version}`,
            name: rawData.title || `KlikPOS ${rawData.version}`,
            body: Array.isArray(rawData.notes) ? rawData.notes.join('\n• ') : (rawData.notes || ''),
            published_at: rawData.releaseDate || new Date().toISOString(),
            html_url: 'https://github.com/klikposcloud-svg/klikpos-releases/releases',
            assets: [
              { name: 'KlikPOS_Street.apk', browser_download_url: rawData.androidUrl || 'https://github.com/klikposcloud-svg/klikpos-releases/releases/latest/download/KlikPOS_Street.apk', size: 15000000 },
              { name: 'KlikPOS_Desktop_Full_Setup.exe', browser_download_url: rawData.windowsUrl || 'https://github.com/klikposcloud-svg/klikpos-releases/releases/latest/download/KlikPOS_Desktop_Full_Setup.exe', size: 65000000 }
            ]
          });
          setHasUpdate(rawData.version !== currentVersion.replace(/^v/i, ''));
        } else {
          setErrorMsg('No se pudo conectar con el servidor de GitHub Releases. Operando en modo offline.');
        }
      }
    } catch (err: any) {
      console.warn('Error al verificar actualizaciones en GitHub:', err);
      setErrorMsg('Aviso: Sin conexión a internet para verificar GitHub Releases.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Priorizar explícitamente el instalador Street POS antes de cualquier otro APK
  const streetApk = releaseInfo?.assets?.find(a => a.name.toLowerCase().includes('street') && a.name.toLowerCase().endsWith('.apk'));
  const apkAsset = streetApk || releaseInfo?.assets?.find(a => a.name.toLowerCase().endsWith('.apk'));
  const exeAsset = releaseInfo?.assets?.find(a => a.name.toLowerCase().endsWith('.exe'));

  const apkUrl = apkAsset?.browser_download_url || 'https://github.com/klikposcloud-svg/klikpos-releases/releases/latest/download/KlikPOS_Street.apk';
  const exeUrl = exeAsset?.browser_download_url || 'https://github.com/klikposcloud-svg/klikpos-releases/releases/latest/download/KlikPOS_Desktop_Full_Setup.exe';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
        isLight
          ? 'bg-white border-slate-300 text-slate-900'
          : 'bg-[#080d1a] border-slate-700 text-white'
      }`}>
        {/* HEADER DE ALTO CONTRASTE */}
        <header className={`px-6 py-4.5 border-b flex items-center justify-between ${
          isLight
            ? 'bg-slate-100 border-slate-300'
            : 'bg-[#030610] border-slate-800'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h3 className={`text-base font-black tracking-tight ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}>
                Centro de Actualizaciones
              </h3>
              <p className={`text-xs font-semibold ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                Canal Oficial de Distribución y Mantenimiento KlikPOS Cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
              isLight
                ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Cerrar ventana"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </header>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Tarjeta de Versiones con Máximo Contraste (Cero efecto todo blanco) */}
          <div className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-4 shadow-sm ${
            isLight
              ? 'bg-slate-50 border-slate-300'
              : 'bg-[#02050e] border-slate-700'
          }`}>
            <div className="min-w-0">
              <span className={`text-xs font-black uppercase tracking-wider block mb-1.5 ${
                isLight ? 'text-slate-800' : 'text-slate-300'
              }`}>
                Versión Instalada
              </span>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono font-black text-sm sm:text-base bg-amber-400 text-slate-950 border-2 border-amber-300 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse shrink-0" />
                <span>{currentVersion}</span>
              </div>
            </div>

            <div className="text-right min-w-0">
              <span className={`text-xs font-black uppercase tracking-wider block mb-1.5 ${
                isLight ? 'text-slate-800' : 'text-slate-300'
              }`}>
                Última en la Nube
              </span>
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono font-black text-sm sm:text-base ${
                isLoading
                  ? (isLight ? 'bg-slate-200 text-slate-700 border-2 border-slate-300 animate-pulse' : 'bg-slate-800 text-slate-200 border-2 border-slate-700 animate-pulse')
                  : hasUpdate
                  ? 'bg-emerald-400 text-slate-950 border-2 border-emerald-300 shadow-sm'
                  : 'bg-emerald-500 text-white border-2 border-emerald-400 shadow-sm'
              }`}>
                {!isLoading && <span className={`w-2 h-2 rounded-full ${hasUpdate ? 'bg-slate-950' : 'bg-white'} shrink-0`} />}
                <span>{isLoading ? 'Verificando...' : (releaseInfo?.tag_name || currentVersion)}</span>
              </div>
            </div>
          </div>

          {/* Estado de la Actualización */}
          {isLoading ? (
            <div className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center text-center space-y-2.5 shadow-sm ${
              isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-[#040814] border-slate-800'
            }`}>
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className={`text-sm font-black ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}>
                Verificando actualizaciones en KlikPOS Cloud...
              </p>
              <span className={`text-xs font-semibold ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}>
                Consultando el canal oficial GitHub Releases API
              </span>
            </div>
          ) : errorMsg ? (
            <div className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 shadow-sm ${
              isLight
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : 'bg-rose-950/70 border-rose-500/60 text-rose-200'
            }`}>
              <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0 shadow-md">
                <AlertCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <strong className={`font-black text-sm block ${
                  isLight ? 'text-rose-950' : 'text-rose-300'
                }`}>
                  Aviso de Conexión
                </strong>
                <p className={`text-xs mt-0.5 leading-snug font-medium ${
                  isLight ? 'text-rose-900' : 'text-slate-200'
                }`}>
                  {errorMsg}
                </p>
              </div>
            </div>
          ) : hasUpdate ? (
            <div className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 shadow-sm ${
              isLight
                ? 'bg-amber-50 border-amber-400 text-amber-950'
                : 'bg-amber-950/70 border-amber-400 text-amber-100'
            }`}>
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shrink-0 shadow-md">
                <Sparkles className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <strong className={`font-black text-sm block ${
                  isLight ? 'text-amber-950' : 'text-amber-300'
                }`}>
                  ¡Nueva versión oficial disponible!
                </strong>
                <p className={`text-xs mt-0.5 leading-snug font-medium ${
                  isLight ? 'text-amber-900' : 'text-slate-200'
                }`}>
                  Puedes descargar e instalar la actualización directamente. Tu catálogo, ventas y configuración se conservan al 100%.
                </p>
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 shadow-sm ${
              isLight
                ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                : 'bg-emerald-950/70 border-emerald-400 text-emerald-100'
            }`}>
              <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 shrink-0 shadow-md">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <strong className={`font-black text-sm block ${
                  isLight ? 'text-emerald-950' : 'text-emerald-300'
                }`}>
                  ¡Tienes la versión oficial más reciente!
                </strong>
                <p className={`text-xs mt-0.5 leading-snug font-medium ${
                  isLight ? 'text-emerald-900' : 'text-slate-200'
                }`}>
                  Tu terminal cuenta con las últimas optimizaciones de rendimiento exterior, cálculo BCV y blindaje de licencias.
                </p>
              </div>
            </div>
          )}

          {/* Notas de la Versión / Changelog */}
          {releaseInfo?.body && (
            <div className="space-y-2">
              <h4 className={`text-xs font-black uppercase tracking-wider ${
                isLight ? 'text-slate-800' : 'text-slate-300'
              }`}>
                Novedades y Registro de Cambios:
              </h4>
              <div className={`p-4 rounded-2xl border-2 text-xs font-sans leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-900 font-medium'
                  : 'bg-[#02050e] border-slate-700 text-slate-100 font-normal'
              }`}>
                {releaseInfo.body}
              </div>
            </div>
          )}

          {/* Botones de Descarga Directa */}
          <div className="space-y-2.5 pt-1">
            <h4 className={`text-xs font-black uppercase tracking-wider ${
              isLight ? 'text-slate-800' : 'text-slate-300'
            }`}>
              Descargas Oficiales desde KlikPOS Cloud:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Botón APK */}
              <a
                href={apkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-between shadow-lg shadow-emerald-900/30 transition-all active:scale-95 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight text-white font-black">Descargar APK</span>
                    <span className="text-[10.5px] text-emerald-100 font-medium">Tablets y Teléfonos Android</span>
                  </div>
                </div>
                <Download className="w-5 h-5 shrink-0 text-white stroke-[2.5]" />
              </a>

              {/* Botón Windows EXE */}
              <a
                href={exeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs flex items-center justify-between shadow-lg shadow-sky-900/30 transition-all active:scale-95 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Monitor className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight text-white font-black">Instalador Windows</span>
                    <span className="text-[10.5px] text-sky-100 font-medium">Setup .EXE Desatendido PC</span>
                  </div>
                </div>
                <Download className="w-5 h-5 shrink-0 text-white stroke-[2.5]" />
              </a>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className={`px-6 py-4 border-t flex items-center justify-between ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#030610] border-slate-800'
        }`}>
          <button
            onClick={handleHotReload}
            disabled={isHotReloading}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer ${
              isLight
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Recargar memoria caché y código local"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${isHotReloading ? 'animate-spin' : ''}`} />
            <span>{isHotReloading ? 'Purgando Caché...' : 'Recargar App en Caliente'}</span>
          </button>

          <button
            onClick={checkForUpdates}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all flex items-center gap-2 active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Verificar de Nuevo</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
