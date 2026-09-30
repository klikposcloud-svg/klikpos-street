'use client';

import React from 'react';
import { kickCashDrawer } from '@/lib/hardware/cash-drawer';
import { soundEffects } from '@/lib/utils/sound';

interface PosFunctionKeysBarProps {
  primaryCurrency: 'VES' | 'USD';
  numpadMode: 'qty' | 'barcode' | 'cash';
  cartLength: number;
  onToggleCurrency: () => void;
  onFocusSearch: () => void;
  onOpenCreditModal: () => void;
  onOpenManualWeightModal: () => void;
  onToggleNumpadMode: () => void;
  onClearCart: () => void;
  onOpenScannerModal: () => void;
  onOpenCashShiftModal: () => void;
  onOpenPaymentModal: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function PosFunctionKeysBar({
  primaryCurrency,
  numpadMode,
  cartLength,
  onToggleCurrency,
  onFocusSearch,
  onOpenCreditModal,
  onOpenManualWeightModal,
  onToggleNumpadMode,
  onClearCart,
  onOpenScannerModal,
  onOpenCashShiftModal,
  onOpenPaymentModal,
  onShowToast,
}: PosFunctionKeysBarProps) {
  return (
    <div className="shrink-0 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-xl p-1.5 shadow-2xs flex items-center justify-between gap-1 overflow-x-auto no-scrollbar select-none">
      {/* F2: Moneda */}
      <button
        type="button"
        onClick={onToggleCurrency}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        title="Alternar moneda principal entre Bolívares y Dólares"
      >
        <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F2</span>
        <span className="text-[11px] font-extrabold">Moneda ({primaryCurrency})</span>
      </button>

      {/* F3: Buscar */}
      <button
        type="button"
        onClick={onFocusSearch}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        title="Enfocar buscador para escribir o escanear"
      >
        <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F3</span>
        <span className="text-[11px] font-extrabold">Buscar</span>
      </button>

      {/* F4: Crédito */}
      <button
        type="button"
        onClick={onOpenCreditModal}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        title="Venta a Crédito / Fiado de clientes"
      >
        <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F4</span>
        <span className="text-[11px] font-extrabold">Crédito</span>
      </button>

      {/* F5: Balanza */}
      <button
        type="button"
        onClick={onOpenManualWeightModal}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        title="Ingreso de peso manual para balanza"
      >
        <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F5</span>
        <span className="text-[11px] font-extrabold">Balanza</span>
      </button>

      {/* F6: Pad */}
      <button
        type="button"
        onClick={onToggleNumpadMode}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        title="Alternar modo del teclado numérico entre Cantidad y Código"
      >
        <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F6</span>
        <span className="text-[11px] font-extrabold">Pad ({numpadMode === 'qty' ? 'Cant' : 'Cód'})</span>
      </button>

      {/* F7: Limpiar */}
      <button
        type="button"
        onClick={onClearCart}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-800 hover:text-rose-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        title="Limpiar carrito de venta actual"
      >
        <span className="fkey-badge-danger px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F7</span>
        <span className="text-[11px] font-extrabold">Limpiar</span>
      </button>

      {/* F8: Móvil */}
      <button
        type="button"
        onClick={onOpenScannerModal}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        title="Vincular celular como escáner inalámbrico"
      >
        <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F8</span>
        <span className="text-[11px] font-extrabold">Móvil</span>
      </button>

      {/* F9: Turno */}
      <button
        type="button"
        onClick={onOpenCashShiftModal}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        title="Gestión de turno de caja y arqueo"
      >
        <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F9</span>
        <span className="text-[11px] font-extrabold">Turno</span>
      </button>

      {/* F10: Gaveta */}
      <button
        type="button"
        onClick={async () => {
          const res = await kickCashDrawer();
          onShowToast(res.message, 'success');
        }}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        title="Abrir gaveta de dinero físico"
      >
        <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F10</span>
        <span className="text-[11px] font-extrabold">Gaveta</span>
      </button>

      {/* F11: Pantalla Completa */}
      <button
        type="button"
        onClick={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            onShowToast('Pantalla Completa Activada (F11)', 'info');
          } else {
            document.exitFullscreen().catch(() => {});
            onShowToast('Pantalla Completa Desactivada (F11)', 'info');
          }
        }}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        title="Alternar pantalla completa"
      >
        <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F11</span>
        <span className="text-[11px] font-extrabold">Pantalla</span>
      </button>

      {/* F12: Cobrar */}
      <button
        type="button"
        onClick={onOpenPaymentModal}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white border border-[var(--brand-primary)] text-xs font-black transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
        title="Cobrar venta actual"
      >
        <span className="fkey-badge-success px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F12</span>
        <span className="text-[11px] uppercase tracking-wide font-black !text-white text-white">Cobrar</span>
      </button>
    </div>
  );
}
