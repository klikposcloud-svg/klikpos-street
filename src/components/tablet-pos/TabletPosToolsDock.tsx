'use client';

import React from 'react';
import { 
  Sparkles, 
  Package, 
  Truck, 
  Printer, 
  Boxes, 
  QrCode, 
  ShoppingCart, 
  Settings, 
  ArrowLeftRight, 
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
  onOpenCart: () => void;
  onOpenSettings: () => void;
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
  onOpenSettings
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in-95 duration-200 ${
        dockSide === 'left' ? 'left-2.5' : 'right-2.5'
      }`}
    >
      <aside
        className="w-14 rounded-[30px] py-3.5 px-1.5 flex flex-col items-center justify-between shadow-2xl border select-none shrink-0 min-h-[410px] z-50"
        style={{
          backgroundColor: '#090d16',
          borderColor: 'rgba(255, 255, 255, 0.16)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.12)'
        }}
      >
        {/* Top: Sparkles Icon / Brand Pill */}
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
          }}
          title="KlikPOS Tools"
        >
          <Sparkles className="w-5 h-5 text-slate-950 font-black" />
        </div>

        {/* Íconos Centrales de Acceso Directo con Contraste AAA y Micro-Fondos */}
        <div className="flex flex-col items-center gap-2.5 my-auto">
          {/* 1. Inventario & Stock */}
          <button
            onClick={onOpenInventory}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-400 bg-emerald-500/18 border border-emerald-500/35 hover:bg-emerald-500/30 hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer group"
            title="Gestión de Inventario & Stock"
          >
            <Package className="w-5 h-5" />
          </button>

          {/* 2. Motorizados / Despacho */}
          <button
            onClick={onOpenDrivers}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 bg-amber-500/18 border border-amber-500/35 hover:bg-amber-500/30 hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer group"
            title="Gestión de Motorizados & Despachos"
          >
            <Truck className="w-5 h-5" />
          </button>

          {/* 3. Impresora Térmica */}
          <button
            onClick={onOpenPrinter}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-300 bg-indigo-500/18 border border-indigo-500/35 hover:bg-indigo-500/30 hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer group"
            title="Configurar Impresora Térmica"
          >
            <Printer className="w-5 h-5" />
          </button>

          {/* 4. Selector de Rubro de Negocio */}
          <button
            onClick={onOpenRubros}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-purple-300 bg-purple-500/18 border border-purple-500/35 hover:bg-purple-500/30 hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer group"
            title="Cambiar Rubro Comercial"
          >
            <Boxes className="w-5 h-5" />
          </button>

          {/* 5. QR Menú Interactivo */}
          <button
            onClick={onOpenQrMenu}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sky-300 bg-sky-500/18 border border-sky-500/35 hover:bg-sky-500/30 hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer group"
            title="Generar Menú QR Digital"
          >
            <QrCode className="w-5 h-5" />
          </button>

          {/* 6. Comanda / Ticket Activo */}
          <button
            onClick={onOpenCart}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-300 bg-emerald-500/18 border border-emerald-500/35 hover:bg-emerald-500/30 hover:scale-110 active:scale-95 transition-all shadow-xs relative cursor-pointer group"
            title="Ver Comanda Activa"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md font-mono">
                {totalItems}
              </span>
            )}
          </button>

          {/* 7. Ajustes & Configuración */}
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-100 bg-slate-800/80 border border-slate-700 hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer group"
            title="Ajustes de Empresa & RIF"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom: Alternar Lado (Izq/Der) y Colapsar */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-800 shrink-0 w-full">
          <button
            onClick={onToggleSide}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-amber-300 hover:bg-slate-800/80 active:scale-90 transition-all cursor-pointer"
            title={dockSide === 'left' ? 'Mover Docker a la Derecha' : 'Mover Docker a la Izquierda'}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 active:scale-90 transition-all cursor-pointer"
            title="Minimizar Docker"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </div>
  );
};
