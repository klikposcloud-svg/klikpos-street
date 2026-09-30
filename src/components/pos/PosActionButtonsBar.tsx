'use client';

import React from 'react';
import { LocalCashShift, LocalProduct } from '@/lib/db';
import { WeightReading } from '@/lib/hardware/scale';
import {
  Smartphone,
  QrCode as QrIcon,
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

  if (posViewMode === 'fastfood') {
    return (
      <div className="bg-white dark:bg-[#0e223f] border border-slate-200 dark:border-sky-500/30 rounded-xl px-2.5 py-1.5 shadow-2xs shrink-0 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={onTriggerMobileScanner}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-[11px] font-bold shadow-2xs cursor-pointer shrink-0"
          title="Activar escáner de código de barras en el celular vinculado"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Escanear Móvil</span>
        </button>

        <button
          type="button"
          onClick={onOpenScannerModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-200 cursor-pointer shrink-0"
          title="Vincular celular como escáner inalámbrico"
        >
          <QrIcon className="w-3.5 h-3.5 text-sky-600" />
          <span>Vincular QR</span>
        </button>

        <button
          type="button"
          onClick={onOpenManualWeightModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-200 cursor-pointer shrink-0"
          title="Balanza: Pesar producto"
        >
          <Scale className="w-3.5 h-3.5 text-sky-600" />
          <span>Balanza</span>
        </button>

        <button
          type="button"
          onClick={onKickCashDrawer}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-200 cursor-pointer shrink-0"
          title="Abrir gaveta de dinero (F10)"
        >
          <Banknote className="w-3.5 h-3.5 text-amber-600" />
          <span>Gaveta (F10)</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenCashShiftModal(activeShift ? 'view_x' : 'open')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer shrink-0 border ${
            activeShift
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              : 'bg-amber-500 hover:bg-amber-400 text-white border-amber-400'
          }`}
          title={activeShift ? 'Consultar arqueo o cerrar caja' : 'Fondo de caja'}
        >
          <Banknote className="w-3.5 h-3.5" />
          <span>{activeShift ? `Turno #${activeShift.id}` : 'Abrir Turno'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-200/70 dark:bg-slate-900/80 border border-slate-300/80 dark:border-slate-800 rounded-2xl p-2.5 shadow-2xs shrink-0">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-center">
        {/* 1. Botón Grande: Escanear con Celular */}
        <button
          type="button"
          onClick={onTriggerMobileScanner}
          className="h-14 px-3.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white rounded-xl font-bold flex items-center justify-between gap-2.5 shadow-xs active:scale-[0.98] transition-all cursor-pointer border border-white/20 group"
          title="Activar escáner de código de barras en el celular vinculado"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20 group-hover:bg-white/25 transition-colors">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="2" height="16" fill="currentColor" rx="0.5" />
                <rect x="5.5" y="4" width="1" height="16" fill="currentColor" rx="0.5" />
                <rect x="8" y="4" width="2.5" height="16" fill="currentColor" rx="0.5" />
                <rect x="12" y="4" width="1" height="16" fill="currentColor" rx="0.5" />
                <rect x="14.5" y="4" width="2" height="16" fill="currentColor" rx="0.5" />
                <rect x="18" y="4" width="1.5" height="16" fill="currentColor" rx="0.5" />
                <rect x="21" y="4" width="1" height="16" fill="currentColor" rx="0.5" />
                <line x1="0.5" y1="12" x2="23.5" y2="12" stroke="#ef4444" strokeWidth="2" strokeDasharray="2 1.5" />
              </svg>
            </div>
            <div className="flex flex-col justify-center text-left leading-tight min-w-0">
              <span className="text-xs font-black tracking-tight truncate text-white">Escanear Móvil</span>
              <span className="text-[10px] text-white/90 font-medium truncate">Activar Cámara</span>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 mr-1" />
        </button>

        {/* 2. Botón Grande: Vincular Celular (QR) */}
        <button
          type="button"
          onClick={onOpenScannerModal}
          className={`h-14 px-3.5 rounded-xl font-bold flex items-center gap-2.5 shadow-2xs active:scale-[0.98] transition-all cursor-pointer border ${
            phoneConnected
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-700'
          }`}
          title="Vincular teléfono como escáner inalámbrico con código QR"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            phoneConnected
              ? 'bg-white/20 text-white border-white/30'
              : 'bg-emerald-50 dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-slate-600'
          }`}>
            <Smartphone className={`w-5 h-5 ${phoneConnected ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'}`} />
          </div>
          <div className="flex flex-col justify-center text-left leading-tight min-w-0">
            <span
              className={`text-xs font-black tracking-tight truncate ${phoneConnected ? '!text-white' : 'text-slate-900 dark:text-white'}`}
              style={phoneConnected ? { color: '#ffffff' } : undefined}
            >
              {phoneConnected ? 'Móvil En Línea' : 'Vincular Móvil'}
            </span>
            <span
              className={`text-[10.5px] font-bold truncate ${phoneConnected ? '!text-emerald-100' : 'text-slate-500 dark:text-slate-300'}`}
              style={phoneConnected ? { color: '#d1fae5' } : undefined}
            >
              {phoneConnected ? phoneDeviceName || 'Android POS Móvil' : 'Escanear QR'}
            </span>
          </div>
        </button>

        {/* 3. Botón Grande: Balanza Digital / Manual */}
        <button
          type="button"
          onClick={onOpenManualWeightModal}
          className={`h-14 px-3.5 rounded-xl font-bold flex items-center gap-2.5 shadow-2xs active:scale-[0.98] transition-all cursor-pointer border ${
            scaleConnected || scaleReading.weight > 0
              ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-500 shadow-sm'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-700'
          }`}
          title="Balanza: Clic para pesar producto o ingresar peso manual"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            scaleConnected || scaleReading.weight > 0
              ? 'bg-white/20 text-white border-white/30'
              : 'bg-sky-50 dark:bg-slate-700 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-slate-600'
          }`}>
            <Scale className={`w-5 h-5 ${scaleConnected || scaleReading.weight > 0 ? 'text-white' : 'text-sky-700 dark:text-sky-300'}`} />
          </div>
          <div className="flex flex-col justify-center text-left leading-tight min-w-0">
            <span
              className={`text-xs font-black tracking-tight truncate ${scaleConnected || scaleReading.weight > 0 ? '!text-white' : 'text-slate-900 dark:text-white'}`}
              style={scaleConnected || scaleReading.weight > 0 ? { color: '#ffffff' } : undefined}
            >
              {scaleReading.weight > 0 ? `${scaleReading.weight.toFixed(3)} kg` : 'Balanza (kg)'}
            </span>
            <span
              className={`text-[10.5px] font-bold truncate ${scaleConnected || scaleReading.weight > 0 ? '!text-sky-100' : 'text-slate-500 dark:text-slate-300'}`}
              style={scaleConnected || scaleReading.weight > 0 ? { color: '#e0f2fe' } : undefined}
            >
              {scaleReading.weight > 0 ? 'Peso en vivo' : 'Pesar Producto'}
            </span>
          </div>
        </button>

        {/* 4. Botón Grande: Abrir Gaveta de Dinero (F10) */}
        <button
          type="button"
          onClick={onKickCashDrawer}
          className="h-14 px-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold flex items-center gap-2.5 shadow-2xs active:scale-[0.98] transition-all cursor-pointer border border-slate-200/90 dark:border-slate-700 group"
          title="Abrir gaveta de dinero conectada a la impresora (F10)"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700 group-hover:bg-amber-200 transition-colors">
            <Banknote className="w-5 h-5 text-amber-800 dark:text-amber-300" />
          </div>
          <div className="flex flex-col justify-center text-left leading-tight min-w-0">
            <span className="text-xs font-black tracking-tight truncate text-slate-900 dark:text-white">Gaveta (F10)</span>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-300 font-bold truncate">Abrir Caja</span>
          </div>
        </button>

        {/* 5. Botón Grande: Turno / Caja */}
        <button
          type="button"
          onClick={() => onOpenCashShiftModal(activeShift ? 'view_x' : 'open')}
          className={`h-14 px-3.5 rounded-xl font-bold flex items-center gap-2.5 shadow-2xs active:scale-[0.98] transition-all cursor-pointer border ${
            activeShift
              ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-700'
              : 'bg-amber-500 hover:bg-amber-400 text-white border-amber-400 shadow-sm'
          }`}
          title={activeShift ? 'Gestionar turno, consultar arqueo o cerrar caja' : 'Caja cerrada: Clic para registrar fondo inicial'}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            activeShift
              ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-slate-600'
              : 'bg-white/20 text-white border-white/30'
          }`}>
            <Banknote className={`w-5 h-5 ${activeShift ? 'text-indigo-700 dark:text-indigo-400' : 'text-white'}`} />
          </div>
          <div className="flex flex-col justify-center text-left leading-tight min-w-0">
            <span
              className={`text-xs font-black tracking-tight truncate ${activeShift ? 'text-slate-900 dark:text-white' : '!text-white'}`}
              style={!activeShift ? { color: '#ffffff' } : undefined}
            >
              {activeShift ? `Turno #${activeShift.id}` : 'Abrir Turno'}
            </span>
            <span
              className={`text-[10.5px] font-bold truncate ${activeShift ? 'text-slate-500 dark:text-slate-300' : '!text-amber-100'}`}
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
