'use client';

import React from 'react';
import { formatUSD, formatVES } from '@/lib/formatters';
import { SaleItem, LocalSale } from '@/lib/db';

interface CartItem extends SaleItem {
  stock: number;
}

interface PosCartTableProps {
  rightPanelTab: 'cart' | 'shift';
  onSetRightPanelTab: (tab: 'cart' | 'shift') => void;
  cart: CartItem[];
  selectedCartItemId: number | null;
  onSelectCartItem: (productId: number) => void;
  onUpdateQty: (productId: number, qty: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  bcvRate: number;
  totalUSD: number;
  totalVES: number;
  shiftSales: LocalSale[];
  onOpenPaymentModal: () => void;
}

export default function PosCartTable({
  rightPanelTab,
  onSetRightPanelTab,
  cart,
  selectedCartItemId,
  onSelectCartItem,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  bcvRate,
  totalUSD,
  totalVES,
  shiftSales,
  onOpenPaymentModal,
}: PosCartTableProps) {
  return (
    <>
      {/* Tabs: Ticket Activo | Ventas del Turno */}
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onSetRightPanelTab('cart')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
            rightPanelTab === 'cart'
              ? 'bg-[var(--brand-primary)] text-white shadow-xs'
              : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <span>Ticket Activo</span>
          {cart.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">{cart.length}</span>
          )}
        </button>
        <button
          onClick={() => onSetRightPanelTab('shift')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
            rightPanelTab === 'shift'
              ? 'bg-[var(--brand-primary)] text-white shadow-xs'
              : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Ventas del Turno</span>
          {shiftSales.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-[10px] font-black">{shiftSales.length}</span>
          )}
        </button>
      </div>

      {/* ---- TAB: TICKET ACTIVO ---- */}
      {rightPanelTab === 'cart' && (
        <div className="pos-white-card flex-1 min-h-0 bg-white dark:bg-white rounded-2xl border-2 border-[var(--brand-primary)]/30 dark:border-sky-500/20 shadow-md flex flex-col p-3.5 overflow-hidden">
          {/* Cabecera del Ticket */}
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                Ticket Activo
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                {cart.length} {cart.length === 1 ? 'ítem' : 'items'}
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Vaciar
              </button>
            )}
          </div>

          {/* Lista de Ítems */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {cart.map((item) => {
              const isSelected = selectedCartItemId === item.productId;
              return (
                <div
                  key={item.productId}
                  onClick={() => onSelectCartItem(item.productId)}
                  className={`py-2 px-2 flex items-center justify-between gap-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-500/70 shadow-xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      ${item.priceUSD.toFixed(2)} c/u × {item.qty}
                    </p>
                  </div>

                  {/* Controles de Cantidad */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQty(item.productId, item.qty - 1);
                      }}
                      className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded flex items-center justify-center text-xs cursor-pointer border border-transparent dark:border-slate-700"
                    >
                      -
                    </button>
                    <span className="w-7 text-center font-mono font-bold text-xs tabular-numbers text-slate-900 dark:text-white">
                      {item.qty}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQty(item.productId, item.qty + 1);
                      }}
                      className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded flex items-center justify-center text-xs cursor-pointer border border-transparent dark:border-slate-700"
                    >
                      +
                    </button>
                  </div>

                  {/* Total por línea */}
                  <div className="text-right min-w-[75px]">
                    <span className="text-xs font-mono font-black text-slate-900 dark:text-slate-100 block tabular-numbers">
                      {formatVES(item.totalUSD * bcvRate)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block tabular-numbers">
                      ${item.totalUSD.toFixed(2)}
                    </span>
                  </div>

                  {/* Eliminar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item.productId);
                    }}
                    className="text-slate-400 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 px-1 text-sm font-bold cursor-pointer"
                    title="Eliminar ítem"
                  >
                    &times;
                  </button>
                </div>
              );
            })}

            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 gap-3 select-none">
                <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 stroke-[1.25]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">El ticket está vacío.</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Escanee o seleccione productos.</p>
                </div>
              </div>
            )}
          </div>

          {/* Gran Total del Ticket con Separación Nítida Anti-Colisión */}
          <div
            className="pt-3 border-t-2 space-y-2 mt-auto shrink-0 -mx-3 -mb-3 p-3.5 rounded-b-2xl bg-slate-50 dark:bg-[#0e1826] border-slate-200 dark:border-slate-700/80 shadow-xs"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  TOTAL A COBRAR (BS)
                </span>
                <span className="text-xs font-mono font-black text-sky-900 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 rounded border border-sky-300 dark:border-sky-800">
                  Tasa: Bs. {bcvRate.toFixed(2)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xl sm:text-2xl font-black font-sans text-emerald-700 dark:text-emerald-400 tracking-tight tabular-numbers break-all leading-tight">
                  {formatVES(totalVES)}
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white shrink-0">
                  {formatUSD(totalUSD)}
                </span>
              </div>
            </div>

            {/* Botón Principal COBRAR (F12) */}
            <button
              onClick={onOpenPaymentModal}
              disabled={cart.length === 0}
              className="w-full py-3.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] active:scale-[0.99] text-white font-black text-sm rounded-xl uppercase tracking-wider shadow-md transition-all disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed dark:disabled:bg-slate-800 dark:disabled:text-slate-400 dark:disabled:border dark:disabled:border-slate-700 disabled:opacity-100 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>COBRAR VENTA</span>
              <span className="text-xs text-emerald-200 font-mono font-bold">F12</span>
            </button>
          </div>
        </div>
      )}

      {/* ---- TAB: VENTAS DEL TURNO ---- */}
      {rightPanelTab === 'shift' && (
        <div className="flex-1 bg-white dark:bg-slate-800/70 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xs flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-[var(--brand-primary)] text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wide">Ventas del Turno</span>
              <p className="text-[10px] text-emerald-100">{shiftSales.length} ventas · Esta sesión</p>
            </div>
          </div>
          {/* Lista de ventas de turno */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {shiftSales.map((sale, idx) => (
              <div key={sale.receiptNumber || idx} className="p-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 font-mono">{sale.receiptNumber}</span>
                  <span className="text-[10px] text-slate-400 block">{sale.timestamp?.slice(11, 19)}</span>
                </div>
                <div className="text-right font-mono font-bold">
                  <span className="text-slate-900">${sale.totalUSD.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-500 block">Bs. {sale.totalVES.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
