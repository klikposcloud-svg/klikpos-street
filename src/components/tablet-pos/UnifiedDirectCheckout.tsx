'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  Phone,
  Wallet,
  CreditCard,
  Building2,
  Store,
  Bike,
  Truck,
  User,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Coins,
  RefreshCw,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Check,
  Lock,
} from 'lucide-react';
import type { Customer, Motorizado, MixedPaymentEntry } from '@/types/tablet-pos';
import type { FulfillmentMode, PaymentMethod } from '@/lib/pos/cart-calculations';

interface UnifiedDirectCheckoutProps {
  isLight: boolean;
  totalUSD: number;
  totalVES: number;
  bcvRate: number;
  totalItems: number;
  primaryColor?: string;
  isTrialExpired?: boolean;
  onOpenLicenseModal?: () => void;

  // Cliente
  selectedCustomer: Customer;
  onOpenCustomerModal: () => void;

  // Entrega
  fulfillmentMode: FulfillmentMode;
  setFulfillmentMode: (mode: FulfillmentMode) => void;
  selectedDriverId: string;
  setSelectedDriverId: (id: string) => void;
  drivers: Motorizado[];
  deliveryAddressInput: string;
  setDeliveryAddressInput: (address: string) => void;

  // Métodos de Pago Base del Hook
  selectedPaymentMethod: PaymentMethod;
  setSelectedPaymentMethod: (m: PaymentMethod) => void;
  setCashUSDReceived: (v: number) => void;
  setCashVESReceived: (v: number) => void;
  setPagoMovilRefInput: (v: string) => void;
  setCardVoucherRef: (v: string) => void;
  setZelleConfirmation: (v: string) => void;
  setBinanceConfirmation: (v: string) => void;

  // Abonos Mixtos sincronizados
  mixedPayments: MixedPaymentEntry[];
  setMixedPayments?: (entries: MixedPaymentEntry[]) => void;
  onFinalizeSale: () => void;
}

