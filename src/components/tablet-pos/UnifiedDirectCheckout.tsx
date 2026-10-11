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
  CheckCircle2,
  AlertCircle,
  Coins,
  Trash2,
  Lock,
  Delete,
  Check,
  Sparkles,
  Hash,
  Zap,
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
  mixedPayments?: MixedPaymentEntry[];
  setMixedPayments?: (entries: MixedPaymentEntry[]) => void;
  onFinalizeSale: (explicitPayments?: MixedPaymentEntry[]) => void;
}

type MethodTab = 'cash' | 'pm' | 'card' | 'zelle' | 'binance';
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
  setMixedPayments,
  onFinalizeSale,
}: UnifiedDirectCheckoutProps) {
  // Pestaña de método activo en el teclado virtual
  const [activeMethod, setActiveMethod] = useState<MethodTab>('cash');
  const [activeField, setActiveField] = useState<ActiveInputField>('amount');

  // Alternador de Moneda para Efectivo: USD vs VES (Switch simple y directo)
  const [cashCurrency, setCashCurrency] = useState<'USD' | 'VES'>('USD');

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

  // Sincronizar abonos estructurados para useCheckout
  const collectedPayments = useMemo<MixedPaymentEntry[]>(() => {
    const list: MixedPaymentEntry[] = [];
    if (parsedCashUSD > 0) {
      list.push({
        id: 'pay_cash_usd',
        method: 'cash_usd',
        currency: 'USD',
        amount: parsedCashUSD,
        amountUSD: parsedCashUSD,
        amountVES: parsedCashUSD * bcvRate,
      });
    }
    if (parsedCashVES > 0) {
      list.push({
        id: 'pay_cash_ves',
        method: 'cash_ves',
        currency: 'VES',
        amount: parsedCashVES,
        amountUSD: bcvRate > 0 ? parsedCashVES / bcvRate : 0,
        amountVES: parsedCashVES,
      });
    }
    if (parsedPmVES > 0) {
      list.push({
        id: 'pay_pm',
        method: 'pago_movil',
        currency: 'VES',
        amount: parsedPmVES,
        amountUSD: bcvRate > 0 ? parsedPmVES / bcvRate : 0,
        amountVES: parsedPmVES,
        reference: pmRef.trim() || undefined,
      });
    }
    if (parsedCardVES > 0) {
      list.push({
        id: 'pay_card',
        method: 'card_debit',
        currency: 'VES',
        amount: parsedCardVES,
        amountUSD: bcvRate > 0 ? parsedCardVES / bcvRate : 0,
        amountVES: parsedCardVES,
        reference: cardRef.trim() || undefined,
      });
    }
    if (parsedZelleUSD > 0) {
      list.push({
        id: 'pay_zelle',
        method: 'zelle',
        currency: 'USD',
        amount: parsedZelleUSD,
        amountUSD: parsedZelleUSD,
        amountVES: parsedZelleUSD * bcvRate,
        reference: zelleRef.trim() || undefined,
      });
    }
    if (parsedBinanceUSDT > 0) {
      list.push({
        id: 'pay_binance',
        method: 'binance',
        currency: 'USD',
        amount: parsedBinanceUSDT,
        amountUSD: parsedBinanceUSDT,
        amountVES: parsedBinanceUSDT * bcvRate,
        reference: binanceRef.trim() || undefined,
      });
    }
    return list;
  }, [
    parsedCashUSD,
    parsedCashVES,
    parsedPmVES,
    pmRef,
    parsedCardVES,
    cardRef,
    parsedZelleUSD,
    zelleRef,
    parsedBinanceUSDT,
    binanceRef,
    bcvRate,
  ]);

  // Actualizar estados del hook para consistencia
  useEffect(() => {
    setCashUSDReceived(parsedCashUSD);
    setCashVESReceived(parsedCashVES);

    const methodsCount = collectedPayments.length;
    if (methodsCount === 1) {
      setSelectedPaymentMethod(collectedPayments[0].method as PaymentMethod);
    } else if (methodsCount > 1) {
      setSelectedPaymentMethod('mixed');
    }

    if (setMixedPayments) {
      setMixedPayments(collectedPayments);
    }
  }, [
    collectedPayments,
    parsedCashUSD,
    parsedCashVES,
    setCashUSDReceived,
    setCashVESReceived,
    setSelectedPaymentMethod,
    setMixedPayments,
  ]);

  // Helper para autocompletar el saldo restante en un método en 1 SOLO TOQUE
  const handleFillExactRemaining = (method: MethodTab) => {
    if (remainingUSD <= 0) return;

    if (method === 'cash') {
      if (cashCurrency === 'USD') {
        const newAmount = (parsedCashUSD + remainingUSD).toFixed(2);
        setCashUSD(newAmount);
      } else {
        const newAmount = (parsedCashVES + remainingVES).toFixed(2);
        setCashVES(newAmount);
      }
    } else if (method === 'zelle') {
      const newAmount = (parsedZelleUSD + remainingUSD).toFixed(2);
      setZelleUSD(newAmount);
    } else if (method === 'binance') {
      const newAmount = (parsedBinanceUSDT + remainingUSD).toFixed(2);
      setBinanceUSDT(newAmount);
    } else if (method === 'pm') {
      const newAmount = (parsedPmVES + remainingVES).toFixed(2);
      setPmAmountVES(newAmount);
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
    if (activeMethod === 'cash') {
      return cashCurrency === 'USD' ? cashUSD : cashVES;
    }
    if (activeMethod === 'pm') return pmAmountVES;
    if (activeMethod === 'card') return cardVES;
    if (activeMethod === 'zelle') return zelleUSD;
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

    if (activeMethod === 'cash') {
      if (cashCurrency === 'USD') setCashUSD(val);
      else setCashVES(val);
    } else if (activeMethod === 'pm') {
      setPmAmountVES(val);
    } else if (activeMethod === 'card') {
      setCardVES(val);
    } else if (activeMethod === 'zelle') {
      setZelleUSD(val);
    } else if (activeMethod === 'binance') {
      setBinanceUSDT(val);
    }
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
    setActiveMethod('cash');
    setCashCurrency('USD');
    setActiveField('amount');
  };

  const handleVesPreset = (amount: number) => {
    setCashVES(String(amount));
    setActiveMethod('cash');
    setCashCurrency('VES');
    setActiveField('amount');
  };

  // Disparar finalización con pagos garantizados
  const handleConfirmSale = () => {
    onFinalizeSale(collectedPayments);
  };

  // Resumen del método Efectivo unificado
  const cashTotalUSDFormatted = useMemo(() => {
    if (parsedCashUSD > 0 && parsedCashVES > 0) {
      return `$${parsedCashUSD.toFixed(2)} + Bs. ${parsedCashVES.toFixed(2)}`;
    }
    if (parsedCashUSD > 0) return `$${parsedCashUSD.toFixed(2)}`;
    if (parsedCashVES > 0) return `Bs. ${parsedCashVES.toFixed(2)}`;
    return '$0.00';
  }, [parsedCashUSD, parsedCashVES]);

  // Lista unificada de métodos para el Sidebar
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
      id: 'cash',
      title: 'Efectivo',
      currency: cashCurrency === 'USD' ? '$ USD' : 'Bs. VES',
      icon: DollarSign,
      color: isLight ? 'text-amber-600' : 'text-amber-400',
      borderColor: 'border-amber-500',
      amount: parsedCashUSD + cashVesUSD,
      formatted: cashTotalUSDFormatted,
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
      title: 'Zelle',
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

  const currentMethodObj = methodsList.find((m) => m.id === activeMethod) || methodsList[0];

  return (
    <div
      className={`flex-1 min-h-0 h-full flex flex-col md:flex-row overflow-hidden w-full select-none ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#05070e] text-white'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. SIDEBAR LATERAL DE MÉTODOS DE PAGO UNIFICADOS (SIN DUPLICAR EFECTIVO)  */}
      {/* ========================================================================= */}
      <div
        className={`shrink-0 w-full md:w-56 lg:w-60 border-b md:border-b-0 md:border-r p-2 md:p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto scrollbar-none z-20 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#070b16] border-slate-800'
        }`}
      >
        {/* Cabecera Sidebar en Desktop/Tablet */}
        <div
          className={`hidden md:flex items-center justify-between pb-2 mb-1 border-b ${
            isLight ? 'border-slate-200' : 'border-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span
              className={`text-[10px] font-black uppercase tracking-wider ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
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
              className={`shrink-0 md:shrink w-32 md:w-full p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-1.5 active:scale-95 select-none ${
                isSelected
                  ? isLight
                    ? 'border-slate-300 bg-slate-100 shadow-xs'
                    : 'border-slate-700 bg-slate-800 shadow-xs'
                  : hasAmount
                  ? isLight
                    ? 'border-slate-200 bg-emerald-50/50'
                    : 'border-slate-800 bg-emerald-950/20'
                  : isLight
                  ? 'border-slate-200 bg-white hover:bg-slate-50'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${m.color}`} />
                <span
                  className={`text-xs font-semibold truncate ${
                    isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}
                >
                  {m.title}
                </span>
              </div>
              {hasAmount ? (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 border ${
                    isLight
                      ? 'bg-slate-100 text-slate-800 border-slate-200'
                      : 'bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                >
                  {m.formatted}
                </span>
              ) : (
                <span
                  className={`text-[10px] shrink-0 font-medium ${
                    isLight ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {m.currency}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. ÁREA PRINCIPAL: DISPLAY + DESCUENTO + NUMPAD TÁCTIL + BOTÓN FINALIZAR  */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 flex flex-col p-2 sm:p-3 pb-32 sm:pb-36 md:pb-6 overflow-y-auto overscroll-contain touch-pan-y">
        <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between space-y-2">
          {/* --------------------------------------------------------------------- */}
          {/* A. BARRA ULTRA-COMPACTA SUPERIOR: CLIENTE Y MODALIDAD DE ENTREGA      */}
          {/* --------------------------------------------------------------------- */}
          <div
            className={`flex items-center justify-between gap-2 p-1.5 px-2.5 rounded-xl border text-xs ${
              isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            {/* Cliente */}
            <div className="flex items-center gap-1.5 truncate">
              <User
                className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}
              />
              <span
                className={`font-semibold truncate text-[11px] ${
                  isLight ? 'text-slate-900' : 'text-slate-200'
                }`}
              >
                {selectedCustomer?.name || 'Cliente Mostrador'}
              </span>
              <button
                type="button"
                onClick={onOpenCustomerModal}
                className="text-[10px] font-medium text-amber-500 hover:underline shrink-0 ml-1 cursor-pointer"
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
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                      isSel
                        ? isLight
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-white text-slate-950 shadow-2xs'
                        : isLight
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-800'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* B. DISPLAY DE REGISTRADORA: TOTAL EN USD Y BS A COBRAR                */}
          {/* --------------------------------------------------------------------- */}
          <div
            className={`rounded-2xl border p-3 sm:p-4 text-center transition-all duration-300 relative overflow-hidden ${
              isCovered && !isCOD
                ? isLight
                  ? 'bg-emerald-50/70 border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/20'
                  : 'bg-emerald-950/25 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/20'
                : isLight
                ? 'bg-white border-slate-200 shadow-2xs'
                : 'bg-slate-900/90 border-slate-800 shadow-2xs'
            }`}
          >
            <div
              className={`text-[10px] font-semibold uppercase tracking-widest mb-0.5 ${
                isCovered && !isCOD
                  ? isLight
                    ? 'text-emerald-700'
                    : 'text-emerald-400'
                  : isLight
                  ? 'text-slate-500'
                  : 'text-slate-400'
              }`}
            >
              TOTAL A COBRAR
            </div>

            <div
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold font-mono tracking-tight leading-none transition-colors ${
                isCovered && !isCOD
                  ? isLight
                    ? 'text-emerald-700'
                    : 'text-emerald-300'
                  : isLight
                  ? 'text-slate-900'
                  : 'text-white'
              }`}
            >
              ${totalUSD.toFixed(2)}{' '}
              <span
                className={`text-sm font-semibold ${
                  isCovered && !isCOD
                    ? isLight
                      ? 'text-emerald-600'
                      : 'text-emerald-400'
                    : isLight
                    ? 'text-slate-500'
                    : 'text-slate-400'
                }`}
              >
                USD
              </span>
            </div>

            <div
              className={`text-xs font-medium mt-1.5 ${
                isCovered && !isCOD
                  ? isLight
                    ? 'text-emerald-800/80'
                    : 'text-emerald-300/80'
                  : isLight
                  ? 'text-slate-600'
                  : 'text-slate-400'
              }`}
            >
              Bs. {totalVES.toFixed(2)}{' '}
              <span
                className={`text-[10px] font-normal ${
                  isCovered && !isCOD
                    ? isLight
                      ? 'text-emerald-700/70'
                      : 'text-emerald-400/60'
                    : 'text-slate-500'
                }`}
              >
                • Tasa: {bcvRate.toFixed(2)}
              </span>
            </div>

            {/* PÍLDORA SUBORDINADA DE ESTADO / VUELTO */}
            <div
              className={`mt-2.5 pt-2 border-t flex items-center justify-center ${
                isCovered && !isCOD
                  ? isLight
                    ? 'border-emerald-200'
                    : 'border-emerald-900/60'
                  : isLight
                  ? 'border-slate-200'
                  : 'border-slate-800'
              }`}
            >
              {isCOD ? (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${
                    isLight
                      ? 'bg-slate-100 border border-slate-200 text-slate-700'
                      : 'bg-slate-800 border border-slate-700 text-slate-300'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Cobro en Destino (COD) • Chofer cobra al entregar</span>
                </span>
              ) : remainingUSD > 0.009 ? (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                    isLight
                      ? 'bg-slate-100 border border-slate-200 text-slate-800'
                      : 'bg-slate-800 border border-slate-700 text-slate-200'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    Falta: ${remainingUSD.toFixed(2)} USD (Bs. {remainingVES.toFixed(2)})
                  </span>
                  <span
                    className={`text-[11px] font-normal ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    • Recibido: ${totalPaidUSD.toFixed(2)}
                  </span>
                </span>
              ) : changeUSD > 0.009 ? (
                <span
                  className={`px-3.5 py-1 rounded-full text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 ${
                    isLight
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-emerald-950/60 text-emerald-200 border border-emerald-700/60'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    VUELTO: ${changeUSD.toFixed(2)} USD (Bs. {changeVES.toFixed(2)})
                  </span>
                </span>
              ) : (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                    isLight
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-emerald-950/60 text-emerald-200 border border-emerald-700/60'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Cuenta cubierta (Pago Exacto)</span>
                </span>
              )}
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* D. CHIPS DE ABONOS REGISTRADOS (DESGLOSE VISIBLE DE MÉTODOS)          */}
          {/* --------------------------------------------------------------------- */}
          {totalPaidUSD > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none text-[10px]">
              <span className="font-bold text-slate-500 shrink-0 uppercase tracking-wider text-[9px]">
                Abonos:
              </span>
              {parsedCashUSD > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 font-mono font-bold shrink-0">
                  💵 ${parsedCashUSD.toFixed(2)}
                  <button
                    type="button"
                    onClick={() => setCashUSD('')}
                    className="hover:text-rose-600 font-black cursor-pointer text-xs ml-0.5"
                    title="Eliminar abono"
                  >
                    ×
                  </button>
                </span>
              )}
              {parsedCashVES > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-700 text-sky-950 dark:text-sky-200 font-mono font-bold shrink-0">
                  🇻🇪 Bs. {parsedCashVES.toFixed(2)}
                  <button
                    type="button"
                    onClick={() => setCashVES('')}
                    className="hover:text-rose-600 font-black cursor-pointer text-xs ml-0.5"
                    title="Eliminar abono"
                  >
                    ×
                  </button>
                </span>
              )}
              {parsedPmVES > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 font-mono font-bold shrink-0">
                  📱 Bs. {parsedPmVES.toFixed(2)}
                  <button
                    type="button"
                    onClick={() => {
                      setPmAmountVES('');
                      setPmRef('');
                    }}
                    className="hover:text-rose-600 font-black cursor-pointer text-xs ml-0.5"
                    title="Eliminar abono"
                  >
                    ×
                  </button>
                </span>
              )}
              {parsedCardVES > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-200 font-mono font-bold shrink-0">
                  💳 Bs. {parsedCardVES.toFixed(2)}
                  <button
                    type="button"
                    onClick={() => {
                      setCardVES('');
                      setCardRef('');
                    }}
                    className="hover:text-rose-600 font-black cursor-pointer text-xs ml-0.5"
                    title="Eliminar abono"
                  >
                    ×
                  </button>
                </span>
              )}
              {parsedZelleUSD > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-700 text-indigo-950 dark:text-indigo-200 font-mono font-bold shrink-0">
                  🏛️ ${parsedZelleUSD.toFixed(2)}
                  <button
                    type="button"
                    onClick={() => {
                      setZelleUSD('');
                      setZelleRef('');
                    }}
                    className="hover:text-rose-600 font-black cursor-pointer text-xs ml-0.5"
                    title="Eliminar abono"
                  >
                    ×
                  </button>
                </span>
              )}
              {parsedBinanceUSDT > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-950/60 border border-yellow-300 dark:border-yellow-700 text-yellow-950 dark:text-yellow-200 font-mono font-bold shrink-0">
                  🟡 {parsedBinanceUSDT.toFixed(2)} USDT
                  <button
                    type="button"
                    onClick={() => {
                      setBinanceUSDT('');
                      setBinanceRef('');
                    }}
                    className="hover:text-rose-600 font-black cursor-pointer text-xs ml-0.5"
                    title="Eliminar abono"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* E. VISOR DE MÉTODO SELECCIONADO + SWITCH MONEDA + MONTO DIGITADO      */}
          {/* --------------------------------------------------------------------- */}
          <div
            className={`p-2.5 rounded-2xl border shadow-2xs space-y-2 ${
              isLight
                ? 'bg-white border-slate-200'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            {/* Cabecera del Método Activo con Switch Minimalista $ / Bs y Botón Restante */}
            <div className="flex items-center justify-between gap-2">
              {activeMethod === 'cash' ? (
                /* Switch de Moneda $ / Bs (Estilo Segmented Control iOS / Stripe) */
                <div
                  className={`p-1 rounded-xl border flex items-center shadow-2xs ${
                    isLight
                      ? 'bg-slate-100 border-slate-200/90'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCashCurrency('USD');
                      setActiveField('amount');
                    }}
                    className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center select-none ${
                      cashCurrency === 'USD'
                        ? isLight
                          ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/70'
                          : 'bg-slate-800 text-emerald-400 shadow-xs border border-slate-700'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    $
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCashCurrency('VES');
                      setActiveField('amount');
                    }}
                    className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center select-none ${
                      cashCurrency === 'VES'
                        ? isLight
                          ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/70'
                          : 'bg-slate-800 text-emerald-400 shadow-xs border border-slate-700'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Bs
                  </button>
                </div>
              ) : (
                /* Nombre e Ícono para métodos digitales/bancarios */
                <div className="flex items-center gap-1.5 min-w-0">
                  {React.createElement(currentMethodObj.icon, {
                    className: `w-4 h-4 shrink-0 ${currentMethodObj.color}`,
                  })}
                  <span
                    className={`text-xs font-semibold truncate ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {currentMethodObj.title}
                  </span>
                  <span
                    className={`text-[11px] ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    ({currentMethodObj.currency})
                  </span>
                </div>
              )}

              {/* Botón Rápido Restante */}
              <button
                type="button"
                onClick={() => handleFillExactRemaining(activeMethod)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold active:scale-95 cursor-pointer shrink-0 inline-flex items-center gap-1.5 transition-all shadow-2xs ${
                  isLight
                    ? 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border-slate-200'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-slate-800'
                }`}
                title="Pagar monto restante"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>Restante</span>
              </button>
            </div>

            {/* Display del Monto que se está digitando (READONLY para no abrir teclado OS) */}
            <div
              onClick={() => setActiveField('amount')}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                isLight
                  ? 'border-slate-200 bg-slate-50/70 hover:bg-slate-50'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              } ${
                activeField === 'amount'
                  ? isLight
                    ? 'ring-1 ring-slate-400'
                    : 'ring-1 ring-slate-700'
                  : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Monto:
                </span>
                <div
                  className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
                    isLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  {getCurrentFieldValue() || '0.00'}
                  {activeField === 'amount' && (
                    <span className="inline-block w-2 h-5 bg-emerald-500 ml-1 animate-pulse align-middle"></span>
                  )}
                </div>
              </div>

              <span
                className={`text-xs font-medium ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {activeMethod === 'cash'
                  ? cashCurrency === 'USD'
                    ? `≈ Bs. ${((parseFloat(getCurrentFieldValue()) || 0) * bcvRate).toFixed(2)}`
                    : `≈ $${((parseFloat(getCurrentFieldValue()) || 0) / (bcvRate || 1)).toFixed(2)} USD`
                  : activeMethod === 'zelle' || activeMethod === 'binance'
                  ? `≈ Bs. ${((parseFloat(getCurrentFieldValue()) || 0) * bcvRate).toFixed(2)}`
                  : `≈ $${((parseFloat(getCurrentFieldValue()) || 0) / (bcvRate || 1)).toFixed(2)} USD`}
              </span>
            </div>

            {/* Fila de Referencia (si aplica para el método) */}
            {currentMethodObj.hasRef && (
              <div
                onClick={() => setActiveField('ref')}
                className={`p-2 px-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                  isLight
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-slate-800 bg-slate-950/60'
                } ${
                  activeField === 'ref'
                    ? isLight
                      ? 'ring-1 ring-slate-400'
                      : 'ring-1 ring-slate-700'
                    : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-sky-500" />
                  <span
                    className={`text-xs font-medium ${
                      isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {currentMethodObj.refLabel}:
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      isLight ? 'text-sky-800' : 'text-sky-300'
                    }`}
                  >
                    {currentMethodObj.refValue || 'Sin ref'}
                    {activeField === 'ref' && (
                      <span className="inline-block w-1.5 h-3.5 bg-sky-500 ml-1 animate-pulse"></span>
                    )}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-sky-500">
                  {activeField === 'ref' ? '● Digitando' : 'Toca para ref'}
                </span>
              </div>
            )}

            {/* Accesos rápidos de Billetes en USD */}
            {activeMethod === 'cash' && cashCurrency === 'USD' && (
              <div className="flex items-center gap-1.5 pt-0.5">
                {[5, 10, 20, 50, 100].map((bill) => (
                  <button
                    key={bill}
                    type="button"
                    onClick={() => handleBillPreset(bill)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 border cursor-pointer ${
                      isLight
                        ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-800'
                    }`}
                  >
                    ${bill}
                  </button>
                ))}
              </div>
            )}

            {/* Accesos rápidos de Billetes en Bs */}
            {activeMethod === 'cash' && cashCurrency === 'VES' && (
              <div className="flex items-center gap-1.5 pt-0.5">
                {[50, 100, 200, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleVesPreset(amt)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 border cursor-pointer ${
                      isLight
                        ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-800'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* F. TECLADO NUMÉRICO TÁCTIL (GRID COMPACTO CON TECLAS CÓMODAS)         */}
          {/* --------------------------------------------------------------------- */}
          <div
            className={`p-2 sm:p-2.5 rounded-2xl border ${
              isLight ? 'bg-slate-50/50 border-slate-200/80 shadow-2xs' : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'].map((key) => {
                const isDel = key === 'DEL';
                const isDot = key === '.';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleNumpadKey(key)}
                    className={`h-9 sm:h-11 rounded-xl font-semibold text-base sm:text-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center select-none shadow-2xs ${
                      isDel
                        ? isLight
                          ? 'bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-slate-200'
                          : 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-slate-800'
                        : isDot
                        ? isLight
                          ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-800'
                        : isLight
                        ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 active:bg-slate-100'
                        : 'bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-800'
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
                className={`h-8 sm:h-9 rounded-xl text-xs font-medium transition-all active:scale-95 border cursor-pointer flex items-center justify-center gap-1 ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 shadow-2xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-800'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Limpiar</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillExactRemaining(activeMethod)}
                className={`h-8 sm:h-9 rounded-xl text-xs font-semibold transition-all active:scale-95 border cursor-pointer flex items-center justify-center gap-1 ${
                  isLight
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-slate-200 shadow-2xs'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Exacto</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveField('amount')}
                className={`h-8 sm:h-9 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1 shadow-2xs cursor-pointer ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Listo</span>
              </button>
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* G. BOTÓN PRINCIPAL DE CONFIRMACIÓN Y EMISIÓN DE TICKET                */}
          {/* --------------------------------------------------------------------- */}
          {isTrialExpired ? (
            <button
              type="button"
              onClick={onOpenLicenseModal}
              className="w-full py-3.5 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer bg-rose-600 hover:bg-rose-500 active:scale-98 border border-rose-400"
            >
              <Lock className="w-4 h-4 text-white" />
              <span>Prueba Finalizada - Activar Licencia</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmSale}
              disabled={!isCovered}
              className={`w-full py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !isCovered
                  ? isLight
                    ? 'cursor-not-allowed bg-slate-100 border border-slate-200 text-slate-400'
                    : 'cursor-not-allowed bg-slate-800/80 border border-slate-700 text-slate-500'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white shadow-md shadow-emerald-600/20'
              }`}
            >
              {!isCovered ? (
                <div
                  className={`flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold ${
                    isLight ? 'text-amber-800' : 'text-amber-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>
                    Falta: ${remainingUSD.toFixed(2)} USD (Bs. {remainingVES.toFixed(2)})
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 text-white stroke-[2.5]" />
                  <span className="text-white font-semibold text-sm sm:text-base tracking-wide">
                    {isCOD ? 'Confirmar Venta (COD)' : 'Confirmar Venta'}
                  </span>
                </div>
              )}
            </button>
          )}

          {/* Margen de Separación Inferior Seguro para que el botón flote holgadamente sobre la barra */}
          <div className="h-10 md:h-2 shrink-0" />
        </div>
      </div>
    </div>
  );
}
