'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  X,
  Sparkles,
  Download,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Filter,
} from 'lucide-react';

interface ImageResult {
  title: string;
  url: string;
  thumbnail: string;
  source: string;
}

interface ProductImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery: string;
  barcode?: string;
  onSelectImage: (dataUrl: string) => void;
}

export default function ProductImageSearchModal({
  isOpen,
  onClose,
  initialQuery,
  barcode,
  onSelectImage,
}: ProductImageSearchModalProps) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState(initialQuery || '');
  const [filterModifier, setFilterModifier] = useState<'none' | 'white-bg' | 'packshot' | 'transparent'>('white-bg');
  const [results, setResults] = useState<ImageResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ejecutar búsqueda inicial al abrir
  useEffect(() => {
    if (isOpen) {
      const q = initialQuery || barcode || '';
      setQuery(q);
      if (q) {
        performSearch(q, filterModifier);
      }
    } else {
      setResults([]);
      setErrorMsg(null);
      setDownloadingUrl(null);
    }
  }, [isOpen, initialQuery, barcode]);

  const performSearch = async (searchTerm: string, modifier = filterModifier) => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    let finalQuery = searchTerm.trim();
    if (modifier === 'white-bg') {
      finalQuery += ' fondo blanco';
    } else if (modifier === 'packshot') {
      finalQuery += ' empaque producto';
    } else if (modifier === 'transparent') {
      finalQuery += ' png transparente';
    }

    let foundResults: ImageResult[] = [];

    // Intento 1: API local Next.js (si existe servidor Node.js activo en desktop/web)
    try {
      const params = new URLSearchParams({ q: finalQuery });
      if (barcode) params.append('barcode', barcode);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`/api/products/search-images?${params.toString()}`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          foundResults = data.results;
        }
      }
    } catch {
      // Si falla la API local (común en Android APK / WebView sin backend Node), pasamos al fallback directo
    }

    // Intento 2: Fallback directo desde el cliente (Open Food Facts + Wikimedia Commons con CORS libre)
    if (foundResults.length === 0) {
      try {
        const cleanTerm = searchTerm.trim();
        const searchPromises: Promise<ImageResult[]>[] = [];

        // 1. Open Food Facts (Búsqueda en catálogo comercial global con fotos de empaques)
        searchPromises.push(
          (async () => {
            try {
              if (barcode && barcode.length >= 8) {
                const bcRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
                if (bcRes.ok) {
                  const bcData = await bcRes.json();
                  if (bcData.status === 1 && bcData.product?.image_url) {
                    return [{
                      title: bcData.product.product_name || cleanTerm,
                      url: bcData.product.image_url,
                      thumbnail: bcData.product.image_front_thumb_url || bcData.product.image_url,
                      source: 'Catálogo Oficial'
                    }];
                  }
                }
              }
              const offRes = await fetch(
                `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanTerm)}&search_simple=1&action=process&json=1&page_size=16`
              );
              if (offRes.ok) {
                const data = await offRes.json();
                if (Array.isArray(data.products)) {
                  return data.products
                    .filter((p: any) => p.image_front_url || p.image_url || p.image_small_url)
                    .map((p: any) => ({
                      title: p.product_name || cleanTerm,
                      url: p.image_front_url || p.image_url || p.image_small_url,
                      thumbnail: p.image_front_thumb_url || p.image_small_url || p.image_url,
                      source: 'Catálogo Oficial'
                    }));
                }
              }
            } catch {}
            return [];
          })()
        );

        // 2. Wikimedia Commons (Acceso CORS libre a envases, marcas comerciales y bebidas)
        searchPromises.push(
          (async () => {
            try {
              const wikiRes = await fetch(
                `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanTerm)}&gsrnamespace=6&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=400&format=json&origin=*`
              );
              if (wikiRes.ok) {
                const data = await wikiRes.json();
                const pages = Object.values(data.query?.pages || {});
                return pages
                  .map((page: any) => {
                    const info = page.imageinfo?.[0];
                    if (!info?.thumburl && !info?.url) return null;
                    const title = (page.title || '').replace(/^File:/i, '').replace(/\.[^.]+$/, '');
                    return {
                      title: title || cleanTerm,
                      url: info.url || info.thumburl,
                      thumbnail: info.thumburl || info.url,
                      source: 'Web'
                    };
                  })
                  .filter(Boolean) as ImageResult[];
              }
            } catch {}
            return [];
          })()
        );

        const allResults = await Promise.all(searchPromises);
        foundResults = allResults.flat();
      } catch (e) {
        console.warn('Fallo en búsqueda directa:', e);
      }
    }

    if (foundResults.length > 0) {
      const seen = new Set<string>();
      const unique = foundResults.filter(item => {
        if (!item.url || seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });
      setResults(unique);
    } else {
      setResults([]);
      setErrorMsg('No se encontraron imágenes para este producto. Prueba con un nombre más genérico o comercial.');
    }
    setIsLoading(false);
  };

  const handleSelectAndDownload = async (imageUrl: string) => {
    setDownloadingUrl(imageUrl);
    setErrorMsg(null);

    // 1. Intento local con API de Node.js
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('/api/products/download-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.dataUrl) {
          onSelectImage(data.dataUrl);
          onClose();
          setDownloadingUrl(null);
          return;
        }
      }
    } catch {}

    // 2. Descarga y compresión directa en el cliente vía proxy CORS seguro
    try {
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&output=jpg&w=480&q=82`;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width || 360;
          let height = img.height || 360;
          const maxDim = 480;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            onSelectImage(dataUrl);
            onClose();
          } else {
            onSelectImage(imageUrl);
            onClose();
          }
        } catch {
          onSelectImage(imageUrl);
          onClose();
        } finally {
          setDownloadingUrl(null);
        }
      };
      img.onerror = () => {
        onSelectImage(imageUrl);
        onClose();
        setDownloadingUrl(null);
      };
      img.src = proxyUrl;
    } catch {
      onSelectImage(imageUrl);
      onClose();
      setDownloadingUrl(null);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border-b border-sky-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Buscar Foto en Google y la Web
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">
                  1 Clic
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Selecciona la foto de catálogo deseada para descargarla y guardarla offline en la ficha del producto.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BARRA DE BÚSQUEDA Y FILTROS INTELIGENTES (SIN TAG FORM PARA PREVENIR RECARGAS DE PÁGINA) */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 space-y-3 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Escribe el nombre o descripción del producto a buscar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    performSearch(query, filterModifier);
                  }
                }}
                className="dark-input keep-dark w-full pl-10 pr-4 py-2.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-400 focus:outline-hidden focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40 transition-all shadow-inner"
                style={{
                  color: '#ffffff',
                  WebkitTextFillColor: '#ffffff',
                  backgroundColor: '#0f172a',
                  caretColor: '#38bdf8'
                }}
              />
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                performSearch(query, filterModifier);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shrink-0"
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-white" />
                  <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>BUSCAR</span>
                </>
              )}
            </button>
          </div>

          {/* Filtros de Calidad Visual */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-xs font-bold">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1 shrink-0">
              <Filter className="w-3 h-3 text-sky-400" /> Filtros:
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setFilterModifier('white-bg');
                performSearch(query, 'white-bg');
              }}
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
              className={`px-3 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                filterModifier === 'white-bg'
                  ? 'bg-sky-600 border-sky-400 shadow-xs'
                  : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
              }`}
            >
              Fondo Blanco
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setFilterModifier('packshot');
                performSearch(query, 'packshot');
              }}
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
              className={`px-3 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                filterModifier === 'packshot'
                  ? 'bg-sky-600 border-sky-400 shadow-xs'
                  : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
              }`}
            >
              Empaque Comercial
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setFilterModifier('transparent');
                performSearch(query, 'transparent');
              }}
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
              className={`px-3 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                filterModifier === 'transparent'
                  ? 'bg-sky-600 border-sky-400 shadow-xs'
                  : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
              }`}
            >
              Sin Fondo (PNG)
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setFilterModifier('none');
                performSearch(query, 'none');
              }}
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
              className={`px-3 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                filterModifier === 'none'
                  ? 'bg-sky-600 border-sky-400 shadow-xs'
                  : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
              }`}
            >
              Todo / General
            </button>
          </div>
        </div>

        {/* ALERTA DE ERROR SI EXISTE */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-700 text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setErrorMsg(null);
              }} 
              className="text-rose-400 hover:text-white font-bold p-1"
            >
              &times;
            </button>
          </div>
        )}

        {/* CUADRÍCULA DE RESULTADOS DE FOTOS */}
        <div className="flex-1 min-h-[350px] p-4 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
              <p className="text-xs font-semibold">Consultando Google y catálogo de productos...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((item, idx) => {
                const isDownloading = downloadingUrl === item.url;
                return (
                  <div
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!downloadingUrl) handleSelectAndDownload(item.url);
                    }}
                    className={`group relative bg-slate-950 border border-slate-800 hover:border-sky-500 rounded-xl overflow-hidden cursor-pointer transition-all duration-150 flex flex-col shadow-sm hover:shadow-lg hover:shadow-sky-500/10 ${
                      isDownloading ? 'ring-2 ring-sky-400 opacity-80 pointer-events-none' : 'hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Contenedor de la foto sobre fondo claro para contraste de empaques */}
                    <div className="aspect-square w-full bg-white p-2.5 flex items-center justify-center overflow-hidden relative">
                      <img
                        src={item.thumbnail || item.url}
                        alt={item.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).parentElement?.parentElement?.classList.add('hidden');
                        }}
                      />

                      {/* Badge de Fuente */}
                      <span className="absolute top-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-300 backdrop-blur-xs">
                        {item.source}
                      </span>

                      {/* Overlay al pasar el cursor */}
                      <div className="absolute inset-0 bg-sky-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                        <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg">
                          <Check className="w-5 h-5 stroke-[3]" />
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">
                          Elegir esta foto
                        </span>
                      </div>

                      {/* Spinner de Descarga en curso */}
                      {isDownloading && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 p-2">
                          <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
                          <span className="text-[10px] font-black text-sky-200 uppercase">
                            Descargando...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Título de la imagen */}
                    <div className="p-2 bg-slate-900 border-t border-slate-800/80">
                      <p className="text-[11px] font-bold text-slate-300 truncate" title={item.title}>
                        {item.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500 text-center p-4">
              <ImageIcon className="w-12 h-12 stroke-[1.2] text-slate-600" />
              <div>
                <p className="text-sm font-bold text-slate-400">Escribe el nombre del producto arriba para buscar fotos</p>
                <p className="text-xs text-slate-500 mt-1">
                  Encuentra fotos de catálogo oficiales con fondo blanco listas para el punto de venta.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* PIE DE ACCIONES */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-400">
            {results.length > 0 ? (
              <span>Mostrando <strong className="text-white">{results.length}</strong> fotos encontradas</span>
            ) : (
              <span>Buscador optimizado para catálogo comercial</span>
            )}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
