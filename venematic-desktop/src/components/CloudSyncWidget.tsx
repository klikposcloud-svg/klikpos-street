'use client';

import React, { useState, useEffect } from 'react';
import {
  cloudSyncService,
  CloudSyncStatus,
} from '@/lib/firebase/cloud-sync-service';
import {
  isFirebaseConfigured,
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
} from '@/lib/firebase/config';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Settings2,
  X,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink,
} from 'lucide-react';

export default function CloudSyncWidget() {
  const [status, setStatus] = useState<CloudSyncStatus>({
    state: 'unconfigured',
    pendingSales: 0,
    lastSyncAt: null,
    storeId: 'tienda_principal',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [jsonConfigInput, setJsonConfigInput] = useState('');
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);
  const [configErrorMsg, setConfigErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Suscribirse a cambios de estado
    const unsubscribe = cloudSyncService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Iniciar sincronización en segundo plano si está configurado
    if (isFirebaseConfigured()) {
      cloudSyncService.startAutoSync(30);
    }

    return () => {
      unsubscribe();
      cloudSyncService.stopAutoSync();
    };
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await cloudSyncService.syncAll();
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleSaveJsonConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSuccessMsg(null);
    setConfigErrorMsg(null);

    try {
      let parsed: any;
      if (jsonConfigInput.trim().startsWith('{')) {
        parsed = JSON.parse(jsonConfigInput.trim());
      } else {
        // Formato variable o clave simple
        throw new Error('Pegue el objeto JSON que entrega la consola de Firebase.');
      }

      if (!parsed.projectId || !parsed.apiKey) {
        throw new Error('El objeto JSON debe contener al menos "projectId" y "apiKey".');
      }

      saveCustomFirebaseConfig({
        apiKey: parsed.apiKey,
        authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
        projectId: parsed.projectId,
        storageBucket: parsed.storageBucket || `${parsed.projectId}.appspot.com`,
        messagingSenderId: parsed.messagingSenderId || '000000000000',
        appId: parsed.appId || '1:000000000000:web:000000000000',
      });

      setConfigSuccessMsg('✓ Credenciales de Firebase guardadas correctamente.');
      cloudSyncService.syncAll();
      setTimeout(() => setConfigSuccessMsg(null), 3500);
    } catch (err: any) {
      setConfigErrorMsg(err?.message || 'Error analizando la configuración.');
    }
  };

  const handleResetConfig = () => {
    if (confirm('¿Desea restablecer la configuración de Firebase a los valores por defecto?')) {
      clearCustomFirebaseConfig();
      setJsonConfigInput('');
      setConfigSuccessMsg('Configuración restablecida.');
      setTimeout(() => setConfigSuccessMsg(null), 2500);
    }
  };

  // Renderizar la píldora compacta de estado
  const renderBadge = () => {
    switch (status.state) {
      case 'synced':
        return (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-all text-xs font-semibold shadow-2xs"
            title="Nube Firestore sincronizada"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Nube Sincronizada</span>
          </button>
        );
      case 'syncing':
        return (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-300 text-indigo-700 hover:bg-indigo-100 transition-all text-xs font-semibold shadow-2xs"
            title="Sincronizando con Firestore..."
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            <span className="hidden sm:inline">Sincronizando...</span>
          </button>
        );
      case 'offline':
        return (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 transition-all text-xs font-semibold shadow-2xs"
            title="Sin conexión a internet (Modo local seguro activo)"
          >
            <CloudOff className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Modo Local (Offline)</span>
          </button>
        );
      case 'error':
        return (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 transition-all text-xs font-semibold shadow-2xs"
            title={status.errorMessage || 'Error en sincronización'}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Error Nube</span>
          </button>
        );
      case 'unconfigured':
      default:
        return (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-600 hover:bg-slate-200 transition-all text-xs font-medium"
            title="Conectar con Google Cloud Firestore"
          >
            <Cloud className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Conectar Nube</span>
          </button>
        );
    }
  };

  return (
    <>
      {renderBadge()}

      {/* Modal de Control y Configuración de Firestore */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Cabecera */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <span>Google Cloud Firestore</span>
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-mono border border-indigo-400/20">
                      Sync v2.0
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sincronización en tiempo real y respaldo continuo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Tarjeta de Estado */}
              <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Estado de la Conexión
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {status.state === 'synced' && '✅ En Línea y Sincronizado'}
                    {status.state === 'syncing' && '🔄 Sincronizando datos...'}
                    {status.state === 'offline' && '⚠️ Sin Conexión (Modo Local Activo)'}
                    {status.state === 'unconfigured' && '⚙️ Pendiente por Configurar'}
                    {status.state === 'error' && '❌ Error de Conexión'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500">Tienda / ID:</span>
                    <p className="font-semibold text-slate-800 font-mono mt-0.5">
                      {status.storeId}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Último Respaldo:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {status.lastSyncAt
                        ? new Date(status.lastSyncAt).toLocaleTimeString()
                        : 'Aún no sincronizado'}
                    </p>
                  </div>
                </div>

                {isFirebaseConfigured() && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleManualSync}
                      disabled={isManualSyncing}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                      <span>{isManualSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Formulario de Configuración de Firebase Console */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Credenciales de Firebase Console</span>
                  </h4>
                  {isFirebaseConfigured() && (
                    <button
                      type="button"
                      onClick={handleResetConfig}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Restablecer
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Para conectar esta terminal a tu base de datos en la nube, ve a{' '}
                  <span className="font-semibold text-slate-800">Firebase Console ➔ Configuración del Proyecto ➔ General</span>,
                  copia el objeto <code className="bg-slate-100 text-indigo-600 px-1 py-0.5 rounded text-[11px]">firebaseConfig</code> y pégalo abajo:
                </p>

                <form onSubmit={handleSaveJsonConfig} className="space-y-3">
                  <textarea
                    rows={6}
                    value={jsonConfigInput}
                    onChange={(e) => setJsonConfigInput(e.target.value)}
                    placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "tu-tienda.firebaseapp.com",\n  "projectId": "tu-proyecto-id",\n  "storageBucket": "tu-tienda.appspot.com",\n  "messagingSenderId": "1234567890",\n  "appId": "1:1234567890:web:abcdef"\n}`}
                    className="w-full text-xs font-mono p-3 bg-slate-900 text-emerald-400 rounded-2xl border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-500"
                  />

                  {configSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{configSuccessMsg}</span>
                    </div>
                  )}

                  {configErrorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{configErrorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Guardar y Conectar Base de Datos Cloud</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Pie */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
              <span className="text-[11px] text-slate-500">
                Arquitectura Offline-First: las ventas se registran localmente y se respaldan en la nube automáticamente.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
