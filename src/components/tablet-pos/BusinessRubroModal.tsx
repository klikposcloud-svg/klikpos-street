'use client';

import React from 'react';
import { Boxes, X } from 'lucide-react';
import { RubroId } from '@/types/tablet-pos';
import { RUBROS_CATALOG } from '@/lib/data/tablet-pos-rubros';

interface BusinessRubroModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  activeRubro: RubroId;
  onSelectRubro: (rubroId: RubroId) => void;
}

export function BusinessRubroModal({
  isOpen,
  onClose,
  isLight,
  activeRubro,
  onSelectRubro,
}: BusinessRubroModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`border rounded-3xl p-5 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                Seleccionar Rubro Comercial
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Adapta categorías y productos de muestra con 1 solo toque
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
          {(Object.keys(RUBROS_CATALOG) as RubroId[]).map((rubroKey) => {
            const r = RUBROS_CATALOG[rubroKey];
            const isSelected = activeRubro === rubroKey;
            return (
              <button
                key={rubroKey}
                type="button"
                onClick={() => onSelectRubro(rubroKey)}
                className={`p-4 rounded-2xl border text-left transition-all active:scale-98 flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10 shadow-md ring-2 ring-purple-500/30'
                    : isLight
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{r.icon}</span>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-600 text-white">
                      Rubro Activo
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    {r.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                    {r.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {r.categories.filter(c => c !== 'Todos').slice(0, 4).map((c) => (
                    <span key={c} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {c}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
