'use client';

import React, { useRef } from 'react';
import { LocalProduct } from '@/lib/db';
import { formatVES } from '@/lib/formatters';
import { getCategoryEmoji } from '@/lib/utils/pos-helpers';
import {
  Sparkles,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Package,
} from 'lucide-react';

interface PosQuickAccessSliderProps {
  sliderProducts: LocalProduct[];
  isSliderCollapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenQuickAccessModal: () => void;
  onAddToCart: (product: LocalProduct, quantity: number) => void;
  bcvRate: number;
  showImages: boolean;
}

export default function PosQuickAccessSlider({
  sliderProducts,
  isSliderCollapsed,
  onToggleCollapsed,
  onOpenQuickAccessModal,
  onAddToCart,
  bcvRate,
  showImages,
}: PosQuickAccessSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!sliderProducts || sliderProducts.length === 0) return null;

  return (
    <div className="shrink-0 flex flex-col gap-1 bg-gradient-to-r from-slate-100/90 via-slate-50/80 to-slate-100/90 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/80 p-1.5 rounded-xl border border-sky-600/20 dark:border-sky-500/20 shadow-2xs transition-all">
      {/* Header Compacto de la Bandeja */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center justify-center w-5 h-5 rounded-md bg-sky-600/15 text-sky-700 dark:text-sky-300">
            <Sparkles className="w-3 h-3" />
          </span>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <span>⚡ Accesos Rápidos</span>
          </span>
          <span className="text-[9.5px] font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.2 rounded-full border border-sky-200 dark:border-sky-800">
            {sliderProducts.length}
          </span>
          <button
            type="button"
            onClick={onOpenQuickAccessModal}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all active:scale-95 cursor-pointer ml-1"
            title="Configurar los productos favoritos y accesos directos del carrusel"
          >
            <SlidersHorizontal className="w-2.5 h-2.5 text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline">Ajustar</span>
          </button>
        </div>

        {/* Botones de Desplazamiento y Colapso */}
        <div className="flex items-center gap-1">
          {!isSliderCollapsed && (
            <>
              <button
                type="button"
                onClick={() => scrollSlider('left')}
                className="w-5.5 h-5.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center cursor-pointer transition-all active:scale-90"
                title="Desplazar hacia la izquierda"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollSlider('right')}
                className="w-5.5 h-5.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center cursor-pointer transition-all active:scale-90"
                title="Desplazar hacia la derecha"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
            title={isSliderCollapsed ? 'Expandir accesos rápidos' : 'Minimizar para ganar espacio en catálogo'}
          >
            {isSliderCollapsed ? (
              <>
                <ChevronDown className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span>Mostrar</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3 h-3 text-slate-500" />
                <span>Minimizar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Carrusel Desplazable Compacto */}
      {!isSliderCollapsed && (
        <div
          ref={sliderRef}
          className="flex gap-2 overflow-x-auto snap-x scroll-smooth no-scrollbar py-0.5 px-0.5 animate-in fade-in duration-150"
        >
          {sliderProducts.map((p) => {
            const isLowStock = p.stock <= p.minStock;
            return (
              <div
                key={`slider-${p.id}`}
                onClick={() => onAddToCart(p, 1)}
                className="w-[195px] sm:w-[215px] h-[62px] sm:h-[66px] bg-white dark:bg-slate-800 rounded-lg border-l-[3px] border-l-sky-600 border-y border-r border-slate-200 dark:border-slate-700 p-1.5 shadow-2xs hover:shadow-sm hover:border-sky-500 transition-all active:scale-[0.98] cursor-pointer flex gap-1.5 items-center shrink-0 snap-start group select-none"
              >
                {/* Foto Fit (no recortada) */}
                <div className="w-12 h-12 rounded-md bg-white dark:bg-slate-900 overflow-hidden relative border border-slate-200/80 dark:border-slate-700 shrink-0 p-0.5 flex items-center justify-center">
                  {p.image && showImages ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                      <Package className="w-4 h-4 stroke-1" />
                    </div>
                  )}
                </div>

                {/* Info Compacta */}
                <div className="flex flex-col justify-between flex-1 min-w-0 h-full py-0.5">
                  <div className="flex items-center justify-between gap-1 w-full leading-none">
                    <span className="text-[8.5px] font-bold px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-0.5 shrink-0 truncate max-w-[85px]">
                      <span>{getCategoryEmoji(p.category)}</span>
                      <span className="uppercase tracking-wide truncate">{p.category}</span>
                    </span>
                    <span className="text-[8.5px] font-bold px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-0.5 shrink-0">
                      <span className={`w-1 h-1 rounded-full ${isLowStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'} shrink-0`} />
                      <span>{p.stock}</span>
                    </span>
                  </div>

                  <h3
                    className="font-bold text-[11px] text-slate-900 dark:text-white leading-tight line-clamp-1"
                    title={p.name}
                  >
                    {p.name}
                  </h3>

                  <div className="flex items-baseline justify-between gap-1 leading-none">
                    <span className="text-[12px] font-black font-sans text-slate-950 dark:text-white tabular-numbers leading-none">
                      {formatVES(p.priceUSD * bcvRate)}
                    </span>
                    <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-semibold leading-none">
                      ${p.priceUSD.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
