'use client';

import React, { useMemo } from 'react';
import { LocalSale, CashMovement, CashDenominationBreakdown } from '@/lib/db';
import { formatUSD, formatVES } from '@/lib/formatters';
import {
  FileText,
  Printer,
  Calendar,
  Clock,
  User,
  Building2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ShieldCheck,
} from 'lucide-react';

export interface FiscalCorteSheetProps {
  reportType: 'X' | 'Z';
  storeInfo?: {
    name?: string;
    rif?: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
  };
  shiftData: {
    id?: number | string;
    cashierName?: string;
    openedAt?: string;
    closedAt?: string;
    initialCashUSD?: number;
    initialCashVES?: number;
  };
  bcvRate: number;
  sales: LocalSale[];
  movements: CashMovement[];
  denominations?: CashDenominationBreakdown;
  countedUSD?: number;
  countedVES?: number;
  printDate?: string;
  onPrint?: () => void;
}

export default function FiscalCorteSheet({
  reportType,
  storeInfo,
  shiftData,
  bcvRate,
  sales,
  movements,
  denominations,
  countedUSD,
  countedVES,
  printDate,
  onPrint,
}: FiscalCorteSheetProps) {
  const isCorteZ = reportType === 'Z';
  const effectiveDate = printDate || new Date().toLocaleString('es-VE');

  // 1. Cálculos de Ventas y Discriminación Fiscal SENIAT
  const fiscalTotals = useMemo(() => {
    let totalGrossUSD = 0;
    let totalGrossVES = 0;
    let exemptUSD = 0;
    let taxableBaseUSD = 0;
    let vatUSD = 0;
    let igtfUSD = 0;

    // Métodos de pago
    let cashUSDReceived = 0;
    let cashVESReceived = 0;
    let pagoMovilVES = 0;
    let cardVES = 0;
    let zelleUSD = 0;
    let binanceUSD = 0;
    let creditUSD = 0;
    let changeUSDGiven = 0;
    let changeVESGiven = 0;

    const validSales = sales.filter((s) => s.status === 'completed');

    validSales.forEach((sale) => {
      totalGrossUSD += sale.totalUSD || 0;
      totalGrossVES += sale.totalVES || (sale.totalUSD || 0) * (sale.bcvRate || bcvRate);

      // Desglose de ítems para base exenta vs gravable
      if (Array.isArray(sale.items) && sale.items.length > 0) {
        sale.items.forEach((item) => {
          const itemTotal = item.totalUSD || (item.priceUSD * item.qty);
          if (item.isTaxExempt) {
            exemptUSD += itemTotal;
          } else {
            // Precio en catálogo incluye IVA (16%), desglosamos base e IVA
            const base = itemTotal / 1.16;
            taxableBaseUSD += base;
            vatUSD += (itemTotal - base);
          }
        });
      } else {
        // Fallback si no hay ítems desglosados
        taxableBaseUSD += (sale.subtotalUSD || sale.totalUSD || 0) / 1.16;
        vatUSD += (sale.totalUSD || 0) - ((sale.subtotalUSD || sale.totalUSD || 0) / 1.16);
      }

      // Pagos
      if (Array.isArray(sale.payments)) {
        sale.payments.forEach((p) => {
          if (p.method === 'cash_usd') {
            cashUSDReceived += p.amountUSD || 0;
            // IGTF 3% sobre cobro en divisas efectivo
            igtfUSD += (p.amountUSD || 0) * 0.03;
          } else if (p.method === 'cash_ves') {
            cashVESReceived += p.amountVES || (p.amountUSD * (sale.bcvRate || bcvRate));
          } else if (p.method === 'pago_movil') {
            pagoMovilVES += p.amountVES || (p.amountUSD * (sale.bcvRate || bcvRate));
          } else if (p.method === 'card_debit' || p.method === 'card_credit') {
            cardVES += p.amountVES || (p.amountUSD * (sale.bcvRate || bcvRate));
          } else if (p.method === 'zelle') {
            zelleUSD += p.amountUSD || 0;
            igtfUSD += (p.amountUSD || 0) * 0.03;
          } else if (p.method === 'binance') {
            binanceUSD += p.amountUSD || 0;
            igtfUSD += (p.amountUSD || 0) * 0.03;
          } else if (p.method === 'credit') {
            creditUSD += p.amountUSD || 0;
          }
        });
      }

      changeUSDGiven += sale.changeUSD || 0;
      changeVESGiven += sale.changeVES || 0;
    });

    // Rango de comprobantes emitidos
    const sortedSales = [...validSales].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const firstTicket = sortedSales[0]?.receiptNumber || 'N/A';
    const lastTicket = sortedSales[sortedSales.length - 1]?.receiptNumber || 'N/A';

    return {
      validSalesCount: validSales.length,
      firstTicket,
      lastTicket,
      totalGrossUSD,
      totalGrossVES,
      exemptUSD,
      exemptVES: exemptUSD * bcvRate,
      taxableBaseUSD,
      taxableBaseVES: taxableBaseUSD * bcvRate,
      vatUSD,
      vatVES: vatUSD * bcvRate,
      igtfUSD,
      igtfVES: igtfUSD * bcvRate,
      // Formas de pago
      cashUSDReceived,
      cashVESReceived,
      pagoMovilVES,
      cardVES,
      zelleUSD,
      binanceUSD,
      creditUSD,
      changeUSDGiven,
      changeVESGiven,
      netCashUSD: cashUSDReceived - changeUSDGiven,
      netCashVES: cashVESReceived - changeVESGiven,
    };
  }, [sales, bcvRate]);

  // 2. Movimientos de Caja (Entradas, Salidas / Proveedores)
  const movementTotals = useMemo(() => {
    let inUSD = 0;
    let outUSD = 0;
    let inVES = 0;
    let outVES = 0;

    const providersList: CashMovement[] = [];
    const entriesList: CashMovement[] = [];

    movements.forEach((m) => {
      const u = m.amountUSD || (m.amountVES ? m.amountVES / bcvRate : 0);
      const v = m.amountVES || (m.amountUSD ? m.amountUSD * bcvRate : 0);

      if (m.type === 'in') {
        inUSD += u;
        inVES += v;
        entriesList.push(m);
      } else {
        outUSD += u;
        outVES += v;
        providersList.push(m);
      }
    });

    const initialUSD = shiftData.initialCashUSD || 0;
    const initialVES = shiftData.initialCashVES || 0;

    // Saldo esperado en gaveta
    const expectedDrawerUSD = initialUSD + fiscalTotals.netCashUSD + inUSD - outUSD;
    const expectedDrawerVES = initialVES + fiscalTotals.netCashVES + inVES - outVES;

    const diffUSD = (countedUSD !== undefined) ? countedUSD - expectedDrawerUSD : 0;
    const diffVES = (countedVES !== undefined) ? countedVES - expectedDrawerVES : 0;

    return {
      inUSD,
      outUSD,
      inVES,
      outVES,
      providersList,
      entriesList,
      initialUSD,
      initialVES,
      expectedDrawerUSD,
      expectedDrawerVES,
      diffUSD,
      diffVES,
    };
  }, [movements, shiftData, fiscalTotals, bcvRate, countedUSD, countedVES]);

  return (
    <div className="w-full space-y-4">
      {/* Botón de impresión superior y cabecera de previsualización */}
      {onPrint && (
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Vista Previa de Hoja Completa (Carta / A4) • Formato Oficial SENIAT
            </span>
          </div>
          <button
            type="button"
            onClick={onPrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            style={{ color: '#ffffff' }}
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Imprimir Hoja Carta / A4 (o Guardar PDF)</span>
          </button>
        </div>
      )}

      {/* CONTENEDOR DE HOJA TIPO CARTA / A4 (PRINT & PREVIEW) */}
      <div
        id="corte-sheet-letter"
        className="print-sheet-letter bg-white text-slate-900 mx-auto p-6 sm:p-10 rounded-2xl border-2 border-slate-300 shadow-xl max-w-4xl text-xs font-sans leading-normal print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none print:rounded-none"
        style={{ color: '#0f172a' }}
      >
        {/* ========================================================================= */}
        {/* 1. ENCABEZADO INSTITUCIONAL Y FISCAL                                      */}
        {/* ========================================================================= */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase">
                {storeInfo?.name || 'KLIKPOS ENTERPRISE C.A.'}
              </h1>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                RIF: <span className="font-mono">{storeInfo?.rif || 'J-50000000-0'}</span>
              </p>
              {storeInfo?.address && (
                <p className="text-xs text-slate-600 max-w-md mt-0.5 leading-snug">
                  {storeInfo.address}
                </p>
              )}
              {storeInfo?.phone && (
                <p className="text-xs text-slate-600 mt-0.5">
                  Teléfono: {storeInfo.phone}
                </p>
              )}
            </div>

            <div className="text-left sm:text-right border-l-2 sm:border-l-0 sm:border-r-0 border-slate-900 pl-3 sm:pl-0">
              <div className="inline-block px-3 py-1 bg-slate-950 text-white rounded-md font-black text-xs uppercase tracking-wider mb-1">
                {isCorteZ ? 'CORTE Z · CIERRE FISCAL DIARIO' : 'CORTE X · ARQUEO DE CAJA PARCIAL'}
              </div>
              <p className="text-xs font-extrabold text-slate-900 mt-1">
                N° Control: <span className="font-mono text-sm">#{isCorteZ ? 'Z' : 'X'}-{shiftData.id || '1'}</span>
              </p>
              <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                Emisión: {effectiveDate}
              </p>
              <p className="text-[11px] font-bold text-slate-800 mt-0.5">
                Tasa Oficial BCV: <span className="font-mono text-indigo-900 font-black">{formatVES(bcvRate)}/USD</span>
              </p>
            </div>
          </div>

          {/* Fila secundaria: Datos del Cajero y Período */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-dashed border-slate-300 text-[11px]">
            <div>
              <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Cajero(a) de Turno:</span>
              <span className="font-bold text-slate-900">{shiftData.cashierName || 'Caja Principal'}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Apertura de Caja:</span>
              <span className="font-semibold text-slate-800">
                {shiftData.openedAt ? new Date(shiftData.openedAt).toLocaleString('es-VE') : '--'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Cierre / Corte:</span>
              <span className="font-semibold text-slate-800">
                {shiftData.closedAt ? new Date(shiftData.closedAt).toLocaleString('es-VE') : effectiveDate}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Comprobantes Emitidos:</span>
              <span className="font-mono font-bold text-slate-900">
                {fiscalTotals.validSalesCount > 0
                  ? `${fiscalTotals.firstTicket} al ${fiscalTotals.lastTicket} (${fiscalTotals.validSalesCount} tickets)`
                  : '0 tickets emitidos'}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CUADRE FISCAL DE VENTAS (NORMATIVA SENIAT)                             */}
        {/* ========================================================================= */}
        <div className="mb-5">
          <div className="bg-slate-900 text-white px-3 py-1.5 font-bold uppercase text-[11px] tracking-wider rounded-t-md flex items-center justify-between">
            <span>1. Resumen de Ventas y Liquidación Fiscal (SENIAT)</span>
            <span className="text-[10px] text-slate-300 font-mono">Alicuota General 16% · Exento Ley IVA</span>
          </div>
          <table className="w-full border border-slate-300 border-collapse text-left text-[11px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <th className="p-2 border-r border-slate-300">Concepto Fiscal</th>
                <th className="p-2 border-r border-slate-300 text-center">Tipo / Tasa</th>
                <th className="p-2 border-r border-slate-300 text-right">Monto en Dólares ($ USD)</th>
                <th className="p-2 text-right">Monto en Bolívares (Bs. VES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2 border-r border-slate-300 font-medium">Ventas Exentas o No Sujetas de IVA (E)</td>
                <td className="p-2 border-r border-slate-300 text-center font-mono">0.00% (Exento)</td>
                <td className="p-2 border-r border-slate-300 text-right font-mono font-semibold">{formatUSD(fiscalTotals.exemptUSD)}</td>
                <td className="p-2 text-right font-mono font-semibold">{formatVES(fiscalTotals.exemptVES)}</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-300 font-medium">Base Imponible Gravada (G)</td>
                <td className="p-2 border-r border-slate-300 text-center font-mono">16.00% (General)</td>
                <td className="p-2 border-r border-slate-300 text-right font-mono font-semibold">{formatUSD(fiscalTotals.taxableBaseUSD)}</td>
                <td className="p-2 text-right font-mono font-semibold">{formatVES(fiscalTotals.taxableBaseVES)}</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-300 font-medium">Impuesto al Valor Agregado (IVA Débito Fiscal)</td>
                <td className="p-2 border-r border-slate-300 text-center font-mono">16.00%</td>
                <td className="p-2 border-r border-slate-300 text-right font-mono font-semibold text-emerald-800">{formatUSD(fiscalTotals.vatUSD)}</td>
                <td className="p-2 text-right font-mono font-semibold text-emerald-800">{formatVES(fiscalTotals.vatVES)}</td>
              </tr>
              {fiscalTotals.igtfUSD > 0 && (
                <tr className="bg-amber-50/50">
                  <td className="p-2 border-r border-slate-300 font-medium text-amber-950">IGTF Percibido (Operaciones en Divisas)</td>
                  <td className="p-2 border-r border-slate-300 text-center font-mono text-amber-900 font-bold">3.00%</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono font-semibold text-amber-900">{formatUSD(fiscalTotals.igtfUSD)}</td>
                  <td className="p-2 text-right font-mono font-semibold text-amber-900">{formatVES(fiscalTotals.igtfVES)}</td>
                </tr>
              )}
              <tr className="bg-slate-900 text-white font-black text-xs">
                <td className="p-2.5 border-r border-slate-800 uppercase tracking-wide">TOTAL VENTAS FACTURADAS</td>
                <td className="p-2.5 border-r border-slate-800 text-center font-mono">{fiscalTotals.validSalesCount} Comprobantes</td>
                <td className="p-2.5 border-r border-slate-800 text-right font-mono">{formatUSD(fiscalTotals.totalGrossUSD)}</td>
                <td className="p-2.5 text-right font-mono">{formatVES(fiscalTotals.totalGrossVES)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ========================================================================= */}
        {/* 3. DESGLOSE DE COBRANZAS Y FORMAS DE PAGO RECIBIDAS                       */}
        {/* ========================================================================= */}
        <div className="mb-5">
          <div className="bg-slate-900 text-white px-3 py-1.5 font-bold uppercase text-[11px] tracking-wider rounded-t-md flex items-center justify-between">
            <span>2. Liquidación y Conciliación de Medios de Pago</span>
            <span className="text-[10px] text-slate-300 font-mono">Desglose de Caja</span>
          </div>
          <table className="w-full border border-slate-300 border-collapse text-left text-[11px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <th className="p-2 border-r border-slate-300">Medio de Pago / Instrumento</th>
                <th className="p-2 border-r border-slate-300 text-center">Moneda Original</th>
                <th className="p-2 border-r border-slate-300 text-right">Monto en Dólares ($ USD)</th>
                <th className="p-2 border-r border-slate-300 text-right">Monto en Bolívares (Bs. VES)</th>
                <th className="p-2 text-center">% Part.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2 border-r border-slate-300 font-medium">Efectivo Dólares ($ USD) Recibido</td>
                <td className="p-2 border-r border-slate-300 text-center font-mono">USD $</td>
                <td className="p-2 border-r border-slate-300 text-right font-mono font-semibold">{formatUSD(fiscalTotals.cashUSDReceived)}</td>
                <td className="p-2 border-r border-slate-300 text-right font-mono">{formatVES(fiscalTotals.cashUSDReceived * bcvRate)}</td>
                <td className="p-2 text-center font-mono text-[10px]">
                  {fiscalTotals.totalGrossUSD > 0 ? ((fiscalTotals.cashUSDReceived / fiscalTotals.totalGrossUSD) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              {fiscalTotals.changeUSDGiven > 0 && (
                <tr className="bg-rose-50/40 text-rose-900">
                  <td className="p-2 border-r border-slate-300 italic font-medium">(-) Vuelto entregado en Dólares ($)</td>
                  <td className="p-2 border-r border-slate-300 text-center font-mono">USD $</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono font-bold">-{formatUSD(fiscalTotals.changeUSDGiven)}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">-{formatVES(fiscalTotals.changeUSDGiven * bcvRate)}</td>
                  <td className="p-2 text-center font-mono text-[10px]">--</td>
                </tr>
              )}
              <tr>
                <td className="p-2 border-r border-slate-300 font-medium">Efectivo Bolívares (Bs. VES) Recibido</td>
                <td className="p-2 border-r border-slate-300 text-center font-mono">Bs. VES</td>
                <td className="p-2 border-r border-slate-300 text-right font-mono">{formatUSD(fiscalTotals.cashVESReceived / bcvRate)}</td>
                <td className="p-2 border-r border-slate-300 text-right font-mono font-semibold">{formatVES(fiscalTotals.cashVESReceived)}</td>
                <td className="p-2 text-center font-mono text-[10px]">
                  {fiscalTotals.totalGrossVES > 0 ? ((fiscalTotals.cashVESReceived / fiscalTotals.totalGrossVES) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              {fiscalTotals.changeVESGiven > 0 && (
                <tr className="bg-rose-50/40 text-rose-900">
                  <td className="p-2 border-r border-slate-300 italic font-medium">(-) Vuelto entregado en Bolívares (Bs.)</td>
                  <td className="p-2 border-r border-slate-300 text-center font-mono">Bs. VES</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">-{formatUSD(fiscalTotals.changeVESGiven / bcvRate)}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono font-bold">-{formatVES(fiscalTotals.changeVESGiven)}</td>
                  <td className="p-2 text-center font-mono text-[10px]">--</td>
                </tr>
              )}
              <tr>
                <td className="p-2 border-r border-slate-300 font-medium">Pago Móvil Interbancario (C2P / P2P)</td>
                <td className="p-2 border-r border-slate-300 text-center font-mono">Bs. VES</td>
                <td className="p-2 border-r border-slate-300 text-right font-mono">{formatUSD(fiscalTotals.pagoMovilVES / bcvRate)}</td>
                <td className="p-2 border-r border-slate-300 text-right font-mono font-semibold text-indigo-900">{formatVES(fiscalTotals.pagoMovilVES)}</td>
                <td className="p-2 text-center font-mono text-[10px]">
                  {fiscalTotals.totalGrossVES > 0 ? ((fiscalTotals.pagoMovilVES / fiscalTotals.totalGrossVES) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-300 font-medium">Punto de Venta / Tarjetas de Débito</td>
                <td className="p-2 border-r border-slate-300 text-center font-mono">Bs. VES</td>
                <td className="p-2 border-r border-slate-300 text-right font-mono">{formatUSD(fiscalTotals.cardVES / bcvRate)}</td>
                <td className="p-2 border-r border-slate-300 text-right font-mono font-semibold">{formatVES(fiscalTotals.cardVES)}</td>
                <td className="p-2 text-center font-mono text-[10px]">
                  {fiscalTotals.totalGrossVES > 0 ? ((fiscalTotals.cardVES / fiscalTotals.totalGrossVES) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              {fiscalTotals.zelleUSD > 0 && (
                <tr>
                  <td className="p-2 border-r border-slate-300 font-medium">Zelle / Transferencia Internacional</td>
                  <td className="p-2 border-r border-slate-300 text-center font-mono">USD $</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono font-semibold text-purple-900">{formatUSD(fiscalTotals.zelleUSD)}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">{formatVES(fiscalTotals.zelleUSD * bcvRate)}</td>
                  <td className="p-2 text-center font-mono text-[10px]">
                    {fiscalTotals.totalGrossUSD > 0 ? ((fiscalTotals.zelleUSD / fiscalTotals.totalGrossUSD) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              )}
              {fiscalTotals.binanceUSD > 0 && (
                <tr>
                  <td className="p-2 border-r border-slate-300 font-medium">Binance Pay (USDT Criptoactivos)</td>
                  <td className="p-2 border-r border-slate-300 text-center font-mono">USDT</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono font-semibold text-amber-800">{formatUSD(fiscalTotals.binanceUSD)}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">{formatVES(fiscalTotals.binanceUSD * bcvRate)}</td>
                  <td className="p-2 text-center font-mono text-[10px]">
                    {fiscalTotals.totalGrossUSD > 0 ? ((fiscalTotals.binanceUSD / fiscalTotals.totalGrossUSD) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              )}
              {fiscalTotals.creditUSD > 0 && (
                <tr className="bg-amber-50/50">
                  <td className="p-2 border-r border-slate-300 font-medium text-amber-950">Vales / Créditos Otorgados (Por Cobrar)</td>
                  <td className="p-2 border-r border-slate-300 text-center font-mono">USD $</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono font-semibold text-amber-900">{formatUSD(fiscalTotals.creditUSD)}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900">{formatVES(fiscalTotals.creditUSD * bcvRate)}</td>
                  <td className="p-2 text-center font-mono text-[10px]">
                    {fiscalTotals.totalGrossUSD > 0 ? ((fiscalTotals.creditUSD / fiscalTotals.totalGrossUSD) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              )}
              <tr className="bg-slate-200 font-bold text-slate-900">
                <td colSpan={2} className="p-2 border-r border-slate-300 uppercase">TOTAL LIQUIDADO EN COBROS</td>
                <td className="p-2 border-r border-slate-300 text-right font-mono">{formatUSD(fiscalTotals.totalGrossUSD)}</td>
                <td className="p-2 border-r border-slate-300 text-right font-mono">{formatVES(fiscalTotals.totalGrossVES)}</td>
                <td className="p-2 text-center font-mono">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ========================================================================= */}
        {/* 4. MOVIMIENTOS DE CAJA: PROVEEDORES, GASTOS Y FLUJO DE EFECTIVO          */}
        {/* ========================================================================= */}
        <div className="mb-5">
          <div className="bg-slate-900 text-white px-3 py-1.5 font-bold uppercase text-[11px] tracking-wider rounded-t-md flex items-center justify-between">
            <span>3. Flujo de Gaveta y Pagos a Proveedores / Gastos</span>
            <span className="text-[10px] text-slate-300 font-mono">Auditoría de Salidas</span>
          </div>

          <div className="border border-slate-300 p-3 bg-slate-50 rounded-b-md space-y-3">
            {/* Resumen numérico del arqueo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Fondo Inicial Apertura:</span>
                <span className="font-mono font-bold text-slate-900">{formatUSD(movementTotals.initialUSD)}</span>
                <span className="text-[10px] text-slate-500 block font-mono">({formatVES(movementTotals.initialVES)})</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block text-[9px] uppercase font-bold">(+) Efectivo Neto Ventas:</span>
                <span className="font-mono font-bold text-emerald-800">{formatUSD(fiscalTotals.netCashUSD)}</span>
                <span className="text-[10px] text-slate-500 block font-mono">({formatVES(fiscalTotals.netCashVES)})</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block text-[9px] uppercase font-bold">(-) Pagos a Proveedores / Salidas:</span>
                <span className="font-mono font-bold text-rose-700">-{formatUSD(movementTotals.outUSD)}</span>
                <span className="text-[10px] text-slate-500 block font-mono">(-{formatVES(movementTotals.outVES)})</span>
              </div>
              <div className="bg-slate-900 text-white p-2 rounded">
                <span className="text-slate-300 block text-[9px] uppercase font-bold">Saldo Esperado en Gaveta:</span>
                <span className="font-mono font-bold text-white text-xs">{formatUSD(movementTotals.expectedDrawerUSD)}</span>
                <span className="text-[10px] text-slate-300 block font-mono">({formatVES(movementTotals.expectedDrawerVES)})</span>
              </div>
            </div>

            {/* Arqueo físico si existe */}
            {(countedUSD !== undefined || countedVES !== undefined) && (
              <div className="p-2.5 bg-white rounded border border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block">Conteo Físico Real de Billetes / Monedas:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {formatUSD(countedUSD || 0)} <span className="text-xs font-normal text-slate-500">({formatVES(countedVES || 0)})</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-700 block">Diferencia de Cuadre:</span>
                  <span className={`font-mono font-black text-sm ${movementTotals.diffUSD < 0 ? 'text-rose-600' : movementTotals.diffUSD > 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {movementTotals.diffUSD > 0 ? `+${formatUSD(movementTotals.diffUSD)} (Sobrante)` : movementTotals.diffUSD < 0 ? `${formatUSD(movementTotals.diffUSD)} (Faltante)` : '0.00 (Cuadre Exacto)'}
                  </span>
                </div>
              </div>
            )}

            {/* TABLA DETALLADA DE SALIDAS / PAGOS A PROVEEDORES */}
            <div>
              <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1.5">
                Detalle de Pagos a Proveedores y Gastos Operativos ({movementTotals.providersList.length} movimientos):
              </p>
              {movementTotals.providersList.length > 0 ? (
                <table className="w-full bg-white border border-slate-300 border-collapse text-left text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <th className="p-1.5 border-r border-slate-300">Hora</th>
                      <th className="p-1.5 border-r border-slate-300">Concepto / Proveedor</th>
                      <th className="p-1.5 border-r border-slate-300">Comprobante / Detalle</th>
                      <th className="p-1.5 border-r border-slate-300">Autorizado Por</th>
                      <th className="p-1.5 border-r border-slate-300 text-right">Monto ($ USD)</th>
                      <th className="p-1.5 text-right">Monto (Bs. VES)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {movementTotals.providersList.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-1.5 border-r border-slate-300 font-mono text-slate-600">
                          {m.timestamp ? new Date(m.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </td>
                        <td className="p-1.5 border-r border-slate-300 font-bold text-slate-900">{m.reason || 'Pago a Proveedor'}</td>
                        <td className="p-1.5 border-r border-slate-300 text-slate-600">{m.notes || 'Sin observaciones'}</td>
                        <td className="p-1.5 border-r border-slate-300 text-slate-700">{m.performedBy || shiftData.cashierName || 'Cajero'}</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono font-bold text-rose-700">
                          -{formatUSD(m.amountUSD || (m.amountVES ? m.amountVES / bcvRate : 0))}
                        </td>
                        <td className="p-1.5 text-right font-mono font-bold text-rose-700">
                          -{formatVES(m.amountVES || (m.amountUSD ? m.amountUSD * bcvRate : 0))}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
                      <td colSpan={4} className="p-1.5 border-r border-slate-300 uppercase">TOTAL PAGOS A PROVEEDORES</td>
                      <td className="p-1.5 border-r border-slate-300 text-right font-mono text-rose-700">-{formatUSD(movementTotals.outUSD)}</td>
                      <td className="p-1.5 text-right font-mono text-rose-700">-{formatVES(movementTotals.outVES)}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="p-2.5 bg-white border border-slate-200 rounded text-center text-[10px] text-slate-500 italic">
                  No se registraron retiros ni pagos a proveedores durante este turno de caja.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. LIBRO RESUMEN DE VENTAS (AUDITORÍA CONTABLE / SENIAT)                  */}
        {/* ========================================================================= */}
        <div className="mb-5">
          <div className="bg-slate-900 text-white px-3 py-1.5 font-bold uppercase text-[11px] tracking-wider rounded-t-md flex items-center justify-between">
            <span>4. Libro Resumen de Comprobantes Emitidos ({sales.length} transacciones)</span>
            <span className="text-[10px] text-slate-300 font-mono">Registro Cronológico</span>
          </div>
          <div className="max-h-72 overflow-y-auto border border-slate-300 rounded-b-md print:max-h-none print:overflow-visible">
            <table className="w-full border-collapse text-left text-[10px]">
              <thead className="sticky top-0 bg-slate-100 border-b border-slate-300 font-bold text-slate-700 print:static">
                <tr>
                  <th className="p-1.5 border-r border-slate-300"># Ticket</th>
                  <th className="p-1.5 border-r border-slate-300">Hora</th>
                  <th className="p-1.5 border-r border-slate-300">Cliente / RIF</th>
                  <th className="p-1.5 border-r border-slate-300">Forma Pago</th>
                  <th className="p-1.5 border-r border-slate-300 text-right">Base 16%</th>
                  <th className="p-1.5 border-r border-slate-300 text-right">IVA (16%)</th>
                  <th className="p-1.5 border-r border-slate-300 text-right">Total ($ USD)</th>
                  <th className="p-1.5 text-right">Total (Bs. VES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sales.map((s, idx) => {
                  const payMethods = s.payments?.map((p) => p.method).join(', ') || 'Efectivo';
                  const base = (s.subtotalUSD || s.totalUSD || 0) / 1.16;
                  const iva = (s.totalUSD || 0) - base;
                  return (
                    <tr key={s.id || idx} className="hover:bg-slate-50">
                      <td className="p-1.5 border-r border-slate-300 font-mono font-bold text-slate-900">{s.receiptNumber}</td>
                      <td className="p-1.5 border-r border-slate-300 font-mono text-slate-600">
                        {s.timestamp ? new Date(s.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-slate-800 truncate max-w-[140px]">
                        {s.customerName || (s.customerDoc ? `CI: ${s.customerDoc}` : 'Consumidor Final')}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 font-mono text-[9px] text-slate-600 truncate max-w-[100px]">{payMethods}</td>
                      <td className="p-1.5 border-r border-slate-300 text-right font-mono">{formatUSD(base)}</td>
                      <td className="p-1.5 border-r border-slate-300 text-right font-mono text-emerald-800">{formatUSD(iva)}</td>
                      <td className="p-1.5 border-r border-slate-300 text-right font-mono font-bold text-slate-900">{formatUSD(s.totalUSD || 0)}</td>
                      <td className="p-1.5 text-right font-mono font-bold text-slate-900">{formatVES(s.totalVES || (s.totalUSD || 0) * (s.bcvRate || bcvRate))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. FIRMAS DE CONFORMIDAD LEGAL, AUDITORÍA Y SENIAT                         */}
        {/* ========================================================================= */}
        <div className="pt-6 border-t-2 border-slate-900">
          <p className="text-center font-bold text-[10px] text-slate-600 uppercase tracking-widest mb-8">
            Declaración de Conformidad y Auditoría Legal de Cierre
          </p>

          <div className="grid grid-cols-3 gap-6 text-center text-[10px]">
            <div>
              <div className="w-4/5 mx-auto border-t-2 border-slate-800 pt-1">
                <p className="font-bold text-slate-900">{shiftData.cashierName || 'Cajero(a) Responsable'}</p>
                <p className="text-slate-500">Cajero(a) de Operaciones</p>
                <p className="text-slate-400 text-[9px] mt-0.5">C.I.: __________________</p>
              </div>
            </div>

            <div>
              <div className="w-4/5 mx-auto border-t-2 border-slate-800 pt-1">
                <p className="font-bold text-slate-900">Supervisor de Caja / Tienda</p>
                <p className="text-slate-500">Administrador de Turno</p>
                <p className="text-slate-400 text-[9px] mt-0.5">C.I.: __________________</p>
              </div>
            </div>

            <div>
              <div className="w-4/5 mx-auto border-t-2 border-slate-800 pt-1">
                <p className="font-bold text-slate-900">Contador Público / Revisor</p>
                <p className="text-slate-500">Auditoría Fiscal / SENIAT</p>
                <p className="text-slate-400 text-[9px] mt-0.5">C.P.C. N°: ______________</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-500">
            <span>KLIKPOS ENTERPRISE SUITE · Sistema Certificado de Punto de Venta y Facturación Local</span>
            <span className="font-mono">Generado: {effectiveDate} · ID Control: #{isCorteZ ? 'Z' : 'X'}-{shiftData.id || '1'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
