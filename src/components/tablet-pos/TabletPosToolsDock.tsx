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
    <>
      {/* Backdrop para cerrar al tocar fuera */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity"
      />
      <div
        className={`fixed top-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in-95 duration-200 ${
          dockSide === 'left' ? 'left-2.5' : 'right-2.5'
        }`}
      >
        <aside
          className="w-14 rounded-[32px] py-4 px-1.5 flex flex-col items-center justify-between shadow-2xl border select-none shrink-0 min-h-[380px] z-50 backdrop-blur-xl transition-all"
          style={{
            backgroundColor: '#040711',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.98), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.8)'
          }}
        >
          {/* Íconos Centrales de Acceso Directo Vibrantes y de Alto Contraste */}
          <div className="flex flex-col items-center gap-2.5 my-auto">
            {/* 1. Inventario & Stock */}
            <button
              onClick={() => {
                onClose();
                onOpenInventory();
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-emerald-600 border border-emerald-400 hover:bg-emerald-500 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer group"
              title="Gestión de Inventario & Stock"
            >
              <Package className="w-5 h-5 stroke-[2.4]" />
            </button>

            {/* 2. Motorizados / Despacho (Opcional en Lite) */}
            {!isLiteMode && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDrivers();
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-amber-600 border border-amber-400 hover:bg-amber-500 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer group"
                title="Gestión de Motorizados & Despachos"
              >
                <Truck className="w-5 h-5 stroke-[2.4]" />
              </button>
            )}

            {/* 3. Impresora Térmica */}
            <button
              onClick={() => {
                onClose();
                onOpenPrinter();
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-sky-600 border border-sky-400 hover:bg-sky-500 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer group"
              title="Configurar Impresora Térmica"
            >
              <Printer className="w-5 h-5 stroke-[2.4]" />
            </button>

            {/* 4. Selector de Rubro de Negocio */}
            <button
              onClick={() => {
                onClose();
                onOpenRubros();
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-purple-600 border border-purple-400 hover:bg-purple-500 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer group"
              title="Cambiar Rubro Comercial"
            >
              <Boxes className="w-5 h-5 stroke-[2.4]" />
            </button>

            {/* 5. QR Menú Interactivo (Opcional en Lite) */}
            {!isLiteMode && (
              <button
                onClick={() => {
                  onClose();
                  onOpenQrMenu();
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-indigo-600 border border-indigo-400 hover:bg-indigo-500 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer group"
                title="Generar Menú QR Digital"
              >
                <QrCode className="w-5 h-5 stroke-[2.4]" />
              </button>
            )}

            {/* 6. Módulo de Ventas & Respaldo */}
            <button
              onClick={() => {
                onClose();
                if (onOpenSales) onOpenSales();
                else if (onOpenCart) onOpenCart();
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-teal-600 border border-teal-400 hover:bg-teal-500 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer group"
              title="Módulo de Ventas & Respaldo"
            >
              <TrendingUp className="w-5 h-5 stroke-[2.4]" />
            </button>

            {/* 7. Sincronizar Data */}
            <button
              onClick={() => {
                onClose();
                if (onOpenDataSync) onOpenDataSync();
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-cyan-600 border border-cyan-400 hover:bg-cyan-500 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer group"
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
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-amber-500 border border-amber-300 hover:bg-amber-400 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer group"
              title="Actualizar Software (KlikPOS Cloud)"
            >
              <Sparkles className="w-5 h-5 stroke-[2.4]" />
            </button>

            {/* 9. Ajustes & Configuración */}
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-slate-700 border border-slate-500 hover:bg-slate-600 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer group"
              title="Ajustes de Empresa & RIF"
            >
              <Settings className="w-5 h-5 stroke-[2.4]" />
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
              title="Cerrar Docker"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </aside>
      </div>
    </>
  );
};
