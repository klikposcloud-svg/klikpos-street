'use client';

import React, { useState, useEffect } from 'react';
import { db, LocalSale } from '@/lib/db';
import { formatUSD, formatVES } from '@/lib/formatters';
import Link from 'next/link';
import {
  Receipt,
  Smartphone,
  Monitor,
  Search,
  RefreshCw,
  ArrowUpRight,
  Eye,
  Printer,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { voidSale } from '@/lib/services/sale-void-service';

export default function CashierShiftSalesPage() {
  const [sales, setSales] = useState<LocalSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOrigin, setFilterOrigin] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [selectedSaleForView, setSelectedSaleForView] = useState<LocalSale | null>(null);
  const [bcvRate, setBcvRate] = useState<number>(848.55);
  const [isVoiding, setIsVoiding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleConfirmVoidSale = async (sale: LocalSale) => {
    const reason = prompt(
      `¿Confirmas la anulación del ticket ${sale.receiptNumber}?\n\nEsta acción reintegrará los artículos vendidos al inventario de forma automática.\n\nEscribe el motivo de la anulación / devolución:`,
      'Devolución de cliente'
    );
    if (!reason) return;

    setIsVoiding(true);
    const res = await voidSale(sale, reason, 'Cajero');
    setIsVoiding(false);

    if (res.success) {
      setToastMessage(res.message);
      setSelectedSaleForView(null);
      await loadSales();
      setTimeout(() => setToastMessage(null), 5000);
    } else {
      alert(res.message);
    }
  };

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const todaySales = await db.sales.where('timestamp').startsWith(todayStr).reverse().sortBy('id');
      if (todaySales.length > 0) {
        setSales(todaySales);
      } else {
        const recent = await db.sales.orderBy('id').reverse().limit(100).toArray();
        setSales(recent);
      }

      const rateSetting = await db.settings.get('bcv_rate');
      if (rateSetting) setBcvRate(rateSetting.value);
    } catch (err) {
      console.error('Error cargando ventas del turno:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSales();

    // Escuchar ventas nuevas guardadas en background o anulaciones
    const handleSaleSaved = () => {
      loadSales();
    };

    window.addEventListener('venematic:mobile_sale_saved', handleSaleSaved);
    window.addEventListener('venematic:sale_voided', handleSaleSaved);
    const interval = setInterval(loadSales, 5000);

    return () => {
      window.removeEventListener('venematic:mobile_sale_saved', handleSaleSaved);
      window.removeEventListener('venematic:sale_voided', handleSaleSaved);
      clearInterval(interval);
    };
  }, []);

  // Métricas calculadas del turno (excluyendo ventas anuladas del saldo en caja)
  const activeSales = sales.filter((s) => s.status !== 'voided');
  const voidedSales = sales.filter((s) => s.status === 'voided');

  const totalSalesUSD = activeSales.reduce((sum, s) => sum + (s.totalUSD || 0), 0);
  const totalSalesVES = activeSales.reduce((sum, s) => sum + (s.totalVES || 0), 0);

  const mobileSales = activeSales.filter((s) => (saleOrigin(s) === 'mobile'));
  const desktopSales = activeSales.filter((s) => (saleOrigin(s) !== 'mobile'));

  function saleOrigin(sale: any): 'mobile' | 'desktop' {
    if (sale.source === 'mobile' || sale.receiptNumber?.startsWith('CEL-')) return 'mobile';
    return 'desktop';
  }

  const totalMobileUSD = mobileSales.reduce((sum, s) => sum + (s.totalUSD || 0), 0);
  const totalDesktopUSD = desktopSales.reduce((sum, s) => sum + (s.totalUSD || 0), 0);

  // Filtrado reactivo de ventas
  const filteredSales = sales.filter((sale) => {
    const isMobile = saleOrigin(sale) === 'mobile';
    if (filterOrigin === 'mobile' && !isMobile) return false;
    if (filterOrigin === 'desktop' && isMobile) return false;

    if (filterPayment !== 'all') {
      const hasMethod = sale.payments?.some((p) => p.method === filterPayment);
      if (!hasMethod) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchReceipt = sale.receiptNumber?.toLowerCase().includes(q);
      const matchCashier = sale.cashierName?.toLowerCase().includes(q);
      const matchItems = sale.items?.some((i) => i.name.toLowerCase().includes(q));
      if (!matchReceipt && !matchCashier && !matchItems) return false;
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--industrial-bg,#ffffff)] overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* HEADER DE LA VISTA: Título + Badge de Sincronización + Acciones           */}
      {/* ========================================================================= */}
      <div className="p-4 bg-white border-b border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 tracking-tight">
                  Ventas del Turno del Cajero
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  En Vivo
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Auditoría en tiempo real de transacciones cobradas hoy en PC y Celulares
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSales}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <Link
            href="/dashboard/pos"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <span>Ir al POS (F1)</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TARJETAS DE MÉTRICAS / KPIS DEL TURNO                                     */}
      {/* ========================================================================= */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {/* Total General Recaudado */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Total Recaudado (Turno)
            </span>
            <p className="font-mono font-black text-2xl text-emerald-400 leading-tight tabular-numbers drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]">
              {formatUSD(totalSalesUSD)}
            </p>
            <p className="font-mono font-black text-xs text-emerald-700 tabular-numbers">
              ≈ {formatVES(totalSalesVES)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 font-black text-xl shadow-2xs">
            $
          </div>
        </div>

        {/* Cantidad de Ventas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Tickets Emitidos
            </span>
            <p className="font-mono font-black text-2xl text-emerald-400 leading-tight tabular-numbers drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]">
              {sales.length}
            </p>
            <p className="text-[11px] text-slate-600 font-bold">
              Hoy · Sesión activa
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Ventas Celular Móvil */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Caja Celular Móvil
              </span>
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            </div>
            <p className="font-mono font-black text-2xl text-emerald-400 leading-tight tabular-numbers drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]">
              {formatUSD(totalMobileUSD)}
            </p>
            <p className="text-[11px] font-bold text-sky-700">
              {mobileSales.length} venta{mobileSales.length !== 1 ? 's' : ''} desde celular
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 border border-sky-300 flex items-center justify-center shrink-0 shadow-2xs">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        {/* Ventas Terminal PC */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Terminal PC Caja
            </span>
            <p className="font-mono font-black text-2xl text-emerald-400 leading-tight tabular-numbers drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]">
              {formatUSD(totalDesktopUSD)}
            </p>
            <p className="text-[11px] font-bold text-indigo-700">
              {desktopSales.length} venta{desktopSales.length !== 1 ? 's' : ''} en mostrador
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Monitor className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA DE BÚSQUEDA Y FILTROS RÁPIDOS                                       */}
      {/* ========================================================================= */}
      <div className="px-4 pb-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Buscador */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nro. ticket, cajero o producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros por Origen y Pago */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider mr-1">Origen:</span>
          <button
            onClick={() => setFilterOrigin('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
              filterOrigin === 'all'
                ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            Todas ({sales.length})
          </button>
          <button
            onClick={() => setFilterOrigin('mobile')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all border ${
              filterOrigin === 'mobile'
                ? 'bg-sky-600 border-sky-500 text-white shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Móvil Celular ({mobileSales.length})</span>
          </button>
          <button
            onClick={() => setFilterOrigin('desktop')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all border ${
              filterOrigin === 'desktop'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>PC Caja ({desktopSales.length})</span>
          </button>

          <span className="text-slate-400 mx-1">|</span>

          {/* Selector de Pago */}
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          >
            <option value="all">Cualquier Método de Pago</option>
            <option value="cash_usd">Efectivo $ USD</option>
            <option value="cash_ves">Efectivo Bs. VES</option>
            <option value="pago_movil">Pago Móvil</option>
            <option value="card_debit">Tarjeta Débito</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TABLA PRINCIPAL DE VENTAS DEL TURNO                                       */}
      {/* ========================================================================= */}
      <div className="flex-1 px-4 pb-4 overflow-hidden">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs h-full flex flex-col overflow-hidden">
          {/* Cabecera de la tabla */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Origen</th>
                  <th className="py-3 px-4">Hora</th>
                  <th className="py-3 px-4">Artículos</th>
                  <th className="py-3 px-4">Método de Pago</th>
                  <th className="py-3 px-4 text-right">Total $ USD</th>
                  <th className="py-3 px-4 text-right">Total Bs. VES</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale, idx) => {
                  const isMobile = saleOrigin(sale) === 'mobile';
                  const saleDate = new Date(sale.timestamp);
                  const timeFormatted = !isNaN(saleDate.getTime())
                    ? saleDate.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '--:--';

                  const primaryPayment = sale.payments?.[0];
                  const hasChange = (sale.changeUSD || 0) > 0 || (sale.changeVES || 0) > 0;

                  return (
                    <tr
                      key={sale.receiptNumber || idx}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedSaleForView(sale)}
                    >
                      {/* Nro Ticket */}
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={sale.status === 'voided' ? 'line-through text-slate-400' : ''}>
                            {sale.receiptNumber}
                          </span>
                          {sale.status === 'voided' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white uppercase shadow-2xs">
                              ANULADO
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Origen (Badge Móvil vs PC) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isMobile ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
                            <Smartphone className="w-3 h-3 text-sky-600" />
                            <span>Celular Móvil</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
                            <Monitor className="w-3 h-3 text-emerald-600" />
                            <span>Caja PC</span>
                          </span>
                        )}
                      </td>

                      {/* Hora */}
                      <td className="py-3.5 px-4 text-slate-700 font-mono font-bold text-xs whitespace-nowrap">
                        {timeFormatted}
                      </td>

                      {/* Resumen de Artículos */}
                      <td className="py-3.5 px-4 max-w-xs truncate">
                        <span className="font-black text-slate-900 text-xs">
                          {sale.items?.reduce((sum, i) => sum + i.qty, 0) || 0} ítems
                        </span>
                        <span className="text-slate-400 mx-1.5">·</span>
                        <span className="text-slate-700 text-xs font-medium truncate">
                          {sale.items?.map((i) => `${i.name} (x${i.qty})`).join(', ')}
                        </span>
                      </td>

                      {/* Método de Pago y Vuelto */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900 text-xs">
                            {(sale.payments?.length || 0) > 1
                              ? '🔄 Mixto'
                              : primaryPayment?.method === 'cash_usd'
                              ? '💵 Efectivo $ USD'
                              : primaryPayment?.method === 'cash_ves'
                              ? '💴 Efectivo Bs. VES'
                              : primaryPayment?.method === 'pago_movil'
                              ? '📲 Pago Móvil'
                              : primaryPayment?.method === 'card_debit'
                              ? '💳 Débito'
                              : primaryPayment?.method === 'card_credit'
                              ? '💳 Crédito'
                              : primaryPayment?.method === 'zelle'
                              ? '⚡ Zelle'
                              : 'Efectivo'}
                          </span>
                          {primaryPayment?.reference && (
                            <span className="text-[10px] font-mono font-bold text-slate-500">
                              Ref: {primaryPayment.reference}
                            </span>
                          )}
                          {hasChange && (
                            <span className="text-[10px] text-emerald-700 font-bold">
                              Vuelto: ${sale.changeUSD?.toFixed(2)} (Bs. {sale.changeVES?.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total USD */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-950 text-sm tabular-numbers whitespace-nowrap">
                        {formatUSD(sale.totalUSD)}
                      </td>

                      {/* Total VES */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-xs tabular-numbers whitespace-nowrap">
                        {formatVES(sale.totalVES)}
                      </td>

                      {/* Botón Ver Ticket */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedSaleForView(sale)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 mx-auto shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ver Ticket</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredSales.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl">📋</span>
                        <p className="text-sm font-bold text-slate-700">No se encontraron ventas para este filtro</p>
                        <p className="text-xs text-slate-400">
                          Las ventas realizadas en la caja o en el celular aparecerán aquí al instante.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pie de tabla con totales filtrados */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              Mostrando <strong className="text-slate-900">{filteredSales.length}</strong> de{' '}
              <strong className="text-slate-900">{sales.length}</strong> transacciones de hoy
            </span>

            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-400 text-[10px] block font-bold uppercase">Subtotal Filtrado:</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  ${filteredSales.reduce((a, s) => a + s.totalUSD, 0).toFixed(2)}
                </span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-slate-400 text-[10px] block font-bold uppercase">En Bolívares:</span>
                <span className="font-mono font-bold text-emerald-700 text-xs">
                  Bs. {filteredSales.reduce((a, s) => a + s.totalVES, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DETALLE DE TICKET PARA IMPRESIÓN Y REVISIÓN                         */}
      {/* ========================================================================= */}
      {selectedSaleForView && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-2xs z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSaleForView(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Ticket */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Comprobante de Venta</h3>
                  <p className="font-mono text-[10px] text-slate-300">{selectedSaleForView.receiptNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSaleForView(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-base"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del Recibo */}
            <div className="p-4 space-y-3 text-xs overflow-y-auto max-h-[65vh]">
              {/* Metadatos */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha y Hora:</span>
                  <span className="font-medium text-slate-800">
                    {new Date(selectedSaleForView.timestamp).toLocaleString('es-VE')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Canal / Origen:</span>
                  <span className="font-bold text-slate-800">
                    {saleOrigin(selectedSaleForView) === 'mobile' ? '📱 Celular Móvil' : '🖥️ Terminal Caja PC'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cajero:</span>
                  <span className="text-slate-800">{selectedSaleForView.cashierName || 'Cajero Principal'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tasa BCV Aplicada:</span>
                  <span className="font-mono font-bold text-slate-800">
                    Bs. {selectedSaleForView.bcvRate?.toFixed(2) || bcvRate.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Lista de Ítems */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Artículos del Ticket:
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedSaleForView.items?.map((item, i) => (
                    <div key={i} className="p-2 flex items-center justify-between text-xs">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {item.qty} × ${item.priceUSD.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-slate-900 text-xs block">
                          ${item.totalUSD.toFixed(2)}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 block">
                          Bs. {(item.totalUSD * (selectedSaleForView.bcvRate || bcvRate)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen Financiero y Vuelto */}
              <div className="bg-slate-900 text-white p-3 rounded-xl space-y-1.5 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Venta ($):</span>
                  <span className="font-black text-emerald-400 text-sm">
                    ${selectedSaleForView.totalUSD.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Venta (Bs.):</span>
                  <span className="font-bold text-slate-200">
                    Bs. {selectedSaleForView.totalVES.toFixed(2)}
                  </span>
                </div>
                {((selectedSaleForView.changeUSD || 0) > 0 || (selectedSaleForView.changeVES || 0) > 0) && (
                  <div className="flex justify-between pt-1 border-t border-slate-800 text-xs bg-emerald-950/60 -mx-1 px-2 py-1 rounded">
                    <span className="text-emerald-300 font-bold">Vuelto Entregado:</span>
                    <span className="text-emerald-200 font-black">
                      ${selectedSaleForView.changeUSD?.toFixed(2)} (Bs. {selectedSaleForView.changeVES?.toFixed(2)})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Banner si el ticket ya fue anulado */}
            {selectedSaleForView.status === 'voided' && (
              <div className="bg-rose-600 text-white px-3 py-2 text-xs font-black text-center flex items-center justify-center gap-1.5 shrink-0">
                <AlertTriangle className="w-4 h-4" />
                <span>VENTA ANULADA · MERCANCÍA REINTEGRADA AL INVENTARIO</span>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSaleForView(null)}
                  className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Ticket</span>
                </button>
              </div>

              {selectedSaleForView.status !== 'voided' && (
                <button
                  onClick={() => handleConfirmVoidSale(selectedSaleForView)}
                  disabled={isVoiding}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 hover:border-rose-400 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{isVoiding ? 'Anulando y reingresando stock...' : 'Anular Ticket / Reingresar Mercancía al Stock'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
