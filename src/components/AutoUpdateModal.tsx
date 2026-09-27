'use client';

import React, { useState, useEffect, useRef } from 'react';
import { updateService, VersionManifest, CURRENT_VERSION } from '@/lib/services/update-service';
import { Sparkles, Download, CheckCircle2, X, AlertCircle, RefreshCw, Zap, Package } from 'lucide-react';

export default function AutoUpdateModal() {
  const [manifest, setManifest] = useState<VersionManifest | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [silentNotice, setSilentNotice] = useState<string | null>(null);
  const lastScheduledCheckRef = useRef<string>('');

  useEffect(() => {
    // 1. Escuchar evento manual para verificar actualizaciones desde Ajustes o teclado
    const handleManualCheck = async () => {
      const res = await updateService.checkForUpdates();
      if (res.hasUpdate && res.latestManifest) {
        setManifest(res.latestManifest);
        setIsOpen(true);
      } else {
        alert(
          res.error
            ? `Estado de Actualizaciones: ${res.error}`
            : `¡El sistema está al día! Estás usando la versión más reciente (v${CURRENT_VERSION}).`
        );
      }
    };

    window.addEventListener('venematic:check_updates', handleManualCheck);

    // 2. Verificación automática al iniciar (con retardo de 3 segundos para no entorpecer el POS)
    const startupTimer = setTimeout(async () => {
      const cfg = updateService.getConfig();
      if (cfg.autoCheckOnStartup && navigator.onLine) {
        const res = await updateService.checkForUpdates();
        if (res.hasUpdate && res.latestManifest) {
          const m = res.latestManifest;
          // Si está activada la actualización silenciosa sin preguntar (Estilo PWA)
          if (cfg.autoApplySilently) {
            setSilentNotice(`⚡ Nueva versión v${m.version} detectada. Aplicando actualización silenciosa en vivo...`);
            setTimeout(() => {
              updateService.applyPwaUpdate();
            }, 1800);
            return;
          }

          // Si requiere confirmación del usuario
          const dismissedVersion = sessionStorage.getItem('klikpos_dismissed_update');
          if (dismissedVersion !== m.version || m.mandatory) {
            setManifest(m);
            setIsOpen(true);
          }
        }
      }
    }, 3000);

    // 3. Programador a hora fija (por defecto 00:00 medianoche)
    const intervalScheduler = setInterval(async () => {
      const cfg = updateService.getConfig();
      if (!cfg.scheduledCheckEnabled || !navigator.onLine) return;

      const now = new Date();
      const currentHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const targetTime = cfg.scheduledTime || '00:00';
      const todayDate = now.toISOString().split('T')[0];
      const checkKey = `${todayDate}_${targetTime}`;

      if (currentHHmm === targetTime && lastScheduledCheckRef.current !== checkKey) {
        lastScheduledCheckRef.current = checkKey;
        console.log(`[KlikPOS Scheduler] Ejecutando verificación programada (${targetTime})...`);
        const res = await updateService.checkForUpdates();
        if (res.hasUpdate && res.latestManifest) {
          if (cfg.autoApplySilently) {
            console.log(`[KlikPOS Scheduler] Aplicando actualización programada silenciosa v${res.latestManifest.version}...`);
            updateService.applyPwaUpdate();
          } else {
            setManifest(res.latestManifest);
            setIsOpen(true);
          }
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener('venematic:check_updates', handleManualCheck);
      clearTimeout(startupTimer);
      clearInterval(intervalScheduler);
    };
  }, []);

  // Notificación flotante para actualizaciones silenciosas automáticas
  if (silentNotice) {
    return (
      <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white border border-emerald-500/50 shadow-2xl rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />
        <div>
          <p className="text-xs font-black text-emerald-400">Actualización en Curso</p>
          <p className="text-[11.5px] text-slate-200">{silentNotice}</p>
        </div>
      </div>
    );
  }

  if (!isOpen || !manifest) return null;

  // Actualización rápida en vivo estilo PWA (1 solo clic)
  const handleApplyPwa = () => {
    setIsUpdating(true);
    setUpdateMessage('⚡ Purgando caché y sincronizando con la última versión...');
    setTimeout(() => {
      updateService.applyPwaUpdate();
    }, 800);
  };

  // Descarga manual del ejecutable (.exe)
  const handleDownloadExe = () => {
    const res = updateService.downloadInstaller(manifest);
    setUpdateMessage(res.message);
    if (res.downloadUrl) {
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    }
  };

  const handleDismiss = () => {
    if (manifest.mandatory) {
      alert('Esta actualización es obligatoria para garantizar la integridad fiscal y del inventario.');
      return;
    }
    sessionStorage.setItem('klikpos_dismissed_update', manifest.version);
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Cabecera con degradado tecnológico */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 p-6 text-white relative">
          {!manifest.mandatory && (
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Recordar más tarde"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                ¡Nueva Versión Disponible!
              </span>
              <h2 className="text-xl font-black tracking-tight text-white mt-0.5">
                KlikPOS Enterprise v{manifest.version}
              </h2>
            </div>
          </div>
          <p className="text-xs text-emerald-100 font-medium">
            Fecha de Publicación: {manifest.releaseDate || 'Reciente'} · Versión Actual: v{CURRENT_VERSION}
          </p>
        </div>

        {/* Contenido con Notas de la Versión */}
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Novedades y Mejoras Incluidas:
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2">
              {manifest.notes && manifest.notes.length > 0 ? (
                manifest.notes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{note}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Optimizaciones generales de estabilidad y rendimiento.</p>
              )}
            </div>
          </div>

          <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl p-3 text-xs text-sky-800 dark:text-sky-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span>
              <b>Garantía de Datos:</b> La actualización conserva íntegramente tus productos, clientes, ventas históricas y turnos de caja sin interrupción.
            </span>
          </div>

          {updateMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
              <span>{updateMessage}</span>
            </div>
          )}

          {/* Opciones de Actualización */}
          <div className="pt-2 flex flex-col gap-2.5">
            {/* Opción 1: Actualización Rápida en Vivo PWA */}
            <button
              type="button"
              onClick={handleApplyPwa}
              disabled={isUpdating}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2.5 shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Aplicando Actualización en Vivo...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Actualización Rápida en Vivo (Recomendado - 1 Clic)</span>
                </>
              )}
            </button>

            {/* Fila secundaria: Descarga manual de .exe y posponer */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleDownloadExe}
                disabled={isUpdating}
                className="text-[11.5px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Descargar instalador para guardar en USB o instalar fuera de línea"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Descargar Instalador .exe (Uso Offline)</span>
              </button>

              {!manifest.mandatory && (
                <button
                  type="button"
                  onClick={handleDismiss}
                  disabled={isUpdating}
                  className="text-[11.5px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Recordar Más Tarde
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
