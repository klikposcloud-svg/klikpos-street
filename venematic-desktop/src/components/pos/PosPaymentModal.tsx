'use client';

import React, { useState } from 'react';
import { formatUSD, formatVES } from '@/lib/formatters';
import { LocalCustomer, SalePayment } from '@/lib/db';
import { PagoMovilConfirmation } from '@/lib/payments/pago-movil-gmail-monitor';
import { Users, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';

interface PosPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bcvRate: number;
  totalUSD: number;
  totalVES: number;
  selectedPaymentMethod: 'cash_usd' | 'cash_ves' | 'pago_movil' | 'card_debit' | 'binance' | 'mixed' | 'credit';
  onSelectPaymentMethod: (method: 'cash_usd' | 'cash_ves' | 'pago_movil' | 'card_debit' | 'binance' | 'mixed' | 'credit') => void;
  cashGivenUSD: string;
  setCashGivenUSD: (val: string) => void;
  cashGivenVES: string;
  setCashGivenVES: (val: string) => void;
  cardDebitRef: string;
  setCardDebitRef: (val: string) => void;
  binanceRef: string;
  setBinanceRef: (val: string) => void;
  pagoMovilRef: string;
  setPagoMovilRef: (val: string) => void;
  pagoMovilDuplicateAlert: {
    isDuplicate: boolean;
    receiptNumber?: string;
    date?: string;
    amountVES?: number;
  } | null;
  onCheckDuplicateReference: (ref: string) => void;
  pagoMovilAutoStatus: 'idle' | 'monitoring' | 'confirmed' | 'error';
  pagoMovilAutoConfirmation: PagoMovilConfirmation | null;
  pagoMovilGmailConfigured: boolean;
  customersList: LocalCustomer[];
  selectedCreditCustomer: LocalCustomer | null;
  onSelectCreditCustomer: (c: LocalCustomer | null) => void;
  mixedPayments: SalePayment[];
  onAddMixedPayment: (payment: SalePayment) => void;
  onRemoveMixedPayment: (id: string) => void;
  receiptType: 'mixed' | 'fiscal_seniat';
  onSetReceiptType: (type: 'mixed' | 'fiscal_seniat') => void;
  onCompleteSale: () => void;
}

