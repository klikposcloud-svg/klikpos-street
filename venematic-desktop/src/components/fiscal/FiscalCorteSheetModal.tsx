'use client';

import React, { useState } from 'react';
import { LocalSale, CashMovement, CashDenominationBreakdown } from '@/lib/db';
import FiscalCorteSheet from './FiscalCorteSheet';
import {
  FileText,
  Printer,
  Receipt,
  X,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { formatUSD, formatVES } from '@/lib/formatters';

export interface FiscalCorteSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export default function FiscalCorteSheetModal({
  isOpen,
  onClose,
  reportType,
  storeInfo,
  shiftData,
  bcvRate,
  sales,
  movements,
  denominations,
  countedUSD,
  countedVES,
}: FiscalCorteSheetModalProps) {
  const [activeFormat, setActiveFormat] = useState<'sheet' | 'ticket'>('sheet');

  if (!isOpen) return null;

  const handlePrint = (formatToPrint?: 'sheet' | 'ticket') => {
    const fmt = formatToPrint || activeFormat;
    if (fmt === 'sheet') {
      document.documentElement.setAttribute('data-print-format', 'sheet');
    } else {
      document.documentElement.removeAttribute('data-print-format');
    }

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.documentElement.removeAttribute('data-print-format');
      }, 1000);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 select-none overflow-y-auto">
      <div className="bg-slate-100 dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-800 w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera del Modal */}
        <div className="bg-slate-950 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                <span>{reportType === 'Z' ? 'Cierre Fiscal Diario (Corte Z)' : 'Arqueo Preliminar (Corte X)'}</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-mono border border-indigo-400/20">
                  Formato Contable SENIAT
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Reporte oficial en Hoja Carta / A4 para contadores, auditoría fiscal y control de proveedores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Formato: Carta vs Ticket */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveFormat('sheet')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeFormat === 'sheet'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={activeFormat === 'sheet' ? { color: '#ffffff' } : undefined}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hoja Carta / A4</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFormat('ticket')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeFormat === 'ticket'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={activeFormat === 'ticket' ? { color: '#ffffff' } : undefined}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ticket POS 80mm</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handlePrint()}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              style={{ color: '#ffffff' }}
              title="Imprimir o guardar como PDF"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span className="hidden md:inline">Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Cerrar vista"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido / Previsualización con Scroll */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200/70 dark:bg-slate-950/50">
          {activeFormat === 'sheet' ? (
            <FiscalCorteSheet
              reportType={reportType}
              storeInfo={storeInfo}
              shiftData={shiftData}
              bcvRate={bcvRate}
              sales={sales}
              movements={movements}
              denominations={denominations}
              countedUSD={countedUSD}
              countedVES={countedVES}
              onPrint={() => handlePrint('sheet')}
            />
          ) : (
            /* Vista Ticket 80mm tradicional */
            <div className="max-w-sm mx-auto space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handlePrint('ticket')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                  style={{ color: '#ffffff' }}
                >
                  <Printer className="w-4 h-4 text-white" />
                  Imprimir Ticket Térmico
                </button>
              </div>

              <div id="corte-receipt" className="print-area print-corte bg-white text-slate-900 font-mono text-xs p-6 rounded-2xl border border-slate-300 shadow-md leading-tight">
                <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
                  <p className="font-black text-sm uppercase">{storeInfo?.name || 'KLIKPOS ENTERPRISE'}</p>
                  <p className="text-[11px]">RIF: {storeInfo?.rif || 'J-50000000-0'}</p>
                  <p className="text-[10px] text-slate-600">{storeInfo?.address || 'Venezuela'}</p>
                  <p className="font-black text-[12px] pt-1">*** {reportType === 'Z' ? 'CORTE Z (CIERRE)' : 'CORTE X (ARQUEO)'} ***</p>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                  <p>Turno ID: #{shiftData.id || '1'}</p>
                  <p>Cajero: {shiftData.cashierName || 'Caja Principal'}</p>
                  <p>Apertura: {shiftData.openedAt ? new Date(shiftData.openedAt).toLocaleString('es-VE') : '--'}</p>
                  <p>Emisión: {new Date().toLocaleString('es-VE')}</p>
                  <p>Tasa BCV: {formatVES(bcvRate)}</p>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                  <p className="font-bold underline mb-1">VENTAS Y FISCAL:</p>
                  <p className="flex justify-between"><span>Ventas Totales:</span><span className="font-bold">{formatUSD(sales.reduce((a, s) => a + (s.totalUSD || 0), 0))}</span></p>
                  <p className="flex justify-between"><span>Total en Bs.:</span><span className="font-bold">{formatVES(sales.reduce((a, s) => a + (s.totalUSD || 0), 0) * bcvRate)}</span></p>
                  <p className="flex justify-between"><span>Tickets Emitidos:</span><span>{sales.length}</span></p>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                  <p className="font-bold underline mb-1">MOVIMIENTOS / GASTOS:</p>
                  <p className="flex justify-between">
                    <span>Pagos Proveedores:</span>
                    <span className="font-bold text-rose-700">
                      -{formatUSD(movements.filter((m) => m.type === 'out').reduce((a, m) => a + (m.amountUSD || 0), 0))}
                    </span>
                  </p>
                </div>

                <div className="pt-6 pb-2 space-y-6 text-center text-[10px]">
                  <div>
                    <div className="w-3/4 mx-auto border-t border-slate-800" />
                    <p className="mt-1 font-bold">Firma del Cajero</p>
                  </div>
                  <div>
                    <div className="w-3/4 mx-auto border-t border-slate-800" />
                    <p className="mt-1 font-bold">Firma del Supervisor / Auditor</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 sm:px-6 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            Formato conforme a regulaciones contables y providencias administrativas del SENIAT
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => handlePrint('sheet')}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer"
              style={{ color: '#ffffff' }}
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Imprimir Hoja Carta SENIAT</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
