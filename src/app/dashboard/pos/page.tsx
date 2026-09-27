'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db, LocalProduct, SaleItem, LocalSale, SalePayment } from '@/lib/db';
import { formatUSD, formatVES } from '@/lib/formatters';
import { initializeDatabaseIfNeeded } from '@/lib/seed-data';
import { soundEffects } from '@/lib/utils/sound';
import QRCode from 'qrcode';
import {
  Image as ImageIcon,
  Smartphone,
  Package,
  Wifi,
  QrCode as QrIcon,
  Check,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Scale,
  Banknote,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Zap,
  UtensilsCrossed,
  Coffee,
  Croissant,
  ShoppingBag,
  Milk,
  Beef,
  Apple,
  Gift,
  Wine,
  Cake,
  Pizza,
  Cookie,
  CupSoda,
  Sandwich,
  ShieldAlert,
  ShieldCheck,
  Palette,
} from 'lucide-react';
import { scaleService, WeightReading } from '@/lib/hardware/scale';
import { kickCashDrawer } from '@/lib/hardware/cash-drawer';
import { LocalCustomer, LocalCashShift } from '@/lib/db';
import ManualWeightModal from '@/components/ManualWeightModal';
import CashShiftModal from '@/components/CashShiftModal';
import { parseScaleBarcode, findProductByScalePLU } from '@/lib/hardware/scale-barcode';
import { pagoMovilMonitor, PagoMovilConfirmation } from '@/lib/payments/pago-movil-gmail-monitor';
import PosQuickAccessSettings from '@/components/PosQuickAccessSettings';
import { SYSTEM_DEFAULTS } from '@/lib/constants/defaults';

interface CartItem extends SaleItem {
  stock: number;
}

// Helpers para íconos y colores por rubro (Imágenes 1 y 2)
const getCategoryEmoji = (category: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('carne') || cat.includes('pollo') || cat.includes('res') || cat.includes('cerdo')) return '🍅';
  if (cat.includes('bebida') || cat.includes('refresco') || cat.includes('jugo') || cat.includes('agua')) return '🥤';
  if (cat.includes('lacteo') || cat.includes('queso') || cat.includes('leche')) return '🧀';
  if (cat.includes('fruta') || cat.includes('verdura') || cat.includes('legumbre')) return '🥑';
  if (cat.includes('pan') || cat.includes('panaderia') || cat.includes('dulce')) return '🥖';
  if (cat.includes('snack') || cat.includes('golosina') || cat.includes('galleta')) return '🍿';
  if (cat.includes('viveres') || cat.includes('grano') || cat.includes('arroz') || cat.includes('pasta')) return '🌾';
  if (cat.includes('limpieza') || cat.includes('higiene') || cat.includes('aseo')) return '🧼';
  if (cat.includes('licor') || cat.includes('cerveza') || cat.includes('vino')) return '🍺';
  if (cat.includes('charcuteria') || cat.includes('embutido')) return '🥓';
  return '📦';
};

const getCategoryBadgeColor = (category: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('carne') || cat.includes('pollo') || cat.includes('res') || cat.includes('cerdo')) return 'bg-rose-600 dark:bg-rose-700';
  if (cat.includes('bebida') || cat.includes('refresco') || cat.includes('jugo')) return 'bg-blue-600 dark:bg-blue-700';
  if (cat.includes('lacteo') || cat.includes('queso') || cat.includes('leche')) return 'bg-amber-600 dark:bg-amber-700';
  if (cat.includes('fruta') || cat.includes('verdura') || cat.includes('legumbre')) return 'bg-emerald-600 dark:bg-emerald-700';
  if (cat.includes('pan') || cat.includes('panaderia')) return 'bg-orange-600 dark:bg-orange-700';
  if (cat.includes('snack') || cat.includes('golosina')) return 'bg-purple-600 dark:bg-purple-700';
  if (cat.includes('viveres') || cat.includes('grano')) return 'bg-teal-700 dark:bg-teal-800';
  if (cat.includes('limpieza') || cat.includes('higiene')) return 'bg-cyan-700 dark:bg-cyan-800';
  if (cat.includes('licor') || cat.includes('cerveza')) return 'bg-indigo-700 dark:bg-indigo-800';
  return 'bg-[#0e4f5a]';
};

const getProductVectorIcon = (p: LocalProduct) => {
  const text = `${p.category || ''} ${p.name || ''}`.toLowerCase();
  if (text.includes('café') || text.includes('cafe') || text.includes('espresso') || text.includes('latte') || text.includes('cappuccino')) {
    return <Coffee className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />;
  }
  if (text.includes('pan') || text.includes('croissant') || text.includes('bakery') || text.includes('hojaldre') || text.includes('pastel')) {
    return <Croissant className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />;
  }
  if (text.includes('torta') || text.includes('dulce') || text.includes('postre') || text.includes('cake') || text.includes('pie')) {
    return <Cake className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />;
  }
  if (text.includes('galleta') || text.includes('cookie') || text.includes('snack') || text.includes('dorito') || text.includes('papita')) {
    return <Cookie className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />;
  }
  if (text.includes('pizza') || text.includes('calzone')) {
    return <Pizza className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />;
  }
  if (text.includes('sandwich') || text.includes('hamburguesa') || text.includes('burger') || text.includes('arepa') || text.includes('pepito')) {
    return <Sandwich className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />;
  }
  if (text.includes('leche') || text.includes('lacteo') || text.includes('queso') || text.includes('yogurt') || text.includes('milk') || text.includes('mantequilla')) {
    return <Milk className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />;
  }
  if (text.includes('carne') || text.includes('pollo') || text.includes('res') || text.includes('cerdo') || text.includes('beef') || text.includes('chuleta') || text.includes('bistec')) {
    return <Beef className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />;
  }
  if (text.includes('fruta') || text.includes('manzana') || text.includes('verdura') || text.includes('vegetal') || text.includes('apple') || text.includes('tomate')) {
    return <Apple className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />;
  }
  if (text.includes('bebida') || text.includes('refresco') || text.includes('jugo') || text.includes('soda') || text.includes('malta') || text.includes('agua') || text.includes('pepsi') || text.includes('coca')) {
    return <CupSoda className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />;
  }
  if (text.includes('licor') || text.includes('vino') || text.includes('cerveza') || text.includes('ron') || text.includes('whisky') || text.includes('polar')) {
    return <Wine className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />;
  }
  if (text.includes('regalo') || text.includes('promo') || text.includes('combo') || text.includes('pack')) {
    return <Gift className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />;
  }
  if (text.includes('viveres') || text.includes('mercado') || text.includes('arroz') || text.includes('harina') || text.includes('pasta') || text.includes('aceite')) {
    return <ShoppingBag className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />;
  }
  return <Package className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />;
};

