'use client';

import React, { useState, useEffect } from 'react';
import {
  cloudSyncService,
  CloudSyncStatus,
} from '@/lib/firebase/cloud-sync-service';
import {
  isFirebaseConfigured,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  getActiveFirebaseConfig,
} from '@/lib/firebase/config';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  DownloadCloud,
} from 'lucide-react';

export default function CloudSyncSettingsCard() {
  const [status, setStatus] = useState<CloudSyncStatus>({
    state: 'unconfigured',
    pendingSales: 0,
    lastSyncAt: null,
    storeId: 'tienda_principal',
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [showConfigBox, setShowConfigBox] = useState(false);
  const [jsonConfig, setJsonConfig] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = cloudSyncService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsub();
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await cloudSyncService.syncAll();
      setSyncResult(
        `✓ Sincronización exitosa: ${res.sales} ventas enviadas, ${res.productsUploaded} productos respaldados en la nube.`
      );
      setTimeout(() => setSyncResult(null), 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error en sincronización');
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const parsed = JSON.parse(jsonConfig.trim());
      if (!parsed.projectId || !parsed.apiKey) {
        throw new Error('El JSON debe contener "projectId" y "apiKey".');
      }

      saveCustomFirebaseConfig({
        apiKey: parsed.apiKey,
        authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
        projectId: parsed.projectId,
        storageBucket: parsed.storageBucket || `${parsed.projectId}.appspot.com`,
        messagingSenderId: parsed.messagingSenderId || '000000000000',
        appId: parsed.appId || '1:000000000000:web:000000000000',
      });

      setShowConfigBox(false);
      setSyncResult('✓ Credenciales de Firebase guardadas. Conectando...');
      cloudSyncService.syncAll();
      setTimeout(() => setSyncResult(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error en formato JSON');
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          <span>Sincronización en la Nube (Google Cloud Firestore)</span>
        </h3>
        <span
          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
            status.state === 'synced'
              ? 'bg-emerald-100 text-emerald-800'
              : status.state === 'syncing'
              ? 'bg-indigo-100 text-indigo-800'
              : status.state === 'offline'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {status.state === 'synced' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          {status.state === 'syncing' && <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />}
          {status.state === 'offline' && <CloudOff className="w-3.5 h-3.5 text-amber-600" />}
          {status.state === 'unconfigured' && <Cloud className="w-3.5 h-3.5 text-slate-500" />}
          <span>
            {status.state === 'synced' && 'Nube Sincronizada'}
            {status.state === 'syncing' && 'Sincronizando...'}
            {status.state === 'offline' && 'Modo Local (Offline)'}
            {status.state === 'unconfigured' && 'No Configurado'}
            {status.state === 'error' && 'Error de Conexión'}
          </span>
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Respalda automáticamente todas las ventas y el catálogo de productos en tu proyecto de{' '}
        <strong>Google Cloud Firestore</strong>. Permite al dueño consultar ventas desde su celular y alimentar la tienda web y app de delivery.
      </p>

      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
        <div>
          <span className="text-slate-500">ID de Tienda en la Nube:</span>
          <p className="font-mono font-bold text-slate-800 mt-0.5">{status.storeId}</p>
        </div>
        <div>
          <span className="text-slate-500">Última Sincronización:</span>
          <p className="font-semibold text-slate-800 mt-0.5">
            {status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'Pendiente'}
          </p>
        </div>
      </div>

      {syncResult && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncResult}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={handleSyncNow}
          disabled={isSyncing || !isFirebaseConfigured()}
          className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
        >
          <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
          <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar con la Nube Ahora'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowConfigBox(!showConfigBox)}
          className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs transition-colors"
        >
          {showConfigBox ? 'Ocultar Credenciales' : 'Configurar Firebase'}
        </button>
      </div>

      {showConfigBox && (
        <form onSubmit={handleSaveConfig} className="space-y-3 pt-2 border-t border-slate-200">
          <label className="block text-xs font-semibold text-slate-700">
            Pega aquí el objeto JSON de tu app web en Firebase Console:
          </label>
          <textarea
            rows={5}
            value={jsonConfig}
            onChange={(e) => setJsonConfig(e.target.value)}
            placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "tu-tienda.firebaseapp.com",\n  "projectId": "tu-proyecto-id",\n  "storageBucket": "tu-tienda.appspot.com",\n  "messagingSenderId": "1234567890",\n  "appId": "1:1234567890:web:abcdef"\n}`}
            className="w-full text-xs font-mono p-2.5 bg-slate-900 text-emerald-400 rounded-lg border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-hidden placeholder-slate-600"
          />
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                clearCustomFirebaseConfig();
                setJsonConfig('');
                alert('Credenciales restablecidas.');
              }}
              className="text-xs text-rose-600 hover:underline font-semibold"
            >
              Restablecer
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              Guardar Credenciales Cloud
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
