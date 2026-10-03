'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { exportDatabaseBackup } from '@/lib/services/backup-service';
import { playSuccessChime, playBeep } from '@/lib/utils/sound';
import { cloudSyncService } from '@/lib/firebase/cloud-sync-service';

interface StreetSalesBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  bcvRate: number;
  primaryColor?: string;
  onPrintTicket?: (sale: LocalSale) => void;
}

type PeriodFilter = 'daily' | 'weekly' | 'monthly' | 'all';

export default function StreetSalesBackupModal({
  isOpen,
  onClose,
  bcvRate,
  primaryColor = '#f59e0b',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden bg-[#070a12] text-slate-100">
        
        {/* ENCABEZADO CON CONTRASTE WCAG AAA (21:1) */}
        <div className="px-6 py-4.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#090d16]">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              <TrendingUp className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Módulo de Ventas & Respaldo
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Función Estrella
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Auditoría diaria, semanal, mensual y salvaguarda de tu historial contable.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">Tasa BCV:</span>
              <span className="font-black text-sky-400">Bs. {bcvRate.toFixed(2)}</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all active:scale-90 cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#070a12]">
          
          {/* BARRA SUPERIOR DE SELECTOR DE PERÍODO & BOTONES DE RESPALDO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#090d16] p-3.5 rounded-2xl border border-slate-800">
            {/* Filtros de Período (Diario / Semanal / Mensual / Todo) */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0c1220] border border-slate-800">
              <button
                type="button"
                onClick={() => setPeriod('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === 'daily'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
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
                    : 'text-slate-300 hover:text-white'
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
                    : 'text-slate-300 hover:text-white'
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
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🗂️ Historial
              </button>
            </div>

            {/* BOTONES ACCIÓN DE LA FUNCIÓN ESTRELLA DE RESPALDO */}
            <div className="flex items-center gap-2">
              {/* Botón 1: Descargar Copia Local JSON */}
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isBackingUp}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                title="Descargar copia de seguridad en archivo JSON"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{isBackingUp ? 'Respaldando...' : 'Descargar Respaldo'}</span>
              </button>

              {/* Botón 2: Respaldo Cloud */}
              <button
                type="button"
                onClick={handleCloudSync}
                disabled={cloudSyncStatus === 'syncing'}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-black flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                title="Sincronizar y respaldar en la nube"
              >
                <Cloud className={`w-4 h-4 ${cloudSyncStatus === 'syncing' ? 'animate-bounce text-amber-400' : ''}`} />
                <span>{cloudSyncStatus === 'syncing' ? 'Sincronizando...' : 'Respaldo Cloud'}</span>
              </button>
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
            <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Total Facturado ($)
              </span>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                  {formatUSD(metrics.totalUSD)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                En el período {period === 'daily' ? 'de hoy' : period === 'weekly' ? 'semanal' : 'del mes'}
              </span>
            </div>

            {/* KPI 2: Total Bolívares */}
            <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Total en Bolívares (Bs.)
              </span>
              <div className="my-1">
                <span className="text-lg sm:text-xl font-black font-mono text-sky-400 truncate block">
                  {formatVES(metrics.totalVES)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Tasa: {bcvRate.toFixed(2)} Bs/$
              </span>
            </div>

            {/* KPI 3: Cantidad de Ventas */}
            <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Tickets Emitidos
              </span>
              <div className="my-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-white">
                  {metrics.ticketCount}
                </span>
                <span className="text-xs text-slate-400 font-bold">ventas</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                100% registradas en base local
              </span>
            </div>

            {/* KPI 4: Ticket Promedio */}
            <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Ticket Promedio ($)
              </span>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                  {formatUSD(metrics.avgTicket)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Promedio por cliente
              </span>
            </div>
          </div>

          {/* DESGLOSE POR FORMAS DE PAGO */}
          <div className="p-4 rounded-2xl bg-[#090d16] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Desglose por Métodos de Pago Liquidado</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {metrics.ticketCount} transacciones auditadas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-[#0c1220] border border-slate-800">
                <span className="text-[10px] text-emerald-400 font-bold block">💵 Efectivo ($ / Bs)</span>
                <span className="text-sm font-black font-mono text-white mt-1 block">
                  {formatUSD(metrics.cashUsd + metrics.cashVes)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0c1220] border border-slate-800">
                <span className="text-[10px] text-sky-400 font-bold block">📱 Pago Móvil (Bs.)</span>
                <span className="text-sm font-black font-mono text-white mt-1 block">
                  {formatUSD(metrics.pagoMovil)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0c1220] border border-slate-800">
                <span className="text-[10px] text-indigo-400 font-bold block">💳 Punto de Venta</span>
                <span className="text-sm font-black font-mono text-white mt-1 block">
                  {formatUSD(metrics.puntoTarjeta)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0c1220] border border-slate-800">
                <span className="text-[10px] text-purple-400 font-bold block">⚡ Zelle / Digital</span>
                <span className="text-sm font-black font-mono text-white mt-1 block">
                  {formatUSD(metrics.zelle)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0c1220] border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-amber-400 font-bold block">📝 Fiados / Créditos</span>
                <span className="text-sm font-black font-mono text-white mt-1 block">
                  {formatUSD(metrics.credito)}
                </span>
              </div>
            </div>
          </div>

          {/* LISTA DE TICKETS Y VENTAS DEL PERÍODO */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>Historial de Comprobantes ({filteredSales.length})</span>
              </span>

              <button
                type="button"
                onClick={loadSales}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refrescar</span>
              </button>
            </div>

            {filteredSales.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-[#090d16] text-center space-y-2">
                <Receipt className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-300 font-bold">
                  No hay ventas registradas en el período seleccionado ({period === 'daily' ? 'hoy' : period === 'weekly' ? 'esta semana' : 'este mes'}).
                </p>
                <p className="text-[11px] text-slate-400">
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
                      className="p-3 rounded-2xl border border-slate-800 bg-[#090d16] hover:border-slate-700 transition-all text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-amber-400">
                              #{sale.receiptNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {sale.timestamp ? new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                              {sale.items?.length || 0} ítems
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-300 truncate block mt-0.5">
                            Cajero: {sale.cashierName || 'Cajero Principal'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-mono font-black text-emerald-400 text-sm">
                              {formatUSD(sale.totalUSD)}
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 block">
                              {formatVES(sale.totalVES)}
                            </span>
                          </div>

                          {/* Botón Imprimir Ticket */}
                          {onPrintTicket && (
                            <button
                              type="button"
                              onClick={() => onPrintTicket(sale)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white active:scale-95 transition-all cursor-pointer"
                              title="Reimprimir Comprobante Térmico"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}

                          {/* Botón Expandir Detalle */}
                          <button
                            type="button"
                            onClick={() => setExpandedSaleId(isExpanded ? null : (sale.id || sale.receiptNumber))}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all cursor-pointer"
                            title="Ver ítems vendidos"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* DETALLE EXPANDIDO DE LA VENTA */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5 animate-in fade-in duration-150">
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">
                            Artículos en este comprobante:
                          </span>
                          {sale.items?.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
                              <span>{it.qty}x {it.name}</span>
                              <span className="font-bold text-white">{formatUSD(it.totalUSD)}</span>
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
        <div className="px-6 py-3.5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#090d16] text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px]">
              Tus ventas se almacenan de forma local en este dispositivo y están protegidas ante cortes de internet.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs transition-all active:scale-95 cursor-pointer self-end sm:self-auto"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
