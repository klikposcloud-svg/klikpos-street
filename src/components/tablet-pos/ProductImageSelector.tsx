'use client';

import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Upload, Search, X, Check, Globe, Sparkles, Loader2 } from 'lucide-react';

interface ProductImageSelectorProps {
  currentImage?: string;
  onImageSelected: (imageUrl: string) => void;
  productName?: string;
  isLight?: boolean;
}

// Catálogo pre-cargado de imágenes de alta fidelidad para productos populares de calle y bodegas
const POPULAR_PRODUCT_IMAGES: { name: string; query: string; url: string; category: string }[] = [
  // Comida Rápida y Calle
  { name: 'Perro Caliente Especial', query: 'perro caliente hot dog', url: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=400&q=80', category: 'Comida' },
  { name: 'Hamburguesa Doble Carne', query: 'hamburguesa burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80', category: 'Comida' },
  { name: 'Empanada Criolla', query: 'empanada', url: 'https://images.unsplash.com/photo-1644781440263-d1469e88bfef?auto=format&fit=crop&w=400&q=80', category: 'Comida' },
  { name: 'Tequeños Tradicionales', query: 'tequeños tequenos queso', url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=400&q=80', category: 'Comida' },
  { name: 'Papas Fritas Crujientes', query: 'papas fritas fries', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80', category: 'Comida' },
  { name: 'Pizza por Porción / Entera', query: 'pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80', category: 'Comida' },
  { name: 'Pepito Mixto de Carne', query: 'pepito sandwich sub', url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=400&q=80', category: 'Comida' },
  { name: 'Pollo Frito / Piezas', query: 'pollo frito fried chicken', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80', category: 'Comida' },
  
  // Bebidas y Refrescos
  { name: 'Refresco Cola Lata', query: 'coca cola refresco soda', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80', category: 'Bebidas' },
  { name: 'Agua Mineral Botella', query: 'agua mineral water', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80', category: 'Bebidas' },
  { name: 'Café Guayoyo / Espresso', query: 'cafe coffee espresso', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80', category: 'Bebidas' },
  { name: 'Jugo Natural Naranja / Frutas', query: 'jugo juice naranja', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80', category: 'Bebidas' },
  { name: 'Cerveza Fría Botella', query: 'cerveza beer', url: 'https://images.unsplash.com/photo-1608270190989-6447c234a93a?auto=format&fit=crop&w=400&q=80', category: 'Bebidas' },
  { name: 'Malta Fría Botella', query: 'malta soda oscura', url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=400&q=80', category: 'Bebidas' },

  // Víveres y Golosinas
  { name: 'Harina de Maíz Precocida', query: 'harina maiz pan corn', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80', category: 'Víveres' },
  { name: 'Arroz Blanco Grano Entero', query: 'arroz rice', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80', category: 'Víveres' },
  { name: 'Snacks / Platanitos / Papitas', query: 'chips papitas snacks', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80', category: 'Golosinas' },
  { name: 'Chocolate / Golosinas', query: 'chocolate dulce', url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80', category: 'Golosinas' }
];

// Comprime y optimiza imágenes cliente-side con canvas para no saturar memoria
const compressImage = (file: File, maxWidth = 480, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const ProductImageSelector: React.FC<ProductImageSelectorProps> = ({
  currentImage,
  onImageSelected,
  productName = '',
  isLight = false
}) => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(productName);
  const [customUrl, setCustomUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Manejador para cámara directa o archivo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessing(true);
      const compressedDataUrl = await compressImage(file);
      onImageSelected(compressedDataUrl);
    } catch (err) {
      console.error('Error al procesar foto:', err);
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  // Filtrado reactivo de imágenes sugeridas
  const filteredSuggestions = POPULAR_PRODUCT_IMAGES.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return item.name.toLowerCase().includes(q) || item.query.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-2">
      {/* Inputs Ocultos del Sistema */}
      {/* 1. Cámara Directa del Teléfono (capture="environment") */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 2. Galería de Archivos */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Barra de Vista Previa y Botones de Acción Inmediata */}
      <div className="flex items-center gap-2.5">
        {/* Thumbnail Preview */}
        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 shrink-0 flex items-center justify-center relative shadow-sm">
          {isProcessing ? (
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
          ) : currentImage ? (
            <img src={currentImage} alt="Foto" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-slate-500" />
          )}
        </div>

        {/* 3 Botones Rápidos en Fila */}
        <div className="flex-1 flex flex-wrap items-center gap-1.5">
          {/* Botón 1: Tomar Foto con la Cámara Directa */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 min-w-[90px] flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black rounded-xl shadow-sm transition-all active:scale-95"
            title="Abre la cámara de tu teléfono directamente"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Cámara</span>
          </button>

          {/* Botón 2: Buscar en Google / Catálogo Web */}
          <button
            type="button"
            onClick={() => {
              setSearchQuery(productName || '');
              setShowSearchModal(true);
            }}
            className="flex-1 min-w-[90px] flex items-center justify-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black rounded-xl shadow-sm transition-all active:scale-95"
            title="Buscar foto en Google o catálogo inteligente"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Google / Web</span>
          </button>

          {/* Botón 3: Subir de la Galería del Celular */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-xl border border-slate-700 transition-all active:scale-95"
            title="Elegir foto de las descargas o galería"
          >
            <Upload className="w-3 h-3 text-amber-400" />
            <span>Galería</span>
          </button>

          {currentImage && (
            <button
              type="button"
              onClick={() => onImageSelected('')}
              className="text-[10px] text-rose-400 hover:underline px-1 py-0.5"
            >
              Quitar
            </button>
          )}
        </div>
      </div>

      {/* MODAL DE BÚSQUEDA WEB Y GOOGLE IMÁGENES */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col max-h-[85vh] text-white">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Fotos Web y Google
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Toca una imagen para asignarla al instante
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input de Búsqueda */}
            <div className="pt-3 pb-2 flex gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ej: Empanada, Coca Cola, Perro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Botón directo para abrir Google Imágenes oficial en pestaña nueva si quiere una muy específica */}
              <a
                href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchQuery || 'comida')}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-xl border border-slate-700 flex items-center gap-1 shrink-0"
                title="Abrir Google Imágenes directamente"
              >
                <Globe className="w-3 h-3 text-blue-400" />
                <span>En Google</span>
              </a>
            </div>

            {/* Cuadrícula de Fotos Instantáneas */}
            <div className="flex-1 overflow-y-auto py-2 grid grid-cols-3 gap-2">
              {filteredSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onImageSelected(item.url);
                    setShowSearchModal(false);
                  }}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 cursor-pointer hover:border-amber-400 transition-all active:scale-95 shadow-sm"
                >
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-1">
                    <p className="text-[9px] font-bold text-white leading-tight truncate">
                      {item.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Opción de Pegar URL Directa */}
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <input
                type="url"
                placeholder="O pega link directo de imagen..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl text-[11px] bg-slate-950 border border-slate-700 text-white outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (customUrl.trim()) {
                    onImageSelected(customUrl.trim());
                    setShowSearchModal(false);
                  }
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
