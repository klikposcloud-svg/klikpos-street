'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Scale, X, Check, Calculator, Settings2, Search, Tag } from 'lucide-react';
import { formatUSD, formatVES } from '@/lib/formatters';
import { scaleService, PriceMultiplierBasis, calculateWeightPrice } from '@/lib/hardware/scale';
import { soundEffects } from '@/lib/utils/sound';

export interface ManualWeightProduct {
  id?: number;
  name: string;
  priceUSD: number;
  unit?: string;
  barcode?: string;
  image?: string;
}

interface ManualWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (weightInKg: number, multiplier: number, note?: string, selectedProduct?: ManualWeightProduct | null) => void;
  targetProduct?: ManualWeightProduct | null;
  bcvRate: number;
  initialWeightKg?: number;
  availableProducts?: ManualWeightProduct[];
}

export default function ManualWeightModal({
  isOpen,
  onClose,
  onApply,
  targetProduct,
  bcvRate,
  initialWeightKg = 0,
  availableProducts = [],
}: ManualWeightModalProps) {
  const currentConfig = scaleService.getConfig();
  const [unit, setUnit] = useState<'g' | 'kg'>(currentConfig.defaultInputUnit || 'g');
  const [priceBasis, setPriceBasis] = useState<PriceMultiplierBasis>(currentConfig.priceBasis || '1kg');
  const [inputValue, setInputValue] = useState<string>('');
  const [saveAsDefault, setSaveAsDefault] = useState<boolean>(false);

  // Selector de producto si se abrió desde la barra superior sin producto pre-seleccionado
  const [chosenProduct, setChosenProduct] = useState<ManualWeightProduct | null>(null);
  const [productSearch, setProductSearch] = useState<string>('');
  const [manualPriceInput, setManualPriceInput] = useState<string>('');
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);

  // Inicializar estado al abrir modal
  useEffect(() => {
    if (!isOpen) return;
    const cfg = scaleService.getConfig();
    const preferredUnit = cfg.defaultInputUnit || 'g';
    setUnit(preferredUnit);
    setPriceBasis(cfg.priceBasis || '1kg');
    setChosenProduct(targetProduct || null);
    setProductSearch('');
    setManualPriceInput('');
    setShowProductDropdown(false);

    if (initialWeightKg > 0) {
      if (preferredUnit === 'g') {
        setInputValue(Math.round(initialWeightKg * 1000).toString());
      } else {
        setInputValue(initialWeightKg.toFixed(3));
      }
    } else {
      setInputValue('');
    }
  }, [isOpen, initialWeightKg, targetProduct]);

  const activeProduct = targetProduct || chosenProduct;

  // Determinar precio base a usar: del producto seleccionado o precio manual ingresado
  const activePriceUSD = useMemo(() => {
    if (activeProduct && activeProduct.priceUSD > 0) {
      return activeProduct.priceUSD;
    }
    const parsedManual = parseFloat(manualPriceInput.replace(',', '.'));
    return !isNaN(parsedManual) && parsedManual > 0 ? parsedManual : 0;
  }, [activeProduct, manualPriceInput]);

  // Parsear valor numérico ingresado
  const parsedValue = useMemo(() => {
    const v = parseFloat(inputValue.replace(',', '.'));
    return isNaN(v) || v < 0 ? 0 : v;
  }, [inputValue]);

  // Cálculo en vivo
  const calculation = useMemo(() => {
    return calculateWeightPrice({
      weight: parsedValue,
      inputUnit: unit,
      priceUSD: activePriceUSD,
      priceBasis,
    });
  }, [parsedValue, unit, activePriceUSD, priceBasis]);

  // Teclas del teclado numérico
  const handleKey = useCallback((k: string) => {
    if (k === 'C') {
      setInputValue('');
      return;
    }
    if (k === 'BACK') {
      setInputValue((prev) => prev.slice(0, -1));
      return;
    }
    if (k === '.') {
      setInputValue((prev) => {
        if (!prev.includes('.')) {
          return prev === '' ? '0.' : prev + '.';
        }
        return prev;
      });
      return;
    }
    setInputValue((prev) => {
      if (prev === '0' && k !== '.') return k;
      return prev + k;
    });
  }, []);

  // Botones de preajuste rápido
  const handlePreset = useCallback((grams: number) => {
    if (unit === 'g') {
      setInputValue(grams.toString());
    } else {
      setInputValue((grams / 1000).toFixed(3));
    }
    soundEffects.playBeep();
  }, [unit]);

  // Conversión entre gramos y kilogramos
  const handleUnitSwitch = useCallback((newUnit: 'g' | 'kg') => {
    if (newUnit === unit) return;
    if (parsedValue > 0) {
      if (newUnit === 'g') {
        setInputValue(Math.round(parsedValue * 1000).toString());
      } else {
        setInputValue((parsedValue / 1000).toFixed(3));
      }
    }
    setUnit(newUnit);
  }, [unit, parsedValue]);

  // Confirmar y aplicar peso
  const handleConfirm = useCallback(() => {
    if (calculation.weightInKg <= 0) {
      soundEffects.playError();
      return;
    }

    if (saveAsDefault) {
      scaleService.saveConfig({
        defaultInputUnit: unit,
        priceBasis,
      });
    }

    scaleService.setManualWeight(parsedValue, unit);
    soundEffects.playBeep();

    const note = unit === 'g' ? `${parsedValue} g` : `${parsedValue} kg`;
    onApply(calculation.weightInKg, calculation.multiplier, note, activeProduct);
    onClose();
  }, [calculation, saveAsDefault, unit, priceBasis, parsedValue, onApply, activeProduct, onClose]);

  // Soporte para teclado físico (0-9, backspace, enter, esc)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        handleKey(e.key);
      } else if (e.key === '.' || e.key === ',') {
        handleKey('.');
      } else if (e.key === 'Backspace') {
        handleKey('BACK');
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (calculation.weightInKg > 0) {
          handleConfirm();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, calculation.weightInKg, handleConfirm, onClose, handleKey]);

  // Filtrado de productos para selección manual
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return availableProducts.filter((p) => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q)));
  }, [availableProducts, productSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        
        {/* ========================================================================= */}
        {/* ENCABEZADO INDUSTRIAL COMPACTO                                            */}
        {/* ========================================================================= */}
        <div className="px-4 py-3 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide">
                  Balanza de Mostrador · Ingreso Manual
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  Standalone
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Digite el peso de la balanza física o seleccione un atajo común
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* CUERPO WORKSTATION EN 2 COLUMNAS (CERO SCROLL)                            */}
        {/* ========================================================================= */}
        <div className="p-3.5 sm:p-4 flex-1 min-h-0 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 items-start">

          {/* ------------------------------------------------------------------------- */}
          {/* COLUMNA IZQUIERDA: LECTURA, PRODUCTO Y RESULTADOS TOTALES (6 COLS)        */}
          {/* ------------------------------------------------------------------------- */}
          <div className="md:col-span-6 flex flex-col gap-2.5">
            
            {/* Producto Activo o Selector Rápido */}
            {activeProduct ? (
              <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 block">
                    Producto a Pesar:
                  </span>
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                    {activeProduct.name}
                  </p>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-mono">
                    Precio: <b style={{ color: '#0f172a' }} className="font-black">{formatUSD(activeProduct.priceUSD)}</b> por {priceBasis}
                  </span>
                </div>
                {!targetProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setChosenProduct(null);
                      setShowProductDropdown(true);
                    }}
                    className="px-2 py-1 bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300 rounded-lg text-xs font-bold shrink-0 hover:bg-sky-100 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                  >
                    Cambiar
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>¿A qué producto se refiere este peso?</span>
                  </span>
                  <span className="text-slate-400 text-[10px]">Opcional</span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar producto o fije precio abajo..."
                    value={productSearch}
                    onFocus={() => setShowProductDropdown(true)}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />

                  {showProductDropdown && filteredProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl z-30 max-h-36 overflow-y-auto">
                      {filteredProducts.slice(0, 8).map((p) => (
                        <div
                          key={p.id || p.name}
                          onClick={() => {
                            setChosenProduct(p);
                            setShowProductDropdown(false);
                            setProductSearch('');
                          }}
                          className="px-3 py-2 hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800 text-xs"
                        >
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.name}</span>
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 ml-2 shrink-0">
                            {formatUSD(p.priceUSD)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">O precio manual por Kg:</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={manualPriceInput}
                      onChange={(e) => setManualPriceInput(e.target.value)}
                      className="w-full pl-5 pr-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Display Digital LCD Balanza */}
            <div className="bg-slate-950 p-3 rounded-xl border-2 border-slate-800 shadow-inner flex flex-col justify-between">
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-b border-slate-800/80 pb-1.5">
                <span className="tracking-wider">INDICADOR DE PESO DIGITAL</span>
                <span className="text-emerald-400 font-bold tracking-widest flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  MANUAL READY
                </span>
              </div>

              <div className="py-2.5 flex items-baseline justify-between px-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.35)] tabular-numbers">
                    {inputValue || '0'}
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-emerald-500">
                    {unit}
                  </span>
                </div>

                {/* Switch de Unidad g / kg dentro del Display */}
                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => handleUnitSwitch('g')}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                      unit === 'g'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    g
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitSwitch('kg')}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                      unit === 'kg'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    kg
                  </button>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Equivalente:</span>
                <span className="text-slate-200 font-bold">
                  {unit === 'g'
                    ? `${calculation.weightInKg.toFixed(3)} kg`
                    : `${Math.round(calculation.weightInGrams)} g`}
                </span>
              </div>
            </div>

            {/* Tarjeta de Cálculo y Gran Total a Cobrar */}
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-2 border-emerald-400/80 dark:border-emerald-600/80 rounded-xl space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Cálculo del Costo</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                  Tasa: Bs. {bcvRate.toFixed(2)}
                </span>
              </div>

              {activePriceUSD > 0 ? (
                <div className="space-y-1.5">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800/80 text-[11px] font-mono space-y-0.5">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span>Fórmula:</span>
                      <b className="text-slate-900 dark:text-white">
                        {parsedValue} {unit} ({calculation.weightInKg.toFixed(3)} kg) × {formatUSD(activePriceUSD)}
                      </b>
                    </div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 pt-0.5 border-t border-emerald-100 dark:border-slate-800">
                      <span>Multiplicador aplicado:</span>
                      <b className="text-emerald-700 dark:text-emerald-400 font-bold">× {calculation.multiplier.toFixed(3)}</b>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-xs font-black text-emerald-950 dark:text-emerald-300 uppercase tracking-wide">
                      Total a Cobrar:
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-300 block tabular-numbers leading-tight">
                        {formatUSD(calculation.totalUSD)}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 block tabular-numbers">
                        ≈ {formatVES(calculation.totalUSD * bcvRate)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    ⚡ Modo Pre-fijar Peso: {calculation.weightInKg.toFixed(3)} kg
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Se multiplicará automáticamente por el próximo producto que seleccione en el catálogo.
                  </p>
                </div>
              )}
            </div>

            {/* Base del Precio en Inventario (Segmented Controls) */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Base de Precio en Inventario:</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {priceBasis === '100g' ? 'Charcutería (100g)' : priceBasis === '1g' ? 'Especias (1g)' : 'Estándar (1kg)'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: '1kg' as PriceMultiplierBasis, title: 'Por 1 Kilo', sub: '1000g Estándar' },
                  { id: '100g' as PriceMultiplierBasis, title: 'Por 100g', sub: 'Charcutería' },
                  { id: '1g' as PriceMultiplierBasis, title: 'Por 1g', sub: 'Granos / Oro' },
                ].map((b) => {
                  const isCurrent = priceBasis === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setPriceBasis(b.id)}
                      className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-200 font-black shadow-xs ring-1 ring-amber-500/30'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{b.title}</div>
                      <div className="text-[10px] opacity-80">{b.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ------------------------------------------------------------------------- */}
          {/* COLUMNA DERECHA: PESOS RÁPIDOS + TECLADO NUMÉRICO TÁCTIL (6 COLS)          */}
          {/* ------------------------------------------------------------------------- */}
          <div className="md:col-span-6 flex flex-col gap-2.5">
            
            {/* Atajos de Pesos Rápidos Más Comunes */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-[11px]">
                  Pesos Rápidos Más Frecuentes:
                </span>
                <span className="text-[10px] text-slate-400">Clic para rellenar</span>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: '50g', g: 50 },
                  { label: '100g', g: 100 },
                  { label: '200g', g: 200 },
                  { label: '250g (¼)', g: 250 },
                  { label: '500g (½)', g: 500 },
                  { label: '750g (¾)', g: 750 },
                  { label: '1.0 kg', g: 1000 },
                  { label: '2.0 kg', g: 2000 },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePreset(p.g)}
                    className="py-1.5 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 hover:border-amber-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-2xs text-center cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Teclado Numérico Táctil Ergonómico */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {['7', '8', '9'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKey(k)}
                  className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-900 dark:text-white font-black text-lg rounded-xl border border-slate-300 dark:border-slate-700 transition-all shadow-2xs cursor-pointer"
                >
                  {k}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKey('BACK')}
                className="py-3 bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-700 dark:hover:text-rose-300 active:scale-[0.98] text-slate-700 dark:text-slate-300 font-black text-sm rounded-xl border border-slate-300 dark:border-slate-700 transition-all shadow-2xs flex items-center justify-center cursor-pointer"
                title="Borrar dígito (Backspace)"
              >
                ⌫
              </button>

              {['4', '5', '6'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKey(k)}
                  className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-900 dark:text-white font-black text-lg rounded-xl border border-slate-300 dark:border-slate-700 transition-all shadow-2xs cursor-pointer"
                >
                  {k}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKey('C')}
                className="py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 font-black text-sm rounded-xl border border-slate-300 dark:border-slate-700 transition-all shadow-2xs cursor-pointer"
                title="Limpiar entrada"
              >
                C
              </button>

              {['1', '2', '3'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKey(k)}
                  className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-900 dark:text-white font-black text-lg rounded-xl border border-slate-300 dark:border-slate-700 transition-all shadow-2xs cursor-pointer"
                >
                  {k}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKey('.')}
                className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-900 dark:text-white font-black text-xl rounded-xl border border-slate-300 dark:border-slate-700 transition-all shadow-2xs cursor-pointer"
              >
                .
              </button>

              <button
                type="button"
                onClick={() => handleKey('0')}
                className="col-span-2 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-900 dark:text-white font-black text-lg rounded-xl border border-slate-300 dark:border-slate-700 transition-all shadow-2xs cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => {
                  if (inputValue && !inputValue.includes('.')) {
                    setInputValue((prev) => prev + '00');
                  }
                }}
                className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-900 dark:text-white font-black text-sm rounded-xl border border-slate-300 dark:border-slate-700 transition-all shadow-2xs cursor-pointer"
              >
                00
              </button>
              <button
                type="button"
                onClick={() => setInputValue('')}
                className="py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 font-black text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-all shadow-2xs cursor-pointer"
              >
                Limpiar
              </button>
            </div>

            {/* Checkbox Recordar Configuración */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 select-none font-medium">
                <input
                  type="checkbox"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-slate-300 dark:border-slate-700 focus:ring-amber-400"
                />
                <span>Recordar unidad ({unit}) y base ({priceBasis}) como predeterminada</span>
              </label>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* PIE DE ACCIONES FIJO (NUNCA TRUNCADO, ALTO CONTRASTE)                     */}
        {/* ========================================================================= */}
        <div className="px-4 py-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            Cancelar (Esc)
          </button>

          <button
            type="button"
            disabled={calculation.weightInKg <= 0}
            onClick={handleConfirm}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-5 h-5 shrink-0" />
            <span className="truncate">
              {activeProduct
                ? `Confirmar ${calculation.weightInKg.toFixed(3)} kg · ${formatUSD(calculation.totalUSD)}`
                : `Fijar Peso ${calculation.weightInKg.toFixed(3)} kg`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
