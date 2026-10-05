/**
 * @fileoverview Funciones puras de cálculo financiero para el POS.
 * Sin dependencias de React, DOM o localStorage.
 * 100% testeable de forma aislada.
 */

import type { CartItem, MixedPaymentEntry } from '@/types/tablet-pos';

// ─── Totales del Carrito ────────────────────────────────────────────────────

export function calcCartTotals(cart: CartItem[], bcvRate: number) {
  const totalUSD = cart.reduce((acc, item) => acc + item.priceUSD * item.qty, 0);
  const totalVES = totalUSD * bcvRate;
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  return { totalUSD, totalVES, totalItems };
}

// ─── Vueltos en Efectivo ────────────────────────────────────────────────────

export function calcCashChange(
  cashUSDReceived: number,
  cashVESReceived: number,
  totalUSD: number,
  totalVES: number,
  bcvRate: number
) {
  const vueltoUSD = Math.max(0, cashUSDReceived - totalUSD);
  const vueltoVESfromUSD = vueltoUSD * bcvRate;
  const vueltoVESfromVES = Math.max(0, cashVESReceived - totalVES);
  const vueltoUSDfromVES = bcvRate > 0 ? vueltoVESfromVES / bcvRate : 0;
  return { vueltoUSD, vueltoVESfromUSD, vueltoVESfromVES, vueltoUSDfromVES };
}

// ─── Pago Mixto / Combinado ─────────────────────────────────────────────────

export function calcMixedPayments(
  mixedPayments: MixedPaymentEntry[],
  totalUSD: number,
  totalVES: number,
  bcvRate: number
) {
  const mixedPaidUSD = mixedPayments.reduce((acc, p) => acc + p.amountUSD, 0);
  const mixedPaidVES = mixedPayments.reduce((acc, p) => acc + p.amountVES, 0);
  const mixedPendingUSD = Math.max(0, totalUSD - mixedPaidUSD);
  const mixedPendingVES = Math.max(0, totalVES - mixedPaidVES);
  const mixedChangeUSD = Math.max(0, mixedPaidUSD - totalUSD);
  const mixedChangeVES = Math.max(0, mixedPaidVES - totalVES);
  const isMixedComplete =
    totalUSD > 0 &&
    (mixedPaidUSD >= totalUSD - 0.01 ||
      (bcvRate > 0 && mixedPaidVES >= totalVES - 0.05));
  return {
    mixedPaidUSD,
    mixedPaidVES,
    mixedPendingUSD,
    mixedPendingVES,
    mixedChangeUSD,
    mixedChangeVES,
    isMixedComplete,
  };
}

// ─── Validación Global de Cobro ─────────────────────────────────────────────

export type PaymentMethod =
  | 'pago_movil'
  | 'cash_usd'
  | 'cash_ves'
  | 'card_debit'
  | 'zelle'
  | 'mixed';

export type FulfillmentMode = 'local' | 'delivery_paid' | 'delivery_cod';

export function calcPaymentValidation(
  fulfillmentMode: FulfillmentMode,
  selectedPaymentMethod: PaymentMethod,
  cashUSDReceived: number,
  cashVESReceived: number,
  totalUSD: number,
  totalVES: number,
  bcvRate: number,
  isMixedComplete: boolean,
  mixedPendingUSD: number,
  mixedPendingVES: number
) {
  let isPaymentComplete = false;
  let missingAmountUSD = 0;
  let missingAmountVES = 0;

  if (fulfillmentMode === 'delivery_cod') {
    isPaymentComplete = true; // Cobra al entregar en destino
  } else if (selectedPaymentMethod === 'mixed') {
    isPaymentComplete = isMixedComplete;
    missingAmountUSD = mixedPendingUSD;
    missingAmountVES = mixedPendingVES;
  } else if (selectedPaymentMethod === 'cash_usd') {
    isPaymentComplete = cashUSDReceived >= totalUSD - 0.01;
    missingAmountUSD = Math.max(0, totalUSD - cashUSDReceived);
    missingAmountVES = missingAmountUSD * bcvRate;
  } else if (selectedPaymentMethod === 'cash_ves') {
    isPaymentComplete = cashVESReceived >= totalVES - 0.05;
    missingAmountVES = Math.max(0, totalVES - cashVESReceived);
    missingAmountUSD = bcvRate > 0 ? missingAmountVES / bcvRate : 0;
  } else {
    // Pago Móvil, Punto/Tarjeta, Zelle: completo al confirmar
    isPaymentComplete = true;
  }

  return { isPaymentComplete, missingAmountUSD, missingAmountVES };
}

// ─── Generar Número de Ticket Único ─────────────────────────────────────────

export function generateTicketNumber() {
  return `TK-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function generateOrderNumber() {
  return `PED-${Math.floor(100 + Math.random() * 900)}`;
}

// ─── Formato de Moneda ───────────────────────────────────────────────────────

export function fmtUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function fmtVES(amount: number): string {
  return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