export default function UnifiedDirectCheckout({
  isLight,
  totalUSD,
  totalVES,
  bcvRate,
  totalItems,
  primaryColor = '#f59e0b',
  isTrialExpired = false,
  onOpenLicenseModal,
  selectedCustomer,
  onOpenCustomerModal,
  fulfillmentMode,
  setFulfillmentMode,
  selectedDriverId,
  setSelectedDriverId,
  drivers,
  deliveryAddressInput,
  setDeliveryAddressInput,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  setCashUSDReceived,
  setCashVESReceived,
  setPagoMovilRefInput,
  setCardVoucherRef,
  setZelleConfirmation,
  setBinanceConfirmation,
  onFinalizeSale,
}: UnifiedDirectCheckoutProps) {
  // Estados locales directos por método de pago
  const [pmAmountVES, setPmAmountVES] = useState<string>('');
  const [pmRef, setPmRef] = useState<string>('');

  const [cashUSD, setCashUSD] = useState<string>('');
  const [cashVES, setCashVES] = useState<string>('');

  const [cardVES, setCardVES] = useState<string>('');
  const [cardRef, setCardRef] = useState<string>('');

  const [zelleUSD, setZelleUSD] = useState<string>('');
  const [zelleRef, setZelleRef] = useState<string>('');

  const [binanceUSDT, setBinanceUSDT] = useState<string>('');
  const [binanceRef, setBinanceRef] = useState<string>('');

  // Sincronizar referencias hacia el hook exterior
  useEffect(() => {
    setPagoMovilRefInput(pmRef);
  }, [pmRef, setPagoMovilRefInput]);

  useEffect(() => {
    setCardVoucherRef(cardRef);
  }, [cardRef, setCardVoucherRef]);

  useEffect(() => {
    setZelleConfirmation(zelleRef);
  }, [zelleRef, setZelleConfirmation]);

  useEffect(() => {
    setBinanceConfirmation(binanceRef);
  }, [binanceRef, setBinanceConfirmation]);

  // Cálculos de suma recibida en vivo
  const parsedPmVES = parseFloat(pmAmountVES) || 0;
  const parsedCashUSD = parseFloat(cashUSD) || 0;
  const parsedCashVES = parseFloat(cashVES) || 0;
  const parsedCardVES = parseFloat(cardVES) || 0;
  const parsedZelleUSD = parseFloat(zelleUSD) || 0;
  const parsedBinanceUSDT = parseFloat(binanceUSDT) || 0;

  // Equivalente en USD de lo pagado en bolívares
  const pmUSD = bcvRate > 0 ? parsedPmVES / bcvRate : 0;
  const cashVesUSD = bcvRate > 0 ? parsedCashVES / bcvRate : 0;
  const cardUSD = bcvRate > 0 ? parsedCardVES / bcvRate : 0;

  const totalPaidUSD = useMemo(() => {
    return parsedCashUSD + parsedZelleUSD + parsedBinanceUSDT + pmUSD + cashVesUSD + cardUSD;
  }, [parsedCashUSD, parsedZelleUSD, parsedBinanceUSDT, pmUSD, cashVesUSD, cardUSD]);

  const totalPaidVES = useMemo(() => {
    return totalPaidUSD * bcvRate;
  }, [totalPaidUSD, bcvRate]);

  // Balance en vivo
  const isCOD = fulfillmentMode === 'delivery_cod';
  const remainingUSD = Math.max(0, totalUSD - totalPaidUSD);
  const remainingVES = remainingUSD * bcvRate;

  const isCovered = isCOD || totalPaidUSD >= totalUSD - 0.01;
  const changeUSD = Math.max(0, totalPaidUSD - totalUSD);
  const changeVES = changeUSD * bcvRate;

  // Actualizar estados del hook para consistencia en el ticket
  useEffect(() => {
    setCashUSDReceived(parsedCashUSD);
    setCashVESReceived(parsedCashVES);

    // Detectar qué método se está usando prioritariamente
    const usedMethods: PaymentMethod[] = [];
    if (parsedPmVES > 0) usedMethods.push('pago_movil');
    if (parsedCashUSD > 0) usedMethods.push('cash_usd');
    if (parsedCashVES > 0) usedMethods.push('cash_ves');
    if (parsedCardVES > 0) usedMethods.push('card_debit');
    if (parsedZelleUSD > 0) usedMethods.push('zelle');
    if (parsedBinanceUSDT > 0) usedMethods.push('binance');

    if (usedMethods.length === 1) {
      setSelectedPaymentMethod(usedMethods[0]);
    } else if (usedMethods.length > 1) {
      setSelectedPaymentMethod('mixed');
    }
  }, [
    parsedCashUSD,
    parsedCashVES,
    parsedPmVES,
    parsedCardVES,
    parsedZelleUSD,
    parsedBinanceUSDT,
    setCashUSDReceived,
    setCashVESReceived,
    setSelectedPaymentMethod,
  ]);

  // Helper para autocompletar el saldo restante en un método
  const handleFillRemaining = (method: 'pm' | 'cash_usd' | 'cash_ves' | 'card' | 'zelle' | 'binance') => {
    if (remainingUSD <= 0) return;

    if (method === 'cash_usd') {
      const newAmount = (parsedCashUSD + remainingUSD).toFixed(2);
      setCashUSD(newAmount);
    } else if (method === 'zelle') {
      const newAmount = (parsedZelleUSD + remainingUSD).toFixed(2);
      setZelleUSD(newAmount);
    } else if (method === 'binance') {
      const newAmount = (parsedBinanceUSDT + remainingUSD).toFixed(2);
      setBinanceUSDT(newAmount);
    } else if (method === 'pm') {
      const newAmount = (parsedPmVES + remainingVES).toFixed(2);
      setPmAmountVES(newAmount);
    } else if (method === 'cash_ves') {
      const newAmount = (parsedCashVES + remainingVES).toFixed(2);
      setCashVES(newAmount);
    } else if (method === 'card') {
      const newAmount = (parsedCardVES + remainingVES).toFixed(2);
      setCardVES(newAmount);
    }
  };

  const handleResetPayments = () => {
    setPmAmountVES('');
    setCashUSD('');
    setCashVES('');
    setCardVES('');
    setZelleUSD('');
    setBinanceUSDT('');
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden w-full select-none">
      
      {/* ========================================================================= */}
      {/* 1. DISPLAY DE CAJA REGISTRADORA FIJO EN LA PARTE SUPERIOR (VFD NEÓN ESMERALDA) */}
      {/* ========================================================================= */}
      <div className="shrink-0 w-full z-30 border-b-4 border-slate-950 bg-[#060912] shadow-2xl p-2 sm:p-3">
        <div className="max-w-2xl mx-auto">
          {/* MARCO DE HARDWARE REGISTRADORA */}
          <div className="rounded-2xl border-2 border-slate-800 bg-[#070b14] p-2.5 sm:p-3 shadow-2xl relative overflow-hidden">
            
            {/* LÍNEA DE ESTADO SUPERIOR DE TERMINAL */}
            <div className="flex items-center justify-between px-2 py-0.5 mb-1.5 border-b border-slate-800/80 text-[10px] font-mono text-slate-500 font-black tracking-wider uppercase">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-400/90 font-bold">KLIKPOS REGISTER // VFD-2026</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-bold">{totalItems} Ítems • BCV: {bcvRate.toFixed(2)}</span>
                {totalPaidUSD > 0 && (
                  <button
                    type="button"
                    onClick={handleResetPayments}
                    className="px-2 py-0.5 rounded text-[9px] font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                    title="Limpiar montos ingresados"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Limpiar</span>
                  </button>
                )}
              </div>
            </div>

            {/* PANTALLA CRISTAL VFD CON RESPLANDOR ESMERALDA */}
            <div 
              className="rounded-xl bg-[#03130d] border-2 border-emerald-500/50 p-3 sm:p-4"
              style={{
                boxShadow: '0 0 25px -5px rgba(16, 185, 129, 0.35), inset 0 0 15px rgba(16, 185, 129, 0.15)',
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                
                {/* LADO IZQUIERDO: TOTAL CUENTA */}
                <div className="sm:col-span-6 border-b sm:border-b-0 sm:border-r border-emerald-500/20 pb-2.5 sm:pb-0 sm:pr-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80 block font-mono">
                    ▶ TOTAL CUENTA
                  </span>
                  <div 
                    className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-emerald-300 tracking-tight leading-none mt-1"
                    style={{ textShadow: '0 0 12px rgba(16, 185, 129, 0.7), 0 0 24px rgba(16, 185, 129, 0.4)' }}
                  >
                    ${totalUSD.toFixed(2)} <span className="text-sm font-bold text-emerald-400">USD</span>
                  </div>
                  <div className="text-xs sm:text-sm font-mono font-bold text-emerald-400/90 mt-1">
                    Bs. {totalVES.toFixed(2)}
                  </div>
                </div>

                {/* LADO DERECHO: VISOR DINÁMICO DE ESTADO / VUELTO */}
                <div className="sm:col-span-6 flex flex-col justify-center">
                  {isCOD ? (
                    <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 font-mono">
                          🚚 COBRO EN DESTINO
                        </span>
                        <span className="text-[10px] font-mono text-amber-400/80 font-bold">COD ACTIVO</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-amber-300 tracking-tight leading-none mt-1">
                        ${totalUSD.toFixed(2)} <span className="text-xs font-bold text-amber-400">USD</span>
                      </div>
                      <div className="text-[11px] font-mono font-bold text-amber-400/90 mt-0.5">
                        Chofer cobra al entregar
                      </div>
                    </div>
                  ) : remainingUSD > 0.009 ? (
                    <div 
                      className="p-2.5 rounded-xl bg-amber-950/70 border-2 border-amber-500/60"
                      style={{ boxShadow: '0 0 15px -3px rgba(245, 158, 11, 0.3)' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 font-mono flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          <span>FALTA POR PAGAR</span>
                        </span>
                        <span className="text-[10px] font-mono text-amber-400/80 font-bold">
                          Recibido: ${totalPaidUSD.toFixed(2)}
                        </span>
                      </div>
                      <div 
                        className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-amber-300 tracking-tight leading-none mt-1"
                        style={{ textShadow: '0 0 12px rgba(245, 158, 11, 0.7)' }}
                      >
                        ${remainingUSD.toFixed(2)} <span className="text-xs font-bold text-amber-400">USD</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                        Bs. {remainingVES.toFixed(2)}
                      </div>
                    </div>
                  ) : changeUSD > 0.009 ? (
                    <div 
                      className="p-2.5 rounded-xl bg-emerald-950/70 border-2 border-emerald-400/70"
                      style={{ boxShadow: '0 0 18px -2px rgba(16, 185, 129, 0.4)' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 animate-pulse" />
                          <span>💵 VUELTO AL CLIENTE</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          Recibido: ${totalPaidUSD.toFixed(2)}
                        </span>
                      </div>
                      <div 
                        className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-emerald-200 tracking-tight leading-none mt-1"
                        style={{ textShadow: '0 0 14px rgba(52, 211, 153, 0.9)' }}
                      >
                        ${changeUSD.toFixed(2)} <span className="text-xs font-bold text-emerald-300">USD</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-300 mt-0.5">
                        Bs. {changeVES.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 font-mono">
                          ✓ CUENTA CUBIERTA
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400/80 font-bold">
                          Recibido: ${totalPaidUSD.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-300 tracking-tight leading-none mt-1">
                        $0.00 <span className="text-xs font-bold text-emerald-400">USD</span>
                      </div>
                      <div className="text-[11px] font-mono font-bold text-emerald-400/90 mt-0.5">
                        Pago exacto sin vuelto
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTENIDO SCROLLEABLE INFERIOR (MÉTODOS, ENTREGA, CLIENTE, BOTÓN)      */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none pb-48 px-2 sm:px-4 pt-3">
        <div className="max-w-xl mx-auto w-full space-y-4">

      {/* ========================================================================= */}
      {/* 2. MODALIDAD DE ENTREGA / DESPACHO (100% PRESERVADA)                       */}
      {/* ========================================================================= */}
      <div className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800 text-white'
      }`}>
        <span className="text-xs font-black uppercase tracking-wider block text-slate-400">
          Modalidad de Entrega / Despacho:
        </span>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'local', label: 'En Local / Mesa', desc: 'Consumo en salón', icon: Store, color: 'text-emerald-500' },
            { id: 'delivery_paid', label: 'Delivery Pagado', desc: 'Cobro previo', icon: Bike, color: 'text-sky-500' },
            { id: 'delivery_cod', label: 'Cobro en Destino', desc: 'Chofer cobra', icon: Truck, color: 'text-amber-500' },
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = fulfillmentMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setFulfillmentMode(mode.id as any)}
                className={`p-2.5 rounded-2xl border flex flex-col items-center text-center gap-1 transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? isLight
                      ? 'border-2 bg-amber-50/50 border-amber-500 shadow-sm'
                      : 'border-2 bg-slate-800 border-amber-500 shadow-md'
                    : isLight
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${mode.color}`} />
                <span className="text-[11px] font-black leading-tight block">{mode.label}</span>
                <span className="text-[9px] opacity-70 leading-tight block">{mode.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Parámetros de Motorizado y Dirección si es Delivery */}
        {fulfillmentMode !== 'local' && (
          <div className={`p-3 rounded-2xl border space-y-2 mt-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">
                Motorizado / Chofer Asignado:
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              >
                <option value="">Por Asignar / Chofer Particular</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.vehicle}) - {d.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">
                Dirección de Entrega:
              </label>
              <input
                type="text"
                placeholder={selectedCustomer?.address || 'Ej. Calle 5, Casa #12'}
                value={deliveryAddressInput}
                onChange={(e) => setDeliveryAddressInput(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. DATOS DEL CLIENTE / FACTURACIÓN (100% PRESERVADOS)                     */}
      {/* ========================================================================= */}
      <div className={`p-3.5 rounded-3xl border shadow-sm flex items-center justify-between ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800 text-white'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black">{selectedCustomer?.name || 'Cliente Mostrador'}</h4>
            <span className="text-[10px] font-mono text-slate-400 block">
              Doc: {selectedCustomer?.docId || 'V-00000000'} {selectedCustomer?.phone && `• Tel: ${selectedCustomer.phone}`}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCustomerModal}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Cambiar</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. RECUADRO UNIFICADO DE MÉTODOS DE PAGO CON RESTA EN VIVO               */}
      {/* ========================================================================= */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-lg space-y-4 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#090d16] border-slate-800 text-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-wider">
              Opciones de Pago Directo:
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Ingresa montos aleatoriamente en cualquier método
          </span>
        </div>

        {/* 1. PAGO MÓVIL (SIN QR, DIRECTO CON RESTA DINÁMICA) */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          parsedPmVES > 0
            ? 'border-emerald-500/50 bg-emerald-950/20 shadow-sm'
            : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black">📱 Pago Móvil (Bs.)</span>
            </div>
            {remainingUSD > 0.01 && (
              <button
                type="button"
                onClick={() => handleFillRemaining('pm')}
                className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold hover:bg-emerald-500/30 active:scale-95 cursor-pointer"
              >
                ⚡ Restante (Bs. {remainingVES.toFixed(2)})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Monto en Bolívares (Bs):</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={pmAmountVES}
                onChange={(e) => setPmAmountVES(e.target.value.replace(',', '.'))}
                className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-mono font-black bg-white text-slate-950 border-2 border-slate-300 outline-none focus:border-emerald-500 shadow-inner"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 block mb-0.5">N° Referencia (4 dígitos opcional):</label>
              <input
                type="text"
                placeholder="Ej. 4581"
                maxLength={8}
                value={pmRef}
                onChange={(e) => setPmRef(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold bg-white text-slate-950 border-2 border-slate-300 outline-none focus:border-emerald-500 shadow-inner"
              />
            </div>
          </div>
          {parsedPmVES > 0 && (
            <span className="text-[10px] font-mono text-emerald-400 block mt-1">
              ≈ ${(parsedPmVES / bcvRate).toFixed(2)} USD abonados
            </span>
          )}
        </div>

        {/* 2. EFECTIVO DÓLARES (USD) CON BILLETES RÁPIDOS */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          parsedCashUSD > 0
            ? 'border-amber-500/50 bg-amber-950/20 shadow-sm'
            : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black">💵 Efectivo Dólares ($ USD)</span>
            </div>
            {remainingUSD > 0.01 && (
              <button
                type="button"
                onClick={() => handleFillRemaining('cash_usd')}
                className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold hover:bg-amber-500/30 active:scale-95 cursor-pointer"
              >
                ⚡ Exacto (${remainingUSD.toFixed(2)})
              </button>
            )}
          </div>

          <div className="space-y-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder={`Monto Recibido en $ (Ej. ${totalUSD.toFixed(2)})`}
              value={cashUSD}
              onChange={(e) => setCashUSD(e.target.value.replace(',', '.'))}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-mono font-black bg-white text-slate-950 border-2 border-slate-300 outline-none focus:border-amber-500 shadow-inner"
            />

            {/* Atajos de Billetes Rápidos */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-bold text-slate-400 mr-1">Billetes:</span>
              {[5, 10, 20, 50, 100].map((bill) => (
                <button
                  key={bill}
                  type="button"
                  onClick={() => setCashUSD(String(bill))}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-slate-800 hover:bg-slate-700 text-white transition-all active:scale-95 cursor-pointer border border-slate-700"
                >
                  ${bill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. EFECTIVO BOLÍVARES (VES) */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          parsedCashVES > 0
            ? 'border-sky-500/50 bg-sky-950/20 shadow-sm'
            : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-black">🇻🇪 Efectivo Bolívares (Bs.)</span>
            </div>
            {remainingUSD > 0.01 && (
              <button
                type="button"
                onClick={() => handleFillRemaining('cash_ves')}
                className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-bold hover:bg-sky-500/30 active:scale-95 cursor-pointer"
              >
                ⚡ Restante (Bs. {remainingVES.toFixed(2)})
              </button>
            )}
          </div>

          <input
            type="text"
            inputMode="decimal"
            placeholder="Monto Recibido en Bs."
            value={cashVES}
            onChange={(e) => setCashVES(e.target.value.replace(',', '.'))}
            className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-mono font-black bg-white text-slate-950 border-2 border-slate-300 outline-none focus:border-sky-500 shadow-inner"
          />
        </div>

        {/* 4. PUNTO / TARJETA DE DÉBITO */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          parsedCardVES > 0
            ? 'border-purple-500/50 bg-purple-950/20 shadow-sm'
            : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-black">💳 Punto / Tarjeta Débito</span>
            </div>
            {remainingUSD > 0.01 && (
              <button
                type="button"
                onClick={() => handleFillRemaining('card')}
                className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold hover:bg-purple-500/30 active:scale-95 cursor-pointer"
              >
                ⚡ Restante (Bs. {remainingVES.toFixed(2)})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Monto Cobrado en Bs."
              value={cardVES}
              onChange={(e) => setCardVES(e.target.value.replace(',', '.'))}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-mono font-black bg-white text-slate-950 border-2 border-slate-300 outline-none focus:border-purple-500 shadow-inner"
            />
            <input
              type="text"
              placeholder="N° Voucher / Lote (Opcional)"
              value={cardRef}
              onChange={(e) => setCardRef(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold bg-white text-slate-950 border-2 border-slate-300 outline-none focus:border-purple-500 shadow-inner"
            />
          </div>
        </div>

        {/* 5. ZELLE */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          parsedZelleUSD > 0
            ? 'border-indigo-500/50 bg-indigo-950/20 shadow-sm'
            : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-black">🌐 Zelle ($ USD)</span>
            </div>
            {remainingUSD > 0.01 && (
              <button
                type="button"
                onClick={() => handleFillRemaining('zelle')}
                className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold hover:bg-indigo-500/30 active:scale-95 cursor-pointer"
              >
                ⚡ Restante (${remainingUSD.toFixed(2)})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Monto en $ USD"
              value={zelleUSD}
              onChange={(e) => setZelleUSD(e.target.value.replace(',', '.'))}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-mono font-black bg-white text-slate-950 border-2 border-slate-300 outline-none focus:border-indigo-500 shadow-inner"
            />
            <input
              type="text"
              placeholder="Titular / Confirmación"
              value={zelleRef}
              onChange={(e) => setZelleRef(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold bg-white text-slate-950 border-2 border-slate-300 outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>
        </div>

        {/* 6. BINANCE PAY (USDT) */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          parsedBinanceUSDT > 0
            ? 'border-yellow-500/50 bg-yellow-950/20 shadow-sm'
            : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-yellow-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                B
              </span>
              <span className="text-xs font-black">🟡 Binance Pay (USDT)</span>
            </div>
            {remainingUSD > 0.01 && (
              <button
                type="button"
                onClick={() => handleFillRemaining('binance')}
                className="px-2 py-0.5 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[10px] font-mono font-bold hover:bg-yellow-500/30 active:scale-95 cursor-pointer"
              >
                ⚡ Restante ({remainingUSD.toFixed(2)} USDT)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Monto en USDT"
              value={binanceUSDT}
              onChange={(e) => setBinanceUSDT(e.target.value.replace(',', '.'))}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-mono font-black bg-white text-slate-950 border-2 border-slate-300 outline-none focus:border-yellow-500 shadow-inner"
            />
            <input
              type="text"
              placeholder="Order ID / Pay ID (Opcional)"
              value={binanceRef}
              onChange={(e) => setBinanceRef(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold bg-white text-slate-950 border-2 border-slate-300 outline-none focus:border-yellow-500 shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. BOTÓN PRINCIPAL DE LIQUIDACIÓN Y GENERACIÓN DE TICKET                  */}
      {/* ========================================================================= */}
      {isTrialExpired ? (
        <button
          type="button"
          onClick={onOpenLicenseModal}
          className="w-full py-4 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer bg-rose-600 hover:bg-rose-500 active:scale-98 border-2 border-rose-400"
        >
          <Lock className="w-5 h-5 text-white" />
          <span>🔒 Prueba de 3 Horas Finalizada - Activar Licencia para Facturar</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onFinalizeSale}
          disabled={!isCovered}
          className={`w-full py-4 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            !isCovered
              ? isLight
                ? 'opacity-80 cursor-not-allowed bg-slate-200 border border-slate-300 text-slate-500'
                : 'opacity-60 cursor-not-allowed bg-slate-800 border border-slate-700'
              : 'active:scale-98 shadow-emerald-500/25 bg-emerald-600 hover:bg-emerald-500'
          }`}
          style={{
            backgroundColor: isCovered ? '#10b981' : undefined,
          }}
        >
          {!isCovered ? (
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Falta por pagar: ${remainingUSD.toFixed(2)} USD (Bs. {remainingVES.toFixed(2)})</span>
            </div>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 text-slate-950" />
              <span className="text-slate-950 font-black">
                {isCOD ? 'Confirmar Pedido y Despachar (Cobro en Destino)' : 'Confirmar Venta y Generar Ticket'}
              </span>
            </>
          )}
        </button>
      )}
        </div>
      </div>
    </div>
  );
}
