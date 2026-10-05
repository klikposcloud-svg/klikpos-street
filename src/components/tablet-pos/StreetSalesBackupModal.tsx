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
  Database,
  BarChart3,
  Flame,
  Trophy,
  Zap,
  Sparkles,
  PieChart,
  ArrowUpRight,
  Bike,
  Store,
  Eye
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
  const [activeTab, setActiveTab] = useState<'metrics' | 'history' | 'backup'>('metrics');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStatusMsg, setBackupStatusMsg] = useState<string | null>(null);
  const [expandedSaleId, setExpandedSaleId] = useState<number | string | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'local' | 'delivery'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'pending'>('all');

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

    // Métricas dinámicas para el gráfico animado según el período
    let chartBars: { label: string; subLabel: string; amount: number; count: number; isPeak?: boolean }[] = [];

    if (period === 'daily') {
      const slots = [
        { label: 'Mañana', subLabel: '6am - 12pm', amount: 0, count: 0 },
        { label: 'Mediodía', subLabel: '12pm - 4pm', amount: 0, count: 0 },
        { label: 'Tarde', subLabel: '4pm - 8pm', amount: 0, count: 0 },
        { label: 'Noche', subLabel: '8pm - 6am', amount: 0, count: 0 }
      ];

      for (const s of filteredSales) {
        const d = s.timestamp ? new Date(s.timestamp) : new Date();
        const h = d.getHours();
        const val = s.totalUSD || 0;
        if (h >= 6 && h < 12) { slots[0].amount += val; slots[0].count++; }
        else if (h >= 12 && h < 16) { slots[1].amount += val; slots[1].count++; }
        else if (h >= 16 && h < 20) { slots[2].amount += val; slots[2].count++; }
        else { slots[3].amount += val; slots[3].count++; }
      }
      chartBars = slots;
    } else if (period === 'weekly') {
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const now = new Date();
      const last7: { label: string; subLabel: string; dateStr: string; amount: number; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().slice(0, 10);
        last7.push({
          label: days[d.getDay()],
          subLabel: `${d.getDate()}/${d.getMonth() + 1}`,
          dateStr,
          amount: 0,
          count: 0
        });
      }
      for (const s of filteredSales) {
        const sDateStr = (s.timestamp || '').slice(0, 10);
        const match = last7.find(item => item.dateStr === sDateStr);
        if (match) {
          match.amount += s.totalUSD || 0;
          match.count++;
        }
      }
      chartBars = last7;
    } else if (period === 'monthly') {
      const weeks = [
        { label: 'Sem 1', subLabel: 'Días 1-7', amount: 0, count: 0 },
        { label: 'Sem 2', subLabel: 'Días 8-14', amount: 0, count: 0 },
        { label: 'Sem 3', subLabel: 'Días 15-21', amount: 0, count: 0 },
        { label: 'Sem 4', subLabel: 'Días 22-fin', amount: 0, count: 0 }
      ];
      for (const s of filteredSales) {
        const d = s.timestamp ? new Date(s.timestamp) : new Date();
        const dom = d.getDate();
        const val = s.totalUSD || 0;
        if (dom <= 7) { weeks[0].amount += val; weeks[0].count++; }
        else if (dom <= 14) { weeks[1].amount += val; weeks[1].count++; }
        else if (dom <= 21) { weeks[2].amount += val; weeks[2].count++; }
        else { weeks[3].amount += val; weeks[3].count++; }
      }
      chartBars = weeks;
    } else {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const now = new Date();
      const last6Months: { label: string; subLabel: string; m: number; y: number; amount: number; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push({
          label: months[d.getMonth()],
          subLabel: String(d.getFullYear()).slice(-2),
          m: d.getMonth(),
          y: d.getFullYear(),
          amount: 0,
          count: 0
        });
      }
      for (const s of filteredSales) {
        const d = s.timestamp ? new Date(s.timestamp) : new Date();
        const match = last6Months.find(item => item.m === d.getMonth() && item.y === d.getFullYear());
        if (match) {
          match.amount += s.totalUSD || 0;
          match.count++;
        }
      }
      chartBars = last6Months;
    }

    const maxBarAmount = Math.max(...chartBars.map(b => b.amount), 0);
    if (maxBarAmount > 0) {
      chartBars = chartBars.map(b => ({
        ...b,
        isPeak: b.amount === maxBarAmount && b.amount > 0
      }));
    }

    const peakBar = chartBars.find(b => b.isPeak && b.amount > 0);

    let highestSale: { amount: number; receipt: string; time: string } | null = null;
    for (const s of filteredSales) {
      const amt = s.totalUSD || 0;
      if (!highestSale || amt > highestSale.amount) {
        highestSale = {
          amount: amt,
          receipt: s.receiptNumber || String(s.id || ''),
          time: s.timestamp ? new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
        };
      }
    }

    let localSalesCount = 0;
    let localSalesUSD = 0;
    let deliverySalesCount = 0;
    let deliverySalesUSD = 0;
    let pendingSalesCount = 0;
    let pendingSalesUSD = 0;

    for (const s of filteredSales) {
      const amt = s.totalUSD || 0;
      const isDel = s.orderType === 'delivery';
      const isPend = s.paymentStatus === 'por_cobrar' || s.status === 'pending';

      if (isDel) {
        deliverySalesCount++;
        deliverySalesUSD += amt;
      } else {
        localSalesCount++;
        localSalesUSD += amt;
      }

      if (isPend) {
        pendingSalesCount++;
        pendingSalesUSD += amt;
      }
    }

    const totalCash = cashUsd + cashVes;
    const totalPaymentsUSD = totalCash + pagoMovil + puntoTarjeta + zelle + credito;
    const paymentProportions = {
      cash: totalPaymentsUSD > 0 ? (totalCash / totalPaymentsUSD) * 100 : 0,
      pagoMovil: totalPaymentsUSD > 0 ? (pagoMovil / totalPaymentsUSD) * 100 : 0,
      punto: totalPaymentsUSD > 0 ? (puntoTarjeta / totalPaymentsUSD) * 100 : 0,
      zelle: totalPaymentsUSD > 0 ? (zelle / totalPaymentsUSD) * 100 : 0,
      credito: totalPaymentsUSD > 0 ? (credito / totalPaymentsUSD) * 100 : 0
    };

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
      credito,
      chartBars,
      maxBarAmount,
      peakBar,
      highestSale,
      paymentProportions,
      localSalesCount,
      localSalesUSD,
      deliverySalesCount,
      deliverySalesUSD,
      pendingSalesCount,
      pendingSalesUSD,
    };
  }, [filteredSales, bcvRate, period]);

  // Ventas filtradas para el listado por canal y estado de pago
  const displayedSales = useMemo(() => {
    return filteredSales.filter(s => {
      const isDel = s.orderType === 'delivery';
      const isPend = s.paymentStatus === 'por_cobrar' || s.status === 'pending';

      if (filterType === 'local' && isDel) return false;
      if (filterType === 'delivery' && !isDel) return false;
      if (filterPayment === 'paid' && isPend) return false;
      if (filterPayment === 'pending' && !isPend) return false;

      return true;
    });
  }, [filteredSales, filterType, filterPayment]);

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
        
        {/* ENCABEZADO CON CONTRASTE WCAG AAA (21:1) Y PESTAÑAS DE SECCIÓN */}
        <div 
          className="px-5 sm:px-6 pt-4 pb-0 border-b flex flex-col gap-3 shrink-0"
          style={{
            backgroundColor: isLight ? '#ffffff' : '#090d16',
            borderColor: isLight ? '#e2e8f0' : '#1e293b',
            color: isLight ? '#0f172a' : '#ffffff'
          }}
        >
          {/* Fila superior: Título, Tasa BCV y Botón Cerrar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-md shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className={`text-base sm:text-lg font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Módulo de Ventas & Respaldo
                </h2>
                <p className={`text-[11px] sm:text-xs font-medium mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Auditoría contable, métricas en vivo y protección de datos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
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

          {/* PESTAÑAS DE NAVEGACIÓN EN EL HEADER */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'metrics'
                  ? isLight
                    ? 'border-amber-500 text-amber-950 bg-amber-500/10 rounded-t-xl'
                    : 'border-amber-400 text-amber-300 bg-amber-500/15 rounded-t-xl'
                  : isLight
                    ? 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-xl'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-xl'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Gráficas & Métricas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'history'
                  ? isLight
                    ? 'border-amber-500 text-amber-950 bg-amber-500/10 rounded-t-xl'
                    : 'border-amber-400 text-amber-300 bg-amber-500/15 rounded-t-xl'
                  : isLight
                    ? 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-xl'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-xl'
              }`}
            >
              <Receipt className="w-4 h-4 shrink-0" />
              <span>Historial & Pedidos</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                activeTab === 'history'
                  ? isLight ? 'bg-amber-200 text-amber-950 font-black' : 'bg-amber-400 text-slate-950 font-black'
                  : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
              }`}>
                {filteredSales.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'backup'
                  ? isLight
                    ? 'border-amber-500 text-amber-950 bg-amber-500/10 rounded-t-xl'
                    : 'border-amber-400 text-amber-300 bg-amber-500/15 rounded-t-xl'
                  : isLight
                    ? 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-xl'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-xl'
              }`}
            >
              <Database className="w-4 h-4 shrink-0" />
              <span>Respaldo & Nube</span>
              {cloudSyncStatus === 'syncing' ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL POR SECCIONES (SIN SCROLL EXCESIVO) */}
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-6"
          style={{
            backgroundColor: isLight ? '#f8fafc' : '#070a12',
            color: isLight ? '#0f172a' : '#ffffff'
          }}
        >
          {/* ============================================================== */}
          {/* SECCIÓN 1: GRÁFICAS & MÉTRICAS (KPIS, TENDENCIAS, PAGOS)       */}
          {/* ============================================================== */}
          {activeTab === 'metrics' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Selector de Período Rápido */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#090d16] border-slate-800'
              }`}>
                <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>Período de Análisis:</span>
                </span>

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
                    📅 Hoy
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
                    📈 Mes ({new Date().toLocaleString('es-VE', { month: 'short' }).toUpperCase()})
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
              </div>

              {/* Cuadrícula de KPIs Principales */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    {period === 'daily' ? 'Jornada de hoy' : period === 'weekly' ? 'Últimos 7 días' : 'Total acumulado'}
                  </span>
                </div>

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
                    100% registradas
                  </span>
                </div>

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

              {/* Desglose Estratégico: Salón vs Delivery vs Por Cobrar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/30'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-wider block ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
                        Salón / Local
                      </span>
                      <span className={`text-base font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {formatUSD(metrics.localSalesUSD)}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-lg font-bold ${
                    isLight ? 'bg-white text-emerald-800 border border-emerald-200' : 'bg-slate-900 text-emerald-300 border border-emerald-500/20'
                  }`}>
                    {metrics.localSalesCount} ventas
                  </span>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isLight ? 'bg-purple-50/70 border-purple-200' : 'bg-purple-950/20 border-purple-500/30'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-wider block ${isLight ? 'text-purple-800' : 'text-purple-300'}`}>
                        Delivery a Domicilio
                      </span>
                      <span className={`text-base font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {formatUSD(metrics.deliverySalesUSD)}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-lg font-bold ${
                    isLight ? 'bg-white text-purple-800 border border-purple-200' : 'bg-slate-900 text-purple-300 border border-purple-500/20'
                  }`}>
                    {metrics.deliverySalesCount} despachos
                  </span>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  metrics.pendingSalesCount > 0
                    ? isLight ? 'bg-amber-50/90 border-amber-300' : 'bg-amber-950/30 border-amber-500/40'
                    : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-wider block ${
                        metrics.pendingSalesCount > 0 ? (isLight ? 'text-amber-900' : 'text-amber-300') : (isLight ? 'text-slate-500' : 'text-slate-400')
                      }`}>
                        Por Cobrar en Destino
                      </span>
                      <span className={`text-base font-black font-mono ${
                        metrics.pendingSalesCount > 0 ? (isLight ? 'text-amber-800' : 'text-amber-400') : (isLight ? 'text-slate-700' : 'text-slate-300')
                      }`}>
                        {formatUSD(metrics.pendingSalesUSD)}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-lg font-bold ${
                    metrics.pendingSalesCount > 0
                      ? isLight ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                      : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {metrics.pendingSalesCount} pendientes
                  </span>
                </div>
              </div>

              {/* Gráfico Animado WOW de Facturación */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-all duration-300 ${
                isLight
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-gradient-to-b from-[#0c1220] to-[#070a12] border-slate-800 shadow-xl shadow-black/40'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className={`text-xs sm:text-sm font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Ritmo de Facturación & Tendencia
                      </h3>
                      <p className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {period === 'daily' && '⚡ Desglose por franjas horarias de la jornada'}
                        {period === 'weekly' && '📅 Comparativa de rendimiento de los últimos 7 días'}
                        {period === 'monthly' && '📈 Evolución semanal en el mes en curso'}
                        {period === 'all' && '🗂️ Historial acumulado por meses'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {metrics.peakBar && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-black ${
                        isLight
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      }`}>
                        <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span>Pico: {metrics.peakBar.label} ({formatUSD(metrics.peakBar.amount)})</span>
                      </div>
                    )}
                    {metrics.highestSale && (
                      <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-black ${
                        isLight
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      }`}>
                        <Trophy className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Récord: {formatUSD(metrics.highestSale.amount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative pt-3 pb-1">
                  <div className="absolute inset-x-0 top-3 bottom-12 flex flex-col justify-between pointer-events-none opacity-30">
                    <div className={`border-b border-dashed ${isLight ? 'border-slate-300' : 'border-slate-700'}`} />
                    <div className={`border-b border-dashed ${isLight ? 'border-slate-300' : 'border-slate-700'}`} />
                    <div className={`border-b border-dashed ${isLight ? 'border-slate-300' : 'border-slate-700'}`} />
                  </div>

                  <div className="grid grid-flow-col auto-cols-fr gap-2 sm:gap-4 items-end h-44 px-1 relative z-10">
                    {metrics.chartBars.map((bar, idx) => {
                      const hasSales = bar.amount > 0;
                      const rawPercent = metrics.maxBarAmount > 0 ? (bar.amount / metrics.maxBarAmount) * 100 : 0;
                      const heightPercent = hasSales ? Math.max(rawPercent, 12) : 6;
                      const isHovered = hoveredBarIndex === idx;

                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredBarIndex(idx)}
                          onMouseLeave={() => setHoveredBarIndex(null)}
                          onClick={() => setHoveredBarIndex(isHovered ? null : idx)}
                          className="flex flex-col items-center h-full justify-end group cursor-pointer"
                        >
                          <div className={`transition-all duration-200 mb-1.5 flex flex-col items-center ${
                            isHovered ? 'scale-110 opacity-100' : 'opacity-90 group-hover:opacity-100'
                          }`}>
                            {bar.isPeak && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-amber-500 text-slate-950 shadow-xs mb-0.5 animate-bounce">
                                Pico 🔥
                              </span>
                            )}
                            <span className={`text-[11px] sm:text-xs font-mono font-black ${
                              hasSales
                                ? bar.isPeak
                                  ? 'text-amber-500 dark:text-amber-400'
                                  : isLight ? 'text-slate-900' : 'text-emerald-400'
                                : isLight ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              {hasSales ? `$${bar.amount.toFixed(bar.amount >= 100 ? 0 : 2)}` : '$0'}
                            </span>
                          </div>

                          <div className="w-full max-w-[54px] flex-1 flex items-end">
                            <div
                              className={`w-full rounded-t-xl transition-all duration-700 ease-out relative overflow-hidden ${
                                hasSales
                                  ? bar.isPeak
                                    ? 'bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-300 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40'
                                    : 'bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400 shadow-md shadow-emerald-500/20 group-hover:brightness-110'
                                  : isLight ? 'bg-slate-200/60' : 'bg-slate-800/40'
                              }`}
                              style={{
                                height: `${heightPercent}%`,
                                transform: isHovered ? 'scaleY(1.03)' : 'scaleY(1)',
                                transformOrigin: 'bottom'
                              }}
                            >
                              {hasSales && (
                                <div className="absolute top-0 inset-x-0 h-1 bg-white/40 rounded-t-xl" />
                              )}
                            </div>
                          </div>

                          <div className="w-full text-center mt-2 space-y-0.5">
                            <span className={`text-[10px] font-mono font-bold block ${
                              hasSales
                                ? isLight ? 'text-slate-700' : 'text-slate-300'
                                : isLight ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              {bar.count} vtas
                            </span>
                            <span className={`text-[10.5px] sm:text-xs font-black block truncate ${
                              bar.isPeak
                                ? 'text-amber-600 dark:text-amber-400'
                                : isLight ? 'text-slate-800' : 'text-slate-200'
                            }`}>
                              {bar.label}
                            </span>
                            <span className={`text-[9px] font-medium block truncate ${
                              isLight ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              {bar.subLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Barra Segmentada de Métodos de Pago */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      <PieChart className="w-3.5 h-3.5 text-sky-400" />
                      <span>Distribución Proporcional de Cobro</span>
                    </span>
                    <span className={`font-mono text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Base: {formatUSD(metrics.totalUSD)}
                    </span>
                  </div>

                  <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800 p-0.5 gap-0.5 shadow-inner">
                    {metrics.paymentProportions.cash > 0 && (
                      <div
                        style={{ width: `${metrics.paymentProportions.cash}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        title={`Efectivo: ${metrics.paymentProportions.cash.toFixed(1)}%`}
                      />
                    )}
                    {metrics.paymentProportions.pagoMovil > 0 && (
                      <div
                        style={{ width: `${metrics.paymentProportions.pagoMovil}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-500"
                        title={`Pago Móvil: ${metrics.paymentProportions.pagoMovil.toFixed(1)}%`}
                      />
                    )}
                    {metrics.paymentProportions.punto > 0 && (
                      <div
                        style={{ width: `${metrics.paymentProportions.punto}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                        title={`Punto de Venta: ${metrics.paymentProportions.punto.toFixed(1)}%`}
                      />
                    )}
                    {metrics.paymentProportions.zelle > 0 && (
                      <div
                        style={{ width: `${metrics.paymentProportions.zelle}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                        title={`Zelle / Digital: ${metrics.paymentProportions.zelle.toFixed(1)}%`}
                      />
                    )}
                    {metrics.paymentProportions.credito > 0 && (
                      <div
                        style={{ width: `${metrics.paymentProportions.credito}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                        title={`Créditos: ${metrics.paymentProportions.credito.toFixed(1)}%`}
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Efectivo {metrics.paymentProportions.cash.toFixed(0)}%
                    </span>
                    <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                      Pago Móvil {metrics.paymentProportions.pagoMovil.toFixed(0)}%
                    </span>
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                      Punto {metrics.paymentProportions.punto.toFixed(0)}%
                    </span>
                    {metrics.paymentProportions.zelle > 0 && (
                      <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                        Zelle {metrics.paymentProportions.zelle.toFixed(0)}%
                      </span>
                    )}
                    {metrics.paymentProportions.credito > 0 && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                        Fiado {metrics.paymentProportions.credito.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Desglose por Métodos de Pago */}
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
            </div>
          )}

          {/* ============================================================== */}
          {/* SECCIÓN 2: HISTORIAL DE VENTAS & DESGLOSE DE COMPROBANTES       */}
          {/* ============================================================== */}
          {activeTab === 'history' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              {/* Barra de Filtros Integrada */}
              <div className={`p-3.5 rounded-2xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#090d16] border-slate-800'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      isLight ? 'text-slate-900' : 'text-slate-200'
                    }`}>
                      <Receipt className="w-4 h-4 text-amber-500" />
                      <span>Comprobantes ({displayedSales.length})</span>
                    </span>
                  </div>

                  {/* Filtros: Período + Canal + Cobro */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Período */}
                    <div className={`flex items-center p-0.5 rounded-xl border text-[10px] font-bold ${
                      isLight ? 'border-slate-300 bg-slate-100' : 'border-slate-800 bg-[#0c1220]'
                    }`}>
                      {(['daily', 'weekly', 'monthly', 'all'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPeriod(p)}
                          className={`px-2 py-0.5 rounded-lg capitalize transition-all cursor-pointer ${
                            period === p
                              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                              : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {p === 'daily' ? 'Hoy' : p === 'weekly' ? '7 días' : p === 'monthly' ? 'Mes' : 'Todo'}
                        </button>
                      ))}
                    </div>

                    {/* Canal: Todos / Local / Delivery */}
                    <div className={`flex items-center p-0.5 rounded-xl border text-[10px] font-bold ${
                      isLight ? 'border-slate-300 bg-slate-100' : 'border-slate-800 bg-[#0c1220]'
                    }`}>
                      {(['all', 'local', 'delivery'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFilterType(t)}
                          className={`px-2 py-0.5 rounded-lg uppercase transition-all cursor-pointer ${
                            filterType === t
                              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                              : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {t === 'all' ? 'Todos' : t === 'local' ? 'Local' : 'Delivery'}
                        </button>
                      ))}
                    </div>

                    {/* Cobro: Todos / Pagados / Por cobrar */}
                    <div className={`flex items-center p-0.5 rounded-xl border text-[10px] font-bold ${
                      isLight ? 'border-slate-300 bg-slate-100' : 'border-slate-800 bg-[#0c1220]'
                    }`}>
                      {(['all', 'paid', 'pending'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFilterPayment(p)}
                          className={`px-2 py-0.5 rounded-lg uppercase transition-all cursor-pointer ${
                            filterPayment === p
                              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                              : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {p === 'all' ? 'Todos' : p === 'paid' ? 'Pagados' : 'Por Cobrar'}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={loadSales}
                      className={`text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors p-1.5 rounded-xl border ${
                        isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title="Refrescar ventas"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Refrescar</span>
                    </button>
                  </div>
                </div>

                {/* Subtotales del listado filtrado */}
                <div className={`pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
                  isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center gap-3">
                    <span>Tickets mostrados: <strong className="text-amber-500 font-black">{displayedSales.length}</strong></span>
                    <span>• Subtotal: <strong className="text-emerald-500 font-black">{formatUSD(displayedSales.reduce((acc, s) => acc + (s.totalUSD || 0), 0))}</strong></span>
                  </div>
                  <div>
                    <span>Bolívares: <strong className="text-sky-500 font-black">{formatVES(displayedSales.reduce((acc, s) => acc + (s.totalVES || (s.totalUSD ? s.totalUSD * (s.bcvRate || bcvRate) : 0)), 0))}</strong></span>
                  </div>
                </div>
              </div>

              {/* Lista Detallada de Comprobantes con Altura Cómoda */}
              {displayedSales.length === 0 ? (
                <div className={`p-10 rounded-2xl border border-dashed text-center space-y-2 ${
                  isLight ? 'border-slate-300 bg-white text-slate-700' : 'border-slate-800 bg-[#090d16] text-slate-300'
                }`}>
                  <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold">
                    No hay ventas registradas con los filtros seleccionados ({period === 'daily' ? 'hoy' : period === 'weekly' ? 'esta semana' : 'este mes'}).
                  </p>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Cambia los filtros de canal o estado de cobro, o emite un nuevo comprobante para verlo aquí.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[58vh] overflow-y-auto pr-1">
                  {displayedSales.map((sale) => {
                    const isExpanded = expandedSaleId === (sale.id || sale.receiptNumber);
                    const isDel = sale.orderType === 'delivery';
                    const isPend = sale.paymentStatus === 'por_cobrar' || sale.status === 'pending';

                    return (
                      <div
                        key={sale.id || sale.receiptNumber}
                        className={`p-3.5 rounded-2xl border transition-all text-xs ${
                          isLight
                            ? 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                            : 'border-slate-800 bg-[#090d16] hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
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

                              {/* Badge Canal: Delivery o Salón */}
                              {isDel ? (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                  <Bike className="w-2.5 h-2.5" />
                                  <span>Delivery {sale.driverName ? `• ${sale.driverName}` : ''}</span>
                                </span>
                              ) : (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                  <Store className="w-2.5 h-2.5" />
                                  <span>{sale.table || 'Salón / Local'}</span>
                                </span>
                              )}

                              {/* Badge Cobro */}
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                isPend
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {isPend ? '⚠️ Por Cobrar en Destino' : '✓ Pagado'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px]">
                              {sale.customerName && (
                                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                                  Cliente: {sale.customerName}
                                </span>
                              )}
                              <span className={`text-[10.5px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                • Cajero: {sale.cashierName || 'Cajero Principal'}
                              </span>
                            </div>

                            {isDel && sale.deliveryAddress && (
                              <p className={`text-[10px] truncate max-w-sm flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                <span className="text-amber-500 font-bold">📍</span> {sale.deliveryAddress}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                            <div className="text-right">
                              <div className={`font-mono font-black text-sm ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                {formatUSD(sale.totalUSD)}
                              </div>
                              <span className={`font-mono text-[10px] block ${isLight ? 'text-slate-500 font-bold' : 'text-slate-400'}`}>
                                {formatVES(sale.totalVES)}
                              </span>
                            </div>

                            {/* Botón Ver e Imprimir Comprobante */}
                            {onPrintTicket && (
                              <button
                                type="button"
                                onClick={() => onPrintTicket(sale)}
                                className={`px-2.5 py-1.5 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-black ${
                                  isLight
                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                                }`}
                                title="Previsualizar e Imprimir Ticket Térmico"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Ver Ticket</span>
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
          )}

          {/* ============================================================== */}
          {/* SECCIÓN 3: RESPALDO Y SALVAGUARDA DE DATOS (LOCAL & NUBE)      */}
          {/* ============================================================== */}
          {activeTab === 'backup' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* FEEDBACK DE ESTADO */}
              {backupStatusMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{backupStatusMsg}</span>
                </div>
              )}

              {/* GUÍA RÁPIDA DE RESPALDOS */}
              <div 
                className="p-4 rounded-2xl border text-xs flex items-start gap-3 shadow-xs"
                style={{
                  backgroundColor: isLight ? '#f1f5f9' : '#0c1220',
                  borderColor: isLight ? '#cbd5e1' : '#1e293b',
                  color: isLight ? '#334155' : '#94a3b8'
                }}
              >
                <Database className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 dark:text-white text-xs">
                    Centro de Seguridad & Copias de Respaldo KlikPOS
                  </h4>
                  <p className="text-[11px] leading-relaxed">
                    Tus ventas están 100% resguardadas localmente en este equipo. Puedes descargar copias de seguridad en formato JSON (se guardan automáticamente en tu carpeta <strong className="text-sky-600 dark:text-sky-400">Descargas / Downloads</strong>) para llevarlas a otra tablet o PC, o sincronizar directamente con la nube de Firestore.
                  </p>
                </div>
              </div>

              {/* TARJETAS DE ACCIÓN DE RESPALDO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Tarjeta 1: Descargar Copia Local */}
                <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 shadow-xs ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#090d16] border-slate-800'
                }`}>
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
                      <Download className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <h5 className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Descargar Respaldo JSON
                    </h5>
                    <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Genera un archivo .json inalterable con todo tu catálogo, comprobantes y configuración contable.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportBackup}
                    disabled={isBackingUp}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>{isBackingUp ? 'Generando archivo...' : 'Descargar a mi Equipo'}</span>
                  </button>
                </div>

                {/* Tarjeta 2: Restaurar Copia Local */}
                <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 shadow-xs ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#090d16] border-slate-800'
                }`}>
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 border border-sky-500/20 flex items-center justify-center">
                      <Upload className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <h5 className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Subir / Restaurar Respaldo
                    </h5>
                    <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Carga un archivo JSON de respaldo descargado previamente para restaurar ventas y productos.
                    </p>
                  </div>

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
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    <Upload className="w-4 h-4 stroke-[2.5]" />
                    <span>Seleccionar Archivo JSON</span>
                  </button>
                </div>

                {/* Tarjeta 3: Sincronización en la Nube */}
                <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 shadow-xs ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#090d16] border-slate-800'
                }`}>
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 flex items-center justify-center">
                      <Cloud className={`w-5 h-5 ${cloudSyncStatus === 'syncing' ? 'animate-bounce text-amber-400' : ''}`} />
                    </div>
                    <h5 className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Nube KlikPOS Cloud
                    </h5>
                    <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Sincroniza y respalda tus comprobantes de forma remota en los servidores de la nube.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloudSync}
                    disabled={cloudSyncStatus === 'syncing'}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-sky-800 border border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700'
                    }`}
                  >
                    <Cloud className={`w-4 h-4 ${cloudSyncStatus === 'syncing' ? 'animate-spin text-amber-400' : ''}`} />
                    <span>{cloudSyncStatus === 'syncing' ? 'Sincronizando con Firestore...' : 'Sincronizar Ahora'}</span>
                  </button>
                </div>
              </div>

              {/* Tarjeta de Información de la Base de Datos Local */}
              <div className={`p-4 rounded-2xl border space-y-2.5 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#090d16] border-slate-800'
              }`}>
                <h5 className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                  Estado del Motor de Almacenamiento Local
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1220] border-slate-800'}`}>
                    <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Ventas Totales</span>
                    <span className="font-mono font-black text-sm text-amber-500">{sales.length}</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1220] border-slate-800'}`}>
                    <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Motor DB</span>
                    <span className="font-mono font-black text-xs text-emerald-500">IndexedDB / Dexie</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1220] border-slate-800'}`}>
                    <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Modo Operativo</span>
                    <span className="font-mono font-black text-xs text-sky-500">100% Offline-First</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1220] border-slate-800'}`}>
                    <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Seguridad</span>
                    <span className="font-mono font-black text-xs text-indigo-500">Persistente Local</span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
