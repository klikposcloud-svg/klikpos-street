'use client';

import React from 'react';
import { Search, X, Plus } from 'lucide-react';
import { Product, CardViewMode, ThemePreset } from '@/types/tablet-pos';

interface CasinoReelsCatalogProps {
  products: Product[];
  categories: string[];
  selectedCategory: string;
  searchQuery: string;
  cardViewMode: CardViewMode;
  stylePreset: ThemePreset;
  isLight: boolean;
  bcvRate: number;
  getCartQty: (id: string) => number;
  onAddToCart: (prod: Product) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onSelectCategory: (cat: string) => void;
  onSearchChange: (q: string) => void;
  onSelectViewMode: (mode: CardViewMode) => void;
  onSelectStylePreset: (preset: ThemePreset) => void;
}

export const CasinoReelsCatalog: React.FC<CasinoReelsCatalogProps> = ({
  products,
  categories,
  selectedCategory,
  searchQuery,
  cardViewMode,
  stylePreset,
  isLight,
  bcvRate,
  getCartQty,
  onAddToCart,
  onUpdateQty,
  onSelectCategory,
  onSearchChange,
  onSelectViewMode,
  onSelectStylePreset
}) => {
  // Filtrado de productos
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const leftProducts = filteredProducts.filter((_, idx) => idx % 2 === 0);
  const rightProducts = filteredProducts.filter((_, idx) => idx % 2 !== 0);

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-2">
      {/* 1. Barra de Búsqueda + Selector de Vista (2 Columnas / Lista) + Selector de Tema (Street Pro / Gourmet) */}
      <div className="space-y-1.5 shrink-0">
        <div className="flex items-center justify-between gap-4 sm:gap-6">
          {/* Buscador acortado y con respiro visual */}
          <div className="relative flex-1 max-w-[220px] sm:max-w-[280px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-9 pr-7 py-1.5 rounded-xl text-xs border transition-colors outline-none font-semibold ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-800'
                  : 'bg-[#0e1726] border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Selector de Solo 2 Modos: Visual (Casino 2 Cols) y Lista */}
          <div className={`flex items-center p-0.5 rounded-xl border shrink-0 ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0e1726] border-slate-800'
          }`}>
            <button
              onClick={() => onSelectViewMode('food')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                cardViewMode === 'food'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Visual 2 Columnas Independientes (Modo Casino)"
            >
              <span>🎰 2 Columnas</span>
            </button>
            <button
              onClick={() => onSelectViewMode('lista')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                cardViewMode === 'lista'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Lista Ergonómica"
            >
              <span>📋 Lista</span>
            </button>
          </div>

          {/* Visualización Exclusiva: Street Pro */}
          <div className="flex items-center shrink-0">
            <span
              className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-amber-500 text-slate-950 shadow-xs flex items-center gap-1 select-none"
              title="Estilo Street Pro Oficial"
            >
              🍔 Street Pro
            </span>
          </div>
        </div>

        {/* Píldoras de Categorías */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all duration-200 border active:scale-95 cursor-pointer ${
                selectedCategory === cat
                  ? isLight
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-black'
                    : 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm shadow-amber-500/10 font-black'
                  : isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-[#0e1726] border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================= */}
      {/* MODO 1: VISUAL CASINO (2 COLUMNAS INDEPENDIENTES SIEMPRE ACTIVAS) */}
      {/* ================================================================= */}
      {cardViewMode === 'food' && (
        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-hidden">
          {/* REEL IZQUIERDO */}
          <div className={`flex flex-col h-full min-h-0 overflow-hidden border rounded-2xl shadow-md ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#090d16] border-slate-800'
          }`}>
            <div className={`px-2 py-1.5 border-b flex items-center justify-between shrink-0 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f172a] border-slate-800 text-amber-400'
            }`}>
              <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                🍔 Comida Principal
              </span>
              <span className="text-[9px] font-mono text-slate-400 font-bold">
                {leftProducts.length} ítems
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-1.5 space-y-2 pb-24 scrollbar-none no-scrollbar">
              {leftProducts.map((prod) => {
                const qtyInCart = getCartQty(prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => onAddToCart(prod)}
                    className={`group border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between active:scale-98 shadow-md ${
                      isLight
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-[#0e1726] border-slate-800 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="relative h-24 sm:h-28 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-1.5 left-1.5 text-[8.5px] font-black bg-slate-950 text-white px-2 py-0.5 rounded-full shadow-xs">
                        {prod.tag}
                      </span>
                      {qtyInCart > 0 && (
                        <span className="absolute top-1.5 right-1.5 text-slate-950 font-black font-mono text-[10.5px] w-5 h-5 rounded-full flex items-center justify-center shadow-md bg-amber-400 anim-badge-spring">
                          {qtyInCart}
                        </span>
                      )}
                    </div>

                    <div className="p-2 flex-1 flex flex-col justify-between space-y-1.5">
                      <div>
                        <h3
                          className="text-[11.5px] font-black line-clamp-1 leading-tight"
                          style={{ color: isLight ? '#0f172a' : '#ffffff' }}
                        >
                          {prod.name}
                        </h3>
                        <p className="text-[9.5px] text-slate-400 line-clamp-1 mt-0.5">
                          {prod.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <div>
                          <span className="text-xs font-black font-mono block text-amber-400">
                            ${prod.priceUSD.toFixed(2)}
                          </span>
                          <span className="text-[8.5px] font-mono text-slate-400 font-bold block">
                            Bs. {(prod.priceUSD * bcvRate).toFixed(0)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {qtyInCart > 0 ? (
                            <div className="flex items-center gap-0.5 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateQty(prod.id, -1);
                                }}
                                className="w-5 h-5 rounded bg-slate-700 text-white flex items-center justify-center text-[10px] font-black active:scale-90 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-[10px] font-black font-mono w-3.5 text-center text-amber-400">
                                {qtyInCart}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart(prod);
                                }}
                                className="w-5 h-5 rounded bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black active:scale-90 shadow-xs cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(prod);
                              }}
                              className="w-6.5 h-6.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center active:scale-90 transition-transform shadow-xs font-black cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REEL DERECHO */}
          <div className={`flex flex-col h-full min-h-0 overflow-hidden border rounded-2xl shadow-md ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#090d16] border-slate-800'
          }`}>
            <div className={`px-2 py-1.5 border-b flex items-center justify-between shrink-0 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f172a] border-slate-800 text-amber-400'
            }`}>
              <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                🥤 Bebidas & Extras
              </span>
              <span className="text-[9px] font-mono text-slate-400 font-bold">
                {rightProducts.length} ítems
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-1.5 space-y-2 pb-24 scrollbar-none no-scrollbar">
              {rightProducts.map((prod) => {
                const qtyInCart = getCartQty(prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => onAddToCart(prod)}
                    className={`group border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between active:scale-98 shadow-md ${
                      isLight
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-[#0e1726] border-slate-800 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="relative h-24 sm:h-28 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-1.5 left-1.5 text-[8.5px] font-black bg-slate-950 text-white px-2 py-0.5 rounded-full shadow-xs">
                        {prod.tag}
                      </span>
                      {qtyInCart > 0 && (
                        <span className="absolute top-1.5 right-1.5 text-slate-950 font-black font-mono text-[10.5px] w-5 h-5 rounded-full flex items-center justify-center shadow-md bg-amber-400 anim-badge-spring">
                          {qtyInCart}
                        </span>
                      )}
                    </div>

                    <div className="p-2 flex-1 flex flex-col justify-between space-y-1.5">
                      <div>
                        <h3
                          className="text-[11.5px] font-black line-clamp-1 leading-tight"
                          style={{ color: isLight ? '#0f172a' : '#ffffff' }}
                        >
                          {prod.name}
                        </h3>
                        <p className="text-[9.5px] text-slate-400 line-clamp-1 mt-0.5">
                          {prod.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <div>
                          <span className="text-xs font-black font-mono block text-amber-400">
                            ${prod.priceUSD.toFixed(2)}
                          </span>
                          <span className="text-[8.5px] font-mono text-slate-400 font-bold block">
                            Bs. {(prod.priceUSD * bcvRate).toFixed(0)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {qtyInCart > 0 ? (
                            <div className="flex items-center gap-0.5 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateQty(prod.id, -1);
                                }}
                                className="w-5 h-5 rounded bg-slate-700 text-white flex items-center justify-center text-[10px] font-black active:scale-90 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-[10px] font-black font-mono w-3.5 text-center text-amber-400">
                                {qtyInCart}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart(prod);
                                }}
                                className="w-5 h-5 rounded bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black active:scale-90 shadow-xs cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(prod);
                              }}
                              className="w-6.5 h-6.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center active:scale-90 transition-transform shadow-xs font-black cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODO 2: LISTA ERGONÓMICA CON FILAS DIRECTAS                       */}
      {/* ================================================================= */}
      {cardViewMode === 'lista' && (
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-215px)] pb-28 p-1 scrollbar-none no-scrollbar">
          {filteredProducts.map((prod) => {
            const qtyInCart = getCartQty(prod.id);
            return (
              <div
                key={prod.id}
                onClick={() => onAddToCart(prod)}
                className={`p-2.5 border rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-99 shadow-xs ${
                  isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-[#0e1726] border-slate-800 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4
                        className="text-xs font-black line-clamp-1"
                        style={{ color: isLight ? '#0f172a' : '#ffffff' }}
                      >
                        {prod.name}
                      </h4>
                      <span className="text-[8px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-bold shrink-0">
                        {prod.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono font-black text-amber-500">
                        ${prod.priceUSD.toFixed(2)}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 font-bold">
                        Bs. {(prod.priceUSD * bcvRate).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {qtyInCart > 0 ? (
                    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateQty(prod.id, -1);
                        }}
                        className="w-6 h-6 rounded-lg bg-slate-700 text-white flex items-center justify-center text-xs font-black active:scale-90 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-black font-mono w-4 text-center text-amber-400">
                        {qtyInCart}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(prod);
                        }}
                        className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black active:scale-90 shadow-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(prod);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-xs cursor-pointer"
                    >
                      Agregar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