// Íconos Alternados entre Fill (Sólido) y Outline (Línea) idénticos a la imagen de referencia
const getProductIconAlternated = (p: LocalProduct, isOutline: boolean) => {
  const text = `${p.category || ''} ${p.name || ''}`.toLowerCase();

  // 1. Café / Espresso / Té
  if (text.includes('café') || text.includes('cafe') || text.includes('espresso') || text.includes('latte') || text.includes('cappuccino')) {
    if (isOutline) {
      return (
        <svg className="w-12 h-12 text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" y1="2" x2="6" y2="4" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
      );
    }
    return (
      <svg className="w-12 h-12 fill-current text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24">
        <path d="M4 19h16v2H4z" />
        <path d="M20 8h-2V5H4v9c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-1h2c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 4h-2v-2h2v2z" />
        <path d="M7 2h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
      </svg>
    );
  }

  // 2. Panadería / Croissant / Bakery
  if (text.includes('pan') || text.includes('croissant') || text.includes('bakery') || text.includes('hojaldre') || text.includes('pastel')) {
    if (isOutline) {
      return (
        <svg className="w-12 h-12 text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4.6 13.4 4.8 4.8a2 2 0 0 0 2.8 0l7-7a6 6 0 0 0-8.5-8.5l-7 7a2 2 0 0 0 0 2.8z" />
          <path d="m8.5 8.5 7 7" />
          <path d="m11 5 7 7" />
          <path d="m6 10 7 7" />
        </svg>
      );
    }
    return (
      <svg className="w-12 h-12 fill-current text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24">
        <path d="M12 4c-4.42 0-8 3.58-8 8 0 1.66.51 3.2 1.38 4.49L3 18.5c-.55.55-.55 1.45 0 2 .55.55 1.45.55 2 0l2.01-2.01C8.29 19.36 10.05 20 12 20s3.71-.64 4.99-1.51L19 20.5c.55.55 1.45.55 2 0 .55-.55.55-1.45 0-2l-2.38-2.01C19.49 15.2 20 13.66 20 12c0-4.42-3.58-8-8-8zm-2 3c.73 0 1.43.14 2.08.38l-1.04 2.08c-.34-.09-.69-.14-1.04-.14-.73 0-1.42.17-2.04.47L7 7.75C7.9 7.28 8.92 7 10 7zm4 0c1.08 0 2.1.28 3 .75l-.96 2.04c-.62-.3-1.31-.47-2.04-.47-.35 0-.7.05-1.04.14L12.92 7.38C13.57 7.14 14.27 7 15 7z" />
      </svg>
    );
  }

  // 3. Postres / Dulces / Delicates
  if (text.includes('torta') || text.includes('dulce') || text.includes('postre') || text.includes('cake') || text.includes('delicate') || text.includes('pie')) {
    if (isOutline) {
      return (
        <svg className="w-12 h-12 text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
          <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
          <path d="M2 21h20" />
          <path d="M7 8v2" />
          <path d="M12 8v2" />
          <path d="M17 8v2" />
          <path d="M7 4h.01" />
          <path d="M12 4h.01" />
          <path d="M17 4h.01" />
        </svg>
      );
    }
    return (
      <svg className="w-12 h-12 fill-current text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24">
        <path d="M12 2c-1.1 0-2 .9-2 2 0 .19.03.37.08.54C7.72 5.3 6 7.42 6 10c0 .34.03.67.1 1H5c-1.1 0-2 .9-2 2v1h18v-1c0-1.1-.9-2-2-2h-1.1c.07-.33.1-.66.1-1 0-2.58-1.72-4.7-4.08-5.46.05-.17.08-.35.08-.54 0-1.1-.9-2-2-2zm-7 13v5c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-5H5z" />
      </svg>
    );
  }

  // 4. Bolsa de Compras / Goods / Shopping
  if (text.includes('goods') || text.includes('shopping') || text.includes('viveres') || text.includes('mercado') || text.includes('arroz') || text.includes('harina')) {
    if (isOutline) {
      return (
        <svg className="w-12 h-12 text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    }
    return (
      <svg className="w-12 h-12 fill-current text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24">
        <path d="M16 6V4c0-2.21-1.79-4-4-4S8 1.79 8 4v2H3c-1.1 0-2 .9-2 2l1.6 13.6c.12 1.05 1.01 1.85 2.07 1.85h14.66c1.06 0 1.95-.8 2.07-1.85L23 8c0-1.1-.9-2-2-2h-5zm-6-2c0-1.1.9-2 2-2s2 .9 2 2v2h-4V4zm8 16H6L4.71 8H8v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h3.29L18 20z" />
      </svg>
    );
  }

  // 5. Regalo / Stors / Promos
  if (text.includes('regalo') || text.includes('promo') || text.includes('combo') || text.includes('pack') || text.includes('stors')) {
    if (isOutline) {
      return (
        <svg className="w-12 h-12 text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 12 20 22 4 22 4 12" />
          <rect width="20" height="5" x="2" y="7" />
          <line x1="12" y1="22" x2="12" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      );
    }
    return (
      <svg className="w-12 h-12 fill-current text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24">
        <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.65-.5-.65C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1h-2V5c0-.55.45-1 1-1zm-6 0c.55 0 1 .45 1 1v1H8c-.55 0-1-.45-1-1s.45-1 1-1zm11 15H4v-2h16v2zm0-4H4V8h5.08L7 10.83 8.62 12 11 8.76V15h2V8.76L15.38 12 17 10.83 14.92 8H20v7z" />
      </svg>
    );
  }

  // 6. Lácteos / Leche / Queso
  if (text.includes('leche') || text.includes('lacteo') || text.includes('queso') || text.includes('mantequilla')) {
    if (isOutline) {
      return (
        <svg className="w-12 h-12 text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2h8" />
          <path d="M9 2v3a4 4 0 0 1-.8 2.4L6 10.4A4 4 0 0 0 5 13v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a4 4 0 0 0-1-2.6l-2.2-3A4 4 0 0 1 15 5V2" />
        </svg>
      );
    }
    return (
      <svg className="w-12 h-12 fill-current text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24">
        <path d="M9 2h6v2H9zm9 7.5V6H6v3.5l2 2V21c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-9.5l2-2zM14 20h-4v-7h4v7zm-2-9l-1-1V8h2v2l-1 1z" />
      </svg>
    );
  }

  // 7. Carnes / Pollo / Charcutería
  if (text.includes('carne') || text.includes('pollo') || text.includes('res') || text.includes('cerdo') || text.includes('chuleta') || text.includes('jamon') || text.includes('jamón')) {
    if (isOutline) {
      return (
        <svg className="w-12 h-12 text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12.5" cy="8.5" r="2.5" />
          <path d="M12.5 2a6.5 6.5 0 0 0-6.22 4.6c-1.1 3.13-.07 6.57 2.37 8.66A8 8 0 1 0 19 8.5h-6.5" />
        </svg>
      );
    }
    return (
      <svg className="w-12 h-12 fill-current text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24">
        <path d="M19.43 12.98c-.1-.4-.25-.79-.43-1.15-1.42-2.84-4.83-4.14-7.85-2.99l-2.02.77c-.52.2-1.09.2-1.61 0l-2.02-.77C3.12 7.9 1.48 10.9 2.06 13.56c.55 2.53 2.7 4.44 5.3 4.44 1.13 0 2.22-.36 3.12-1.04l1.52-1.14 1.52 1.14c.9.68 1.99 1.04 3.12 1.04 2.6 0 4.75-1.91 5.3-4.44.1-.47.11-.94.07-1.41zM8 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
      </svg>
    );
  }

  // 8. Frutas / Manzanas / Vegetales
  if (text.includes('fruta') || text.includes('manzana') || text.includes('verdura') || text.includes('vegetal') || text.includes('apple')) {
    if (isOutline) {
      return (
        <svg className="w-12 h-12 text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
          <path d="M10 2c1 .5 2 2 2 5" />
        </svg>
      );
    }
    return (
      <svg className="w-12 h-12 fill-current text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.29c.62-.75 1.04-1.8 1.01-2.29-.9.04-1.98.6-2.61 1.34-.56.64-1.05 1.69-.92 2.68.99.08 1.9-.98 2.52-1.73z" />
      </svg>
    );
  }

  // Fallback: Paquete / Caja
  if (isOutline) {
    return (
      <svg className="w-12 h-12 text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v8.42a1.78 1.78 0 0 0 .89 1.54l8.96 5.16a1.78 1.78 0 0 0 2.5-1.55V10.94a1.78 1.78 0 0 0-.9-1.54Z" />
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    );
  }
  return (
    <svg className="w-12 h-12 fill-current text-[#1e293b] dark:text-slate-100" viewBox="0 0 24 24">
      <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15z" />
    </svg>
  );
};

// Contrastes suaves con cambio de tonalidades (Por Categoría/Rubro o Monocromático)
const getCardToneClasses = (p: LocalProduct, index: number, paletteMode: 'category' | 'mono' = 'category') => {
  // 1. Si el producto tiene un color personalizado asignado en db (p.color), se respeta
  if ((p as any).color) {
    return 'shadow-2xs border-2 border-slate-300 dark:border-slate-600';
  }

  // 2. Si el usuario seleccionó la paleta monocromática clásica de la referencia
  if (paletteMode === 'mono') {
    const mod = index % 3;
    if (mod === 0) {
      return 'bg-white text-slate-900 border-2 border-slate-300 dark:border-slate-500 shadow-sm';
    } else if (mod === 1) {
      return 'bg-[#dce3ec] dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-2 border-[#9cb1c5] dark:border-slate-500 shadow-2xs';
    } else {
      return 'bg-[#d4dfea] dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border-2 border-[#93a9be] dark:border-slate-500 shadow-2xs';
    }
  }

  // 3. Paleta Inteligente por Rubro / Categoría (Pasteles suaves con alto contraste)
  const text = `${p.category || ''} ${p.name || ''}`.toLowerCase();

  // Carnes, Pollo, Res, Cerdo -> Rosado / Salmón suave
  if (text.includes('carne') || text.includes('pollo') || text.includes('res') || text.includes('cerdo') || text.includes('meat') || text.includes('chuleta')) {
    return 'bg-[#ffe4e6] dark:bg-[#33181d] text-slate-950 dark:text-rose-100 border-2 border-[#fecdd3] dark:border-[#632a35] hover:border-[#fb7185] dark:hover:border-[#993e50] shadow-2xs';
  }

  // Charcutería, Jamón, Embutidos -> Rosa orquídea suave
  if (text.includes('charcuter') || text.includes('jamon') || text.includes('jamón') || text.includes('salchicha') || text.includes('tocineta')) {
    return 'bg-[#fce7f3] dark:bg-[#311728] text-slate-950 dark:text-pink-100 border-2 border-[#fbcfe8] dark:border-[#5f284e] hover:border-[#f472b6] dark:hover:border-[#943b78] shadow-2xs';
  }

  // Lácteos, Leche, Quesos, Mantequilla -> Celeste cielo suave
  if (text.includes('lacteo') || text.includes('lácteo') || text.includes('leche') || text.includes('queso') || text.includes('mantequilla') || text.includes('dairy')) {
    return 'bg-[#e0f2fe] dark:bg-[#142638] text-slate-950 dark:text-sky-100 border-2 border-[#bae6fd] dark:border-[#22486b] hover:border-[#38bdf8] dark:hover:border-[#3874aa] shadow-2xs';
  }

  // Frutas, Verduras, Hortalizas, Vegetales, Produce -> Menta fresca suave
  if (text.includes('fruta') || text.includes('verdura') || text.includes('hortaliza') || text.includes('vegetal') || text.includes('produce') || text.includes('manzana') || text.includes('papa')) {
    return 'bg-[#dcfce7] dark:bg-[#132c1c] text-slate-950 dark:text-emerald-100 border-2 border-[#bbf7d0] dark:border-[#205232] hover:border-[#4ade80] dark:hover:border-[#338150] shadow-2xs';
  }

  // Café, Té, Espresso, Desayuno -> Moca cálido / Trigo suave
  if (text.includes('café') || text.includes('cafe') || text.includes('espresso') || text.includes('te') || text.includes('té') || text.includes('latte')) {
    return 'bg-[#f5ede4] dark:bg-[#2e231c] text-slate-950 dark:text-amber-100 border-2 border-[#d6c5b3] dark:border-[#5a4332] hover:border-[#bca48d] dark:hover:border-[#8c6b50] shadow-2xs';
  }

  // Panadería, Repostería, Dulces, Cakes, Croissants -> Ámbar dorado suave
  if (text.includes('pan') || text.includes('croissant') || text.includes('bakery') || text.includes('torta') || text.includes('cake') || text.includes('dulce') || text.includes('postre')) {
    return 'bg-[#fef3c7] dark:bg-[#2d2210] text-slate-950 dark:text-amber-100 border-2 border-[#fcd34d] dark:border-[#5c4418] hover:border-[#f59e0b] dark:hover:border-[#966f28] shadow-2xs';
  }

  // Víveres, Abarrotes, Despensa, Harina, Arroz, Granos -> Vainilla cálida suave
  if (text.includes('viveres') || text.includes('víveres') || text.includes('arroz') || text.includes('harina') || text.includes('pasta') || text.includes('aceite') || text.includes('grano')) {
    return 'bg-[#fef9c3] dark:bg-[#292614] text-slate-950 dark:text-yellow-100 border-2 border-[#fde047] dark:border-[#4d4822] hover:border-[#eab308] dark:hover:border-[#7a7235] shadow-2xs';
  }

  // Bebidas, Refrescos, Jugos, Aguas -> Aqua / Turquesa suave
  if (text.includes('bebida') || text.includes('refresco') || text.includes('jugo') || text.includes('agua') || text.includes('soda') || text.includes('beverage')) {
    return 'bg-[#ccfbf1] dark:bg-[#102b28] text-slate-950 dark:text-teal-100 border-2 border-[#99f6e4] dark:border-[#1e524d] hover:border-[#2dd4bf] dark:hover:border-[#308179] shadow-2xs';
  }

  // Limpieza, Aseo, Hogar, Detergente -> Lavanda / Violeta suave
  if (text.includes('limpieza') || text.includes('detergente') || text.includes('jabon') || text.includes('jabón') || text.includes('papel') || text.includes('aseo')) {
    return 'bg-[#fae8ff] dark:bg-[#2a1733] text-slate-950 dark:text-purple-100 border-2 border-[#f5d0fe] dark:border-[#4d285e] hover:border-[#e879f9] dark:hover:border-[#783e92] shadow-2xs';
  }

  // Fallback: Alternancia elegante gris pizarra / niebla / blanco
  const mod = index % 3;
  if (mod === 0) {
    return 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white border-2 border-slate-300 dark:border-slate-600 hover:border-slate-500 shadow-2xs';
  } else if (mod === 1) {
    return 'bg-[#dce3ec] dark:bg-slate-800/90 text-slate-950 dark:text-slate-100 border-2 border-[#9cb1c5] dark:border-slate-500 hover:border-slate-600 shadow-2xs';
  } else {
    return 'bg-[#d4dfea] dark:bg-slate-800/80 text-slate-950 dark:text-slate-100 border-2 border-[#93a9be] dark:border-slate-500 hover:border-slate-600 shadow-2xs';
  }
};

export default function DesktopPosPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bcvRate, setBcvRate] = useState<number>(SYSTEM_DEFAULTS.DEFAULT_BCV_RATE);
  const [primaryCurrency, setPrimaryCurrency] = useState<'VES' | 'USD'>('VES');

  // Slider manual superior (Imagen 1) - Accesos Rápidos Personalizables
  const sliderRef = useRef<HTMLDivElement>(null);
  const [customSliderIds, setCustomSliderIds] = useState<number[]>([]);
  const [showQuickAccessModal, setShowQuickAccessModal] = useState<boolean>(false);
  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Toggle de visualización de fotos (persistente en localStorage)
  const [showImages, setShowImages] = useState<boolean>(true);

  // Modal de Escáner Celular y QR
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [scannerUrl, setScannerUrl] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrReceiptMode, setQrReceiptMode] = useState<'medium' | 'large' | 'none'>('medium');
  const [ticketQrDataUrl, setTicketQrDataUrl] = useState<string>('');
  const [phoneConnected, setPhoneConnected] = useState<boolean>(false);
  const [phoneDeviceName, setPhoneDeviceName] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Balanza Digital Comercial
  const [scaleReading, setScaleReading] = useState<WeightReading>({
    weight: 0,
    unit: 'kg',
    isStable: true,
    raw: '',
    timestamp: Date.now(),
  });
  const [scaleConnected, setScaleConnected] = useState<boolean>(false);

  // Modal de Balanza Manual (Gramos / Kilos) para Balanzas sin cable
  const [showManualWeightModal, setShowManualWeightModal] = useState<boolean>(false);
  const [manualWeightTargetProduct, setManualWeightTargetProduct] = useState<LocalProduct | null>(null);

  // Teclado numérico táctil / Entrada
  const [numpadValue, setNumpadValue] = useState<string>('');
  const [numpadMode, setNumpadMode] = useState<'qty' | 'cash' | 'barcode'>('qty');
  const [selectedCartItemId, setSelectedCartItemId] = useState<number | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState<number | null>(null);

  // Modal de Cobro
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [cashGivenUSD, setCashGivenUSD] = useState<string>('');
  const [cashGivenVES, setCashGivenVES] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'cash_usd' | 'cash_ves' | 'pago_movil' | 'card_debit' | 'binance' | 'mixed' | 'credit'
  >('cash_usd');
  const [pagoMovilRef, setPagoMovilRef] = useState<string>('');
  const [pagoMovilDuplicateAlert, setPagoMovilDuplicateAlert] = useState<{
    isDuplicate: boolean;
    receiptNumber?: string;
    date?: string;
    amountVES?: number;
  } | null>(null);

  const checkDuplicateReference = async (ref: string) => {
    const cleanRef = ref.trim();
    if (cleanRef.length < 4) {
      setPagoMovilDuplicateAlert(null);
      return;
    }
    try {
      const allSales = await db.sales.toArray();
      const match = allSales.find((s) =>
        s.payments?.some(
          (p) =>
            p.method === 'pago_movil' &&
            p.reference &&
            p.reference.trim().toLowerCase() === cleanRef.toLowerCase()
        )
      );
      if (match) {
        setPagoMovilDuplicateAlert({
          isDuplicate: true,
          receiptNumber: match.receiptNumber,
          date: match.timestamp,
          amountVES: match.totalVES,
        });
        soundEffects.error();
      } else {
        setPagoMovilDuplicateAlert({ isDuplicate: false });
      }
    } catch {
      setPagoMovilDuplicateAlert(null);
    }
  };
  const [cardDebitRef, setCardDebitRef] = useState<string>('');
  const [binanceRef, setBinanceRef] = useState<string>('');
  const [customersList, setCustomersList] = useState<LocalCustomer[]>([]);
  const [selectedCreditCustomer, setSelectedCreditCustomer] = useState<LocalCustomer | null>(null);

  // Pago Móvil — Confirmación Automática por Gmail
  const [pagoMovilAutoStatus, setPagoMovilAutoStatus] = useState<'idle' | 'monitoring' | 'confirmed' | 'error'>('idle');
  const [pagoMovilAutoConfirmation, setPagoMovilAutoConfirmation] = useState<PagoMovilConfirmation | null>(null);
  const [pagoMovilGmailConfigured] = useState<boolean>(() => pagoMovilMonitor.isConfigured());

  // Modos de Vista del Catálogo POS (Cuadrícula, Lista Compacta, Botonera Táctil Express, Comida Rápida 3x3)
  type PosViewMode = 'grid' | 'list' | 'touch' | 'fastfood';
  const [posViewMode, setPosViewMode] = useState<PosViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('klikpos_pos_view_mode');
      if (saved === 'grid' || saved === 'list' || saved === 'touch' || saved === 'fastfood') return saved;
    }
    return 'grid';
  });

  // Paleta de Color para Modo Minimalista ('category' = pasteles suaves por rubro, 'mono' = escala monocromática)
  const [minimalistColorPalette, setMinimalistColorPalette] = useState<'category' | 'mono'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('venematic_pos_minimalist_colors');
      if (saved === 'mono' || saved === 'category') return saved;
    }
    return 'category';
  });

  const toggleMinimalistPalette = () => {
    const next = minimalistColorPalette === 'category' ? 'mono' : 'category';
    setMinimalistColorPalette(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('venematic_pos_minimalist_colors', next);
    }
  };
  const [isSliderCollapsed, setIsSliderCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('klikpos_slider_collapsed') === 'true';
    }
    return false;
  });

  const handleSetPosViewMode = (mode: PosViewMode) => {
    setPosViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('klikpos_pos_view_mode', mode);
    }
  };

  const handleToggleSliderCollapsed = () => {
    setIsSliderCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('klikpos_slider_collapsed', String(next));
      }
      return next;
    });
  };

  // Gestión Profesional de Turno de Caja y Arqueo Físico
  const [activeShift, setActiveShift] = useState<LocalCashShift | null>(null);
  const [showCashShiftModal, setShowCashShiftModal] = useState<boolean>(false);
  const [cashShiftModalMode, setCashShiftModalMode] = useState<'open' | 'close' | 'movement' | 'view_x'>('open');

  // Pagos Mixtos Multimoneda
  const [mixedPayments, setMixedPayments] = useState<{
    id: string;
    method: 'cash_usd' | 'cash_ves' | 'pago_movil' | 'card_debit' | 'zelle' | 'binance';
    currency: 'USD' | 'VES';
    amountUSD: number;
    amountVES: number;
    reference?: string;
  }[]>([]);
  const [mixedMethod, setMixedMethod] = useState<'cash_usd' | 'cash_ves' | 'pago_movil' | 'card_debit' | 'zelle' | 'binance'>('cash_usd');
  const [mixedCurrency, setMixedCurrency] = useState<'USD' | 'VES'>('USD');
  const [mixedAmount, setMixedAmount] = useState<string>('');
  const [mixedRef, setMixedRef] = useState<string>('');

  // Refs mutables para evitar cierres obsoletos (stale closures) en listeners de teclado físico
  const cartRef = useRef<CartItem[]>([]);
  cartRef.current = cart;
  const numpadValueRef = useRef<string>('');
  numpadValueRef.current = numpadValue;
  const numpadModeRef = useRef<'qty' | 'cash' | 'barcode'>('qty');
  numpadModeRef.current = numpadMode;
  const selectedCartItemIdRef = useRef<number | null>(null);
  selectedCartItemIdRef.current = selectedCartItemId;
  const pendingQuantityRef = useRef<number | null>(null);
  pendingQuantityRef.current = pendingQuantity;
  const processBarcodeScanRef = useRef<(code: string) => boolean>(() => false);

  // Paleta de colores distintiva por rubro/categoría (Badges llamativos y de alto contraste)
  const getCategoryTheme = (categoryName: string) => {
    const cat = (categoryName || '').toLowerCase().trim();

    // 1. Cervezas y Maltas (Dorado cervecero)
    if (cat.includes('cerveza') || cat.includes('malta')) {
      return {
        badge: 'bg-amber-100 text-amber-950 font-black border-amber-300 shadow-2xs',
        cardBorder: 'border-l-4 border-l-amber-500 hover:border-amber-400',
        lightBg: 'bg-amber-50/40',
        accentText: 'text-amber-700',
      };
    }
    // 2. Rones y Destilados (Cobre / Naranja ronero)
    if (cat.includes('ron') || cat.includes('destilado') || cat.includes('aguardiente') || cat.includes('anis')) {
      return {
        badge: 'bg-orange-100 text-orange-950 font-black border-orange-400 shadow-2xs',
        cardBorder: 'border-l-4 border-l-orange-500 hover:border-orange-400',
        lightBg: 'bg-orange-50/40',
        accentText: 'text-orange-700',
      };
    }
    // 3. Whisky y Licores Premium (Dorado lujo / Oro viejo)
    if (cat.includes('whisky') || cat.includes('whiskey') || cat.includes('bourbon') || cat.includes('cognac')) {
      return {
        badge: 'bg-yellow-100 text-yellow-950 font-black border-yellow-400 shadow-2xs',
        cardBorder: 'border-l-4 border-l-yellow-600 hover:border-yellow-500',
        lightBg: 'bg-yellow-50/40',
        accentText: 'text-yellow-800',
      };
    }
    // 4. Vinos y Sangrías (Vino tinto / Borgoña / Rubí)
    if (cat.includes('vino') || cat.includes('sangr') || cat.includes('champagne') || cat.includes('espumante')) {
      return {
        badge: 'bg-rose-100 text-rose-950 font-black border-rose-300 shadow-2xs',
        cardBorder: 'border-l-4 border-l-rose-500 hover:border-rose-400',
        lightBg: 'bg-rose-50/40',
        accentText: 'text-rose-700',
      };
    }
    // 5. Hielo y Mezcladores, Refrescos, Aguas (Cian fresco / Hielo)
    if (cat.includes('hielo') || cat.includes('mezclador') || cat.includes('refresco') || cat.includes('agua') || cat.includes('soda') || cat.includes('jugo') || cat.includes('bebida')) {
      return {
        badge: 'bg-cyan-100 text-cyan-950 font-black border-cyan-300 shadow-2xs',
        cardBorder: 'border-l-4 border-l-cyan-500 hover:border-cyan-400',
        lightBg: 'bg-cyan-50/40',
        accentText: 'text-cyan-700',
      };
    }
    // 6. Snacks, Pasapalos, Golosinas (Púrpura / Violeta vibrante)
    if (cat.includes('snack') || cat.includes('pasapalo') || cat.includes('dorito') || cat.includes('papa') || cat.includes('dulce') || cat.includes('galleta') || cat.includes('chocolate')) {
      return {
        badge: 'bg-purple-100 text-purple-950 font-black border-purple-300 shadow-2xs',
        cardBorder: 'border-l-4 border-l-purple-500 hover:border-purple-400',
        lightBg: 'bg-purple-50/40',
        accentText: 'text-purple-700',
      };
    }
    // 7. Víveres y Alimentos Básicos (Verde esmeralda fresco)
    if (cat.includes('víveres') || cat.includes('viveres') || cat.includes('alimento') || cat.includes('grano') || cat.includes('arroz') || cat.includes('harina') || cat.includes('aceite')) {
      return {
        badge: 'bg-emerald-100 text-emerald-950 font-black border-emerald-300 shadow-2xs',
        cardBorder: 'border-l-4 border-l-emerald-500 hover:border-emerald-400',
        lightBg: 'bg-emerald-50/40',
        accentText: 'text-emerald-700',
      };
    }
    // 8. Charcutería, Quesos y Carnes (Rojo intenso carnicería)
    if (cat.includes('charcutería') || cat.includes('charcuteria') || cat.includes('queso') || cat.includes('carne') || cat.includes('pollo') || cat.includes('embutido') || cat.includes('jamon')) {
      return {
        badge: 'bg-red-100 text-red-950 font-black border-red-300 shadow-2xs',
        cardBorder: 'border-l-4 border-l-red-500 hover:border-red-400',
        lightBg: 'bg-red-50/40',
        accentText: 'text-red-700',
      };
    }
    // 9. Limpieza y Cuidado del Hogar (Azul zafiro)
    if (cat.includes('limpieza') || cat.includes('hogar') || cat.includes('detergente') || cat.includes('jabon')) {
      return {
        badge: 'bg-blue-100 text-blue-950 font-black border-blue-300 shadow-2xs',
        cardBorder: 'border-l-4 border-l-blue-500 hover:border-blue-400',
        lightBg: 'bg-blue-50/40',
        accentText: 'text-blue-700',
      };
    }
    // 10. Farmacia y Cuidado Personal (Verde azulado / Teal)
    if (cat.includes('cuidado') || cat.includes('higiene') || cat.includes('personal') || cat.includes('salud') || cat.includes('farmacia')) {
      return {
        badge: 'bg-teal-100 text-teal-950 font-black border-teal-300 shadow-2xs',
        cardBorder: 'border-l-4 border-l-teal-500 hover:border-teal-400',
        lightBg: 'bg-teal-50/40',
        accentText: 'text-teal-700',
      };
    }

    // Fallback dinámico por hash: Asegura colores alegres para cualquier categoría no listada
    const fallbackPalettes = [
      { badge: 'bg-pink-100 text-pink-950 font-black border-pink-300', cardBorder: 'border-l-4 border-l-pink-500' },
      { badge: 'bg-indigo-100 text-indigo-950 font-black border-indigo-300', cardBorder: 'border-l-4 border-l-indigo-500' },
      { badge: 'bg-lime-100 text-lime-950 font-black border-lime-400', cardBorder: 'border-l-4 border-l-lime-600' },
      { badge: 'bg-fuchsia-100 text-fuchsia-950 font-black border-fuchsia-300', cardBorder: 'border-l-4 border-l-fuchsia-500' },
      { badge: 'bg-sky-100 text-sky-950 font-black border-sky-300', cardBorder: 'border-l-4 border-l-sky-500' },
    ];
    let hash = 0;
    for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
    const chosen = fallbackPalettes[Math.abs(hash) % fallbackPalettes.length];
    return {
      badge: `${chosen.badge} shadow-2xs`,
      cardBorder: `${chosen.cardBorder} hover:border-slate-400`,
      lightBg: 'bg-slate-50/30',
      accentText: 'text-slate-800',
    };
  };

  // Ticket para Impresión y Membrete
  const [lastCompletedSale, setLastCompletedSale] = useState<LocalSale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [receiptType, setReceiptType] = useState<'mixed' | 'fiscal_seniat'>('mixed');
  const [storeInfo, setStoreInfo] = useState<{
    name: string;
    rif: string;
    phone: string;
    address: string;
    footerMessage: string;
    logoUrl?: string;
    showLogoOnReceipt?: boolean;
  }>({
    name: 'COMERCIAL MI TIENDA C.A.',
    rif: 'J-50123456-7',
    phone: '0414-1234567',
    address: 'Av. Principal, Caracas',
    footerMessage: '¡Gracias por su compra! • Comprobante Oficial',
    logoUrl: '',
    showLogoOnReceipt: true,
  });

  // Ventas del Turno (en memoria, se acumulan durante la sesión)
  const [shiftSales, setShiftSales] = useState<LocalSale[]>([]);
  const [rightPanelTab, setRightPanelTab] = useState<'cart' | 'shift'>('cart');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const productsRef = useRef<LocalProduct[]>([]);
  productsRef.current = products;

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const toggleShowImages = () => {
    const next = !showImages;
    setShowImages(next);
    try {
      localStorage.setItem('venematic_pos_show_images', String(next));
    } catch {}
  };

  const openScannerModal = async () => {
    setShowScannerModal(true);
    try {
      let url = '';
      const statusRes = await fetch('/api/scanner/status?session=caja-1').catch(() => null);
      if (statusRes && statusRes.ok) {
        const d = await statusRes.json();
        if (d.scannerUrl) url = d.scannerUrl;
        if (d.phoneConnected) {
          setPhoneConnected(true);
          setPhoneDeviceName(d.deviceName || 'Caja Móvil');
        }
      }
      if (!url) {
        const res = await fetch('/api/server-info').catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          url = data.scannerUrl || `http://${data.ip || 'localhost'}:${data.port || 3002}/scanner?session=caja-1`;
        }
      }
      if (!url && typeof window !== 'undefined') {
        url = `${window.location.origin}/scanner?session=caja-1`;
      }
      setScannerUrl(url);

      if (url) {
        const qr = await QRCode.toDataURL(url, {
          width: 280,
          margin: 1.5,
          color: { dark: '#0e4f5a', light: '#ffffff' },
        });
        setQrCodeDataUrl(qr);
      }
    } catch (e) {
      console.warn('Error loading scanner info:', e);
    }
  };

  // Generar código QR dinámico para el pie del ticket de venta (Mediano o Grande)
  useEffect(() => {
    if (!lastCompletedSale || qrReceiptMode === 'none') {
      setTicketQrDataUrl('');
      return;
    }
    const qrData = JSON.stringify({
      ticket: lastCompletedSale.receiptNumber,
      rif: storeInfo.rif || 'J-50123456-7',
      fecha: lastCompletedSale.timestamp,
      totalUSD: Number(lastCompletedSale.totalUSD.toFixed(2)),
      totalVES: Number(lastCompletedSale.totalVES.toFixed(2)),
      bcv: lastCompletedSale.bcvRate,
    });
    const qrSize = qrReceiptMode === 'large' ? 180 : 100;
    QRCode.toDataURL(qrData, {
      width: qrSize,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(setTicketQrDataUrl)
      .catch(() => setTicketQrDataUrl(''));
  }, [lastCompletedSale, qrReceiptMode, storeInfo.rif]);

  const handleTriggerMobileScanner = async () => {
    soundEffects.playBeep();
    try {
      const res = await fetch('/api/scanner/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: 'caja-1', action: 'activate_camera' }),
      });
      if (res.ok) {
        showToast('📱 Cámara del celular activada para escanear', 'success');
      } else {
        showToast('Abriendo vinculación móvil con código QR...', 'info');
        openScannerModal();
      }
    } catch {
      showToast('Abriendo vinculación móvil con código QR...', 'info');
      openScannerModal();
    }
  };

  // Cargar productos, ventas de turno y tasa inicial
  const loadData = async () => {
    await initializeDatabaseIfNeeded();
    const prods = await db.products.toArray();
    setProducts(prods);

    const cats = Array.from(new Set(prods.map((p) => p.category)));
    setCategories(['Todos', ...cats]);

    const rateSetting = await db.settings.get('bcv_rate');
    const currentRate = rateSetting ? rateSetting.value : SYSTEM_DEFAULTS.DEFAULT_BCV_RATE;
    if (rateSetting) setBcvRate(rateSetting.value);

    const currencySetting = await db.settings.get('primary_currency');
    if (currencySetting && (currencySetting.value === 'VES' || currencySetting.value === 'USD')) {
      setPrimaryCurrency(currencySetting.value);
    } else {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('venematic_primary_currency') : null;
      if (stored === 'USD' || stored === 'VES') setPrimaryCurrency(stored);
    }

    // Cargar configuración de productos favoritos para el carrusel de accesos rápidos
    try {
      const sliderSetting = await db.settings.get('pos_slider_quick_products');
      if (sliderSetting && Array.isArray(sliderSetting.value) && sliderSetting.value.length > 0) {
        setCustomSliderIds(sliderSetting.value);
      } else {
        const local = localStorage.getItem('venematic_pos_slider_quick_products');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCustomSliderIds(parsed);
          }
        }
      }
    } catch {}

    // Cargar datos de membrete de comercio y logo
    try {
      const storeSetting = await db.settings.get('store_info');
      if (storeSetting && storeSetting.value) {
        setStoreInfo({
          name: storeSetting.value.name || 'COMERCIAL MI TIENDA C.A.',
          rif: storeSetting.value.rif || 'J-50123456-7',
          phone: storeSetting.value.phone || '0414-1234567',
          address: storeSetting.value.address || 'Av. Principal, Caracas',
          footerMessage: storeSetting.value.footerMessage || '¡Gracias por su compra!',
          logoUrl: storeSetting.value.logoUrl || '',
          showLogoOnReceipt: storeSetting.value.showLogoOnReceipt !== false,
        });
      }
    } catch {}

    // Cargar configuración de papel térmico (58mm o 80mm) y margen
    try {
      const paperSetting = await db.settings.get('paper_width');
      const paperVal = paperSetting?.value || '80mm';
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-paper-width', paperVal);
        const printableWidth = paperVal === '58mm' ? '48mm' : '72mm';
        document.documentElement.style.setProperty('--receipt-width', printableWidth);
      }
      const marginSetting = await db.settings.get('receipt_feed_margin');
      if (marginSetting?.value && typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--receipt-feed-padding', `${marginSetting.value}mm`);
      }
    } catch {}

    // Cargar ventas del turno (hoy) desde la base de datos local
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const todaySales = await db.sales.where('timestamp').startsWith(todayStr).reverse().sortBy('id');
      if (todaySales.length > 0) {
        setShiftSales(todaySales);
      } else {
        const recent = await db.sales.orderBy('id').reverse().limit(50).toArray();
        setShiftSales(recent);
      }
    } catch (e) {
      console.warn('Error cargando ventas de turno en POS:', e);
    }

    // Cargar turno de caja activo (si existe)
    try {
      const openShift = await db.cashShifts.where('status').equals('open').first();
      if (openShift) {
        setActiveShift(openShift);
      } else {
        setActiveShift(null);
      }
    } catch (e) {
      console.warn('Error cargando turno activo en POS:', e);
    }

    // Cargar directorio de clientes para ventas a crédito / fiado
    try {
      const custs = await db.customers.toArray();
      setCustomersList(custs);
    } catch (e) {
      console.warn('Error cargando clientes en POS:', e);
    }

    // Compartir automáticamente inventario y tasa BCV con la app móvil
    try {
      fetch('/api/scanner/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: prods.map(p => ({
            id: p.id,
            barcode: p.barcode,
            name: p.name,
            category: p.category,
            priceUSD: p.priceUSD,
            stock: p.stock,
            image: p.image,
          })),
          bcvRate: currentRate,
        }),
      }).catch(() => {});
    } catch {}
  };

  // Procesar venta recibida desde el celular (por SSE o por sondeo de conciliación)
  const processMobileSaleIncoming = async (sale: any) => {
    if (!sale || !sale.receiptNumber) return;

    // Verificar si ya existe en IndexedDB para no duplicar
    const existing = await db.sales.where('receiptNumber').equals(sale.receiptNumber).first();
    if (existing) {
      try {
        await fetch('/api/scanner/sale', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiptNumber: sale.receiptNumber }),
        });
      } catch {}
      return;
    }

    const saleToSave: LocalSale = {
      receiptNumber: sale.receiptNumber,
      timestamp: sale.timestamp || new Date().toISOString(),
      items: sale.items || [],
      subtotalUSD: Number(sale.subtotalUSD) || Number(sale.totalUSD) || 0,
      taxUSD: Number(sale.taxUSD) || 0,
      totalUSD: Number(sale.totalUSD) || 0,
      totalVES: Number(sale.totalVES) || 0,
      bcvRate: Number(sale.bcvRate) || bcvRate,
      payments: sale.payments || [
        {
          method: 'cash_usd',
          amountUSD: Number(sale.totalUSD) || 0,
          amountVES: Number(sale.totalVES) || 0,
        },
      ],
      changeUSD: Number(sale.changeUSD) || 0,
      changeVES: Number(sale.changeVES) || 0,
      cashierName: sale.cashierName || 'POS Celular (Contingencia)',
      status: 'completed',
      source: 'mobile',
    };

    await db.transaction('rw', db.sales, db.products, async () => {
      await db.sales.add(saleToSave);
      for (const item of saleToSave.items || []) {
        let prod = item.productId ? await db.products.get(Number(item.productId)) : undefined;
        if (!prod && item.barcode) {
          prod = await db.products.where('barcode').equals(item.barcode).first();
        }
        if (prod && prod.id) {
          await db.products.update(prod.id, {
            stock: Math.max(0, prod.stock - item.qty),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });

    try {
      await fetch('/api/scanner/sale', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptNumber: sale.receiptNumber }),
      });
    } catch {}

    const updatedProds = await db.products.toArray();
    setProducts(updatedProds);
    setShiftSales((prev) => [saleToSave, ...prev.filter((s) => s.receiptNumber !== saleToSave.receiptNumber)]);

    soundEffects.playBeep();
    showToast(`📲 Venta Móvil recibida en vivo: ${saleToSave.receiptNumber} ($${saleToSave.totalUSD.toFixed(2)})`, 'success');
  };

  useEffect(() => {
    loadData();

    // Cargar preferencia de fotos
    try {
      const saved = localStorage.getItem('venematic_pos_show_images');
      if (saved !== null) {
        setShowImages(saved === 'true');
      }
    } catch {}

    const handleBcvUpdate = (e: any) => {
      if (e.detail && typeof e.detail === 'number' && e.detail > 0) {
        setBcvRate(e.detail);
      }
    };
    window.addEventListener('pos:bcv_updated', handleBcvUpdate);
    window.addEventListener('venematic:bcv_updated', handleBcvUpdate);

    const handleSliderUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCustomSliderIds(e.detail);
      }
    };
    window.addEventListener('pos:quick_slider_updated', handleSliderUpdate);

    // Conectar a eventos del escáner celular en tiempo real (SSE)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/scanner/events?session=caja-1');

      eventSource.addEventListener('scan', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (!data.barcode) return;
          const cleanCode = String(data.barcode).trim();
          const handled = processBarcodeScanRef.current(cleanCode);
          if (!handled) {
            soundEffects.playError();
            showToast(`Código no encontrado en inventario: ${cleanCode}`, 'error');
          }
        } catch (err) {
          console.error('SSE scan error:', err);
        }
      });

      eventSource.addEventListener('new_product', async (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.product) {
            const exists = await db.products.where('barcode').equals(data.product.barcode).first();
            if (exists) {
              await db.products.update(exists.id!, data.product);
            } else {
              await db.products.add(data.product);
            }
            await loadData();
            soundEffects.playBeep();
            showToast(`📸 Nuevo producto recibido desde el celular: ${data.product.name}`, 'success');
          }
        } catch (err) {
          console.error('SSE new product error:', err);
        }
      });

      eventSource.addEventListener('phone_status', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          setPhoneConnected(Boolean(data.connected));
          if (data.deviceName) setPhoneDeviceName(data.deviceName);
        } catch {}
      });

      eventSource.addEventListener('mobile_sale_completed', async (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.sale) {
            await processMobileSaleIncoming(data.sale);
          }
        } catch (err) {
          console.error('Error procesando venta móvil via SSE:', err);
        }
      });

      // Confirmación de Pago Móvil Remoto (Webhook entrante)
      eventSource.addEventListener('payment_confirmed', (event: any) => {
        try {
          const payment = JSON.parse(event.data);
          if (!payment || !payment.referencia) return;

          soundEffects.playSuccess();
          showToast(`🔔 ¡Pago Móvil Confirmado! Bs. ${Number(payment.monto).toFixed(2)} · Ref: ${payment.referencia} (${payment.banco || 'Banco'})`, 'success');

          // Asignar automáticamente referencia si no hay una digitada
          setPagoMovilRef((prev) => prev || payment.referencia);
          setPagoMovilAutoStatus('confirmed');
          setPagoMovilAutoConfirmation({
            referencia: payment.referencia,
            monto: payment.monto,
            bancoOrigen: payment.banco || 'Pago Móvil',
            bancoDestino: 'Cuenta Local',
            telefonoPagador: payment.telefono || '',
            nombrePagador: payment.pagador || '',
            cedulaPagador: payment.cedula || '',
            emailSubject: 'Notificación Webhook Remota',
            emailDate: new Date(payment.timestamp || Date.now()).toISOString(),
            emailId: payment.id || `wh_${Date.now()}`,
            rawText: payment.rawText || '',
          });
        } catch (err) {
          console.error('Error procesando payment_confirmed via SSE:', err);
        }
      });

      // Cuando el celular abre la app y no hay inventario cacheado, el server pide que enviemos el catálogo
      eventSource.addEventListener('request_inventory', async () => {
        try {
          const prods = await db.products.toArray();
          const rateSetting = await db.settings?.get?.('bcv_rate').catch?.(() => null);
          const currentRate = rateSetting?.value || bcvRate;
          fetch('/api/scanner/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              products: prods.map((p) => ({
                id: p.id,
                barcode: p.barcode,
                name: p.name,
                category: p.category,
                priceUSD: p.priceUSD,
                stock: p.stock,
                image: p.image,
              })),
              bcvRate: currentRate,
            }),
          }).catch(() => {});
        } catch {}
      });
    } catch (err) {
      console.warn('SSE connection init error:', err);
    }

    // Foco automático en el buscador para pistolas lectoras de códigos de barras
    searchInputRef.current?.focus();

    // Atajos de teclado para POS (F2 a F12) y Teclado Numérico Físico (Numpad)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Alternar Moneda Principal (VES / USD)
      if (e.key === 'F2') {
        e.preventDefault();
        setPrimaryCurrency((prev) => {
          const next = prev === 'VES' ? 'USD' : 'VES';
          localStorage.setItem('venematic_primary_currency', next);
          showToast(`Moneda cambiada a: ${next === 'VES' ? 'Bolívares (Bs.)' : 'Dólares ($)'} (F2)`, 'info');
          soundEffects.playBeep();
          return next;
        });
        return;
      }

      // F3: Enfocar buscador / lector de código de barras
      if (e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        showToast('Buscador enfocado (F3)', 'info');
        return;
      }

      // F4: Venta a Crédito / Fiado
      if (e.key === 'F4') {
        e.preventDefault();
        if (cartRef.current.length > 0) {
          setSelectedPaymentMethod('credit');
          openPaymentModal();
          showToast('Cobro en Crédito / Fiado (F4)', 'info');
        } else {
          showToast('Agrega productos al carrito para venta a crédito (F4)', 'info');
        }
        return;
      }

      // F5: Balanza Digital / Ingreso Manual de Peso
      if (e.key === 'F5') {
        e.preventDefault();
        setShowManualWeightModal(true);
        soundEffects.playBeep();
        return;
      }

      // F6: Alternar modo del teclado numérico (Cantidad / Código)
      if (e.key === 'F6') {
        e.preventDefault();
        setNumpadMode((prev) => {
          const next = prev === 'qty' ? 'barcode' : 'qty';
          showToast(`Modo numpad: ${next === 'qty' ? 'Cantidad' : 'Código de Barras'} (F6)`, 'info');
          soundEffects.playBeep();
          return next;
        });
        return;
      }

      // F7: Limpiar / Vaciar Carrito Actual
      if (e.key === 'F7') {
        e.preventDefault();
        if (cartRef.current.length > 0) {
          setCart([]);
          setSelectedCartItemId(null);
          soundEffects.playTrash();
          showToast('Carrito vaciado exitosamente (F7)', 'info');
        } else {
          showToast('El carrito ya está vacío', 'info');
        }
        return;
      }

      // F8: Escáner Celular Inalámbrico con QR
      if (e.key === 'F8') {
        e.preventDefault();
        openScannerModal();
        return;
      }

      // F9: Turno de Caja y Arqueo Físico
      if (e.key === 'F9') {
        e.preventDefault();
        setShowCashShiftModal(true);
        return;
      }

      // F10: Abrir Gaveta de Dinero (ESC/POS RJ11 Kick)
      if (e.key === 'F10') {
        e.preventDefault();
        kickCashDrawer().then((res) => {
          showToast(res.message, 'success');
        });
        return;
      }

      // F11: Pantalla Completa
      if (e.key === 'F11') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          showToast('Pantalla Completa Activada (F11)', 'info');
        } else {
          document.exitFullscreen().catch(() => {});
          showToast('Pantalla Completa Desactivada (F11)', 'info');
        }
        return;
      }

      // F12: Cobrar y Liquidar Venta
      if (e.key === 'F12') {
        e.preventDefault();
        if (cartRef.current.length > 0) {
          openPaymentModal();
        } else {
          showToast('Agrega productos al carrito antes de cobrar (F12)', 'error');
        }
        return;
      }

      // Escape: Cerrar modales
      if (e.key === 'Escape') {
        setShowPaymentModal(false);
        setShowReceiptModal(false);
        setShowScannerModal(false);
        setShowManualWeightModal(false);
        setShowCashShiftModal(false);
        setShowQuickAccessModal(false);
        return;
      }

      // Soporte directo para teclado numérico físico (Numpad)
      const target = e.target as HTMLElement;
      const isInputFocused = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      // Si el foco no está en un input de texto escribible, o si el usuario pulsa teclas del teclado numérico físico
      if (!isInputFocused) {
        if (e.code.startsWith('Numpad') || /^[0-9]$/.test(e.key)) {
          let numChar = e.key;
          if (e.code.startsWith('Numpad')) {
            numChar = e.code.replace('Numpad', '');
          }
          if (/^[0-9]$/.test(numChar)) {
            e.preventDefault();
            handleNumpadKey(numChar);
            return;
          }
        }
        if (e.key === '.' || e.key === ',' || e.code === 'NumpadDecimal') {
          e.preventDefault();
          handleNumpadKey('.');
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          handleNumpadKey('BACK');
          return;
        }
        if (e.key === 'Delete' || e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          handleNumpadKey('C');
          return;
        }
        if (e.key === 'Enter' || e.code === 'NumpadEnter') {
          e.preventDefault();
          handleNumpadApply();
          return;
        }
      }
    };
    // Sondeo de conciliación cada 3.5s para no perder ninguna venta móvil incluso si SSE se reconecta
    const checkPendingMobileSales = async () => {
      try {
        const res = await fetch('/api/scanner/sale');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.pendingSales) && data.pendingSales.length > 0) {
            for (const sale of data.pendingSales) {
              await processMobileSaleIncoming(sale);
            }
          }
        }
      } catch {}
    };

    checkPendingMobileSales();
    const pollMobileTimer = setInterval(checkPendingMobileSales, 3500);

    // Conexión y escucha de Balanza Digital
    setScaleConnected(scaleService.isConnected());
    const unsubScale = scaleService.onWeightChange((reading) => {
      setScaleReading(reading);
      setScaleConnected(scaleService.isConnected());
    });

    const handleOpenScannerEvent = () => {
      openScannerModal();
    };
    window.addEventListener('venematic:open_scanner_modal', handleOpenScannerEvent);

    return () => {
      window.removeEventListener('pos:bcv_updated', handleBcvUpdate);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('venematic:open_scanner_modal', handleOpenScannerEvent);
      clearInterval(pollMobileTimer);
      unsubScale();
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Filtrado de productos para el catálogo general
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'Todos' || p.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.barcode.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  // Productos para el slider superior manual (Cards rectangulares horizontales - Imagen 1)
  const sliderProducts = React.useMemo(() => {
    if (customSliderIds.length > 0) {
      const customList = customSliderIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is LocalProduct => Boolean(p));

      if (selectedCategory !== 'Todos') {
        const catList = customList.filter((p) => p.category === selectedCategory);
        if (catList.length > 0) return catList;
        return products.filter((p) => p.category === selectedCategory).slice(0, 20);
      }
      return customList;
    }

    let list = products;
    if (selectedCategory !== 'Todos') {
      list = products.filter((p) => p.category === selectedCategory);
    }
    return list.slice(0, 20);
  }, [products, selectedCategory, customSliderIds]);

  // Aplicar peso ingresado manualmente (gramos o kilos) desde el modal
  const handleApplyManualWeight = (
    weightInKg: number,
    multiplier: number,
    note?: string,
    selectedProduct?: any
  ) => {
    const prod = selectedProduct || manualWeightTargetProduct;
    if (prod) {
      setManualWeightTargetProduct(null);

      const lineTotal = multiplier * prod.priceUSD;
      setCart((prev) => {
        const existing = prev.find((item) => item.productId === prod.id);
        if (existing) {
          const newQty = Number((existing.qty + weightInKg).toFixed(3));
          return prev.map((item) =>
            item.productId === prod.id
              ? { ...item, qty: newQty, totalUSD: existing.totalUSD + lineTotal }
              : item
          );
        } else {
          return [
            ...prev,
            {
              productId: prod.id!,
              name: prod.name,
              barcode: prod.barcode,
              qty: Number(weightInKg.toFixed(3)),
              priceUSD: prod.priceUSD,
              totalUSD: lineTotal,
              stock: prod.stock,
            },
          ];
        }
      });
      soundEffects.playBeep();
      showToast(`⚖️ Peso aplicado: ${note || `${weightInKg.toFixed(3)} kg`} (${prod.name})`, 'success');
      setSelectedCartItemId(prod.id!);
    } else {
      setPendingQuantity(weightInKg);
      soundEffects.playBeep();
      showToast(`⚡ Peso fijado en ${note || `${weightInKg.toFixed(3)} kg`} para el siguiente producto`, 'info');
    }
  };

  // Procesar código escaneado (reconoce etiquetas de balanza GS1 EAN-13 con prefijos 20-24 y códigos de barra estándar)
  const handleProcessBarcodeScan = (scannedCode: string): boolean => {
    const code = (scannedCode || '').trim();
    if (!code) return false;

    // 1. Verificar si es una etiqueta emitida por balanza etiquetadora (GS1 In-Store)
    const parsedScale = parseScaleBarcode(code);
    if (parsedScale) {
      const product = findProductByScalePLU(productsRef.current, parsedScale);
      if (product) {
        if (parsedScale.type === 'weight') {
          const weightKg = parsedScale.value;
          const lineTotal = weightKg * product.priceUSD;

          setCart((prev) => {
            const existing = prev.find((item) => item.productId === product.id);
            if (existing) {
              const newQty = Number((existing.qty + weightKg).toFixed(3));
              return prev.map((item) =>
                item.productId === product.id
                  ? { ...item, qty: newQty, totalUSD: existing.totalUSD + lineTotal }
                  : item
              );
            } else {
              return [
                ...prev,
                {
                  productId: product.id!,
                  name: `${product.name} (Balanza: ${parsedScale.formattedValue})`,
                  barcode: product.barcode,
                  qty: weightKg,
                  priceUSD: product.priceUSD,
                  totalUSD: lineTotal,
                  stock: product.stock,
                },
              ];
            }
          });
          soundEffects.playBeep();
          showToast(`⚖️ Balanza [${parsedScale.prefix}]: ${product.name} (${parsedScale.formattedValue} = $${lineTotal.toFixed(2)})`, 'success');
          setSelectedCartItemId(product.id!);
          return true;
        } else {
          // Importe / precio variable
          const totalUSD = parsedScale.value;
          const computedQty = product.priceUSD > 0 ? Number((totalUSD / product.priceUSD).toFixed(3)) : 1;
          setCart((prev) => [
            ...prev,
            {
              productId: product.id!,
              name: `${product.name} (Balanza: ${parsedScale.formattedValue})`,
              barcode: product.barcode,
              qty: computedQty,
              priceUSD: product.priceUSD,
              totalUSD: totalUSD,
              stock: product.stock,
            },
          ]);
          soundEffects.playBeep();
          showToast(`⚖️ Balanza [${parsedScale.prefix}]: ${product.name} (${parsedScale.formattedValue})`, 'success');
          setSelectedCartItemId(product.id!);
          return true;
        }
      } else {
        soundEffects.playError();
        showToast(`Etiqueta de balanza detectada (${code}), pero el producto con PLU "${parsedScale.plu}" no existe en inventario.`, 'error');
        return false;
      }
    }

    // 2. Búsqueda directa por código de barras tradicional
    const exact = productsRef.current.find(
      (p) => p.barcode.toLowerCase() === code.toLowerCase()
    );
    if (exact) {
      soundEffects.playBeep();
      addToCart(exact, 1);
      showToast(`✓ Agregado: ${exact.name}`, 'success');
      return true;
    }

    return false;
  };
  processBarcodeScanRef.current = handleProcessBarcodeScan;

  // Agregar al carrito
  const addToCart = (product: LocalProduct, customQty: number = 1) => {
    // Si el usuario tecleó una cantidad previamente o tiene pendingQuantity
    let qtyToAdd = pendingQuantityRef.current && pendingQuantityRef.current > 0
      ? pendingQuantityRef.current
      : customQty;

    // Si es un producto que se vende por peso (kg / gr / lb)
    const unitLower = (product.unit || '').toLowerCase().trim();
    const isWeighed = unitLower.includes('kg') ||
                      unitLower.includes('kilo') ||
                      unitLower.includes('gr') ||
                      unitLower.includes('gram') ||
                      unitLower === 'g' ||
                      unitLower.includes('lb') ||
                      unitLower.includes('libra') ||
                      unitLower.includes('pesable') ||
                      unitLower.includes('peso');

    const scaleCfg = scaleService.getConfig();
    const isPhysicalScaleConnected = scaleConnected || scaleService.isConnected();

    // Si hay balanza física conectada con autoWeight y peso positivo sobre el plato
    if (isWeighed && isPhysicalScaleConnected && scaleCfg.autoWeight && scaleReading.weight > 0 && pendingQuantityRef.current === null && customQty === 1) {
      qtyToAdd = scaleReading.weight;
      showToast(`⚖️ Balanza: ${scaleReading.weight.toFixed(3)} kg para ${product.name}`, 'info');
    } else if (isWeighed && pendingQuantityRef.current === null && customQty === 1) {
      // Para todo producto pesable sin peso previo en balanza: abrir de inmediato ventana de balanza
      setManualWeightTargetProduct(product);
      setShowManualWeightModal(true);
      return;
    }

    // Resetear multiplicador pendiente
    if (pendingQuantityRef.current !== null) {
      setPendingQuantity(null);
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const newQty = existing.qty + qtyToAdd;
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, qty: Number(newQty.toFixed(3)), totalUSD: newQty * item.priceUSD }
            : item
        );
      } else {
        const isFixed = product.isFixedPriceVES && product.fixedPriceVES;
        const itemPriceUSD = isFixed ? (product.fixedPriceVES! / bcvRate) : product.priceUSD;
        return [
          ...prev,
          {
            productId: product.id!,
            name: product.name,
            barcode: product.barcode,
            qty: Number(qtyToAdd.toFixed(3)),
            priceUSD: itemPriceUSD,
            totalUSD: qtyToAdd * itemPriceUSD,
            stock: product.stock,
            isFixedPriceVES: product.isFixedPriceVES,
            fixedPriceVES: product.fixedPriceVES,
          },
        ];
      }
    });
    setNumpadValue('');
    setSelectedCartItemId(product.id!);
  };

  // Modificar cantidad
  const updateItemQty = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, qty: newQty, totalUSD: newQty * item.priceUSD }
          : item
      )
    );
  };

  const removeItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
    if (selectedCartItemId === productId) {
      setSelectedCartItemId(null);
    }
  };

  const clearCart = () => {
    setCart([]);
    setNumpadValue('');
    setPendingQuantity(null);
    setSelectedCartItemId(null);
  };

  // Cálculos totales (Considera productos con precio fijo en Bolívares exentos de BCV)
  const subtotalUSD = cart.reduce((sum, item) => sum + item.totalUSD, 0);
  const totalUSD = subtotalUSD;
  const totalVES = cart.reduce((sum, item) => {
    if (item.isFixedPriceVES && item.fixedPriceVES) {
      return sum + (item.fixedPriceVES * item.qty);
    }
    return sum + (item.totalUSD * bcvRate);
  }, 0);

  // Manejo del Teclado Numérico Táctil
  const handleNumpadKey = (key: string) => {
    if (key === 'C') {
      setNumpadValue('');
      setPendingQuantity(null);
      return;
    }
    if (key === 'BACK') {
      setNumpadValue((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '.') {
      setNumpadValue((prev) => {
        if (!prev.includes('.')) {
          return prev === '' ? '0.' : prev + '.';
        }
        return prev;
      });
      return;
    }

    setNumpadValue((prev) => prev + key);
  };

  // Aplicar acción del Numpad al item seleccionado, al último item, o como multiplicador pendiente
  const handleNumpadApply = () => {
    const rawVal = numpadValueRef.current;
    const val = parseFloat(rawVal);
    const currentMode = numpadModeRef.current;
    const currentCart = cartRef.current;
    const currentSelectedId = selectedCartItemIdRef.current;

    if (isNaN(val) || val <= 0) return;

    if (currentMode === 'qty') {
      if (currentCart.length > 0) {
        // Si hay un item seleccionado específicamente o tomamos el último
        const targetItem = currentSelectedId
          ? currentCart.find((i) => i.productId === currentSelectedId) || currentCart[currentCart.length - 1]
          : currentCart[currentCart.length - 1];

        if (targetItem) {
          updateItemQty(targetItem.productId, val);
          soundEffects.playBeep();
          showToast(`✓ Cantidad actualizada: ${val} × ${targetItem.name}`, 'success');
        }
      } else {
        // Si el carrito está vacío, activar como multiplicador para el siguiente producto que seleccione/escanee
        setPendingQuantity(val);
        soundEffects.playBeep();
        showToast(`⚡ Cantidad fijada en ${val} para el siguiente producto`, 'info');
      }
    } else if (currentMode === 'barcode') {
      // Buscar código directo o decodificar etiqueta de balanza
      const handled = handleProcessBarcodeScan(rawVal);
      if (!handled) {
        soundEffects.playError();
        showToast(`Producto con código ${rawVal} no encontrado`, 'error');
      }
    }

    setNumpadValue('');
  };

  // Búsqueda instantánea con pistola lectora o Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = searchQuery.trim();
      if (!code) return;

      const handled = handleProcessBarcodeScan(code);
      if (handled) {
        setSearchQuery('');
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0], 1);
        setSearchQuery('');
      } else {
        soundEffects.playError();
        showToast(`Código o producto no encontrado: ${code}`, 'error');
      }
    }
  };

  // Alternar moneda principal en caliente (Bs. vs $)
  const togglePrimaryCurrency = async () => {
    const next: 'VES' | 'USD' = primaryCurrency === 'VES' ? 'USD' : 'VES';
    setPrimaryCurrency(next);
    await db.settings.put({ key: 'primary_currency', value: next });
    if (typeof window !== 'undefined') {
      localStorage.setItem('venematic_primary_currency', next);
    }
    showToast(
      next === 'VES'
        ? '🇻🇪 Moneda principal: Bolívares (Bs.)'
        : '💵 Moneda principal: Dólares ($ USD)',
      'info'
    );
  };

  // Abrir Modal de Cobro
  const openPaymentModal = () => {
    if (!activeShift) {
      setCashShiftModalMode('open');
      setShowCashShiftModal(true);
      showToast('⚠️ Debes abrir la caja e ingresar el fondo inicial antes de cobrar.', 'error');
      return;
    }

    setCashGivenUSD(totalUSD.toFixed(2));
    setCashGivenVES(totalVES.toFixed(2));
    setMixedPayments([]);
    setMixedMethod('cash_usd');
    setMixedCurrency('USD');
    setMixedAmount(totalUSD.toFixed(2));
    setMixedRef('');
    setPagoMovilAutoStatus('idle');
    setPagoMovilAutoConfirmation(null);
    const method = primaryCurrency === 'VES' ? 'pago_movil' : 'cash_usd';
    setSelectedPaymentMethod(method);
    setShowPaymentModal(true);

    // Si se abre en Pago Móvil y Gmail está configurado, iniciar monitoreo automáticamente
    if (method === 'pago_movil' && pagoMovilMonitor.isConfigured()) {
      setPagoMovilAutoStatus('monitoring');
      pagoMovilMonitor.startMonitoring(
        totalVES,
        (confirmation) => {
          setPagoMovilAutoStatus('confirmed');
          setPagoMovilAutoConfirmation(confirmation);
          setPagoMovilRef(confirmation.referencia);
          soundEffects.success();
          showToast(`✅ Pago Móvil confirmado automáticamente: Bs. ${confirmation.monto.toFixed(2)} — Ref: ${confirmation.referencia}`, 'success');
        },
        (err) => {
          setPagoMovilAutoStatus('error');
          showToast(`⚠️ Gmail: ${err}`, 'error');
        }
      );
    }
  };

  // Cálculos de vuelto y diferencia en tiempo real
  const isVESPayment = selectedPaymentMethod === 'cash_ves' || selectedPaymentMethod === 'pago_movil' || selectedPaymentMethod === 'card_debit';
  
  const givenUSD = parseFloat(String(cashGivenUSD).replace(',', '.')) || 0;
  const givenVES = parseFloat(String(cashGivenVES).replace(',', '.')) || 0;

  // Monto equivalente en la otra moneda en tiempo real
  const convertedGivenVES = isVESPayment ? givenVES : givenUSD * bcvRate;
  const convertedGivenUSD = isVESPayment ? (bcvRate > 0 ? givenVES / bcvRate : 0) : givenUSD;

  // Diferencia / Vuelto: Cuanto falta pagar o cuanto entregar de vuelto
  const rawDiffUSD = isVESPayment
    ? (bcvRate > 0 ? (givenVES - totalVES) / bcvRate : 0)
    : givenUSD - totalUSD;

  const rawDiffVES = isVESPayment
    ? givenVES - totalVES
    : (givenUSD - totalUSD) * bcvRate;

  const isCompletePayment = rawDiffUSD >= -0.001;
  const changeUSD = Math.max(0, rawDiffUSD);
  const changeVES = Math.max(0, rawDiffVES);
  const pendingUSD = Math.max(0, -rawDiffUSD);
  const pendingVES = Math.max(0, -rawDiffVES);

  // Cálculos de Pagos Mixtos Multimoneda
  const mixedPaidUSD = mixedPayments.reduce((sum, p) => sum + p.amountUSD, 0);
  const mixedPaidVES = mixedPaidUSD * bcvRate;
  const mixedPendingUSD = Math.max(0, +(totalUSD - mixedPaidUSD).toFixed(2));
  const mixedPendingVES = +(mixedPendingUSD * bcvRate).toFixed(2);
  const mixedChangeUSD = Math.max(0, +(mixedPaidUSD - totalUSD).toFixed(2));
  const mixedChangeVES = +(mixedChangeUSD * bcvRate).toFixed(2);
  const isMixedComplete = mixedPendingUSD <= 0.009;

  const handleAddMixedPayment = () => {
    const raw = parseFloat(String(mixedAmount).replace(',', '.'));
    if (isNaN(raw) || raw <= 0) {
      showToast('Ingresa un monto válido mayor a 0', 'error');
      return;
    }

    let amtUSD = 0;
    let amtVES = 0;
    if (mixedCurrency === 'USD') {
      amtUSD = raw;
      amtVES = +(raw * bcvRate).toFixed(2);
    } else {
      amtVES = raw;
      amtUSD = bcvRate > 0 ? +(raw / bcvRate).toFixed(2) : 0;
    }

    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      method: mixedMethod,
      currency: mixedCurrency,
      amountUSD: amtUSD,
      amountVES: amtVES,
      reference: mixedRef.trim() || undefined,
    };

    const nextPayments = [...mixedPayments, newEntry];
    setMixedPayments(nextPayments);

    const nextPaidUSD = nextPayments.reduce((sum, p) => sum + p.amountUSD, 0);
    const nextPendingUSD = Math.max(0, +(totalUSD - nextPaidUSD).toFixed(2));
    const nextPendingVES = +(nextPendingUSD * bcvRate).toFixed(2);

    if (mixedCurrency === 'USD') {
      setMixedAmount(nextPendingUSD > 0.009 ? nextPendingUSD.toFixed(2) : '');
    } else {
      setMixedAmount(nextPendingVES > 0.009 ? nextPendingVES.toFixed(2) : '');
    }
    setMixedRef('');
    soundEffects.playBeep();
    showToast(`✓ Abono agregado: $${amtUSD.toFixed(2)} (Bs. ${amtVES.toFixed(2)})`, 'success');
  };

  const handleRemoveMixedPayment = (id: string) => {
    const next = mixedPayments.filter(p => p.id !== id);
    setMixedPayments(next);
    const nextPaidUSD = next.reduce((sum, p) => sum + p.amountUSD, 0);
    const nextPendingUSD = Math.max(0, +(totalUSD - nextPaidUSD).toFixed(2));
    if (mixedCurrency === 'USD') {
      setMixedAmount(nextPendingUSD > 0 ? nextPendingUSD.toFixed(2) : '');
    } else {
      setMixedAmount(nextPendingUSD > 0 ? (nextPendingUSD * bcvRate).toFixed(2) : '');
    }
  };

  // Registrar venta
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    let customerDoc: string | undefined = undefined;
    let customerName: string | undefined = undefined;

    const receiptNum = `TKT-${String(Date.now()).slice(-6)}`;
    const payments: SalePayment[] = [];

    if (selectedPaymentMethod === 'mixed') {
      if (!isMixedComplete) {
        showToast('Los pagos mixtos aún no cubren el total de la venta', 'error');
        return;
      }
      mixedPayments.forEach((p) => {
        payments.push({
          method: p.method,
          amountUSD: p.amountUSD,
          amountVES: p.amountVES,
          reference: p.reference,
        });
      });
    } else if (selectedPaymentMethod === 'cash_usd') {
      payments.push({
        method: 'cash_usd',
        amountUSD: totalUSD,
        amountVES: totalVES,
      });
    } else if (selectedPaymentMethod === 'cash_ves') {
      payments.push({
        method: 'cash_ves',
        amountUSD: totalUSD,
        amountVES: totalVES,
      });
    } else if (selectedPaymentMethod === 'pago_movil') {
      if (pagoMovilDuplicateAlert?.isDuplicate) {
        showToast('🚨 Bloqueo Antifraude: No puedes registrar una venta con una referencia bancaria ya registrada.', 'error');
        soundEffects.error();
        return;
      }
      payments.push({
        method: 'pago_movil',
        amountUSD: totalUSD,
        amountVES: totalVES,
        reference: pagoMovilRef,
      });
    } else if (selectedPaymentMethod === 'card_debit') {
      payments.push({
        method: 'card_debit',
        amountUSD: totalUSD,
        amountVES: totalVES,
        reference: cardDebitRef,
      });
    } else if (selectedPaymentMethod === 'binance') {
      payments.push({
        method: 'binance',
        amountUSD: totalUSD,
        amountVES: totalVES,
        reference: binanceRef.trim() ? `Binance Pay: ${binanceRef.trim()}` : 'Binance USDT',
      });
    } else if (selectedPaymentMethod === 'credit') {
      if (!selectedCreditCustomer) {
        showToast('Seleccione un cliente para la venta a crédito', 'error');
        return;
      }
      payments.push({
        method: 'credit',
        amountUSD: totalUSD,
        amountVES: totalVES,
        reference: 'Crédito / Fiado',
      });
      customerDoc = selectedCreditCustomer.docId;
      customerName = selectedCreditCustomer.name;
    }

    const calculatedChangeUSD = selectedPaymentMethod === 'credit' ? 0 : selectedPaymentMethod === 'mixed' ? mixedChangeUSD : changeUSD;
    const calculatedChangeVES = selectedPaymentMethod === 'credit' ? 0 : selectedPaymentMethod === 'mixed' ? mixedChangeVES : changeVES;

    const newSale: LocalSale = {
      receiptNumber: receiptNum,
      timestamp: new Date().toISOString(),
      items: cart.map((i) => ({
        productId: i.productId,
        name: i.name,
        barcode: i.barcode,
        qty: i.qty,
        priceUSD: i.priceUSD,
        totalUSD: i.totalUSD,
      })),
      subtotalUSD,
      taxUSD: 0,
      totalUSD,
      totalVES,
      bcvRate,
      payments,
      changeUSD: calculatedChangeUSD,
      changeVES: calculatedChangeVES,
      cashierName: 'Caja 1',
      customerDoc,
      customerName,
      status: 'completed',
    };

    // Guardar venta, descontar inventario y asentar en Auditoría / Kardex
    await db.transaction('rw', db.sales, db.products, db.customers, db.inventoryMovements, async () => {
      await db.sales.add(newSale);
      for (const item of cart) {
        const prod = await db.products.get(item.productId);
        if (prod) {
          const nextStock = Math.max(0, +(prod.stock - item.qty).toFixed(3));
          await db.products.update(item.productId, {
            stock: nextStock,
            updatedAt: new Date().toISOString(),
          });

          // Registrar movimiento en el Kardex de Auditoría
          await db.inventoryMovements.add({
            productId: item.productId,
            productName: item.name,
            barcode: item.barcode,
            type: 'out',
            reason: 'sale',
            qtyDelta: -item.qty,
            previousStock: prod.stock,
            newStock: nextStock,
            timestamp: new Date().toISOString(),
            performedBy: 'Caja 1',
            notes: `Venta Ticket #${receiptNum} (${selectedPaymentMethod === 'mixed' ? 'Pago Mixto' : selectedPaymentMethod})`,
          });
        }
      }

      if (selectedPaymentMethod === 'credit' && selectedCreditCustomer && selectedCreditCustomer.id) {
        const currentDebt = selectedCreditCustomer.currentDebtUSD || 0;
        await db.customers.update(selectedCreditCustomer.id, {
          currentDebtUSD: currentDebt + totalUSD,
        });
      }
    });

    // Abrir gaveta automáticamente si algún pago incluyó efectivo
    const hasCash = payments.some(p => p.method === 'cash_usd' || p.method === 'cash_ves');
    if (hasCash) {
      try {
        await kickCashDrawer();
      } catch {}
    }

    // Limpiar campos
    setPagoMovilRef('');
    setCardDebitRef('');
    setMixedPayments([]);
    setMixedRef('');

    // Acumular en ventas del turno
    setShiftSales((prev) => [newSale, ...prev]);

    // Actualizar catálogo local
    await loadData();

    setLastCompletedSale(newSale);
    setShowPaymentModal(false);
    clearCart();
    setShowReceiptModal(true);
  };

  const printReceipt = async () => {
    try {
      const p = await db.settings.get('paper_width');
      const width = p?.value || '80mm';
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-paper-width', width);
        const printableWidth = width === '58mm' ? '48mm' : '72mm';
        document.documentElement.style.setProperty('--receipt-width', printableWidth);
      }
      const m = await db.settings.get('receipt_feed_margin');
      if (m?.value && typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--receipt-feed-padding', `${m.value}mm`);
      }
    } catch {}
    window.print();
  };

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden p-3 gap-3 bg-slate-100 dark:bg-[#0a192f] font-sans">
      {/* ========================================================================= */}
      {/* PANEL IZQUIERDO: Buscador, Categorías y Cuadrícula de Productos           */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
        {/* Barra de Búsqueda de Alta Visibilidad */}
        <div className="pos-white-card relative w-full bg-white dark:bg-white rounded-2xl border-2 border-slate-200 dark:border-sky-500/20 shadow-xs flex items-center px-4 py-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar producto o código de barras (F3)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-normal"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-2 py-0.5 text-xs text-slate-400 hover:text-slate-600 rounded-md shrink-0 cursor-pointer"
            >
              ✕
            </button>
          )}
          {/* Quick buttons */}
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200 shrink-0">
            {/* Pill de Turno / Caja */}
            <button
              type="button"
              onClick={() => {
                if (!activeShift) {
                  setCashShiftModalMode('open');
                } else {
                  setCashShiftModalMode('view_x');
                }
                setShowCashShiftModal(true);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer border ${
                activeShift
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700'
              }`}
              title={activeShift ? `Turno #${activeShift.id} abierto. Clic para ver arqueo` : 'Caja cerrada. Clic para registrar fondo inicial'}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${activeShift ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="hidden sm:inline">
                {activeShift ? `Turno #${activeShift.id} (${activeShift.cashierName})` : 'Abrir Turno'}
              </span>
            </button>

            {/* Botón Balanza Manual */}
            <button
              type="button"
              onClick={() => {
                setManualWeightTargetProduct(null);
                setShowManualWeightModal(true);
              }}
              title="Balanza: Clic para peso manual"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" />
            </button>
            {/* Botón Gaveta */}
            <button
              type="button"
              onClick={async () => {
                const res = await kickCashDrawer();
                showToast(res.message, 'success');
              }}
              title="Abrir gaveta de dinero (F10)"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Banknote className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BARRA DE BOTONES DE ACCIÓN RÁPIDA (Normal o Micro-Barra en Comida Rápida) */}
        {/* En Modo Minimalista Táctil (touch), se oculta para llenar todo el canvas  */}
        {/* ========================================================================= */}
        {posViewMode !== 'touch' && (
          posViewMode === 'fastfood' ? (
          <div className="bg-white dark:bg-[#0e223f] border border-slate-200 dark:border-sky-500/30 rounded-xl px-2.5 py-1.5 shadow-2xs shrink-0 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={handleTriggerMobileScanner}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-[11px] font-bold shadow-2xs cursor-pointer shrink-0"
              title="Activar escáner de código de barras en el celular vinculado"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Escanear Móvil</span>
            </button>

            <button
              type="button"
              onClick={() => openScannerModal()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-200 cursor-pointer shrink-0"
              title="Vincular celular como escáner inalámbrico"
            >
              <QrIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>Vincular QR</span>
            </button>

            <button
              type="button"
              onClick={() => setShowManualWeightModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-200 cursor-pointer shrink-0"
              title="Balanza: Pesar producto"
            >
              <Scale className="w-3.5 h-3.5 text-sky-600" />
              <span>Balanza</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                const res = await kickCashDrawer();
                showToast(res.message, 'success');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-200 cursor-pointer shrink-0"
              title="Abrir gaveta de dinero (F10)"
            >
              <Banknote className="w-3.5 h-3.5 text-amber-600" />
              <span>Gaveta (F10)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!activeShift) {
                  setCashShiftModalMode('open');
                } else {
                  setCashShiftModalMode('view_x');
                }
                setShowCashShiftModal(true);
              }}
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
        ) : (
          <div className="bg-slate-200/70 dark:bg-slate-900/80 border border-slate-300/80 dark:border-slate-800 rounded-2xl p-2.5 shadow-2xs shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-center">
            {/* 1. Botón Grande: Escanear con Celular (Logo SVG de Código de Barras con Láser) */}
            <button
              type="button"
              onClick={handleTriggerMobileScanner}
              className="h-14 px-3.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white rounded-xl font-bold flex items-center justify-between gap-2.5 shadow-xs active:scale-[0.98] transition-all cursor-pointer border border-white/20 group"
              title="Activar escáner de código de barras en el celular vinculado"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Logo en SVG de Código de Barras con Línea Láser Roja */}
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
              onClick={openScannerModal}
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
              onClick={() => {
                setManualWeightTargetProduct(null);
                setShowManualWeightModal(true);
              }}
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
              onClick={async () => {
                const res = await kickCashDrawer();
                showToast(res.message, 'success');
              }}
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

            {/* 5. Botón Grande: Turno / Caja (Apertura, Arqueo, Movimiento y Cierre) */}
            <button
              type="button"
              onClick={() => {
                if (!activeShift) {
                  setCashShiftModalMode('open');
                } else {
                  setCashShiftModalMode('view_x');
                }
                setShowCashShiftModal(true);
              }}
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
      )
    )}

        {/* ========================================================================= */}
        {/* BANDEJA DOCK: ACCESOS RÁPIDOS Y FAVORITOS (Diferenciada y Colapsable)     */}
        {/* En Modo Minimalista Táctil (touch), se oculta para llenar todo el canvas  */}
        {/* ========================================================================= */}
        {posViewMode !== 'touch' && !searchQuery.trim() && sliderProducts.length > 0 && posViewMode !== 'fastfood' && (
          <div className="shrink-0 flex flex-col gap-1.5 bg-gradient-to-r from-slate-100/90 via-slate-50/80 to-slate-100/90 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/80 p-2.5 rounded-2xl border-2 border-sky-600/20 dark:border-sky-500/20 shadow-xs transition-all">
            {/* Header de la Bandeja con Controles de Desplazamiento & Colapso */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-sky-600/15 text-sky-700 dark:text-sky-300">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>⚡ Accesos Rápidos de Caja</span>
                </span>
                <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                  {sliderProducts.length} items
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickAccessModal(true)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all active:scale-95 cursor-pointer ml-1"
                  title="Configurar los productos favoritos y accesos directos del carrusel"
                >
                  <SlidersHorizontal className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                  <span className="hidden sm:inline">Configurar</span>
                </button>
              </div>

              {/* Botones de Desplazamiento y Botón de Minimizar / Expandir */}
              <div className="flex items-center gap-1.5">
                {!isSliderCollapsed && (
                  <>
                    <button
                      type="button"
                      onClick={() => scrollSlider('left')}
                      className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center cursor-pointer transition-all active:scale-90"
                      title="Desplazar hacia la izquierda"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollSlider('right')}
                      className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center cursor-pointer transition-all active:scale-90"
                      title="Desplazar hacia la derecha"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleToggleSliderCollapsed}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
                  title={isSliderCollapsed ? 'Expandir bandeja de accesos directos' : 'Minimizar bandeja para ganar espacio'}
                >
                  {isSliderCollapsed ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span>Mostrar</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      <span>Minimizar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Carrusel Desplazable de Cards Compactas (Visible cuando no está colapsado) */}
            {!isSliderCollapsed && (
              <div
                ref={sliderRef}
                className="flex gap-2.5 overflow-x-auto snap-x scroll-smooth no-scrollbar py-1 px-0.5 animate-in fade-in duration-150"
              >
                {sliderProducts.map((p) => {
                  const isLowStock = p.stock <= p.minStock;
                  return (
                    <div
                      key={`slider-${p.id}`}
                      onClick={() => addToCart(p, 1)}
                      className="w-[270px] sm:w-[290px] h-[98px] bg-white dark:bg-slate-800 rounded-xl border-l-4 border-l-sky-600 border-y border-r border-slate-200 dark:border-slate-700 p-2 shadow-2xs hover:shadow-md hover:border-sky-500 transition-all active:scale-[0.98] cursor-pointer flex gap-2.5 items-stretch shrink-0 snap-start group select-none"
                    >
                      {/* Foto rectangular a la izquierda */}
                      <div className="w-16 sm:w-18 h-full rounded-lg bg-slate-50 dark:bg-slate-900 overflow-hidden relative border border-slate-200/80 dark:border-slate-700 shrink-0">
                        {p.image && showImages ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                            <Package className="w-5 h-5 stroke-1" />
                          </div>
                        )}
                      </div>

                      {/* Columna de Información a la derecha */}
                      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="font-mono text-[10px] font-bold text-slate-500 truncate max-w-[55px]">
                            {p.barcode ? (p.barcode.length > 4 ? p.barcode.slice(-4) : p.barcode) : '7591'}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0 truncate max-w-[95px]">
                            <span>{getCategoryEmoji(p.category)}</span>
                            <span className="uppercase tracking-wide truncate">{p.category}</span>
                          </span>
                        </div>

                        <h3
                          className="font-bold text-[12px] text-slate-900 dark:text-white leading-tight line-clamp-1 my-0.5"
                          title={p.name}
                        >
                          {p.name}
                        </h3>

                        <div className="flex items-end justify-between gap-1">
                          <div className="leading-tight flex flex-col">
                            <span className="text-[13px] font-black font-sans text-slate-950 dark:text-white tabular-numbers leading-none">
                              {formatVES(p.priceUSD * bcvRate)}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-tight mt-0.5">
                              ${p.priceUSD.toFixed(2)}
                            </span>
                          </div>

                          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0 border border-slate-200/70 dark:border-slate-600">
                            <span className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'} shrink-0`} />
                            <span>{p.stock}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* BARRA SUPERIOR: CATEGORÍAS EN TEXTO / PILLS (LÍNEA DEDICADA COMPLETA)    */}
        {/* ========================================================================= */}
        <div className="w-full shrink-0 border-b border-slate-200/80 dark:border-slate-800/80 pt-1 pb-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs sm:text-[12.5px] font-bold whitespace-nowrap transition-all duration-150 select-none active:scale-[0.97] cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--brand-primary)] text-white shadow-xs font-black ring-1 ring-[var(--brand-primary)]'
                      : 'bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BARRA INFERIOR: OPCIONES DE VISUALIZACIÓN (MÁS PEQUEÑAS Y COMPACTAS)      */}
        {/* ========================================================================= */}
        <div className="w-full flex items-center justify-between shrink-0 py-1 border-b border-slate-200/60 dark:border-slate-800/60 mb-1">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
            {filteredProducts.length} producto{filteredProducts.length === 1 ? '' : 's'}
          </span>

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 select-none shadow-2xs">
            <button
              type="button"
              onClick={() => handleSetPosViewMode('grid')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                posViewMode === 'grid'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista de Cuadrícula Visual con Imágenes"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Cuadrícula</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetPosViewMode('list')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                posViewMode === 'list'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista en Lista Compacta de Alta Densidad"
            >
              <List className="w-3 h-3" />
              <span>Lista</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetPosViewMode('touch')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                posViewMode === 'touch'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Tema Kiosco Minimalista (Iconos Fill/Outline alternados)"
            >
              <Coffee className="w-3 h-3" />
              <span>Minimalista</span>
            </button>

            {posViewMode === 'touch' && (
              <button
                type="button"
                onClick={toggleMinimalistPalette}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 shadow-2xs"
                title="Alternar entre Colores por Categoría y Escala Monocromática Minimalista"
              >
                <Palette className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span>
                  {minimalistColorPalette === 'category' ? '🎨 Rubro' : '🔘 Mono'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSetPosViewMode('fastfood')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                posViewMode === 'fastfood'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Modo Comida Rápida / Fast Food (Cuadrícula Táctil 3x3)"
            >
              <UtensilsCrossed className="w-3 h-3" />
              <span>Comida Rápida</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CATÁLOGO DE PRODUCTOS: 3 MODOS DE VISTA (CUADRÍCULA, LISTA O TÁCTIL)      */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* MODO 1: CUADRÍCULA VISUAL (GRID) */}
          {posViewMode === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3 content-start">
              {filteredProducts.map((p) => {
                const isLowStock = p.stock <= p.minStock;
                const isFixed = p.isFixedPriceVES && p.fixedPriceVES;
                const displayVES = isFixed ? p.fixedPriceVES! : (p.priceUSD * bcvRate);
                const displayUSD = isFixed ? (p.fixedPriceVES! / bcvRate) : p.priceUSD;
                return (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p, 1)}
                    className="pos-white-card bg-white rounded-2xl border-2 border-slate-200/90 dark:border-sky-500/20 p-3 shadow-sm hover:shadow-lg hover:border-sky-500 transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between group select-none"
                  >
                    <div className="flex items-center justify-between gap-1.5 w-full mb-1.5">
                      <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 truncate">
                        {p.barcode ? (p.barcode.length > 4 ? p.barcode.slice(-4) : p.barcode) : '759...'}
                      </span>
                      <div className="flex items-center gap-1">
                        {isFixed && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white shrink-0 shadow-2xs">
                            🔒 Fijo Bs.
                          </span>
                        )}
                        <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-md text-white uppercase tracking-wider shrink-0 truncate max-w-[120px] ${getCategoryBadgeColor(p.category)}`}>
                          {p.category}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-black text-[13px] text-slate-900 leading-snug my-1 line-clamp-2 min-h-[36px] flex items-center" title={p.name}>
                      {p.name}
                    </h4>

                    <div className="w-full h-24 sm:h-28 rounded-xl bg-slate-50 overflow-hidden relative border border-slate-200/80 mb-2">
                      {p.image && showImages ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <Package className="w-8 h-8 stroke-1" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-1.5 pt-1 mt-auto border-t border-slate-100">
                      <div className="leading-tight flex flex-col">
                        <span className="text-[14.5px] sm:text-[15.5px] font-black font-sans text-slate-950 tabular-numbers leading-tight">
                          {formatVES(displayVES)}
                        </span>
                        <span className="text-[11px] text-slate-600 font-bold mt-0.5">
                          ${displayUSD.toFixed(2)}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-800 shrink-0 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'} shrink-0`} />
                        <span>{p.stock}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MODO 2: LISTA COMPACTA DE ALTA DENSIDAD (LIST) */}
          {posViewMode === 'list' && (
            <div className="flex flex-col gap-1.5 content-start">
              {filteredProducts.map((p) => {
                const isLowStock = p.stock <= p.minStock;
                const isFixed = p.isFixedPriceVES && p.fixedPriceVES;
                const displayVES = isFixed ? p.fixedPriceVES! : (p.priceUSD * bcvRate);
                const displayUSD = isFixed ? (p.fixedPriceVES! / bcvRate) : p.priceUSD;
                return (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p, 1)}
                    className="pos-white-card bg-white hover:bg-sky-50/50 border-2 border-slate-200/90 dark:border-sky-500/20 rounded-xl px-3 py-2 flex items-center justify-between gap-3 shadow-xs hover:shadow-sm transition-all cursor-pointer group select-none active:scale-[0.99]"
                  >
                    {/* Miniatura / Ícono + Nombre + SKU */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.image && showImages ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400 stroke-1" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-[13px] text-slate-900 truncate" title={p.name}>
                            {p.name}
                          </span>
                          {isFixed && (
                            <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white shrink-0 shadow-2xs">
                              🔒 Fijo Bs.
                            </span>
                          )}
                          <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded text-white uppercase tracking-wider shrink-0 ${getCategoryBadgeColor(p.category)}`}>
                            {p.category}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 mt-0.5 block">
                          SKU: {p.barcode || '759...'} {(p.unit === 'kg' || (p as any).isWeighable) && '• ⚖️ Pesable'}
                        </span>
                      </div>
                    </div>

                    {/* Stock */}
                    <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 shrink-0 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'} shrink-0`} />
                      <span>{p.stock} {p.unit === 'kg' || (p as any).isWeighable ? 'kg' : 'uds'}</span>
                    </span>

                    {/* Precios duales */}
                    <div className="text-right leading-tight min-w-[110px] shrink-0">
                      <span className="font-black text-sm text-slate-950 tabular-numbers block">
                        {formatVES(displayVES)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold block">
                        ${displayUSD.toFixed(2)}
                      </span>
                    </div>

                    {/* Botón rápido de agregar */}
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-black text-base flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-all"
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* MODO 3: TÁCTIL MINIMALISTA / KIOSCO (LLENA EL CANVAS, BORDES MARCADOS, ÍCONOS FILL/OUTLINE ALTERNADOS) */}
          {posViewMode === 'touch' && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 xl:gap-5 content-start h-full py-2 pb-24">
              {filteredProducts.map((p, index) => {
                const isLowStock = p.stock <= p.minStock;
                const isFixed = p.isFixedPriceVES && p.fixedPriceVES;
                const displayVES = isFixed ? p.fixedPriceVES! : (p.priceUSD * bcvRate);
                const displayUSD = isFixed ? (p.fixedPriceVES! / bcvRate) : p.priceUSD;
                const isOutline = index % 2 === 0;
                const toneClasses = getCardToneClasses(p, index, minimalistColorPalette);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p, 1)}
                    style={(p as any).color ? { backgroundColor: (p as any).color } : undefined}
                    className={`pos-minimal-card min-h-[195px] sm:min-h-[205px] rounded-[24px] p-3.5 sm:p-4 flex flex-col justify-between items-center text-center transition-all duration-150 active:scale-[0.96] hover:scale-[1.02] cursor-pointer group select-none relative overflow-hidden hover:bg-white hover:border-slate-700 dark:hover:border-slate-300 hover:shadow-xl ${toneClasses}`}
                  >
                    {/* Tag superior discreto (Categoría o Fijo) */}
                    <div className="flex items-center justify-between w-full px-1 mb-1">
                      <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                        {p.category}
                      </span>
                      {isFixed ? (
                        <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-md bg-amber-500 text-white shrink-0 shadow-2xs">
                          🔒 Bs. Fijo
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <span>{p.stock}</span>
                        </span>
                      )}
                    </div>

                    {/* Ícono Centrado: Alternado entre Fill y Outline (Idéntico a imagen de referencia) */}
                    <div className="my-auto py-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      {getProductIconAlternated(p, isOutline)}
                    </div>

                    {/* Nombre en Mayúsculas con Espacio para 2 Líneas & Precios */}
                    <div className="w-full flex flex-col items-center mt-auto pt-1">
                      <span className="font-black text-xs sm:text-[13px] tracking-wide uppercase text-[#1e293b] dark:text-white leading-snug line-clamp-2 min-h-[34px] flex items-center justify-center text-center group-hover:text-black dark:group-hover:text-white transition-colors">
                        {p.name}
                      </span>

                      {/* Precios Limpios de Alto Contraste */}
                      <div className="flex items-baseline justify-center gap-2 mt-1.5 w-full pt-1.5 border-t border-slate-300/80 dark:border-slate-600/80">
                        <span className="font-black text-sm sm:text-base font-sans text-slate-950 dark:text-white tabular-numbers">
                          {formatVES(displayVES)}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          ${displayUSD.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* MODO 4: COMIDA RÁPIDA / RESTAURANTE & FAST FOOD (QUIOSCO TÁCTIL GASTRONÓMICO) */}
          {posViewMode === 'fastfood' && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3.5 content-start">
              {filteredProducts.map((p) => {
                const isLowStock = p.stock <= p.minStock;
                const isFixed = p.isFixedPriceVES && p.fixedPriceVES;
                const displayVES = isFixed ? p.fixedPriceVES! : (p.priceUSD * bcvRate);
                const displayUSD = isFixed ? (p.fixedPriceVES! / bcvRate) : p.priceUSD;
                return (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p, 1)}
                    className="relative h-[250px] sm:h-[275px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-200 active:scale-[0.98] cursor-pointer group select-none border border-slate-300/40 dark:border-white/10 bg-slate-900 flex flex-col justify-end"
                  >
                    {/* Foto de Fondo a Pantalla Completa */}
                    {p.image && showImages ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center text-slate-500">
                        <UtensilsCrossed className="w-16 h-16 stroke-1 text-slate-600" />
                      </div>
                    )}

                    {/* Degradado suave para garantizar contraste de textos */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                    {/* Badge superior si es Precio Fijo en Bs. o Stock bajo */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                      {isFixed && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-500 text-white shadow-md">
                          🔒 Fijo Bs.
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white border border-white/20">
                        {p.stock} {p.unit === 'kg' ? 'kg' : 'uds'}
                      </span>
                    </div>

                    {/* Caja Inferior Flotante (Overlay tipo Card Interna idéntica a la imagen de referencia) */}
                    <div className="relative m-2.5 p-3 rounded-2xl bg-black/65 backdrop-blur-md border border-white/20 text-white flex flex-col gap-0.5 z-10 shadow-lg">
                      {/* Título del Plato */}
                      <h4 className="font-bold text-[15px] sm:text-[16px] text-white leading-tight truncate drop-shadow-xs" title={p.name}>
                        {p.name}
                      </h4>

                      {/* Precio en Bolívares Gigante */}
                      <div className="font-black text-[18px] sm:text-[20px] font-sans text-white tabular-numbers leading-tight drop-shadow-xs">
                        {formatVES(displayVES)}
                      </div>

                      {/* Fila Inferior: Precio en Dólares + Pill de Categoría */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/15 mt-0.5">
                        <span className="text-xs text-slate-300 font-semibold tracking-wide">
                          ${displayUSD.toFixed(2)} USD
                        </span>

                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 text-white truncate max-w-[120px]">
                          {p.category}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-sm">
              No se encontraron productos coincidentes.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BARRA DE ATAJOS DE TECLADO INDUSTRIAL (TECLAS DE FUNCIÓN F2 A F12)        */}
        {/* Realmente funcionales: físicas o mediante clic en pantalla táctil         */}
        {/* ========================================================================= */}
        <div className="shrink-0 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-xl p-1.5 shadow-2xs flex items-center justify-between gap-1 overflow-x-auto no-scrollbar select-none">
          <button
            type="button"
            onClick={() => {
              setPrimaryCurrency((prev) => {
                const next = prev === 'VES' ? 'USD' : 'VES';
                localStorage.setItem('venematic_primary_currency', next);
                showToast(`Moneda: ${next === 'VES' ? 'Bs.' : '$'} (F2)`, 'info');
                soundEffects.playBeep();
                return next;
              });
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="Alternar moneda principal entre Bolívares y Dólares"
          >
            <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F2</span>
            <span className="text-[11px] font-extrabold">Moneda ({primaryCurrency})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              searchInputRef.current?.focus();
              searchInputRef.current?.select();
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="Enfocar buscador para escribir o escanear"
          >
            <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F3</span>
            <span className="text-[11px] font-extrabold">Buscar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (cartRef.current.length > 0) {
                setSelectedPaymentMethod('credit');
                openPaymentModal();
              } else {
                showToast('Agrega productos al carrito para venta a crédito (F4)', 'info');
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="Venta a Crédito / Fiado de clientes"
          >
            <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F4</span>
            <span className="text-[11px] font-extrabold">Crédito</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowManualWeightModal(true);
              soundEffects.playBeep();
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="Ingreso de peso manual para balanza"
          >
            <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F5</span>
            <span className="text-[11px] font-extrabold">Balanza</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNumpadMode((prev) => {
                const next = prev === 'qty' ? 'barcode' : 'qty';
                showToast(`Modo numpad: ${next === 'qty' ? 'Cantidad' : 'Código'} (F6)`, 'info');
                soundEffects.playBeep();
                return next;
              });
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="Alternar modo del teclado numérico entre Cantidad y Código"
          >
            <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F6</span>
            <span className="text-[11px] font-extrabold">Pad ({numpadMode === 'qty' ? 'Cant' : 'Cód'})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (cartRef.current.length > 0) {
                setCart([]);
                setSelectedCartItemId(null);
                soundEffects.playTrash();
                showToast('Carrito vaciado (F7)', 'info');
              } else {
                showToast('El carrito ya está vacío', 'info');
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-800 hover:text-rose-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="Limpiar carrito de venta actual"
          >
            <span className="fkey-badge-danger px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F7</span>
            <span className="text-[11px] font-extrabold">Limpiar</span>
          </button>

          <button
            type="button"
            onClick={() => openScannerModal()}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="Vincular celular como escáner inalámbrico"
          >
            <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F8</span>
            <span className="text-[11px] font-extrabold">Móvil</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCashShiftModal(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="Gestión de turno de caja y arqueo"
          >
            <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F9</span>
            <span className="text-[11px] font-extrabold">Turno</span>
          </button>

          <button
            type="button"
            onClick={() => {
              kickCashDrawer().then((res) => {
                showToast(res.message, 'success');
              });
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="Abrir gaveta de dinero físico"
          >
            <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F10</span>
            <span className="text-[11px] font-extrabold">Gaveta</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
                showToast('Pantalla Completa Activada (F11)', 'info');
              } else {
                document.exitFullscreen().catch(() => {});
                showToast('Pantalla Completa Desactivada (F11)', 'info');
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="Alternar pantalla completa"
          >
            <span className="fkey-badge px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F11</span>
            <span className="text-[11px] font-extrabold">Pantalla</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (cartRef.current.length > 0) {
                openPaymentModal();
              } else {
                showToast('Agrega productos al carrito antes de cobrar (F12)', 'error');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white border border-[var(--brand-primary)] text-xs font-black transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
            title="Cobrar venta actual"
          >
            <span className="fkey-badge-success px-2 py-0.5 rounded font-mono text-[11px] font-black tracking-wider shadow-2xs shrink-0 !text-white text-white">F12</span>
            <span className="text-[11px] uppercase tracking-wide font-black !text-white text-white">Cobrar</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PANEL DERECHO: Ticket de Venta & Teclado Numérico Industrial               */}
      {/* ========================================================================= */}
      <div className="w-[380px] lg:w-[410px] xl:w-[430px] h-full max-h-full min-h-0 flex flex-col gap-2.5 shrink-0 overflow-hidden">
        {/* Tabs: Ticket Activo | Ventas del Turno */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setRightPanelTab('cart')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
              rightPanelTab === 'cart'
                ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <span>Ticket Activo</span>
            {cart.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">{cart.length}</span>
            )}
          </button>
          <button
            onClick={() => setRightPanelTab('shift')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
              rightPanelTab === 'shift'
                ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Ventas del Turno</span>
            {shiftSales.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-[10px] font-black">{shiftSales.length}</span>
            )}
          </button>
        </div>

        {/* ---- TAB: TICKET ACTIVO ---- */}
        {rightPanelTab === 'cart' && (
          <div className="pos-white-card flex-1 min-h-0 bg-white dark:bg-white rounded-2xl border-2 border-[var(--brand-primary)]/30 dark:border-sky-500/20 shadow-md flex flex-col p-3.5 overflow-hidden">
            {/* Cabecera del Ticket */}
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                  Ticket Activo
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                  {cart.length} {cart.length === 1 ? 'ítem' : 'items'}
                </span>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Vaciar
                </button>
              )}
            </div>

            {/* Lista de Ítems */}
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
              {cart.map((item) => {
                const isSelected = selectedCartItemId === item.productId;
                return (
                  <div
                    key={item.productId}
                    onClick={() => setSelectedCartItemId(item.productId)}
                    className={`py-2 px-2 flex items-center justify-between gap-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-500/70 shadow-xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        ${item.priceUSD.toFixed(2)} c/u × {item.qty}
                      </p>
                    </div>

                    {/* Controles de Cantidad */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateItemQty(item.productId, item.qty - 1);
                        }}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded flex items-center justify-center text-xs cursor-pointer border border-transparent dark:border-slate-700"
                      >
                        -
                      </button>
                      <span className="w-7 text-center font-mono font-bold text-xs tabular-numbers text-slate-900 dark:text-white">
                        {item.qty}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateItemQty(item.productId, item.qty + 1);
                        }}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded flex items-center justify-center text-xs cursor-pointer border border-transparent dark:border-slate-700"
                      >
                        +
                      </button>
                    </div>

                    {/* Total por línea */}
                    <div className="text-right min-w-[75px]">
                      <span className="text-xs font-mono font-black text-slate-900 dark:text-slate-100 block tabular-numbers">
                        {formatVES(item.totalUSD * bcvRate)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block tabular-numbers">
                        ${item.totalUSD.toFixed(2)}
                      </span>
                    </div>

                    {/* Eliminar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.productId);
                      }}
                      className="text-slate-400 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 px-1 text-sm font-bold cursor-pointer"
                      title="Eliminar ítem"
                    >
                      &times;
                    </button>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 gap-3 select-none">
                  <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 stroke-[1.25]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">El ticket está vacío.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Escanee o seleccione productos.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Gran Total del Ticket con Separación Nítida Anti-Colisión */}
            <div
              className="pt-3 border-t-2 space-y-2 mt-auto shrink-0 -mx-3 -mb-3 p-3.5 rounded-b-2xl bg-slate-50 dark:bg-[#0e1826] border-slate-200 dark:border-slate-700/80 shadow-xs"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    TOTAL A COBRAR (BS)
                  </span>
                  <span className="text-xs font-mono font-black text-sky-900 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 rounded border border-sky-300 dark:border-sky-800">
                    Tasa: Bs. {bcvRate.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xl sm:text-2xl font-black font-sans text-emerald-700 dark:text-emerald-400 tracking-tight tabular-numbers break-all leading-tight">
                    {formatVES(totalVES)}
                  </span>
                  <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white shrink-0">
                    {formatUSD(totalUSD)}
                  </span>
                </div>
              </div>

              {/* Botón Principal COBRAR (F12) */}
              <button
                onClick={openPaymentModal}
                disabled={cart.length === 0}
                className="w-full py-3.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] active:scale-[0.99] text-white font-black text-sm rounded-xl uppercase tracking-wider shadow-md transition-all disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed dark:disabled:bg-slate-800 dark:disabled:text-slate-400 dark:disabled:border dark:disabled:border-slate-700 disabled:opacity-100 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>COBRAR VENTA</span>
                <span className="text-xs text-emerald-200 font-mono font-bold">F12</span>
              </button>
            </div>
          </div>
        )}

        {/* ---- TAB: VENTAS DEL TURNO ---- */}
        {rightPanelTab === 'shift' && (
          <div className="flex-1 bg-white dark:bg-slate-800/70 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xs flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-[var(--brand-primary)] text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wide">Ventas del Turno</span>
                <p className="text-[10px] text-emerald-100">{shiftSales.length} ventas · Esta sesión</p>
              </div>
            </div>
            {/* Lista de ventas de turno */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {shiftSales.map((sale, idx) => (
                <div key={sale.receiptNumber || idx} className="p-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 font-mono">{sale.receiptNumber}</span>
                    <span className="text-[10px] text-slate-400 block">{sale.timestamp?.slice(11, 19)}</span>
                  </div>
                  <div className="text-right font-mono font-bold">
                    <span className="text-slate-900">${sale.totalUSD.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 block">Bs. {sale.totalVES.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TECLADO NUMÉRICO TÁCTIL INDUSTRIAL */}
        <div className="pos-white-card bg-white dark:bg-white rounded-2xl border-2 border-slate-200/90 dark:border-sky-500/20 shadow-md p-3 space-y-2 shrink-0">
          {/* Top row: Cantidad | Código | Input */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNumpadMode('qty')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-2 ${
                numpadMode === 'qty'
                  ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              Cantidad
            </button>
            <button
              type="button"
              onClick={() => setNumpadMode('barcode')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-2 ${
                numpadMode === 'barcode'
                  ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              Código
            </button>
            <div className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-500 dark:text-slate-300 font-bold truncate uppercase shadow-2xs">
              {numpadValue ? (
                <span className="text-[var(--brand-primary)] dark:text-emerald-400 font-bold font-mono text-sm">{numpadValue}</span>
              ) : (
                'PRÓXIMO PRODUC...'
              )}
            </div>
          </div>

          {/* Grid de teclas con contornos oscurecidos y alto contraste táctil (Botones Blancos) */}
          <div className="grid grid-cols-4 gap-1.5">
            {/* Fila 1: 7, 8, 9, Backspace */}
            <button type="button" onClick={() => handleNumpadKey('7')} style={{ color: '#0f172a' }} className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center">
              <span style={{ color: '#0f172a' }} className="font-black text-lg">7</span>
            </button>
            <button type="button" onClick={() => handleNumpadKey('8')} style={{ color: '#0f172a' }} className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center">
              <span style={{ color: '#0f172a' }} className="font-black text-lg">8</span>
            </button>
            <button type="button" onClick={() => handleNumpadKey('9')} style={{ color: '#0f172a' }} className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center">
              <span style={{ color: '#0f172a' }} className="font-black text-lg">9</span>
            </button>
            <button type="button" onClick={() => handleNumpadKey('BACK')} style={{ color: '#0f172a' }} className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs flex items-center justify-center cursor-pointer" title="Borrar">
              <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6-7h12a2 2 0 012 2v10a2 2 0 01-2 2H9l-6-7z" />
              </svg>
            </button>

            {/* Fila 2: 4, 5, 6, C */}
            <button type="button" onClick={() => handleNumpadKey('4')} style={{ color: '#0f172a' }} className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center">
              <span style={{ color: '#0f172a' }} className="font-black text-lg">4</span>
            </button>
            <button type="button" onClick={() => handleNumpadKey('5')} style={{ color: '#0f172a' }} className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center">
              <span style={{ color: '#0f172a' }} className="font-black text-lg">5</span>
            </button>
            <button type="button" onClick={() => handleNumpadKey('6')} style={{ color: '#0f172a' }} className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center">
              <span style={{ color: '#0f172a' }} className="font-black text-lg">6</span>
            </button>
            <button type="button" onClick={() => handleNumpadKey('C')} className="h-10 rounded-xl bg-rose-100 hover:bg-rose-200 border-2 border-rose-300 hover:border-rose-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center" title="Limpiar">
              <span className="text-rose-700 font-black text-base">C</span>
            </button>

            {/* Fila 3: 1, 2, 3, Enter */}
            <button type="button" onClick={() => handleNumpadKey('1')} style={{ color: '#0f172a' }} className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center">
              <span style={{ color: '#0f172a' }} className="font-black text-lg">1</span>
            </button>
            <button type="button" onClick={() => handleNumpadKey('2')} style={{ color: '#0f172a' }} className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center">
              <span style={{ color: '#0f172a' }} className="font-black text-lg">2</span>
            </button>
            <button type="button" onClick={() => handleNumpadKey('3')} style={{ color: '#0f172a' }} className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center">
              <span style={{ color: '#0f172a' }} className="font-black text-lg">3</span>
            </button>
            <button
              type="button"
              onClick={handleNumpadApply}
              className="row-span-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] border-2 border-[var(--brand-primary)] text-white font-bold text-xs flex flex-col items-center justify-center leading-tight transition-all active:scale-95 shadow-xs cursor-pointer p-1"
            >
              <span className="font-black text-sm text-white">Enter</span>
              <span className="text-[10px] text-white/90 font-semibold">Aplicar</span>
            </button>

            {/* Fila 4: 0 (span 2), . */}
            <button type="button" onClick={() => handleNumpadKey('0')} style={{ color: '#0f172a' }} className="pos-calc-key col-span-2 h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center">
              <span style={{ color: '#0f172a' }} className="font-black text-lg">0</span>
            </button>
            <button type="button" onClick={() => handleNumpadKey('.')} style={{ color: '#0f172a' }} className="pos-calc-key h-10 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center">
              <span style={{ color: '#0f172a' }} className="font-black text-lg">.</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE LIQUIDACIÓN Y COBRO MULTIMONEDA (USD / BS)                       */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[94vh] overflow-hidden flex flex-col transition-all duration-200">
            {/* Header del Modal */}
            <div className="px-5 sm:px-6 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-700/80 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl shadow-inner shrink-0">
                  💳
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg sm:text-xl tracking-tight text-white uppercase">
                      Cobrar Venta
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      POS Express
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[11px] text-slate-400 font-medium">Tasa Oficial BCV:</span>
                    <span className="font-bold text-xs text-sky-300 font-mono bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                      Bs. {bcvRate.toFixed(2)} / USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Destacado */}
              <div className="flex items-center gap-3 ml-auto">
                <div className="text-right leading-tight bg-slate-800/95 px-4 py-2 rounded-2xl border border-slate-700 shadow-inner min-w-[170px]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">
                    Total a Cobrar
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 block tabular-numbers tracking-tight leading-none">
                    {formatUSD(totalUSD)}
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-amber-300 block mt-1.5 tabular-numbers border-t border-slate-700/70 pt-1">
                    {formatVES(totalVES)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-lg transition-colors border border-slate-700 cursor-pointer"
                  title="Cerrar (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
              {/* Selector de Métodos de Pago en Tarjetas Fluidas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span>Selecciona la Forma de Pago:</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium hidden sm:inline-block">
                    {selectedPaymentMethod === 'cash_usd' && '💵 Efectivo en Dólares ($)'}
                    {selectedPaymentMethod === 'cash_ves' && '🇻🇪 Efectivo en Bolívares (Bs.)'}
                    {selectedPaymentMethod === 'pago_movil' && '📲 Pago Móvil Interbancario'}
                    {selectedPaymentMethod === 'card_debit' && '💳 Tarjeta de Débito / Punto de Venta'}
                    {selectedPaymentMethod === 'binance' && '🟡 Binance Pay USDT (1:1)'}
                    {selectedPaymentMethod === 'mixed' && '🔄 Pago Mixto / Combinado'}
                    {selectedPaymentMethod === 'credit' && '🤝 Venta a Crédito / Fiado'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {[
                    { id: 'cash_usd', icon: '💵', label: 'Efectivo $', sub: 'Dólares' },
                    { id: 'cash_ves', icon: '🇻🇪', label: 'Efectivo Bs', sub: 'Bolívares' },
                    { id: 'pago_movil', icon: '📲', label: 'Pago Móvil', sub: 'Inmediato' },
                    { id: 'card_debit', icon: '💳', label: 'Punto Débito', sub: 'Voucher' },
                    { id: 'binance', icon: '🟡', label: 'Binance', sub: 'USDT Pay' },
                    { id: 'mixed', icon: '🔄', label: 'Pago Mixto', sub: 'Multimoneda' },
                    { id: 'credit', icon: '🤝', label: 'Fiado', sub: 'A Crédito' },
                  ].map((m) => {
                    const isSelected = selectedPaymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedPaymentMethod(m.id as any)}
                        className={`h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center p-2 text-center active:scale-95 cursor-pointer relative overflow-hidden group ${
                          isSelected
                            ? 'bg-sky-700 text-white border-sky-500 ring-4 ring-sky-500/25 shadow-lg font-black scale-[1.02]'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <span className="text-2xl mb-0.5 filter drop-shadow-xs group-hover:scale-110 transition-transform">
                          {m.icon}
                        </span>
                        <span className="text-xs font-black leading-tight block truncate w-full">
                          {m.label}
                        </span>
                        <span className={`text-[10px] font-medium leading-tight block opacity-80 ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                          {m.sub}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector de Cliente si es A Crédito (Fiado) */}
              {selectedPaymentMethod === 'credit' && (
                <div className="bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-800/40">
                    <span className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-300">
                        <Users className="w-5 h-5" />
                      </div>
                      <span>Seleccionar Cliente para Venta a Crédito (Fiado)</span>
                    </span>
                    <span className="text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/50 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700">
                      Cuenta Corriente / Crédito
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1.5">
                      Buscar y seleccionar cliente registrado:
                    </label>
                    <select
                      value={selectedCreditCustomer?.id || ''}
                      onChange={(e) => {
                        const cid = Number(e.target.value);
                        const c = customersList.find((item) => item.id === cid) || null;
                        setSelectedCreditCustomer(c);
                      }}
                      className="w-full h-12 px-4 bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 shadow-xs cursor-pointer"
                    >
                      <option value="">-- Haz clic aquí para seleccionar el cliente --</option>
                      {customersList.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.name} ({cust.docId}) — Deuda Actual: ${cust.currentDebtUSD || 0} / Límite: ${cust.creditLimitUSD || 100}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCreditCustomer ? (
                    <div className="p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-amber-200 dark:border-amber-800/60 shadow-xs space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-[11px] uppercase font-bold text-slate-400 block">Titular del Crédito</span>
                          <strong className="text-base text-slate-900 dark:text-white font-black">{selectedCreditCustomer.name}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] uppercase font-bold text-slate-400 block">Documento / Cédula</span>
                          <span className="font-mono font-black text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            {selectedCreditCustomer.docId}
                          </span>
                        </div>
                      </div>

                      {/* Tarjetas KPI de Estado Financiero del Cliente */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Deuda Acumulada</span>
                          <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 block mt-0.5">
                            ${(selectedCreditCustomer.currentDebtUSD || 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Límite Aprobado</span>
                          <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-200 block mt-0.5">
                            ${(selectedCreditCustomer.creditLimitUSD || 100).toFixed(2)}
                          </span>
                        </div>

                        {(() => {
                          const available = Math.max(0, (selectedCreditCustomer.creditLimitUSD || 100) - (selectedCreditCustomer.currentDebtUSD || 0));
                          const canCover = available >= totalUSD;
                          return (
                            <div className={`p-3 rounded-xl border text-center ${
                              canCover
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                            }`}>
                              <span className="text-[11px] font-bold uppercase block">Crédito Disponible</span>
                              <span className="text-lg font-black font-mono block mt-0.5">
                                ${available.toFixed(2)}
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      {totalUSD > Math.max(0, (selectedCreditCustomer.creditLimitUSD || 100) - (selectedCreditCustomer.currentDebtUSD || 0)) && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold">
                          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                          <span>¡Atención! El monto total de la venta (${totalUSD.toFixed(2)}) supera el cupo de crédito disponible del cliente (${Math.max(0, (selectedCreditCustomer.creditLimitUSD || 100) - (selectedCreditCustomer.currentDebtUSD || 0)).toFixed(2)}).</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-100/50 dark:bg-amber-900/20 border border-dashed border-amber-300 dark:border-amber-700/60 rounded-xl text-center">
                      <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                        Selecciona un cliente del menú desplegable para verificar su disponibilidad de crédito y cargar la cuenta.
                      </p>
                    </div>
                  )}

                  {customersList.length === 0 && (
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium bg-amber-100/60 dark:bg-amber-900/30 p-3 rounded-xl border border-amber-300">
                      No hay clientes registrados en el sistema. Puedes agregarlos desde el menú Clientes (F4).
                    </p>
                  )}
                </div>
              )}

              {/* SECCIÓN PAGO MIXTO / MULTIMONEDA */}
              {selectedPaymentMethod === 'mixed' && (
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
                  {/* Resumen de Montos en Pago Mixto */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Cuenta</span>
                      <span className="text-xl font-black font-mono text-slate-900 dark:text-white block mt-0.5">${totalUSD.toFixed(2)}</span>
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 block mt-0.5">Bs. {totalVES.toFixed(2)}</span>
                    </div>

                    <div className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Abonado</span>
                      <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">${mixedPaidUSD.toFixed(2)}</span>
                      <span className="text-xs font-mono font-bold text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5">Bs. {mixedPaidVES.toFixed(2)}</span>
                    </div>

                    <div className={`p-3.5 rounded-2xl border-2 transition-all ${
                      isMixedComplete
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200 shadow-sm'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-200 shadow-sm'
                    }`}>
                      <span className="text-[10px] uppercase font-bold block tracking-wider">
                        {isMixedComplete ? 'Vuelto / Cambio' : 'Falta por Cobrar'}
                      </span>
                      <span className="text-xl font-black font-mono block mt-0.5">
                        {isMixedComplete ? `$${mixedChangeUSD.toFixed(2)}` : `$${mixedPendingUSD.toFixed(2)}`}
                      </span>
                      <span className="text-xs font-mono font-bold block mt-0.5 opacity-90">
                        {isMixedComplete ? `Bs. ${mixedChangeVES.toFixed(2)}` : `Bs. ${mixedPendingVES.toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {/* Formulario para Agregar Nuevo Abono */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-xs">
                    <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider block">
                      + Agregar Método y Monto de Abono:
                    </span>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { id: 'cash_usd', label: 'Efectivo $', cur: 'USD', icon: '💵' },
                        { id: 'cash_ves', label: 'Efectivo Bs', cur: 'VES', icon: '🇻🇪' },
                        { id: 'pago_movil', label: 'Pago Móvil', cur: 'VES', icon: '📲' },
                        { id: 'card_debit', label: 'Punto Débito', cur: 'VES', icon: '💳' },
                        { id: 'binance', label: 'Binance USDT', cur: 'USD', icon: '🟡' },
                        { id: 'zelle', label: 'Zelle $', cur: 'USD', icon: '⚡' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setMixedMethod(item.id as any);
                            setMixedCurrency(item.cur as any);
                            if (item.cur === 'USD') {
                              setMixedAmount(mixedPendingUSD > 0 ? mixedPendingUSD.toFixed(2) : '');
                            } else {
                              setMixedAmount(mixedPendingVES > 0 ? mixedPendingVES.toFixed(2) : '');
                            }
                          }}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            mixedMethod === item.id
                              ? 'bg-sky-700 text-white border-sky-500 shadow-sm font-black'
                              : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-5 relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                          {mixedCurrency === 'USD' ? '$' : 'Bs.'}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Monto a abonar"
                          value={mixedAmount}
                          onChange={(e) => setMixedAmount(e.target.value)}
                          className="w-full h-11 pl-9 pr-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-base font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          maxLength={12}
                          placeholder={
                            mixedMethod === 'cash_usd' || mixedMethod === 'cash_ves'
                              ? 'Sin ref. (Efectivo)'
                              : 'Últimos 4 dígitos Ref.'
                          }
                          disabled={mixedMethod === 'cash_usd' || mixedMethod === 'cash_ves'}
                          value={mixedRef}
                          onChange={(e) => setMixedRef(e.target.value)}
                          className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-40"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <button
                          type="button"
                          onClick={handleAddMixedPayment}
                          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <span>+ Agregar Abono</span>
                        </button>
                      </div>
                    </div>

                    {/* Pre-cálculo equivalente */}
                    {parseFloat(mixedAmount) > 0 && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between px-1">
                        <span>Equivalente en tasa oficial:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {mixedCurrency === 'USD'
                            ? `Bs. ${(parseFloat(mixedAmount) * bcvRate).toFixed(2)}`
                            : `$${bcvRate > 0 ? (parseFloat(mixedAmount) / bcvRate).toFixed(2) : 0}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Lista de Abonos Registrados */}
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400 block mb-2">
                      Abonos Registrados ({mixedPayments.length}):
                    </span>
                    {mixedPayments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-4 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        Aún no has agregado abonos. Selecciona el método arriba, escribe el monto y presiona "+ Agregar Abono".
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {mixedPayments.map((p, idx) => (
                          <div
                            key={p.id}
                            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between shadow-2xs text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                                {idx + 1}
                              </span>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                                  {p.method === 'cash_usd' ? '💵 Efectivo $' :
                                   p.method === 'cash_ves' ? '🇻🇪 Efectivo Bs' :
                                   p.method === 'pago_movil' ? '📲 Pago Móvil' :
                                   p.method === 'card_debit' ? '💳 Punto Débito' :
                                   p.method === 'binance' ? '🟡 Binance USDT' :
                                   p.method === 'zelle' ? '⚡ Zelle' : p.method}
                                </span>
                                {p.reference && (
                                  <span className="text-[11px] font-mono text-slate-400">
                                    Ref: {p.reference}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right font-mono">
                                <span className="font-black text-slate-900 dark:text-white block text-sm">${p.amountUSD.toFixed(2)}</span>
                                <span className="text-xs text-amber-600 dark:text-amber-400 block">Bs. {p.amountVES.toFixed(2)}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveMixedPayment(p.id)}
                                className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center font-bold text-base cursor-pointer transition-colors"
                                title="Eliminar abono"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECCIONES DE PAGO ÚNICO (Efectivo / Punto / Pago Móvil / Binance) */}
              {selectedPaymentMethod !== 'mixed' && selectedPaymentMethod !== 'credit' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Billetes Rápidos en USD */}
                  {selectedPaymentMethod === 'cash_usd' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Billetes y Montos Rápidos ($):
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">Haz clic para auto-rellenar</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                        <button
                          type="button"
                          onClick={() => setCashGivenUSD(totalUSD.toFixed(2))}
                          className="h-11 rounded-xl border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-900 dark:text-emerald-200 font-black text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                        >
                          Exacto (${totalUSD.toFixed(2)})
                        </button>
                        {['1', '5', '10', '20', '50', '100'].map((bill) => (
                          <button
                            key={bill}
                            type="button"
                            onClick={() => setCashGivenUSD(bill)}
                            className="h-11 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-mono font-black text-sm text-slate-800 dark:text-white shadow-2xs active:scale-95 transition-all cursor-pointer"
                          >
                            ${bill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Billetes Rápidos en Bolívares */}
                  {selectedPaymentMethod === 'cash_ves' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Montos Rápidos en Bolívares (Bs.):
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">Haz clic para auto-rellenar</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                        <button
                          type="button"
                          onClick={() => setCashGivenVES(totalVES.toFixed(2))}
                          className="h-11 rounded-xl border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-900 dark:text-emerald-200 font-black text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                        >
                          Exacto (Bs. {totalVES.toFixed(2)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashGivenVES(String(Math.ceil(totalVES)))}
                          className="h-11 rounded-xl border-2 border-sky-400 dark:border-sky-600 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-900 dark:text-sky-200 font-black text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                          title="Redondear al entero superior"
                        >
                          Redondo (Bs. {Math.ceil(totalVES)})
                        </button>
                        {['500', '1000', '2000', '5000'].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setCashGivenVES(amt)}
                            className="h-11 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-mono font-black text-xs text-slate-800 dark:text-white shadow-2xs active:scale-95 transition-all cursor-pointer"
                          >
                            Bs. {amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Panel Principal en 2 Columnas Fluidas: Entrada de Monto a la Izquierda y Vuelto a la Derecha */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    {/* Columna Izquierda: Monto Entregado por el Cliente */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block">
                            {isVESPayment ? 'Monto Recibido del Cliente (Bs):' : 'Monto Recibido del Cliente ($):'}
                          </label>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {isVESPayment ? 'VES' : 'USD'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                          {isVESPayment
                            ? 'Ingresa los bolívares que entrega el cliente en caja'
                            : 'Ingresa los dólares que entrega el cliente en caja'}
                        </p>

                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400 font-mono">
                            {isVESPayment ? 'Bs.' : '$'}
                          </span>
                          {isVESPayment ? (
                            <input
                              type="number"
                              step="0.01"
                              value={cashGivenVES}
                              onChange={(e) => setCashGivenVES(e.target.value)}
                              className="w-full h-16 pl-14 pr-4 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-2xl text-right font-mono font-black text-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 shadow-xs"
                              placeholder="0.00"
                              autoFocus
                            />
                          ) : (
                            <input
                              type="number"
                              step="0.01"
                              value={cashGivenUSD}
                              onChange={(e) => setCashGivenUSD(e.target.value)}
                              className="w-full h-16 pl-12 pr-4 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-2xl text-right font-mono font-black text-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 shadow-xs"
                              placeholder="0.00"
                              autoFocus
                            />
                          )}
                        </div>
                      </div>

                      {/* Conversor en Tiempo Real */}
                      <div className="flex items-center justify-between px-3.5 py-2.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-xs">
                        <span className="text-sky-900 dark:text-sky-300 font-bold flex items-center gap-1.5">
                          <span>💱</span>
                          <span>Equivalente en tiempo real:</span>
                        </span>
                        <span className="font-mono font-black text-sky-800 dark:text-sky-200 text-sm tabular-numbers">
                          {isVESPayment ? (
                            <>≈ {formatUSD(convertedGivenUSD)}</>
                          ) : (
                            <>≈ {formatVES(convertedGivenVES)}</>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Columna Derecha: Tarjeta de Vuelto o Diferencia */}
                    <div
                      className={`p-5 rounded-2xl border-2 flex flex-col justify-between transition-all shadow-md ${
                        isCompletePayment
                          ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-400 text-white'
                          : 'bg-gradient-to-br from-rose-600 to-rose-700 border-rose-400 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-white/20">
                        <span className="text-xs font-black uppercase tracking-wider block text-white drop-shadow-sm">
                          {isCompletePayment ? '✓ Vuelto / Cambio a Entregar:' : '⚠️ Monto Faltante por Pagar:'}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                          {isCompletePayment ? 'Pago Completo' : 'Pendiente'}
                        </span>
                      </div>

                      <div className="py-4 text-center">
                        {isCompletePayment ? (
                          <>
                            <span className="text-4xl font-black font-mono text-white block tabular-numbers tracking-tight drop-shadow-md">
                              {isVESPayment ? formatVES(changeVES) : formatUSD(changeUSD)}
                            </span>
                            <span className="text-sm font-bold font-mono text-emerald-100 block tabular-numbers mt-1.5 opacity-90">
                              ≈ {isVESPayment ? formatUSD(changeUSD) : formatVES(changeVES)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-3xl font-black font-mono text-white block tabular-numbers tracking-tight drop-shadow-md">
                              Faltan {isVESPayment ? formatVES(pendingVES) : formatUSD(pendingUSD)}
                            </span>
                            <span className="text-xs font-bold font-mono text-rose-100 block tabular-numbers mt-1.5 opacity-90">
                              ≈ {isVESPayment ? formatUSD(pendingUSD) : formatVES(pendingVES)}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="pt-2 border-t border-white/20 text-center">
                        <span className="text-xs font-semibold text-white/90">
                          {isCompletePayment
                            ? 'Diferencia a favor del cliente lista para entregar'
                            : 'Ingresa el monto recibido completo para habilitar la confirmación'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Campos Opcionales de Referencia */}
                  {selectedPaymentMethod === 'pago_movil' && (
                    <div className={`p-4 rounded-2xl border-2 space-y-3 transition-colors ${
                      pagoMovilAutoStatus === 'confirmed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600'
                        : pagoMovilAutoStatus === 'monitoring'
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    }`}>

                      {/* ESTADO: Confirmación automática exitosa */}
                      {pagoMovilAutoStatus === 'confirmed' && pagoMovilAutoConfirmation && (
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">✅</span>
                          <div className="flex-1">
                            <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">¡Pago Móvil Confirmado Automáticamente!</p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                              Banco: {pagoMovilAutoConfirmation.bancoOrigen} · Bs. {pagoMovilAutoConfirmation.monto.toFixed(2)}
                            </p>
                            {pagoMovilAutoConfirmation.nombrePagador && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-500">Pagador: {pagoMovilAutoConfirmation.nombrePagador}</p>
                            )}
                            <p className="text-xs font-mono font-bold text-emerald-900 dark:text-emerald-200 mt-1">
                              Ref: {pagoMovilAutoConfirmation.referencia}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ESTADO: Monitoreando Gmail */}
                      {pagoMovilAutoStatus === 'monitoring' && (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-blue-800 dark:text-blue-300">Esperando confirmación por Gmail...</p>
                            <p className="text-[11px] text-blue-600 dark:text-blue-400">El sistema verificará el email bancario automáticamente (±2% tolerancia)</p>
                          </div>
                        </div>
                      )}

                      {/* ESTADO: Gmail no configurado o error — campo manual */}
                      {(pagoMovilAutoStatus === 'idle' || pagoMovilAutoStatus === 'error') && (
                        <>
                          {!pagoMovilGmailConfigured && (
                            <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
                              <span>💡</span>
                              <span>Conecta Gmail en <b>Configuración → Pagos</b> para confirmación automática</span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Comprobante / Referencia de Pago Móvil:
                              </label>
                              <span className="text-[10.5px] font-black text-sky-600 dark:text-sky-400 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> KlikPOS Shield Antifraude
                              </span>
                            </div>
                            <input
                              type="text"
                              maxLength={20}
                              placeholder="Ej: 00123456789 (mínimo 4 dígitos)"
                              value={pagoMovilRef}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPagoMovilRef(val);
                                checkDuplicateReference(val);
                              }}
                              className={`w-full h-11 px-4 border-2 rounded-xl text-sm font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none transition-colors ${
                                pagoMovilDuplicateAlert?.isDuplicate
                                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20'
                                  : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500'
                              }`}
                            />

                            {/* Alerta de Referencia Duplicada / Reciclada */}
                            {pagoMovilDuplicateAlert?.isDuplicate && (
                              <div className="mt-2.5 p-3 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 rounded-xl flex items-start gap-2.5 text-rose-900 dark:text-rose-200 shadow-sm animate-pulse">
                                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                <div className="text-xs leading-snug">
                                  <p className="font-black text-rose-700 dark:text-rose-300">🚨 ¡ALERTA ANTIFRAUDE! REFERENCIA DUPLICADA</p>
                                  <p className="mt-0.5">
                                    Esta referencia ya fue registrada en el <b>Ticket #{pagoMovilDuplicateAlert.receiptNumber}</b> el {new Date(pagoMovilDuplicateAlert.date || '').toLocaleString('es-VE')} por <b>Bs. {pagoMovilDuplicateAlert.amountVES?.toFixed(2)}</b>.
                                  </p>
                                  <p className="font-bold text-rose-800 dark:text-rose-200 mt-1">
                                    ⛔ Posible captura reciclada o intento de pago duplicado. Verifique con el cliente antes de despachar.
                                  </p>
                                </div>
                              </div>
                            )}

                            {!pagoMovilDuplicateAlert?.isDuplicate && pagoMovilRef.trim().length >= 4 && (
                              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold px-1">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span>Referencia única comprobada en historial de ventas.</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Campo de referencia siempre editable si se confirmó (para corrección) */}
                      {pagoMovilAutoStatus === 'confirmed' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                            Referencia detectada (editable si es necesario):
                          </label>
                          <input
                            type="text"
                            value={pagoMovilRef}
                            onChange={(e) => setPagoMovilRef(e.target.value)}
                            className="w-full h-9 px-3 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl text-sm font-mono text-emerald-900 dark:text-emerald-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      )}
                    </div>
                  )}


                  {selectedPaymentMethod === 'card_debit' && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Últimos 4 dígitos del Voucher del Punto de Venta:
                      </label>
                      <input
                        type="text"
                        maxLength={8}
                        placeholder="Ej: 4921"
                        value={cardDebitRef}
                        onChange={(e) => setCardDebitRef(e.target.value)}
                        className="w-full h-11 px-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  )}

                  {selectedPaymentMethod === 'binance' && (
                    <div className="bg-amber-50/70 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🟡</span>
                        <div>
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">Binance Pay / USDT</span>
                          <span className="text-[11px] text-amber-700 dark:text-amber-300">Tasa 1:1 con USD ({formatUSD(totalUSD)} ≈ {formatVES(totalVES)})</span>
                        </div>
                      </div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        ID de Transacción / Order ID de Binance (Opcional):
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 284910284"
                        value={binanceRef}
                        onChange={(e) => setBinanceRef(e.target.value)}
                        className="w-full h-11 px-4 border-2 border-amber-300 dark:border-amber-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* SELECTOR DE FORMATO DE COMPROBANTE AL MOMENTO DE COBRAR */}
            <div className="px-5 sm:px-6 py-3 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-base">🖨️</span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Formato de Comprobante / Ticket:
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setReceiptType('mixed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    receiptType === 'mixed'
                      ? 'bg-sky-700 text-white shadow-sm ring-2 ring-sky-500/40'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>🔄</span>
                  <span>Ticket Transaccional (Multimoneda)</span>
                  {receiptType === 'mixed' && <span>✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setReceiptType('fiscal_seniat')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    receiptType === 'fiscal_seniat'
                      ? 'bg-indigo-700 text-white shadow-sm ring-2 ring-indigo-500/40'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>🏛️</span>
                  <span>Factura Fiscal SENIAT (Bs)</span>
                  {receiptType === 'fiscal_seniat' && <span>✓</span>}
                </button>
              </div>
            </div>

            {/* Acciones del Modal */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="h-12 px-6 border-2 border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Cancelar</span>
                <kbd className="text-[11px] font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">Esc</kbd>
              </button>

              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={
                  selectedPaymentMethod === 'credit'
                    ? !selectedCreditCustomer
                    : selectedPaymentMethod === 'mixed'
                    ? !isMixedComplete
                    : !isCompletePayment
                }
                className="h-12 px-8 flex-1 max-w-md bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
              >
                <span>
                  {selectedPaymentMethod === 'mixed'
                    ? `Confirmar Cobro Mixto (${formatUSD(totalUSD)})`
                    : selectedPaymentMethod === 'credit'
                    ? `Autorizar Fiado (${formatUSD(totalUSD)})`
                    : 'Confirmar e Imprimir Venta'}
                </span>
                <kbd className="text-[11px] font-mono px-2 py-0.5 bg-emerald-700/80 rounded text-emerald-100 border border-emerald-500/50">
                  Enter ↵
                </kbd>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DUAL DE TICKETS: TICKET MIXTO (CLIENTE) Y FACTURA FISCAL SENIAT (BS) */}
      {/* ========================================================================= */}
      {showReceiptModal && lastCompletedSale && (() => {
        const isCreditSale = Boolean(
          Array.isArray(lastCompletedSale.payments) &&
          lastCompletedSale.payments.some((p) => p.method === 'credit')
        );

        return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-2xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
            {/* Encabezado y Selector de Tipo de Ticket */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isCreditSale ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
                <span className="font-black text-xs uppercase tracking-wider text-slate-100">
                  {isCreditSale ? 'Nota de Entrega No Fiscal (Crédito)' : 'Comprobantes de Venta'}
                </span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-white font-bold text-xl leading-none px-1.5 py-0.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Pestañas de Selección de Ticket */}
            <div className="flex border-b border-slate-200 bg-slate-100 p-1.5 gap-1.5 shrink-0">
              {isCreditSale ? (
                <div className="flex-1 py-1.5 px-3 rounded-xl text-xs font-black bg-amber-600 text-white flex items-center justify-center gap-2 shadow-xs">
                  <span>📋</span>
                  <span>Nota de Entrega / Vale de Fiado (Documento No Fiscal)</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setReceiptType('mixed')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      receiptType === 'mixed'
                        ? 'bg-sky-700 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <span>🔄</span>
                    <span>Ticket Mixto (Cliente)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptType('fiscal_seniat')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      receiptType === 'fiscal_seniat'
                        ? 'bg-indigo-700 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <span>🏛️</span>
                    <span>Factura SENIAT (Bs)</span>
                  </button>
                </>
              )}
            </div>

            {/* Selector de Opciones de Código QR al Pie del Ticket */}
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
              <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                <QrIcon className="w-3.5 h-3.5 text-sky-600" />
                Código QR al pie:
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setQrReceiptMode('medium')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    qrReceiptMode === 'medium'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                  title="Código QR tamaño mediano con texto descriptivo debajo"
                >
                  Mediano (+ texto)
                </button>
                <button
                  type="button"
                  onClick={() => setQrReceiptMode('large')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    qrReceiptMode === 'large'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                  title="Código QR tamaño grande centrado sin texto"
                >
                  Grande (sin texto)
                </button>
                <button
                  type="button"
                  onClick={() => setQrReceiptMode('none')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    qrReceiptMode === 'none'
                      ? 'bg-slate-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                  title="Ocultar código QR en la impresión"
                >
                  Sin QR
                </button>
              </div>
            </div>

            {/* Cuerpo del Ticket con Scroll */}
            <div className="p-4 bg-white font-mono text-xs text-slate-900 space-y-2 overflow-y-auto flex-1 border-b border-slate-200">
              {receiptType === 'mixed' || isCreditSale ? (
                /* ------------------------------------------------------------- */
                /* 1. TICKET MIXTO / NOTA DE ENTREGA NO FISCAL                   */
                /* ------------------------------------------------------------- */
                <div id="thermal-receipt" className="space-y-2">
                  <div className="text-center space-y-0.5">
                    {storeInfo.showLogoOnReceipt && storeInfo.logoUrl && (
                      <div className="flex justify-center pb-1">
                        <img
                          src={storeInfo.logoUrl}
                          alt="Logo Negocio"
                          className="max-h-14 max-w-[170px] object-contain filter grayscale contrast-125 mx-auto"
                        />
                      </div>
                    )}
                    <h4 className="font-black text-sm text-slate-950 uppercase">
                      {storeInfo.name}
                    </h4>
                    <p className="text-[10px] text-slate-600 font-bold">RIF: {storeInfo.rif}</p>
                    <p className="text-[10px] text-slate-600">{storeInfo.address}</p>
                    {storeInfo.phone && <p className="text-[10px] text-slate-600">Telf: {storeInfo.phone}</p>}
                    {isCreditSale ? (
                      <div className="mt-1 space-y-0.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 text-[10px] font-black border border-amber-400">
                          *** NOTA DE ENTREGA / VALE DE FIADO ***
                        </span>
                        <div className="text-[9px] text-amber-900 font-bold uppercase tracking-wider">
                          DOCUMENTO NO FISCAL • VENTA A CRÉDITO
                        </div>
                      </div>
                    ) : (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 text-[10px] font-black border border-sky-300">
                        TICKET DE CONTROL MULTIMONEDA
                      </span>
                    )}
                  </div>

                  <div className="border-t border-b border-dashed border-slate-400 py-1.5 space-y-0.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">{isCreditSale ? 'Nota de Entrega N°:' : 'Ticket N°:'}</span>
                      <span className="font-black">{isCreditSale ? `NE-${lastCompletedSale.receiptNumber}` : lastCompletedSale.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Fecha / Hora:</span>
                      <span>{new Date(lastCompletedSale.timestamp).toLocaleString('es-VE')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tasa Oficial BCV:</span>
                      <span className="font-black">Bs. {lastCompletedSale.bcvRate.toFixed(2)}</span>
                    </div>
                    {isCreditSale && (
                      <>
                        <div className="flex justify-between pt-1 border-t border-slate-200">
                          <span className="text-slate-600">Cliente Deudor:</span>
                          <span className="font-black text-slate-900">{lastCompletedSale.customerName || 'CLIENTE A CRÉDITO'}</span>
                        </div>
                        {lastCompletedSale.customerDoc && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">C.I. / RIF:</span>
                            <span className="font-mono font-bold text-slate-900">{lastCompletedSale.customerDoc}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-amber-900 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                          <span>Condición de Pago:</span>
                          <span>PENDIENTE POR COBRAR (CRÉDITO)</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Listado de Productos */}
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between font-bold text-slate-500 border-b border-slate-200 pb-0.5 text-[10px]">
                      <span>CANT / DESCRIPCIÓN</span>
                      <span>TOTAL USD / BS</span>
                    </div>
                    {lastCompletedSale.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-baseline gap-1">
                        <span className="flex-1 min-w-0 pr-1 truncate font-bold">
                          {it.qty}x {it.name}
                        </span>
                        <div className="text-right shrink-0 whitespace-nowrap">
                          <span className="font-bold tabular-numbers block">
                            {formatUSD(it.totalUSD)}
                          </span>
                          <span className="text-[10px] text-slate-500 tabular-numbers">
                            Bs. {(it.totalUSD * lastCompletedSale.bcvRate).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desglose de Formas de Pago Mixto */}
                  <div className="border-t border-dashed border-slate-400 pt-2 space-y-1">
                    <div className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                      Desglose de Formas de Pago:
                    </div>
                    {Array.isArray(lastCompletedSale.payments) && lastCompletedSale.payments.length > 0 ? (
                      lastCompletedSale.payments.map((p, i) => (
                        <div key={i} className="flex justify-between text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          <span className="font-semibold text-slate-700">
                            {p.method === 'cash_usd' && '💵 Efectivo Divisa ($)'}
                            {p.method === 'binance' && '🪙 Binance Pay (USDT)'}
                            {p.method === 'cash_ves' && '💵 Efectivo Bolívares (Bs.)'}
                            {p.method === 'pago_movil' && '📱 Pago Móvil (Bs.)'}
                            {p.method === 'card_debit' && '💳 Tarjeta / Punto (Bs.)'}
                            {p.method === 'card_credit' && '💳 Tarjeta Crédito (Bs.)'}
                            {p.method === 'zelle' && '🏦 Zelle ($)'}
                            {p.method === 'credit' && '📝 Crédito de Confianza (Fiado)'}
                            {p.reference && <span className="text-[9px] text-slate-500 ml-1 font-mono">[{p.reference}]</span>}
                          </span>
                          <span className="font-mono font-bold">
                            {p.amountUSD > 0 && formatUSD(p.amountUSD)}
                            {p.amountVES > 0 && ` / Bs. ${p.amountVES.toFixed(2)}`}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-600">
                        ✅ Venta Liquidada
                      </div>
                    )}

                    {/* Totales */}
                    <div className="border-t border-slate-300 pt-1.5 mt-1 space-y-0.5">
                      <div className="flex justify-between font-black text-sm">
                        <span>TOTAL USD ($):</span>
                        <span className="text-slate-950">{formatUSD(lastCompletedSale.totalUSD)}</span>
                      </div>
                      <div className="flex justify-between font-black text-xs text-sky-900">
                        <span>TOTAL BOLÍVARES (Bs.):</span>
                        <span>{formatVES(lastCompletedSale.totalVES)}</span>
                      </div>
                      {(lastCompletedSale.changeUSD > 0 || lastCompletedSale.changeVES > 0) && (
                        <div className="flex justify-between text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                          <span>Vuelto Entregado:</span>
                          <span>{formatUSD(lastCompletedSale.changeUSD)} (Bs. {lastCompletedSale.changeVES.toFixed(2)})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pie del ticket / Firma para venta a crédito */}
                  {isCreditSale ? (
                    <div className="pt-3 pb-1 border-t border-dashed border-slate-400 text-center space-y-3">
                      <p className="text-[9px] text-slate-700 uppercase font-bold leading-tight px-1">
                        Acepto haber recibido a satisfacción la mercancía descrita y me comprometo formalmente al pago del saldo deudor estipulado.
                      </p>
                      <div className="pt-8 border-b-2 border-slate-800 w-3/4 mx-auto" />
                      <div className="text-[10px] font-bold text-slate-900">
                        Firma de Conformidad del Cliente
                        <div className="text-[9px] text-slate-600 font-mono mt-0.5">
                          C.I. / RIF: {lastCompletedSale.customerDoc || '____________________'}
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-500 uppercase font-mono tracking-tight">
                        DOCUMENTO NO FISCAL • VÁLIDO PARA CONTROL INTERNO Y DESPACHO A CRÉDITO
                      </p>
                    </div>
                  ) : (
                    <div className="text-center pt-2 text-[10px] text-slate-500 font-medium">
                      {storeInfo.footerMessage || '¡Gracias por su compra! • Comprobante Multimoneda'}
                    </div>
                  )}

                  {/* Código QR al final debajo en el ticket */}
                  {qrReceiptMode !== 'none' && ticketQrDataUrl && (
                    <div className="pt-2 border-t border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
                      <img
                        src={ticketQrDataUrl}
                        alt="QR Ticket"
                        className={qrReceiptMode === 'large' ? 'w-40 h-40 object-contain mx-auto' : 'w-24 h-24 object-contain mx-auto'}
                      />
                      {qrReceiptMode === 'medium' && (
                        <p className="text-[8px] text-slate-500 font-mono mt-0.5 leading-tight">
                          Ticket: {lastCompletedSale.receiptNumber} • Total: Bs. {lastCompletedSale.totalVES.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* ------------------------------------------------------------- */
                /* 2. FACTURA FISCAL SENIAT EN BS TOTALES (CONTADOR / SENIAT)    */
                /* ------------------------------------------------------------- */
                <div id="seniat-receipt" className="space-y-2">
                  <div className="text-center space-y-0.5 border-b border-slate-300 pb-2">
                    {storeInfo.showLogoOnReceipt && storeInfo.logoUrl && (
                      <div className="flex justify-center pb-1">
                        <img
                          src={storeInfo.logoUrl}
                          alt="Logo Negocio"
                          className="max-h-14 max-w-[170px] object-contain filter grayscale contrast-125 mx-auto"
                        />
                      </div>
                    )}
                    <h4 className="font-black text-sm text-slate-950 uppercase tracking-tight">
                      {storeInfo.name}
                    </h4>
                    <p className="text-[11px] font-black text-slate-800">RIF: {storeInfo.rif}</p>
                    <p className="text-[10px] text-slate-600">DOMICILIO FISCAL: {storeInfo.address.toUpperCase()}</p>
                    {storeInfo.phone && <p className="text-[10px] text-slate-600">ZONA POSTAL 1010 • TELF: {storeInfo.phone}</p>}
                    <div className="mt-1 pt-1 border-t border-slate-300">
                      <span className="font-black text-xs tracking-wider bg-slate-900 text-white px-3 py-0.5 rounded uppercase">
                        FACTURA FISCAL
                      </span>
                    </div>
                  </div>

                  <div className="border-b border-dashed border-slate-400 py-1.5 space-y-0.5 text-[11px]">
                    <div className="flex justify-between font-bold">
                      <span>FACTURA N°:</span>
                      <span className="font-mono text-slate-950">FACT-{lastCompletedSale.receiptNumber.replace(/[^0-9]/g, '').slice(-8) || '00000042'}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>N° CONTROL:</span>
                      <span className="font-mono text-slate-950">00-{lastCompletedSale.receiptNumber.replace(/[^0-9]/g, '').slice(-6) || '000042'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">FECHA DE EMISIÓN:</span>
                      <span>{new Date(lastCompletedSale.timestamp).toLocaleDateString('es-VE')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">HORA DE EMISIÓN:</span>
                      <span>{new Date(lastCompletedSale.timestamp).toLocaleTimeString('es-VE')}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-600">CLIENTE / RAZÓN SOCIAL:</span>
                      <span className="font-bold">{lastCompletedSale.customerName || 'CLIENTE GENERAL'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">RIF / C.I.:</span>
                      <span className="font-mono font-bold">V-99999999-9</span>
                    </div>
                  </div>

                  {/* Tabla de Renglones en 100% Bolívares */}
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between font-bold text-slate-700 border-b border-slate-300 pb-0.5 text-[10px]">
                      <span>CANT / DESCRIPCIÓN</span>
                      <span className="text-right">TOTAL BS. (ALÍC.)</span>
                    </div>
                    {lastCompletedSale.items.map((it, idx) => {
                      const itemTotalBs = it.totalUSD * lastCompletedSale.bcvRate;
                      return (
                        <div key={idx} className="flex justify-between items-baseline gap-1">
                          <span className="flex-1 min-w-0 pr-1 truncate font-bold">
                            {it.qty}x {it.name}
                          </span>
                          <span className="font-bold tabular-numbers text-right shrink-0 whitespace-nowrap">
                            Bs. {itemTotalBs.toFixed(2)} (G)
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Liquidación Impositiva SENIAT en Bolívares */}
                  {(() => {
                    const totalVES = lastCompletedSale.totalVES;
                    const baseImponible = totalVES / 1.16;
                    const iva16 = totalVES - baseImponible;
                    // Verificar si hubo pagos en divisas o crypto para reflejar retención IGTF 3%
                    const hasForeignPay = Array.isArray(lastCompletedSale.payments) &&
                      lastCompletedSale.payments.some((p) => ['cash_usd', 'binance', 'zelle'].includes(p.method));
                    const igtfMonto = hasForeignPay ? (totalVES * 0.03) : 0;
                    const granTotalBs = totalVES + igtfMonto;

                    return (
                      <div className="border-t-2 border-slate-900 pt-2 space-y-1 text-[11px]">
                        <div className="flex justify-between text-slate-700">
                          <span>BASE IMPONIBLE (G 16.00%):</span>
                          <span className="font-mono font-bold">Bs. {baseImponible.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>IMPUESTO AL VALOR AGREGADO (16%):</span>
                          <span className="font-mono font-bold">Bs. {iva16.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Exento:</span>
                          <span className="font-mono">Bs. 0.00</span>
                        </div>
                        {hasForeignPay && (
                          <div className="flex justify-between text-indigo-900 font-semibold bg-indigo-50 px-1 py-0.5 rounded">
                            <span>IGTF PERCIBIDO (3.00% Divisa/Crypto):</span>
                            <span className="font-mono font-bold">Bs. {igtfMonto.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-t border-slate-400 pt-1 flex justify-between font-black text-sm text-slate-950 bg-slate-100 p-1.5 rounded">
                          <span>TOTAL FACTURADO BS:</span>
                          <span className="font-mono text-base">Bs. {granTotalBs.toFixed(2)}</span>
                        </div>

                        {/* Datos Informativos del Banco Central de Venezuela */}
                        <div className="pt-1.5 border-t border-dashed border-slate-300 space-y-0.5 text-[10px] text-slate-600">
                          <div className="flex justify-between">
                            <span>Tipo de Cambio Oficial BCV:</span>
                            <span className="font-mono font-bold">Bs. {lastCompletedSale.bcvRate.toFixed(2)} / USD</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Equivalencia Referencial en USD:</span>
                            <span className="font-mono font-bold">${lastCompletedSale.totalUSD.toFixed(2)} USD</span>
                          </div>
                        </div>

                        <div className="text-center pt-2 text-[9px] text-slate-500 leading-tight">
                          DOCUMENTO EMITIDO CONFORME A LA PROVIDENCIA ADMINISTRATIVA SENIAT SNAT/2011/00071 • VÁLIDO PARA EL LIBRO ESPECIAL DE VENTAS DEL CONTADOR
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Botones de Acción e Impresión */}
            <div className="p-3 bg-slate-100 flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="py-2 px-3 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={printReceipt}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors text-white ${
                  isCreditSale ? 'bg-amber-600 hover:bg-amber-700' : 'bg-sky-700 hover:bg-sky-800'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>{isCreditSale ? 'Imprimir Vale de Fiado (No Fiscal)' : 'Imprimir Este Ticket'}</span>
              </button>
              {!isCreditSale && (
                <button
                  type="button"
                  onClick={() => {
                    setReceiptType(receiptType === 'mixed' ? 'fiscal_seniat' : 'mixed');
                    setTimeout(() => printReceipt(), 200);
                  }}
                  className="py-2 px-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1 transition-colors"
                  title="Cambiar al otro formato e imprimir"
                >
                  <span>{receiptType === 'mixed' ? '📄 Imprimir Fiscal SENIAT' : '🔄 Imprimir Ticket Mixto'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: VINCULAR CELULAR COMO ESCÁNER INALÁMBRICO & AGREGAR PRODUCTOS      */}
      {/* ========================================================================= */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 tracking-tight">
                    Vincular Celular como Escáner
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pistola de código de barras y registro móvil con foto
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScannerModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido Modal */}
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              {/* Código QR */}
              <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm relative group">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Escáner QR"
                    className="w-56 h-56 object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-sky-700" />
                    <span className="text-xs font-semibold">Generando código QR...</span>
                  </div>
                )}
              </div>

              {/* Estado de Conexión */}
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${
                  phoneConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    phoneConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                ></span>
                <span>
                  {phoneConnected
                    ? `¡Celular Conectado! (${phoneDeviceName || 'Móvil'})`
                    : 'Esperando escaneo del código QR...'}
                </span>
              </div>

              {/* Instrucciones Paso a Paso */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-left space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <span className="text-slate-600">
                    Asegúrate de que tu celular esté conectado al <b>mismo Wi-Fi</b> que esta computadora.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <span className="text-slate-600">
                    Abre la cámara del celular, apunta a este código QR y presiona el enlace.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <span className="text-slate-600">
                    Verás un botón <b>"Instalar App"</b> para guardarla en la pantalla de inicio de tu celular, consultar inventario, precios en Bs/$ y escanear códigos al instante.
                  </span>
                </div>
              </div>

              {/* URL directa */}
              {scannerUrl && (
                <div className="w-full text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    O abre este enlace en el navegador de tu móvil:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={scannerUrl}
                      className="flex-1 px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono text-slate-700 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(scannerUrl);
                        showToast('Enlace copiado al portapapeles', 'info');
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowScannerModal(false)}
                className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Listo, Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ingreso Manual de Peso para Balanzas sin cable */}
      <ManualWeightModal
        isOpen={showManualWeightModal}
        onClose={() => {
          setShowManualWeightModal(false);
          setManualWeightTargetProduct(null);
        }}
        onApply={handleApplyManualWeight}
        targetProduct={manualWeightTargetProduct}
        availableProducts={products}
        bcvRate={bcvRate}
        initialWeightKg={scaleReading.weight > 0 ? scaleReading.weight : pendingQuantity || 0}
      />

      {/* Modal Profesional de Gestión de Turno y Arqueo Físico de Caja */}
      <CashShiftModal
        isOpen={showCashShiftModal}
        onClose={() => setShowCashShiftModal(false)}
        initialMode={cashShiftModalMode}
        activeShift={activeShift}
        bcvRate={bcvRate}
        onShiftUpdated={(updated) => setActiveShift(updated)}
        storeInfo={storeInfo}
      />

      {/* Modal de Configuración Rápida de Accesos Directos del Slider para Cajeros */}
      {showQuickAccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#121c29] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                  <SlidersHorizontal className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    Configuración de Accesos Directos del Slider
                  </h3>
                  <p className="text-xs text-slate-500">
                    Marca los artículos que deseas tener a un clic en la barra superior de caja
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAccessModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              <PosQuickAccessSettings />
            </div>
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowQuickAccessModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Cerrar y Volver al Punto de Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOAST FLOTANTE DE NOTIFICACIONES (ESCÁNER & EVENTOS)                       */}
      {/* ========================================================================= */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs font-bold pointer-events-auto ${
              toastMessage.type === 'success'
                ? 'bg-emerald-700 text-white border-emerald-600'
                : toastMessage.type === 'error'
                ? 'bg-rose-700 text-white border-rose-600'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
            {toastMessage.type === 'info' && <Smartphone className="w-4 h-4 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
