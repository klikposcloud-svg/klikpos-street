'use client';

import React from 'react';
import { Building, X } from 'lucide-react';
import { CompanyInfo } from '@/types/tablet-pos';

interface CompanyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  primaryColor: string;
  companyInfo: CompanyInfo;
  setCompanyInfo: React.Dispatch<React.SetStateAction<CompanyInfo>>;
  onSave: (e: React.FormEvent) => void;
}

export function CompanyConfigModal({
  isOpen,
  onClose,
  isLight,
  primaryColor,
  companyInfo,
  setCompanyInfo,
  onSave,
}: CompanyConfigModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`border rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl relative ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Building className="w-5 h-5" style={{ color: primaryColor }} />
          <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
            Datos de la Empresa y Tickets
          </h3>
        </div>

        <form onSubmit={onSave} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Nombre Comercial / Razón Social:
            </label>
            <input
              type="text"
              required
              value={companyInfo.name}
              onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                RIF / Identificación Fiscal:
              </label>
              <input
                type="text"
                required
                value={companyInfo.rif}
                onChange={(e) => setCompanyInfo({ ...companyInfo, rif: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Teléfono del Negocio:
              </label>
              <input
                type="text"
                required
                value={companyInfo.phone}
                onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Dirección Física del Establecimiento:
            </label>
            <input
              type="text"
              required
              value={companyInfo.address}
              onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Mensaje al Pie del Recibo:
            </label>
            <input
              type="text"
              value={companyInfo.footerMsg}
              onChange={(e) => setCompanyInfo({ ...companyInfo, footerMsg: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
              }`}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all mt-2 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            Guardar Datos de Empresa
          </button>
        </form>
      </div>
    </div>
  );
}
