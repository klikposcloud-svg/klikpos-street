'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, LocalProduct } from '@/lib/db';
import { formatUSD, formatVES } from '@/lib/formatters';
import {
  Printer,
  X,
  Sliders,
  Layers,
  Copy,
  Check,
  FileText,
  Tag,
  Eye,
  Store,
  Calendar,
  Sparkles,
  QrCode as QrIcon,
  Barcode as BarcodeIcon,
  Plus,
  Minus,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export type LabelFormat = '50x30' | '40x25' | '30x20' | '70x35' | 'avery30';

export interface QueueItem {
  product: LocalProduct;
  copies: number;
}

interface ProductLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: LocalProduct[];
  allProducts?: LocalProduct[];
  bcvRate: number;
  businessName?: string;
  businessRif?: string;
}

export default function ProductLabelModal({
  isOpen,
  onClose,
  products,
  allProducts,
  bcvRate,
  businessName = 'COMERCIAL MI TIENDA C.A.',
  businessRif = 'J-50123456-7',
}: ProductLabelModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<LabelFormat>('50x30');
  const [activeTab, setActiveTab] = useState<'queue' | 'design'>('queue');
  
  // Cola de productos a imprimir con copias independientes por producto
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [catalog, setCatalog] = useState<LocalProduct[]>(allProducts || []);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);

  // Opciones de Diseño
  const [showBarcode, setShowBarcode] = useState<boolean>(true);
  const [codeType, setCodeType] = useState<'BARCODE' | 'QR'>('BARCODE');
  const [showPriceUSD, setShowPriceUSD] = useState<boolean>(true);
  const [showPriceVES, setShowPriceVES] = useState<boolean>(true);
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [showDate, setShowDate] = useState<boolean>(false);
  const [previewProductIdx, setPreviewProductIdx] = useState<number>(0);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});

  const previewSvgRef = useRef<SVGSVGElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Inicializar cola con los productos recibidos
  useEffect(() => {
    if (isOpen) {
      if (products && products.length > 0) {
        setQueue(products.map(p => ({ product: p, copies: 1 })));
      } else {
        setQueue([]);
      }
      setPreviewProductIdx(0);
    }
  }, [isOpen, products]);

  // Cargar catálogo de productos si no se suministró externamente
  useEffect(() => {
    if (isOpen) {
      if (allProducts && allProducts.length > 0) {
        setCatalog(allProducts);
      } else {
        db.products.toArray().then(items => {
          setCatalog(items);
        }).catch(() => {});
      }
    }
  }, [isOpen, allProducts]);

  // Producto activo para previsualización
  const currentItem = queue[previewProductIdx] || queue[0];
  const currentProduct = currentItem?.product || products[0];

  // Generar QR codes en background para los productos en la cola
  useEffect(() => {
    if (!isOpen || codeType !== 'QR') return;
    queue.forEach(item => {
      const code = item.product.barcode || '7590000000000';
      if (!qrDataUrls[code]) {
        QRCode.toDataURL(code, { width: 120, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
          .then(url => {
            setQrDataUrls(prev => ({ ...prev, [code]: url }));
          })
          .catch(() => {});
      }
    });
  }, [isOpen, codeType, queue]);

  // Renderizar Barcode SVG en el previsualizador
  useEffect(() => {
    if (!isOpen || !currentProduct || codeType !== 'BARCODE' || !showBarcode) return;
    if (previewSvgRef.current) {
      try {
        const rawCode = (currentProduct.barcode || '7590000000000').trim();
        const isEAN = /^[0-9]{13}$/.test(rawCode);
        JsBarcode(previewSvgRef.current, rawCode, {
          format: isEAN ? 'EAN13' : 'CODE128',
          width: selectedFormat === '30x20' ? 0.95 : selectedFormat === '40x25' ? 1.15 : selectedFormat === 'avery30' ? 1.1 : 1.35,
          height: selectedFormat === '30x20' ? 15 : selectedFormat === '40x25' ? 19 : selectedFormat === 'avery30' ? 18 : selectedFormat === '70x35' ? 30 : 23,
          displayValue: true,
          fontSize: selectedFormat === '30x20' ? 7 : selectedFormat === '40x25' ? 8 : selectedFormat === 'avery30' ? 8 : 9,
          font: 'monospace',
          fontOptions: 'bold',
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (e) {
        try {
          JsBarcode(previewSvgRef.current, currentProduct.barcode || '7590000000000', {
            format: 'CODE128',
            width: 1.1,
            height: 18,
            displayValue: true,
            fontSize: 8,
            margin: 0,
          });
        } catch (err) {}
      }
    }
  }, [isOpen, currentProduct, selectedFormat, codeType, showBarcode]);

  // Cálculos de aprovechamiento de papel
  const totalLabels = useMemo(() => {
    return queue.reduce((sum, item) => sum + (item.copies || 1), 0);
  }, [queue]);

  const averySheets = Math.ceil(totalLabels / 30) || 1;
  const averyRemainder = totalLabels % 30;
  const averyMissing = averyRemainder === 0 ? 0 : 30 - averyRemainder;

  // Filtrado de catálogo para buscador
  const filteredCatalog = useMemo(() => {
    if (!catalogSearch.trim()) return [];
    const q = catalogSearch.toLowerCase().trim();
    return catalog.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [catalog, catalogSearch]);

  // Manejo de la cola de productos
  const handleAddProductToQueue = (prod: LocalProduct) => {
    setQueue(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === prod.id || (item.product.barcode && item.product.barcode === prod.barcode));
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].copies += 1;
        return next;
      }
      return [...prev, { product: prod, copies: 1 }];
    });
    setCatalogSearch('');
    setShowCatalogDropdown(false);
  };

  const handleUpdateCopies = (idx: number, delta: number) => {
    setQueue(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx].copies = Math.max(1, next[idx].copies + delta);
      }
      return next;
    });
  };

  const handleSetCopiesExact = (idx: number, value: number) => {
    setQueue(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx].copies = Math.max(1, Math.min(500, value || 1));
      }
      return next;
    });
  };

  const handleRemoveItem = (idx: number) => {
    setQueue(prev => prev.filter((_, i) => i !== idx));
    if (previewProductIdx >= queue.length - 1) {
      setPreviewProductIdx(Math.max(0, queue.length - 2));
    }
  };

  // Botón inteligente: Completar hoja Avery 30 exacta sin desperdicio
  const handleFillAverySheet = () => {
    if (averyMissing <= 0 || queue.length === 0) return;
    setQueue(prev => {
      const next = [...prev];
      let remaining = averyMissing;
      let i = 0;
      while (remaining > 0) {
        next[i % next.length].copies += 1;
        remaining--;
        i++;
      }
      return next;
    });
  };

  // Generar etiquetas para impresión
  const handlePrint = () => {
    if (!printAreaRef.current || queue.length === 0) return;

    const svgs = printAreaRef.current.querySelectorAll<SVGSVGElement>('svg.print-barcode-svg');
    svgs.forEach(svg => {
      const code = svg.getAttribute('data-barcode') || '7590000000000';
      try {
        const isEAN = /^[0-9]{13}$/.test(code);
        JsBarcode(svg, code, {
          format: isEAN ? 'EAN13' : 'CODE128',
          width: selectedFormat === '30x20' ? 0.9 : selectedFormat === '40x25' ? 1.05 : selectedFormat === 'avery30' ? 1.05 : 1.25,
          height: selectedFormat === '30x20' ? 14 : selectedFormat === '40x25' ? 18 : selectedFormat === 'avery30' ? 17 : selectedFormat === '70x35' ? 28 : 22,
          displayValue: true,
          fontSize: selectedFormat === '30x20' ? 6.5 : selectedFormat === '40x25' ? 7.5 : selectedFormat === 'avery30' ? 7.5 : 8.5,
          font: 'monospace',
          fontOptions: 'bold',
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (e) {
        try {
          JsBarcode(svg, code, {
            format: 'CODE128',
            width: 1.0,
            height: 16,
            displayValue: true,
            fontSize: 7.5,
            margin: 0,
          });
        } catch (err) {}
      }
    });

    document.body.classList.add('printing-labels-active');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-labels-active');
    }, 150);
  };

  if (!isOpen) return null;

  // Lista plana de etiquetas generadas según las copias individuales de cada producto
  const allLabelsToPrint: { product: LocalProduct; copyIndex: number }[] = [];
  queue.forEach(item => {
    for (let c = 0; c < item.copies; c++) {
      allLabelsToPrint.push({ product: item.product, copyIndex: c });
    }
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* CABECERA MODAL */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border-b border-sky-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/30">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Diseñador e Impresor de Etiquetas
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">
                  {queue.length} {queue.length === 1 ? 'Producto' : 'Productos'} · {totalLabels} {totalLabels === 1 ? 'Etiqueta' : 'Etiquetas'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Impresión continua en rollo térmico u hojas mixtas Carta/A4 con máximo ahorro de papel.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS DE CONTROL SUPERIOR */}
        <div className="px-5 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'queue'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cola Mixta ({queue.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'design'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Formato y Diseño</span>
            </button>
          </div>

          {/* Formato Rápido Activo */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Formato:</span>
            <span className="font-mono font-black text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              {selectedFormat === 'avery30' ? '📄 Carta / A4 (30/hoja)' : `🏷️ ${selectedFormat.replace('x', '×')} mm`}
            </span>
          </div>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* PANEL IZQUIERDO: CONTROLES / COLA (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-800 space-y-4 overflow-y-auto custom-scrollbar bg-slate-950/40">
            
            {activeTab === 'queue' ? (
              /* TAB 1: COLA MIXTA Y BUSCADOR DE PRODUCTOS */
              <div className="space-y-4">
                {/* Buscador para agregar productos a la tirada */}
                <div className="relative">
                  <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-sky-400" />
                      Agregar Productos a la Hoja
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {catalog.length} en catálogo
                    </span>
                  </label>
                  
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Escribe nombre o código de barras..."
                      value={catalogSearch}
                      onChange={e => {
                        setCatalogSearch(e.target.value);
                        setShowCatalogDropdown(true);
                      }}
                      onFocus={() => setShowCatalogDropdown(true)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 shadow-inner"
                    />
                    {catalogSearch && (
                      <button
                        onClick={() => {
                          setCatalogSearch('');
                          setShowCatalogDropdown(false);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white font-bold text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown de Resultados de Búsqueda */}
                  {showCatalogDropdown && filteredCatalog.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-800">
                      {filteredCatalog.map(p => {
                        const inQueue = queue.some(item => item.product.id === p.id);
                        return (
                          <div
                            key={p.id || p.barcode}
                            onClick={() => handleAddProductToQueue(p)}
                            className="p-2.5 hover:bg-sky-950/60 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs text-white truncate">{p.name}</p>
                              <p className="text-[10px] font-mono text-slate-400">
                                {p.barcode || 'Sin código'} · <span className="text-amber-400 font-bold">${p.priceUSD?.toFixed(2)}</span>
                              </p>
                            </div>
                            <button
                              type="button"
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shrink-0 ${
                                inQueue
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-sky-600 text-white'
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>{inQueue ? '+1 Copia' : 'Agregar'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Banner de Optimización de Hojas (Avery 30) */}
                {selectedFormat === 'avery30' && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-300 uppercase flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        Aprovechamiento de Hoja (30 Etiquetas)
                      </span>
                      <span className="text-xs font-mono font-black text-white">
                        {totalLabels % 30 === 0 && totalLabels > 0 ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 100% LLENA
                          </span>
                        ) : (
                          `${totalLabels} / ${averySheets * 30}`
                        )}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          totalLabels % 30 === 0 && totalLabels > 0 ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, ((totalLabels % 30 || 30) / 30) * 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-300">
                        {totalLabels % 30 === 0 && totalLabels > 0
                          ? `✨ ${averySheets} hoja(s) completa(s) sin desperdiciar papel.`
                          : `Faltan ${averyMissing} etiquetas para completar la hoja.`}
                      </span>

                      {averyMissing > 0 && queue.length > 0 && (
                        <button
                          type="button"
                          onClick={handleFillAverySheet}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] shadow-sm flex items-center gap-1 transition-all active:scale-95"
                          title="Añade copias a los productos de la cola para llenar exactamente los 30 espacios de la hoja"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Llenar Hoja ({averyMissing})</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Lista de Productos en Cola */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                      Productos Seleccionados ({queue.length})
                    </label>
                    {queue.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setQueue([])}
                        className="text-[10px] font-bold text-rose-400 hover:text-rose-300"
                      >
                        Vaciar lista
                      </button>
                    )}
                  </div>

                  {queue.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                      <Tag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-400">No hay productos en la cola de impresión</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Usa el buscador de arriba para añadir productos y copias a la hoja.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                      {queue.map((item, idx) => {
                        const p = item.product;
                        const isPreviewed = previewProductIdx === idx;
                        return (
                          <div
                            key={p.id || p.barcode || idx}
                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                              isPreviewed
                                ? 'bg-sky-950/40 border-sky-500 shadow-sm'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {/* Información del Producto */}
                            <div
                              className="min-w-0 flex-1 cursor-pointer"
                              onClick={() => setPreviewProductIdx(idx)}
                              title="Clic para previsualizar etiqueta"
                            >
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-black text-xs text-white truncate">{p.name}</h4>
                                {isPreviewed && (
                                  <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-sky-500 text-white uppercase">
                                    Ojo
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="font-mono text-slate-300 font-bold">${p.priceUSD?.toFixed(2)}</span>
                                <span>·</span>
                                <span className="font-mono text-sky-400">Bs. {((p.priceUSD || 0) * bcvRate).toFixed(2)}</span>
                              </div>
                            </div>

                            {/* Control de Copias Stepper */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdateCopies(idx, -1)}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center transition-all active:scale-95"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              
                              <input
                                type="number"
                                min="1"
                                max="500"
                                value={item.copies}
                                onChange={e => handleSetCopiesExact(idx, parseInt(e.target.value) || 1)}
                                className="w-11 text-center bg-slate-950 border border-slate-700 rounded-lg py-1 text-xs font-black text-white focus:outline-none focus:border-sky-500"
                              />

                              <button
                                type="button"
                                onClick={() => handleUpdateCopies(idx, 1)}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center transition-all active:scale-95"
                              >
                                <Plus className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="w-7 h-7 rounded-lg hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 flex items-center justify-center ml-1 transition-all"
                                title="Eliminar de la cola"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* TAB 2: FORMATOS Y OPCIONES DE DISEÑO */
              <div className="space-y-4">
                {/* Formatos de etiqueta */}
                <div>
                  <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-sky-400" />
                    Formato de Etiqueta o Papel
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('50x30')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedFormat === '50x30'
                          ? 'bg-sky-600/20 border-sky-400 text-white shadow-xs'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-black text-white">50 x 30 mm</div>
                      <div className="text-[10px] text-slate-400 font-normal">Rollo Estándar Térmico</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedFormat('40x25')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedFormat === '40x25'
                          ? 'bg-sky-600/20 border-sky-400 text-white shadow-xs'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-black text-white">40 x 25 mm</div>
                      <div className="text-[10px] text-slate-400 font-normal">Rollo Compacto</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedFormat('70x35')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedFormat === '70x35'
                          ? 'bg-sky-600/20 border-sky-400 text-white shadow-xs'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-black text-white">70 x 35 mm</div>
                      <div className="text-[10px] text-slate-400 font-normal">Hablador Góndola</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedFormat('30x20')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedFormat === '30x20'
                          ? 'bg-sky-600/20 border-sky-400 text-white shadow-xs'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-black text-white">30 x 20 mm</div>
                      <div className="text-[10px] text-slate-400 font-normal">Mini / Farmacia</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedFormat('avery30')}
                      className={`col-span-2 p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        selectedFormat === 'avery30'
                          ? 'bg-indigo-600/20 border-indigo-400 text-white shadow-xs'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="font-black text-white">Hoja Carta / A4 (Avery 30 por Hoja)</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Para impresoras láser o tinta convencional (3 columnas × 10 filas)
                        </div>
                      </div>
                      <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Elementos Visibles */}
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2.5">
                  <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-1">
                    Elementos en la Etiqueta
                  </label>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-800/50 p-2 rounded-lg hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={showBarcode}
                        onChange={e => setShowBarcode(e.target.checked)}
                        className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-900 border-slate-700"
                      />
                      <span className="font-semibold text-slate-200">Código de Barras</span>
                    </label>

                    <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setCodeType('BARCODE')}
                        className={`flex-1 py-1 text-[10px] font-bold rounded flex items-center justify-center gap-1 ${
                          codeType === 'BARCODE' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400'
                        }`}
                      >
                        <BarcodeIcon className="w-3 h-3" /> Barras
                      </button>
                      <button
                        type="button"
                        onClick={() => setCodeType('QR')}
                        className={`flex-1 py-1 text-[10px] font-bold rounded flex items-center justify-center gap-1 ${
                          codeType === 'QR' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400'
                        }`}
                      >
                        <QrIcon className="w-3 h-3" /> QR
                      </button>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer bg-slate-800/50 p-2 rounded-lg hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={showPriceUSD}
                        onChange={e => setShowPriceUSD(e.target.checked)}
                        className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-900 border-slate-700"
                      />
                      <span className="font-semibold text-slate-200">Precio USD ($)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer bg-slate-800/50 p-2 rounded-lg hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={showPriceVES}
                        onChange={e => setShowPriceVES(e.target.checked)}
                        className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-900 border-slate-700"
                      />
                      <span className="font-semibold text-amber-300">Precio Bs. (BCV)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer bg-slate-800/50 p-2 rounded-lg hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={showStoreName}
                        onChange={e => setShowStoreName(e.target.checked)}
                        className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-900 border-slate-700"
                      />
                      <span className="font-semibold text-slate-200">Nombre de Tienda</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer bg-slate-800/50 p-2 rounded-lg hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={showDate}
                        onChange={e => setShowDate(e.target.checked)}
                        className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-900 border-slate-700"
                      />
                      <span className="font-semibold text-slate-200">Fecha Emisión</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PANEL DERECHO: PREVISUALIZADOR WYSIWYG FOTORREALISTA (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden select-none">
            <div className="absolute top-3 left-4 flex items-center gap-2 text-xs text-slate-400 font-bold">
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Vista Previa:</span>
              <span className="text-white font-mono">{currentProduct ? currentProduct.name : 'Sin producto'}</span>
            </div>

            {/* Selector de Producto para Previsualizar si hay varios en cola */}
            {queue.length > 1 && (
              <div className="absolute top-3 right-4 flex items-center gap-1.5 z-10">
                <span className="text-[10px] text-slate-400 font-bold">Ver:</span>
                <select
                  value={previewProductIdx}
                  onChange={e => setPreviewProductIdx(parseInt(e.target.value) || 0)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold text-white focus:outline-none"
                >
                  {queue.map((item, i) => (
                    <option key={i} value={i}>
                      #{i + 1} {item.product.name.slice(0, 16)} ({item.copies} copias)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ETIQUETA WYSIWYG CON RECUADRO ESTRUCTURADO (ZERO OVERFLOW) */}
            <div className="my-auto py-4 flex flex-col items-center justify-center">
              {currentProduct ? (
                <div
                  className={`bg-white text-slate-950 rounded-xs shadow-[0_12px_40px_rgba(0,0,0,0.65)] border-2 border-dashed border-slate-400 relative transition-all flex flex-col justify-between overflow-hidden box-border ${
                    selectedFormat === '50x30'
                      ? 'w-[290px] h-[174px] p-2.5'
                      : selectedFormat === '40x25'
                      ? 'w-[245px] h-[153px] p-2'
                      : selectedFormat === '30x20'
                      ? 'w-[200px] h-[133px] p-1.5'
                      : selectedFormat === '70x35'
                      ? 'w-[360px] h-[180px] p-3'
                      : 'w-[320px] h-[140px] p-2'
                  }`}
                  style={{ boxSizing: 'border-box' }}
                >
                  {/* 1. Cabecera Tienda y Fecha */}
                  <div className="flex items-center justify-between text-[8px] font-black uppercase text-slate-700 border-b border-slate-300 pb-0.5 leading-none shrink-0">
                    {showStoreName && <span className="truncate max-w-[190px]">{businessName}</span>}
                    {showDate && <span className="text-[7.5px] text-slate-500 font-mono">{new Date().toLocaleDateString('es-VE')}</span>}
                  </div>

                  {/* 2. Nombre del Producto */}
                  <div className="my-auto overflow-hidden shrink-0">
                    <h4 className={`font-black text-slate-950 leading-tight uppercase line-clamp-1 ${
                      selectedFormat === '70x35' ? 'text-xs' : selectedFormat === '30x20' ? 'text-[9px]' : 'text-[11px]'
                    }`}>
                      {currentProduct.name}
                    </h4>
                  </div>

                  {/* 3. Código de Barras o QR */}
                  {showBarcode && (
                    <div className="flex justify-center items-center my-0.5 overflow-hidden shrink-0">
                      {codeType === 'BARCODE' ? (
                        <svg ref={previewSvgRef} className="max-w-full h-auto block"></svg>
                      ) : (
                        qrDataUrls[currentProduct.barcode || '7590000000000'] && (
                          <img
                            src={qrDataUrls[currentProduct.barcode || '7590000000000']}
                            alt="QR"
                            className="w-10 h-10 object-contain block"
                          />
                        )
                      )}
                    </div>
                  )}

                  {/* 4. RECUADRO DE PRECIOS ESTRUCTURADO (HERMÉTICO & ESTILO GÓNDOLA RETAIL) */}
                  <div className={`mt-auto border border-slate-900 rounded-xs bg-slate-50/90 overflow-hidden shrink-0 grid ${
                    showPriceUSD && showPriceVES ? 'grid-cols-2 divide-x divide-slate-400' : 'grid-cols-1'
                  }`}>
                    {showPriceUSD && (
                      <div className="p-0.5 text-center leading-none">
                        <span className="text-[6.5px] font-black text-slate-600 uppercase block tracking-tighter">PRECIO USD</span>
                        <span className={`font-mono font-black text-slate-950 tabular-numbers block ${
                          selectedFormat === '70x35' ? 'text-sm' : selectedFormat === '30x20' ? 'text-[9.5px]' : 'text-xs'
                        }`}>
                          ${(currentProduct.priceUSD || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {showPriceVES && (
                      <div className="p-0.5 text-center leading-none bg-sky-50/60">
                        <span className="text-[6.5px] font-extrabold text-sky-900 uppercase block tracking-tighter">REF. BCV</span>
                        <span className={`font-mono font-black text-sky-950 tabular-numbers block ${
                          selectedFormat === '70x35' ? 'text-xs' : selectedFormat === '30x20' ? 'text-[8.5px]' : 'text-[10.5px]'
                        }`}>
                          Bs. {((currentProduct.priceUSD || 0) * bcvRate).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Guía milimétrica */}
                  <div className="absolute -bottom-5 left-0 right-0 text-center text-[9px] text-slate-500 font-mono">
                    Dimensión: {selectedFormat === 'avery30' ? 'Carta / A4 (66 × 25.4 mm)' : `${selectedFormat.replace('x', ' × ')} mm`}
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-xs">Selecciona un producto</div>
              )}
            </div>

            {/* Simulación de Hoja Avery 30 */}
            {selectedFormat === 'avery30' && (
              <div className="text-xs text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-center max-w-md">
                📄 Cuadrícula Avery: <strong>3 columnas × 10 filas (30 etiquetas por hoja Carta)</strong>. Se imprimirán <strong>{totalLabels} etiquetas contiguas</strong> en <strong>{averySheets} hoja(s)</strong>.
              </div>
            )}
          </div>
        </div>

        {/* PIE DE ACCIONES */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Tasa BCV:</span>
            <strong className="text-amber-400 font-mono">Bs. {bcvRate.toFixed(2)}</strong>
            <span className="text-slate-600">|</span>
            <span>Total en Cola: <strong className="text-white font-mono">{totalLabels} etiquetas</strong></span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={queue.length === 0}
              onClick={handlePrint}
              className="px-6 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg shadow-sky-600/30 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              <span>IMPRIMIR ({totalLabels} ETIQUETAS)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* CONTENEDOR OCULTO PARA IMPRESIÓN DIRECTA (@media print)               */}
      {/* ===================================================================== */}
      <div
        id="printable-labels-area"
        ref={printAreaRef}
        className="hidden"
      >
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-labels-area, #printable-labels-area * {
                visibility: visible !important;
              }
              #printable-labels-area {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                color: black !important;
              }

              ${selectedFormat === '50x30' ? `
                @page { size: 50mm 30mm; margin: 0; }
                .label-print-unit {
                  width: 50mm;
                  height: 30mm;
                  max-height: 30mm;
                  padding: 1.2mm;
                  box-sizing: border-box;
                  page-break-after: always;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  overflow: hidden;
                  font-family: Arial, sans-serif;
                }
              ` : selectedFormat === '40x25' ? `
                @page { size: 40mm 25mm; margin: 0; }
                .label-print-unit {
                  width: 40mm;
                  height: 25mm;
                  max-height: 25mm;
                  padding: 1mm;
                  box-sizing: border-box;
                  page-break-after: always;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  overflow: hidden;
                  font-family: Arial, sans-serif;
                }
              ` : selectedFormat === '30x20' ? `
                @page { size: 30mm 20mm; margin: 0; }
                .label-print-unit {
                  width: 30mm;
                  height: 20mm;
                  max-height: 20mm;
                  padding: 0.8mm;
                  box-sizing: border-box;
                  page-break-after: always;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  overflow: hidden;
                  font-family: Arial, sans-serif;
                }
              ` : selectedFormat === '70x35' ? `
                @page { size: 70mm 35mm; margin: 0; }
                .label-print-unit {
                  width: 70mm;
                  height: 35mm;
                  max-height: 35mm;
                  padding: 1.5mm;
                  box-sizing: border-box;
                  page-break-after: always;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  overflow: hidden;
                  font-family: Arial, sans-serif;
                }
              ` : `
                @page { size: letter portrait; margin: 10mm 6mm; }
                .avery30-sheet-grid {
                  display: grid !important;
                  grid-template-columns: repeat(3, 66mm);
                  grid-gap: 3mm 2.5mm;
                  box-sizing: border-box;
                }
                .label-print-unit {
                  width: 66mm;
                  height: 25.4mm;
                  max-height: 25.4mm;
                  padding: 1.2mm;
                  box-sizing: border-box;
                  border: 1px dashed #cbd5e1;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  overflow: hidden;
                  font-family: Arial, sans-serif;
                }
              `}
            }
          `
        }} />

        <div className={selectedFormat === 'avery30' ? 'avery30-sheet-grid' : 'single-roll-container'}>
          {allLabelsToPrint.map((item, idx) => {
            const p = item.product;
            const vesTotal = (p.priceUSD || 0) * bcvRate;
            return (
              <div key={idx} className="label-print-unit">
                {/* Cabecera Tienda */}
                {showStoreName && (
                  <div style={{ fontSize: '6.5pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '0.4px solid #999', paddingBottom: '0.3mm', display: 'flex', justifyContent: 'space-between', lineHeight: '1' }}>
                    <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '35mm' }}>{businessName}</span>
                    {showDate && <span style={{ fontSize: '5.5pt', color: '#555' }}>{new Date().toLocaleDateString('es-VE')}</span>}
                  </div>
                )}

                {/* Nombre de Producto */}
                <div style={{ fontSize: selectedFormat === '30x20' ? '6pt' : selectedFormat === '40x25' ? '7pt' : '7.5pt', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1.05', margin: '0.3mm 0', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {p.name}
                </div>

                {/* Código de barras / QR */}
                {showBarcode && (
                  <div style={{ textAlign: 'center', margin: '0.2mm 0', overflow: 'hidden' }}>
                    {codeType === 'BARCODE' ? (
                      <svg className="print-barcode-svg" data-barcode={p.barcode || '7590000000000'} style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}></svg>
                    ) : (
                      qrDataUrls[p.barcode || '7590000000000'] && (
                        <img
                          src={qrDataUrls[p.barcode || '7590000000000']}
                          alt="QR"
                          style={{ width: '10mm', height: '10mm', display: 'block', margin: '0 auto' }}
                        />
                      )
                    )}
                  </div>
                )}

                {/* RECUADRO ESTRUCTURADO DE PRECIOS */}
                <div style={{
                  border: '0.5px solid #000',
                  borderRadius: '1px',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.4mm 1mm',
                  marginTop: 'auto',
                  lineHeight: '1',
                  overflow: 'hidden',
                  boxSizing: 'border-box'
                }}>
                  {showPriceUSD && (
                    <div style={{ textAlign: 'left', lineHeight: '1' }}>
                      <span style={{ fontSize: '4.5pt', fontWeight: 'bold', color: '#555', display: 'block' }}>PRECIO</span>
                      <span style={{ fontSize: selectedFormat === '30x20' ? '7pt' : '8.5pt', fontWeight: '900', fontFamily: 'monospace' }}>
                        ${(p.priceUSD || 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {showPriceVES && (
                    <div style={{ textAlign: 'right', lineHeight: '1', borderLeft: showPriceUSD ? '0.4px solid #cbd5e1' : 'none', paddingLeft: showPriceUSD ? '1mm' : '0' }}>
                      <span style={{ fontSize: '4.5pt', fontWeight: 'bold', color: '#555', display: 'block' }}>REF. BCV</span>
                      <span style={{ fontSize: selectedFormat === '30x20' ? '6.5pt' : '7.5pt', fontWeight: '900', fontFamily: 'monospace' }}>
                        Bs. {vesTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
