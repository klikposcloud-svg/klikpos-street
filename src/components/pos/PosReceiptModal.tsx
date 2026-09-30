'use client';

import React from 'react';
import { LocalSale } from '@/lib/db';
import { formatUSD, formatVES } from '@/lib/formatters';
import { QrCode as QrIcon } from 'lucide-react';

interface PosReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastCompletedSale: LocalSale | null;
  receiptType: 'mixed' | 'fiscal_seniat';
  onSetReceiptType: (type: 'mixed' | 'fiscal_seniat') => void;
  qrReceiptMode: 'medium' | 'large' | 'none';
  onSetQrReceiptMode: (mode: 'medium' | 'large' | 'none') => void;
  ticketQrDataUrl: string;
  storeInfo: {
    name: string;
    rif: string;
    address: string;
    phone?: string;
    logoUrl?: string;
    showLogoOnReceipt?: boolean;
  };
  onPrintReceipt: () => void;
}

export default function PosReceiptModal({
  isOpen,
  onClose,
  lastCompletedSale,
  receiptType,
  onSetReceiptType,
  qrReceiptMode,
  onSetQrReceiptMode,
  ticketQrDataUrl,
  storeInfo,
  onPrintReceipt,
}: PosReceiptModalProps) {
  if (!isOpen || !lastCompletedSale) return null;

  const isCreditSale = Boolean(
    Array.isArray(lastCompletedSale.payments) &&
    lastCompletedSale.payments.some((p) => p.method === 'credit')
  );

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-2xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        {/* Encabezado y Selector de Tipo de Ticket */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isCreditSale ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
            <span className="font-black text-xs uppercase tracking-wider text-slate-100">
              {isCreditSale ? 'Nota de Entrega No Fiscal (Crédito)' : 'Comprobantes de Venta'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-xl leading-none px-1.5 py-0.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Pestañas de Selección de Ticket */}
        <div className="flex border-b border-slate-200 bg-slate-100 p-1.5 gap-1.5 shrink-0">
          {isCreditSale ? (
            <div className="flex-1 py-1.5 px-3 rounded-xl text-xs font-black bg-amber-600 text-white flex items-center justify-center gap-2 shadow-xs">
              <span>📋</span>
              <span>Nota de Entrega / Vale de Fiado (Documento No Fiscal)</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onSetReceiptType('mixed')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  receiptType === 'mixed'
                    ? 'bg-sky-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                <span>🔄</span>
                <span>Ticket Mixto (Cliente)</span>
              </button>
              <button
                type="button"
                onClick={() => onSetReceiptType('fiscal_seniat')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  receiptType === 'fiscal_seniat'
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                <span>🏛️</span>
                <span>Factura SENIAT (Bs)</span>
              </button>
            </>
          )}
        </div>

        {/* Selector de Opciones de Código QR al Pie del Ticket */}
        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
            <QrIcon className="w-3.5 h-3.5 text-sky-600" />
            Código QR al pie:
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onSetQrReceiptMode('medium')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                qrReceiptMode === 'medium'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              title="Código QR tamaño mediano con texto descriptivo debajo"
            >
              Mediano (+ texto)
            </button>
            <button
              type="button"
              onClick={() => onSetQrReceiptMode('large')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                qrReceiptMode === 'large'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              title="Código QR tamaño grande centrado sin texto"
            >
              Grande (sin texto)
            </button>
            <button
              type="button"
              onClick={() => onSetQrReceiptMode('none')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                qrReceiptMode === 'none'
                  ? 'bg-slate-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              title="Ocultar código QR en la impresión"
            >
              Sin QR
            </button>
          </div>
        </div>

        {/* Cuerpo del Ticket con Scroll */}
        <div className="p-4 bg-white font-mono text-xs text-slate-900 space-y-2 overflow-y-auto flex-1 border-b border-slate-200">
          {receiptType === 'mixed' || isCreditSale ? (
            /* 1. TICKET MIXTO / NOTA DE ENTREGA NO FISCAL */
            <div id="thermal-receipt" className="space-y-2">
              <div className="text-center space-y-0.5">
                {storeInfo.showLogoOnReceipt && storeInfo.logoUrl && (
                  <div className="flex justify-center pb-1">
                    <img
                      src={storeInfo.logoUrl}
                      alt="Logo Negocio"
                      className="max-h-14 max-w-[170px] object-contain filter grayscale contrast-125 mx-auto"
                    />
                  </div>
                )}
                <h4 className="font-black text-sm text-slate-950 uppercase">
                  {storeInfo.name}
                </h4>
                <p className="text-[11px] font-black text-slate-800">RIF: {storeInfo.rif}</p>
                <p className="text-[10px] text-slate-600">{storeInfo.address}</p>
                {storeInfo.phone && <p className="text-[10px] text-slate-600">TELF: {storeInfo.phone}</p>}
                <div className="mt-1 pt-1 border-t border-slate-300">
                  <span className={`font-black text-xs tracking-wider px-2 py-0.5 rounded uppercase text-white ${
                    isCreditSale ? 'bg-amber-700' : 'bg-slate-900'
                  }`}>
                    {isCreditSale ? 'VALE DE ENTREGA A CRÉDITO' : 'COMPROBANTE DE VENTA'}
                  </span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-400 py-1.5 space-y-0.5 text-[11px]">
                <div className="flex justify-between font-bold">
                  <span>TICKET N°:</span>
                  <span className="font-mono text-slate-950">{lastCompletedSale.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">FECHA:</span>
                  <span>{new Date(lastCompletedSale.timestamp).toLocaleDateString('es-VE')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">HORA:</span>
                  <span>{new Date(lastCompletedSale.timestamp).toLocaleTimeString('es-VE')}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-600">CLIENTE:</span>
                  <span className="font-bold">{lastCompletedSale.customerName || 'CLIENTE GENERAL'}</span>
                </div>
              </div>

              {/* Renglones */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-bold text-slate-700 border-b border-slate-300 pb-0.5 text-[10px]">
                  <span>CANT / PRODUCTO</span>
                  <span className="text-right">TOTAL</span>
                </div>
                {lastCompletedSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-baseline gap-1">
                    <span className="flex-1 min-w-0 pr-1 truncate font-bold">
                      {it.qty}x {it.name}
                    </span>
                    <span className="font-bold tabular-numbers text-right shrink-0 whitespace-nowrap">
                      ${it.totalUSD.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="border-t-2 border-slate-900 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between font-black text-sm text-slate-950">
                  <span>TOTAL USD:</span>
                  <span className="font-mono text-base">${lastCompletedSale.totalUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-emerald-800">
                  <span>TOTAL BS (BCV):</span>
                  <span className="font-mono text-base">Bs. {lastCompletedSale.totalVES.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-dashed border-slate-300">
                  <span>Tasa Oficial BCV:</span>
                  <span>Bs. {lastCompletedSale.bcvRate.toFixed(2)} / USD</span>
                </div>
              </div>

              {/* QR opcional */}
              {qrReceiptMode !== 'none' && ticketQrDataUrl && (
                <div className="pt-2 flex flex-col items-center justify-center border-t border-slate-200">
                  <img
                    src={ticketQrDataUrl}
                    alt="Ticket QR"
                    className={`${qrReceiptMode === 'large' ? 'w-28 h-28' : 'w-20 h-20'} object-contain`}
                  />
                  {qrReceiptMode === 'medium' && (
                    <span className="text-[9px] text-slate-500 mt-1">Escanea para verificar este ticket digitalmente</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* 2. FACTURA SENIAT */
            <div id="thermal-receipt" className="space-y-2">
              <div className="text-center space-y-0.5">
                <h4 className="font-black text-sm text-slate-950 uppercase tracking-tight">
                  {storeInfo.name}
                </h4>
                <p className="text-[11px] font-black text-slate-800">RIF: {storeInfo.rif}</p>
                <p className="text-[10px] text-slate-600">DOMICILIO FISCAL: {storeInfo.address.toUpperCase()}</p>
                {storeInfo.phone && <p className="text-[10px] text-slate-600">TELF: {storeInfo.phone}</p>}
                <div className="mt-1 pt-1 border-t border-slate-300">
                  <span className="font-black text-xs tracking-wider bg-slate-900 text-white px-3 py-0.5 rounded uppercase">
                    FACTURA FISCAL
                  </span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-400 py-1.5 space-y-0.5 text-[11px]">
                <div className="flex justify-between font-bold">
                  <span>FACTURA N°:</span>
                  <span className="font-mono text-slate-950">FACT-{lastCompletedSale.receiptNumber.replace(/[^0-9]/g, '').slice(-8) || '00000042'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">FECHA DE EMISIÓN:</span>
                  <span>{new Date(lastCompletedSale.timestamp).toLocaleDateString('es-VE')}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-600">CLIENTE / RAZÓN SOCIAL:</span>
                  <span className="font-bold">{lastCompletedSale.customerName || 'CLIENTE GENERAL'}</span>
                </div>
              </div>

              {/* Renglones SENIAT */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-bold text-slate-700 border-b border-slate-300 pb-0.5 text-[10px]">
                  <span>CANT / DESCRIPCIÓN</span>
                  <span className="text-right">TOTAL BS. (ALÍC.)</span>
                </div>
                {lastCompletedSale.items.map((it, idx) => {
                  const itemTotalBs = it.totalUSD * lastCompletedSale.bcvRate;
                  return (
                    <div key={idx} className="flex justify-between items-baseline gap-1">
                      <span className="flex-1 min-w-0 pr-1 truncate font-bold">
                        {it.qty}x {it.name}
                      </span>
                      <span className="font-bold tabular-numbers text-right shrink-0 whitespace-nowrap">
                        Bs. {itemTotalBs.toFixed(2)} (G)
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Liquidación SENIAT */}
              {(() => {
                const totalVES = lastCompletedSale.totalVES;
                const baseImponible = totalVES / 1.16;
                const iva16 = totalVES - baseImponible;
                const hasForeignPay = Array.isArray(lastCompletedSale.payments) &&
                  lastCompletedSale.payments.some((p) => ['cash_usd', 'binance', 'zelle'].includes(p.method));
                const igtfMonto = hasForeignPay ? (totalVES * 0.03) : 0;
                const granTotalBs = totalVES + igtfMonto;

                return (
                  <div className="border-t-2 border-slate-900 pt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-700">
                      <span>BASE IMPONIBLE (G 16.00%):</span>
                      <span className="font-mono font-bold">Bs. {baseImponible.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>IVA (16%):</span>
                      <span className="font-mono font-bold">Bs. {iva16.toFixed(2)}</span>
                    </div>
                    {hasForeignPay && (
                      <div className="flex justify-between text-indigo-900 font-semibold bg-indigo-50 px-1 py-0.5 rounded">
                        <span>IGTF (3.00%):</span>
                        <span className="font-mono font-bold">Bs. {igtfMonto.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-400 pt-1 flex justify-between font-black text-sm text-slate-950 bg-slate-100 p-1.5 rounded">
                      <span>TOTAL FACTURADO BS:</span>
                      <span className="font-mono text-base">Bs. {granTotalBs.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Botones de Acción e Impresión */}
        <div className="p-3 bg-slate-100 flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-3 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={onPrintReceipt}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors text-white cursor-pointer ${
              isCreditSale ? 'bg-amber-600 hover:bg-amber-700' : 'bg-sky-700 hover:bg-sky-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>{isCreditSale ? 'Imprimir Vale de Fiado (No Fiscal)' : 'Imprimir Este Ticket'}</span>
          </button>
          {!isCreditSale && (
            <button
              type="button"
              onClick={() => {
                onSetReceiptType(receiptType === 'mixed' ? 'fiscal_seniat' : 'mixed');
                setTimeout(() => onPrintReceipt(), 200);
              }}
              className="py-2 px-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Cambiar al otro formato e imprimir"
            >
              <span>{receiptType === 'mixed' ? '📄 Imprimir Fiscal SENIAT' : '🔄 Imprimir Ticket Mixto'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
