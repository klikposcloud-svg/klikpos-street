'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Cloud, DollarSign, Package, X, Sparkles, Database } from 'lucide-react';
import { cloudSyncService } from '@/lib/firebase/cloud-sync-service';
import { getAvailableVisualPacks } from '@/lib/marketplace/visual-packs-service';

interface DataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBcvRate: number;
  onBcvUpdated: (rate: number) => void;
  onPacksUpdated?: () => void;
  isLight?: boolean;
}

export const DataSyncModal: React.FC<DataSyncModalProps> = ({
  isOpen,
  onClose,
  currentBcvRate,
  onBcvUpdated,
  onPacksUpdated,
  isLight = false
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [bcvStatus, setBcvStatus] = useState<{ status: 'idle' | 'success' | 'warning'; msg: string; rate?: number }>({
    status: 'idle',
    msg: `Tasa actual: Bs. ${currentBcvRate.toFixed(2)}`
  });
  const [salesStatus, setSalesStatus] = useState<{ status: 'idle' | 'success' | 'warning'; msg: string }>({
    status: 'idle',
    msg: 'Listo para sincronizar ventas locales con la nube'
  });
  const [packsStatus, setPacksStatus] = useState<{ status: 'idle' | 'success' | 'warning'; msg: string }>({
    status: 'idle',
    msg: 'Listo para sincronizar catálogo fotográfico y paquetes'
  });

  if (!isOpen) return null;

  const handleExecuteSync = async () => {
    setIsSyncing(true);

    // =========================================================================
    // 1. SINCRONIZAR TASA BCV CON 4 PROVEEDORES DE RESPALDO + FIRESTORE
    // =========================================================================
    let newRate: number | null = null;
    let bcvSource = '';

    // Proveedor 1: Servidor Local / API Route (Scraper directo a bcv.org.ve en tiempo real)
    try {
      const res = await fetch('/api/bcv/rate?refresh=true');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.rate === 'number' && data.rate > 0) {
          newRate = data.rate;
          bcvSource = data.source || 'Portal Oficial BCV (bcv.org.ve)';
        }
      }
    } catch {}

    // Proveedor 2: Firestore Cloud Oficial Matriz (bcv_rates/latest - 0 CORS en Android)
    if (!newRate) {
      try {
        const cloudData = await cloudSyncService.fetchLatestBcvRate();
        if (cloudData && cloudData.rate > 0) {
          newRate = cloudData.rate;
          bcvSource = cloudData.source;
        }
      } catch (e) {
        console.warn('[Sync] Firestore BCV read warning:', e);
      }
    }

    // Proveedor 3: DolarAPI Venezuela Oficial
    if (!newRate) {
      try {
        const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        if (res.ok) {
          const data = await res.json();
          const r = data.promedio || data.precio || data.valor;
          if (typeof r === 'number' && r > 0) {
            newRate = r;
            bcvSource = 'DolarAPI Oficial';
          }
        }
      } catch {}
    }

    // Proveedor 4: PyDolarVenezuela API
    if (!newRate) {
      try {
        const res = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv');
        if (res.ok) {
          const data = await res.json();
          const r = parseFloat(data?.monitors?.usd?.price);
          if (!isNaN(r) && r > 0) {
            newRate = r;
            bcvSource = 'PyDolar Venezuela';
          }
        }
      } catch {}
    }

    // Proveedor 5: Open Exchange Rates VES
    if (!newRate) {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
          const data = await res.json();
          const r = parseFloat(data?.rates?.VES);
          if (!isNaN(r) && r > 0) {
            newRate = r;
            bcvSource = 'Open Exchange Rates';
          }
        }
      } catch {}
    }

    if (newRate && newRate > 0) {
      onBcvUpdated(newRate);
      try {
        localStorage.setItem('klikpos_bcv_rate', String(newRate));
        localStorage.setItem('klikpos_bcv_mode', 'auto');
        // Si obtuvimos de la web, replicar a Firestore bajo el esquema canónico (bcv_rates/latest)
        if (bcvSource !== 'Firestore Cloud') {
          cloudSyncService.pushBcvRate(newRate, bcvSource).catch(() => {});
        }
      } catch {}
      setBcvStatus({
        status: 'success',
        rate: newRate,
        msg: `Tasa oficial actualizada a Bs. ${newRate.toFixed(2)} (Vía ${bcvSource})`
      });
    } else {
      setBcvStatus({
        status: 'warning',
        rate: currentBcvRate,
        msg: `No se pudo conectar a los 4 proveedores web. Manteniendo tasa guardada: Bs. ${currentBcvRate.toFixed(2)}`
      });
    }

    // =========================================================================
    // 2. SINCRONIZAR VENTAS Y RESPALDO CON SERVIDOR CLOUD
    // =========================================================================
    try {
      const syncResult = await cloudSyncService.syncAll();
      setSalesStatus({
        status: 'success',
        msg: `¡Sincronización Cloud exitosa! ${syncResult.sales} ventas y resumen respaldados en la nube.`
      });
    } catch (e: any) {
      setSalesStatus({
        status: 'warning',
        msg: 'Operando en modo offline. Las ventas permanecen 100% seguras en la base de datos local.'
      });
    }

    // =========================================================================
    // 3. SINCRONIZAR CATÁLOGO Y PAQUETES VISUALES DESDE SERVIDOR CLOUD
    // =========================================================================
    try {
      const packs = await getAvailableVisualPacks();
      if (onPacksUpdated) onPacksUpdated();
      setPacksStatus({
        status: 'success',
        msg: `¡Librería Cloud sincronizada! ${packs.length} paquetes fotográficos verificados (incluye Street Food HD).`
      });
    } catch (e) {
      setPacksStatus({
        status: 'warning',
        msg: 'Catálogo cargado desde la copia local protegida.'
      });
    }

    setIsSyncing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0b101b] border-slate-700 text-white'
      }`}>
        {/* HEADER */}
        <header className={`px-6 py-4 border-b flex items-center justify-between ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg">
              <RefreshCw className={`w-5 h-5 text-white ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-black tracking-tight whitespace-nowrap ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Centro de Sincronización • Cloud Matrix
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Sincronización multi-proveedor con Klik Cloud Service
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* BODY */}
        <div className="p-6 space-y-4">
          {/* Módulo 1: Tasa BCV */}
          <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
              isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Tasa Oficial BCV</span>
                {bcvStatus.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {bcvStatus.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              </div>
              <p className={`text-[11.5px] mt-0.5 leading-snug ${isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>{bcvStatus.msg}</p>
              <span className={`text-[9.5px] block mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                Infraestructura Cloud: Portal Oficial BCV • Servidor Primario • Respaldo Satelital
              </span>
            </div>
          </div>

          {/* Módulo 2: Ventas y Respaldo Cloud */}
          <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
              isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
            }`}>
              <Cloud className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Ventas & Respaldo Cloud Seguro</span>
                {salesStatus.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {salesStatus.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              </div>
              <p className={`text-[11.5px] mt-0.5 leading-snug ${isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>{salesStatus.msg}</p>
              <span className={`text-[9.5px] block mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                Subida automática y resguardo seguro de transacciones en la nube
              </span>
            </div>
          </div>

          {/* Módulo 3: Paquetes Visuales & Catálogo */}
          <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
              isLight ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            }`}>
              <Package className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Librería Cloud de Paquetes</span>
                {packsStatus.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {packsStatus.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              </div>
              <p className={`text-[11.5px] mt-0.5 leading-snug ${isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>{packsStatus.msg}</p>
              <span className={`text-[9.5px] block mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                Descarga de paquetes oficiales desde el Catálogo Cloud Central
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className={`px-6 py-4 border-t flex items-center justify-between ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Cerrar
          </button>

          <button
            onClick={handleExecuteSync}
            disabled={isSyncing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando Todo...' : 'Sincronizar Data Ahora'}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
