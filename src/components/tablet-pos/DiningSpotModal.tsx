'use client';

import React from 'react';
import { X } from 'lucide-react';

interface DiningSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  primaryColor: string;
  newSpotName: string;
  setNewSpotName: (name: string) => void;
  newSpotType: 'mesa' | 'barra' | 'llevar';
  setNewSpotType: (type: 'mesa' | 'barra' | 'llevar') => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function DiningSpotModal({
  isOpen,
  onClose,
  isLight,
  primaryColor,
  newSpotName,
  setNewSpotName,
  newSpotType,
  setNewSpotType,
  onSubmit,
}: DiningSpotModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`border rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 active:scale-90 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
          + Crear Nueva Mesa o Cuenta de Barra
        </h3>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Nombre o Identificador:
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Mesa 5, Barra Terraza, VIP..."
              value={newSpotName}
              onChange={(e) => setNewSpotName(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Tipo de Ubicación:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['mesa', 'barra', 'llevar'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewSpotType(t)}
                  className={`py-1.5 rounded-xl text-xs font-bold capitalize border active:scale-95 cursor-pointer ${
                    newSpotType === t
                      ? 'border-2 font-black'
                      : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                  style={{
                    borderColor: newSpotType === t ? primaryColor : undefined,
                    color: newSpotType === t ? primaryColor : undefined,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all mt-2 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            Crear Mesa
          </button>
        </form>
      </div>
    </div>
  );
}
