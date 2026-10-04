'use client';

import { useState, useCallback } from 'react';
import type {
  CartItem,
  Customer,
  MixedPaymentEntry,
  CompletedSaleTicket,
  PosOrder,
  Motorizado,
  CompanyInfo,
} from '@/types/tablet-pos';
import {
  calcMixedPayments,
  calcPaymentValidation,
  calcCashChange,
  generateTicketNumber,
  generateOrderNumber,
  type PaymentMethod,
  type FulfillmentMode,
} from '@/lib/pos/cart-calculations';
import { db } from '@/lib/db';

export interface UseCheckoutReturn {
  // Payment Method
  selectedPaymentMethod: PaymentMethod;
  setSelectedPaymentMethod: (m: PaymentMethod) => void;
  pagoMovilRefInput: string;
  setPagoMovilRefInput: (v: string) => void;
  cashUSDReceived: number;
  setCashUSDReceived: (v: number) => void;
  cashVESReceived: number;
  setCashVESReceived: (v: number) => void;
  cardVoucherRef: string;
  setCardVoucherRef: (v: string) => void;
  zelleConfirmation: string;
  setZelleConfirmation: (v: string) => void;
  copiedPmAlert: boolean;

  // Fulfillment
  fulfillmentMode: FulfillmentMode;
  setFulfillmentMode: (m: FulfillmentMode) => void;
  selectedDriverId: string;
  setSelectedDriverId: (id: string) => void;
  deliveryAddressInput: string;
  setDeliveryAddressInput: (v: string) => void;

  // Mixed Payments
  mixedPayments: MixedPaymentEntry[];
  mixedInputMethod: PaymentMethod;
  setMixedInputMethod: (m: PaymentMethod) => void;
  mixedInputCurrency: 'USD' | 'VES';
  setMixedInputCurrency: (c: 'USD' | 'VES') => void;
  mixedInputAmount: string;
  setMixedInputAmount: (v: string) => void;
  mixedInputRef: string;
  setMixedInputRef: (v: string) => void;
  handleAddMixedPayment: () => void;
  handleRemoveMixedPayment: (id: string) => void;

  // Computed
  vueltoUSD: number;
  vueltoVESfromUSD: number;
  vueltoVESfromVES: number;
  mixedPaidUSD: number;
  mixedPaidVES: number;
  mixedPendingUSD: number;
  mixedPendingVES: number;
  mixedChangeUSD: number;
  mixedChangeVES: number;
  isMixedComplete: boolean;
  isPaymentComplete: boolean;
  missingAmountUSD: number;
  missingAmountVES: number;

  // Ticket & Sale
  completedSaleTicket: CompletedSaleTicket | null;
  setCompletedSaleTicket: (t: CompletedSaleTicket | null) => void;
  handleFinalizeSale: () => void;
  handleCopyPagoMovilData: (pagoMovilInfo: { bank: string; phone: string; idDoc: string; ownerName: string }, totalVES: number) => void;
}

interface UseCheckoutOptions {
  cart: CartItem[];
  clearCart: () => void;
  totalUSD: number;
  totalVES: number;
  bcvRate: number;
  selectedCustomer: Customer;
  activeTable: number | null;
  drivers: Motorizado[];
  orders: PosOrder[];
  setOrders: React.Dispatch<React.SetStateAction<PosOrder[]>>;
  companyInfo: CompanyInfo;
}

