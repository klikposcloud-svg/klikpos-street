'use client';

import React from 'react';
import { Edit3, X, ImageIcon, Check } from 'lucide-react';
import { Product } from '@/types/tablet-pos';
import { ProductImageSelector } from '@/components/tablet-pos/ProductImageSelector';

interface EditProductModalProps {
  editingProduct: Product | null;
  setEditingProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  categoriesList: string[];
  onSave: () => void;
}

export function EditProductModal({
  editingProduct,
  setEditingProduct,
  categoriesList,
  onSave,
}: EditProductModalProps) {
  if (!editingProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="border rounded-3xl p-5 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative bg-slate-900 border-slate-800 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Editar Producto
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Actualiza imagen, precio, categoría y detalles
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditingProduct(null)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario de Edición */}
        <div className="flex-1 overflow-y-auto space-y-3.5 py-3 pr-1">
          {/* Foto del Producto */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1">
              <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>Foto del Producto</span>
            </label>

            <ProductImageSelector
              currentImage={editingProduct.image}
              onImageSelected={(url) => setEditingProduct({ ...editingProduct, image: url })}
              productName={editingProduct.name}
              barcode={editingProduct.sku}
              isLight={false}
            />
          </div>

          {/* Nombre y Precio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Nombre del Producto *</label>
              <input
                type="text"
                required
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-bold bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Precio ($ USD) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={editingProduct.priceUSD}
                onChange={(e) => setEditingProduct({ ...editingProduct, priceUSD: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-mono font-bold bg-slate-950 border-slate-700 text-amber-400"
              />
            </div>
          </div>

          {/* Categoría, SKU y Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Categoría</label>
              <select
                value={editingProduct.category}
                onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-bold bg-slate-950 border-slate-700 text-white"
              >
                {categoriesList.filter(c => c !== 'Todos').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Código / SKU</label>
              <input
                type="text"
                value={editingProduct.sku || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-mono bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Etiqueta / Badge</label>
              <input
                type="text"
                value={editingProduct.tag || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, tag: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-semibold bg-slate-950 border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Descripción / Detalles de Cocina */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Descripción / Ingredientes</label>
            <textarea
              rows={2}
              value={editingProduct.description || ''}
              onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
              placeholder="Detalla los ingredientes o modo de preparación..."
              className="w-full px-3 py-1.5 rounded-xl text-xs border outline-none bg-slate-950 border-slate-700 text-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSave}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
