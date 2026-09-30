'use client';

import React from 'react';
import { LocalProduct } from '@/lib/db';
import { formatVES } from '@/lib/formatters';
import {
  getCategoryBadgeColor,
  getProductIconAlternated,
} from '@/lib/utils/pos-helpers';
import { isPosViewAllowed } from '@/lib/licensing/feature-flags';
import {
  LayoutGrid,
  List,
  Coffee,
  Palette,
  UtensilsCrossed,
  Sparkles,
  Package,
} from 'lucide-react';

export type PosViewMode = 'grid' | 'list' | 'touch' | 'fastfood' | 'capsule';

interface PosProductGridProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  filteredProducts: LocalProduct[];
  posViewMode: PosViewMode;
  onSetPosViewMode: (mode: PosViewMode) => void;
  minimalistColorPalette: 'category' | 'mono';
  onToggleMinimalistPalette: () => void;
  bcvRate: number;
  showImages: boolean;
  onAddToCart: (p: LocalProduct, qty?: number) => void;
  onOpenIconSelector: (p: LocalProduct) => void;
}

export default function PosProductGrid({
  categories,
  selectedCategory,
  onSelectCategory,
  filteredProducts,
  posViewMode,
  onSetPosViewMode,
  minimalistColorPalette,
  onToggleMinimalistPalette,
  bcvRate,
  showImages,
  onAddToCart,
  onOpenIconSelector,
}: PosProductGridProps) {
  return (
    <>
      {/* ========================================================================= */}
      {/* BARRA SUPERIOR: CATEGORÍAS EN TEXTO / PILLS (LÍNEA DEDICADA COMPLETA)    */}
      {/* ========================================================================= */}
      <div className="w-full shrink-0 border-b border-slate-200/80 dark:border-slate-800/80 pt-1 pb-1.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs sm:text-[12.5px] font-bold whitespace-nowrap transition-all duration-150 select-none active:scale-[0.97] cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--brand-primary)] text-white shadow-xs font-black ring-1 ring-[var(--brand-primary)]'
                    : 'bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA INFERIOR: OPCIONES DE VISUALIZACIÓN                                 */}
      {/* ========================================================================= */}
      <div className="w-full flex items-center justify-between shrink-0 py-1 border-b border-slate-200/60 dark:border-slate-800/60 mb-1">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
          {filteredProducts.length} producto{filteredProducts.length === 1 ? '' : 's'}
        </span>

        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 select-none shadow-2xs">
          <button
            type="button"
            onClick={() => onSetPosViewMode('grid')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
              posViewMode === 'grid'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Vista de Cuadrícula Visual con Imágenes"
          >
            <LayoutGrid className="w-3 h-3" />
            <span>Cuadrícula</span>
          </button>

          {isPosViewAllowed('list') && (
            <button
              type="button"
              onClick={() => onSetPosViewMode('list')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                posViewMode === 'list'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista en Lista Compacta de Alta Densidad"
            >
              <List className="w-3 h-3" />
              <span>Lista</span>
            </button>
          )}

          {isPosViewAllowed('touch') && (
            <button
              type="button"
              onClick={() => onSetPosViewMode('touch')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                posViewMode === 'touch'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Tema Kiosco Minimalista (Iconos Fill/Outline alternados)"
            >
              <Coffee className="w-3 h-3" />
              <span>Minimalista</span>
            </button>
          )}

          {isPosViewAllowed('touch') && posViewMode === 'touch' && (
            <button
              type="button"
              onClick={onToggleMinimalistPalette}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 shadow-2xs"
              title="Alternar entre Colores por Categoría y Escala Monocromática Minimalista"
            >
              <Palette className="w-3 h-3 text-sky-600 dark:text-sky-400" />
              <span>
                {minimalistColorPalette === 'category' ? '🎨 Rubro' : '🔘 Mono'}
              </span>
            </button>
          )}

          {isPosViewAllowed('capsule') && (
            <button
              type="button"
              onClick={() => onSetPosViewMode('fastfood')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                posViewMode === 'fastfood'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Modo Comida Rápida / Fast Food (Cuadrícula Táctil 3x3)"
            >
              <UtensilsCrossed className="w-3 h-3" />
              <span>Comida Rápida</span>
            </button>
          )}

          {isPosViewAllowed('capsule') && (
            <button
              type="button"
              onClick={() => onSetPosViewMode('capsule')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                posViewMode === 'capsule'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista Gourmet en Cápsulas Horizontales (Estilo Bodegón & Glassmorphism)"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Gourmet</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATÁLOGO DE PRODUCTOS: 5 MODOS DE VISTA                                    */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* MODO 1: CUADRÍCULA VISUAL (GRID) */}
        {posViewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3 content-start">
            {filteredProducts.map((p) => {
              const isLowStock = p.stock <= p.minStock;
              const isFixed = p.isFixedPriceVES && p.fixedPriceVES;
              const displayVES = isFixed ? p.fixedPriceVES! : (p.priceUSD * bcvRate);
              const displayUSD = isFixed ? (p.fixedPriceVES! / bcvRate) : p.priceUSD;
              return (
                <div
                  key={p.id}
                  onClick={() => onAddToCart(p, 1)}
                  className="pos-white-card bg-white rounded-2xl border-2 border-slate-300 dark:border-slate-700/80 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-md hover:border-slate-400 dark:hover:border-slate-500 transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between group select-none p-3"
                >
                  <div className="flex items-center justify-between gap-1.5 w-full mb-1.5">
                    <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 truncate">
                      {p.barcode ? (p.barcode.length > 4 ? p.barcode.slice(-4) : p.barcode) : '759...'}
                    </span>
                    <div className="flex items-center gap-1">
                      {isFixed && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white shrink-0 shadow-2xs">
                          🔒 Fijo Bs.
                        </span>
                      )}
                      <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-md text-white uppercase tracking-wider shrink-0 truncate max-w-[120px] ${getCategoryBadgeColor(p.category)}`}>
                        {p.category}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-black text-[13px] text-slate-900 leading-snug my-1 line-clamp-2 min-h-[36px] flex items-center" title={p.name}>
                    {p.name}
                  </h4>

                  <div className="w-full h-24 sm:h-28 rounded-xl bg-slate-50 overflow-hidden relative border border-slate-200/80 mb-2">
                    {p.image && showImages ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <Package className="w-8 h-8 stroke-1" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-end justify-between gap-1.5 pt-1 mt-auto border-t border-slate-100">
                    <div className="leading-tight flex flex-col">
                      <span className="text-[14.5px] sm:text-[15.5px] font-black font-sans text-slate-950 tabular-numbers leading-tight">
                        {formatVES(displayVES)}
                      </span>
                      <span className="text-[11px] text-slate-600 font-bold mt-0.5">
                        ${displayUSD.toFixed(2)}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-800 shrink-0 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'} shrink-0`} />
                      <span>{p.stock}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODO 2: LISTA COMPACTA DE ALTA DENSIDAD (LIST) */}
        {posViewMode === 'list' && (
          <div className="flex flex-col gap-1.5 content-start">
            {filteredProducts.map((p) => {
              const isLowStock = p.stock <= p.minStock;
              const isFixed = p.isFixedPriceVES && p.fixedPriceVES;
              const displayVES = isFixed ? p.fixedPriceVES! : (p.priceUSD * bcvRate);
              const displayUSD = isFixed ? (p.fixedPriceVES! / bcvRate) : p.priceUSD;
              return (
                <div
                  key={p.id}
                  onClick={() => onAddToCart(p, 1)}
                  className="pos-white-card bg-white hover:bg-sky-50/50 border-2 border-slate-200/90 dark:border-sky-500/20 rounded-xl px-3 py-2 flex items-center justify-between gap-3 shadow-xs hover:shadow-sm transition-all cursor-pointer group select-none active:scale-[0.99]"
                >
                  {/* Miniatura / Ícono + Nombre + SKU */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {p.image && showImages ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400 stroke-1" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-[13px] text-slate-900 truncate" title={p.name}>
                          {p.name}
                        </span>
                        {isFixed && (
                          <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white shrink-0 shadow-2xs">
                            🔒 Fijo Bs.
                          </span>
                        )}
                        <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded text-white uppercase tracking-wider shrink-0 ${getCategoryBadgeColor(p.category)}`}>
                          {p.category}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 mt-0.5 block">
                        SKU: {p.barcode || '759...'} {(p.unit === 'kg' || (p as any).isWeighable) && '• ⚖️ Pesable'}
                      </span>
                    </div>
                  </div>

                  {/* Stock */}
                  <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 shrink-0 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'} shrink-0`} />
                    <span>{p.stock} {p.unit === 'kg' || (p as any).isWeighable ? 'kg' : 'uds'}</span>
                  </span>

                  {/* Precios duales */}
                  <div className="text-right leading-tight min-w-[110px] shrink-0">
                    <span className="font-black text-sm text-slate-950 tabular-numbers block">
                      {formatVES(displayVES)}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold block">
                      ${displayUSD.toFixed(2)}
                    </span>
                  </div>

                  {/* Botón rápido de agregar */}
                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-black text-base flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-all"
                  >
                    +
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* MODO 3: TÁCTIL MINIMALISTA / KIOSCO */}
        {posViewMode === 'touch' && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 xl:gap-5 content-start h-full py-2 pb-24">
            {filteredProducts.map((p) => {
              const isLowStock = p.stock <= p.minStock;
              const isFixed = p.isFixedPriceVES && p.fixedPriceVES;
              const displayVES = isFixed ? p.fixedPriceVES! : (p.priceUSD * bcvRate);
              const displayUSD = isFixed ? (p.fixedPriceVES! / bcvRate) : p.priceUSD;

              return (
                <div
                  key={p.id}
                  onClick={() => onAddToCart(p, 1)}
                  className="pos-minimal-card min-h-[195px] sm:min-h-[205px] bg-white dark:bg-slate-850 border-2 border-slate-200/90 dark:border-slate-700/80 rounded-[24px] p-3.5 sm:p-4 flex flex-col justify-between items-center text-center transition-all duration-150 active:scale-[0.96] hover:scale-[1.01] cursor-pointer group select-none relative overflow-hidden hover:border-sky-500/70 dark:hover:border-sky-400 hover:shadow-lg shadow-2xs"
                >
                  {/* Tag superior discreto */}
                  <div className="flex items-center justify-between w-full px-1 mb-1">
                    <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                      {p.category}
                    </span>
                    {isFixed ? (
                      <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-md bg-amber-500 text-white shrink-0 shadow-2xs">
                        🔒 Bs. Fijo
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span>{p.stock}</span>
                      </span>
                    )}
                  </div>

                  {/* Botón Flotante para Personalizar Ícono */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenIconSelector(p);
                    }}
                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 hover:text-sky-600 hover:scale-110 shadow-2xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20"
                    title="Personalizar Ícono de este Producto"
                  >
                    <Palette className="w-3.5 h-3.5" />
                  </button>

                  {/* Ícono Centrado */}
                  <div className="my-auto py-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    {getProductIconAlternated(p, true)}
                  </div>

                  {/* Nombre y Precios */}
                  <div className="w-full flex flex-col items-center mt-auto pt-1">
                    <span className="font-black text-xs sm:text-[13px] tracking-wide uppercase text-[#1e293b] dark:text-white leading-snug line-clamp-2 min-h-[34px] flex items-center justify-center text-center group-hover:text-black dark:group-hover:text-white transition-colors">
                      {p.name}
                    </span>

                    <div className="flex items-baseline justify-center gap-2 mt-1.5 w-full pt-1.5 border-t border-slate-200/80 dark:border-slate-700/80">
                      <span className="font-black text-sm sm:text-base font-sans text-slate-950 dark:text-white tabular-numbers">
                        {formatVES(displayVES)}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        ${displayUSD.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODO 4: COMIDA RÁPIDA / FAST FOOD */}
        {posViewMode === 'fastfood' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4 xl:gap-5 content-start pt-2">
            {filteredProducts.map((p) => {
              const isLowStock = p.stock <= p.minStock;
              const isFixed = p.isFixedPriceVES && p.fixedPriceVES;
              const displayVES = isFixed ? p.fixedPriceVES! : (p.priceUSD * bcvRate);
              const displayUSD = isFixed ? (p.fixedPriceVES! / bcvRate) : p.priceUSD;
              return (
                <div
                  key={p.id}
                  onClick={() => onAddToCart(p, 1)}
                  className="relative bg-white dark:bg-slate-900 border-2 border-[#008080] dark:border-teal-500 rounded-[24px] p-3.5 sm:p-4 shadow-sm hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer flex flex-col justify-between items-center text-center group select-none"
                >
                  <div className="absolute -top-2.5 -left-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#008080] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md z-10">
                    {p.stock}
                  </div>

                  {isFixed && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500 text-white shadow-xs">
                        🔒 Fijo Bs.
                      </span>
                    </div>
                  )}

                  <div className="w-full h-28 sm:h-32 flex items-center justify-center my-1 overflow-hidden">
                    {p.image && showImages ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                        <Package className="w-12 h-12 stroke-1" />
                      </div>
                    )}
                  </div>

                  <h4
                    className="font-bold text-[14px] sm:text-[15px] text-slate-900 dark:text-white leading-tight line-clamp-2 min-h-[36px] flex items-center justify-center text-center px-1"
                    title={p.name}
                  >
                    {p.name}
                  </h4>

                  <div className="font-black text-[18px] sm:text-[20px] font-sans text-slate-950 dark:text-white tabular-numbers leading-tight text-center mt-1">
                    {formatVES(displayVES)}
                  </div>

                  <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[12px] sm:text-[13px] font-bold text-slate-700 dark:text-slate-300">
                      ${displayUSD.toFixed(2)} USD
                    </span>
                    <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#cffafe] dark:bg-teal-950/70 text-[#0f766e] dark:text-teal-300 border border-[#99f6e4] dark:border-teal-800/60 truncate max-w-[130px]">
                      {p.category}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="w-full mt-3 py-2 sm:py-2.5 px-3 rounded-xl sm:rounded-2xl bg-[#008080] hover:bg-[#006666] active:bg-[#004d4d] text-white font-bold text-xs sm:text-[13px] flex items-center justify-center gap-1.5 shadow-xs hover:shadow-sm transition-all"
                  >
                    Add to Cart
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* MODO 5: CÁPSULAS HORIZONTALES GOURMET */}
        {posViewMode === 'capsule' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-4 xl:gap-5 content-start pt-1">
            {filteredProducts.map((p) => {
              const isLowStock = p.stock <= p.minStock;
              const isFixed = p.isFixedPriceVES && p.fixedPriceVES;
              const displayVES = isFixed ? p.fixedPriceVES! : (p.priceUSD * bcvRate);
              const displayUSD = isFixed ? (p.fixedPriceVES! / bcvRate) : p.priceUSD;

              return (
                <div
                  key={p.id}
                  onClick={() => onAddToCart(p, 1)}
                  className="relative bg-[#f8f6f0] dark:bg-slate-800/90 border border-[#eae5d8] dark:border-slate-700/60 rounded-[24px] p-2.5 sm:p-3 shadow-xs hover:shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-stretch gap-3 group select-none"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenIconSelector(p);
                    }}
                    className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-500 hover:text-sky-600 hover:scale-110 shadow-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20"
                    title="Personalizar Ícono Iconify de este Producto"
                  >
                    <Palette className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-28 sm:w-32 shrink-0 bg-white dark:bg-slate-900 rounded-2xl p-1 flex items-center justify-center shadow-xs relative overflow-hidden border border-slate-200/60 dark:border-white/5 min-h-[128px]">
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 z-10">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs text-white border border-white/20 shadow-xs">
                        {p.stock} {p.unit === 'kg' ? 'kg' : 'uds'}
                      </span>
                      {isFixed && (
                        <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-md bg-amber-500 text-white shadow-xs">
                          🔒 Fijo
                        </span>
                      )}
                    </div>

                    {p.image && showImages ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getProductIconAlternated(p, true)}
                      </div>
                    )}

                    <div className="absolute bottom-1 right-2 flex items-center gap-0.5 text-[8px] text-slate-400 dark:text-slate-500 font-mono select-none">
                      <span>•••</span>
                      <span className="text-[7px]">▶</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 bg-white dark:bg-slate-900/90 border border-white/90 dark:border-slate-700/60 rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-col justify-between min-h-[128px] text-slate-900 dark:text-slate-100">
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[140px]">
                        {p.category}
                      </span>
                    </div>

                    <h4
                      className="font-bold text-[13px] sm:text-[13.5px] text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 my-auto"
                      title={p.name}
                    >
                      {p.name}
                    </h4>

                    <div className="flex flex-col pt-1.5 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                      <span className="text-[16px] sm:text-[17px] font-black text-slate-950 dark:text-white tracking-tight tabular-numbers leading-tight whitespace-nowrap truncate">
                        {formatVES(displayVES)}
                      </span>

                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[11px] sm:text-[11.5px] font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          $ {displayUSD.toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">
            No se encontraron productos coincidentes.
          </div>
        )}
      </div>
    </>
  );
}
