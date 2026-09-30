'use client';

import React from 'react';

interface PosTouchKeypadProps {
  numpadMode: 'qty' | 'barcode' | 'cash';
  onSetNumpadMode: (mode: 'qty' | 'barcode') => void;
  numpadValue: string;
  onNumpadKey: (key: string) => void;
  onNumpadApply: () => void;
}

export default function PosTouchKeypad({
  numpadMode,
  onSetNumpadMode,
  numpadValue,
  onNumpadKey,
  onNumpadApply,
}: PosTouchKeypadProps) {
  return (
    <div className="rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/95 shadow-md p-3 space-y-2 shrink-0">
      {/* Top row: Cantidad | Código | Input */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSetNumpadMode('qty')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-2 ${
            numpadMode === 'qty'
              ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-2xs'
              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          Cantidad
        </button>
        <button
          type="button"
          onClick={() => onSetNumpadMode('barcode')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-2 ${
            numpadMode === 'barcode'
              ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-2xs'
              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          Código
        </button>
        <div className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-500 dark:text-slate-300 font-bold truncate uppercase shadow-2xs">
          {numpadValue ? (
            <span className="text-[var(--brand-primary)] dark:text-emerald-400 font-bold font-mono text-sm">{numpadValue}</span>
          ) : (
            'PRÓXIMO PRODUC...'
          )}
        </div>
      </div>

      {/* Grid de teclas con contornos nítidos y alto contraste táctil */}
      <div className="grid grid-cols-4 gap-1.5">
        {/* Fila 1: 7, 8, 9, Backspace */}
        <button
          type="button"
          onClick={() => onNumpadKey('7')}
          className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center"
        >
          <span className="font-black text-lg">7</span>
        </button>
        <button
          type="button"
          onClick={() => onNumpadKey('8')}
          className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center"
        >
          <span className="font-black text-lg">8</span>
        </button>
        <button
          type="button"
          onClick={() => onNumpadKey('9')}
          className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center"
        >
          <span className="font-black text-lg">9</span>
        </button>
        <button
          type="button"
          onClick={() => onNumpadKey('BACK')}
          className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs flex items-center justify-center cursor-pointer"
          title="Borrar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6-7h12a2 2 0 012 2v10a2 2 0 01-2 2H9l-6-7z" />
          </svg>
        </button>

        {/* Fila 2: 4, 5, 6, C */}
        <button
          type="button"
          onClick={() => onNumpadKey('4')}
          className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center"
        >
          <span className="font-black text-lg">4</span>
        </button>
        <button
          type="button"
          onClick={() => onNumpadKey('5')}
          className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center"
        >
          <span className="font-black text-lg">5</span>
        </button>
        <button
          type="button"
          onClick={() => onNumpadKey('6')}
          className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center"
        >
          <span className="font-black text-lg">6</span>
        </button>
        <button
          type="button"
          onClick={() => onNumpadKey('C')}
          className="h-10 rounded-xl bg-rose-100 hover:bg-rose-200 border-2 border-rose-300 hover:border-rose-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center"
          title="Limpiar"
        >
          <span className="text-rose-700 font-black text-base">C</span>
        </button>

        {/* Fila 3: 1, 2, 3, Enter */}
        <button
          type="button"
          onClick={() => onNumpadKey('1')}
          className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center"
        >
          <span className="font-black text-lg">1</span>
        </button>
        <button
          type="button"
          onClick={() => onNumpadKey('2')}
          className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center"
        >
          <span className="font-black text-lg">2</span>
        </button>
        <button
          type="button"
          onClick={() => onNumpadKey('3')}
          className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center"
        >
          <span className="font-black text-lg">3</span>
        </button>
        <button
          type="button"
          onClick={onNumpadApply}
          className="row-span-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] border-2 border-[var(--brand-primary)] text-white font-bold text-xs flex flex-col items-center justify-center leading-tight transition-all active:scale-95 shadow-xs cursor-pointer p-1"
        >
          <span className="font-black text-sm text-white">Enter</span>
          <span className="text-[10px] text-white/90 font-semibold">Aplicar</span>
        </button>

        {/* Fila 4: 0 (span 2), . */}
        <button
          type="button"
          onClick={() => onNumpadKey('0')}
          className="pos-calc-key col-span-2 h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center"
        >
          <span className="font-black text-lg">0</span>
        </button>
        <button
          type="button"
          onClick={() => onNumpadKey('.')}
          className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center"
        >
          <span className="font-black text-lg">.</span>
        </button>
      </div>
    </div>
  );
}
