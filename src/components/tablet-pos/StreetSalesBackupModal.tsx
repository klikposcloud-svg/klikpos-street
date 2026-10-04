'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  TrendingUp,
  Calendar,
  Download,
  Upload,
  Cloud,
  RefreshCw,
  Receipt,
  DollarSign,
  Smartphone,
  CreditCard,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Layers,
  Database
} from 'lucide-react';
import { db, LocalSale } from '@/lib/db';
import { formatUSD, formatVES } from '@/lib/formatters';
import { exportDatabaseBackup, importDatabaseBackup } from '@/lib/services/backup-service';
import { playSuccessChime, playBeep } from '@/lib/utils/sound';
import { cloudSyncService } from '@/lib/firebase/cloud-sync-service';

interface StreetSalesBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  bcvRate: number;
  primaryColor?: string;
  isLight?: boolean;
  onPrintTicket?: (sale: LocalSale) => void;
}

type PeriodFilter = 'daily' | 'weekly' | 'monthly' | 'all';

export default function StreetSalesBackupModal({
  isOpen,
  onClose,
  bcvRate,
  primaryColor = '#f59e0b',
  isLight = false,
  onPrintTicket
}: StreetSalesBackupModalProps) {
  const [sales, setSales] = useState<LocalSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('daily');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStatusMsg, setBackupStatusMsg] = useState<string | null>(null);
  const [expandedSaleId, setExpandedSaleId] = useState<number | string | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  // Cargar ventas de IndexedDB / Dexie
  const loadSales = async () => {
    setIsLoading(true);
    try {
      const allSales = await db.sales.orderBy('id').reverse().toArray();
      setSales(allSales);
    } catch (err) {
      console.error('Error cargando ventas en modal Street:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSales();
    }
  }, [isOpen]);

  // Filtrar ventas por período
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return sales.filter((sale) => {
      if (sale.status === 'voided') return false; // Excluir anuladas del resumen activo
      const saleDate = sale.timestamp ? new Date(sale.timestamp) : new Date();

      if (period === 'daily') {
        const saleDateStr = sale.timestamp?.slice(0, 10);
        return saleDateStr === todayStr;
      } else if (period === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return saleDate >= weekAgo;
      } else if (period === 'monthly') {
        return (
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear()
        );
      }
      return true; // 'all'
    });
  }, [sales, period]);

  // Totales y Métricas del período
  const metrics = useMemo(() => {
    let totalUSD = 0;
    let totalVES = 0;
    let cashUsd = 0;
    let cashVes = 0;
    let pagoMovil = 0;
    let puntoTarjeta = 0;
    let zelle = 0;
    let credito = 0;

    for (const s of filteredSales) {
      totalUSD += s.totalUSD || 0;
      totalVES += s.totalVES || (s.totalUSD ? s.totalUSD * (s.bcvRate || bcvRate) : 0);

      if (s.payments && Array.isArray(s.payments)) {
        for (const p of s.payments) {
          if (p.method === 'cash_usd') cashUsd += p.amountUSD || 0;
          else if (p.method === 'cash_ves') cashVes += p.amountUSD || (p.amountVES / (s.bcvRate || bcvRate));
          else if (p.method === 'pago_movil') pagoMovil += p.amountUSD || (p.amountVES / (s.bcvRate || bcvRate));
          else if (p.method === 'card_debit' || p.method === 'card_credit') puntoTarjeta += p.amountUSD || (p.amountVES / (s.bcvRate || bcvRate));
          else if (p.method === 'zelle') zelle += p.amountUSD || 0;
          else if (p.method === 'credit') credito += p.amountUSD || 0;
        }
      } else {
        cashUsd += s.totalUSD || 0;
      }
    }

    const ticketCount = filteredSales.length;
    const avgTicket = ticketCount > 0 ? totalUSD / ticketCount : 0;

    return {
      totalUSD,
      totalVES,
      ticketCount,
      avgTicket,
      cashUsd,
      cashVes,
      pagoMovil,
      puntoTarjeta,
      zelle,
      credito
    };
  }, [filteredSales, bcvRate]);

  // FUNCIÓN ESTRELLA DE RESPALDO: Exportar respaldo JSON local seguro
  const handleExportBackup = async () => {
    setIsBackingUp(true);
    setBackupStatusMsg(null);
    try {
      playSuccessChime();
      const ok = await exportDatabaseBackup('street_ventas');
      if (ok) {
        setBackupStatusMsg('¡Respaldo JSON generado y descargado con éxito!');
      } else {
        setBackupStatusMsg('Aviso: No se pudo generar el archivo de respaldo.');
      }
    } catch (e: any) {
      setBackupStatusMsg(`Error al respaldar: ${e?.message || 'Error desconocido'}`);
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setBackupStatusMsg(null), 5000);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // FUNCIÓN DE RESTAURACIÓN: Importar respaldo JSON local a IndexedDB
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsBackingUp(true);
    setBackupStatusMsg('Leyendo archivo y restaurando ventas y datos...');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await importDatabaseBackup(data);
      if (res.success) {
        playSuccessChime();
        setBackupStatusMsg('✅ ¡Respaldo restaurado con éxito! Todas tus ventas y catálogo han sido recuperados.');
        await loadSales();
      } else {
        playBeep();
        setBackupStatusMsg(`⚠️ Error al restaurar: ${res.message}`);
      }
    } catch (err: any) {
      playBeep();
      setBackupStatusMsg(`⚠️ Archivo inválido: ${err?.message || 'No se pudo leer el archivo JSON'}`);
    } finally {
      setIsBackingUp(false);
      if (e.target) e.target.value = '';
      setTimeout(() => setBackupStatusMsg(null), 6000);
    }
  };

  // Respaldo en la nube / Sincronización silenciosa con Firestore
  const handleCloudSync = async () => {
    setCloudSyncStatus('syncing');
    setBackupStatusMsg('Conectando con Firestore y respaldando datos...');
    try {
      const result = await cloudSyncService.syncAll();
      playSuccessChime();
      setCloudSyncStatus('synced');
      setBackupStatusMsg(`¡Sincronización Cloud Exitosa! ${result.sales} ventas y ${result.productsUploaded} productos respaldados en Firestore.`);
    } catch (err: any) {
      console.warn('[StreetBackup] Error en sync cloud:', err);
      setCloudSyncStatus('idle');
      setBackupStatusMsg('Aviso: Operando en modo Offline. Los datos están 100% seguros localmente.');
    } finally {
      setTimeout(() => {
        setCloudSyncStatus('idle');
        setBackupStatusMsg(null);
      }, 5000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md select-none">
      <div 
        data-street-modal="true"
        className="relative w-full max-w-4xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: isLight ? '#f8fafc' : '#070a12',
          borderColor: isLight ? '#cbd5e1' : '#1e293b',
          color: isLight ? '#0f172a' : '#f8fafc'
        }}
      >
        
        {/* ENCABEZADO CON CONTRASTE WCAG AAA (21:1) */}
        <div 
          className="px-6 py-4.5 border-b flex items-center justify-between shrink-0"
          style={{
            backgroundColor: isLight ? '#ffffff' : '#090d16',
            borderColor: isLight ? '#e2e8f0' : '#1e293b',
            color: isLight ? '#0f172a' : '#ffffff'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              <TrendingUp className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Módulo de Ventas & Respaldo
              </h2>
              <p className={`text-xs font-medium mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Auditoría diaria, semanal, mensual y salvaguarda de tu historial contable.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div 
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs"
              style={{
                backgroundColor: isLight ? '#f1f5f9' : '#0f172a',
                borderColor: isLight ? '#cbd5e1' : '#1e293b'
              }}
            >
              <span className={isLight ? 'text-slate-500 font-bold' : 'text-slate-400'}>Tasa BCV:</span>
              <span className={`font-black ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>Bs. {bcvRate.toFixed(2)}</span>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all active:scale-90 cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title="Cerrar ventana"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div 
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5"
          style={{
            backgroundColor: isLight ? '#f8fafc' : '#070a12',
            color: isLight ? '#0f172a' : '#ffffff'
          }}
        >
          
          {/* BARRA SUPERIOR DE SELECTOR DE PERÍODO & BOTONES DE RESPALDO */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#090d16] border-slate-800'
          }`}>
            {/* Filtros de Período (Diario / Semanal / Mensual / Todo) */}
            <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0c1220] border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => setPeriod('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === 'daily'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
                }`}
              >
                📅 Diario (Hoy)
              </button>
              <button
                type="button"
                onClick={() => setPeriod('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === 'weekly'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
                }`}
              >
                📊 Semanal (7d)
              </button>
              <button
                type="button"
                onClick={() => setPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === 'monthly'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
                }`}
              >
                📈 Mensual ({new Date().toLocaleString('es-VE', { month: 'short' }).toUpperCase()})
              </button>
              <button
                type="button"
                onClick={() => setPeriod('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === 'all'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
                }`}
              >
                🗂️ Historial
              </button>
            </div>

            {/* BOTONES ACCIÓN DE LA FUNCIÓN ESTRELLA DE RESPALDO */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Botón 1: Descargar Copia Local JSON */}
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isBackingUp}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                title="Descargar copia de seguridad en archivo JSON (se guarda en tu carpeta Descargas)"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isBackingUp ? 'Respaldando...' : 'Descargar'}</span>
              </button>

              {/* Input y Botón 2: Subir / Restaurar Copia JSON */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json,application/json"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBackingUp}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
                title="Buscar y subir archivo JSON de respaldo desde tu carpeta de Descargas para restaurar ventas"
              >
                <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Subir / Restaurar</span>
              </button>

              {/* Botón 3: Respaldo Cloud */}
              <button
                type="button"
                onClick={handleCloudSync}
                disabled={cloudSyncStatus === 'syncing'}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-sky-700 border border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700'
                }`}
                title="Sincronizar y respaldar en la nube"
              >
                <Cloud className={`w-3.5 h-3.5 ${cloudSyncStatus === 'syncing' ? 'animate-bounce text-amber-400' : ''}`} />
                <span>{cloudSyncStatus === 'syncing' ? 'Sincronizando...' : 'Cloud'}</span>
              </button>
            </div>
          </div>

          {/* GUÍA RÁPIDA DE RESPALDOS LOCALES */}
          <div 
            className="p-3 rounded-2xl border text-xs flex items-center gap-2.5 shadow-2xs"
            style={{
              backgroundColor: isLight ? '#f1f5f9' : '#0c1220',
              borderColor: isLight ? '#cbd5e1' : '#1e293b',
              color: isLight ? '#334155' : '#94a3b8'
            }}
          >
            <Database className="w-4 h-4 text-sky-500 shrink-0" />
            <div className="leading-tight">
              <span className="font-bold text-slate-800 dark:text-slate-200">¿Dónde se guarda?</span> Al presionar <strong className="text-emerald-600 dark:text-emerald-400 font-black">Descargar</strong>, el archivo JSON se almacena automáticamente en tu carpeta <strong className="text-sky-600 dark:text-sky-400">Descargas (Downloads)</strong>. Para restaurar en otra tablet o PC, presiona <strong className="font-black text-slate-900 dark:text-white">Subir / Restaurar</strong> y selecciónalo allí.
            </div>
          </div>

          {/* MENSAJE DE FEEDBACK DE RESPALDO */}
          {backupStatusMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{backupStatusMsg}</span>
            </div>
          )}

          {/* CUADRÍCULA DE MÉTRICAS (KPIS) DE ALTO IMPACTO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* KPI 1: Total USD */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0c1220] border-slate-800'
            }`}>
              <span className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Total Facturado ($)
              </span>
              <div className="my-1">
                <span className={`text-xl sm:text-2xl font-black font-mono ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                  {formatUSD(metrics.totalUSD)}
                </span>
              </div>
              <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                En el período {period === 'daily' ? 'de hoy' : period === 'weekly' ? 'semanal' : 'del mes'}
              </span>
            </div>

            {/* KPI 2: Total Bolívares */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0c1220] border-slate-800'
            }`}>
              <span className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Total en Bolívares (Bs.)
              </span>
              <div className="my-1">
                <span className={`text-lg sm:text-xl font-black font-mono truncate block ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>
                  {formatVES(metrics.totalVES)}
                </span>
              </div>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500 font-bold' : 'text-slate-400'}`}>
                Tasa: {bcvRate.toFixed(2)} Bs/$
              </span>
            </div>

            {/* KPI 3: Cantidad de Ventas */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0c1220] border-slate-800'
            }`}>
              <span className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Tickets Emitidos
              </span>
              <div className="my-1 flex items-baseline gap-1.5">
                <span className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {metrics.ticketCount}
                </span>
                <span className={`text-xs font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>ventas</span>
              </div>
              <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                100% registradas en base local
              </span>
            </div>

            {/* KPI 4: Ticket Promedio */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0c1220] border-slate-800'
            }`}>
              <span className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Ticket Promedio ($)
              </span>
              <div className="my-1">
                <span className={`text-xl sm:text-2xl font-black font-mono ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                  {formatUSD(metrics.avgTicket)}
                </span>
              </div>
              <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Promedio por cliente
              </span>
            </div>
          </div>

          {/* DESGLOSE POR FORMAS DE PAGO */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#090d16] border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-slate-200'
              }`}>
                <DollarSign className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                <span>Desglose por Métodos de Pago Liquidado</span>
              </span>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {metrics.ticketCount} transacciones auditadas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              <div className={`p-2.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1220] border-slate-800'
              }`}>
                <span className={`text-[10px] font-bold block ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>💵 Efectivo ($ / Bs)</span>
                <span className={`text-sm font-black font-mono mt-1 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {formatUSD(metrics.cashUsd + metrics.cashVes)}
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1220] border-slate-800'
              }`}>
                <span className={`text-[10px] font-bold block ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>📱 Pago Móvil (Bs.)</span>
                <span className={`text-sm font-black font-mono mt-1 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {formatUSD(metrics.pagoMovil)}
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1220] border-slate-800'
              }`}>
                <span className={`text-[10px] font-bold block ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}>💳 Punto de Venta</span>
                <span className={`text-sm font-black font-mono mt-1 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {formatUSD(metrics.puntoTarjeta)}
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1220] border-slate-800'
              }`}>
                <span className={`text-[10px] font-bold block ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>⚡ Zelle / Digital</span>
                <span className={`text-sm font-black font-mono mt-1 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {formatUSD(metrics.zelle)}
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border col-span-2 sm:col-span-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1220] border-slate-800'
              }`}>
                <span className={`text-[10px] font-bold block ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>📝 Fiados / Créditos</span>
                <span className={`text-sm font-black font-mono mt-1 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {formatUSD(metrics.credito)}
                </span>
              </div>
            </div>
          </div>

          {/* LISTA DE TICKETS Y VENTAS DEL PERÍODO */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-slate-900' : 'text-slate-200'
              }`}>
                <Receipt className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                <span>Historial de Comprobantes ({filteredSales.length})</span>
              </span>

              <button
                type="button"
                onClick={loadSales}
                className={`text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refrescar</span>
              </button>
            </div>

            {filteredSales.length === 0 ? (
              <div className={`p-8 rounded-2xl border border-dashed text-center space-y-2 ${
                isLight ? 'border-slate-300 bg-white text-slate-700' : 'border-slate-800 bg-[#090d16] text-slate-300'
              }`}>
                <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold">
                  No hay ventas registradas en el período seleccionado ({period === 'daily' ? 'hoy' : period === 'weekly' ? 'esta semana' : 'este mes'}).
                </p>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Las ventas cobradas desde el Punto de Venta aparecerán aquí automáticamente en tiempo real.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredSales.map((sale) => {
                  const isExpanded = expandedSaleId === (sale.id || sale.receiptNumber);

                  return (
                    <div
                      key={sale.id || sale.receiptNumber}
                      className={`p-3 rounded-2xl border transition-all text-xs ${
                        isLight
                          ? 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                          : 'border-slate-800 bg-[#090d16] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-black ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                              #{sale.receiptNumber}
                            </span>
                            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {sale.timestamp ? new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            <span className={`text-[10px] px-2 py-0.2 rounded-full font-mono ${
                              isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {sale.items?.length || 0} ítems
                            </span>
                          </div>
                          <span className={`text-[11px] truncate block mt-0.5 ${isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
                            Cajero: {sale.cashierName || 'Cajero Principal'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`font-mono font-black text-sm ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                              {formatUSD(sale.totalUSD)}
                            </div>
                            <span className={`font-mono text-[10px] block ${isLight ? 'text-slate-500 font-bold' : 'text-slate-400'}`}>
                              {formatVES(sale.totalVES)}
                            </span>
                          </div>

                          {/* Botón Imprimir Ticket */}
                          {onPrintTicket && (
                            <button
                              type="button"
                              onClick={() => onPrintTicket(sale)}
                              className={`p-2 rounded-xl active:scale-95 transition-all cursor-pointer ${
                                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-white'
                              }`}
                              title="Reimprimir Comprobante Térmico"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}

                          {/* Botón Expandir Detalle */}
                          <button
                            type="button"
                            onClick={() => setExpandedSaleId(isExpanded ? null : (sale.id || sale.receiptNumber))}
                            className={`p-2 rounded-xl active:scale-95 transition-all cursor-pointer ${
                              isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                            }`}
                            title="Ver ítems vendidos"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* DETALLE EXPANDIDO DE LA VENTA */}
                      {isExpanded && (
                        <div className={`mt-3 pt-3 border-t space-y-1.5 animate-in fade-in duration-150 ${
                          isLight ? 'border-slate-150' : 'border-slate-800'
                        }`}>
                          <span className={`text-[10px] uppercase font-black tracking-wider block mb-1 ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            Artículos en este comprobante:
                          </span>
                          {sale.items?.map((it, idx) => (
                            <div key={idx} className={`flex items-center justify-between text-[11px] font-mono ${
                              isLight ? 'text-slate-700' : 'text-slate-300'
                            }`}>
                              <span>{it.qty}x {it.name}</span>
                              <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatUSD(it.totalUSD)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* PIE DEL MODAL CON INDICADOR DE PROTECCIÓN */}
        <div className={`px-6 py-3.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
          isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#090d16] border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
            <span className="text-[11px]">
              Tus ventas se almacenan de forma local en este dispositivo y están protegidas ante cortes de internet.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 cursor-pointer self-end sm:self-auto ${
              isLight ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
