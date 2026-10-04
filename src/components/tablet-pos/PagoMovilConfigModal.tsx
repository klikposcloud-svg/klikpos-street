'use client';

import React from 'react';
import { Phone, X } from 'lucide-react';
import { PagoMovilInfo } from '@/types/tablet-pos';
import { VENEZUELAN_BANKS } from '@/lib/data/tablet-pos-rubros';

interface PagoMovilConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  pagoMovilInfo: PagoMovilInfo;
  setPagoMovilInfo: React.Dispatch<React.SetStateAction<PagoMovilInfo>>;
  onSave: (e: React.FormEvent) => void;
}

export function PagoMovilConfigModal({
  isOpen,
  onClose,
  isLight,
  pagoMovilInfo,
  setPagoMovilInfo,
  onSave,
}: PagoMovilConfigModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`border rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl relative ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 active:scale-90 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
            Configurar Datos de Pago Móvil
          </h3>
        </div>

        <form onSubmit={onSave} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Banco Receptor:
            </label>
            <select
              value={pagoMovilInfo.bank}
              onChange={(e) => setPagoMovilInfo({ ...pagoMovilInfo, bank: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
              }`}
            >
              {VENEZUELAN_BANKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Teléfono Pago Móvil:
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 04248298026"
                value={pagoMovilInfo.phone}
                onChange={(e) => setPagoMovilInfo({ ...pagoMovilInfo, phone: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Cédula / RIF Titular:
              </label>
              <input
                type="text"
                required
                placeholder="Ej: V-20123456"
                value={pagoMovilInfo.idDoc}
                onChange={(e) => setPagoMovilInfo({ ...pagoMovilInfo, idDoc: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Nombre del Titular de la Cuenta:
            </label>
            <input
              type="text"
              required
              placeholder="Nombre o Razón Social registrada en el banco"
              value={pagoMovilInfo.ownerName}
              onChange={(e) => setPagoMovilInfo({ ...pagoMovilInfo, ownerName: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
              }`}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all bg-emerald-600 hover:bg-emerald-500 mt-2 cursor-pointer"
          >
            Guardar Datos de Pago Móvil
          </button>
        </form>
      </div>
    </div>
  );
}
