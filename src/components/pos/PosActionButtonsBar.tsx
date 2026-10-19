'use client';

import React from 'react';
import { LocalCashShift } from '@/lib/db';
import { WeightReading } from '@/lib/hardware/scale';
import {
  Smartphone,
  Scale,
  Banknote,
} from 'lucide-react';

interface PosActionButtonsBarProps {
  posViewMode: string;
  phoneConnected: boolean;
  phoneDeviceName: string;
  scaleConnected: boolean;
  scaleReading: WeightReading;
  activeShift: LocalCashShift | null;
  onTriggerMobileScanner: () => void;
  onOpenScannerModal: () => void;
  onOpenManualWeightModal: () => void;
  onKickCashDrawer: () => void;
  onOpenCashShiftModal: (mode: 'open' | 'view_x' | 'close') => void;
}

export default function PosActionButtonsBar({
  posViewMode,
  phoneConnected,
  phoneDeviceName,
  scaleConnected,
  scaleReading,
  activeShift,
  onTriggerMobileScanner,
  onOpenScannerModal,
  onOpenManualWeightModal,
  onKickCashDrawer,
  onOpenCashShiftModal,
}: PosActionButtonsBarProps) {
  if (posViewMode === 'touch') return null;

  return (
    <div className="bg-slate-200/50 dark:bg-slate-900/60 border border-slate-300/80 dark:border-slate-800 rounded-lg p-1 shadow-2xs shrink-0">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 items-center">
        {/* 1. Botón Ultra-Compacto: Escanear con Celular */}
        <button
          type="button"
          onClick={onTriggerMobileScanner}
          className="h-7 sm:h-7.5 px-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white rounded-md font-bold flex items-center justify-between gap-1 shadow-2xs active:scale-[0.98] transition-all cursor-pointer border border-white/20 group select-none"
          title="Activar escáner de código de barras en el celular vinculado"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-4.5 h-4.5 rounded bg-white/20 flex items-center justify-center shrink-0 border border-white/25 group-hover:bg-white/30 transition-colors">
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="2" height="16" fill="currentColor" rx="0.5" />
                <rect x="5.5" y="4" width="1" height="16" fill="currentColor" rx="0.5" />
                <rect x="8" y="4" width="2.5" height="16" fill="currentColor" rx="0.5" />
                <rect x="12" y="4" width="1" height="16" fill="currentColor" rx="0.5" />
                <rect x="14.5" y="4" width="2" height="16" fill="currentColor" rx="0.5" />
                <rect x="18" y="4" width="1.5" height="16" fill="currentColor" rx="0.5" />
                <rect x="21" y="4" width="1" height="16" fill="currentColor" rx="0.5" />
                <line x1="0.5" y1="12" x2="23.5" y2="12" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="2 1.5" />
              </svg>
            </div>
            <div className="flex flex-col justify-center text-left leading-none min-w-0">
              <span className="text-[10px] font-black tracking-tight truncate text-white">Escanear Móvil</span>
              <span className="text-[7.5px] text-white/80 font-medium truncate mt-0.5">Cámara</span>
            </div>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        </button>

        {/* 2. Botón Ultra-Compacto: Vincular Celular (QR) */}
        <button
          type="button"
          onClick={onOpenScannerModal}
          className={`h-7 sm:h-7.5 px-2 rounded-md font-bold flex items-center gap-1.5 shadow-2xs active:scale-[0.98] transition-all cursor-pointer border select-none ${
            phoneConnected
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-xs'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
          }`}
          title="Vincular teléfono como escáner inalámbrico con código QR"
        >
          <div className={`w-4.5 h-4.5 rounded flex items-center justify-center shrink-0 border ${
            phoneConnected
              ? 'bg-white/20 text-white border-white/30'
              : 'bg-emerald-50 dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-slate-600'
          }`}>
            <Smartphone className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${phoneConnected ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'}`} />
          </div>
          <div className="flex flex-col justify-center text-left leading-none min-w-0">
            <span
              className={`text-[10px] font-black tracking-tight truncate ${phoneConnected ? '!text-white' : 'text-slate-900 dark:text-white'}`}
              style={phoneConnected ? { color: '#ffffff' } : undefined}
            >
              {phoneConnected ? 'Móvil Conectado' : 'Vincular Móvil'}
            </span>
            <span
              className={`text-[7.5px] font-semibold truncate mt-0.5 ${phoneConnected ? '!text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}
              style={phoneConnected ? { color: '#d1fae5' } : undefined}
            >
              {phoneConnected ? phoneDeviceName || 'Android POS' : 'Escanear QR'}
            </span>
          </div>
        </button>

        {/* 3. Botón Ultra-Compacto: Balanza Digital / Manual */}
        <button
          type="button"
          onClick={onOpenManualWeightModal}
          className={`h-7 sm:h-7.5 px-2 rounded-md font-bold flex items-center gap-1.5 shadow-2xs active:scale-[0.98] transition-all cursor-pointer border select-none ${
            scaleConnected || scaleReading.weight > 0
              ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-500 shadow-xs'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
          }`}
          title="Balanza: Clic para pesar producto o ingresar peso manual"
        >
          <div className="w-4.5 h-4.5 rounded flex items-center justify-center shrink-0 border bg-sky-50 dark:bg-white/20 text-sky-700 dark:text-white border-sky-200 dark:border-white/30">
            <Scale className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-700 dark:text-white" />
          </div>
          <div className="flex flex-col justify-center text-left leading-none min-w-0">
            <span
              className={`text-[10px] font-black tracking-tight truncate ${scaleConnected || scaleReading.weight > 0 ? '!text-white' : 'text-slate-900 dark:text-white'}`}
            >
              {scaleReading.weight > 0 ? `${scaleReading.weight.toFixed(3)} kg` : 'Balanza (kg)'}
            </span>
            <span
              className={`text-[7.5px] font-semibold truncate mt-0.5 ${scaleConnected || scaleReading.weight > 0 ? '!text-sky-100' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {scaleReading.weight > 0 ? 'Peso activo' : 'Pesar'}
            </span>
          </div>
        </button>

        {/* 4. Botón Ultra-Compacto: Abrir Gaveta de Dinero (F10) */}
        <button
          type="button"
          onClick={onKickCashDrawer}
          className="h-7 sm:h-7.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-md font-bold flex items-center gap-1.5 shadow-2xs active:scale-[0.98] transition-all cursor-pointer border border-slate-200 dark:border-slate-700 group select-none"
          title="Abrir gaveta de dinero conectada a la impresora (F10)"
        >
          <div className="w-4.5 h-4.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700 group-hover:bg-amber-200 transition-colors">
            <Banknote className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-800 dark:text-amber-300" />
          </div>
          <div className="flex flex-col justify-center text-left leading-none min-w-0">
            <span className="text-[10px] font-black tracking-tight truncate text-slate-900 dark:text-white">Gaveta (F10)</span>
            <span className="text-[7.5px] text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5">Abrir Caja</span>
          </div>
        </button>

        {/* 5. Botón Ultra-Compacto: Turno / Caja */}
        <button
          type="button"
          onClick={() => onOpenCashShiftModal(activeShift ? 'view_x' : 'open')}
          className={`h-7 sm:h-7.5 px-2 rounded-md font-bold flex items-center gap-1.5 shadow-2xs active:scale-[0.98] transition-all cursor-pointer border select-none ${
            activeShift
              ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
              : 'bg-amber-500 hover:bg-amber-400 text-white border-amber-400 shadow-xs'
          }`}
          title={activeShift ? 'Gestionar turno, consultar arqueo o cerrar caja' : 'Caja cerrada: Clic para registrar fondo inicial'}
        >
          <div className={`w-4.5 h-4.5 rounded flex items-center justify-center shrink-0 border ${
            activeShift
              ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-slate-600'
              : 'bg-white/20 text-white border-white/30'
          }`}>
            <Banknote className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${activeShift ? 'text-indigo-700 dark:text-indigo-400' : 'text-white'}`} />
          </div>
          <div className="flex flex-col justify-center text-left leading-none min-w-0">
            <span
              className={`text-[10px] font-black tracking-tight truncate ${activeShift ? 'text-slate-900 dark:text-white' : '!text-white'}`}
              style={!activeShift ? { color: '#ffffff' } : undefined}
            >
              {activeShift ? `Turno #${activeShift.id}` : 'Abrir Turno'}
            </span>
            <span
              className={`text-[7.5px] font-semibold truncate mt-0.5 ${activeShift ? 'text-slate-500 dark:text-slate-400' : '!text-amber-100'}`}
              style={!activeShift ? { color: '#fef3c7' } : undefined}
            >
              {activeShift ? 'Arqueo / Cierre' : 'Fondo de Caja'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
