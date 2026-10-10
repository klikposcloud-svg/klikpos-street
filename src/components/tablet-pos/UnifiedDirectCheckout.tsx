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
  Trash2,
  ArrowRight,
  Lock,
  Delete,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calculator,
  Hash,
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

type MethodTab = 'cash_usd' | 'pm' | 'card' | 'zelle' | 'cash_ves' | 'binance';
type ActiveInputField = 'amount' | 'ref';

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
  // Pestaña de método activo en el teclado virtual
  const [activeMethod, setActiveMethod] = useState<MethodTab>('cash_usd');
  const [activeField, setActiveField] = useState<ActiveInputField>('amount');

  // Estados locales por método de pago
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

  // Helper para autocompletar el saldo restante en un método en 1 SOLO TOQUE
  const handleFillExactRemaining = (method: MethodTab) => {
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
    setActiveMethod(method);
    setActiveField('amount');
  };

  const handleResetPayments = () => {
    setPmAmountVES('');
    setCashUSD('');
    setCashVES('');
    setCardVES('');
    setZelleUSD('');
    setBinanceUSDT('');
    setPmRef('');
    setCardRef('');
    setZelleRef('');
    setBinanceRef('');
  };

  // Valor actual del campo activo del método seleccionado
  const getCurrentFieldValue = (): string => {
    if (activeField === 'ref') {
      if (activeMethod === 'pm') return pmRef;
      if (activeMethod === 'card') return cardRef;
      if (activeMethod === 'zelle') return zelleRef;
      if (activeMethod === 'binance') return binanceRef;
      return '';
    }
    // Amount
    if (activeMethod === 'cash_usd') return cashUSD;
    if (activeMethod === 'pm') return pmAmountVES;
    if (activeMethod === 'card') return cardVES;
    if (activeMethod === 'zelle') return zelleUSD;
    if (activeMethod === 'cash_ves') return cashVES;
    if (activeMethod === 'binance') return binanceUSDT;
    return '';
  };

  const setCurrentFieldValue = (val: string) => {
    if (activeField === 'ref') {
      if (activeMethod === 'pm') setPmRef(val);
      else if (activeMethod === 'card') setCardRef(val);
      else if (activeMethod === 'zelle') setZelleRef(val);
      else if (activeMethod === 'binance') setBinanceRef(val);
      return;
    }

    if (activeMethod === 'cash_usd') setCashUSD(val);
    else if (activeMethod === 'pm') setPmAmountVES(val);
    else if (activeMethod === 'card') setCardVES(val);
    else if (activeMethod === 'zelle') setZelleUSD(val);
    else if (activeMethod === 'cash_ves') setCashVES(val);
    else if (activeMethod === 'binance') setBinanceUSDT(val);
  };

  // Manejo del Teclado Virtual In-App
  const handleNumpadKey = (key: string) => {
    const current = getCurrentFieldValue();

    if (key === 'AC') {
      setCurrentFieldValue('');
      return;
    }

    if (key === 'DEL') {
      if (current.length > 0) {
        setCurrentFieldValue(current.slice(0, -1));
      }
      return;
    }

    if (key === '.') {
      if (activeField === 'ref') return;
      if (current.includes('.')) return;
      setCurrentFieldValue(current === '' ? '0.' : current + '.');
      return;
    }

    // Dígito 0-9
    if (activeField === 'amount' && current.includes('.')) {
      const decimals = current.split('.')[1];
      if (decimals && decimals.length >= 2) return;
    }

    if (activeField === 'ref' && current.length >= 8) return;

    if (current === '0' && key !== '.') {
      setCurrentFieldValue(key);
      return;
    }

    setCurrentFieldValue(current + key);
  };

  // Presets rápidos
  const handleBillPreset = (bill: number) => {
    setCashUSD(String(bill));
    setActiveMethod('cash_usd');
    setActiveField('amount');
  };

  const handleVesPreset = (amount: number) => {
    setCashVES(String(amount));
    setActiveMethod('cash_ves');
    setActiveField('amount');
  };

  // Datos de los métodos para el Sidebar
  const methodsList: {
    id: MethodTab;
    title: string;
    currency: string;
    icon: any;
    color: string;
    borderColor: string;
    amount: number;
    formatted: string;
    hasRef: boolean;
    refLabel?: string;
    refValue?: string;
  }[] = [
    {
      id: 'cash_usd',
      title: 'Efectivo $',
      currency: '$ USD',
      icon: DollarSign,
      color: isLight ? 'text-amber-600' : 'text-amber-400',
      borderColor: 'border-amber-500',
      amount: parsedCashUSD,
      formatted: `$${parsedCashUSD.toFixed(2)}`,
      hasRef: false,
    },
    {
      id: 'pm',
      title: 'Pago Móvil',
      currency: 'Bs. VES',
      icon: Phone,
      color: isLight ? 'text-emerald-600' : 'text-emerald-400',
      borderColor: 'border-emerald-500',
      amount: parsedPmVES,
      formatted: `Bs. ${parsedPmVES.toFixed(2)}`,
      hasRef: true,
      refLabel: 'Ref (4 dígitos)',
      refValue: pmRef,
    },
    {
      id: 'card',
      title: 'Punto Débito',
      currency: 'Bs. VES',
      icon: CreditCard,
      color: isLight ? 'text-purple-600' : 'text-purple-400',
      borderColor: 'border-purple-500',
      amount: parsedCardVES,
      formatted: `Bs. ${parsedCardVES.toFixed(2)}`,
      hasRef: true,
      refLabel: 'Voucher/Lote',
      refValue: cardRef,
    },
    {
      id: 'zelle',
      title: 'Zelle ($)',
      currency: '$ USD',
      icon: Building2,
      color: isLight ? 'text-indigo-600' : 'text-indigo-400',
      borderColor: 'border-indigo-500',
      amount: parsedZelleUSD,
      formatted: `$${parsedZelleUSD.toFixed(2)}`,
      hasRef: true,
      refLabel: 'Confirmación',
      refValue: zelleRef,
    },
    {
      id: 'cash_ves',
      title: 'Efectivo Bs.',
      currency: 'Bs. VES',
      icon: Wallet,
      color: isLight ? 'text-sky-600' : 'text-sky-400',
      borderColor: 'border-sky-500',
      amount: parsedCashVES,
      formatted: `Bs. ${parsedCashVES.toFixed(2)}`,
      hasRef: false,
    },
    {
      id: 'binance',
      title: 'Binance Pay',
      currency: 'USDT',
      icon: Coins,
      color: isLight ? 'text-yellow-600' : 'text-yellow-400',
      borderColor: 'border-yellow-500',
      amount: parsedBinanceUSDT,
      formatted: `${parsedBinanceUSDT.toFixed(2)} USDT`,
      hasRef: true,
      refLabel: 'Order/Pay ID',
      refValue: binanceRef,
    },
  ];

  const currentMethodObj = methodsList.find(m => m.id === activeMethod) || methodsList[0];

  return (
    <div className={`flex-1 min-h-0 h-full flex flex-col md:flex-row overflow-hidden w-full select-none ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#05070e] text-white'
    }`}>
      
      {/* ========================================================================= */}
      {/* 1. SIDEBAR LATERAL DE MÉTODOS DE PAGO (ACCESO DIRECTO + PAGAR EXACTO)     */}
      {/* ========================================================================= */}
      <div className={`shrink-0 w-full md:w-56 lg:w-60 border-b md:border-b-0 md:border-r p-2 md:p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto scrollbar-none z-20 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#070b16] border-slate-800'
      }`}>
        
        {/* Cabecera Sidebar en Desktop/Tablet */}
        <div className={`hidden md:flex items-center justify-between pb-2 mb-1 border-b ${
          isLight ? 'border-slate-200' : 'border-slate-800/80'
        }`}>
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Métodos de Pago:
            </span>
          </div>
          {totalPaidUSD > 0 && (
            <button
              type="button"
              onClick={handleResetPayments}
              className="text-[9px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
              title="Borrar abonos"
            >
              <Trash2 className="w-2.5 h-2.5" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Lista de Botones de Método */}
        {methodsList.map((m) => {
          const Icon = m.icon;
          const isSelected = activeMethod === m.id;
          const hasAmount = m.amount > 0;

          return (
            <div
              key={m.id}
              onClick={() => {
                setActiveMethod(m.id);
                setActiveField('amount');
              }}
              className={`shrink-0 md:shrink w-36 md:w-full p-2 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? isLight
                    ? `${m.borderColor} bg-amber-50/90 shadow-md ring-2 ring-amber-500/20`
                    : `${m.borderColor} bg-slate-800/90 shadow-lg ring-2 ring-emerald-500/20`
                  : hasAmount
                  ? isLight
                    ? 'border-emerald-300 bg-emerald-50/60 shadow-xs'
                    : 'border-emerald-500/40 bg-emerald-950/20'
                  : isLight
                    ? 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                    : 'border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${m.color}`} />
                  <span className={`text-xs font-black truncate ${
                    isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}>{m.title}</span>
                </div>
                {hasAmount && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 font-mono ${
                    isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {m.formatted}
                  </span>
                )}
              </div>

              {/* Botón rápido: Pagar Exacto restante en 1 Toque */}
              {remainingUSD > 0.01 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFillExactRemaining(m.id);
                  }}
                  className={`w-full py-1 px-1.5 rounded-xl text-[9px] font-black transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <span>⚡ Exacto {m.currency.startsWith('$') ? `$${remainingUSD.toFixed(2)}` : `Bs. ${remainingVES.toFixed(2)}`}</span>
                </button>
              ) : (
                <div className={`text-[9px] font-mono font-bold text-center py-0.5 ${
                  isLight ? 'text-emerald-700' : 'text-emerald-400/90'
                }`}>
                  {hasAmount ? '✓ Abonado' : '–'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. ÁREA PRINCIPAL: DISPLAY JERÁRQUICO + NUMPAD TÁCTIL + BOTÓN FINALIZAR   */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 flex flex-col p-2 sm:p-3 overflow-y-auto scrollbar-none">
        <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between space-y-2">

          {/* --------------------------------------------------------------------- */}
          {/* A. BARRA ULTRA-COMPACTA SUPERIOR: CLIENTE Y MODALIDAD DE ENTREGA      */}
          {/* --------------------------------------------------------------------- */}
          <div className={`flex items-center justify-between gap-2 p-1.5 px-2.5 rounded-xl border text-xs ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
          }`}>
            {/* Cliente */}
            <div className="flex items-center gap-1.5 truncate">
              <User className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={`font-black truncate text-[11px] ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                {selectedCustomer?.name || 'Cliente Mostrador'}
              </span>
              <button
                type="button"
                onClick={onOpenCustomerModal}
                className="text-[9px] font-bold text-amber-500 hover:underline shrink-0 ml-1 cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            {/* Modalidad de Entrega */}
            <div className="flex items-center gap-1 shrink-0">
              {[
                { id: 'local', label: 'Local', icon: Store },
                { id: 'delivery_paid', label: 'Delivery', icon: Bike },
                { id: 'delivery_cod', label: 'COD', icon: Truck },
              ].map((m) => {
                const isSel = fulfillmentMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFulfillmentMode(m.id as any)}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                      isSel
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : isLight
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* B. DISPLAY DE REGISTRADORA REDISEÑADO: JERÁRQUICO Y SIN COMPETENCIA   */}
          {/* --------------------------------------------------------------------- */}
          <div 
            className={`rounded-2xl border-2 p-2.5 sm:p-3 text-center shadow-lg relative overflow-hidden ${
              isLight
                ? 'bg-white border-emerald-500/40 shadow-emerald-500/5'
                : 'bg-[#03110b] border-emerald-500/50'
            }`}
            style={{
              boxShadow: isLight
                ? '0 4px 15px -2px rgba(16, 185, 129, 0.12)'
                : '0 0 20px -5px rgba(16, 185, 129, 0.3), inset 0 0 12px rgba(16, 185, 129, 0.1)',
            }}
          >
            {/* Título y Total Protagónico Supremo */}
            <div className={`text-[10px] font-mono font-black uppercase tracking-widest mb-0.5 ${
              isLight ? 'text-emerald-700' : 'text-emerald-400/80'
            }`}>
              TOTAL CUENTA
            </div>
            
            <div 
              className={`text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight leading-none ${
                isLight ? 'text-emerald-600' : 'text-emerald-300'
              }`}
              style={{
                textShadow: isLight ? undefined : '0 0 14px rgba(16, 185, 129, 0.7)',
              }}
            >
              ${totalUSD.toFixed(2)} <span className={`text-sm font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>USD</span>
            </div>

            <div className={`text-xs font-mono font-bold mt-1 ${
              isLight ? 'text-slate-700' : 'text-emerald-400/90'
            }`}>
              Bs. {totalVES.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">• Tasa: {bcvRate.toFixed(2)}</span>
            </div>

            {/* PÍLDORA SUBORDINADA DE ESTADO / VUELTO (NO COMPITE CON EL TOTAL) */}
            <div className={`mt-2 pt-2 border-t flex items-center justify-center ${
              isLight ? 'border-slate-200' : 'border-emerald-500/20'
            }`}>
              {isCOD ? (
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold inline-flex items-center gap-1.5 shadow-sm ${
                  isLight ? 'bg-amber-100 border border-amber-300 text-amber-950' : 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                }`}>
                  <Truck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Cobro en Destino (COD) • Chofer cobra al entregar</span>
                </span>
              ) : remainingUSD > 0.009 ? (
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-black inline-flex items-center gap-1.5 shadow-sm ${
                  isLight ? 'bg-amber-100 border border-amber-300 text-amber-950' : 'bg-amber-950/80 border border-amber-500/50 text-amber-300'
                }`}>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Falta: ${remainingUSD.toFixed(2)} USD (Bs. {remainingVES.toFixed(2)})</span>
                  <span className={`text-[10px] font-normal ${isLight ? 'text-amber-800' : 'text-amber-400/80'}`}>• Recibido: ${totalPaidUSD.toFixed(2)}</span>
                </span>
              ) : changeUSD > 0.009 ? (
                <span className={`px-3.5 py-1 rounded-full text-xs sm:text-sm font-mono font-black inline-flex items-center gap-1.5 shadow-md ${
                  isLight ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-950' : 'bg-emerald-950/90 border-2 border-emerald-400 text-emerald-200'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>VUELTO: ${changeUSD.toFixed(2)} USD (Bs. {changeVES.toFixed(2)})</span>
                </span>
              ) : (
                <span className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold inline-flex items-center gap-1 ${
                  isLight ? 'bg-emerald-100 border border-emerald-300 text-emerald-800' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                }`}>
                  <Check className="w-3.5 h-3.5" />
                  <span>Cuenta cubierta (Pago Exacto)</span>
                </span>
              )}
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* C. VISOR DE MÉTODO SELECCIONADO + MONTO DIGITADO                      */}
          {/* --------------------------------------------------------------------- */}
          <div className={`p-2.5 rounded-2xl border-2 shadow-md space-y-1.5 ${
            isLight
              ? `bg-white ${currentMethodObj.borderColor}`
              : `bg-[#080d19] ${currentMethodObj.borderColor}`
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {React.createElement(currentMethodObj.icon, { className: `w-4 h-4 ${currentMethodObj.color}` })}
                <span className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{currentMethodObj.title}</span>
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>({currentMethodObj.currency})</span>
              </div>
              <button
                type="button"
                onClick={() => handleFillExactRemaining(activeMethod)}
                className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold active:scale-95 cursor-pointer ${
                  isLight
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                }`}
              >
                ⚡ Pagar Restante
              </button>
            </div>

            {/* Display del Monto que se está digitando (READONLY para no abrir teclado OS) */}
            <div 
              onClick={() => setActiveField('amount')}
              className={`p-2 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                activeField === 'amount'
                  ? isLight
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-emerald-500 bg-[#04120a] ring-2 ring-emerald-500/20'
                  : isLight
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-slate-800 bg-slate-950'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Monto:</span>
                <div className={`text-2xl sm:text-3xl font-black font-mono tracking-wider ${
                  isLight ? 'text-emerald-700' : 'text-emerald-300'
                }`}>
                  {getCurrentFieldValue() || '0.00'}
                  {activeField === 'amount' && (
                    <span className="inline-block w-2 h-5 bg-emerald-500 ml-1 animate-pulse align-middle"></span>
                  )}
                </div>
              </div>

              <span className={`text-[9px] font-mono ${isLight ? 'text-slate-500 font-bold' : 'text-slate-400'}`}>
                {activeMethod === 'cash_usd' || activeMethod === 'zelle' || activeMethod === 'binance'
                  ? `≈ Bs. ${((parseFloat(getCurrentFieldValue()) || 0) * bcvRate).toFixed(2)}`
                  : `≈ $${((parseFloat(getCurrentFieldValue()) || 0) / (bcvRate || 1)).toFixed(2)} USD`}
              </span>
            </div>

            {/* Fila de Referencia (si aplica) */}
            {currentMethodObj.hasRef && (
              <div 
                onClick={() => setActiveField('ref')}
                className={`p-1.5 px-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                  activeField === 'ref'
                    ? isLight
                      ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-500'
                      : 'border-sky-500 bg-sky-950/30 ring-1 ring-sky-500'
                    : isLight
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-sky-500" />
                  <span className={`text-[10px] font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{currentMethodObj.refLabel}:</span>
                  <span className={`font-mono font-black ${isLight ? 'text-sky-800' : 'text-sky-300'}`}>
                    {currentMethodObj.refValue || 'Sin ref'}
                    {activeField === 'ref' && (
                      <span className="inline-block w-1.5 h-3.5 bg-sky-500 ml-1 animate-pulse"></span>
                    )}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-sky-500">
                  {activeField === 'ref' ? '● Digitando' : 'Toca para ref'}
                </span>
              </div>
            )}

            {/* Accesos rápidos de Billetes en USD */}
            {activeMethod === 'cash_usd' && (
              <div className="flex items-center gap-1 pt-0.5">
                {[5, 10, 20, 50, 100].map((bill) => (
                  <button
                    key={bill}
                    type="button"
                    onClick={() => handleBillPreset(bill)}
                    className={`flex-1 py-1 rounded-xl text-xs font-mono font-black transition-all active:scale-95 border cursor-pointer ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                    }`}
                  >
                    ${bill}
                  </button>
                ))}
              </div>
            )}

            {/* Accesos rápidos de Billetes en Bs */}
            {activeMethod === 'cash_ves' && (
              <div className="flex items-center gap-1 pt-0.5">
                {[50, 100, 200, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleVesPreset(amt)}
                    className={`flex-1 py-1 rounded-xl text-[11px] font-mono font-black transition-all active:scale-95 border cursor-pointer ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* D. TECLADO NUMÉRICO TÁCTIL (GRID COMPACTO CON TECLAS CÓMODAS)         */}
          {/* --------------------------------------------------------------------- */}
          <div className={`p-2 sm:p-2.5 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                '1', '2', '3',
                '4', '5', '6',
                '7', '8', '9',
                '.', '0', 'DEL'
              ].map((key) => {
                const isDel = key === 'DEL';
                const isDot = key === '.';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleNumpadKey(key)}
                    className={`h-10 sm:h-12 rounded-xl font-mono font-black text-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center select-none shadow-sm ${
                      isDel
                        ? isLight
                          ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300'
                          : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50'
                        : isDot
                        ? isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        : isLight
                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 active:bg-slate-200'
                        : 'bg-slate-950 hover:bg-slate-850 text-white border border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {isDel ? <Delete className="w-4 h-4 text-rose-500" /> : key}
                  </button>
                );
              })}
            </div>

            {/* Fila inferior rápida: Limpiar, Pagar Exacto, Listo */}
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => handleNumpadKey('AC')}
                className={`h-9 sm:h-10 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 border cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                AC Limpiar
              </button>
              <button
                type="button"
                onClick={() => handleFillExactRemaining(activeMethod)}
                className={`h-9 sm:h-10 rounded-xl text-xs font-mono font-black transition-all active:scale-95 border cursor-pointer ${
                  isLight
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                }`}
              >
                ⚡ Exacto
              </button>
              <button
                type="button"
                onClick={() => setActiveField('amount')}
                className={`h-9 sm:h-10 rounded-xl text-xs font-mono font-black transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm cursor-pointer ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Listo</span>
              </button>
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* E. BOTÓN PRINCIPAL DE CONFIRMACIÓN Y EMISIÓN DE TICKET                */}
          {/* --------------------------------------------------------------------- */}
          {isTrialExpired ? (
            <button
              type="button"
              onClick={onOpenLicenseModal}
              className="w-full py-3.5 text-white font-black text-xs sm:text-sm rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer bg-rose-600 hover:bg-rose-500 active:scale-98 border-2 border-rose-400"
            >
              <Lock className="w-4 h-4 text-white" />
              <span>🔒 Prueba Finalizada - Activar Licencia</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onFinalizeSale}
              disabled={!isCovered}
              className={`w-full py-3.5 text-white font-black text-xs sm:text-sm rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
                <div className={`flex items-center gap-2 font-bold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>Falta: ${remainingUSD.toFixed(2)} USD (Bs. {remainingVES.toFixed(2)})</span>
                </div>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-slate-950" />
                  <span className="text-slate-950 font-black text-sm sm:text-base">
                    {isCOD ? 'Confirmar y Despachar (COD)' : '✓ Confirmar Venta y Generar Ticket'}
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
