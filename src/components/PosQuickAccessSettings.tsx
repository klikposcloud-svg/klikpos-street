'use client';

import React, { useState, useEffect } from 'react';
import { db, LocalProduct } from '@/lib/db';
import { formatUSD, formatVES } from '@/lib/formatters';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Check,
  Plus,
  Trash2,
  Package,
  Layers,
  Save,
  RotateCcw,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { soundEffects } from '@/lib/utils/sound';

export default function PosQuickAccessSettings() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [categories, setCategories] = useState<string[]>([]);
  const [bcvRate, setBcvRate] = useState<number>(852.42);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewScroll, setPreviewScroll] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const prods = await db.products.toArray();
        setProducts(prods);

        const cats = Array.from(new Set(prods.map((p) => p.category).filter(Boolean)));
        setCategories(['Todos', ...cats]);

        const rateSetting = await db.settings.get('bcv_rate');
        if (rateSetting && rateSetting.value) setBcvRate(rateSetting.value);

        // Cargar selección guardada
        const savedSetting = await db.settings.get('pos_slider_quick_products');
        if (savedSetting && Array.isArray(savedSetting.value) && savedSetting.value.length > 0) {
          setSelectedIds(savedSetting.value);
        } else {
          try {
            const local = localStorage.getItem('venematic_pos_slider_quick_products');
            if (local) {
              const parsed = JSON.parse(local);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSelectedIds(parsed);
                return;
              }
            }
          } catch {}
          // Fallback por defecto: primeros 10 productos
          setSelectedIds(prods.slice(0, 10).map((p) => p.id!).filter(Boolean));
        }
      } catch (err) {
        console.error('Error cargando configuración de accesos rápidos:', err);
      }
    };
    load();
  }, []);

  const toggleProduct = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectTopSelling = () => {
    // Seleccionar los primeros 12 con mayor stock o primeros 12
    const sorted = [...products].sort((a, b) => b.stock - a.stock);
    const top = sorted.slice(0, 12).map((p) => p.id!).filter(Boolean);
    setSelectedIds(top);
    soundEffects.playBeep();
  };

  const selectAllFiltered = () => {
    const ids = filteredProducts.map((p) => p.id!).filter(Boolean);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    soundEffects.playBeep();
  };

  const clearSelection = () => {
    setSelectedIds([]);
    soundEffects.playBeep();
  };

  const handleSave = async () => {
    try {
      await db.settings.put({
        key: 'pos_slider_quick_products',
        value: selectedIds,
      });
      localStorage.setItem('venematic_pos_slider_quick_products', JSON.stringify(selectedIds));
      window.dispatchEvent(new CustomEvent('pos:quick_slider_updated', { detail: selectedIds }));
      setSavedSuccess(true);
      soundEffects.playSuccess();
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error('Error guardando accesos rápidos:', err);
    }
  };

  // Filtrado de productos para la lista
  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === 'Todos' || p.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchesQ = !q || p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  // Productos actualmente seleccionados para el carrusel
  const selectedProducts = selectedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is LocalProduct => Boolean(p));

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Banner Principal de Configuración */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-white/20 backdrop-blur-xs">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Accesos Rápidos del Carrusel POS (Slider Superior)
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
              Selecciona los artículos que el cajero podrá vender con un solo clic en la barra deslizante superior del Punto de Venta. Ideal para productos de alta rotación (pan, refrescos, harina, pollo, café).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="px-3.5 py-1.5 rounded-full bg-white/20 border border-white/30 text-xs font-mono font-bold text-white shadow-xs">
              {selectedIds.length} en carrusel
            </span>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-950/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>✓ ¡Accesos rápidos guardados con éxito! El cajero verá estos productos en el carrusel del POS inmediatamente.</span>
        </div>
      )}

      {/* Vista Previa en Vivo del Carrusel */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Vista Previa en Vivo del Carrusel ({selectedProducts.length} productos)
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              Así lo verá el cajero
            </span>
          </div>
          {selectedProducts.length === 0 && (
            <span className="text-xs text-rose-500 font-bold">
              ⚠️ No hay productos seleccionados. Se mostrarán los primeros del inventario.
            </span>
          )}
        </div>

        {/* Carrusel Preview */}
        <div className="flex gap-3 overflow-x-auto py-1 px-0.5 no-scrollbar scroll-smooth">
          {selectedProducts.map((p) => (
            <div
              key={`preview-${p.id}`}
              className="w-[280px] h-[115px] bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-2.5 shadow-2xs flex gap-2.5 items-stretch shrink-0 group select-none relative"
            >
              <button
                type="button"
                onClick={() => toggleProduct(p.id!)}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center shadow-xs transition-transform hover:scale-110 cursor-pointer"
                title="Quitar del carrusel"
              >
                ✕
              </button>
              <div className="w-20 h-full rounded-xl bg-slate-100 dark:bg-slate-700/60 overflow-hidden relative border border-slate-200/80 dark:border-slate-700 shrink-0">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Package className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 w-fit truncate max-w-[130px]">
                  {p.category}
                </span>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate" title={p.name}>
                  {p.name}
                </h4>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-black font-mono text-slate-950 dark:text-sky-300">
                    {formatUSD(p.priceUSD)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {p.stock} {p.unit || 'pza'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {selectedProducts.length === 0 && (
            <div className="w-full py-8 text-center text-slate-400 text-xs">
              Usa los botones inferiores para seleccionar los artículos de acceso rápido.
            </div>
          )}
        </div>
      </div>

      {/* Controles de Selección y Filtro */}
      <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Barra de Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en el catálogo por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Atajos Rápidos de Selección */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={selectTopSelling}
              className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>Top 12 Mayor Stock</span>
            </button>
            <button
              type="button"
              onClick={selectAllFiltered}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-bold transition-colors cursor-pointer"
            >
              <span>+ Seleccionar Filtrados</span>
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar Todo</span>
            </button>
          </div>
        </div>

        {/* Filtro por Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla de Selección de Productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredProducts.map((p) => {
          const isSelected = selectedIds.includes(p.id!);
          return (
            <div
              key={p.id}
              onClick={() => toggleProduct(p.id!)}
              className={`p-3 rounded-2xl border-2 transition-all cursor-pointer select-none flex items-center gap-3 relative ${
                isSelected
                  ? 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-500 shadow-sm ring-1 ring-sky-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {/* Checkbox Visual */}
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>

              {/* Foto */}
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden relative border border-slate-200 dark:border-slate-600 shrink-0">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Package className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate block">
                  {p.category}
                </span>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate" title={p.name}>
                  {p.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-black text-xs text-sky-700 dark:text-sky-300">
                    {formatUSD(p.priceUSD)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Stock: {p.stock}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="py-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          No se encontraron productos coincidentes con los filtros de búsqueda.
        </div>
      )}

      {/* Botón flotante inferior para guardar */}
      <div className="sticky bottom-4 z-20 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-xl shadow-emerald-950/30 flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer"
        >
          <Save className="w-5 h-5" />
          <span>Guardar {selectedIds.length} Productos en el Carrusel</span>
        </button>
      </div>
    </div>
  );
}
