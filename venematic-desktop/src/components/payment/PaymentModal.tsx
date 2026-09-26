'use client';

import { useState, useEffect, useRef } from 'react';
import { PaymentService, type PaymentMethod, type CashChange } from '@/lib/utils/payment-service';
import { getProductIcon } from '@/lib/utils/product-icons';
import { handleNumpadInputKeyDown, handleNumericInputFocus } from '@/lib/utils/numpad-helper';

export interface CartModalItem {
  name: string;
  quantity: number;
  priceUSD: number;
  subtotalUSD: number;
  category?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (paymentData: PaymentResult) => void;
  totalUSD: number;
  totalBS: number;
  bcvRate: number;
  applyIgtf: boolean;
  cartItems?: CartModalItem[];
}

export interface PaymentResult {
  method: PaymentMethod;
  amountUSD: number;
  amountBS: number;
  reference: string;
  bank?: string;
  phone?: string;
  change?: CashChange | null;
}

export function PaymentModal({
  isOpen,
  onClose,
  onComplete,
  totalUSD,
  totalBS,
  bcvRate,
  applyIgtf,
  cartItems = [],
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'card' | 'digital'>('card');
  const [receivedUSD, setReceivedUSD] = useState<string>('');
  const [receivedBS, setReceivedBS] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('0102 - Banco de Venezuela');
  const [phoneNumber, setPhoneNumber] = useState<string>('04121234567');
  const [orderNumber] = useState<string>(`#VM-POS-${Math.floor(1000 + Math.random() * 9000)}`);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const primaryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setReceivedUSD(totalUSD.toFixed(2));
      setReceivedBS(totalBS.toFixed(2));
      setReference(`REF-${Date.now().toString().slice(-6)}`);
      
      const timer = setTimeout(() => {
        primaryInputRef.current?.focus();
        primaryInputRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, totalUSD, totalBS]);

  // Global Numpad listener inside modal: NumpadEnter or Enter finalizes payment
  useEffect(() => {
    if (!isOpen) return;

    const handleModalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' || e.code === 'NumpadEnter') {
        const target = e.target as HTMLElement;
        if (target && target.tagName === 'BUTTON') return; // let button click handle itself
        e.preventDefault();
        handleFinalize();
      }
    };

    window.addEventListener('keydown', handleModalKeyDown);
    return () => window.removeEventListener('keydown', handleModalKeyDown);
  }, [isOpen, totalUSD, totalBS, reference, selectedBank, phoneNumber, selectedMethod]);

  if (!isOpen) return null;

  const subtotal = totalUSD / (applyIgtf ? 1.19 : 1.16);
  const iva = subtotal * 0.16;

  const handleFinalize = () => {
    setIsProcessing(true);
    setTimeout(() => {
      let mappedMethod: PaymentMethod = 'card';
      if (selectedMethod === 'cash') mappedMethod = 'cash';
      if (selectedMethod === 'digital') mappedMethod = 'mobile_payment';

      const result: PaymentResult = {
        method: mappedMethod,
        amountUSD: totalUSD,
        amountBS: totalBS,
        reference: reference || `REF-${Date.now().toString().slice(-6)}`,
        bank: selectedBank,
        phone: phoneNumber,
      };

      setIsProcessing(false);
      onComplete(result);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-montserrat animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/90 dark:border-slate-700 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
              🛒
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-tight">
                VENEMARKET
              </span>
              <span className="text-xs text-slate-400 ml-2 font-medium">
                Punto de Venta (POS)
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: 2 Columns (Screenshot 3) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700">
          {/* Left Column: Pedido Actual (5 cols) */}
          <div className="md:col-span-5 p-5 flex flex-col justify-between bg-slate-50/40 dark:bg-slate-900/20">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                  Pedido Actual: <span className="text-blue-600">{orderNumber}</span>
                </h3>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 py-2 border-b border-slate-100 dark:border-slate-700">
                <div className="col-span-6">Producto</div>
                <div className="col-span-2 text-center">Cant.</div>
                <div className="col-span-2 text-right">Precio</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Item Lines with Thumbnails */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin my-1">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 items-center py-2.5 text-xs">
                    <div className="col-span-6 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm flex-shrink-0">
                        {getProductIcon(item.name, item.category)}
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-white truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="col-span-2 text-center font-bold text-slate-600 dark:text-slate-300">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 text-right text-slate-500 text-[11px]">
                      ${item.priceUSD.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-right font-bold text-slate-800 dark:text-white">
                      ${item.subtotalUSD.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtotal / Tax / Total Block */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>IVA (16%):</span>
                <span className="font-semibold">${iva.toFixed(2)}</span>
              </div>
              {applyIgtf && (
                <div className="flex justify-between text-xs text-amber-600 font-medium">
                  <span>IGTF (3%):</span>
                  <span>${(totalUSD * 0.03).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200/60 dark:border-slate-700">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  TOTAL:
                </span>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    ${totalUSD.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    ≈ Bs. {totalBS.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pago y Finalización (7 cols) - Screenshot 3 */}
          <div className="md:col-span-7 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                  Pago y Finalización
                </h3>
                <span className="text-xs text-slate-400">
                  Tasa: <strong className="text-slate-700 dark:text-slate-200">{bcvRate.toFixed(2)} Bs/$</strong>
                </span>
              </div>

              {/* Payment Method Selector Cards (Screenshot 3) */}
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
                  Seleccionar Método de Pago
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {/* [EFECTIVO] */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('cash')}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${
                      selectedMethod === 'cash'
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-500 mb-1 tracking-wider uppercase">
                      [EFECTIVO]
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl mb-1 shadow-xs">
                      💵
                    </div>
                    <span className="text-xs font-bold leading-tight">
                      Efectivo
                    </span>
                  </button>

                  {/* [TARJETA] */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('card')}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${
                      selectedMethod === 'card'
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-500 mb-1 tracking-wider uppercase">
                      [TARJETA]
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl mb-1 shadow-xs">
                      💳
                    </div>
                    <span className="text-xs font-bold leading-tight">
                      Tarjeta (Crédito/Débito)
                    </span>
                  </button>

                  {/* [MONEDERO DIGITAL] */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('digital')}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${
                      selectedMethod === 'digital'
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-500 mb-1 tracking-wider uppercase">
                      [MONEDERO DIGITAL]
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl mb-1 shadow-xs">
                      📱
                    </div>
                    <span className="text-xs font-bold leading-tight">
                      Monedero Digital
                    </span>
                  </button>
                </div>
              </div>

              {/* Interactive Inputs according to method */}
              {/* Interactive Inputs according to method */}
              {selectedMethod === 'cash' && (() => {
                const numUSD = parseFloat(receivedUSD.replace(',', '.')) || 0;
                const numBS = parseFloat(receivedBS.replace(',', '.')) || 0;
                // Si el usuario ingresó Bs, calculamos el equivalente en $; si ingresó $, calculamos el equivalente en Bs
                const convertedUSDFromBS = bcvRate > 0 ? numBS / bcvRate : 0;
                const convertedBSFromUSD = numUSD * bcvRate;

                // Diferencia en efectivo según la divisa preferida
                const isPayingInBS = numBS > 0 && numUSD === 0;
                const paidTotalUSD = isPayingInBS ? convertedUSDFromBS : numUSD;
                const rawDiffUSD = paidTotalUSD - totalUSD;
                const isComplete = rawDiffUSD >= -0.009;
                const changeUSD = Math.max(0, rawDiffUSD);
                const changeBS = changeUSD * bcvRate;
                const pendingUSD = Math.max(0, -rawDiffUSD);
                const pendingBS = pendingUSD * bcvRate;

                return (
                  <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-200 dark:border-slate-600 text-xs">
                    {/* Billetes Rápidos */}
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Billetes Rápidos:
                      </span>
                      <div className="grid grid-cols-6 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setReceivedUSD(totalUSD.toFixed(2));
                            setReceivedBS('');
                          }}
                          className="min-h-[44px] px-1 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg text-xs"
                        >
                          Exacto $
                        </button>
                        {['5', '10', '20', '50', '100'].map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              setReceivedUSD(b);
                              setReceivedBS('');
                            }}
                            className="min-h-[44px] bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold rounded-lg text-xs text-slate-800 dark:text-white"
                          >
                            ${b}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Monto Recibido ($)</label>
                        <input
                          ref={primaryInputRef}
                          type="text"
                          inputMode="decimal"
                          value={receivedUSD}
                          onFocus={handleNumericInputFocus}
                          onChange={(e) => {
                            setReceivedUSD(e.target.value.replace(',', '.'));
                            if (e.target.value) setReceivedBS('');
                          }}
                          onKeyDown={(e) => handleNumpadInputKeyDown(e, { onEnter: handleFinalize })}
                          className="input-field py-2 text-sm font-black text-emerald-700 dark:text-emerald-400"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Monto Recibido (Bs)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={receivedBS}
                          onFocus={handleNumericInputFocus}
                          onChange={(e) => {
                            setReceivedBS(e.target.value.replace(',', '.'));
                            if (e.target.value) setReceivedUSD('');
                          }}
                          onKeyDown={(e) => handleNumpadInputKeyDown(e, { onEnter: handleFinalize })}
                          className="input-field py-2 text-sm font-black text-sky-700 dark:text-sky-300"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Conversor en Vivo */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-xs">
                      <span className="text-sky-900 dark:text-sky-300 font-semibold flex items-center gap-1">
                        <span>💱</span>
                        <span>Conversión en tiempo real:</span>
                      </span>
                      <span className="font-mono font-black text-sky-800 dark:text-sky-200">
                        {isPayingInBS ? `≈ $${convertedUSDFromBS.toFixed(2)} USD` : `≈ Bs. ${convertedBSFromUSD.toFixed(2)}`}
                      </span>
                    </div>

                    {/* Cuadro de Vuelto / Faltante de Alto Contraste */}
                    <div
                      className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all ${
                        isComplete
                          ? 'bg-emerald-700 dark:bg-emerald-800 border-emerald-400 text-white shadow-lg'
                          : 'bg-rose-700 dark:bg-rose-800 border-rose-400 text-white shadow-lg'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider block text-white drop-shadow-sm">
                          {isComplete ? 'Vuelto a Entregar al Cliente:' : 'Monto Faltante por Pagar:'}
                        </span>
                        <span className="text-[10px] font-bold block text-white/90">
                          {isComplete ? 'Diferencia a favor del cliente' : 'Aún no cubre el total'}
                        </span>
                      </div>

                      <div className="text-right">
                        {isComplete ? (
                          <>
                            <span className="text-xl font-black font-mono text-white block tabular-numbers drop-shadow-sm">
                              ${changeUSD.toFixed(2)} USD
                            </span>
                            <span className="text-[11px] font-bold font-mono text-emerald-100 block tabular-numbers">
                              ≈ Bs. {changeBS.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-xl font-black font-mono text-white block tabular-numbers drop-shadow-sm">
                              Faltan ${pendingUSD.toFixed(2)} USD
                            </span>
                            <span className="text-[11px] font-bold font-mono text-rose-100 block tabular-numbers">
                              ≈ Bs. {pendingBS.toFixed(2)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {selectedMethod === 'digital' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-200 dark:border-slate-600 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Banco Origen / Destino</label>
                    <input
                      type="text"
                      value={selectedBank}
                      onFocus={handleNumericInputFocus}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      onKeyDown={(e) => handleNumpadInputKeyDown(e, { onEnter: handleFinalize })}
                      className="input-field py-1.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Referencia / Teléfono</label>
                    <input
                      ref={primaryInputRef}
                      type="text"
                      value={reference}
                      onFocus={handleNumericInputFocus}
                      onChange={(e) => setReference(e.target.value)}
                      onKeyDown={(e) => handleNumpadInputKeyDown(e, { onEnter: handleFinalize })}
                      className="input-field py-1.5 text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Status Processing Banner (Screenshot 3) */}
              <div className="flex items-center justify-between p-3.5 bg-slate-100 dark:bg-slate-700/60 rounded-2xl border border-slate-200/80 dark:border-slate-600">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {selectedMethod === 'card' && 'Procesando pago con tarjeta...'}
                    {selectedMethod === 'cash' && 'Pago en efectivo listo para registrar'}
                    {selectedMethod === 'digital' && 'Pago móvil / QR validado'}
                  </span>
                </div>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  ${totalUSD.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons: FINALIZAR VENTA & Cancelar Venta (Screenshot 3) */}
            <div className="grid grid-cols-12 gap-3 pt-5">
              <button
                type="button"
                onClick={handleFinalize}
                disabled={isProcessing}
                className="col-span-8 bg-pos-success hover:bg-pos-success-hover active:scale-[0.98] text-white font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/25 transition-all"
              >
                {isProcessing ? (
                  <span>PROCESANDO...</span>
                ) : (
                  <>
                    <span>FINALIZAR VENTA</span>
                    <span className="text-lg">✔</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="col-span-4 bg-pos-danger hover:bg-pos-danger-hover active:scale-[0.98] text-white font-bold text-sm py-4 px-3 rounded-2xl flex items-center justify-center transition-all shadow-md shadow-red-700/20"
              >
                Cancelar Venta
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Banner (Screenshot 3) */}
        <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 text-center">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            VENEMARKET POS v1.2 | Sistema de Pago Seguro
          </p>
        </div>
      </div>
    </div>
  );
}
