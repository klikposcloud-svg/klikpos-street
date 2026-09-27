'use client';

import React, { useState, useMemo } from 'react';
import { MASTER_CATALOG_PRODUCTS, MasterCatalogProduct } from '@/lib/data/master-catalog';
import { db, LocalProduct } from '@/lib/db';
import { soundEffects } from '@/lib/utils/sound';
import { cloudSyncService } from '@/lib/firebase/cloud-sync-service';
import {
  Sparkles,
  X,
  Search,
  CheckCircle2,
  Package,
  Layers,
  ShoppingBag,
  RefreshCw,
  PlusCircle,
  Database,
  Tag,
} from 'lucide-react';

interface MasterCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

const RUBRO_FILTERS = [
  { id: 'all', label: 'Todos (+120)', icon: '🌟', count: MASTER_CATALOG_PRODUCTS.length },
  { id: 'supermercado', label: 'Supermercado', icon: '🛒', count: 20 },
  { id: 'farmacia', label: 'Farmacia', icon: '💊', count: 15 },
  { id: 'licoreria', label: 'Licorería', icon: '🍾', count: 15 },
  { id: 'panaderia', label: 'Panadería', icon: '🥖', count: 15 },
  { id: 'bookstore', label: 'Librería', icon: '📚', count: 15 },
  { id: 'heladeria', label: 'Heladería', icon: '🍦', count: 12 },
  { id: 'restaurant', label: 'Restaurante', icon: '🍔', count: 14 },
  { id: 'ropa', label: 'Moda y Ropa', icon: '👕', count: 12 },
  { id: 'tecnologia', label: 'Electrónica', icon: '🎧', count: 14 },
];

export default function MasterCatalogModal({ isOpen, onClose, onSuccess }: MasterCatalogModalProps) {
  const [selectedRubro, setSelectedRubro] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return MASTER_CATALOG_PRODUCTS.filter((p) => {
      const matchesRubro = selectedRubro === 'all' || p.rubroId === selectedRubro;
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery.trim());
      return matchesRubro && matchesSearch;
    });
  }, [selectedRubro, searchQuery]);

  if (!isOpen) return null;

  const handleImportProducts = async (productsToImport: MasterCatalogProduct[]) => {
    if (productsToImport.length === 0) return;
    setIsLoading(true);
    setStatusMessage(`Cargando ${productsToImport.length} productos en la base de datos local...`);

    try {
      let count = 0;
      await db.transaction('rw', db.products, async () => {
        if (importMode === 'replace') {
          await db.products.clear();
        }

        for (const item of productsToImport) {
          const existing = await db.products.where('barcode').equals(item.barcode).first();
          if (existing) {
            await db.products.update(existing.id!, {
              name: item.name,
              category: item.category,
              priceUSD: item.priceUSD,
              costUSD: item.costUSD,
              stock: item.stock,
              minStock: item.minStock,
              unit: item.unit,
              image: item.image,
              updatedAt: new Date().toISOString(),
            });
          } else {
            await db.products.add({
              barcode: item.barcode,
              name: item.name,
              category: item.category,
              priceUSD: item.priceUSD,
              costUSD: item.costUSD,
              stock: item.stock,
              minStock: item.minStock,
              unit: item.unit,
              image: item.image,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as LocalProduct);
          }
          count++;
        }
      });

      setStatusMessage('Sincronizando catálogo con KlikPOS Cloud (Firebase)...');
      // Subida automática a Firebase
      cloudSyncService.pushProductsToCloud().catch(() => {});

      soundEffects.success();
      setStatusMessage(`✓ ¡Éxito! ${count} productos cargados con fotos y códigos de barra.`);

      setTimeout(() => {
        setIsLoading(false);
        setStatusMessage(null);
        onSuccess(count);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error importando catálogo maestro:', err);
      setStatusMessage(`Error: ${err?.message || 'Fallo al sembrar catálogo'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[90vh] max-h-[820px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Cabecera con Degradado Premium */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-700 to-sky-800 text-white relative flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 bg-white/15 backdrop-blur-md rounded-2xl text-xl shadow-inner">
              🚀
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight">Catálogo Maestro KlikPOS</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-xs">
                  +120 Productos
                </span>
              </div>
              <p className="text-emerald-100 text-xs mt-0.5">
                Pobla tu inventario en 1 segundo con productos venezolanos reales, fotos HD, códigos de barra EAN-13 y categorías.
              </p>
            </div>
          </div>

          {/* Opciones de Importación */}
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  importMode === 'merge'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Añadir y Conservar Actuales
              </button>
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  importMode === 'replace'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Reemplazar Todo
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleImportProducts(filteredProducts)}
                className="px-4 py-2 bg-white hover:bg-emerald-50 text-slate-900 font-black rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>Cargar Vista Actual ({filteredProducts.length})</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleImportProducts(MASTER_CATALOG_PRODUCTS)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Cargar Todo (+120 Productos)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Filtros por Rubro y Buscador */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-shrink-0">
          {/* Scroll horizontal de Rubros */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {RUBRO_FILTERS.map((rf) => (
              <button
                key={rf.id}
                type="button"
                onClick={() => setSelectedRubro(rf.id)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedRubro === rf.id
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{rf.icon}</span>
                <span>{rf.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  selectedRubro === rf.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {rf.count}
                </span>
              </button>
            ))}
          </div>

          {/* Campo de Búsqueda */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Feedback de Estado / Carga */}
        {statusMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 px-6">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Lista de Productos con Fotos */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((p) => (
            <div
              key={p.barcode}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group"
            >
              <div>
                {/* Imagen del producto */}
                <div className="w-full h-32 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative mb-2 flex items-center justify-center">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback en caso de error de red
                      (e.target as any).style.display = 'none';
                    }}
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-black text-white">
                    {p.category}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug mb-1">
                  {p.name}
                </h4>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>{p.barcode}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Precio USD</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    ${p.priceUSD.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Stock Demo</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {p.stock} {p.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pie de Página */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
          <span>Mostrando {filteredProducts.length} productos con fotos de alta resolución.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
