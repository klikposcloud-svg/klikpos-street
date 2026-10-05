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
  Flame,
  Globe,
  Link as LinkIcon,
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

const LOCAL_STREET_PRESETS = [
  { name: 'Hamburguesa Especial 200g', path: '/packs/comida-street/hamburguesa.png', cat: 'Hamburguesas' },
  { name: 'Perro Caliente Con Todo', path: '/packs/comida-street/perro-caliente.png', cat: 'Perros' },
  { name: 'Pepito Mixto Gratinado 30cm', path: '/packs/comida-street/pepito.png', cat: 'Hamburguesas' },
  { name: 'Cachapa con Cochino Frito', path: '/packs/comida-street/cachapa-con-cochino.png', cat: 'Combos' },
  { name: 'Cachapa Doble Queso de Mano', path: '/packs/comida-street/cachapa-con-queso.png', cat: 'Combos' },
  { name: 'Mega Promo 5 Perros', path: '/packs/comida-street/combo-5-perros.png', cat: 'Combos' },
  { name: 'Combo 4 Perros + Refresco 1.5L', path: '/packs/comida-street/combo-4-perros-refresco.png', cat: 'Combos' },
  { name: 'Shawarma Mixto Libanés', path: '/packs/comida-street/shawarma.png', cat: 'Hamburguesas' },
  { name: 'Combo Shawarma + Papas + Bebida', path: '/packs/comida-street/combo-shawarma.png', cat: 'Combos' },
  { name: 'Combo Burger Especial Completa', path: '/packs/comida-street/combo-burger-1.png', cat: 'Combos' },
  { name: 'Combo Cachapa Cochino Frito', path: '/packs/comida-street/combo-cachapa-01.png', cat: 'Combos' },
  { name: 'Combo Cachapa Doble Queso', path: '/packs/comida-street/combo-cachapa-02.png', cat: 'Combos' },
  { name: 'Combo Pepito Mixto 30cm + Papas', path: '/packs/comida-street/combo-pepito-01.png', cat: 'Combos' },
  { name: 'Combo Dúo Shawarma Mixto', path: '/packs/comida-street/combo-shawarma-01.png', cat: 'Combos' },
  { name: 'Refresco Frío Personal', path: '/packs/comida-street/refresco.png', cat: 'Bebidas' },
  { name: 'Chicha Criolla con Canela', path: '/packs/comida-street/chicha.png', cat: 'Bebidas' },
];

