'use client';

import React, { useRef } from 'react';
import {
  Printer,
  X,
  FileSpreadsheet,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { SeniatPurchaseRecord, SeniatPurchasesBookSummary, exportSeniatPurchasesBookToCSV } from '@/lib/fiscal/seniat-purchases-book';
import { formatUSD, formatVES } from '@/lib/formatters';

interface FiscalPurchasesSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodName: string;
  storeInfo: {
    name?: string;
    rif?: string;
    phone?: string;
    address?: string;
  };
  bcvRate: number;
  records: SeniatPurchaseRecord[];
  summary: SeniatPurchasesBookSummary;
}

export default function FiscalPurchasesSheetModal({
  isOpen,
  onClose,
  periodName,
  storeInfo,
  bcvRate,
  records,
  summary,
}: FiscalPurchasesSheetModalProps) {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    document.documentElement.setAttribute('data-print-format', 'sheet');
    window.print();
    setTimeout(() => {
      document.documentElement.removeAttribute('data-print-format');
    }, 1000);
  };

  const handleExportCSV = () => {
    const csvContent = exportSeniatPurchasesBookToCSV(
      records,
      summary,
      storeInfo.rif || 'J-50000000-0',
      periodName
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Libro_Compras_SENIAT_${periodName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-800 flex flex-col max-h-[96vh] overflow-hidden print:max-h-none print:border-none print:shadow-none print:w-full print:rounded-none">
        
        {/* Barra Superior con Acciones (Oculta en Impresión) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <Building2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm uppercase tracking-wide text-white">
                  Libro Especial de Compras SENIAT
                </h3>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/40 font-bold">
                  Art. 75 Reg. Ley IVA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Período: <strong className="text-slate-200">{periodName}</strong> • {records.length} compras registradas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Descargar archivo CSV para el contador (compatible con Excel)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:shadow-indigo-500/25"
              style={{ color: '#ffffff' }}
              title="Imprimir Libro de Compras oficial en Hoja Carta / A4"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Imprimir Hoja Carta</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visor de Documento Imprimible en Hoja Carta */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60 dark:bg-slate-950/60 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div
            id="corte-sheet-letter"
            ref={printContainerRef}
            className="print-sheet-letter bg-white text-slate-900 w-full max-w-[216mm] min-h-[279mm] p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-300 font-sans text-xs leading-normal print:shadow-none print:border-none print:m-0 print:p-0 print:rounded-none"
            style={{ color: '#0f172a' }}
          >
            {/* Membrete Oficial SENIAT */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h1 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    REPÚBLICA BOLIVARIANA DE VENEZUELA
                  </h1>
                  <h2 className="text-base font-black uppercase text-indigo-950 mt-0.5">
                    LIBRO ESPECIAL DE COMPRAS (SENIAT)
                  </h2>
                  <p className="text-[11px] font-bold text-slate-600 mt-0.5">
                    Cumplimiento Obligatorio: Artículo 75 del Reglamento General de la Ley del IVA
                  </p>
                </div>
                <div className="text-right text-[11px] font-mono border-l-2 border-slate-200 pl-4 space-y-0.5">
                  <p><strong>RIF:</strong> {storeInfo.rif || 'J-50000000-0'}</p>
                  <p><strong>CONTRIBUYENTE:</strong> {storeInfo.name || 'KLIKPOS ENTERPRISE'}</p>
                  <p><strong>PERÍODO:</strong> {periodName}</p>
                  <p><strong>FECHA EMISIÓN:</strong> {new Date().toLocaleDateString('es-VE')}</p>
                  <p><strong>TASA BCV:</strong> Bs. {bcvRate.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Resumen Fiscal de Compras (Crédito Fiscal) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-300">
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Compras ($)</span>
                <span className="text-sm font-black text-slate-900">${summary.totalComprasUSD.toFixed(2)}</span>
                <span className="text-[10px] text-slate-600 block">Bs. {summary.totalComprasVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-r border-slate-200 pr-2 pl-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Compras Exentas</span>
                <span className="text-sm font-black text-slate-800">Bs. {summary.totalExentasVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                <span className="text-[10px] text-slate-500 block">${summary.totalExentasUSD.toFixed(2)} USD</span>
              </div>
              <div className="border-r border-slate-200 pr-2 pl-1">
                <span className="text-[10px] font-bold uppercase text-indigo-700 block">Base Imponible (16%)</span>
                <span className="text-sm font-black text-indigo-950">Bs. {summary.totalBaseImponibleVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                <span className="text-[10px] text-indigo-700 block">${summary.totalBaseImponibleUSD.toFixed(2)} USD</span>
              </div>
              <div className="pl-1">
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">Crédito Fiscal IVA (16%)</span>
                <span className="text-sm font-black text-emerald-900">Bs. {summary.totalCreditoFiscalIVA.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                <span className="text-[10px] text-emerald-700 font-bold block">${summary.totalCreditoFiscalIVAUSD.toFixed(2)} USD</span>
              </div>
            </div>

            {/* Tabla Principal del Libro de Compras */}
            <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-wider">
                    <th className="py-2 px-2 border-r border-slate-800 text-center w-8">N°</th>
                    <th className="py-2 px-2 border-r border-slate-800 w-16">Fecha</th>
                    <th className="py-2 px-2 border-r border-slate-800 w-24">RIF Proveedor</th>
                    <th className="py-2 px-2 border-r border-slate-800">Proveedor / Razón Social</th>
                    <th className="py-2 px-2 border-r border-slate-800 text-center w-16">N° Factura</th>
                    <th className="py-2 px-2 border-r border-slate-800 text-center w-20">N° Control</th>
                    <th className="py-2 px-2 border-r border-slate-800 text-right w-20">Total Compra Bs.</th>
                    <th className="py-2 px-2 border-r border-slate-800 text-right w-16">Exento Bs.</th>
                    <th className="py-2 px-2 border-r border-slate-800 text-right w-20">Base Impon. Bs.</th>
                    <th className="py-2 px-2 border-r border-slate-800 text-center w-8">%</th>
                    <th className="py-2 px-2 text-right w-20">Crédito IVA Bs.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-6 text-center text-slate-500 font-sans italic">
                        No hay facturas de compras registradas en este período.
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.operacionNo} className="hover:bg-slate-50 transition-colors">
                        <td className="py-1.5 px-2 text-center text-slate-500 border-r border-slate-200">
                          {r.operacionNo}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-200 whitespace-nowrap">
                          {r.fecha}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-200 font-bold whitespace-nowrap">
                          {r.rifProveedor}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-200 font-sans truncate max-w-[160px]">
                          {r.nombreProveedor}
                        </td>
                        <td className="py-1.5 px-2 text-center border-r border-slate-200 font-bold">
                          {r.nroFactura}
                        </td>
                        <td className="py-1.5 px-2 text-center border-r border-slate-200 text-slate-700">
                          {r.nroControl}
                        </td>
                        <td className="py-1.5 px-2 text-right border-r border-slate-200 font-bold">
                          {r.totalComprasVES.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-right border-r border-slate-200 text-slate-600">
                          {r.comprasExentasVES.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-right border-r border-slate-200 font-bold">
                          {r.baseImponibleVES.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-center border-r border-slate-200">
                          {r.alicuotaIVA}%
                        </td>
                        <td className="py-1.5 px-2 text-right font-black text-slate-900">
                          {r.creditoFiscalIVA.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-400 font-black text-[10px]">
                    <td colSpan={6} className="py-2.5 px-2 text-right uppercase tracking-wider text-slate-800 border-r border-slate-300">
                      Totales Generales:
                    </td>
                    <td className="py-2.5 px-2 text-right border-r border-slate-300 font-mono">
                      Bs. {summary.totalComprasVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-right border-r border-slate-300 font-mono text-slate-700">
                      Bs. {summary.totalExentasVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-right border-r border-slate-300 font-mono text-slate-900">
                      Bs. {summary.totalBaseImponibleVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-slate-300">16%</td>
                    <td className="py-2.5 px-2 text-right font-mono font-black text-slate-950">
                      Bs. {summary.totalCreditoFiscalIVA.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Firmas de Conformidad Tripartita */}
            <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-center text-[10px] mt-6">
              <div>
                <div className="border-b border-dashed border-slate-600 pb-8 mb-1" />
                <p className="font-bold uppercase text-slate-800">Preparado por:</p>
                <p className="text-slate-600 font-mono">Administración / Compras</p>
              </div>
              <div>
                <div className="border-b border-dashed border-slate-600 pb-8 mb-1" />
                <p className="font-bold uppercase text-slate-800">Revisado y Aprobado:</p>
                <p className="text-slate-600 font-mono">Representante Legal</p>
              </div>
              <div>
                <div className="border-b border-dashed border-slate-600 pb-8 mb-1" />
                <p className="font-bold uppercase text-slate-800">Auditoría Contable / Fiscal:</p>
                <p className="text-slate-600 font-mono">Contador Público Colegiado</p>
              </div>
            </div>

            {/* Pie de página legal */}
            <div className="mt-8 pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-500 font-mono">
              <span>KlikPOS Enterprise Fiscal Engine • Providencias SENIAT SNAT/2011/00071 y Art. 75 Ley del IVA</span>
              <span>Conservar físicamente durante 10 años en el establecimiento comercial</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