export default function PosPaymentModal({
  isOpen,
  onClose,
  bcvRate,
  totalUSD,
  totalVES,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  cashGivenUSD,
  setCashGivenUSD,
  cashGivenVES,
  setCashGivenVES,
  cardDebitRef,
  setCardDebitRef,
  binanceRef,
  setBinanceRef,
  pagoMovilRef,
  setPagoMovilRef,
  pagoMovilDuplicateAlert,
  onCheckDuplicateReference,
  pagoMovilAutoStatus,
  pagoMovilAutoConfirmation,
  pagoMovilGmailConfigured,
  customersList,
  selectedCreditCustomer,
  onSelectCreditCustomer,
  mixedPayments,
  onAddMixedPayment,
  onRemoveMixedPayment,
  receiptType,
  onSetReceiptType,
  onCompleteSale,
}: PosPaymentModalProps) {
  const [mixedMethod, setMixedMethod] = useState<'cash_usd' | 'cash_ves' | 'pago_movil' | 'card_debit' | 'binance' | 'zelle'>('cash_usd');
  const [mixedCurrency, setMixedCurrency] = useState<'USD' | 'VES'>('USD');
  const [mixedAmount, setMixedAmount] = useState<string>('');
  const [mixedRef, setMixedRef] = useState<string>('');

  if (!isOpen) return null;

  // Cálculos de vuelto y montos recibidos
  const isVESPayment = selectedPaymentMethod === 'cash_ves' || selectedPaymentMethod === 'pago_movil' || selectedPaymentMethod === 'card_debit';
  const numGivenUSD = parseFloat(cashGivenUSD) || 0;
  const numGivenVES = parseFloat(cashGivenVES) || 0;
  const convertedGivenUSD = isVESPayment ? (bcvRate > 0 ? numGivenVES / bcvRate : 0) : numGivenUSD;
  const convertedGivenVES = isVESPayment ? numGivenVES : numGivenUSD * bcvRate;

  const changeUSD = Math.max(0, convertedGivenUSD - totalUSD);
  const changeVES = Math.max(0, convertedGivenVES - totalVES);
  const pendingUSD = Math.max(0, totalUSD - convertedGivenUSD);
  const pendingVES = Math.max(0, totalVES - convertedGivenVES);
  const isCompletePayment = isVESPayment ? numGivenVES >= totalVES - 0.05 : numGivenUSD >= totalUSD - 0.01;

  // Cálculos de Pago Mixto
  const mixedPaidUSD = mixedPayments.reduce((sum, p) => sum + p.amountUSD, 0);
  const mixedPaidVES = mixedPayments.reduce((sum, p) => sum + p.amountVES, 0);
  const mixedPendingUSD = Math.max(0, totalUSD - mixedPaidUSD);
  const mixedPendingVES = Math.max(0, totalVES - mixedPaidVES);
  const mixedChangeUSD = Math.max(0, mixedPaidUSD - totalUSD);
  const mixedChangeVES = Math.max(0, mixedPaidVES - totalVES);
  const isMixedComplete = mixedPaidUSD >= totalUSD - 0.01 || mixedPaidVES >= totalVES - 0.05;

  const handleAddMixed = () => {
    const amt = parseFloat(mixedAmount);
    if (isNaN(amt) || amt <= 0) return;

    let amtUSD = 0;
    let amtVES = 0;
    if (mixedCurrency === 'USD') {
      amtUSD = amt;
      amtVES = amt * bcvRate;
    } else {
      amtVES = amt;
      amtUSD = bcvRate > 0 ? amt / bcvRate : 0;
    }

    const newPayment: SalePayment = {
      id: String(Date.now()),
      method: mixedMethod,
      amountUSD: amtUSD,
      amountVES: amtVES,
      reference: mixedRef.trim() || undefined,
    };

    onAddMixedPayment(newPayment);
    setMixedAmount('');
    setMixedRef('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Cabecera del Modal de Cobro */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
              💳
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight text-white">
                Finalizar Venta y Cobro
              </h3>
              <p className="text-xs text-slate-400">
                Tasa Oficial BCV: <b className="text-emerald-400 font-mono">Bs. {bcvRate.toFixed(2)}</b> / USD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right leading-tight">
              <span className="text-2xl font-black font-sans text-white block tabular-numbers">
                ${totalUSD.toFixed(2)}
              </span>
              <span className="text-sm font-black font-mono text-emerald-400 block tabular-numbers">
                {formatVES(totalVES)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-lg transition-colors border border-slate-700 cursor-pointer"
              title="Cerrar (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
          {/* Selector de Métodos de Pago en Tarjetas Fluidas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>Selecciona la Forma de Pago:</span>
              </label>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium hidden sm:inline-block">
                {selectedPaymentMethod === 'cash_usd' && '💵 Efectivo en Dólares ($)'}
                {selectedPaymentMethod === 'cash_ves' && '🇻🇪 Efectivo en Bolívares (Bs.)'}
                {selectedPaymentMethod === 'pago_movil' && '📲 Pago Móvil Interbancario'}
                {selectedPaymentMethod === 'card_debit' && '💳 Tarjeta de Débito / Punto de Venta'}
                {selectedPaymentMethod === 'binance' && '🟡 Binance Pay USDT (1:1)'}
                {selectedPaymentMethod === 'mixed' && '🔄 Pago Mixto / Combinado'}
                {selectedPaymentMethod === 'credit' && '🤝 Venta a Crédito / Fiado'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {[
                { id: 'cash_usd', icon: '💵', label: 'Efectivo $', sub: 'Dólares' },
                { id: 'cash_ves', icon: '🇻🇪', label: 'Efectivo Bs', sub: 'Bolívares' },
                { id: 'pago_movil', icon: '📲', label: 'Pago Móvil', sub: 'Inmediato' },
                { id: 'card_debit', icon: '💳', label: 'Punto Débito', sub: 'Voucher' },
                { id: 'binance', icon: '🟡', label: 'Binance', sub: 'USDT Pay' },
                { id: 'mixed', icon: '🔄', label: 'Pago Mixto', sub: 'Multimoneda' },
                { id: 'credit', icon: '🤝', label: 'Fiado', sub: 'A Crédito' },
              ].map((m) => {
                const isSelected = selectedPaymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectPaymentMethod(m.id as any)}
                    className={`h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center p-2 text-center active:scale-95 cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-sky-700 text-white border-sky-500 ring-4 ring-sky-500/25 shadow-lg font-black scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <span className="text-2xl mb-0.5 filter drop-shadow-xs group-hover:scale-110 transition-transform">
                      {m.icon}
                    </span>
                    <span className="text-xs font-black leading-tight block truncate w-full">
                      {m.label}
                    </span>
                    <span className={`text-[10px] font-medium leading-tight block opacity-80 ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                      {m.sub}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de Cliente si es A Crédito (Fiado) */}
          {selectedPaymentMethod === 'credit' && (
            <div className="bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-800/40">
                <span className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-300">
                    <Users className="w-5 h-5" />
                  </div>
                  <span>Seleccionar Cliente para Venta a Crédito (Fiado)</span>
                </span>
                <span className="text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/50 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700">
                  Cuenta Corriente / Crédito
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1.5">
                  Buscar y seleccionar cliente registrado:
                </label>
                <select
                  value={selectedCreditCustomer?.id || ''}
                  onChange={(e) => {
                    const cid = Number(e.target.value);
                    const c = customersList.find((item) => item.id === cid) || null;
                    onSelectCreditCustomer(c);
                  }}
                  className="w-full h-12 px-4 bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 shadow-xs cursor-pointer"
                >
                  <option value="">-- Haz clic aquí para seleccionar el cliente --</option>
                  {customersList.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} ({cust.docId}) — Deuda Actual: ${cust.currentDebtUSD || 0} / Límite: ${cust.creditLimitUSD || 100}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCreditCustomer ? (
                <div className="p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-amber-200 dark:border-amber-800/60 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-slate-400 block">Titular del Crédito</span>
                      <strong className="text-base text-slate-900 dark:text-white font-black">{selectedCreditCustomer.name}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] uppercase font-bold text-slate-400 block">Documento / Cédula</span>
                      <span className="font-mono font-black text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        {selectedCreditCustomer.docId}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Deuda Acumulada</span>
                      <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 block mt-0.5">
                        ${(selectedCreditCustomer.currentDebtUSD || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Límite Aprobado</span>
                      <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-200 block mt-0.5">
                        ${(selectedCreditCustomer.creditLimitUSD || 100).toFixed(2)}
                      </span>
                    </div>

                    {(() => {
                      const available = Math.max(0, (selectedCreditCustomer.creditLimitUSD || 100) - (selectedCreditCustomer.currentDebtUSD || 0));
                      const canCover = available >= totalUSD;
                      return (
                        <div className={`p-3 rounded-xl border text-center ${
                          canCover
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                        }`}>
                          <span className="text-[11px] font-bold uppercase block">Crédito Disponible</span>
                          <span className="text-lg font-black font-mono block mt-0.5">
                            ${available.toFixed(2)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {totalUSD > Math.max(0, (selectedCreditCustomer.creditLimitUSD || 100) - (selectedCreditCustomer.currentDebtUSD || 0)) && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold">
                      <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                      <span>¡Atención! El monto total de la venta (${totalUSD.toFixed(2)}) supera el cupo de crédito disponible del cliente (${Math.max(0, (selectedCreditCustomer.creditLimitUSD || 100) - (selectedCreditCustomer.currentDebtUSD || 0)).toFixed(2)}).</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-amber-100/50 dark:bg-amber-900/20 border border-dashed border-amber-300 dark:border-amber-700/60 rounded-xl text-center">
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                    Selecciona un cliente del menú desplegable para verificar su disponibilidad de crédito y cargar la cuenta.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SECCIÓN PAGO MIXTO / MULTIMONEDA */}
          {selectedPaymentMethod === 'mixed' && (
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Cuenta</span>
                  <span className="text-xl font-black font-mono text-slate-900 dark:text-white block mt-0.5">${totalUSD.toFixed(2)}</span>
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 block mt-0.5">Bs. {totalVES.toFixed(2)}</span>
                </div>

                <div className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Abonado</span>
                  <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">${mixedPaidUSD.toFixed(2)}</span>
                  <span className="text-xs font-mono font-bold text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5">Bs. {mixedPaidVES.toFixed(2)}</span>
                </div>

                <div className={`p-3.5 rounded-2xl border-2 transition-all ${
                  isMixedComplete
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200 shadow-sm'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-200 shadow-sm'
                }`}>
                  <span className="text-[10px] uppercase font-bold block tracking-wider">
                    {isMixedComplete ? 'Vuelto / Cambio' : 'Falta por Cobrar'}
                  </span>
                  <span className="text-xl font-black font-mono block mt-0.5">
                    {isMixedComplete ? `$${mixedChangeUSD.toFixed(2)}` : `$${mixedPendingUSD.toFixed(2)}`}
                  </span>
                  <span className="text-xs font-mono font-bold block mt-0.5 opacity-90">
                    {isMixedComplete ? `Bs. ${mixedChangeVES.toFixed(2)}` : `Bs. ${mixedPendingVES.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Formulario de Abono */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-xs">
                <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider block">
                  + Agregar Método y Monto de Abono:
                </span>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'cash_usd', label: 'Efectivo $', cur: 'USD', icon: '💵' },
                    { id: 'cash_ves', label: 'Efectivo Bs', cur: 'VES', icon: '🇻🇪' },
                    { id: 'pago_movil', label: 'Pago Móvil', cur: 'VES', icon: '📲' },
                    { id: 'card_debit', label: 'Punto Débito', cur: 'VES', icon: '💳' },
                    { id: 'binance', label: 'Binance USDT', cur: 'USD', icon: '🟡' },
                    { id: 'zelle', label: 'Zelle $', cur: 'USD', icon: '⚡' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMixedMethod(item.id as any);
                        setMixedCurrency(item.cur as any);
                        if (item.cur === 'USD') {
                          setMixedAmount(mixedPendingUSD > 0 ? mixedPendingUSD.toFixed(2) : '');
                        } else {
                          setMixedAmount(mixedPendingVES > 0 ? mixedPendingVES.toFixed(2) : '');
                        }
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        mixedMethod === item.id
                          ? 'bg-sky-700 text-white border-sky-500 shadow-sm font-black'
                          : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-5 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                      {mixedCurrency === 'USD' ? '$' : 'Bs.'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Monto a abonar"
                      value={mixedAmount}
                      onChange={(e) => setMixedAmount(e.target.value)}
                      className="w-full h-11 pl-9 pr-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-base font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      maxLength={12}
                      placeholder={
                        mixedMethod === 'cash_usd' || mixedMethod === 'cash_ves'
                          ? 'Sin ref. (Efectivo)'
                          : 'Últimos 4 dígitos Ref.'
                      }
                      disabled={mixedMethod === 'cash_usd' || mixedMethod === 'cash_ves'}
                      value={mixedRef}
                      onChange={(e) => setMixedRef(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-40"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAddMixed}
                      className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <span>+ Agregar Abono</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Abonos */}
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 block mb-2">
                  Abonos Registrados ({mixedPayments.length}):
                </span>
                {mixedPayments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-4 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    Aún no has agregado abonos. Selecciona el método arriba, escribe el monto y presiona "+ Agregar Abono".
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {mixedPayments.map((p, idx) => (
                      <div
                        key={p.id}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between shadow-2xs text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block text-sm">
                              {p.method === 'cash_usd' ? '💵 Efectivo $' :
                               p.method === 'cash_ves' ? '🇻🇪 Efectivo Bs' :
                               p.method === 'pago_movil' ? '📲 Pago Móvil' :
                               p.method === 'card_debit' ? '💳 Punto Débito' :
                               p.method === 'binance' ? '🟡 Binance USDT' :
                               p.method === 'zelle' ? '⚡ Zelle' : p.method}
                            </span>
                            {p.reference && (
                              <span className="text-[11px] font-mono text-slate-400">
                                Ref: {p.reference}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right font-mono">
                            <span className="font-black text-slate-900 dark:text-white block text-sm">${p.amountUSD.toFixed(2)}</span>
                            <span className="text-xs text-amber-600 dark:text-amber-400 block">Bs. {p.amountVES.toFixed(2)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveMixedPayment(p.id || String(idx))}
                            className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center font-bold text-base cursor-pointer transition-colors"
                            title="Eliminar abono"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECCIONES DE PAGO ÚNICO */}
          {selectedPaymentMethod !== 'mixed' && selectedPaymentMethod !== 'credit' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Billetes Rápidos en USD */}
              {selectedPaymentMethod === 'cash_usd' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Billetes y Montos Rápidos ($):
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Haz clic para auto-rellenar</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                    <button
                      type="button"
                      onClick={() => setCashGivenUSD(totalUSD.toFixed(2))}
                      className="h-11 rounded-xl border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-900 dark:text-emerald-200 font-black text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      Exacto (${totalUSD.toFixed(2)})
                    </button>
                    {['1', '5', '10', '20', '50', '100'].map((bill) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => setCashGivenUSD(bill)}
                        className="h-11 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-mono font-black text-sm text-slate-800 dark:text-white shadow-2xs active:scale-95 transition-all cursor-pointer"
                      >
                        ${bill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Billetes Rápidos en Bolívares */}
              {selectedPaymentMethod === 'cash_ves' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Montos Rápidos en Bolívares (Bs.):
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Haz clic para auto-rellenar</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    <button
                      type="button"
                      onClick={() => setCashGivenVES(totalVES.toFixed(2))}
                      className="h-11 rounded-xl border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-900 dark:text-emerald-200 font-black text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      Exacto (Bs. {totalVES.toFixed(2)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashGivenVES(String(Math.ceil(totalVES)))}
                      className="h-11 rounded-xl border-2 border-sky-400 dark:border-sky-600 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-900 dark:text-sky-200 font-black text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                      title="Redondear al entero superior"
                    >
                      Redondo (Bs. {Math.ceil(totalVES)})
                    </button>
                    {['500', '1000', '2000', '5000'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashGivenVES(amt)}
                        className="h-11 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-mono font-black text-xs text-slate-800 dark:text-white shadow-2xs active:scale-95 transition-all cursor-pointer"
                      >
                        Bs. {amt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Panel Entrada de Monto y Vuelto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block">
                        {isVESPayment ? 'Monto Recibido del Cliente (Bs):' : 'Monto Recibido del Cliente ($):'}
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {isVESPayment ? 'VES' : 'USD'}
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400 font-mono">
                        {isVESPayment ? 'Bs.' : '$'}
                      </span>
                      {isVESPayment ? (
                        <input
                          type="number"
                          step="0.01"
                          value={cashGivenVES}
                          onChange={(e) => setCashGivenVES(e.target.value)}
                          className="w-full h-16 pl-14 pr-4 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-2xl text-right font-mono font-black text-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 shadow-xs"
                          placeholder="0.00"
                          autoFocus
                        />
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          value={cashGivenUSD}
                          onChange={(e) => setCashGivenUSD(e.target.value)}
                          className="w-full h-16 pl-12 pr-4 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-2xl text-right font-mono font-black text-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 shadow-xs"
                          placeholder="0.00"
                          autoFocus
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-xs">
                    <span className="text-sky-900 dark:text-sky-300 font-bold flex items-center gap-1.5">
                      <span>💱</span>
                      <span>Equivalente en tiempo real:</span>
                    </span>
                    <span className="font-mono font-black text-sky-800 dark:text-sky-200 text-sm tabular-numbers">
                      {isVESPayment ? (
                        <>≈ {formatUSD(convertedGivenUSD)}</>
                      ) : (
                        <>≈ {formatVES(convertedGivenVES)}</>
                      )}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-5 rounded-2xl border-2 flex flex-col justify-between transition-all shadow-md ${
                    isCompletePayment
                      ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-400 text-white'
                      : 'bg-gradient-to-br from-rose-600 to-rose-700 border-rose-400 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/20">
                    <span className="text-xs font-black uppercase tracking-wider block text-white drop-shadow-sm">
                      {isCompletePayment ? '✓ Vuelto / Cambio a Entregar:' : '⚠️ Monto Faltante por Pagar:'}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                      {isCompletePayment ? 'Pago Completo' : 'Pendiente'}
                    </span>
                  </div>

                  <div className="py-4 text-center">
                    {isCompletePayment ? (
                      <>
                        <span className="text-4xl font-black font-mono text-white block tabular-numbers tracking-tight drop-shadow-md">
                          {isVESPayment ? formatVES(changeVES) : formatUSD(changeUSD)}
                        </span>
                        <span className="text-sm font-bold font-mono text-emerald-100 block tabular-numbers mt-1.5 opacity-90">
                          ≈ {isVESPayment ? formatUSD(changeUSD) : formatVES(changeVES)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-black font-mono text-white block tabular-numbers tracking-tight drop-shadow-md">
                          Faltan {isVESPayment ? formatVES(pendingVES) : formatUSD(pendingUSD)}
                        </span>
                        <span className="text-xs font-bold font-mono text-rose-100 block tabular-numbers mt-1.5 opacity-90">
                          ≈ {isVESPayment ? formatUSD(pendingUSD) : formatVES(pendingVES)}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/20 text-center">
                    <span className="text-xs font-semibold text-white/90">
                      {isCompletePayment
                        ? 'Diferencia a favor del cliente lista para entregar'
                        : 'Ingresa el monto recibido completo para habilitar la confirmación'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pago Móvil Específico */}
              {selectedPaymentMethod === 'pago_movil' && (
                <div className={`p-4 rounded-2xl border-2 space-y-3 transition-colors ${
                  pagoMovilAutoStatus === 'confirmed'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600'
                    : pagoMovilAutoStatus === 'monitoring'
                    ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                }`}>
                  {pagoMovilAutoStatus === 'confirmed' && pagoMovilAutoConfirmation && (
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">✅</span>
                      <div className="flex-1">
                        <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">¡Pago Móvil Confirmado Automáticamente!</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                          Banco: {pagoMovilAutoConfirmation.bancoOrigen} · Bs. {pagoMovilAutoConfirmation.monto.toFixed(2)}
                        </p>
                        <p className="text-xs font-mono font-bold text-emerald-900 dark:text-emerald-200 mt-1">
                          Ref: {pagoMovilAutoConfirmation.referencia}
                        </p>
                      </div>
                    </div>
                  )}

                  {pagoMovilAutoStatus === 'monitoring' && (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-blue-800 dark:text-blue-300">Esperando confirmación por Gmail...</p>
                        <p className="text-[11px] text-blue-600 dark:text-blue-400">El sistema verificará el email bancario automáticamente</p>
                      </div>
                    </div>
                  )}

                  {(pagoMovilAutoStatus === 'idle' || pagoMovilAutoStatus === 'error') && (
                    <>
                      {!pagoMovilGmailConfigured && (
                        <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
                          <span>💡</span>
                          <span>Conecta Gmail en <b>Configuración → Pagos</b> para confirmación automática</span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Comprobante / Referencia de Pago Móvil:
                          </label>
                          <span className="text-[10.5px] font-black text-sky-600 dark:text-sky-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> KlikPOS Shield Antifraude
                          </span>
                        </div>
                        <input
                          type="text"
                          maxLength={20}
                          placeholder="Ej: 00123456789 (mínimo 4 dígitos)"
                          value={pagoMovilRef}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPagoMovilRef(val);
                            onCheckDuplicateReference(val);
                          }}
                          className={`w-full h-11 px-4 border-2 rounded-xl text-sm font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none transition-colors ${
                            pagoMovilDuplicateAlert?.isDuplicate
                              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20'
                              : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500'
                          }`}
                        />

                        {pagoMovilDuplicateAlert?.isDuplicate && (
                          <div className="mt-2.5 p-3 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 rounded-xl flex items-start gap-2.5 text-rose-900 dark:text-rose-200 shadow-sm animate-pulse">
                            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div className="text-xs leading-snug">
                              <p className="font-black text-rose-700 dark:text-rose-300">🚨 ¡ALERTA ANTIFRAUDE! REFERENCIA DUPLICADA</p>
                              <p className="mt-0.5">
                                Esta referencia ya fue registrada en el <b>Ticket #{pagoMovilDuplicateAlert.receiptNumber}</b> por <b>Bs. {pagoMovilDuplicateAlert.amountVES?.toFixed(2)}</b>.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Punto Débito */}
              {selectedPaymentMethod === 'card_debit' && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Últimos 4 dígitos del Voucher del Punto de Venta:
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="Ej: 4921"
                    value={cardDebitRef}
                    onChange={(e) => setCardDebitRef(e.target.value)}
                    className="w-full h-11 px-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              )}

              {/* Binance */}
              {selectedPaymentMethod === 'binance' && (
                <div className="bg-amber-50/70 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🟡</span>
                    <div>
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">Binance Pay / USDT</span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-300">Tasa 1:1 con USD ({formatUSD(totalUSD)} ≈ {formatVES(totalVES)})</span>
                    </div>
                  </div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ID de Transacción / Order ID de Binance (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 284910284"
                    value={binanceRef}
                    onChange={(e) => setBinanceRef(e.target.value)}
                    className="w-full h-11 px-4 border-2 border-amber-300 dark:border-amber-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Formato de Ticket */}
        <div className="px-5 sm:px-6 py-3 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">🖨️</span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Formato de Comprobante / Ticket:
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onSetReceiptType('mixed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                receiptType === 'mixed'
                  ? 'bg-sky-700 text-white shadow-sm ring-2 ring-sky-500/40'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>🔄</span>
              <span>Ticket Transaccional (Multimoneda)</span>
              {receiptType === 'mixed' && <span>✓</span>}
            </button>

            <button
              type="button"
              onClick={() => onSetReceiptType('fiscal_seniat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                receiptType === 'fiscal_seniat'
                  ? 'bg-indigo-700 text-white shadow-sm ring-2 ring-indigo-500/40'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>🏛️</span>
              <span>Factura Fiscal SENIAT (Bs)</span>
              {receiptType === 'fiscal_seniat' && <span>✓</span>}
            </button>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-12 px-6 border-2 border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Cancelar</span>
            <kbd className="text-[11px] font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">Esc</kbd>
          </button>

          <button
            type="button"
            onClick={onCompleteSale}
            disabled={
              selectedPaymentMethod === 'credit'
                ? !selectedCreditCustomer
                : selectedPaymentMethod === 'mixed'
                ? !isMixedComplete
                : !isCompletePayment
            }
            className="h-12 px-8 flex-1 max-w-md bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
          >
            <span>
              {selectedPaymentMethod === 'mixed'
                ? `Confirmar Cobro Mixto (${formatUSD(totalUSD)})`
                : selectedPaymentMethod === 'credit'
                ? `Autorizar Fiado (${formatUSD(totalUSD)})`
                : 'Confirmar e Imprimir Venta'}
            </span>
            <kbd className="text-[11px] font-mono px-2 py-0.5 bg-emerald-700/80 rounded text-emerald-100 border border-emerald-500/50">
              Enter ↵
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
