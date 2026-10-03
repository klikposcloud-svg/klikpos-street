'use client';

import React from 'react';
import { Menu, LayoutGrid, RefreshCw, ShoppingCart } from 'lucide-react';
import { TrialState } from '@/lib/licensing/trial-manager';

interface TabletPosHeaderProps {
  isLight: boolean;
  bcvRate: number;
  isBcvEditing: boolean;
  customBcvInput: string;
  isFetchingBcv: boolean;
  trialState: TrialState | null;
  totalUSD: number;
  totalItems: number;
  primaryColor: string;
  onOpenMenu: () => void;
  onOpenTools: () => void;
  onOpenCart: () => void;
  onOpenLicense: () => void;
  onStartBcvEdit: () => void;
  onCancelBcvEdit: () => void;
  onSaveManualBcv: () => void;
  onChangeCustomBcv: (val: string) => void;
  onFetchBcvAuto: () => void;
}

export const TabletPosHeader: React.FC<TabletPosHeaderProps> = ({
  isLight,
  bcvRate,
  isBcvEditing,
  customBcvInput,
  isFetchingBcv,
  trialState,
  totalUSD,
  totalItems,
  primaryColor,
  onOpenMenu,
  onOpenTools,
  onOpenCart,
  onOpenLicense,
  onStartBcvEdit,
  onCancelBcvEdit,
  onSaveManualBcv,
  onChangeCustomBcv,
  onFetchBcvAuto
}) => {
  return (
    <header
      className={`h-14 px-3 flex items-center justify-between border-b shrink-0 z-20 shadow-xs transition-colors duration-300 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0b0f19] border-slate-800/90'
      }`}
    >
      {/* LADO IZQUIERDO: Logo KlikPOS Street + Acciones Principales */}
      <div className="flex items-center gap-2">
        {/* Logo KlikPOS Street Vector & Clean Branding */}
        <div 
          onClick={onOpenMenu}
          className="flex flex-col leading-none select-none cursor-pointer group pr-0.5 shrink-0"
          title="KlikPOS Street"
        >
          <div className="flex items-baseline tracking-tight font-black text-lg">
            <span style={{ color: isLight ? '#0f172a' : '#ffffff' }}>Klik</span>
            <span className="text-amber-500 group-hover:text-amber-400 transition-colors">POS</span>
          </div>
          <span className="text-[9px] font-extrabold text-amber-500/95 tracking-widest text-right -mt-0.5">
            Street
          </span>
        </div>

        <div className="h-5 w-px bg-slate-300 dark:bg-slate-800 hidden xs:block" />

        {/* Botones de Menú y Herramientas Rápidas */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenMenu}
            className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200 hover:text-white'
            }`}
            title="Menú & Ajustes"
          >
            <Menu className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenTools}
            className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-amber-600'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400 hover:text-amber-300'
            }`}
            title="Herramientas & Módulos Rápidos"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CENTRO: Badge Tasa BCV Oficial (Una Sola Línea) */}
      <div className="flex items-center justify-center mx-1 shrink-0">
        {isBcvEditing ? (
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-xl shadow-xs">
            <span className="text-[11px] font-mono font-bold text-slate-400">Bs.</span>
            <input
              type="number"
              step="0.01"
              value={customBcvInput}
              onChange={(e) => onChangeCustomBcv(e.target.value)}
              className="w-16 text-xs font-mono font-black text-slate-900 dark:text-white bg-transparent outline-none"
            />
            <button
              onClick={onSaveManualBcv}
              className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-black cursor-pointer"
            >
              ✓
            </button>
            <button
              onClick={onCancelBcvEdit}
              className="px-1 py-0.5 text-slate-400 text-[10px] cursor-pointer"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={onStartBcvEdit}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-mono font-bold shadow-xs whitespace-nowrap cursor-pointer select-none ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
                : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 text-slate-100'
            }`}
            title="Toca para editar tasa BCV manualmente"
          >
            <span className="text-[10px] font-black text-sky-500 tracking-wider">BCV:</span>
            <span className="font-black text-xs" style={{ color: isLight ? '#0f172a' : '#38bdf8' }}>
              Bs. {bcvRate.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFetchBcvAuto();
              }}
              disabled={isFetchingBcv}
              className="p-0.5 hover:text-sky-400 text-slate-400 transition-colors cursor-pointer"
              title="Actualizar tasa desde DolarAPI"
            >
              <RefreshCw className={`w-3 h-3 ${isFetchingBcv ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* LADO DERECHO: Carrito / Comanda Activa */}
      <div className="flex items-center gap-1.5 shrink-0">
        {trialState?.isTrial && (
          <button
            onClick={onOpenLicense}
            className="hidden md:flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-mono font-bold cursor-pointer"
          >
            <span>⏱️ {trialState.remainingMinutes}m</span>
          </button>
        )}

        <button
          onClick={onOpenCart}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-950 font-black text-xs transition-all duration-200 relative active:scale-95 shadow-md cursor-pointer"
          style={{ backgroundColor: primaryColor }}
          title="Ver Comanda Activa"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-slate-950" />
          <span className="font-mono text-xs font-black">${totalUSD.toFixed(2)}</span>
          {totalItems > 0 && (
            <span className="bg-slate-950 text-amber-400 text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full shadow-xs anim-badge-spring">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
