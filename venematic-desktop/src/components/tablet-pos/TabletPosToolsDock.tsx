'use client';

import React from 'react';
import { 
  LayoutGrid, 
  Package, 
  Truck, 
  Printer, 
  Boxes, 
  QrCode, 
  TrendingUp,
  Settings, 
  ArrowLeftRight, 
  RefreshCw,
  Sparkles,
  X 
} from 'lucide-react';

interface TabletPosToolsDockProps {
  isOpen: boolean;
  dockSide: 'left' | 'right';
  totalItems: number;
  onClose: () => void;
  onToggleSide: () => void;
  onOpenInventory: () => void;
  onOpenDrivers: () => void;
  onOpenPrinter: () => void;
  onOpenRubros: () => void;
  onOpenQrMenu: () => void;
  onOpenCart?: () => void;
  onOpenSales?: () => void;
  onOpenDataSync?: () => void;
  onOpenSoftwareUpdate?: () => void;
  onOpenSettings: () => void;
  isLiteMode?: boolean;
}

export const TabletPosToolsDock: React.FC<TabletPosToolsDockProps> = ({
  isOpen,
  dockSide,
  totalItems,
  onClose,
  onToggleSide,
  onOpenInventory,
  onOpenDrivers,
  onOpenPrinter,
  onOpenRubros,
  onOpenQrMenu,
  onOpenCart,
  onOpenSales,
  onOpenDataSync,
  onOpenSoftwareUpdate,
  onOpenSettings,
  isLiteMode = true
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in-95 duration-200 ${
        dockSide === 'left' ? 'left-2.5' : 'right-2.5'
      }`}
    >
      <aside
        className="w-14 rounded-[32px] py-3.5 px-1.5 flex flex-col items-center justify-between shadow-2xl border select-none shrink-0 min-h-[420px] z-50 backdrop-blur-xl transition-all"
        style={{
          backgroundColor: 'rgba(9, 13, 22, 0.82)',
          borderColor: 'rgba(255, 255, 255, 0.16)',
          backdropFilter: 'blur(18px) saturate(180%)',
          WebkitBackdropFilter: 'blur(18px) saturate(180%)',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Top: LayoutGrid Icon / Brand Pill */}
        <div
          onClick={onClose}
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.45)'
          }}
          title="KlikPOS Tools (Cerrar)"
        >
          <LayoutGrid className="w-5 h-5 text-slate-950 font-black stroke-[2.4]" />
        </div>

        {/* Íconos Centrales de Acceso Directo con Contraste AAA y Micro-Fondos */}
        <div className="flex flex-col items-center gap-2.5 my-auto">
          {/* 1. Inventario & Stock */}
          <button
            onClick={() => {
              onClose();
              onOpenInventory();
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-300 bg-emerald-500/25 border border-emerald-400/40 hover:bg-emerald-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
            title="Gestión de Inventario & Stock"
          >
            <Package className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* 2. Motorizados / Despacho (Opcional en Lite) */}
          {!isLiteMode && (
            <button
              onClick={() => {
                onClose();
                onOpenDrivers();
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-300 bg-amber-500/25 border border-amber-400/40 hover:bg-amber-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
              title="Gestión de Motorizados & Despachos"
            >
              <Truck className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}

          {/* 3. Impresora Térmica */}
          <button
            onClick={() => {
              onClose();
              onOpenPrinter();
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sky-300 bg-sky-500/25 border border-sky-400/40 hover:bg-sky-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
            title="Configurar Impresora Térmica"
          >
            <Printer className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* 4. Selector de Rubro de Negocio */}
          <button
            onClick={() => {
              onClose();
              onOpenRubros();
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-purple-300 bg-purple-500/25 border border-purple-400/40 hover:bg-purple-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
            title="Cambiar Rubro Comercial"
          >
            <Boxes className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* 5. QR Menú Interactivo (Opcional en Lite) */}
          {!isLiteMode && (
            <button
              onClick={() => {
                onClose();
                onOpenQrMenu();
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-300 bg-indigo-500/25 border border-indigo-400/40 hover:bg-indigo-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
              title="Generar Menú QR Digital"
            >
              <QrCode className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}

          {/* 6. Módulo de Ventas & Respaldo */}
          <button
            onClick={() => {
              onClose();
              if (onOpenSales) onOpenSales();
              else if (onOpenCart) onOpenCart();
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-300 bg-emerald-500/25 border border-emerald-400/40 hover:bg-emerald-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
            title="Módulo de Ventas & Respaldo (Diario, Semanal, Mensual)"
          >
            <TrendingUp className="w-5 h-5 stroke-[2.4]" />
          </button>

          {/* 7. Sincronizar Data */}
          <button
            onClick={() => {
              onClose();
              if (onOpenDataSync) onOpenDataSync();
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-cyan-300 bg-cyan-500/25 border border-cyan-400/40 hover:bg-cyan-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
            title="Sincronizar Data (Tasa BCV, Ventas & Catálogo Cloud)"
          >
            <RefreshCw className="w-5 h-5 stroke-[2.4]" />
          </button>

          {/* 8. Actualizar Software */}
          <button
            onClick={() => {
              onClose();
              if (onOpenSoftwareUpdate) onOpenSoftwareUpdate();
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-yellow-300 bg-yellow-500/25 border border-yellow-400/40 hover:bg-yellow-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
            title="Actualizar Software (GitHub Release & APK)"
          >
            <Sparkles className="w-5 h-5 stroke-[2.4]" />
          </button>

          {/* 9. Ajustes & Configuración */}
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-100 bg-slate-800/90 border border-slate-600/70 hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
            title="Ajustes de Empresa & RIF"
          >
            <Settings className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Bottom: Alternar Lado (Izq/Der) y Colapsar */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/10 shrink-0 w-full">
          <button
            onClick={onToggleSide}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-amber-300 hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
            title={dockSide === 'left' ? 'Mover Docker a la Derecha' : 'Mover Docker a la Izquierda'}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 active:scale-90 transition-all cursor-pointer"
            title="Minimizar Docker"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </aside>
    </div>
  );
};
