'use client';

import React, { useState } from 'react';
import { formatUSD, formatVES } from '@/lib/formatters';
import { SaleItem } from '@/lib/db';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  X, 
  Columns2, 
  ArrowRight,
  Zap
} from 'lucide-react';

interface CartItem extends SaleItem {
  stock: number;
  quantity?: number;
}

interface PosBottomCompactDockProps {
  cart: CartItem[];
  totalUSD: number;
  totalVES: number;
  bcvRate: number;
  onOpenPaymentModal: () => void;
  onClearCart: () => void;
  onUpdateQty: (productId: number, qty: number) => void;
  onRemoveItem: (productId: number) => void;
  onToggleSimplifiedView: () => void;
}

export default function PosBottomCompactDock({
  cart,
  totalUSD,
  totalVES,
  bcvRate,
  onOpenPaymentModal,
  onClearCart,
  onUpdateQty,
  onRemoveItem,
  onToggleSimplifiedView,
}: PosBottomCompactDockProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const totalItemsCount = cart.reduce((acc, item) => acc + (item.qty || item.quantity || 1), 0);

  return (
    <>
      {/* DRAWER FLOTANTE PARA REVISAR O EDITAR ÃTEMS DEL TICKET */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col p-4 border-l border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Drawer */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white font-mono">
                  Ticket Actual ({totalItemsCount} Ã­tems)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="p-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-mono flex items-center gap-1 cursor-pointer"
                    title="Vaciar ticket"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vaciar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lista de productos */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs font-mono">
                  <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
                  <span>Ticket vacÃ­o. Toca un producto para agregar.</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>${item.priceUSD.toFixed(2)} c/u</span>
                        <span>â€¢</span>
                        <span>{formatVES(item.priceUSD * bcvRate)}</span>
                      </div>
                    </div>

                    {/* Controles de Cantidad */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if ((item.qty || item.quantity || 1) > 1) {
                            onUpdateQty(item.productId, (item.qty || item.quantity || 1) - 1);
                          } else {
                            onRemoveItem(item.productId);
                          }
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-slate-800 dark:text-white cursor-pointer active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-black text-sm text-slate-900 dark:text-white">
                        {(item.qty || item.quantity || 1)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.productId, (item.qty || item.quantity || 1) + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-slate-800 dark:text-white cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal del Ã­tem */}
                    <div className="text-right shrink-0 min-w-[65px]">
                      <div className="font-black text-slate-900 dark:text-white">
                        ${(item.priceUSD * (item.qty || item.quantity || 1)).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatVES(item.priceUSD * (item.qty || item.quantity || 1) * bcvRate)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Resumen inferior del Drawer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500">TASA BCV:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Bs. {bcvRate.toFixed(2)} / USD
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/90 flex justify-between items-center font-mono">
                <span className="font-black text-xs uppercase text-slate-700 dark:text-slate-300">TOTAL:</span>
                <div className="text-right">
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    ${totalUSD.toFixed(2)} USD
                  </div>
                  <div className="text-xs text-slate-500 font-bold">
                    {formatVES(totalVES)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenPaymentModal();
                }}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-black text-sm uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-98"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Cobrar Ticket (F12)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARRA INFERIOR COMPACTA DOCK: ESTILO MOSTRADOR RÃPIDO                     */}
      {/* ========================================================================= */}
      <div className="w-full shrink-0 bg-slate-950 text-white border-t border-slate-800 shadow-2xl px-4 py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 font-mono z-30 select-none">
        
        {/* LADO IZQUIERDO: SWITCH DE MODO + BOTÃ“N DEL TICKET */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleSimplifiedView}
            className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Volver a la vista tradicional de 2 columnas"
          >
            <Columns2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-bold">Vista ClÃ¡sica</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-white border border-slate-700/80 flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <ShoppingCart className="w-4 h-4 text-cyan-400" />
            <span className="font-black text-sm">{totalItemsCount}</span>
            <span className="text-slate-400 text-xs hidden sm:inline">artÃ­culos</span>
            {cart.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
              title="Vaciar ticket"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* CENTRO: DISPLAY GRANDE DE TOTALES BIMONEDA */}
        <div className="flex items-center gap-4 text-right">
          <div className="hidden lg:block text-[11px] text-slate-400">
            <span>TASA BCV: </span>
            <strong className="text-white">Bs. {bcvRate.toFixed(2)}</strong>
          </div>

          <div>
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TOTAL:</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                ${totalUSD.toFixed(2)}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-300">
              {formatVES(totalVES)}
            </div>
          </div>
        </div>

        {/* LADO DERECHO: BOTÃ“N PRINCIPAL DE COBRO */}
        <div>
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={onOpenPaymentModal}
            className="px-6 sm:px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-black text-sm uppercase tracking-wider flex items-center gap-2.5 shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>COBRAR (F12)</span>
            <ArrowRight className="w-4 h-4 hidden sm:inline" />
          </button>
        </div>

      </div>
    </>
  );
}
