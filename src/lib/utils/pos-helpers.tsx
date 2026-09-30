import React from 'react';
import { LocalProduct } from '@/lib/db';
import { Icon } from '@iconify/react';
import {
  Package,
  Coffee,
  Croissant,
  Cake,
  Cookie,
  Pizza,
  Sandwich,
  Milk,
  Beef,
  Apple,
  CupSoda,
  Wine,
  Gift,
  ShoppingBag,
} from 'lucide-react';

export const getCategoryEmoji = (category: string) => {
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

export const getCategoryBadgeColor = (category: string) => {
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

export const getProductVectorIcon = (p: LocalProduct) => {
  if (p.icon) {
    return <Icon icon={p.icon} className="w-9 h-9 sm:w-11 sm:h-11" />;
  }
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

export const getProductIconAlternated = (p: LocalProduct, isOutline: boolean) => {
  if (p.icon) {
    return (
      <Icon
        icon={p.icon}
        className="w-12 h-12 text-[#1e293b] dark:text-slate-100 transition-transform duration-200"
      />
    );
  }
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

export const getCardToneClasses = (p: LocalProduct, index: number, paletteMode: 'category' | 'mono' = 'category') => {
  if ((p as any).color) {
    return 'shadow-2xs border-2 border-slate-300 dark:border-slate-600';
  }

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

  const text = `${p.category || ''} ${p.name || ''}`.toLowerCase();

  if (text.includes('carne') || text.includes('pollo') || text.includes('res') || text.includes('cerdo') || text.includes('meat') || text.includes('chuleta')) {
    return 'bg-[#ffe4e6] dark:bg-[#33181d] text-slate-950 dark:text-rose-100 border-2 border-[#fecdd3] dark:border-[#632a35] hover:border-[#fb7185] dark:hover:border-[#993e50] shadow-2xs';
  }

  if (text.includes('charcuter') || text.includes('jamon') || text.includes('jamón') || text.includes('salchicha') || text.includes('tocineta')) {
    return 'bg-[#fce7f3] dark:bg-[#311728] text-slate-950 dark:text-pink-100 border-2 border-[#fbcfe8] dark:border-[#5f284e] hover:border-[#f472b6] dark:hover:border-[#943b78] shadow-2xs';
  }

  if (text.includes('lacteo') || text.includes('lácteo') || text.includes('leche') || text.includes('queso') || text.includes('mantequilla') || text.includes('dairy')) {
    return 'bg-[#e0f2fe] dark:bg-[#142638] text-slate-950 dark:text-sky-100 border-2 border-[#bae6fd] dark:border-[#22486b] hover:border-[#38bdf8] dark:hover:border-[#3874aa] shadow-2xs';
  }

  if (text.includes('fruta') || text.includes('verdura') || text.includes('hortaliza') || text.includes('vegetal') || text.includes('produce') || text.includes('manzana') || text.includes('papa')) {
    return 'bg-[#dcfce7] dark:bg-[#132c1c] text-slate-950 dark:text-emerald-100 border-2 border-[#bbf7d0] dark:border-[#205232] hover:border-[#4ade80] dark:hover:border-[#338150] shadow-2xs';
  }

  if (text.includes('café') || text.includes('cafe') || text.includes('espresso') || text.includes('te') || text.includes('té') || text.includes('latte')) {
    return 'bg-[#f5ede4] dark:bg-[#2e231c] text-slate-950 dark:text-amber-100 border-2 border-[#d6c5b3] dark:border-[#5a4332] hover:border-[#bca48d] dark:hover:border-[#8c6b50] shadow-2xs';
  }

  if (text.includes('pan') || text.includes('croissant') || text.includes('bakery') || text.includes('torta') || text.includes('cake') || text.includes('dulce') || text.includes('postre')) {
    return 'bg-[#fef3c7] dark:bg-[#2d2210] text-slate-950 dark:text-amber-100 border-2 border-[#fcd34d] dark:border-[#5c4418] hover:border-[#f59e0b] dark:hover:border-[#966f28] shadow-2xs';
  }

  if (text.includes('viveres') || text.includes('víveres') || text.includes('arroz') || text.includes('harina') || text.includes('pasta') || text.includes('aceite') || text.includes('grano')) {
    return 'bg-[#fef9c3] dark:bg-[#292614] text-slate-950 dark:text-yellow-100 border-2 border-[#fde047] dark:border-[#4d4822] hover:border-[#eab308] dark:hover:border-[#7a7235] shadow-2xs';
  }

  if (text.includes('bebida') || text.includes('refresco') || text.includes('jugo') || text.includes('agua') || text.includes('soda') || text.includes('beverage')) {
    return 'bg-[#ccfbf1] dark:bg-[#102b28] text-slate-950 dark:text-teal-100 border-2 border-[#99f6e4] dark:border-[#1e524d] hover:border-[#2dd4bf] dark:hover:border-[#308179] shadow-2xs';
  }

  if (text.includes('limpieza') || text.includes('detergente') || text.includes('jabon') || text.includes('jabón') || text.includes('papel') || text.includes('aseo')) {
    return 'bg-[#fae8ff] dark:bg-[#2a1733] text-slate-950 dark:text-purple-100 border-2 border-[#f5d0fe] dark:border-[#4d285e] hover:border-[#e879f9] dark:hover:border-[#783e92] shadow-2xs';
  }

  const mod = index % 3;
  if (mod === 0) {
    return 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white border-2 border-slate-300 dark:border-slate-600 hover:border-slate-500 shadow-2xs';
  } else if (mod === 1) {
    return 'bg-[#dce3ec] dark:bg-slate-800/90 text-slate-950 dark:text-slate-100 border-2 border-[#9cb1c5] dark:border-slate-500 hover:border-slate-600 shadow-2xs';
  } else {
    return 'bg-[#d4dfea] dark:bg-slate-800/80 text-slate-950 dark:text-slate-100 border-2 border-[#93a9be] dark:border-slate-500 hover:border-slate-600 shadow-2xs';
  }
};
