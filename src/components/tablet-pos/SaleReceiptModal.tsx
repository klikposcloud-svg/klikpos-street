'use client';

import React from 'react';
import { X, Printer, Share2 } from 'lucide-react';
import { CompletedSaleTicket, CompanyInfo } from '@/types/tablet-pos';

interface SaleReceiptModalProps {
  completedSaleTicket: CompletedSaleTicket | null;
  onClose: () => void;
  onNewSale: () => void;
  companyInfo: CompanyInfo;
  isLight: boolean;
  primaryColor: string;
}

export function SaleReceiptModal({
  completedSaleTicket,
  onClose,
  onNewSale,
  companyInfo,
  isLight,
  primaryColor,
}: SaleReceiptModalProps) {
  if (!completedSaleTicket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`border rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl relative ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 active:scale-90 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Ticket */}
        <div className="text-center space-y-1 border-b pb-3 border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
            {companyInfo.name}
          </h3>
          <p className="text-[10px] font-mono text-slate-500">
            RIF: {companyInfo.rif} • Tel: {companyInfo.phone}
          </p>
          <p className="text-[9px] text-slate-400">
            {companyInfo.address}
          </p>
          <div className="text-[10px] font-mono font-bold text-slate-500 pt-1">
            Ticket: <b>{completedSaleTicket.ticketNumber}</b> • {completedSaleTicket.timestamp}
          </div>
        </div>

        {/* Cliente */}
        <div className="text-xs font-mono border-b pb-2 border-slate-200 dark:border-slate-800 space-y-0.5">
          <p><b>Cliente:</b> {completedSaleTicket.customer.name}</p>
          <p><b>Cédula/RIF:</b> {completedSaleTicket.customer.docId}</p>
          {completedSaleTicket.table && <p><b>Ubicación:</b> {completedSaleTicket.table}</p>}
        </div>

        {/* Desglose de Productos */}
        <div className="max-h-36 overflow-y-auto space-y-1 text-xs font-mono border-b pb-2 border-slate-200 dark:border-slate-800">
          {completedSaleTicket.items.map((it) => (
            <div key={it.id} className="flex justify-between items-baseline">
              <span className="truncate pr-2">
                {it.qty}x {it.name}
              </span>
              <span className="shrink-0 font-bold">
                ${(it.priceUSD * it.qty).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Totales y Método de Pago */}
        <div className="text-xs font-mono space-y-1">
          <div className="flex justify-between font-black text-sm">
            <span>TOTAL USD:</span>
            <span style={{ color: primaryColor }}>
              ${completedSaleTicket.totalUSD.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between font-bold">
            <span>TOTAL BS (BCV):</span>
            <span>Bs. {completedSaleTicket.totalVES.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500 text-[10px]">
            <span>Método de Pago:</span>
            <span className="uppercase font-bold">{completedSaleTicket.paymentMethod}</span>
          </div>
          {completedSaleTicket.reference && (
            <div className="flex justify-between text-slate-500 text-[10px]">
              <span>Referencia:</span>
              <span className="font-bold">{completedSaleTicket.reference}</span>
            </div>
          )}
          {completedSaleTicket.mixedPayments && completedSaleTicket.mixedPayments.length > 0 && (
            <div className="py-1.5 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-1 my-1">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Desglose Pago Mixto:</span>
              {completedSaleTicket.mixedPayments.map((p, idx) => {
                const methodNames: Record<string, string> = {
                  cash_usd: 'Efectivo $',
                  cash_ves: 'Efectivo Bs',
                  pago_movil: 'Pago Móvil',
                  card_debit: 'Punto Débito',
                  zelle: 'Zelle'
                };
                return (
                  <div key={idx} className="flex justify-between text-[10px] font-mono text-slate-600 dark:text-slate-300">
                    <span>{methodNames[p.method] || p.method}{p.reference ? ` (${p.reference})` : ''}:</span>
                    <span className="font-bold">{p.currency === 'USD' ? `$${p.amount.toFixed(2)}` : `Bs. ${p.amount.toFixed(2)}`}</span>
                  </div>
                );
              })}
            </div>
          )}
          {completedSaleTicket.changeUSD !== undefined && completedSaleTicket.changeUSD > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold text-[11px]">
              <span>Vuelto Entregado:</span>
              <span>${completedSaleTicket.changeUSD.toFixed(2)} / Bs. {completedSaleTicket.changeVES?.toFixed(2)}</span>
            </div>
          )}
        </div>

        <p className="text-[10px] text-center italic text-slate-400 pt-1">
          "{companyInfo.footerMsg}"
        </p>

        {/* Botones de Acción */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.print();
            }}
            className="py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Ticket</span>
          </button>
          <button
            onClick={() => {
              const receiptText = `*${companyInfo.name}*\n` +
                `RIF: ${companyInfo.rif}\n` +
                `Ticket: ${completedSaleTicket.ticketNumber}\n` +
                `Cliente: ${completedSaleTicket.customer.name}\n` +
                `Total: $${completedSaleTicket.totalUSD.toFixed(2)} USD (Bs. ${completedSaleTicket.totalVES.toFixed(2)})\n` +
                `Pago: ${completedSaleTicket.paymentMethod} (Ref: ${completedSaleTicket.reference || 'N/A'})\n` +
                `¡Gracias por su compra!`;
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(receiptText)}`, '_blank');
            }}
            className="py-2 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 active:scale-95 bg-emerald-600 hover:bg-emerald-500 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>

        <button
          onClick={onNewSale}
          className="w-full py-2.5 text-white text-xs font-black rounded-xl shadow-md active:scale-95 cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          Nueva Venta
        </button>
      </div>
    </div>
  );
}
