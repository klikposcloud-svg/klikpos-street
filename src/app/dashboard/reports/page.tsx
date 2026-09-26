'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db, LocalSale, LocalCashShift, LocalProduct } from '@/lib/db';
import { formatUSD, formatVES, formatDateShort } from '@/lib/formatters';
import {
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Smartphone,
  Monitor,
  Package,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  Receipt,
  FileText,
  Clock,
  ArrowUpDown,
  Layers,
  History,
  Store,
  RefreshCw,
  Download,
  BookOpen,
} from 'lucide-react';
import { exportDatabaseBackup } from '@/lib/services/backup-service';
import {
  buildSeniatSalesBook,
  exportSeniatSalesBookToCSV,
  SeniatSaleRecord,
  SeniatSalesBookSummary,
} from '@/lib/fiscal/seniat-sales-book';

interface ProductSoldAudit {
  key: string;
  productId?: number;
  barcode: string;
  name: string;
  category: string;
  qtySold: number;
  currentStock: number;
  minStock: number;
  unit: string;
  totalUSD: number;
}

export default function DesktopReportsPage() {
  const [sales, setSales] = useState<LocalSale[]>([]);
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [currentShift, setCurrentShift] = useState<LocalCashShift | null>(null);
  const [closedShifts, setClosedShifts] = useState<LocalCashShift[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<'current' | number>('current');
  const [bcvRate, setBcvRate] = useState<number>(848.55);
  const [storeInfo, setStoreInfo] = useState({
    name: 'VENEMATIC POS',
    rif: 'J-50000000-0',
    phone: '',
    address: '',
  });

  // Pestaña activa
  const [activeTab, setActiveTab] = useState<'summary' | 'sales_detail' | 'inventory_audit' | 'shift_history' | 'seniat_sales_book'>('summary');

  // Estado para Libro de Ventas SENIAT (Providencia 00071)
  const [seniatPeriod, setSeniatPeriod] = useState<'current_month' | 'all' | 'custom'>('current_month');
  const [seniatCustomMonth, setSeniatCustomMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Estado para filas expandidas en el detalle de ventas
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [searchSaleQuery, setSearchSaleQuery] = useState('');
  const [searchInventoryQuery, setSearchInventoryQuery] = useState('');

  // Modal para ver comprobante individual
  const [selectedSaleForView, setSelectedSaleForView] = useState<LocalSale | null>(null);

  // Tipo de corte para imprimir ('X' o 'Z')
  const [printReportType, setPrintReportType] = useState<'X' | 'Z' | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [printDateTime, setPrintDateTime] = useState('');

  const loadData = async () => {
    const allSales = await db.sales.reverse().toArray();
    setSales(allSales);

    const allProds = await db.products.toArray();
    setProducts(allProds);

    const shift = await db.cashShifts.where('status').equals('open').first();
    if (shift) {
      setCurrentShift(shift);
    } else {
      // Si no existe un turno abierto, creamos uno inicial automáticamente
      const newShiftId = await db.cashShifts.add({
        openedAt: new Date().toISOString(),
        cashierName: 'Cajero Principal',
        initialCashUSD: 50.0,
        initialCashVES: 0.0,
        totalSalesUSD: 0,
        totalCashUSD: 0,
        totalCashVES: 0,
        totalPagoMovilVES: 0,
        totalCardVES: 0,
        totalZelleUSD: 0,
        status: 'open',
      });
      const created = await db.cashShifts.get(newShiftId);
      if (created) setCurrentShift(created);
    }

    const pastShifts = await db.cashShifts.where('status').equals('closed').reverse().toArray();
    setClosedShifts(pastShifts);

    const bcv = await db.settings.get('bcv_rate');
    if (bcv && bcv.value) setBcvRate(Number(bcv.value));

    const sInfo = await db.settings.get('store_info');
    if (sInfo && sInfo.value) {
      setStoreInfo({
        name: sInfo.value.name || 'VENEMATIC POS',
        rif: sInfo.value.rif || 'J-50000000-0',
        phone: sInfo.value.phone || '',
        address: sInfo.value.address || '',
      });
    }
  };

  useEffect(() => {
    setIsMounted(true);
    setPrintDateTime(new Date().toLocaleString('es-VE'));
    loadData();
  }, []);

  // Turno seleccionado para análisis
  const activeShiftData = useMemo(() => {
    if (selectedShiftId === 'current') return currentShift;
    return closedShifts.find((s) => s.id === selectedShiftId) || currentShift;
  }, [selectedShiftId, currentShift, closedShifts]);

  // Filtrar ventas del turno activo
  const shiftSales = useMemo(() => {
    if (!activeShiftData) return sales.filter((s) => s.status === 'completed');

    const openTime = new Date(activeShiftData.openedAt).getTime();
    const closeTime = activeShiftData.closedAt ? new Date(activeShiftData.closedAt).getTime() : Infinity;

    return sales.filter((s) => {
      if (s.status !== 'completed') return false;
      const saleTime = new Date(s.timestamp).getTime();
      return saleTime >= openTime && saleTime <= closeTime;
    });
  }, [sales, activeShiftData]);

  // Cálculos financieros del turno
  const totalSalesUSD = useMemo(() => shiftSales.reduce((acc, s) => acc + (s.totalUSD || 0), 0), [shiftSales]);
  const totalSalesVES = useMemo(() => totalSalesUSD * bcvRate, [totalSalesUSD, bcvRate]);

  // Desglose por método de pago
  const paymentBreakdown = useMemo(() => {
    let totalCashUSD = 0;
    let totalCashVES = 0;
    let totalPagoMovilVES = 0;
    let totalCardVES = 0;
    let totalZelleUSD = 0;
    let totalChangeUSD = 0;
    let totalChangeVES = 0;

    shiftSales.forEach((s) => {
      totalChangeUSD += s.changeUSD || 0;
      totalChangeVES += s.changeVES || 0;

      s.payments?.forEach((p) => {
        if (p.method === 'cash_usd') totalCashUSD += p.amountUSD || 0;
        if (p.method === 'cash_ves') totalCashVES += p.amountVES || 0;
        if (p.method === 'pago_movil') totalPagoMovilVES += p.amountVES || 0;
        if (p.method === 'card_debit' || p.method === 'card_credit') totalCardVES += p.amountVES || 0;
        if (p.method === 'zelle') totalZelleUSD += p.amountUSD || 0;
      });
    });

    return {
      totalCashUSD,
      totalCashVES,
      totalPagoMovilVES,
      totalCardVES,
      totalZelleUSD,
      totalChangeUSD,
      totalChangeVES,
      netCashUSDInDrawer: (activeShiftData?.initialCashUSD || 0) + totalCashUSD - totalChangeUSD,
      netCashVESInDrawer: (activeShiftData?.initialCashVES || 0) + totalCashVES - totalChangeVES,
    };
  }, [shiftSales, activeShiftData]);

  // Ventas por origen (Móvil vs PC)
  const mobileSalesCount = useMemo(() => shiftSales.filter((s) => s.source === 'mobile').length, [shiftSales]);
  const desktopSalesCount = useMemo(() => shiftSales.filter((s) => s.source !== 'mobile').length, [shiftSales]);

  // Consolidado de productos vendidos en el turno y auditoría contra inventario
  const inventoryAudit = useMemo(() => {
    const productMap = new Map<string, ProductSoldAudit>();
    const prodLookup = new Map<string, LocalProduct>();
    products.forEach((p) => {
      if (p.barcode) prodLookup.set(p.barcode.toLowerCase(), p);
    });

    shiftSales.forEach((s) => {
      s.items?.forEach((item) => {
        const key = item.barcode || item.name;
        const matchedProd = prodLookup.get((item.barcode || '').toLowerCase());

        if (productMap.has(key)) {
          const current = productMap.get(key)!;
          current.qtySold += item.qty;
          current.totalUSD += item.totalUSD || item.priceUSD * item.qty;
        } else {
          productMap.set(key, {
            key,
            productId: item.productId || matchedProd?.id,
            barcode: item.barcode || 'S/C',
            name: item.name,
            category: matchedProd?.category || 'General',
            qtySold: item.qty,
            currentStock: matchedProd?.stock ?? 0,
            minStock: matchedProd?.minStock ?? 5,
            unit: matchedProd?.unit || 'und',
            totalUSD: item.totalUSD || item.priceUSD * item.qty,
          });
        }
      });
    });

    return Array.from(productMap.values()).sort((a, b) => b.qtySold - a.qtySold);
  }, [shiftSales, products]);

  // Filtro de ventas detalladas
  const filteredSales = useMemo(() => {
    if (!searchSaleQuery.trim()) return shiftSales;
    const q = searchSaleQuery.toLowerCase().trim();
    return shiftSales.filter(
      (s) =>
        s.receiptNumber.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.customerDoc && s.customerDoc.toLowerCase().includes(q)) ||
        s.items?.some((i) => i.name.toLowerCase().includes(q))
    );
  }, [shiftSales, searchSaleQuery]);

  // Filtro de inventario auditado
  const filteredInventoryAudit = useMemo(() => {
    if (!searchInventoryQuery.trim()) return inventoryAudit;
    const q = searchInventoryQuery.toLowerCase().trim();
    return inventoryAudit.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [inventoryAudit, searchInventoryQuery]);

  // Imprimir reporte (Corte X o Corte Z)
  const triggerPrintCorte = (tipo: 'X' | 'Z') => {
    setPrintDateTime(new Date().toLocaleString('es-VE'));
    setPrintReportType(tipo);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Ejecutar Corte Z definitivo (Cierre de Caja)
  const handleCorteZ = async () => {
    if (selectedShiftId !== 'current') {
      alert('Debes estar en el Turno Actual para realizar el Cierre de Caja (Corte Z).');
      return;
    }

    const conf = confirm(
      `¿Desea cerrar el turno de caja actual y generar el Corte Z definitivo?\n\nTotal Recaudado: ${formatUSD(
        totalSalesUSD
      )} (${shiftSales.length} tickets)`
    );
    if (!conf) return;

    if (currentShift && currentShift.id) {
      const closeTime = new Date().toISOString();
      await db.cashShifts.update(currentShift.id, {
        closedAt: closeTime,
        totalSalesUSD,
        totalCashUSD: paymentBreakdown.totalCashUSD,
        totalCashVES: paymentBreakdown.totalCashVES,
        totalPagoMovilVES: paymentBreakdown.totalPagoMovilVES,
        totalCardVES: paymentBreakdown.totalCardVES,
        totalZelleUSD: paymentBreakdown.totalZelleUSD,
        status: 'closed',
      });

      // Abrir nuevo turno limpio
      const newShiftId = await db.cashShifts.add({
        openedAt: new Date().toISOString(),
        cashierName: currentShift.cashierName || 'Caja 1',
        initialCashUSD: 50.0,
        initialCashVES: 0.0,
        totalSalesUSD: 0,
        totalCashUSD: 0,
        totalCashVES: 0,
        totalPagoMovilVES: 0,
        totalCardVES: 0,
        totalZelleUSD: 0,
        status: 'open',
      });

      // Imprimir el corte Z
      triggerPrintCorte('Z');

      // Respaldo Automático Local al Emitir el Corte Z
      try {
        await exportDatabaseBackup('corte_z');
      } catch (err) {
        console.warn('Aviso en respaldo automático de Corte Z:', err);
      }

      alert('✓ Cierre de Caja (Corte Z) completado con éxito.\n\nSe descargó automáticamente una copia de seguridad segura de la base de datos y se ha iniciado un nuevo turno de caja.');
      await loadData();
      setSelectedShiftId('current');
    }
  };

  // Cálculos consolidados para el Libro de Ventas SENIAT (Providencia SNAT/2011/00071)
  const seniatBookData = useMemo(() => {
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (seniatPeriod === 'current_month') {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      startDate = `${y}-${m}-01`;
      endDate = `${y}-${m}-31`;
    } else if (seniatPeriod === 'custom' && seniatCustomMonth) {
      startDate = `${seniatCustomMonth}-01`;
      endDate = `${seniatCustomMonth}-31`;
    }

    return buildSeniatSalesBook(sales, { startDate, endDate });
  }, [sales, seniatPeriod, seniatCustomMonth]);

  const handleExportSeniatCSV = () => {
    const periodLabel =
      seniatPeriod === 'all'
        ? 'HISTÓRICO COMPLETO'
        : seniatPeriod === 'current_month'
        ? 'MES EN CURSO'
        : `PERÍODO ${seniatCustomMonth}`;
    exportSeniatSalesBookToCSV(
      seniatBookData.records,
      seniatBookData.summary,
      { name: storeInfo.name, rif: storeInfo.rif },
      periodLabel
    );
  };

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden bg-slate-100 font-sans">
      {/* Cabecera Principal */}
      <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-sm">
            <Receipt className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Cierre de Caja y Arqueo (Corte X / Z)
              </h1>
              {selectedShiftId === 'current' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Turno Actual Abierto
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  <History className="w-3 h-3 text-amber-700" />
                  Cierre Histórico (Z)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>Cajero: <strong>{activeShiftData?.cashierName || 'Caja 1'}</strong></span>
              <span>·</span>
              <span>Apertura: <strong>{activeShiftData?.openedAt ? formatDateShort(activeShiftData.openedAt) : '--'}</strong></span>
              {activeShiftData?.closedAt && (
                <>
                  <span>·</span>
                  <span>Cierre: <strong>{formatDateShort(activeShiftData.closedAt)}</strong></span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Selector de Turno y Botones de Acción */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-bold text-slate-600">Ver Turno:</span>
            <select
              value={selectedShiftId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedShiftId(val === 'current' ? 'current' : Number(val));
              }}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="current">Turno Activo Actual</option>
              {closedShifts.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  Corte Z: {formatDateShort(cs.openedAt)} (${cs.totalSalesUSD?.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => triggerPrintCorte('X')}
            className="px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            title="Imprimir resumen de caja sin cerrar el turno"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Corte X</span>
          </button>

          {selectedShiftId === 'current' && (
            <button
              onClick={handleCorteZ}
              className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              title="Cerrar el turno de forma definitiva y abrir uno nuevo"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cierre de Caja (Corte Z)</span>
            </button>
          )}
        </div>
      </div>

      {/* Pestañas de Navegación */}
      <div className="flex items-center gap-2 border-b border-slate-300 bg-white px-3 pt-2 rounded-xl shadow-2xs">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 text-xs font-black rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'summary'
              ? 'border-slate-900 text-slate-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          <span>Resumen de Arqueo</span>
        </button>

        <button
          onClick={() => setActiveTab('sales_detail')}
          className={`px-4 py-2 text-xs font-black rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'sales_detail'
              ? 'border-slate-900 text-slate-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-sky-600" />
          <span>Detalle de Ventas ({shiftSales.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory_audit')}
          className={`px-4 py-2 text-xs font-black rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'inventory_audit'
              ? 'border-slate-900 text-slate-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-amber-600" />
          <span>Auditoría de Mercancía e Inventario ({inventoryAudit.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('shift_history')}
          className={`px-4 py-2 text-xs font-black rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'shift_history'
              ? 'border-slate-900 text-slate-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5 text-purple-600" />
          <span>Historial de Cortes Z ({closedShifts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('seniat_sales_book')}
          className={`px-4 py-2 text-xs font-black rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'seniat_sales_book'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/80 shadow-xs'
              : 'border-transparent text-slate-600 hover:text-indigo-600'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span className="flex items-center gap-1.5">
            Libro de Ventas SENIAT
            <span className="text-[10px] px-1.5 py-0.2 bg-indigo-100 text-indigo-700 font-extrabold rounded-full border border-indigo-200">
              Prov. 00071
            </span>
          </span>
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}

      {/* 1. RESUMEN DE ARQUEO FINANCIERO */}
      {activeTab === 'summary' && (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Tarjetas KPI Superiores */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Total Ventas del Turno
              </span>
              <span className="text-2xl font-black font-mono text-slate-900 block tabular-numbers">
                {formatUSD(totalSalesUSD)}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 block tabular-numbers">
                {formatVES(totalSalesVES)}
              </span>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>{shiftSales.length} comprobantes</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Monitor className="w-3 h-3 text-slate-500" /> {desktopSalesCount} ·{' '}
                  <Smartphone className="w-3 h-3 text-sky-600" /> {mobileSalesCount}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Efectivo en Dólares ($)
              </span>
              <span className="text-2xl font-black font-mono text-emerald-700 block tabular-numbers">
                {formatUSD(paymentBreakdown.totalCashUSD)}
              </span>
              <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                <div className="flex justify-between">
                  <span>Fondo Inicial:</span>
                  <span className="font-mono font-bold text-slate-700">{formatUSD(activeShiftData?.initialCashUSD || 0)}</span>
                </div>
                {paymentBreakdown.totalChangeUSD > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Vuelto entregado:</span>
                    <span className="font-mono font-bold">-{formatUSD(paymentBreakdown.totalChangeUSD)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1">
                  <span>Total en Gaveta:</span>
                  <span className="font-mono text-emerald-800">{formatUSD(paymentBreakdown.netCashUSDInDrawer)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Efectivo en Bolívares (Bs.)
              </span>
              <span className="text-2xl font-black font-mono text-emerald-700 block tabular-numbers">
                {formatVES(paymentBreakdown.totalCashVES)}
              </span>
              <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                <div className="flex justify-between">
                  <span>Fondo Inicial:</span>
                  <span className="font-mono font-bold text-slate-700">{formatVES(activeShiftData?.initialCashVES || 0)}</span>
                </div>
                {paymentBreakdown.totalChangeVES > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Vuelto entregado:</span>
                    <span className="font-mono font-bold">-{formatVES(paymentBreakdown.totalChangeVES)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1">
                  <span>Total en Gaveta:</span>
                  <span className="font-mono text-emerald-800">{formatVES(paymentBreakdown.netCashVESInDrawer)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Electrónico y Bancario
              </span>
              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">📲 Pago Móvil:</span>
                  <span className="font-mono font-bold text-sky-700">{formatVES(paymentBreakdown.totalPagoMovilVES)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">💳 Punto / Débito:</span>
                  <span className="font-mono font-bold text-indigo-700">{formatVES(paymentBreakdown.totalCardVES)}</span>
                </div>
                {paymentBreakdown.totalZelleUSD > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">⚡ Zelle:</span>
                    <span className="font-mono font-bold text-purple-700">{formatUSD(paymentBreakdown.totalZelleUSD)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabla Resumen de Arqueo y Caja */}
          <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-5">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-700" />
              <span>Cuadre de Caja Esperado (Arqueo Físico)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cuadre en Dólares */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>💵 Balance de Dólares ($ USD)</span>
                  <span className="text-emerald-700 font-mono text-sm">{formatUSD(paymentBreakdown.netCashUSDInDrawer)}</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">(+) Fondo Inicial de Caja:</span>
                    <span className="font-mono font-bold text-slate-900">{formatUSD(activeShiftData?.initialCashUSD || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">(+) Ventas cobradas en Efectivo $:</span>
                    <span className="font-mono font-bold text-emerald-700">+{formatUSD(paymentBreakdown.totalCashUSD)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">(-) Vuelto entregado en $:</span>
                    <span className="font-mono font-bold text-rose-600">-{formatUSD(paymentBreakdown.totalChangeUSD)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm font-black bg-white px-2 rounded-lg border border-slate-300">
                    <span className="text-slate-900">Total a Entregar en Dólares:</span>
                    <span className="font-mono text-emerald-700">{formatUSD(paymentBreakdown.netCashUSDInDrawer)}</span>
                  </div>
                </div>
              </div>

              {/* Cuadre en Bolívares */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>💴 Balance de Bolívares (Bs. VES)</span>
                  <span className="text-emerald-700 font-mono text-sm">{formatVES(paymentBreakdown.netCashVESInDrawer)}</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">(+) Fondo Inicial en Bolívares:</span>
                    <span className="font-mono font-bold text-slate-900">{formatVES(activeShiftData?.initialCashVES || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">(+) Ventas cobradas en Efectivo Bs.:</span>
                    <span className="font-mono font-bold text-emerald-700">+{formatVES(paymentBreakdown.totalCashVES)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">(-) Vuelto entregado en Bs.:</span>
                    <span className="font-mono font-bold text-rose-600">-{formatVES(paymentBreakdown.totalChangeVES)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm font-black bg-white px-2 rounded-lg border border-slate-300">
                    <span className="text-slate-900">Total a Entregar en Bolívares:</span>
                    <span className="font-mono text-emerald-700">{formatVES(paymentBreakdown.netCashVESInDrawer)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DETALLE DE CADA VENTA (CON DESGLOSE DE PRODUCTOS) */}
      {activeTab === 'sales_detail' && (
        <div className="flex-1 bg-white rounded-2xl border border-slate-300 shadow-xs flex flex-col overflow-hidden">
          {/* Barra de Búsqueda y Filtro */}
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por ticket, cliente o artículo..."
                value={searchSaleQuery}
                onChange={(e) => setSearchSaleQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div className="text-xs font-bold text-slate-600">
              {filteredSales.length} transacciones mostradas
            </div>
          </div>

          {/* Tabla de Ventas */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-xs sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-4 w-8"></th>
                  <th className="py-2.5 px-4">Ticket</th>
                  <th className="py-2.5 px-4">Hora</th>
                  <th className="py-2.5 px-4">Origen</th>
                  <th className="py-2.5 px-4">Artículos</th>
                  <th className="py-2.5 px-4">Método de Pago</th>
                  <th className="py-2.5 px-4 text-right">Vuelto</th>
                  <th className="py-2.5 px-4 text-right">Total USD</th>
                  <th className="py-2.5 px-4 text-right">Total Bs</th>
                  <th className="py-2.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) => {
                  const isExpanded = expandedSaleId === s.receiptNumber;
                  const saleDate = new Date(s.timestamp);
                  const isMobile = s.source === 'mobile';
                  const primaryPayment = s.payments?.[0];
                  const hasChange = (s.changeUSD || 0) > 0 || (s.changeVES || 0) > 0;

                  return (
                    <React.Fragment key={s.receiptNumber}>
                      <tr
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-slate-50 font-medium' : ''
                        }`}
                        onClick={() => setExpandedSaleId(isExpanded ? null : s.receiptNumber)}
                      >
                        {/* Botón Expansor */}
                        <td className="py-2.5 px-2 text-center text-slate-500">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-700 inline" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500 inline" />
                          )}
                        </td>

                        {/* Nro de Ticket */}
                        <td className="py-2.5 px-4 font-mono font-black text-slate-900">
                          {s.receiptNumber}
                        </td>

                        {/* Hora */}
                        <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                          {!isNaN(saleDate.getTime())
                            ? saleDate.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            : '--:--'}
                        </td>

                        {/* Origen (Badge) */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {isMobile ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-300">
                              <Smartphone className="w-2.5 h-2.5" />
                              Móvil
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-300">
                              <Monitor className="w-2.5 h-2.5" />
                              PC
                            </span>
                          )}
                        </td>

                        {/* Cantidad de Artículos */}
                        <td className="py-2.5 px-4 text-slate-800">
                          <span className="font-bold">
                            {s.items?.reduce((sum, i) => sum + i.qty, 0) || 0} ítems
                          </span>
                          <span className="text-slate-500 text-[10px] ml-1.5">
                            ({s.items?.length || 0} prod.)
                          </span>
                        </td>

                        {/* Método de Pago */}
                        <td className="py-2.5 px-4">
                          <span className="font-bold text-slate-800 text-[11px]">
                            {(s.payments?.length || 0) > 1
                              ? '🔄 Mixto'
                              : primaryPayment?.method === 'cash_usd'
                              ? '💵 Efectivo $'
                              : primaryPayment?.method === 'cash_ves'
                              ? '💴 Efectivo Bs'
                              : primaryPayment?.method === 'pago_movil'
                              ? '📲 Pago Móvil'
                              : primaryPayment?.method === 'card_debit'
                              ? '💳 Débito'
                              : primaryPayment?.method === 'zelle'
                              ? '⚡ Zelle'
                              : 'Efectivo'}
                          </span>
                        </td>

                        {/* Vuelto */}
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          {hasChange ? (
                            <span className="text-emerald-700 font-bold font-mono text-[11px]">
                              {s.changeUSD > 0 && `$${s.changeUSD.toFixed(2)} `}
                              {s.changeVES > 0 && `(Bs. ${s.changeVES.toFixed(2)})`}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono text-[10px]">--</span>
                          )}
                        </td>

                        {/* Total USD */}
                        <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900 tabular-numbers">
                          {formatUSD(s.totalUSD)}
                        </td>

                        {/* Total Bs */}
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-500 tabular-numbers">
                          {formatVES(s.totalVES)}
                        </td>

                        {/* Ver Ticket */}
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSaleForView(s);
                            }}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                            title="Ver Comprobante Completo"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>

                      {/* FILA EXPANDIDA CON DETALLE COMPLETO DE PRODUCTOS */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-y border-slate-200">
                          <td colSpan={10} className="p-4 pl-12">
                            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
                                <span>Artículos vendidos en este ticket ({s.items?.length || 0}):</span>
                                {s.customerName && (
                                  <span className="text-slate-500">
                                    Cliente: <strong>{s.customerName}</strong> ({s.customerDoc || 'S/D'})
                                  </span>
                                )}
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                                    <tr>
                                      <th className="py-1.5 px-3 text-left">Código</th>
                                      <th className="py-1.5 px-3 text-left">Producto</th>
                                      <th className="py-1.5 px-3 text-center">Cantidad</th>
                                      <th className="py-1.5 px-3 text-right">Precio Unitario ($)</th>
                                      <th className="py-1.5 px-3 text-right">Subtotal ($)</th>
                                      <th className="py-1.5 px-3 text-right">Subtotal (Bs.)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                                    {s.items?.map((it, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50">
                                        <td className="py-1.5 px-3 text-slate-500">{it.barcode || 'S/C'}</td>
                                        <td className="py-1.5 px-3 font-sans font-medium text-slate-800">{it.name}</td>
                                        <td className="py-1.5 px-3 text-center font-bold text-slate-900">{it.qty}</td>
                                        <td className="py-1.5 px-3 text-right text-slate-600">${it.priceUSD.toFixed(2)}</td>
                                        <td className="py-1.5 px-3 text-right font-bold text-slate-900">${(it.totalUSD || it.priceUSD * it.qty).toFixed(2)}</td>
                                        <td className="py-1.5 px-3 text-right text-slate-500">Bs. {((it.totalUSD || it.priceUSD * it.qty) * (s.bcvRate || bcvRate)).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Desglose de Pagos de la Venta */}
                              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-slate-800">Pagos recibidos:</span>
                                  {s.payments?.map((p, pIdx) => (
                                    <span key={pIdx} className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-mono">
                                      {p.method}: ${p.amountUSD.toFixed(2)} {p.amountVES > 0 ? `(Bs. ${p.amountVES.toFixed(2)})` : ''}
                                      {p.reference ? ` [Ref: ${p.reference}]` : ''}
                                    </span>
                                  ))}
                                </div>
                                {hasChange && (
                                  <div className="text-emerald-700 font-bold">
                                    Vuelto entregado: ${s.changeUSD?.toFixed(2)} (Bs. {s.changeVES?.toFixed(2)})
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      No se encontraron ventas para los criterios seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. AUDITORÍA DE MERCANCÍA E INVENTARIO */}
      {activeTab === 'inventory_audit' && (
        <div className="flex-1 bg-white rounded-2xl border border-slate-300 shadow-xs flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar artículo por nombre, código o categoría..."
                value={searchInventoryQuery}
                onChange={(e) => setSearchInventoryQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500" />
              <span>{filteredInventoryAudit.length} productos con movimiento en este turno</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-xs sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-4">Código</th>
                  <th className="py-2.5 px-4">Producto</th>
                  <th className="py-2.5 px-4">Categoría</th>
                  <th className="py-2.5 px-4 text-center">Cantidad Vendida</th>
                  <th className="py-2.5 px-4 text-center">Stock Actual en Sistema</th>
                  <th className="py-2.5 px-4 text-center">Estado de Stock</th>
                  <th className="py-2.5 px-4 text-right">Recaudado USD</th>
                  <th className="py-2.5 px-4 text-right">Recaudado Bs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventoryAudit.map((p) => {
                  const isLowStock = p.currentStock <= p.minStock;
                  const isOutOfStock = p.currentStock <= 0;

                  return (
                    <tr key={p.key} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-slate-500 font-bold">
                        {p.barcode}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold">
                          {p.category}
                        </span>
                      </td>
                      {/* Cantidad Vendida en el Turno */}
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 font-mono font-black text-xs">
                          {p.qtySold} {p.unit}
                        </span>
                      </td>
                      {/* Stock Actual en Inventario */}
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">
                        {p.currentStock} {p.unit}
                      </td>
                      {/* Badge Estado */}
                      <td className="py-2.5 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            Agotado (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Stock Bajo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Óptimo
                          </span>
                        )}
                      </td>
                      {/* Recaudado USD */}
                      <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900 tabular-numbers">
                        ${p.totalUSD.toFixed(2)}
                      </td>
                      {/* Recaudado Bs */}
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-500 tabular-numbers">
                        Bs. {(p.totalUSD * bcvRate).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}

                {filteredInventoryAudit.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No hay artículos vendidos en este turno para auditar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. HISTORIAL DE CORTES Z */}
      {activeTab === 'shift_history' && (
        <div className="flex-1 bg-white rounded-2xl border border-slate-300 shadow-xs flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Historial de Cierres de Turno (Cortes Z Pasados)
            </h3>
            <span className="text-xs text-slate-500">{closedShifts.length} cierres registrados</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-xs sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-4">Turno #</th>
                  <th className="py-2.5 px-4">Cajero</th>
                  <th className="py-2.5 px-4">Apertura</th>
                  <th className="py-2.5 px-4">Cierre</th>
                  <th className="py-2.5 px-4 text-right">Efectivo $</th>
                  <th className="py-2.5 px-4 text-right">Efectivo Bs</th>
                  <th className="py-2.5 px-4 text-right">Pago Móvil Bs</th>
                  <th className="py-2.5 px-4 text-right">Total Ventas ($)</th>
                  <th className="py-2.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {closedShifts.map((cs) => (
                  <tr key={cs.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      Z-{cs.id}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      {cs.cashierName}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDateShort(cs.openedAt)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                      {cs.closedAt ? formatDateShort(cs.closedAt) : '--'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-700 font-bold">
                      ${(cs.totalCashUSD || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                      Bs. {(cs.totalCashVES || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-sky-700">
                      Bs. {(cs.totalPagoMovilVES || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">
                      ${(cs.totalSalesUSD || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedShiftId(cs.id!);
                          setActiveTab('summary');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold"
                      >
                        Inspeccionar
                      </button>
                    </td>
                  </tr>
                ))}

                {closedShifts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      Aún no se han ejecutado cierres de caja (Corte Z).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. LIBRO DE VENTAS FISCAL SENIAT (PROVIDENCIA SNAT/2011/00071) */}
      {activeTab === 'seniat_sales_book' && (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Barra Superior de Control Fiscal y Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                  SENIAT · Providencia SNAT/2011/00071
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {storeInfo.name} · RIF: {storeInfo.rif}
                </span>
              </div>
              <h2 className="text-base font-black text-slate-900 pt-1">
                Libro de Ventas Fiscal (IVA 16% & IGTF 3%)
              </h2>
              <p className="text-xs text-slate-500">
                Total Operaciones en Período: <strong className="text-slate-800">{seniatBookData.records.length}</strong>
              </p>
            </div>

            {/* Controles de Período y Exportación */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-bold text-slate-600">Período Fiscal:</span>
                <select
                  value={seniatPeriod}
                  onChange={(e) => setSeniatPeriod(e.target.value as 'current_month' | 'all' | 'custom')}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="current_month">Mes en Curso</option>
                  <option value="all">Histórico Completo</option>
                  <option value="custom">Mes Específico</option>
                </select>

                {seniatPeriod === 'custom' && (
                  <input
                    type="month"
                    value={seniatCustomMonth}
                    onChange={(e) => setSeniatCustomMonth(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                )}
              </div>

              <button
                onClick={handleExportSeniatCSV}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Descargar archivo .CSV con formato oficial SENIAT delimitado por punto y coma para Excel y Saint"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Excel (.CSV Oficial)</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Imprimir Libro de Ventas en formato tabular fiscal"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Libro Fiscal</span>
              </button>
            </div>
          </div>

          {/* Tarjetas KPI de Resumen Fiscal */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Ventas Facturadas</span>
              <p className="text-base font-black text-slate-900 font-mono">
                Bs. {seniatBookData.summary.totalVentasVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Ref. ${seniatBookData.summary.totalVentasUSD.toFixed(2)}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Ventas Exentas</span>
              <p className="text-base font-black text-emerald-800 font-mono">
                Bs. {seniatBookData.summary.totalExentasVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-emerald-600 font-bold">Canasta básica / Ley IVA</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">Base Imponible 16%</span>
              <p className="text-base font-black text-sky-900 font-mono">
                Bs. {seniatBookData.summary.totalBaseImponibleVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-sky-600 font-bold">Monto gravado de ley</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Débito Fiscal IVA (16%)</span>
              <p className="text-base font-black text-indigo-900 font-mono">
                Bs. {seniatBookData.summary.totalDebitoFiscalIVA.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-indigo-600 font-bold">A enterar al SENIAT</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Base IGTF Divisas</span>
              <p className="text-base font-black text-amber-900 font-mono">
                ${seniatBookData.summary.totalBaseIgtfUSD.toFixed(2)}
              </p>
              <p className="text-[10px] text-amber-600 font-mono">
                Bs. {seniatBookData.summary.totalBaseIgtfVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">IGTF Percibido (3%)</span>
              <p className="text-base font-black text-rose-900 font-mono">
                Bs. {seniatBookData.summary.totalIgtfPercibidoVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-rose-600 font-mono font-bold">
                Ref. ${seniatBookData.summary.totalIgtfPercibidoUSD.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Tabla Reglamentaria de Columnas SENIAT */}
          <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden flex-1 flex flex-col min-h-[350px]">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-mono text-[11px] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 whitespace-nowrap">N° Op.</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Fecha</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">RIF / CI</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Nombre o Razón Social</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">N° Factura</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">N° Control</th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-center">Tipo</th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-right">Total Ventas (Bs)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-right">Exentas (Bs)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-right">Base Imp. 16% (Bs)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-right">IVA 16% (Bs)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-right">Base IGTF ($)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-right">IGTF 3% (Bs)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-right">Total ($ Ref)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-right">Tasa BCV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {seniatBookData.records.map((r) => {
                    const isVoided = r.tipoTransaccion === '03-ANUL';
                    return (
                      <tr
                        key={r.operacionNo}
                        className={`hover:bg-slate-50 transition-colors ${
                          isVoided ? 'bg-rose-50/50 text-rose-600 line-through' : 'text-slate-800'
                        }`}
                      >
                        <td className="py-2 px-3 font-bold text-slate-900">{r.operacionNo}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{r.fecha}</td>
                        <td className="py-2 px-3 font-semibold">{r.rif}</td>
                        <td className="py-2 px-3 font-sans font-medium text-slate-900 truncate max-w-[180px]">
                          {r.nombreCliente}
                        </td>
                        <td className="py-2 px-3 font-bold text-sky-800">{r.nroFactura}</td>
                        <td className="py-2 px-3 text-slate-500">{r.nroControl}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                              isVoided
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {r.tipoTransaccion}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {r.totalVentasVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-700">
                          {r.ventasExentasVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right text-sky-800 font-semibold">
                          {r.baseImponibleVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-indigo-700">
                          {r.debitoFiscalIVA.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right text-amber-800 font-semibold">
                          ${r.baseIgtfUSD.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-rose-700">
                          {r.igtfPercibidoVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right font-sans font-bold text-slate-900">
                          ${r.totalVentaUSD.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500">
                          {r.tasaBCV.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}

                  {seniatBookData.records.length === 0 && (
                    <tr>
                      <td colSpan={15} className="py-12 text-center text-slate-500 font-sans text-xs">
                        No existen operaciones registradas para el período fiscal seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* Totales Fiscales */}
                {seniatBookData.records.length > 0 && (
                  <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono text-[11px] font-black text-slate-900">
                    <tr>
                      <td colSpan={7} className="py-3 px-3 uppercase text-right tracking-wider">
                        TOTALES PERÍODO FISCAL:
                      </td>
                      <td className="py-3 px-3 text-right">
                        Bs. {seniatBookData.summary.totalVentasVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-800">
                        Bs. {seniatBookData.summary.totalExentasVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-sky-900">
                        Bs. {seniatBookData.summary.totalBaseImponibleVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-indigo-900">
                        Bs. {seniatBookData.summary.totalDebitoFiscalIVA.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-900">
                        ${seniatBookData.summary.totalBaseIgtfUSD.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-900">
                        Bs. {seniatBookData.summary.totalIgtfPercibidoVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        ${seniatBookData.summary.totalVentasUSD.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">-</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 font-sans">
              <span>
                Cumple con Providencia Administrativa SENIAT SNAT/2011/00071 (Arts. 51-56) y Ley de Impuesto a las Grandes Transacciones Financieras (IGTF).
              </span>
              <span className="font-bold text-slate-700">
                Conservar copia física y digital durante un mínimo de 10 años.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA VER TICKET INDIVIDUAL */}
      {selectedSaleForView && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm">Comprobante de Venta</h3>
                <p className="text-[11px] text-slate-500 font-mono">{selectedSaleForView.receiptNumber}</p>
              </div>
              <button
                onClick={() => setSelectedSaleForView(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha y Hora:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatDateShort(selectedSaleForView.timestamp)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cajero:</span>
                  <span className="font-bold text-slate-800">{selectedSaleForView.cashierName || 'Caja 1'}</span>
                </div>
                {selectedSaleForView.customerName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cliente:</span>
                    <span className="font-bold text-slate-800">{selectedSaleForView.customerName}</span>
                  </div>
                )}
              </div>

              {/* Lista de Productos */}
              <div className="space-y-2">
                <span className="font-black text-[11px] uppercase tracking-wider text-slate-600 block">
                  Artículos ({selectedSaleForView.items?.length || 0})
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedSaleForView.items?.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {item.qty} × ${item.priceUSD.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900">
                        ${(item.totalUSD || item.priceUSD * item.qty).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales y Vuelto */}
              <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 border border-slate-200 font-mono">
                <div className="flex justify-between text-xs font-bold text-slate-900">
                  <span>TOTAL USD:</span>
                  <span>{formatUSD(selectedSaleForView.totalUSD)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>TOTAL BS (BCV):</span>
                  <span>{formatVES(selectedSaleForView.totalVES)}</span>
                </div>
                {(selectedSaleForView.changeUSD > 0 || selectedSaleForView.changeVES > 0) && (
                  <div className="flex justify-between text-[11px] font-bold text-emerald-700 pt-1 border-t border-slate-200">
                    <span>VUELTO ENTREGADO:</span>
                    <span>
                      ${selectedSaleForView.changeUSD.toFixed(2)} (Bs. {selectedSaleForView.changeVES.toFixed(2)})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => setSelectedSaleForView(null)}
                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLANTILLA DE IMPRESIÓN EXCLUSIVA PARA CORTE X / CORTE Z (CSS @media print) */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-4 text-[12px] font-mono leading-tight z-9999">
        <div className="max-w-xs mx-auto text-center space-y-1 pb-2 border-b border-dashed border-black">
          <p className="font-black text-sm">{storeInfo.name}</p>
          <p>RIF: {storeInfo.rif}</p>
          {storeInfo.address && <p>{storeInfo.address}</p>}
          <p className="font-black text-sm pt-1">
            {printReportType === 'Z' ? '*** CIERRE DE CAJA (CORTE Z) ***' : '*** ARQUEO DE CAJA (CORTE X) ***'}
          </p>
          <p suppressHydrationWarning>Fecha/Hora: {printDateTime || (isMounted ? new Date().toLocaleString('es-VE') : '')}</p>
          <p>Cajero: {activeShiftData?.cashierName || 'Caja 1'}</p>
          <p>Apertura: {activeShiftData?.openedAt ? formatDateShort(activeShiftData.openedAt) : '--'}</p>
        </div>

        {/* Resumen Financiero */}
        <div className="py-2 border-b border-dashed border-black space-y-1">
          <p className="font-bold text-center">--- RESUMEN FINANCIERO ---</p>
          <div className="flex justify-between">
            <span>Fondo Inicial $:</span>
            <span>${(activeShiftData?.initialCashUSD || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Fondo Inicial Bs:</span>
            <span>Bs. {(activeShiftData?.initialCashVES || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-black pt-1">
            <span>TOTAL VENTAS ($):</span>
            <span>${totalSalesUSD.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-black">
            <span>TOTAL VENTAS (Bs):</span>
            <span>Bs. {totalSalesVES.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cant. Tickets:</span>
            <span>{shiftSales.length}</span>
          </div>
        </div>

        {/* Formas de Pago */}
        <div className="py-2 border-b border-dashed border-black space-y-1">
          <p className="font-bold text-center">--- FORMAS DE PAGO ---</p>
          <div className="flex justify-between">
            <span>Efectivo Dólares ($):</span>
            <span>${paymentBreakdown.totalCashUSD.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Efectivo Bolívares (Bs):</span>
            <span>Bs. {paymentBreakdown.totalCashVES.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Pago Móvil (Bs):</span>
            <span>Bs. {paymentBreakdown.totalPagoMovilVES.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tarjeta / Débito (Bs):</span>
            <span>Bs. {paymentBreakdown.totalCardVES.toFixed(2)}</span>
          </div>
          {paymentBreakdown.totalZelleUSD > 0 && (
            <div className="flex justify-between">
              <span>Zelle ($):</span>
              <span>${paymentBreakdown.totalZelleUSD.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs pt-1 border-t border-dashed border-black font-black">
            <span>Vuelto entregado ($):</span>
            <span>-${paymentBreakdown.totalChangeUSD.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-black">
            <span>Vuelto entregado (Bs):</span>
            <span>-Bs. {paymentBreakdown.totalChangeVES.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs pt-1 font-black">
            <span>TOTAL GAVETA ($):</span>
            <span>${paymentBreakdown.netCashUSDInDrawer.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-black">
            <span>TOTAL GAVETA (Bs):</span>
            <span>Bs. {paymentBreakdown.netCashVESInDrawer.toFixed(2)}</span>
          </div>
        </div>

        {/* Resumen de Artículos Vendidos para Auditoría */}
        <div className="py-2 border-b border-dashed border-black space-y-1">
          <p className="font-bold text-center">--- MERCANCÍA VENDIDA ---</p>
          {inventoryAudit.map((item, idx) => (
            <div key={idx} className="flex justify-between text-[10px]">
              <span className="truncate max-w-[170px]">{item.name} (x{item.qtySold})</span>
              <span>${item.totalUSD.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="text-center pt-3 space-y-1 text-[10px]">
          <p>Firma Cajero: ___________________</p>
          <p>Firma Supervisor: ___________________</p>
          <p className="pt-2">VENEMATIC POS · Sistema de Ventas</p>
        </div>
      </div>
    </div>
  );
}
