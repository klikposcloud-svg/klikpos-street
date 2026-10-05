'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Zap,
  TrendingUp,
  Package,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  DollarSign,
  Gift,
  Flame,
  Clock,
  Printer,
  ShoppingBag,
  Plus,
  Truck,
  QrCode,
  RotateCcw,
  SlidersHorizontal,
  Check
} from 'lucide-react';

interface InteractivePresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPos?: () => void;
  onOpenAmbassador?: () => void;
}

export default function InteractivePresentationModal({
  isOpen,
  onClose,
  onStartPos,
  onOpenAmbassador,
}: InteractivePresentationModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const totalSlides = 6;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlide]);

  if (!isOpen) return null;

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl select-none animate-in fade-in duration-200">
      {/* Contenedor Mockup Teléfono / App Viewport */}
      <div 
        className="relative w-full sm:max-w-[480px] h-full sm:h-[94vh] sm:max-h-[890px] bg-[#070b14] border-0 sm:border border-white/10 sm:rounded-[36px] shadow-2xl flex flex-col justify-between overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Glows de fondo decorativos */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Top Header Barra de Presentación */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between z-10 shrink-0 bg-[#070b14]/85 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="flex items-baseline tracking-tight font-black text-lg">
              <span className="text-white">Klik</span>
              <span className="text-amber-400">POS</span>
            </div>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
              Guía Rápida Street
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">
              {currentSlide + 1} / {totalSlides}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-90 cursor-pointer"
              title="Cerrar presentación"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Contenedor de Láminas / Sliders */}
        <div className="relative flex-1 w-full overflow-y-auto px-5 py-5 z-10 custom-scrollbar flex flex-col justify-between">
          
          {/* SLIDE 1: TU CAJA REGISTRADORA MÓVIL */}
          {currentSlide === 0 && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-black uppercase tracking-wider">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Sin Máquinas Costosas</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                  Una Caja Registradora Inteligente <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-amber-300">en tu Teléfono</span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  Convierte tu celular o tablet en un Punto de Venta profesional. Vende en mostrador o en la calle sin pagar alquileres de máquinas ni comisiones bancarias mensuales.
                </p>
              </div>

              {/* Tarjetas de Beneficio Clave */}
              <div className="space-y-2 my-2">
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Facturación Táctil Ultra-Rápida</h4>
                    <p className="text-[11px] text-slate-400">Diseñado para despachar filas de clientes en segundos con respuesta sonora.</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">100% Autónomo Fuera de Línea</h4>
                    <p className="text-[11px] text-slate-400">Si se va la luz o los datos en la calle, el sistema sigue cobrando sin parar.</p>
                  </div>
                </div>
              </div>

              {/* Botón Acción Rápida */}
              <button
                onClick={nextSlide}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-98 transition-transform cursor-pointer"
              >
                <span>Paso 2: Cómo Agregar y Cobrar</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          )}

          {/* SLIDE 2: CÓMO AGREGAR Y COBRAR CON 1 TOQUE */}
          {currentSlide === 1 && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Flujo de Venta en 2 Pasos</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                  Toca el Producto y <span className="text-amber-400">¡Cobra al Instante!</span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  Hemos eliminado los botones complicados para que cualquiera pueda vender sin capacitación:
                </p>
              </div>

              {/* Simulación Gráfica de Venta */}
              <div className="space-y-2.5 my-1">
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Toca la Tarjeta o el Botón Ámbar (+)</h4>
                      <p className="text-[11px] text-slate-400">Se añade 1 unidad a la comanda y suena la caja registradora (*Ka-Ching!*).</p>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-amber-500/30 flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-bold">🍔 Hamburguesa Especial</span>
                    <span className="text-emerald-400 font-black">$5.00 USD</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Presiona el Botón Flotante "Cobrar"</h4>
                      <p className="text-[11px] text-slate-400">Elige Pago Móvil, Dólares o Efectivo con cálculo de vuelto exacto.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={prevSlide}
                  className="px-4 py-3.5 rounded-2xl bg-slate-800 text-white font-bold text-sm cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-98 transition-transform cursor-pointer"
                >
                  <span>Paso 3: Tasa BCV Oficial</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* SLIDE 3: TASA BCV AUTOMÁTICA EN VIVO */}
          {currentSlide === 2 && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Protección Financiera</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                  Cero Pérdidas por Redondeo con <span className="text-amber-400">Tasa BCV Oficial</span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  KlikPOS sincroniza la tasa oficial del BCV y calcula al instante los montos exactos en Dólares y Bolívares.
                </p>
              </div>

              {/* Tarjeta Visual de Tasa */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 my-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-200">Tasa de Cambio Oficial</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                    AUTOMÁTICA
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-slate-400 text-xs">Total Venta: $10.00 USD</span>
                  <span className="text-emerald-400 font-black text-sm">Cobro Exacto en Bs.</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Toca el botón BCV en la barra superior cuando quieras forzar una actualización o ajustar manualmente una tasa propia de tu zona.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={prevSlide}
                  className="px-4 py-3.5 rounded-2xl bg-slate-800 text-white font-bold text-sm cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-98 transition-transform cursor-pointer"
                >
                  <span>Paso 4: El Docker de Accesos</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* SLIDE 4: MAPA DEL DOCKER FLOTANTE (ACCESOS DIRECTOS EXPLICADOS) */}
          {currentSlide === 3 && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in slide-in-from-right-4 duration-300 space-y-3">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs font-black uppercase tracking-wider">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Tu Barra de Control Táctil</span>
                </div>

                <h2 className="text-2xl font-black text-white leading-tight tracking-tight">
                  ¿Qué hace cada botón del <span className="text-purple-400">Docker Flotante?</span>
                </h2>

                <p className="text-[11.5px] text-slate-300 leading-relaxed font-medium">
                  La cápsula flotante en la pantalla te da acceso instantáneo con 1 toque:
                </p>
              </div>

              {/* Guía Detallada de los Iconos del Docker */}
              <div className="space-y-1.5 max-h-[310px] overflow-y-auto pr-1">
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-black text-white">📦 Inventario & Stock</h5>
                    <p className="text-[10px] text-slate-400 leading-tight">Crea o edita productos, sube fotos desde tu cámara o galería y pon precio en $.</p>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-black text-white">🗃️ Catálogos & Rubros Cloud</h5>
                    <p className="text-[10px] text-slate-400 leading-tight">Importa con 1 solo toque catálogos enteros: Víveres, Comida Rápida, Farmacia.</p>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-black text-white">🖨️ Impresora Térmica</h5>
                    <p className="text-[10px] text-slate-400 leading-tight">Enlaza cualquier impresora térmica portátil por Bluetooth (58mm o 80mm).</p>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-black text-white">🛵 Delivery & Motorizados</h5>
                    <p className="text-[10px] text-slate-400 leading-tight">Asigna despachos y lleva el control de cuentas de motorizados y mesas.</p>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-black text-white">📱 Menú QR Interactivo</h5>
                    <p className="text-[10px] text-slate-400 leading-tight">Tus clientes escanean el código QR en su mesa y ven tu catálogo en su celular.</p>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-black text-white">🔄 Ventas, Cuadre de Caja & Backup</h5>
                    <p className="text-[10px] text-slate-400 leading-tight">Consulta tu balance diario, reimprime tickets y respalda tus datos en la nube.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={prevSlide}
                  className="px-4 py-3 rounded-2xl bg-slate-800 text-white font-bold text-sm cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 active:scale-98 transition-transform cursor-pointer"
                >
                  <span>Paso 5: Recibos por WhatsApp</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* SLIDE 5: RECIBOS POR WHATSAPP & COMANDA */}
          {currentSlide === 4 && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Cero Gasto de Papel</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                  Comprobante Digital a <span className="text-emerald-400">WhatsApp con 1 Toque</span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  Ahorra dinero en rollos térmicos. Al finalizar cualquier cobro, pulsa "Enviar a WhatsApp" y el cliente recibe su recibo con tu logo, RIF y desglose fiscal en su propio teléfono.
                </p>
              </div>

              <div className="space-y-2.5 my-2">
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Ticket Fiscal Digital</h4>
                    <p className="text-[11px] text-slate-400">Detalle exacto de productos, tasa BCV, RIF y número de comprobante.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Comanda Inmediata para Cocina o Despacho</h4>
                    <p className="text-[11px] text-slate-400">Envía el pedido a la barra o cocina para empezar la preparación de inmediato.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={prevSlide}
                  className="px-4 py-3.5 rounded-2xl bg-slate-800 text-white font-bold text-sm cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-98 transition-transform cursor-pointer"
                >
                  <span>Paso 6: Tu Demostración Libre</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* SLIDE 6: TUS 30 MINUTOS LIBRES & ACTIVACIÓN OFICIAL */}
          {currentSlide === 5 && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in slide-in-from-right-4 duration-300 space-y-3">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>¡30 Minutos de Prueba Sin Compromiso!</span>
                </div>

                <h2 className="text-2xl font-black text-white leading-tight tracking-tight">
                  Prueba Todo en tu Negocio <span className="text-emerald-400">Totalmente GRATIS</span>
                </h2>

                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Al pulsar el botón inferior se activarán tus <strong>30 minutos de prueba libre</strong> para cobrar, crear productos y probar en vivo.
                </p>
              </div>

              {/* Comparativa de Planes */}
              <div className="grid grid-cols-2 gap-2 my-1">
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col justify-between">
                  <div>
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-400">Contado Ahorro</span>
                    <h3 className="text-xl font-black text-white mt-0.5">$15 <span className="text-xs font-bold text-slate-400">USD</span></h3>
                    <p className="text-[10px] text-slate-300 mt-0.5">Pago único de por vida (Ahorras $10 sobre $25).</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col justify-between">
                  <div>
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-400">Financiado</span>
                    <h3 className="text-xl font-black text-white mt-0.5">$10 <span className="text-xs font-bold text-slate-400">hoy</span></h3>
                    <p className="text-[10px] text-slate-300 mt-0.5">Comienzas hoy y pagas $15 en 15 días con tus ventas.</p>
                  </div>
                </div>
              </div>

              {/* Caja Viral: Refiere a 3 y es GRATIS */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-sky-500/20 border border-amber-400/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-white">Programa de Referidos & Redes: ¡100% ILIMITADO!</h4>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    Ganas <strong className="text-emerald-400">$5.00 USD por cada negocio referido</strong> (sin límite) y <strong className="text-sky-300">$5 USD al compartir en redes</strong>.
                  </p>
                </div>
              </div>

              {/* Botón Final Gigante */}
              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    if (onStartPos) onStartPos();
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 active:scale-98 transition-transform cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>¡Iniciar mis 30 Minutos y Empezar a Facturar!</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>

                {onOpenAmbassador && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAmbassador();
                    }}
                    className="w-full py-1 text-center text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Ver Planes y Código de Embajador →
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Barra Inferior con Puntos de Navegación */}
        <div className="px-5 py-3.5 border-t border-white/10 flex items-center justify-between z-10 shrink-0 bg-[#070b14]/85 backdrop-blur-md">
          {/* Dots Indicadores */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentSlide === index 
                    ? 'w-6 bg-amber-400 shadow-md shadow-amber-400/40' 
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className={`p-2 rounded-xl border border-white/10 ${
                currentSlide === 0 ? 'opacity-30 cursor-not-allowed text-slate-600' : 'text-white hover:bg-white/10 active:scale-95 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={nextSlide}
              disabled={currentSlide === totalSlides - 1}
              className={`p-2 rounded-xl border border-white/10 ${
                currentSlide === totalSlides - 1 ? 'opacity-30 cursor-not-allowed text-slate-600' : 'text-white hover:bg-white/10 active:scale-95 cursor-pointer'
              }`}
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
