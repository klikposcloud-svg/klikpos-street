'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X, Sparkles, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, Smartphone, Monitor } from 'lucide-react';

interface SoftwareUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion?: string;
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

export const SoftwareUpdateModal: React.FC<SoftwareUpdateModalProps> = ({
  isOpen,
  onClose,
  currentVersion = 'v1.0.0'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [releaseInfo, setReleaseInfo] = useState<GithubReleaseInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const apkAsset = releaseInfo?.assets?.find(a => a.name.toLowerCase().endsWith('.apk'));
  const exeAsset = releaseInfo?.assets?.find(a => a.name.toLowerCase().endsWith('.exe'));

  const apkUrl = apkAsset?.browser_download_url || 'https://github.com/klikposcloud-svg/klikpos-releases/releases/latest/download/KlikPOS_Street.apk';
  const exeUrl = exeAsset?.browser_download_url || 'https://github.com/klikposcloud-svg/klikpos-releases/releases/latest/download/KlikPOS_Desktop_Full_Setup.exe';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-700 bg-[#0b101b] text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Centro de Actualizaciones de Software
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  GitHub Release
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Canal Oficial de Distribución Continua KlikPOS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Tarjeta de Versiones */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Versión Instalada
              </span>
              <span className="text-lg font-black font-mono text-amber-400">
                {currentVersion}
              </span>
              <span className="text-[10px] text-slate-500 block">Compilación Local Activa</span>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Última en GitHub
              </span>
              <span className="text-lg font-black font-mono text-emerald-400">
                {isLoading ? 'Verificando...' : (releaseInfo?.tag_name || 'Al día')}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {releaseInfo ? new Date(releaseInfo.published_at).toLocaleDateString() : 'klikpos-releases'}
              </span>
            </div>
          </div>

          {/* Estado de la Actualización */}
          {isLoading ? (
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-2">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm font-bold text-slate-300">Consultando repositorio de GitHub Releases...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          ) : hasUpdate ? (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300 text-xs animate-pulse">
              <Sparkles className="w-5 h-5 shrink-0 text-amber-400" />
              <div>
                <strong className="font-black block">¡Nueva versión disponible en GitHub!</strong>
                <span>Puedes descargar e instalar el archivo directamente sin perder tu configuración.</span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <strong className="font-black block">¡Tienes la versión oficial más reciente!</strong>
                <span>Tu terminal cuenta con las últimas optimizaciones y seguridad.</span>
              </div>
            </div>
          )}

          {/* Notas de la Versión / Changelog */}
          {releaseInfo?.body && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Novedades y Registro de Cambios:
              </h4>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                {releaseInfo.body}
              </div>
            </div>
          )}

          {/* Botones de Descarga Directa */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Descargas Directas desde GitHub:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Botón APK */}
              <a
                href={apkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-between shadow-lg transition-all active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-5 h-5 text-white" />
                  <div className="text-left">
                    <span className="block leading-tight">Descargar APK</span>
                    <span className="text-[10px] text-emerald-200 font-normal">Para Tablets y Teléfonos Android</span>
                  </div>
                </div>
                <Download className="w-4 h-4 shrink-0 text-white" />
              </a>

              {/* Botón Windows EXE */}
              <a
                href={exeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs flex items-center justify-between shadow-lg transition-all active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <Monitor className="w-5 h-5 text-white" />
                  <div className="text-left">
                    <span className="block leading-tight">Instalador Windows</span>
                    <span className="text-[10px] text-sky-200 font-normal">Setup .EXE Desatendido</span>
                  </div>
                </div>
                <Download className="w-4 h-4 shrink-0 text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
            title="Recargar memoria caché y código local"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Recargar App en Caliente</span>
          </button>

          <button
            onClick={checkForUpdates}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Verificar de Nuevo</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
