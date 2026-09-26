'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Scale, X, Check, Calculator, Settings2, Search, ArrowRight, Tag, HelpCircle } from 'lucide-react';
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

  // Selector de producto si se abrió desde la barra superior sin producto seleccionado
  const [chosenProduct, setChosenProduct] = useState<ManualWeightProduct | null>(null);
  const [productSearch, setProductSearch] = useState<string>('');
  const [manualPriceInput, setManualPriceInput] = useState<string>('');
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);

  // Inicializar valor y producto al abrir
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

  // Determinar precio base a usar: el del producto elegido o el manual ingresado
  const activePriceUSD = useMemo(() => {
    if (activeProduct && activeProduct.priceUSD > 0) {
      return activeProduct.priceUSD;
    }
    const parsedManual = parseFloat(manualPriceInput.replace(',', '.'));
    return !isNaN(parsedManual) && parsedManual > 0 ? parsedManual : 0;
  }, [activeProduct, manualPriceInput]);

  // Parsear valor ingresado
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

  if (!isOpen) return null;

  // Botones de teclado
  const handleKey = (k: string) => {
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
  };

  // Botones de preajuste rápido
  const handlePreset = (grams: number) => {
    if (unit === 'g') {
      setInputValue(grams.toString());
    } else {
      setInputValue((grams / 1000).toFixed(3));
    }
    soundEffects.playBeep();
  };

  // Cambiar entre gramos y kilos con conversión instantánea
  const handleUnitSwitch = (newUnit: 'g' | 'kg') => {
    if (newUnit === unit) return;
    if (parsedValue > 0) {
      if (newUnit === 'g') {
        setInputValue(Math.round(parsedValue * 1000).toString());
      } else {
        setInputValue((parsedValue / 1000).toFixed(3));
      }
    }
    setUnit(newUnit);
  };

  const handleConfirm = () => {
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
  };

  // Filtrar productos para selector manual
  const filteredProducts = availableProducts.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q));
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        
        {/* Encabezado */}
        <div className="p-3 sm:p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide flex items-center gap-2">
                <span>Balanza de Mostrador · Ingreso Manual</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Sin Cable / Standalone
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Digite el peso indicado en su balanza física de mostrador
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo Scrollable */}
        <div className="p-3.5 space-y-3 flex-1 min-h-0 overflow-y-auto">

          {/* ========================================================================= */}
          {/* SELECCIÓN O CONTEXTO DEL PRODUCTO A PESAR                                */}
          {/* ========================================================================= */}
          {activeProduct ? (
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 block">
                  Producto a Pesar:
                </span>
                <p className="text-xs font-black text-slate-900 truncate">
                  {activeProduct.name}
                </p>
                <span className="text-xs text-slate-500 font-mono">
                  Precio Base: {formatUSD(activeProduct.priceUSD)} por {priceBasis}
                </span>
              </div>
              {!targetProduct && (
                <button
                  type="button"
                  onClick={() => {
                    setChosenProduct(null);
                    setShowProductDropdown(true);
                  }}
                  className="px-2 py-1 bg-white border border-sky-300 text-sky-800 rounded-lg text-xs font-bold shrink-0 hover:bg-sky-100"
                >
                  Cambiar
                </button>
              )}
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-sky-600" />
                  <span>¿A qué producto se refiere este peso?</span>
                </span>
                <span className="text-xs text-slate-500">Opcional</span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar producto (o escribe precio abajo)..."
                  value={productSearch}
                  onFocus={() => setShowProductDropdown(true)}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-sky-500"
                />

                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-xl z-20 max-h-36 overflow-y-auto">
                    {filteredProducts.slice(0, 10).map((p) => (
                      <div
                        key={p.id || p.name}
                        onClick={() => {
                          setChosenProduct(p);
                          setShowProductDropdown(false);
                          setProductSearch('');
                        }}
                        className="px-3 py-2 hover:bg-sky-50 cursor-pointer flex items-center justify-between border-b border-slate-100 text-xs"
                      >
                        <span className="font-bold text-slate-900 truncate">{p.name}</span>
                        <span className="font-mono font-black text-emerald-700 ml-2 shrink-0">
                          {formatUSD(p.priceUSD)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                <span className="text-xs text-slate-500 shrink-0">O fija precio manual por Kg:</span>
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={manualPriceInput}
                    onChange={(e) => setManualPriceInput(e.target.value)}
                    className="w-full pl-5 pr-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SELECTOR DE UNIDAD: GRAMOS VS KILOS                                      */}
          {/* ========================================================================= */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Unidad de Entrada:
            </span>
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleUnitSwitch('g')}
                className={`px-3 py-1 rounded-lg transition-all text-xs ${
                  unit === 'g'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gramos (g)
              </button>
              <button
                type="button"
                onClick={() => handleUnitSwitch('kg')}
                className={`px-3 py-1 rounded-lg transition-all text-xs ${
                  unit === 'kg'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kilogramos (kg)
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DISPLAY LCD DIGITAL TIPO BALANZA                                          */}
          {/* ========================================================================= */}
          <div className="bg-slate-950 p-3 rounded-xl border-2 border-slate-800 shadow-inner flex flex-col justify-between">
            <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-b border-slate-800/80 pb-1">
              <span>INDICADOR DE PESO DIGITAL</span>
              <span className="text-emerald-400 font-bold tracking-widest animate-pulse">
                ● MANUAL READY
              </span>
            </div>

            <div className="py-2 flex items-baseline justify-center gap-2">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)] tabular-numbers">
                {inputValue || '0'}
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-500">
                {unit}
              </span>
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

          {/* ========================================================================= */}
          {/* CÓMO SE CALCULA EL COSTO: FÓRMULA Y TOTAL EN VIVO (100% VISIBLE)          */}
          {/* ========================================================================= */}
          <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-xl space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                <span>¿Cómo se calcula el costo?</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                Tasa BCV: Bs. {bcvRate.toFixed(2)}
              </span>
            </div>

            {activePriceUSD > 0 ? (
              <div className="space-y-1">
                {/* Explicación de la fórmula matemática */}
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-200 text-xs font-mono space-y-0.5">
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Peso ingresado:</span>
                    <b className="text-slate-900">{parsedValue} {unit} ({calculation.weightInKg.toFixed(3)} kg)</b>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Precio unitario:</span>
                    <b className="text-slate-900">{formatUSD(activePriceUSD)} por {priceBasis}</b>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 border-t border-emerald-100 pt-0.5">
                    <span>Multiplicador aplicado:</span>
                    <b className="text-emerald-700">× {calculation.multiplier.toFixed(3)}</b>
                  </div>
                  <div className="text-xs text-slate-500 font-sans italic pt-0.5">
                    Fórmula: Peso ({calculation.multiplier.toFixed(3)}) × Precio (${activePriceUSD.toFixed(2)})
                  </div>
                </div>

                {/* Resultado Total en $ y Bs */}
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs font-black text-emerald-900 uppercase">
                    Costo Total a Cobrar:
                  </span>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black font-mono text-emerald-900 block tabular-numbers leading-tight">
                      {formatUSD(calculation.totalUSD)}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 block tabular-numbers">
                      ≈ {formatVES(calculation.totalUSD * bcvRate)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/70 p-2 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">
                  ⚡ Modo Pre-fijar Peso ({calculation.weightInKg.toFixed(3)} kg)
                </p>
                <p className="text-xs leading-tight text-slate-500">
                  Al confirmar, este peso se aplicará automáticamente al próximo producto que toques en el catálogo, multiplicando su precio por <b className="text-slate-700">{calculation.weightInKg.toFixed(3)} kg</b>.
                </p>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* BASE DE MULTIPLICADOR DE PRECIO (1kg / 100g / 1g)                         */}
          {/* ========================================================================= */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Settings2 className="w-3 h-3 text-slate-500" />
                <span>Base del Precio en Inventario:</span>
              </label>
              <span className="text-xs text-slate-500 font-medium">
                {priceBasis === '100g' ? 'Charcutería (100g)' : priceBasis === '1g' ? 'Especias (1g)' : 'Estándar (1kg)'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setPriceBasis('1kg')}
                className={`p-2 min-h-[44px] rounded-lg border text-left transition-all ${
                  priceBasis === '1kg'
                    ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-500/30 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300'
                }`}
              >
                <div className="font-black text-xs text-amber-950" style={{ color: '#78350f' }}>Por 1 Kilo</div>
                <div className="text-xs font-bold text-slate-900" style={{ color: '#0f172a' }}>1000g (Común)</div>
              </button>

              <button
                type="button"
                onClick={() => setPriceBasis('100g')}
                className={`p-2 min-h-[44px] rounded-lg border text-left transition-all ${
                  priceBasis === '100g'
                    ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-500/30 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300'
                }`}
              >
                <div className="font-black text-xs text-amber-950" style={{ color: '#78350f' }}>Por 100g</div>
                <div className="text-xs font-bold text-slate-900" style={{ color: '#0f172a' }}>Charcutería</div>
              </button>

              <button
                type="button"
                onClick={() => setPriceBasis('1g')}
                className={`p-2 min-h-[44px] rounded-lg border text-left transition-all ${
                  priceBasis === '1g'
                    ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-500/30 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300'
                }`}
              >
                <div className="font-black text-xs text-amber-950" style={{ color: '#78350f' }}>Por 1g</div>
                <div className="text-xs font-bold text-slate-900" style={{ color: '#0f172a' }}>Granos / Oro</div>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTONES DE PREAJUSTES RÁPIDOS                                             */}
          {/* ========================================================================= */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Pesos Rápidos Más Comunes:
              </span>
              <span className="text-[9px] text-slate-500">Clic para rellenar</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
              {[
                { label: '50g', g: 50 },
                { label: '100g', g: 100 },
                { label: '150g', g: 150 },
                { label: '200g', g: 200 },
                { label: '250g (¼kg)', g: 250 },
                { label: '300g', g: 300 },
                { label: '400g', g: 400 },
                { label: '500g (½kg)', g: 500 },
                { label: '750g (¾kg)', g: 750 },
                { label: '1000g (1kg)', g: 1000 },
                { label: '1.5 kg', g: 1500 },
                { label: '2.0 kg', g: 2000 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePreset(p.g)}
                  className="py-1.5 px-0.5 bg-slate-100 hover:bg-amber-100 hover:border-amber-400 border border-slate-300 rounded-lg text-xs font-black text-slate-950 transition-colors shadow-2xs text-center"
                  style={{ color: '#0f172a' }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TECLADO NUMÉRICO TÁCTIL                                                   */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
            {['7', '8', '9'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleKey(k)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-950 font-black text-base rounded-lg border border-slate-300 transition-colors shadow-2xs"
                style={{ color: '#0f172a' }}
              >
                {k}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKey('BACK')}
              className="py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-950 font-black text-xs rounded-lg border border-rose-300 transition-colors shadow-2xs flex items-center justify-center"
              style={{ color: '#881337' }}
              title="Borrar dígito"
            >
              ⌫
            </button>

            {['4', '5', '6'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleKey(k)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-950 font-black text-base rounded-lg border border-slate-300 transition-colors shadow-2xs"
                style={{ color: '#0f172a' }}
              >
                {k}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKey('C')}
              className="py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-950 font-black text-sm rounded-lg border border-slate-300 transition-colors shadow-2xs"
              style={{ color: '#0f172a' }}
              title="Limpiar"
            >
              C
            </button>

            {['1', '2', '3'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleKey(k)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-950 font-black text-base rounded-lg border border-slate-300 transition-colors shadow-2xs"
                style={{ color: '#0f172a' }}
              >
                {k}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKey('.')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black text-lg rounded-lg border border-slate-300 transition-colors shadow-2xs"
              style={{ color: '#0f172a' }}
            >
              .
            </button>

            <button
              type="button"
              onClick={() => handleKey('0')}
              className="col-span-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black text-base rounded-lg border border-slate-300 transition-colors shadow-2xs"
              style={{ color: '#0f172a' }}
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
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black text-sm rounded-lg border border-slate-300 transition-colors shadow-2xs"
              style={{ color: '#0f172a' }}
            >
              00
            </button>
            <button
              type="button"
              onClick={() => setInputValue('')}
              className="py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-950 font-black text-xs rounded-lg border border-slate-300 transition-colors shadow-2xs"
              style={{ color: '#0f172a' }}
            >
              Limpiar
            </button>
          </div>

          {/* Opción para recordar configuración */}
          <div className="pt-0.5 flex items-center justify-between">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 select-none font-medium">
              <input
                type="checkbox"
                checked={saveAsDefault}
                onChange={(e) => setSaveAsDefault(e.target.checked)}
                className="w-3.5 h-3.5 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
              />
              <span>Recordar unidad ({unit}) y base ({priceBasis}) como predeterminada</span>
            </label>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PIE DE ACCIONES FIJO (NUNCA SE SALE DEL CANVAS)                           */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-3.5 bg-slate-100 border-t border-slate-300 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-950 font-black text-xs rounded-xl border border-slate-300 transition-colors shrink-0 shadow-2xs"
            style={{ color: '#0f172a' }}
          >
            Cancelar (Esc)
          </button>

          <button
            type="button"
            disabled={calculation.weightInKg <= 0}
            onClick={handleConfirm}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {activeProduct
                ? `Aplicar a ${activeProduct.name} (${calculation.weightInKg.toFixed(3)} kg - ${formatUSD(calculation.totalUSD)})`
                : `Fijar Peso para Próximo Producto (${calculation.weightInKg.toFixed(3)} kg)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
