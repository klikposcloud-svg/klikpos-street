'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, Package, Percent, DollarSign, TrendingUp, AlertTriangle, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { formatUSD, formatVES } from '@/lib/formatters';

interface ProductCostCalculatorProps {
  costUSD: string;
  priceUSD: string;
  costPerBox?: string;
  packageUnits?: string;
  profitMarginPercent?: string;
  unit?: string;
  bcvRate: number;
  accentColor?: 'sky' | 'indigo';
  onChange: (values: {
    costUSD: string;
    priceUSD: string;
    costPerBox: string;
    packageUnits: string;
    profitMarginPercent: string;
  }) => void;
}

export default function ProductCostCalculator({
  costUSD,
  priceUSD,
  costPerBox = '',
  packageUnits = '',
  profitMarginPercent = '',
  unit = 'unidad',
  bcvRate,
  accentColor = 'sky',
  onChange,
}: ProductCostCalculatorProps) {
  const [purchaseMode, setPurchaseMode] = useState<'unit' | 'box'>(
    costPerBox && parseFloat(costPerBox) > 0 ? 'box' : 'unit'
  );

  const parsedCost = parseFloat(costUSD) || 0;
  const parsedPrice = parseFloat(priceUSD) || 0;
  const parsedBoxCost = parseFloat(costPerBox) || 0;
  const parsedUnits = parseFloat(packageUnits) || 1;

  // Manejar cambio en Costo de Caja
  const handleBoxCostChange = (val: string) => {
    const bCost = parseFloat(val) || 0;
    const units = parseFloat(packageUnits) || 1;
    const computedUnitCost = units > 0 ? (bCost / units).toFixed(4).replace(/\.?0+$/, '') : '0';
    
    // Si ya hay un precio de venta, recalcular margen
    let newMargin = profitMarginPercent;
    if (parsedPrice > 0 && parseFloat(computedUnitCost) > 0) {
      const uCost = parseFloat(computedUnitCost);
      newMargin = (((parsedPrice - uCost) / uCost) * 100).toFixed(1);
    }

    onChange({
      costUSD: computedUnitCost,
      priceUSD,
      costPerBox: val,
      packageUnits,
      profitMarginPercent: newMargin,
    });
  };

  // Manejar cambio en Unidades por Caja
  const handlePackageUnitsChange = (val: string) => {
    const units = parseFloat(val) || 1;
    const bCost = parseFloat(costPerBox) || 0;
    const computedUnitCost = units > 0 ? (bCost / units).toFixed(4).replace(/\.?0+$/, '') : '0';

    let newMargin = profitMarginPercent;
    if (parsedPrice > 0 && parseFloat(computedUnitCost) > 0) {
      const uCost = parseFloat(computedUnitCost);
      newMargin = (((parsedPrice - uCost) / uCost) * 100).toFixed(1);
    }

    onChange({
      costUSD: computedUnitCost,
      priceUSD,
      costPerBox,
      packageUnits: val,
      profitMarginPercent: newMargin,
    });
  };

  // Manejar cambio en Costo Unitario directo
  const handleUnitCostChange = (val: string) => {
    const uCost = parseFloat(val) || 0;
    let newPrice = priceUSD;
    let newMargin = profitMarginPercent;

    if (parsedPrice > 0 && uCost > 0) {
      // Recalcular margen en vivo según el precio existente
      newMargin = (((parsedPrice - uCost) / uCost) * 100).toFixed(1);
    } else if (profitMarginPercent && parseFloat(profitMarginPercent) > 0 && uCost > 0) {
      // Si ya hay un margen fijado, recalcular precio de venta
      const margin = parseFloat(profitMarginPercent);
      newPrice = (uCost * (1 + margin / 100)).toFixed(2);
    }

    // Si está en modo caja, ajustar costo de caja
    const units = parseFloat(packageUnits) || 1;
    const newBoxCost = purchaseMode === 'box' ? (uCost * units).toFixed(2) : costPerBox;

    onChange({
      costUSD: val,
      priceUSD: newPrice,
      costPerBox: newBoxCost,
      packageUnits,
      profitMarginPercent: newMargin,
    });
  };

  // Manejar cambio en Precio de Venta directo
  const handleSellingPriceChange = (val: string) => {
    const sPrice = parseFloat(val) || 0;
    let newMargin = '';

    if (parsedCost > 0 && sPrice > 0) {
      const marginCalc = ((sPrice - parsedCost) / parsedCost) * 100;
      newMargin = marginCalc.toFixed(1);
    }

    onChange({
      costUSD,
      priceUSD: val,
      costPerBox,
      packageUnits,
      profitMarginPercent: newMargin,
    });
  };

  // Aplicar un margen de ganancia porcentual (desde chips o input manual)
  const applyProfitMargin = (marginVal: number | string) => {
    const margin = typeof marginVal === 'string' ? parseFloat(marginVal) : marginVal;
    if (isNaN(margin) || parsedCost <= 0) {
      onChange({
        costUSD,
        priceUSD,
        costPerBox,
        packageUnits,
        profitMarginPercent: String(marginVal),
      });
      return;
    }

    const calculatedPrice = (parsedCost * (1 + margin / 100)).toFixed(2);
    onChange({
      costUSD,
      priceUSD: calculatedPrice,
      costPerBox,
      packageUnits,
      profitMarginPercent: String(margin),
    });
  };

  // Cálculos de métricas en vivo
  const netProfitUnit = parsedPrice - parsedCost;
  const netProfitBox = parsedUnits > 1 ? netProfitUnit * parsedUnits : 0;
  const netProfitVES = netProfitUnit * bcvRate;
  const priceVES = parsedPrice * bcvRate;
  const costVES = parsedCost * bcvRate;
  const currentMargin = parsedCost > 0 ? ((parsedPrice - parsedCost) / parsedCost) * 100 : 0;

  const isLoss = parsedCost > 0 && parsedPrice > 0 && parsedPrice < parsedCost;
  const isAtCost = parsedCost > 0 && parsedPrice > 0 && Math.abs(parsedPrice - parsedCost) < 0.001;
  const isProfitable = parsedCost > 0 && parsedPrice > parsedCost;

  const isSky = accentColor === 'sky';

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
      {/* Encabezado con selector de modalidad */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Calculator className={`w-3.5 h-3.5 ${isSky ? 'text-sky-600' : 'text-indigo-600'}`} />
          <span className="text-[11px] uppercase tracking-wide">Calculadora de Costos y Margen</span>
        </div>

        {/* Selector de Modalidad */}
        <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-300 text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => setPurchaseMode('unit')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              purchaseMode === 'unit'
                ? isSky
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Por {unit === 'kg' ? 'Kilo' : unit === 'gr' ? 'Gramo' : 'Unidad'}
          </button>
          <button
            type="button"
            onClick={() => setPurchaseMode('box')}
            className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
              purchaseMode === 'box'
                ? isSky
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3 h-3" />
            <span>Por Caja / Bulto</span>
          </button>
        </div>
      </div>

      {/* Inputs de Costos */}
      {purchaseMode === 'box' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2 rounded-lg border border-slate-200">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
              Costo Caja / Bulto ($):
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
              <input
                type="number"
                step="any"
                placeholder="Ej: 24.00"
                value={costPerBox}
                onChange={(e) => handleBoxCostChange(e.target.value)}
                className="w-full pl-6 pr-2 py-1 bg-white border-2 border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-950 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
              Unidades por Caja:
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Ej: 12"
              value={packageUnits}
              onChange={(e) => handlePackageUnitsChange(e.target.value)}
              className="w-full px-2.5 py-1 bg-white border-2 border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-950 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
              Costo Resultante / Unit:
            </label>
            <div className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-black text-slate-900 flex items-center justify-between">
              <span>{formatUSD(parsedCost)}</span>
              <span className="text-[10px] text-slate-500 font-normal">{formatVES(costVES)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2 rounded-lg border border-slate-200">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
              Costo {unit === 'kg' ? 'por Kg' : unit === 'gr' ? 'por Gr' : 'Unitario'} ($ USD):
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
              <input
                type="number"
                step="any"
                placeholder="Ej: 1.50"
                value={costUSD}
                onChange={(e) => handleUnitCostChange(e.target.value)}
                className="w-full pl-6 pr-2 py-1 bg-white border-2 border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-950 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 font-medium">Equivalente al BCV:</span>
            <span className="text-xs font-mono font-bold text-slate-700">
              {parsedCost > 0 ? formatVES(costVES) : 'Bs. 0,00'}
            </span>
          </div>
        </div>
      )}

      {/* Margen de Ganancia Rápido y Precio de Venta */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
            <Percent className="w-3 h-3 text-emerald-600" />
            <span>Margen de Ganancia Deseado (%):</span>
          </span>
          <span className="text-[9px] text-slate-500">Toca un % o escribe el precio abajo</span>
        </div>

        {/* Chips de Margen Rápido */}
        <div className="flex items-center gap-1 flex-wrap">
          {[15, 20, 25, 30, 35, 50, 100].map((pct) => {
            const isSelected = Math.round(currentMargin) === pct;
            return (
              <button
                key={pct}
                type="button"
                onClick={() => applyProfitMargin(pct)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold font-mono transition-all border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-300'
                }`}
              >
                +{pct}%
              </button>
            );
          })}

          {/* Campo manual de % */}
          <div className="flex items-center bg-white border border-slate-300 rounded px-1.5 py-0.5 focus-within:ring-1 focus-within:ring-emerald-500">
            <input
              type="number"
              step="any"
              placeholder="Otro %"
              value={profitMarginPercent}
              onChange={(e) => applyProfitMargin(e.target.value)}
              className="w-12 text-[11px] font-mono font-bold text-slate-800 outline-none text-right"
            />
            <span className="text-[10px] font-bold text-slate-500 ml-0.5">%</span>
          </div>
        </div>
      </div>

      {/* Precio de Venta Directo */}
      <div className="bg-white p-2 rounded-lg border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
          <div>
            <label className="block text-[11px] font-bold text-slate-800 mb-0.5">
              Precio de Venta al Público ($ USD) *:
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs font-bold">$</span>
              <input
                type="number"
                step="any"
                required
                placeholder="Ej: 2.50"
                value={priceUSD}
                onChange={(e) => handleSellingPriceChange(e.target.value)}
                className={`w-full pl-6 pr-2 py-1.5 border rounded-lg text-sm font-mono font-black text-slate-900 outline-none transition-all ${
                  isLoss
                    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500'
                    : isProfitable
                    ? 'border-emerald-400 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500'
                    : 'border-slate-300 focus:ring-2 focus:ring-sky-500'
                }`}
              />
            </div>
          </div>

          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-center sm:text-left">
            <span className="text-[9px] text-slate-500 font-semibold block uppercase tracking-wider">Precio en Bolívares (BCV):</span>
            <span className="text-xs font-mono font-black text-emerald-700">
              {parsedPrice > 0 ? formatVES(priceVES) : 'Bs. 0,00'}
            </span>
          </div>
        </div>
      </div>

      {/* Panel en Vivo de Ganancia Real y Rentabilidad */}
      {parsedCost > 0 && parsedPrice > 0 && (
        <div
          className={`p-2 rounded-lg border text-[11px] transition-all ${
            isLoss
              ? 'bg-red-50 border-red-200 text-red-900'
              : isAtCost
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <div className="flex items-center gap-1.5">
              {isLoss ? (
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              ) : isAtCost ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
              <div>
                <span className="font-bold">
                  {isLoss
                    ? '⚠️ Vendiendo a pérdida:'
                    : isAtCost
                    ? '⚠️ Venta al costo:'
                    : 'Rentabilidad:'}
                </span>
                <span className="font-mono font-black ml-1 text-xs">
                  {currentMargin >= 0 ? `+${currentMargin.toFixed(1)}%` : `${currentMargin.toFixed(1)}%`}
                </span>
              </div>
            </div>

            {/* Ganancia en Dinero Real */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[9px] opacity-75 block">Ganancia neta / un:</span>
                <span className="font-mono font-black text-xs">
                  {netProfitUnit >= 0 ? `+${formatUSD(netProfitUnit)}` : formatUSD(netProfitUnit)}
                  <span className="text-[10px] font-normal ml-0.5">({formatVES(netProfitVES)})</span>
                </span>
              </div>

              {purchaseMode === 'box' && parsedUnits > 1 && (
                <div className="text-right pl-2 border-l border-emerald-300/60">
                  <span className="text-[9px] opacity-75 block">Caja ({parsedUnits} un.):</span>
                  <span className="font-mono font-black text-xs text-emerald-800">
                    +{formatUSD(netProfitBox)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