export function useCheckout({
  cart,
  clearCart,
  totalUSD,
  totalVES,
  bcvRate,
  selectedCustomer,
  activeTable,
  drivers,
  orders,
  setOrders,
  companyInfo: _companyInfo,
}: UseCheckoutOptions): UseCheckoutReturn {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('pago_movil');
  const [pagoMovilRefInput, setPagoMovilRefInput] = useState('');
  const [cashUSDReceived, setCashUSDReceived] = useState(0);
  const [cashVESReceived, setCashVESReceived] = useState(0);
  const [cardVoucherRef, setCardVoucherRef] = useState('');
  const [zelleConfirmation, setZelleConfirmation] = useState('');
  const [copiedPmAlert, setCopiedPmAlert] = useState(false);

  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>('local');
  const [selectedDriverId, setSelectedDriverId] = useState('1');
  const [deliveryAddressInput, setDeliveryAddressInput] = useState('');

  const [mixedPayments, setMixedPayments] = useState<MixedPaymentEntry[]>([]);
  const [mixedInputMethod, setMixedInputMethod] = useState<PaymentMethod>('cash_usd');
  const [mixedInputCurrency, setMixedInputCurrency] = useState<'USD' | 'VES'>('USD');
  const [mixedInputAmount, setMixedInputAmount] = useState('');
  const [mixedInputRef, setMixedInputRef] = useState('');

  const [completedSaleTicket, setCompletedSaleTicket] = useState<CompletedSaleTicket | null>(null);

  // ─── Computed: Vueltos ──────────────────────────────────────────────────────
  const { vueltoUSD, vueltoVESfromUSD, vueltoVESfromVES } = calcCashChange(
    cashUSDReceived,
    cashVESReceived,
    totalUSD,
    totalVES,
    bcvRate
  );

  // ─── Computed: Pago Mixto ───────────────────────────────────────────────────
  const {
    mixedPaidUSD,
    mixedPaidVES,
    mixedPendingUSD,
    mixedPendingVES,
    mixedChangeUSD,
    mixedChangeVES,
    isMixedComplete,
  } = calcMixedPayments(mixedPayments, totalUSD, totalVES, bcvRate);

  // ─── Computed: Validación de Pago ──────────────────────────────────────────
  const { isPaymentComplete, missingAmountUSD, missingAmountVES } = calcPaymentValidation(
    fulfillmentMode,
    selectedPaymentMethod,
    cashUSDReceived,
    cashVESReceived,
    totalUSD,
    totalVES,
    bcvRate,
    isMixedComplete,
    mixedPendingUSD,
    mixedPendingVES
  );

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleAddMixedPayment = useCallback(() => {
    const val = parseFloat(mixedInputAmount);
    if (isNaN(val) || val <= 0) return;

    const valUSD = mixedInputCurrency === 'USD' ? val : bcvRate > 0 ? val / bcvRate : 0;
    const valVES = mixedInputCurrency === 'VES' ? val : val * bcvRate;

    const newEntry: MixedPaymentEntry = {
      id: `mix_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      method: mixedInputMethod as MixedPaymentEntry['method'],
      currency: mixedInputCurrency,
      amount: val,
      amountUSD: valUSD,
      amountVES: valVES,
      reference: mixedInputRef.trim() || undefined,
    };

    setMixedPayments((prev) => [...prev, newEntry]);
    setMixedInputAmount('');
    setMixedInputRef('');
  }, [mixedInputAmount, mixedInputCurrency, mixedInputMethod, mixedInputRef, bcvRate]);

  const handleRemoveMixedPayment = useCallback((id: string) => {
    setMixedPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleCopyPagoMovilData = useCallback(
    (pagoMovilInfo: { bank: string; phone: string; idDoc: string; ownerName: string }, vesTotal: number) => {
      const text =
        `*DATOS PARA PAGO MÓVIL*\n` +
        `🏦 Banco: ${pagoMovilInfo.bank}\n` +
        `📱 Teléfono: ${pagoMovilInfo.phone}\n` +
        `📄 Cédula/RIF: ${pagoMovilInfo.idDoc}\n` +
        `👤 Titular: ${pagoMovilInfo.ownerName}\n` +
        `💰 Monto en Bs: Bs. ${vesTotal.toFixed(2)}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopiedPmAlert(true);
        setTimeout(() => setCopiedPmAlert(false), 2500);
      }
    },
    []
  );

  const handleFinalizeSale = useCallback(() => {
    if (cart.length === 0) {
      alert('La comanda está vacía. Agrega productos antes de liquidar.');
      return;
    }
    if (!isPaymentComplete) {
      alert(
        `No se puede completar el cobro: Aún faltan $${missingAmountUSD.toFixed(2)} USD ` +
          `(Bs. ${missingAmountVES.toFixed(2)}) para cubrir el total de la cuenta.`
      );
      return;
    }

    const ticketNo = generateTicketNumber();
    const orderNo = generateOrderNumber();
    const now = new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });

    let refNumber = '';
    let ticketPaymentMethod: string = selectedPaymentMethod;
    let finalAmountReceivedUSD: number | undefined;
    let finalChangeUSD: number | undefined;
    let finalChangeVES: number | undefined;

    if (fulfillmentMode === 'delivery_cod') {
      ticketPaymentMethod = 'Cobro en Destino (Delivery)';
    } else if (selectedPaymentMethod === 'mixed') {
      ticketPaymentMethod = 'Pago Mixto / Combinado';
      refNumber = mixedPayments
        .map(
          (p) =>
            `${p.method === 'cash_usd' ? '$' : p.method === 'cash_ves' ? 'Bs' : p.method}: ` +
            `${p.currency === 'USD' ? '$' + p.amount.toFixed(2) : 'Bs.' + p.amount.toFixed(2)}` +
            `${p.reference ? ` (Ref: ${p.reference})` : ''}`
        )
        .join(' | ');
      finalAmountReceivedUSD = mixedPaidUSD;
      finalChangeUSD = mixedChangeUSD;
      finalChangeVES = mixedChangeVES;
    } else if (selectedPaymentMethod === 'cash_usd') {
      finalAmountReceivedUSD = cashUSDReceived;
      finalChangeUSD = vueltoUSD;
      finalChangeVES = vueltoVESfromUSD;
    } else if (selectedPaymentMethod === 'cash_ves') {
      finalChangeVES = vueltoVESfromVES;
    } else if (selectedPaymentMethod === 'pago_movil') {
      refNumber = pagoMovilRefInput || 'S/R';
    } else if (selectedPaymentMethod === 'card_debit') {
      refNumber = cardVoucherRef || 'Lote-POS';
    } else if (selectedPaymentMethod === 'zelle') {
      refNumber = zelleConfirmation || 'Zelle-OK';
    }

    const chosenDriver = drivers.find((d) => d.id === selectedDriverId);
    const tableLabel =
      fulfillmentMode === 'local'
        ? activeTable
          ? `Mesa #${activeTable}`
          : 'Barra / Mostrador'
        : `Delivery (${chosenDriver?.name || 'Motorizado'})`;

    const saleTicket: CompletedSaleTicket = {
      ticketNumber: ticketNo,
      timestamp: now,
      items: [...cart],
      subtotalUSD: totalUSD,
      totalUSD,
      totalVES,
      bcvRate,
      paymentMethod: ticketPaymentMethod,
      reference: refNumber,
      amountReceivedUSD: finalAmountReceivedUSD,
      changeUSD: finalChangeUSD,
      changeVES: finalChangeVES,
      customer: selectedCustomer,
      table: tableLabel,
      mixedPayments: selectedPaymentMethod === 'mixed' ? [...mixedPayments] : undefined,
    };

    const newOrder: PosOrder = {
      id: `ord_${Date.now()}`,
      orderNumber: orderNo,
      type: fulfillmentMode === 'local' ? 'local' : 'delivery',
      status: 'en_cola',
      paymentStatus: fulfillmentMode === 'delivery_cod' ? 'por_cobrar' : 'pagado',
      paymentMethod: ticketPaymentMethod,
      items: [...cart],
      totalUSD,
      totalVES,
      customer: selectedCustomer,
      table: fulfillmentMode === 'local' ? (activeTable ? `Mesa #${activeTable}` : 'Mostrador') : undefined,
      driverId: fulfillmentMode !== 'local' ? selectedDriverId : undefined,
      driverName: fulfillmentMode !== 'local' ? (chosenDriver?.name || 'Por Asignar') : undefined,
      deliveryAddress:
        fulfillmentMode !== 'local'
          ? deliveryAddressInput || selectedCustomer.address || 'Entrega a Domicilio'
          : undefined,
      createdAt: new Date().toISOString(),
      timeFormatted: 'Ahora',
    };

    const nextOrders = [newOrder, ...orders];
    setOrders(nextOrders);

    try {
      localStorage.setItem('klikpos_tablet_orders', JSON.stringify(nextOrders));
      const pastSales = JSON.parse(localStorage.getItem('klikpos_tablet_sales') || '[]');
      localStorage.setItem('klikpos_tablet_sales', JSON.stringify([saleTicket, ...pastSales.slice(0, 100)]));

      db.sales
        .add({
          receiptNumber: ticketNo,
          timestamp: new Date().toISOString(),
          items: cart.map((i) => ({
            productId: Number(i.id) || 1,
            name: i.name,
            barcode: i.sku || 'SKU-00',
            qty: i.qty,
            priceUSD: i.priceUSD,
            totalUSD: i.priceUSD * i.qty,
          })),
          subtotalUSD: totalUSD,
          taxUSD: 0,
          totalUSD,
          totalVES,
          bcvRate,
          payments:
            selectedPaymentMethod === 'mixed'
              ? mixedPayments.map((p) => ({
                  method: p.method as any,
                  amountUSD: p.amountUSD,
                  amountVES: p.amountVES,
                  reference: p.reference,
                }))
              : [
                  {
                    method: (fulfillmentMode === 'delivery_cod' ? 'cash_usd' : selectedPaymentMethod) as any,
                    amountUSD: totalUSD,
                    amountVES: totalVES,
                    reference: refNumber,
                  },
                ],
          changeUSD: finalChangeUSD || 0,
          changeVES: finalChangeVES || 0,
          cashierName: 'Cajero Tablet',
          customerName: selectedCustomer.name,
          customerDoc: selectedCustomer.docId,
          status: (fulfillmentMode === 'delivery_cod' ? 'pending' : 'completed') as any,
          source: 'tablet',
        })
        .catch(() => {});
    } catch {}

    setCompletedSaleTicket(saleTicket);
    clearCart();
    setPagoMovilRefInput('');
    setCashUSDReceived(0);
    setCashVESReceived(0);
    setDeliveryAddressInput('');
    setMixedPayments([]);
  }, [
    cart,
    clearCart,
    isPaymentComplete,
    missingAmountUSD,
    missingAmountVES,
    selectedPaymentMethod,
    fulfillmentMode,
    mixedPayments,
    mixedPaidUSD,
    mixedChangeUSD,
    mixedChangeVES,
    cashUSDReceived,
    cashVESReceived,
    vueltoUSD,
    vueltoVESfromUSD,
    vueltoVESfromVES,
    pagoMovilRefInput,
    cardVoucherRef,
    zelleConfirmation,
    drivers,
    selectedDriverId,
    deliveryAddressInput,
    selectedCustomer,
    activeTable,
    totalUSD,
    totalVES,
    bcvRate,
    orders,
    setOrders,
  ]);

  return {
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    pagoMovilRefInput,
    setPagoMovilRefInput,
    cashUSDReceived,
    setCashUSDReceived,
    cashVESReceived,
    setCashVESReceived,
    cardVoucherRef,
    setCardVoucherRef,
    zelleConfirmation,
    setZelleConfirmation,
    copiedPmAlert,
    fulfillmentMode,
    setFulfillmentMode,
    selectedDriverId,
    setSelectedDriverId,
    deliveryAddressInput,
    setDeliveryAddressInput,
    mixedPayments,
    mixedInputMethod: mixedInputMethod as PaymentMethod,
    setMixedInputMethod: setMixedInputMethod as (m: PaymentMethod) => void,
    mixedInputCurrency,
    setMixedInputCurrency,
    mixedInputAmount,
    setMixedInputAmount,
    mixedInputRef,
    setMixedInputRef,
    handleAddMixedPayment,
    handleRemoveMixedPayment,
    vueltoUSD,
    vueltoVESfromUSD,
    vueltoVESfromVES,
    mixedPaidUSD,
    mixedPaidVES,
    mixedPendingUSD,
    mixedPendingVES,
    mixedChangeUSD,
    mixedChangeVES,
    isMixedComplete,
    isPaymentComplete,
    missingAmountUSD,
    missingAmountVES,
    completedSaleTicket,
    setCompletedSaleTicket,
    handleFinalizeSale,
    handleCopyPagoMovilData,
  };
}