export default function ProductImageSearchModal({
  isOpen,
  onClose,
  initialQuery,
  barcode,
  onSelectImage,
}: ProductImageSearchModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'web' | 'url'>('presets');
  const [query, setQuery] = useState(initialQuery || '');
  const [directUrl, setDirectUrl] = useState('');
  const [results, setResults] = useState<ImageResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const q = initialQuery || barcode || '';
      setQuery(q);
      if (q && q.trim().length > 1) {
        setActiveTab('web');
        performSearch(q);
      } else {
        setActiveTab('presets');
      }
    } else {
      setResults([]);
      setErrorMsg(null);
      setDownloadingUrl(null);
      setDirectUrl('');
    }
  }, [isOpen, initialQuery, barcode]);

  const performSearch = async (searchTerm: string) => {
    const clean = searchTerm.trim();
    if (!clean) return;
    setIsLoading(true);
    setErrorMsg(null);

    const foundResults: ImageResult[] = [];
    const seen = new Set<string>();

    const addResults = (items: ImageResult[]) => {
      for (const it of items) {
        if (it && it.url && !seen.has(it.url)) {
          seen.add(it.url);
          foundResults.push(it);
        }
      }
    };

    // 1. Intento API local si existe (Desktop / Dev)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(`/api/products/search-images?q=${encodeURIComponent(clean)}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          addResults(data.results);
        }
      }
    } catch {}

    // 2. Wikipedia Español (Artículos gastronómicos con fotos de alta calidad)
    try {
      const wpUrl = `https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(clean)}&gsrlimit=12&prop=pageimages&pithumbsize=480&format=json&origin=*`;
      const res = await fetch(wpUrl);
      if (res.ok) {
        const data = await res.json();
        const pages = Object.values(data.query?.pages || {});
        const wpItems: ImageResult[] = pages
          .filter((p: any) => p.thumbnail?.source)
          .map((p: any) => ({
            title: p.title || clean,
            url: p.thumbnail.source,
            thumbnail: p.thumbnail.source,
            source: 'Wikipedia'
          }));
        addResults(wpItems);
      }
    } catch {}

    // 3. Wikimedia Commons (Filtrando estrictamente fotos reales jpg/png/webp, ignorando pdfs)
    try {
      const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(clean)}&gsrlimit=25&gsrnamespace=6&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=400&format=json&origin=*`;
      const res = await fetch(commonsUrl);
      if (res.ok) {
        const data = await res.json();
        const pages = Object.values(data.query?.pages || {});
        const commItems: ImageResult[] = pages
          .map((page: any) => {
            const title = (page.title || '').toLowerCase();
            const isImage = title.endsWith('.jpg') || title.endsWith('.jpeg') || title.endsWith('.png') || title.endsWith('.webp');
            const info = page.imageinfo?.[0];
            if (!isImage || (!info?.thumburl && !info?.url)) return null;
            return {
              title: (page.title || clean).replace(/^File:/i, '').replace(/\.[^.]+$/, ''),
              url: info.thumburl || info.url,
              thumbnail: info.thumburl || info.url,
              source: 'Web Wikimedia'
            };
          })
          .filter(Boolean) as ImageResult[];
        addResults(commItems);
      }
    } catch {}

    // 4. Open Food Facts (Para códigos de barra y productos comerciales)
    try {
      if (barcode && barcode.length >= 8) {
        const bcRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
        if (bcRes.ok) {
          const bcData = await bcRes.json();
          if (bcData.status === 1 && bcData.product?.image_url) {
            addResults([{
              title: bcData.product.product_name || clean,
              url: bcData.product.image_url,
              thumbnail: bcData.product.image_front_thumb_url || bcData.product.image_url,
              source: 'Catálogo Oficial'
            }]);
          }
        }
      }
      const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(clean)}&search_simple=1&action=process&json=1&page_size=12`;
      const offRes = await fetch(offUrl);
      if (offRes.ok) {
        const data = await offRes.json();
        if (Array.isArray(data.products)) {
          const offItems = data.products
            .filter((p: any) => p.image_front_url || p.image_url)
            .map((p: any) => ({
              title: p.product_name || clean,
              url: p.image_front_url || p.image_url,
              thumbnail: p.image_front_thumb_url || p.image_url,
              source: 'Catálogo Alimentos'
            }));
          addResults(offItems);
        }
      }
    } catch {}

    // 5. Wikipedia Inglés (Fallback si hubo pocos resultados gastronómicos)
    if (foundResults.length < 4) {
      try {
        const enUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(clean)}&gsrlimit=10&prop=pageimages&pithumbsize=480&format=json&origin=*`;
        const res = await fetch(enUrl);
        if (res.ok) {
          const data = await res.json();
          const pages = Object.values(data.query?.pages || {});
          const enItems: ImageResult[] = pages
            .filter((p: any) => p.thumbnail?.source)
            .map((p: any) => ({
              title: p.title || clean,
              url: p.thumbnail.source,
              thumbnail: p.thumbnail.source,
              source: 'Global Wiki'
            }));
          addResults(enItems);
        }
      } catch {}
    }

    if (foundResults.length > 0) {
      setResults(foundResults);
    } else {
      setResults([]);
      setErrorMsg('No se encontraron imágenes en la web para este término. Puedes elegir una de la galería Street Food o ingresar un enlace directo.');
    }
    setIsLoading(false);
  };

  const handleSelectAndDownload = async (imageUrl: string) => {
    // Si ya es una imagen local del paquete, seleccionarla directamente
    if (imageUrl.startsWith('/packs/comida-street/')) {
      onSelectImage(imageUrl);
      onClose();
      return;
    }

    setDownloadingUrl(imageUrl);
    setErrorMsg(null);

    // Intentar comprimir y convertir a dataURL local para que funcione 100% offline
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width || 360;
          let height = img.height || 360;
          const maxDim = 400;
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
            const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
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
        // Si hay bloqueo CORS al canvas, asignar la URL directamente
        onSelectImage(imageUrl);
        onClose();
        setDownloadingUrl(null);
      };
      img.src = imageUrl;
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
                Selector de Imágenes & Fotos
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">
                  1 Tap
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Selecciona una foto oficial Street Food en HD o busca en la web para guardarla en el producto.
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

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="flex border-b border-slate-800 bg-slate-950 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2.5 px-3 text-xs font-black flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Galería Street Food Oficial (16 Fotos HD)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('web');
              if (query && results.length === 0) performSearch(query);
            }}
            className={`flex-1 py-2.5 px-3 text-xs font-black flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'web'
                ? 'border-sky-400 text-sky-300 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-400" />
            <span>Búsqueda Web & Google</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2.5 px-3 text-xs font-black flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LinkIcon className="w-4 h-4 text-emerald-400" />
            <span>Enlace URL Directo</span>
          </button>
        </div>

        {/* PESTAÑA 1: GALERÍA LOCAL STREET FOOD */}
        {activeTab === 'presets' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Catálogo Insignia: PNGs Transparentes en Alta Definición
              </span>
              <span className="text-[10px] text-slate-400">1 Tap para asignar</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {LOCAL_STREET_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectAndDownload(p.path)}
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-amber-500/50 hover:bg-slate-800/60 transition-all flex flex-col items-center text-center group cursor-pointer active:scale-95 shadow-sm"
                >
                  <div className="w-full h-24 rounded-lg bg-slate-900/90 p-1.5 flex items-center justify-center overflow-hidden mb-2 group-hover:scale-105 transition-transform">
                    <img
                      src={p.path}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-200 line-clamp-1 group-hover:text-amber-300">
                    {p.name}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                    {p.cat}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: BÚSQUEDA WEB & GOOGLE */}
        {activeTab === 'web' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* BARRA DE BÚSQUEDA */}
            <div className="p-4 bg-slate-950/90 border-b border-slate-800 shrink-0">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Escribe el nombre del producto (ej: Hamburguesa, Perro Caliente, Shawarma, Cachapa...)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        performSearch(query);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-400 focus:outline-hidden focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40 transition-all"
                  />
                </div>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    performSearch(query);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shrink-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-white" />
                      <span>BUSCAR</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* RESULTADOS DE BÚSQUEDA */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
                  <p className="text-sm font-bold text-slate-300">
                    Buscando fotografías en la web...
                  </p>
                  <p className="text-xs text-slate-500">Consultando fuentes oficiales sin restricciones</p>
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {results.map((item, idx) => {
                    const isDownloading = downloadingUrl === item.url;
                    return (
                      <div
                        key={idx}
                        className="group relative rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden hover:border-sky-500/50 hover:shadow-lg transition-all flex flex-col justify-between"
                      >
                        <div className="relative aspect-square w-full bg-slate-900 overflow-hidden flex items-center justify-center p-1">
                          <img
                            src={item.thumbnail || item.url}
                            alt={item.title}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-slate-900/80 text-sky-300 border border-sky-400/20">
                            {item.source}
                          </span>
                        </div>

                        <div className="p-2 space-y-1.5">
                          <p className="text-[11px] font-semibold text-slate-200 line-clamp-1" title={item.title}>
                            {item.title}
                          </p>

                          <button
                            type="button"
                            disabled={isDownloading}
                            onClick={() => handleSelectAndDownload(item.url)}
                            className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                          >
                            {isDownloading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Asignando...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Seleccionar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : errorMsg ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Sin resultados web</h4>
                  <p className="text-xs text-slate-400">{errorMsg}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('presets')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Elegir de Galería Street Food
                  </button>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                  <ImageIcon className="w-12 h-12 text-slate-700" />
                  <p className="text-xs text-slate-400">Ingresa el nombre del producto y pulsa BUSCAR</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: ENLACE URL DIRECTO */}
        {activeTab === 'url' && (
          <div className="flex-1 p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Pega el enlace directo de la imagen (de Google, WhatsApp o Web):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://ejemplo.com/foto-producto.jpg"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
                <button
                  type="button"
                  disabled={!directUrl.trim()}
                  onClick={() => {
                    if (directUrl.trim()) handleSelectAndDownload(directUrl.trim());
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  Usar Esta Foto
                </button>
              </div>
            </div>

            {directUrl.trim() && (
              <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/60 max-w-sm mx-auto text-center space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Vista Previa:</span>
                <div className="w-36 h-36 mx-auto rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                  <img
                    src={directUrl}
                    alt="Vista Previa"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* PIE DEL MODAL */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(modalContent, document.body) : null;
}
