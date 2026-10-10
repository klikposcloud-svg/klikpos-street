'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  ScanLine,
  PackagePlus,
  Wifi,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  DollarSign,
  Barcode,
  Image as ImageIcon,
  Send,
  Search,
  Download,
  ShoppingBag,
  Tag,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Coins,
  Receipt,
  Scale,
  Copy,
  FileText,
  Users,
  Settings,
  History,
  Printer,
  X,
  Building2,
  Globe,
  Sliders,
  Share2,
  Phone,
  MapPin,
  Calculator,
  TrendingUp,
  Check,
  Store,
  Clock,
  ArrowLeft,
  FileSpreadsheet,
  UserPlus,
  PhoneCall,
  MessageCircle,
  Percent,
  Edit3,
  Laptop,
  Radio,
  QrCode,
  Monitor,
  Server,
  Link2,
  Unlink,
  Package,
} from 'lucide-react';
import { removeBackgroundToWhiteCanvas } from '@/lib/background-remover';
import { Icon } from '@iconify/react';
import { db } from '@/lib/db';
import masterCatalogData from '@/lib/data/master-catalog.json';
import VisualPacksModal from '@/components/marketplace/VisualPacksModal';
import { registerTrialInstallation } from '@/lib/licensing/trial-manager';

interface ScannedHistoryItem {
  barcode: string;
  timestamp: string;
  status: 'sent' | 'error';
}

interface MobileCatalogItem {
  id?: number | string;
  barcode: string;
  name: string;
  category: string;
  priceUSD: number;
  stock: number;
  image?: string;
  icon?: string;
  color?: string;
  isFixedPriceVES?: boolean;
  fixedPriceVES?: number;
}

interface MobileCartItem {
  productId: number | string;
  barcode: string;
  name: string;
  qty: number;
  priceUSD: number;
  totalUSD: number;
  image?: string;
  isFixedPriceVES?: boolean;
  fixedPriceVES?: number;
}

// Icono Alternado Outline / Fill y Vectorial para Móvil
const getMobileProductIcon = (p: MobileCatalogItem, isOutline: boolean) => {
  if (p.icon) {
    return (
      <Icon 
        icon={p.icon} 
        className="w-10 h-10 text-slate-800 transition-transform group-hover:scale-110 drop-shadow-xs" 
      />
    );
  }

  const text = `${p.category || ''} ${p.name || ''}`.toLowerCase();

  // 1. Fast Food / Hamburguesa / Perro / Pizza
  if (text.includes('burger') || text.includes('hamburguesa') || text.includes('pizza') || text.includes('perro') || text.includes('snack') || text.includes('sandwich')) {
    if (isOutline) {
      return (
        <svg className="w-10 h-10 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11h16a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-1a1 1 0 0 1 1-1Z" />
          <path d="M6 11V7a6 6 0 0 1 12 0v4" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      );
    }
    return (
      <svg className="w-10 h-10 fill-current text-slate-800" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12v1h20v-1c0-5.52-4.48-10-10-10zm-8 13h16v1c0 2.21-1.79 4-4 4H8c-2.21 0-4-1.79-4-4v-1zm0 3h16v2H4z" />
      </svg>
    );
  }

  // 2. Café / Desayuno
  if (text.includes('cafe') || text.includes('café') || text.includes('coffee') || text.includes('espresso') || text.includes('latte') || text.includes('te') || text.includes('té')) {
    if (isOutline) {
      return (
        <svg className="w-10 h-10 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" y1="2" x2="6" y2="4" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
      );
    }
    return (
      <svg className="w-10 h-10 fill-current text-slate-800" viewBox="0 0 24 24">
        <path d="M4 19h16v2H4z" />
        <path d="M20 8h-2V5H4v9c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-1h2c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 4h-2v-2h2v2z" />
        <path d="M7 2h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
      </svg>
    );
  }

  // 3. Panadería / Croissant / Bakery
  if (text.includes('pan') || text.includes('croissant') || text.includes('bakery') || text.includes('hojaldre') || text.includes('pastel')) {
    if (isOutline) {
      return (
        <svg className="w-10 h-10 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4.6 13.4 4.8 4.8a2 2 0 0 0 2.8 0l7-7a6 6 0 0 0-8.5-8.5l-7 7a2 2 0 0 0 0 2.8z" />
          <path d="m8.5 8.5 7 7" />
          <path d="m11 5 7 7" />
          <path d="m6 10 7 7" />
        </svg>
      );
    }
    return (
      <svg className="w-10 h-10 fill-current text-slate-800" viewBox="0 0 24 24">
        <path d="M12 4c-4.42 0-8 3.58-8 8 0 1.66.51 3.2 1.38 4.49L3 18.5c-.55.55-.55 1.45 0 2 .55.55 1.45.55 2 0l2.01-2.01C8.29 19.36 10.05 20 12 20s3.71-.64 4.99-1.51L19 20.5c.55.55 1.45.55 2 0 .55-.55.55-1.45 0-2l-2.38-2.01C19.49 15.2 20 13.66 20 12c0-4.42-3.58-8-8-8zm-2 3c.73 0 1.43.14 2.08.38l-1.04 2.08c-.34-.09-.69-.14-1.04-.14-.73 0-1.42.17-2.04.47L7 7.75C7.9 7.28 8.92 7 10 7zm4 0c1.08 0 2.1.28 3 .75l-.96 2.04c-.62-.3-1.31-.47-2.04-.47-.35 0-.7.05-1.04.14L12.92 7.38C13.57 7.14 14.27 7 15 7z" />
      </svg>
    );
  }

  // 4. Postres / Dulces / Tortas
  if (text.includes('torta') || text.includes('dulce') || text.includes('postre') || text.includes('cake') || text.includes('delicate') || text.includes('pie')) {
    if (isOutline) {
      return (
        <svg className="w-10 h-10 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
          <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
          <path d="M2 21h20" />
          <path d="M7 8v2" />
          <path d="M12 8v2" />
          <path d="M17 8v2" />
        </svg>
      );
    }
    return (
      <svg className="w-10 h-10 fill-current text-slate-800" viewBox="0 0 24 24">
        <path d="M12 2c-1.1 0-2 .9-2 2 0 .19.03.37.08.54C7.72 5.3 6 7.42 6 10c0 .34.03.67.1 1H5c-1.1 0-2 .9-2 2v1h18v-1c0-1.1-.9-2-2-2h-1.1c.07-.33.1-.66.1-1 0-2.58-1.72-4.7-4.08-5.46.05-.17.08-.35.08-.54 0-1.1-.9-2-2-2zm-7 13v5c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-5H5z" />
      </svg>
    );
  }

  // 5. Víveres / Goods / Abarrotes / Arroz
  if (text.includes('goods') || text.includes('shopping') || text.includes('viveres') || text.includes('víveres') || text.includes('mercado') || text.includes('arroz') || text.includes('harina')) {
    if (isOutline) {
      return (
        <svg className="w-10 h-10 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    }
    return (
      <svg className="w-10 h-10 fill-current text-slate-800" viewBox="0 0 24 24">
        <path d="M16 6V4c0-2.21-1.79-4-4-4S8 1.79 8 4v2H3c-1.1 0-2 .9-2 2l1.6 13.6c.12 1.05 1.01 1.85 2.07 1.85h14.66c1.06 0 1.95-.8 2.07-1.85L23 8c0-1.1-.9-2-2-2h-5zm-6-2c0-1.1.9-2 2-2s2 .9 2 2v2h-4V4zm8 16H6L4.71 8H8v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h3.29L18 20z" />
      </svg>
    );
  }

  // 6. Lácteos / Leche / Queso
  if (text.includes('leche') || text.includes('lacteo') || text.includes('lácteo') || text.includes('queso') || text.includes('mantequilla')) {
    if (isOutline) {
      return (
        <svg className="w-10 h-10 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2h8" />
          <path d="M9 2v3a4 4 0 0 1-.8 2.4L6 10.4A4 4 0 0 0 5 13v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a4 4 0 0 0-1-2.6l-2.2-3A4 4 0 0 1 15 5V2" />
        </svg>
      );
    }
    return (
      <svg className="w-10 h-10 fill-current text-slate-800" viewBox="0 0 24 24">
        <path d="M9 2h6v2H9zm9 7.5V6H6v3.5l2 2V21c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-9.5l2-2zM14 20h-4v-7h4v7zm-2-9l-1-1V8h2v2l-1 1z" />
      </svg>
    );
  }

  // 7. Carnes / Pollo / Res / Charcutería
  if (text.includes('carne') || text.includes('pollo') || text.includes('res') || text.includes('cerdo') || text.includes('chuleta') || text.includes('jamon') || text.includes('jamón')) {
    if (isOutline) {
      return (
        <svg className="w-10 h-10 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12.5" cy="8.5" r="2.5" />
          <path d="M12.5 2a6.5 6.5 0 0 0-6.22 4.6c-1.1 3.13-.07 6.57 2.37 8.66A8 8 0 1 0 19 8.5h-6.5" />
        </svg>
      );
    }
    return (
      <svg className="w-10 h-10 fill-current text-slate-800" viewBox="0 0 24 24">
        <path d="M19.43 12.98c-.1-.4-.25-.79-.43-1.15-1.42-2.84-4.83-4.14-7.85-2.99l-2.02.77c-.52.2-1.09.2-1.61 0l-2.02-.77C3.12 7.9 1.48 10.9 2.06 13.56c.55 2.53 2.7 4.44 5.3 4.44 1.13 0 2.22-.36 3.12-1.04l1.52-1.14 1.52 1.14c.9.68 1.99 1.04 3.12 1.04 2.6 0 4.75-1.91 5.3-4.44.1-.47.11-.94.07-1.41zM8 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
      </svg>
    );
  }

  // 8. Frutas / Vegetales
  if (text.includes('fruta') || text.includes('manzana') || text.includes('verdura') || text.includes('vegetal') || text.includes('hortaliza')) {
    if (isOutline) {
      return (
        <svg className="w-10 h-10 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
          <path d="M10 2c1 .5 2 2 2 5" />
        </svg>
      );
    }
    return (
      <svg className="w-10 h-10 fill-current text-slate-800" viewBox="0 0 24 24">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.29c.62-.75 1.04-1.8 1.01-2.29-.9.04-1.98.6-2.61 1.34-.56.64-1.05 1.69-.92 2.68.99.08 1.9-.98 2.52-1.73z" />
      </svg>
    );
  }

  // 9. Bebidas / Refrescos
  if (text.includes('bebida') || text.includes('refresco') || text.includes('jugo') || text.includes('agua') || text.includes('soda')) {
    if (isOutline) {
      return (
        <svg className="w-10 h-10 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 2h10l-1 10.5a4 4 0 0 1-4 3.5h0a4 4 0 0 1-4-3.5L7 2Z" />
          <path d="M12 16v6" />
          <path d="M8 22h8" />
        </svg>
      );
    }
    return (
      <svg className="w-10 h-10 fill-current text-slate-800" viewBox="0 0 24 24">
        <path d="M5 2h14l-1.5 12a4.5 4.5 0 0 1-4.5 4h-2a4.5 4.5 0 0 1-4.5-4L5 2zm6 17v3H8v2h8v-2h-3v-3h-2z" />
      </svg>
    );
  }

  // 10. Limpieza / Detergente
  if (text.includes('limpieza') || text.includes('detergente') || text.includes('jabon') || text.includes('jabón') || text.includes('cloro')) {
    if (isOutline) {
      return (
        <svg className="w-10 h-10 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m14 4-2-2-4 4 2 2" />
          <path d="m16 8 2 2-7 7H7v-4l7-7Z" />
          <path d="m19 11 2 2-3 3-2-2" />
          <path d="m5 19-3 3" />
        </svg>
      );
    }
    return (
      <svg className="w-10 h-10 fill-current text-slate-800" viewBox="0 0 24 24">
        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
      </svg>
    );
  }

  // Fallback: Paquete / Caja
  if (isOutline) {
    return (
      <svg className="w-10 h-10 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v8.42a1.78 1.78 0 0 0 .89 1.54l8.96 5.16a1.78 1.78 0 0 0 2.5-1.55V10.94a1.78 1.78 0 0 0-.9-1.54Z" />
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    );
  }
  return (
    <svg className="w-10 h-10 fill-current text-slate-800" viewBox="0 0 24 24">
      <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15z" />
    </svg>
  );
};

// Contrastes suaves con cambio de tonalidades por Rubro / Categoría para Móvil
const getMobileCardToneClasses = (p: MobileCatalogItem, index: number, paletteMode: 'category' | 'mono' = 'category') => {
  if (p.color) {
    return 'shadow-2xs border-2 border-slate-300';
  }

  if (paletteMode === 'mono') {
    const mod = index % 3;
    if (mod === 0) return 'bg-white text-slate-900 border-2 border-slate-300 shadow-2xs';
    if (mod === 1) return 'bg-[#dce3ec] text-slate-900 border-2 border-[#9cb1c5] shadow-2xs';
    return 'bg-[#d4dfea] text-slate-900 border-2 border-[#93a9be] shadow-2xs';
  }

  const text = `${p.category || ''} ${p.name || ''}`.toLowerCase();

  // Carnes, Pollo, Res, Cerdo -> Rosado / Salmón suave
  if (text.includes('carne') || text.includes('pollo') || text.includes('res') || text.includes('cerdo') || text.includes('meat') || text.includes('chuleta')) {
    return 'bg-[#ffe4e6] text-slate-950 border-2 border-[#fecdd3] hover:border-[#fb7185] shadow-2xs';
  }

  // Charcutería, Jamón, Embutidos -> Rosa orquídea suave
  if (text.includes('charcuter') || text.includes('jamon') || text.includes('jamón') || text.includes('salchicha') || text.includes('tocineta')) {
    return 'bg-[#fce7f3] text-slate-950 border-2 border-[#fbcfe8] hover:border-[#f472b6] shadow-2xs';
  }

  // Lácteos, Leche, Quesos, Mantequilla -> Celeste cielo suave
  if (text.includes('lacteo') || text.includes('lácteo') || text.includes('leche') || text.includes('queso') || text.includes('mantequilla') || text.includes('dairy')) {
    return 'bg-[#e0f2fe] text-slate-950 border-2 border-[#bae6fd] hover:border-[#38bdf8] shadow-2xs';
  }

  // Frutas, Verduras, Hortalizas, Vegetales -> Menta fresca suave
  if (text.includes('fruta') || text.includes('verdura') || text.includes('hortaliza') || text.includes('vegetal') || text.includes('produce') || text.includes('manzana')) {
    return 'bg-[#dcfce7] text-slate-950 border-2 border-[#bbf7d0] hover:border-[#4ade80] shadow-2xs';
  }

  // Café, Té, Espresso, Desayuno -> Moca cálido / Trigo suave
  if (text.includes('café') || text.includes('cafe') || text.includes('espresso') || text.includes('te') || text.includes('té') || text.includes('latte')) {
    return 'bg-[#f5ede4] text-slate-950 border-2 border-[#d6c5b3] hover:border-[#bca48d] shadow-2xs';
  }

  // Panadería, Repostería, Dulces, Cakes, Croissants -> Ámbar dorado suave
  if (text.includes('pan') || text.includes('croissant') || text.includes('bakery') || text.includes('torta') || text.includes('cake') || text.includes('dulce') || text.includes('postre')) {
    return 'bg-[#fef3c7] text-slate-950 border-2 border-[#fcd34d] hover:border-[#f59e0b] shadow-2xs';
  }

  // Víveres, Abarrotes, Despensa, Harina, Arroz, Granos -> Vainilla cálida suave
  if (text.includes('viveres') || text.includes('víveres') || text.includes('arroz') || text.includes('harina') || text.includes('pasta') || text.includes('aceite') || text.includes('grano')) {
    return 'bg-[#fef9c3] text-slate-950 border-2 border-[#fde047] hover:border-[#eab308] shadow-2xs';
  }

  // Bebidas, Refrescos, Jugos, Aguas -> Aqua / Turquesa suave
  if (text.includes('bebida') || text.includes('refresco') || text.includes('jugo') || text.includes('agua') || text.includes('soda') || text.includes('beverage')) {
    return 'bg-[#ccfbf1] text-slate-950 border-2 border-[#99f6e4] hover:border-[#2dd4bf] shadow-2xs';
  }

  // Limpieza, Aseo, Hogar, Detergente -> Lavanda / Violeta suave
  if (text.includes('limpieza') || text.includes('detergente') || text.includes('jabon') || text.includes('jabón') || text.includes('papel') || text.includes('aseo')) {
    return 'bg-[#fae8ff] text-slate-950 border-2 border-[#f5d0fe] hover:border-[#e879f9] shadow-2xs';
  }

  // Fallback suave
  const mod = index % 3;
  if (mod === 0) return 'bg-white text-slate-950 border-2 border-slate-300 hover:border-slate-500 shadow-2xs';
  if (mod === 1) return 'bg-[#e2e8f0] text-slate-950 border-2 border-[#cbd5e1] hover:border-slate-500 shadow-2xs';
  return 'bg-[#f1f5f9] text-slate-950 border-2 border-[#cbd5e1] hover:border-slate-500 shadow-2xs';
};

export default function MobileScannerPage() {
  const [session, setSession] = useState('caja-1');
  const [activeTab, setActiveTab] = useState<'pos' | 'scale' | 'gun' | 'inventory' | 'create'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p && ['pos', 'scale', 'gun', 'inventory', 'create'].includes(p)) return p as any;
    }
    return 'pos';
  });
  const [scannerActive, setScannerActive] = useState(false);
  const [history, setHistory] = useState<ScannedHistoryItem[]>([]);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Listo para escanear');
  const [isSending, setIsSending] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Sincronización Inalámbrica con PC / Caja de Escritorio
  const [pcServerUrl, setPcServerUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paramServer = params.get('server') || params.get('pc');
      if (paramServer) {
        const full = paramServer.startsWith('http') ? paramServer : `http://${paramServer}`;
        try { localStorage.setItem('klikpos_server_url', full); } catch {}
        return full;
      }
      try {
        const saved = localStorage.getItem('klikpos_server_url');
        if (saved && saved.trim()) return saved.trim();
      } catch {}
      if (window.location.protocol.startsWith('http') && !window.location.hostname.includes('capacitor') && window.location.hostname !== 'localhost') {
        return window.location.origin;
      }
    }
    return '';
  });
  const [pcConnectionStatus, setPcConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [isSatelliteMode, setIsSatelliteMode] = useState<boolean>(true);
  const [showPcSyncModal, setShowPcSyncModal] = useState(false);
  const [tempPcIp, setTempPcIp] = useState('');
  const [pcTestMessage, setPcTestMessage] = useState<string | null>(null);
  const [isTestingPc, setIsTestingPc] = useState(false);

  // Helper para fetch que prepende automáticamente la IP de la PC
  const safeApiFetch = async (path: string, options?: RequestInit): Promise<Response> => {
    let base = (pcServerUrl || '').trim();
    if (!base && typeof window !== 'undefined' && window.location.protocol.startsWith('http') && !window.location.hostname.includes('capacitor')) {
      base = window.location.origin;
    }
    if (base) {
      base = base.replace(/\/+$/, '');
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = base ? `${base}${cleanPath}` : cleanPath;
    return fetch(fullUrl, options);
  };

  // Cargar Catálogo Maestro (+130 productos) en memoria e IndexedDB
  const handleSeedMasterCatalog = async () => {
    if (Array.isArray(masterCatalogData) && masterCatalogData.length > 0) {
      setInventoryList(masterCatalogData as MobileCatalogItem[]);
      try {
        localStorage.setItem('venematic_offline_inventory', JSON.stringify(masterCatalogData));
        if (db.products?.bulkPut) {
          const mapped = masterCatalogData.map((p) => ({
            ...p,
            updatedAt: Date.now(),
            syncStatus: 'synced' as const,
          }));
          await db.products.bulkPut(mapped as any);
        }
      } catch {}
      playMobileBeep();
      safeVibrate([50, 50]);
      alert(`✓ ¡Catálogo Maestro Inicial cargado con éxito! (${masterCatalogData.length} productos con fotos, códigos y precios)`);
    }
  };

  // Probar enlace con la PC
  const handleTestPcConnection = async (targetUrl?: string) => {
    const urlToTest = (targetUrl || tempPcIp || pcServerUrl || '').trim();
    if (!urlToTest) {
      setPcTestMessage('Por favor escribe la IP o URL de la PC (Ej: 192.168.1.100:3000)');
      return;
    }
    const formatted = urlToTest.startsWith('http') ? urlToTest : `http://${urlToTest}`;
    setIsTestingPc(true);
    setPcTestMessage(null);
    try {
      const cleanBase = formatted.replace(/\/+$/, '');
      const t0 = performance.now();
      const res = await fetch(`${cleanBase}/api/scanner/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, connected: true, deviceName: 'KlikPOS Móvil Tester' }),
      });
      const t1 = performance.now();
      if (res.ok) {
        setPcServerUrl(cleanBase);
        setPcConnectionStatus('connected');
        try { localStorage.setItem('klikpos_server_url', cleanBase); } catch {}
        setPcTestMessage(`✓ ¡Conexión Exitosa con la PC! (${Math.round(t1 - t0)}ms) • Caja: ${session}`);
        playMobileBeep();
        safeVibrate([80, 80]);
      } else {
        setPcConnectionStatus('disconnected');
        setPcTestMessage(`⚠️ El servidor respondió con código: ${res.status}`);
      }
    } catch (err: any) {
      setPcConnectionStatus('disconnected');
      setPcTestMessage(`❌ No se pudo conectar a ${formatted}. Verifica que la PC esté encendida en la misma red.`);
    } finally {
      setIsTestingPc(false);
    }
  };

  // Carrito de Venta Móvil (POS Autónomo en Celular)
  const [mobileCart, setMobileCart] = useState<MobileCartItem[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [selectedMobileCategory, setSelectedMobileCategory] = useState('Todos');
  const [mobilePaletteMode, setMobilePaletteMode] = useState<'category' | 'mono'>('category');

  useEffect(() => {
    try {
      registerTrialInstallation(undefined, undefined, undefined, 'movil').catch(() => {});
    } catch {}
    try {
      const saved = localStorage.getItem('klikpos_mobile_palette');
      if (saved === 'category' || saved === 'mono') {
        setMobilePaletteMode(saved);
      }
    } catch {}
  }, []);

  const toggleMobilePaletteMode = () => {
    const next = mobilePaletteMode === 'category' ? 'mono' : 'category';
    setMobilePaletteMode(next);
    try {
      localStorage.setItem('klikpos_mobile_palette', next);
    } catch {}
  };
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showMobilePaymentModal, setShowMobilePaymentModal] = useState(false);
  const [mobilePaymentMethod, setMobilePaymentMethod] = useState<'cash_usd' | 'cash_ves' | 'pago_movil' | 'punto_venta' | 'zelle' | 'credit'>('cash_usd');
  const [mobileAmountGiven, setMobileAmountGiven] = useState('');
  const [mobilePagoMovilRef, setMobilePagoMovilRef] = useState('');
  const [mobileCardRef, setMobileCardRef] = useState('');
  const [mobileZelleRef, setMobileZelleRef] = useState('');
  const [mobileCustomerName, setMobileCustomerName] = useState('');
  const [mobileCustomerDoc, setMobileCustomerDoc] = useState('');
  const [isProcessingMobileSale, setIsProcessingMobileSale] = useState(false);
  const [mobileSaleSuccess, setMobileSaleSuccess] = useState<any | null>(null);
  const [offlinePendingSalesCount, setOfflinePendingSalesCount] = useState(0);

  // Balanza Digital Comercial (Pesaje por Kilo / Gramos)
  const [scaleWeight, setScaleWeight] = useState<number>(0.000);
  const [scaleTare, setScaleTare] = useState<number>(0);
  const [scaleUnit, setScaleUnit] = useState<'kg' | 'g' | 'lb'>('kg');
  const [scaleSelectedProduct, setScaleSelectedProduct] = useState<MobileCatalogItem | null>(null);
  const [scaleSearch, setScaleSearch] = useState('');
  const [scaleAddedToast, setScaleAddedToast] = useState<string | null>(null);
  const [isSyncingSales, setIsSyncingSales] = useState(false);
  const [copiedAmountToast, setCopiedAmountToast] = useState(false);

  // Funciones Especiales para Vendedores de Calle / Ambulantes
  const [detectedBankSms, setDetectedBankSms] = useState<{ amount: number; ref: string; sender: string; time: string; fullText?: string } | null>(null);
  const [showQuickSaleModal, setShowQuickSaleModal] = useState(false);
  const [quickSaleAmount, setQuickSaleAmount] = useState('');
  const [quickSaleCurrency, setQuickSaleCurrency] = useState<'USD' | 'VES'>('USD');
  const [quickSaleConcept, setQuickSaleConcept] = useState('Venta Rápida');
  const [customerWhatsAppPhone, setCustomerWhatsAppPhone] = useState('');

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const [inventoryList, setInventoryList] = useState<MobileCatalogItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('venematic_offline_inventory');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return Array.isArray(masterCatalogData) ? (masterCatalogData as MobileCatalogItem[]) : [];
  });
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryBcvRate, setInventoryBcvRate] = useState(848.55);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  // Form State for "Agregar Producto con Foto"
  const [prodPhoto, setProdPhoto] = useState<string | null>(null);
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Víveres');
  const [prodPriceUSD, setProdPriceUSD] = useState('');
  const [prodCostUSD, setProdCostUSD] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [isCreatingProd, setIsCreatingProd] = useState(false);
  const [createSuccessToast, setCreateSuccessToast] = useState(false);
  const [isSendingPhoto, setIsSendingPhoto] = useState(false);
  const [photoSentToast, setPhotoSentToast] = useState(false);
  const [isEnhancingMobileBg, setIsEnhancingMobileBg] = useState(false);
  const [isAnalyzingMobileAI, setIsAnalyzingMobileAI] = useState(false);
  const [aiDetectedToast, setAiDetectedToast] = useState<string | null>(null);

  // Floating Docker y Modales de Escritorio en Móvil
  const [showMobileSalesModal, setShowMobileSalesModal] = useState(false);
  const [showMobileCustomersModal, setShowMobileCustomersModal] = useState(false);
  const [showMobileClosureModal, setShowMobileClosureModal] = useState(false);
  const [showMobileSettingsModal, setShowMobileSettingsModal] = useState(false);
  const [showMobileBcvModal, setShowMobileBcvModal] = useState(false);
  const [tempMobileBcvRate, setTempMobileBcvRate] = useState('');
  const [isSyncingMobileBcv, setIsSyncingMobileBcv] = useState(false);
  const [mobileBcvMsg, setMobileBcvMsg] = useState<string | null>(null);

  // Búsqueda de Imágenes en Google / Web para Móvil
  const [showGoogleImageModal, setShowGoogleImageModal] = useState(false);
  const [showVisualPacksModal, setShowVisualPacksModal] = useState(false);
  const [googleImageQuery, setGoogleImageQuery] = useState('');
  const [googleImagesResults, setGoogleImagesResults] = useState<Array<{ title: string; url: string; thumbnail: string; source: string }>>([]);
  const [isSearchingGoogleImages, setIsSearchingGoogleImages] = useState(false);
  const [isDownloadingGoogleImage, setIsDownloadingGoogleImage] = useState(false);

  // Configuración de Empresa e Impresora Térmica
  const [companyInfo, setCompanyInfo] = useState({
    name: 'KlikPOS Market & Gourmet',
    rif: 'J-50123456-7',
    phone: '0424-8298026',
    address: 'Av. Principal con Calle 4, Local 2',
    footerMessage: '¡Gracias por su compra! Vuelva pronto.',
  });
  const [printerConfig, setPrinterConfig] = useState({
    type: 'bluetooth' as 'bluetooth' | 'usb' | 'network' | 'none',
    name: 'Impresora Térmica POS-58',
    ip: '192.168.1.200',
    port: 9100,
    paperWidth: '58mm' as '58mm' | '80mm',
    autoPrint: true,
  });
  const [printerTestAlert, setPrinterTestAlert] = useState(false);

  // Base de datos de Ventas y Clientes para Modales Móviles
  const [savedSalesList, setSavedSalesList] = useState<any[]>([]);
  const [salesSearchQuery, setSalesSearchQuery] = useState('');
  const [savedCustomersList, setSavedCustomersList] = useState<any[]>([]);
  const [customersSearchQuery, setCustomersSearchQuery] = useState('');
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', docId: '', phone: '', address: '', creditLimit: '' });

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeFileInputRef = useRef<HTMLInputElement>(null);
  const [cameraBlockedByHttp, setCameraBlockedByHttp] = useState(false);
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);

  // Sub-pestaña de la pantalla de Venta: Catálogo de artículos o Módulo de Ticket / Cobro
  const [posViewTab, setPosViewTab] = useState<'catalog' | 'ticket'>('catalog');
  // Auto-agregar al ticket en el escáner continuo
  const [autoAddOnScan, setAutoAddOnScan] = useState(true);
  // Producto detectado para el HUD de escáner
  const [scannedProductToast, setScannedProductToast] = useState<MobileCatalogItem | null>(null);
  // Referencias para el video directo y BarcodeDetector
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  // Modal de Teclado Numérico Táctil (Numpad) para cantidades y precios
  const [numpadModal, setNumpadModal] = useState<{
    isOpen: boolean;
    title: string;
    value: string;
    allowDecimal: boolean;
    onConfirm: (val: number) => void;
  }>({
    isOpen: false,
    title: '',
    value: '',
    allowDecimal: false,
    onConfirm: () => {},
  });

  const openNumpad = (title: string, initialValue: number, allowDecimal: boolean, onConfirm: (val: number) => void) => {
    setNumpadModal({
      isOpen: true,
      title,
      value: initialValue > 0 ? String(initialValue) : '',
      allowDecimal,
      onConfirm,
    });
  };

  const numpadPress = (key: string) => {
    setNumpadModal((prev) => {
      let v = prev.value;
      if (key === 'C') return { ...prev, value: '' };
      if (key === '⌫') return { ...prev, value: v.slice(0, -1) };
      if (key === '.' && (!prev.allowDecimal || v.includes('.'))) return prev;
      if (key === '.' && v === '') return { ...prev, value: '0.' };
      if (v.length >= 8) return prev;
      return { ...prev, value: v + key };
    });
  };

  const confirmNumpad = () => {
    const val = parseFloat(numpadModal.value) || 0;
    numpadModal.onConfirm(val);
    setNumpadModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Audio Beep generator for mobile feedback
  const playMobileBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch {
      // Audio context might require user gesture
    }
  };

  // Safe haptic feedback helper
  const safeVibrate = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  // Get session from URL query and maintain heartbeat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('session') || 'caja-1';
      setSession(s);

      const urlTab = params.get('tab');
      if (urlTab && ['pos', 'scale', 'gun', 'inventory', 'create'].includes(urlTab)) {
        setActiveTab(urlTab as any);
      }

      // Restaurar última foto tomada si el navegador móvil recargó
      try {
        const savedPhoto = localStorage.getItem('venematic_last_photo');
        if (savedPhoto) {
          setProdPhoto(savedPhoto);
        }
      } catch {}

      const deviceName = navigator.userAgent.includes('iPhone')
        ? 'iPhone'
        : navigator.userAgent.includes('iPad')
        ? 'iPad'
        : navigator.userAgent.includes('Android')
        ? 'Android Móvil'
        : 'Celular';

      // Notificar conexión inmediata al abrir
      const sendStatus = (connected: boolean) => {
        safeApiFetch('/api/scanner/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: s, connected, deviceName }),
          keepalive: true,
        })
          .then((res) => {
            if (res.ok) setPcConnectionStatus('connected');
            else setPcConnectionStatus('disconnected');
          })
          .catch(() => {
            setPcConnectionStatus('disconnected');
          });
      };

      sendStatus(true);

      // Latido constante cada 4 segundos para mantener el estado "Conectado" en vivo
      const pingTimer = setInterval(() => {
        sendStatus(true);
      }, 4000);

      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          sendStatus(true);
        }
      };

      const handleUnload = () => {
        // No desconectar inmediatamente al navegar o cambiar de app; el timeout del servidor (35s) maneja la desconexión
      };

      document.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('beforeunload', handleUnload);

      // PWA beforeinstallprompt handler
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Listener de SMS Pago Móvil en tiempo real desde Android / WebView
      const handleIncomingBankSms = (e: any) => {
        try {
          const detail = e.detail || {};
          const text = (detail.body || detail.message || '').toString();
          const sender = (detail.sender || 'BANCO').toString();
          if (!text) return;

          // Extracción de referencia y monto con regex bancario
          const refMatch = text.match(/(?:ref(?:erencia)?|operaci[oó]n|nro|id)[:\s#]*([0-9]{4,12})/i);
          const amountMatch = text.match(/(?:bs\.?|ves|monto)[:\s]*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2}))/i) || text.match(/([0-9]+[.,][0-9]{2})/);

          let parsedRef = refMatch ? refMatch[1] : '';
          let parsedAmount = 0;
          if (amountMatch) {
            const cleanAmt = amountMatch[1].replace(/\./g, '').replace(',', '.');
            parsedAmount = parseFloat(cleanAmt) || 0;
          }

          if (parsedRef || parsedAmount > 0) {
            setDetectedBankSms({
              amount: parsedAmount,
              ref: parsedRef,
              sender,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              fullText: text,
            });
            if (parsedRef) {
              setMobilePagoMovilRef(parsedRef.slice(-6));
            }
          }
        } catch (err) {
          console.warn('Error parsing incoming bank SMS:', err);
        }
      };

      window.addEventListener('venematic:sms_received', handleIncomingBankSms);

      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }

      return () => {
        clearInterval(pingTimer);
        window.removeEventListener('venematic:sms_received', handleIncomingBankSms);
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('beforeunload', handleUnload);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, [pcServerUrl]);

  // Función para instalar la PWA
  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      alert('Para instalar: Presiona el botón Compartir o Menú de tu navegador (⋮) y selecciona "Agregar a la pantalla de inicio".');
    }
  };

  // Cargar inventario desde la PC y guardarlo en caché local de contingencia
  const fetchInventory = async () => {
    setIsLoadingInventory(true);
    try {
      // 1. Cargar caché local como respaldo instantáneo
      try {
        const cached = localStorage.getItem('venematic_offline_inventory');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInventoryList(parsed);
          }
        }
        const cachedBcv = localStorage.getItem('venematic_offline_bcv');
        if (cachedBcv) setInventoryBcvRate(parseFloat(cachedBcv));
      } catch {}

      // 2. Si aún no hay inventario en memoria, pre-poblar de inmediato con el Catálogo Maestro (+130 productos)
      setInventoryList((current) => {
        if (current.length === 0 && Array.isArray(masterCatalogData) && masterCatalogData.length > 0) {
          try {
            localStorage.setItem('venematic_offline_inventory', JSON.stringify(masterCatalogData));
            if (db.products?.bulkPut) {
              const mapped = masterCatalogData.map((p) => ({
                ...p,
                updatedAt: Date.now(),
                syncStatus: 'synced' as const,
              }));
              db.products.bulkPut(mapped as any).catch(() => {});
            }
          } catch {}
          return masterCatalogData as MobileCatalogItem[];
        }
        return current;
      });

      // 3. Consultar a la PC
      const res = await safeApiFetch('/api/scanner/inventory');
      if (res.ok) {
        setPcConnectionStatus('connected');
        const data = await res.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          setInventoryList(data.products);
          try {
            localStorage.setItem('venematic_offline_inventory', JSON.stringify(data.products));
            if (db.products?.bulkPut) {
              db.products.bulkPut(data.products).catch(() => {});
            }
          } catch {}
        }
        if (typeof data.bcvRate === 'number') {
          setInventoryBcvRate(data.bcvRate);
          try {
            localStorage.setItem('venematic_offline_bcv', String(data.bcvRate));
          } catch {}
        }
        return !data.needsSync;
      } else {
        setPcConnectionStatus('disconnected');
      }
    } catch (e) {
      console.warn('Error cargando inventario en móvil:', e);
      setPcConnectionStatus('disconnected');
      // Asegurar que el catálogo maestro siempre esté activo
      setInventoryList((current) => {
        if (current.length === 0 && Array.isArray(masterCatalogData) && masterCatalogData.length > 0) {
          return masterCatalogData as MobileCatalogItem[];
        }
        return current;
      });
    } finally {
      setIsLoadingInventory(false);
    }
    return false;
  };

  useEffect(() => {
    fetchInventory();
    checkOfflineSales();

    // Escuchar SSE para refrescar catálogo automáticamente cuando el escritorio actualice inventario
    let sseSource: EventSource | null = null;
    let retryInterval: NodeJS.Timeout | null = null;
    try {
      let base = (pcServerUrl || '').trim();
      if (!base && typeof window !== 'undefined' && window.location.protocol.startsWith('http') && !window.location.hostname.includes('capacitor')) {
        base = window.location.origin;
      }
      base = base.replace(/\/+$/, '');
      const sseUrl = base ? `${base}/api/scanner/events?session=${session || 'caja-1'}` : `/api/scanner/events?session=${session || 'caja-1'}`;
      sseSource = new EventSource(sseUrl);
      sseSource.addEventListener('inventory_updated', (e: any) => {
        try {
          if (e.data) {
            const d = JSON.parse(e.data);
            if (typeof d.bcvRate === 'number' && d.bcvRate > 0) {
              setInventoryBcvRate(d.bcvRate);
              try { localStorage.setItem('venematic_offline_bcv', String(d.bcvRate)); } catch {}
            }
          }
        } catch {}
        fetchInventory();
        if (retryInterval) {
          clearInterval(retryInterval);
          retryInterval = null;
        }
      });
    } catch {}

    // Reintentar cada 4 segundos si el inventario sigue vacío (esperando que desktop responda)
    retryInterval = setInterval(async () => {
      const hasInventory = inventoryList.length > 0;
      if (hasInventory) {
        clearInterval(retryInterval!);
        retryInterval = null;
        return;
      }
      await fetchInventory();
    }, 4000);

    // Parar retry después de 60 segundos de todas formas
    const stopRetry = setTimeout(() => {
      if (retryInterval) {
        clearInterval(retryInterval);
        retryInterval = null;
      }
    }, 60000);

    return () => {
      sseSource?.close();
      if (retryInterval) clearInterval(retryInterval);
      clearTimeout(stopRetry);
    };
  }, [pcServerUrl]);

  useEffect(() => {
    if (activeTab === 'inventory' || activeTab === 'pos') {
      fetchInventory();
    }
  }, [activeTab]);

  // Verificar si hay ventas guardadas offline en el celular
  const checkOfflineSales = () => {
    try {
      const raw = localStorage.getItem('venematic_offline_sales_queue');
      const list = raw ? JSON.parse(raw) : [];
      setOfflinePendingSalesCount(list.length);
    } catch {
      setOfflinePendingSalesCount(0);
    }
  };

  // 1. Búsqueda y Descarga de Fotos en Google / Web para Móvil
  const handleSearchGoogleImages = async (q?: string) => {
    const query = (q || googleImageQuery || prodName || prodBarcode).trim();
    if (!query) {
      alert('Por favor escribe el nombre del producto a buscar en Google');
      return;
    }
    setGoogleImageQuery(query);
    setIsSearchingGoogleImages(true);
    setShowGoogleImageModal(true);
    try {
      const res = await safeApiFetch(`/api/products/search-images?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.images) ? data.images : (Array.isArray(data.results) ? data.results : []);
        if (list.length > 0) {
          setGoogleImagesResults(list);
        } else {
          setGoogleImagesResults([]);
        }
      }
    } catch (err) {
      console.warn('Error al buscar imágenes en Google:', err);
    } finally {
      setIsSearchingGoogleImages(false);
    }
  };

  const handleSelectGoogleImage = async (imgUrl: string) => {
    setIsDownloadingGoogleImage(true);
    try {
      const res = await safeApiFetch('/api/products/download-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imgUrl, removeBg: true }),
      });
      if (res.ok) {
        const data = await res.json();
        const finalUrl = data.savedPath || data.base64 || data.dataUrl || imgUrl;
        setProdPhoto(finalUrl);
        try { localStorage.setItem('venematic_last_photo', finalUrl); } catch {}
        setShowGoogleImageModal(false);
      } else {
        setProdPhoto(imgUrl);
        setShowGoogleImageModal(false);
      }
    } catch {
      setProdPhoto(imgUrl);
      setShowGoogleImageModal(false);
    } finally {
      setIsDownloadingGoogleImage(false);
    }
  };

  // 2. Control de Tasa BCV Manual y Scraping en Vivo
  const handleSaveMobileBcv = async () => {
    const parsed = parseFloat(tempMobileBcvRate.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      setInventoryBcvRate(parsed);
      setShowMobileBcvModal(false);
      try {
        localStorage.setItem('klikpos_bcv_rate', String(parsed));
        localStorage.setItem('venematic_offline_bcv', String(parsed));
        await db.settings?.put?.({ key: 'bcv_rate', value: parsed });
      } catch {}
      window.dispatchEvent(new CustomEvent('pos:bcv_updated', { detail: parsed }));
      window.dispatchEvent(new CustomEvent('venematic:bcv_updated', { detail: parsed }));
      safeApiFetch('/api/bcv/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: parsed, source: 'Ajuste Manual en Celular' }),
      }).catch(() => {});
      safeApiFetch('/api/scanner/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bcvRate: parsed }),
      }).catch(() => {});
    }
  };

  const handleScrapeMobileBcv = async () => {
    setIsSyncingMobileBcv(true);
    setMobileBcvMsg(null);
    try {
      const res = await safeApiFetch('/api/bcv/rate?refresh=true');
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.rate === 'number' && data.rate > 0) {
          setInventoryBcvRate(data.rate);
          setTempMobileBcvRate(data.rate.toFixed(2));
          try {
            localStorage.setItem('klikpos_bcv_rate', String(data.rate));
            localStorage.setItem('venematic_offline_bcv', String(data.rate));
            await db.settings?.put?.({ key: 'bcv_rate', value: data.rate });
          } catch {}
          window.dispatchEvent(new CustomEvent('pos:bcv_updated', { detail: data.rate }));
          window.dispatchEvent(new CustomEvent('venematic:bcv_updated', { detail: data.rate }));
          setMobileBcvMsg(`✓ Tasa BCV Oficial obtenida: Bs. ${data.rate.toFixed(2)} (${data.source || 'Scraping'})`);
        } else {
          setMobileBcvMsg('No se pudo obtener tasa en vivo. Verifica tu conexión.');
        }
      }
    } catch {
      setMobileBcvMsg('Error de red al consultar BCV.');
    } finally {
      setIsSyncingMobileBcv(false);
    }
  };

  // 3. Cargar Ventas y Clientes para Modales
  const loadSavedSales = async () => {
    try {
      const s = await db.sales?.reverse?.()?.toArray?.();
      if (Array.isArray(s) && s.length > 0) {
        setSavedSalesList(s);
      } else {
        const local = localStorage.getItem('venematic_offline_sales');
        if (local) setSavedSalesList(JSON.parse(local));
      }
    } catch {}
  };

  const loadSavedCustomers = async () => {
    try {
      const c = await db.customers?.toArray?.();
      if (Array.isArray(c) && c.length > 0) {
        setSavedCustomersList(c);
      } else {
        const local = localStorage.getItem('venematic_offline_customers');
        if (local) setSavedCustomersList(JSON.parse(local));
      }
    } catch {}
  };

  const handleAddMobileCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.docId) {
      alert('Por favor ingresa nombre y cédula/RIF del cliente');
      return;
    }
    const customerObj = {
      docId: newCustomer.docId.trim(),
      name: newCustomer.name.trim(),
      phone: newCustomer.phone.trim(),
      address: newCustomer.address.trim(),
      currentCreditUSD: 0,
      creditLimitUSD: parseFloat(newCustomer.creditLimit) || 100,
      currentDebtUSD: 0,
      createdAt: new Date().toISOString(),
    };
    try {
      await db.customers?.add?.(customerObj);
    } catch {
      const prev = savedCustomersList;
      localStorage.setItem('venematic_offline_customers', JSON.stringify([...prev, customerObj]));
    }
    setNewCustomer({ name: '', docId: '', phone: '', address: '', creditLimit: '' });
    setShowAddCustomerForm(false);
    loadSavedCustomers();
    alert('✓ Cliente registrado exitosamente');
  };

  const handleSaveMobileSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('klikpos_company_info', JSON.stringify(companyInfo));
      localStorage.setItem('klikpos_printer_config', JSON.stringify(printerConfig));
      db.settings?.put?.({ key: 'store_info', value: companyInfo }).catch(() => {});
      alert('✓ Configuración de empresa e impresora guardada con éxito');
      setShowMobileSettingsModal(false);
    } catch {
      alert('Error guardando configuración');
    }
  };

  const handleTestMobilePrint = () => {
    setPrinterTestAlert(true);
    safeVibrate([50, 50, 50]);
    setTimeout(() => setPrinterTestAlert(false), 3500);
  };

  // Intentar sincronizar ventas offline hacia la PC
  const syncOfflineSalesToPC = async () => {
    try {
      const raw = localStorage.getItem('venematic_offline_sales_queue');
      if (!raw) return;
      const sales: any[] = JSON.parse(raw);
      if (sales.length === 0) return;

      const remaining: any[] = [];
      for (const sale of sales) {
        try {
          const res = await safeApiFetch('/api/scanner/sale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sale }),
          });
          if (!res.ok) remaining.push(sale);
        } catch {
          remaining.push(sale);
        }
      }

      localStorage.setItem('venematic_offline_sales_queue', JSON.stringify(remaining));
      setOfflinePendingSalesCount(remaining.length);
      if (remaining.length === 0) {
        alert('¡Todas las ventas registradas offline fueron sincronizadas con éxito a la PC!');
      }
    } catch {}
  };

  // Acciones de Carrito de Venta Móvil (POS en Celular)
  const addToMobileCart = (product: MobileCatalogItem) => {
    // Verificar si el stock en vivo está agotado
    const existing = mobileCart.find((item) => item.barcode === product.barcode);
    const inCartQty = existing ? existing.qty : 0;
    if (product.stock > 0 && inCartQty >= product.stock) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }
      setStatusMessage(`⚠️ Stock disponible agotado (${product.name}: ${product.stock})`);
      setTimeout(() => setStatusMessage('Listo para operar'), 2500);
      return;
    }

    playMobileBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(60);
    }

    setMobileCart((prev) => {
      const existing = prev.find((item) => item.barcode === product.barcode);
      if (existing) {
        return prev.map((item) =>
          item.barcode === product.barcode
            ? {
                ...item,
                qty: item.qty + 1,
                totalUSD: (item.qty + 1) * item.priceUSD,
              }
            : item
        );
      } else {
        const isFixed = product.isFixedPriceVES && product.fixedPriceVES;
        const itemPriceUSD = isFixed ? (product.fixedPriceVES! / inventoryBcvRate) : product.priceUSD;
        return [
          ...prev,
          {
            productId: product.id || Date.now(),
            barcode: product.barcode,
            name: product.name,
            qty: 1,
            priceUSD: itemPriceUSD,
            totalUSD: itemPriceUSD,
            image: product.image,
            isFixedPriceVES: product.isFixedPriceVES,
            fixedPriceVES: product.fixedPriceVES,
          },
        ];
      }
    });
  };

  const updateMobileCartQty = (barcode: string, delta: number) => {
    const product = inventoryList.find((p) => p.barcode === barcode);
    setMobileCart((prev) =>
      prev
        .map((item) => {
          if (item.barcode === barcode) {
            let newQty = item.qty + delta;
            if (delta > 0 && product && product.stock > 0 && newQty > product.stock) {
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([80, 40, 80]);
              }
              setStatusMessage(`⚠️ Stock máximo alcanzado (${product.name}: ${product.stock})`);
              setTimeout(() => setStatusMessage('Listo para operar'), 2500);
              newQty = product.stock;
            }
            return newQty > 0
              ? { ...item, qty: newQty, totalUSD: newQty * item.priceUSD }
              : null;
          }
          return item;
        })
        .filter(Boolean) as MobileCartItem[]
    );
  };

  const removeMobileCartItem = (barcode: string) => {
    setMobileCart((prev) => prev.filter((item) => item.barcode !== barcode));
  };

  const clearMobileCart = () => {
    setMobileCart([]);
  };

  // Totales de la venta móvil (Considera productos con precio fijo en Bolívares exentos de BCV)
  const mobileSubtotalUSD = mobileCart.reduce((sum, i) => sum + i.totalUSD, 0);
  const mobileTotalUSD = mobileSubtotalUSD;
  const mobileTotalVES = mobileCart.reduce((sum, item) => {
    if (item.isFixedPriceVES && item.fixedPriceVES) {
      return sum + (item.fixedPriceVES * item.qty);
    }
    return sum + (item.totalUSD * inventoryBcvRate);
  }, 0);

  // Agregar producto pesado desde la Balanza al Carrito Móvil
  const handleAddWeighedToCart = (goToCheckout: boolean = false) => {
    if (!scaleSelectedProduct) {
      alert('Por favor selecciona un producto para pesar.');
      return;
    }
    const netWeight = Math.max(0, scaleWeight - scaleTare);
    if (netWeight <= 0) {
      alert('El peso debe ser mayor a 0 kg para agregar a la venta.');
      return;
    }

    playMobileBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60, 40, 60]);
    }

    const lineTotalUSD = Number((netWeight * scaleSelectedProduct.priceUSD).toFixed(2));
    const uniqueBarcode = `${scaleSelectedProduct.barcode}-W${Math.round(netWeight * 1000)}`;

    setMobileCart((prev) => [
      ...prev,
      {
        productId: scaleSelectedProduct.id || Date.now(),
        barcode: uniqueBarcode,
        name: `${scaleSelectedProduct.name} (${netWeight.toFixed(3)} ${scaleUnit})`,
        qty: 1,
        priceUSD: lineTotalUSD,
        totalUSD: lineTotalUSD,
        image: scaleSelectedProduct.image,
      },
    ]);

    setScaleAddedToast(`⚖️ ${netWeight.toFixed(3)} ${scaleUnit} de ${scaleSelectedProduct.name} agregado ($${lineTotalUSD.toFixed(2)})`);
    setTimeout(() => setScaleAddedToast(null), 3000);

    if (goToCheckout) {
      setShowMobilePaymentModal(true);
    }
  };

  // Función de Cobro Rápido por Monto (Comida rápida, ropa, servicios ambulantes)
  const handleAddQuickSale = (amountNum: number, concept: string, currency: 'USD' | 'VES') => {
    if (amountNum <= 0) return;
    const priceUSD = currency === 'USD' ? amountNum : (amountNum / inventoryBcvRate);
    const uniqueId = 'quick_' + Date.now();
    const newItem: MobileCartItem = {
      productId: uniqueId,
      barcode: 'RAPIDO',
      name: (concept || 'Cobro Rápido').trim(),
      qty: 1,
      priceUSD: Number(priceUSD.toFixed(2)),
      totalUSD: Number(priceUSD.toFixed(2)),
    };
    setMobileCart((prev) => [...prev, newItem]);
    setShowQuickSaleModal(false);
    setQuickSaleAmount('');
  };

  // Enviar peso/producto a la PC (Control Remoto en Vivo)
  const handleSendWeightToPC = async () => {
    if (!scaleSelectedProduct) {
      alert('Selecciona un producto primero en la balanza.');
      return;
    }
    const netWeight = Math.max(0, scaleWeight - scaleTare);
    if (netWeight <= 0) {
      alert('Fija un peso mayor a 0 kg.');
      return;
    }
    try {
      const res = await safeApiFetch('/api/scanner/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session,
          barcode: scaleSelectedProduct.barcode,
          format: 'SCALE',
          weight: netWeight,
        }),
      });
      if (res.ok) {
        playMobileBeep();
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(80);
        setScaleAddedToast(`📡 Enviado a PC: ${scaleSelectedProduct.name} (${netWeight.toFixed(3)} kg)`);
        setTimeout(() => setScaleAddedToast(null), 3000);
      } else {
        alert('No se pudo enviar a la PC.');
      }
    } catch {
      alert('Sin conexión con la computadora local.');
    }
  };

  // Procesar cobro móvil (Autónomo / Sin Luz)
  const handleProcessMobileSale = async () => {
    if (mobileCart.length === 0) return;
    setIsProcessingMobileSale(true);

    const numGiven = parseFloat(mobileAmountGiven) || 0;
    let finalChangeUSD = 0;
    let finalChangeVES = 0;
    if (mobilePaymentMethod === 'cash_usd') {
      if (numGiven > mobileTotalUSD) {
        finalChangeUSD = numGiven - mobileTotalUSD;
        finalChangeVES = finalChangeUSD * inventoryBcvRate;
      }
    } else if (mobilePaymentMethod === 'cash_ves') {
      if (numGiven > mobileTotalVES) {
        finalChangeVES = numGiven - mobileTotalVES;
        finalChangeUSD = inventoryBcvRate > 0 ? finalChangeVES / inventoryBcvRate : 0;
      }
    }

    if (mobilePaymentMethod === 'credit') {
      if (!mobileCustomerName.trim()) {
        alert('Por favor ingrese el nombre del cliente para registrar la venta a crédito / fiado.');
        setIsProcessingMobileSale(false);
        return;
      }
    }

    const receiptNum = `CEL-${String(Date.now()).slice(-6)}`;
    const newSale = {
      receiptNumber: receiptNum,
      timestamp: new Date().toISOString(),
      items: mobileCart.map((i) => ({
        productId: i.productId,
        name: i.name,
        barcode: i.barcode,
        qty: i.qty,
        priceUSD: i.priceUSD,
        totalUSD: i.totalUSD,
      })),
      subtotalUSD: mobileSubtotalUSD,
      taxUSD: 0,
      totalUSD: mobileTotalUSD,
      totalVES: mobileTotalVES,
      bcvRate: inventoryBcvRate,
      customerName: mobilePaymentMethod === 'credit' ? mobileCustomerName.trim() : undefined,
      customerDoc: mobilePaymentMethod === 'credit' && mobileCustomerDoc.trim() ? mobileCustomerDoc.trim() : undefined,
      payments: [
        {
          method: mobilePaymentMethod,
          amountUSD: mobilePaymentMethod === 'cash_usd' && numGiven >= mobileTotalUSD ? numGiven : mobileTotalUSD,
          amountVES: mobilePaymentMethod === 'cash_ves' && numGiven >= mobileTotalVES ? numGiven : mobileTotalVES,
          reference:
            mobilePaymentMethod === 'pago_movil'
              ? mobilePagoMovilRef
              : mobilePaymentMethod === 'punto_venta'
              ? mobileCardRef
              : mobilePaymentMethod === 'zelle'
              ? mobileZelleRef
              : mobilePaymentMethod === 'credit'
              ? 'Crédito de Confianza'
              : undefined,
        },
      ],
      changeUSD: finalChangeUSD,
      changeVES: finalChangeVES,
      cashierName: 'POS Celular (Contingencia)',
      status: 'completed',
      source: 'mobile',
    };

    // 1. Intentar enviar a la PC por API
    let sentToPC = false;
    try {
      const res = await safeApiFetch('/api/scanner/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sale: newSale }),
      });
      if (res.ok) {
        sentToPC = true;
      }
    } catch {
      sentToPC = false;
    }

    // 2. Si la PC está apagada o sin luz, guardar en la memoria del celular
    if (!sentToPC) {
      try {
        const raw = localStorage.getItem('venematic_offline_sales_queue');
        const sales = raw ? JSON.parse(raw) : [];
        sales.push(newSale);
        localStorage.setItem('venematic_offline_sales_queue', JSON.stringify(sales));
        setOfflinePendingSalesCount(sales.length);
      } catch {}
    }

    // Descontar inventario en la vista móvil del celular
    setInventoryList((prev) =>
      prev.map((prod) => {
        const cartItem = mobileCart.find((c) => c.barcode === prod.barcode);
        if (cartItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - cartItem.qty),
          };
        }
        return prod;
      })
    );

    playMobileBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    setMobileSaleSuccess({
      receiptNumber: receiptNum,
      totalUSD: mobileTotalUSD,
      totalVES: mobileTotalVES,
      changeUSD: finalChangeUSD,
      changeVES: finalChangeVES,
      paymentMethod: mobilePaymentMethod,
      customerName: mobileCustomerName.trim(),
      customerDoc: mobileCustomerDoc.trim(),
      items: [...mobileCart],
      bcvRate: inventoryBcvRate,
      timestamp: newSale.timestamp,
      sentToPC,
      itemsCount: mobileCart.reduce((sum, i) => sum + i.qty, 0),
    });

    setMobileCart([]);
    setMobileAmountGiven('');
    setMobilePagoMovilRef('');
    setMobileCustomerName('');
    setMobileCustomerDoc('');
    setShowCartDrawer(false);
    setShowMobilePaymentModal(false);
    setIsProcessingMobileSale(false);
  };

  // Barcode scanner trigger
  const sendBarcodeToPC = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    playMobileBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(80);
    }

    setLastScanned(cleanCode);
    setStatusMessage(`Enviando ${cleanCode} a la PC (${session})...`);
    setIsSending(true);

    try {
      const res = await safeApiFetch('/api/scanner/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, barcode: cleanCode }),
      });

      if (res.ok) {
        setPcConnectionStatus('connected');
        setStatusMessage(`✓ ¡Enviado a Caja PC (${session})! Código: ${cleanCode}`);
        setHistory((prev) => [
          { barcode: cleanCode, timestamp: new Date().toLocaleTimeString(), status: 'sent' },
          ...prev.slice(0, 19),
        ]);
      } else {
        setStatusMessage(`⚠️ Código ${cleanCode} procesado`);
        setHistory((prev) => [
          { barcode: cleanCode, timestamp: new Date().toLocaleTimeString(), status: 'error' },
          ...prev.slice(0, 19),
        ]);
      }
    } catch {
      setPcConnectionStatus('disconnected');
      setStatusMessage(`⚠️ Sin conexión con la PC (Toca "Vincular PC" para configurar IP)`);
      setHistory((prev) => [
        { barcode: cleanCode, timestamp: new Date().toLocaleTimeString(), status: 'error' },
        ...prev.slice(0, 19),
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Helper para redimensionar fotos de cámara de alta resolución (evita error 'Low memory' de Android)
  const downscaleImageForScan = (file: File, maxDimension = 1024): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else resolve(file);
          }, 'image/jpeg', 0.85);
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  // Escanear código mediante foto nativa (Optimizada contra Low Memory en Android)
  const handleScanFromPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningPhoto(true);
    setStatusMessage('Optimizando y analizando código...');

    try {
      // 1. Redimensionar foto de alta resolución para evitar saturar la RAM de Android
      const downscaledBlob = await downscaleImageForScan(file, 1024);
      const downscaledFile = new File([downscaledBlob], 'scan.jpg', { type: 'image/jpeg' });

      // 2. Intentar primero con BarcodeDetector nativo (Ultra rápido y sin uso extra de memoria en Android)
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
          });
          const bitmap = await createImageBitmap(downscaledBlob);
          const detected = await barcodeDetector.detect(bitmap);
          if (detected && detected.length > 0 && detected[0].rawValue) {
            processDetectedBarcode(detected[0].rawValue);
            setStatusMessage(`✓ ¡Código detectado: ${detected[0].rawValue}!`);
            setIsScanningPhoto(false);
            e.target.value = '';
            return;
          }
        } catch (detectorErr) {
          console.warn('BarcodeDetector fallback a scanFile:', detectorErr);
        }
      }

      // 3. Fallback con Html5Qrcode.scanFile usando el archivo liviano
      let qrScanner = html5QrCodeRef.current;
      if (!qrScanner) {
        qrScanner = new Html5Qrcode('mobile-camera-reader');
        html5QrCodeRef.current = qrScanner;
      }
      const decoded = await qrScanner.scanFile(downscaledFile, false);
      if (decoded) {
        processDetectedBarcode(decoded);
        setStatusMessage(`✓ ¡Código detectado: ${decoded}!`);
        setIsScanningPhoto(false);
        e.target.value = '';
        return;
      }
    } catch (err) {
      console.warn('scanFile no detectó código en foto:', err);
    } finally {
      setIsScanningPhoto(false);
      try {
        e.target.value = '';
      } catch {}
    }

    setStatusMessage('No se detectó código en la foto. Prueba apuntar con el Visor Continuo.');
  };

  // Procesar código detectado en tiempo real (Autónomo y en PC)
  const processDetectedBarcode = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    // Detectar si es un código QR de emparejamiento desde la pantalla de la PC
    if (cleanCode.startsWith('http://') || cleanCode.startsWith('https://')) {
      try {
        const urlObj = new URL(cleanCode);
        const origin = urlObj.origin;
        const sessionParam = urlObj.searchParams.get('session');
        setPcServerUrl(origin);
        if (sessionParam) setSession(sessionParam);
        try {
          localStorage.setItem('klikpos_server_url', origin);
          if (sessionParam) localStorage.setItem('klikpos_session', sessionParam);
        } catch {}
        setPcConnectionStatus('connected');
        setStatusMessage(`✓ ¡Vinculado exitosamente con PC (${origin})!`);
        playMobileBeep();
        safeVibrate([100, 50, 100]);
        alert(`✓ ¡Vinculado exitosamente con la PC!\n\nServidor: ${origin}\nCaja: ${sessionParam || session}`);
        return;
      } catch {}
    }

    const now = Date.now();
    if (cleanCode === lastScanned && now - lastScannedTimeRef.current < 2000) {
      return;
    }
    lastScannedTimeRef.current = now;
    setLastScanned(cleanCode);

    // Audio Beep & Vibración háptica instantánea
    playMobileBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }

    // Verificar en el inventario local de la aplicación
    const matched = inventoryList.find((p) => p.barcode === cleanCode);
    if (matched) {
      setScannedProductToast(matched);
      setStatusMessage(`✓ ¡Detectado: ${matched.name}!`);
      if (autoAddOnScan && !isSatelliteMode) {
        addToMobileCart(matched);
      }
    } else {
      setScannedProductToast(null);
      setStatusMessage(`✓ Código detectado: ${cleanCode}`);
    }

    // Enviar a la PC si está en Modo Satélite
    if (isSatelliteMode) {
      sendBarcodeToPC(cleanCode);
    }
  };

  // Detener cámara y limpiar recursos
  const stopScanner = async () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Stop camera error:', e);
      }
      html5QrCodeRef.current = null;
    }
    setScannerActive(false);
  };

  // Iniciar visor de cámara continua (60 FPS, sin lag, como lector de código QR)
  const startScanner = async () => {
    try {
      await stopScanner();

      // Verificar si el navegador móvil permite getUserMedia
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraBlockedByHttp(true);
        setStatusMessage('Cámara bloqueada por el navegador. Activa insecure-origin en Chrome.');
        setScannerActive(false);
        return;
      }

      setCameraBlockedByHttp(false);

      // 1. Obtener stream directo de video con la cámara trasera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setScannerActive(true);
      setStatusMessage('Visor óptico continuo activo: Apunta a cualquier código');

      // 2. BarcodeDetector nativo por hardware (Presente en Android Chrome, 0% CPU, 60 FPS)
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code', 'itf'],
          });

          const scanLoop = async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                processDetectedBarcode(barcodes[0].rawValue);
              }
            } catch {}
          };

          scanIntervalRef.current = setInterval(scanLoop, 120);
          return;
        } catch (detectorErr) {
          console.warn('BarcodeDetector error, fallback a Html5Qrcode:', detectorErr);
        }
      }

      // 3. Fallback con Html5Qrcode si el dispositivo no tiene BarcodeDetector nativo
      const qrCode = new Html5Qrcode('mobile-camera-reader');
      html5QrCodeRef.current = qrCode;

      await qrCode.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          processDetectedBarcode(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      console.error('Error starting camera:', err);
      setStatusMessage('Cámara bloqueada por el navegador.');
      setScannerActive(false);
      setCameraBlockedByHttp(true);
    }
  };

  useEffect(() => {
    if (activeTab === 'gun') {
      const timer = setTimeout(() => {
        startScanner();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [activeTab]);

  // Helper de compresión por hardware con memoria < 1.5MB (Anti-OOM)
  const compressImageSafely = async (file: File, maxWidth = 400, quality = 0.80): Promise<string> => {
    if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
      try {
        let bitmap: ImageBitmap | null = null;
        try {
          bitmap = await createImageBitmap(file, {
            resizeWidth: maxWidth,
            resizeQuality: 'medium',
          });
        } catch {
          bitmap = null;
        }

        if (bitmap) {
          let width = bitmap.width;
          let height = bitmap.height;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(bitmap, 0, 0, width, height);
            bitmap.close();
            return canvas.toDataURL('image/jpeg', quality);
          }
          bitmap.close();
        }
      } catch (e) {
        console.warn('[ImageCompress] Fallback a createObjectURL:', e);
      }
    }

    return new Promise((resolve, reject) => {
      let objectUrl: string | null = null;
      try {
        objectUrl = URL.createObjectURL(file);
      } catch {}

      if (objectUrl) {
        const img = new Image();
        img.onload = () => {
          try {
            let width = img.naturalWidth || img.width || 400;
            let height = img.naturalHeight || img.height || 400;
            if (width > maxWidth || height > maxWidth) {
              if (width > height) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxWidth) / height);
                height = maxWidth;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              if (objectUrl) URL.revokeObjectURL(objectUrl);
              resolve(dataUrl);
              return;
            }
          } catch (err) {}
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          reject(new Error('Canvas error'));
        };
        img.onerror = () => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          reject(new Error('Image load error'));
        };
        img.src = objectUrl;
      } else {
        reject(new Error('No object URL'));
      }
    });
  };

  // Handle Photo selection and compression with low memory footprint (< 1.5MB)
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImageSafely(file, 400, 0.80);
      setProdPhoto(compressedDataUrl);
      try {
        localStorage.setItem('venematic_last_photo', compressedDataUrl);
      } catch {}

      // 2. Auto-limpiar fondo a blanco puro
      setIsEnhancingMobileBg(true);
      removeBackgroundToWhiteCanvas(compressedDataUrl)
        .then((enhanced) => {
          setProdPhoto(enhanced);
          try {
            localStorage.setItem('venematic_last_photo', enhanced);
          } catch {}

          // 3. ENVIAR FOTO MEJORADA A LA PC
          setIsSendingPhoto(true);
          return safeApiFetch('/api/scanner/upload-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session: session || 'caja-1',
              image: enhanced,
              barcode: prodBarcode || undefined,
            }),
            keepalive: true,
          });
        })
        .then((res) => {
          if (res && res.ok) {
            playMobileBeep();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([100, 50, 100]);
            }
            setPhotoSentToast(true);
            setTimeout(() => setPhotoSentToast(false), 4000);
          }
        })
        .catch((err) => {
          console.error('Error auto-procesando foto:', err);
        })
        .finally(() => {
          setIsEnhancingMobileBg(false);
          setIsSendingPhoto(false);
        });

      // 4. Auto-reconocimiento con IA (Google Vision / Gemini) si está configurado
      setIsAnalyzingMobileAI(true);
      safeApiFetch('/api/vision/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressedDataUrl }),
      })
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data) {
            if (json.data.name && !prodName) setProdName(json.data.name);
            if (json.data.category) setProdCategory(json.data.category);
            if (json.data.barcode && !prodBarcode) setProdBarcode(json.data.barcode);
            if (json.data.suggestedPriceUSD && !prodPriceUSD) {
              setProdPriceUSD(json.data.suggestedPriceUSD.toString());
            }
            setAiDetectedToast(`¡Detectado: ${json.data.name || 'Producto'}!`);
            setTimeout(() => setAiDetectedToast(null), 4500);
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsAnalyzingMobileAI(false);
        });
    } catch (error) {
      console.error('Error al capturar foto:', error);
      alert('Error de memoria al capturar foto.');
    } finally {
      if (e.target) {
        try {
          e.target.value = '';
        } catch {}
      }
    }
  };

  // Limpiar y resetear el formulario de creación de producto
  const handleResetCreateForm = () => {
    setProdPhoto(null);
    setProdBarcode('');
    setProdName('');
    setProdCategory('Víveres');
    setProdPriceUSD('');
    setProdCostUSD('');
    setProdStock('10');
    setIsCreatingProd(false);
    setIsSendingPhoto(false);
    setIsEnhancingMobileBg(false);
    setIsAnalyzingMobileAI(false);
    setPhotoSentToast(false);
    setCreateSuccessToast(false);
    setAiDetectedToast(null);
    try {
      localStorage.removeItem('venematic_last_photo');
    } catch {}
  };

  // Submit new product with photo from phone
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodBarcode || !prodName || !prodPriceUSD) {
      alert('Por favor llena código, nombre y precio.');
      return;
    }

    setIsCreatingProd(true);
    try {
      const res = await safeApiFetch('/api/scanner/create-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session,
          product: {
            barcode: prodBarcode,
            name: prodName,
            category: prodCategory,
            priceUSD: parseFloat(prodPriceUSD.replace(',', '.')),
            costUSD: parseFloat(prodCostUSD.replace(',', '.')) || 0,
            stock: parseInt(prodStock) || 1,
            unit: 'unidad',
            image: prodPhoto || undefined,
          },
        }),
      });

      if (res.ok) {
        playMobileBeep();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        setCreateSuccessToast(true);
        // Reset form completely
        handleResetCreateForm();
        setTimeout(() => setCreateSuccessToast(false), 3000);
      } else {
        alert('Error al enviar el producto a la computadora.');
      }
    } catch (err) {
      alert('Sin conexión con la computadora local.');
    } finally {
      setIsCreatingProd(false);
    }
  };

  // Enviar SOLO la foto directamente al modal abierto en la PC
  const handleSendPhotoOnly = async () => {
    if (!prodPhoto) return;
    setIsSendingPhoto(true);
    try {
      const res = await safeApiFetch('/api/scanner/upload-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session,
          image: prodPhoto,
          barcode: prodBarcode || undefined,
        }),
      });

      if (res.ok) {
        playMobileBeep();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(100);
        }
        setPhotoSentToast(true);
        setTimeout(() => setPhotoSentToast(false), 3000);
      } else {
        alert('Error al transferir la foto a la PC.');
      }
    } catch (err) {
      alert('Sin conexión con la computadora local.');
    } finally {
      setIsSendingPhoto(false);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[var(--industrial-bg,#ffffff)] flex flex-col font-sans text-slate-900 select-none overflow-hidden pb-[60px]">
      {/* Top Mobile Bar */}
      <header className="bg-white border-b border-slate-300 px-3.5 py-2 sticky top-0 z-40 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--brand-primary,#0369a1)] text-white flex items-center justify-center font-black text-sm shadow-xs">
            K
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-tight tracking-tight">
              KlikPOS Móvil
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Caja <b className="text-slate-800">{session}</b></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tasa BCV Visible y Táctil para Ajuste Rápido */}
          <button
            type="button"
            onClick={() => {
              setTempMobileBcvRate(inventoryBcvRate.toFixed(2));
              setMobileBcvMsg(null);
              setShowMobileBcvModal(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 active:scale-95 border border-sky-300 rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Tocar para actualizar o cambiar tasa BCV"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-right leading-none">
              <span className="text-[9px] uppercase font-bold text-sky-700 block tracking-tight">BCV</span>
              <span className="font-mono font-black text-xs text-sky-950 tabular-numbers">
                Bs. {inventoryBcvRate.toFixed(2)}
              </span>
            </div>
          </button>

          {/* Botón Interactivo de Enlace y Sincronización con la PC */}
          <button
            type="button"
            onClick={() => {
              setTempPcIp(pcServerUrl || '');
              setPcTestMessage(null);
              setShowPcSyncModal(true);
            }}
            className={`px-2.5 py-1 border rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all ${
              pcConnectionStatus === 'connected'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
            }`}
            title="Configuración de Enlace Inalámbrico con PC"
          >
            <span className={`w-2 h-2 rounded-full ${pcConnectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <Laptop className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{pcConnectionStatus === 'connected' ? 'PC Enlazada' : 'Vincular PC'}</span>
          </button>
        </div>
      </header>

      {/* Banner de Ventas Pendientes Offline (Contingencia sin Luz) */}
      {offlinePendingSalesCount > 0 && (
        <div className="bg-amber-500 text-slate-900 px-4 py-1.5 flex items-center justify-between shadow-xs shrink-0 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span>{offlinePendingSalesCount} venta(s) offline pendientes</span>
          </div>
          <button
            onClick={syncOfflineSalesToPC}
            className="px-2.5 py-0.5 bg-white text-slate-900 rounded-lg text-xs font-black shadow-xs active:scale-95"
          >
            Sincronizar
          </button>
        </div>
      )}

      {/* Subheader: Estado del Sistema Dual y Accesos Rápidos de Gestión */}
      <div className="px-3 py-1.5 bg-slate-900 text-white flex items-center justify-between shadow-xs text-xs sticky top-12 z-30 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-extrabold text-xs uppercase tracking-wider text-slate-200">
            {activeTab === 'pos' && '🛒 POS Móvil'}
            {activeTab === 'scale' && '⚖️ Balanza'}
            {activeTab === 'gun' && '⚡ Escáner'}
            {activeTab === 'create' && '📸 Captura IA'}
            {activeTab === 'inventory' && '📦 Stock'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              safeVibrate(20);
              loadSavedSales();
              setShowMobileSalesModal(true);
            }}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
            title="Historial de Ventas y Tickets"
          >
            <Receipt className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden xs:inline">Ventas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              safeVibrate(20);
              loadSavedCustomers();
              setShowMobileCustomersModal(true);
            }}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
            title="Clientes y Cuentas por Cobrar"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">Clientes</span>
          </button>

          <button
            type="button"
            onClick={() => {
              safeVibrate(20);
              loadSavedSales();
              setShowMobileClosureModal(true);
            }}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
            title="Cierre de Caja Z / X"
          >
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden xs:inline">Cierre</span>
          </button>

          <button
            type="button"
            onClick={() => {
              safeVibrate(20);
              setShowMobileSettingsModal(true);
            }}
            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 rounded-lg border border-slate-700 transition-all cursor-pointer"
            title="Configuración"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1 (NAV DOCK 1): POS AUTÓNOMO CON CASHIER DISPLAY FRAME & 2-ROW GRID */}
      {/* ========================================================================= */}
      {activeTab === 'pos' && (
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative bg-slate-100">
          
          {/* 1. FRAME / MOCKUP DEL DISPLAY DE CAJA REGISTRADORA DIGITAL */}
          <div className="p-2.5 pb-1 shrink-0">
            <div className="bg-gradient-to-b from-slate-900 via-[#0a192f] to-slate-950 rounded-2xl p-3 border-2 border-slate-700/80 shadow-xl text-white relative overflow-hidden">
              {/* Luz sutil de reflejo del display */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

              {/* Barra Superior del Display */}
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 text-[10px] font-mono text-cyan-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-black uppercase tracking-wider text-emerald-400">DISPLAY DE CAJA</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300">TICKET ACTIVO</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-slate-200">
                    {mobileCart.reduce((s, i) => s + i.qty, 0)} arts
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempMobileBcvRate(inventoryBcvRate.toFixed(2));
                      setShowMobileBcvModal(true);
                    }}
                    className="text-amber-300 font-bold hover:underline"
                  >
                    BCV: Bs. {inventoryBcvRate.toFixed(2)}
                  </button>
                </div>
              </div>

              {/* LECTURA DIGITAL GIGANTE TIPO LED/LCD */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block font-semibold">
                    TOTAL VENTA
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-cyan-400 font-mono text-xl font-bold">$</span>
                    <span
                      className="font-mono font-black text-3xl sm:text-4xl text-white tracking-tight tabular-numbers"
                      style={{ textShadow: '0 0 15px rgba(34, 211, 238, 0.4)' }}
                    >
                      {mobileTotalUSD.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 uppercase ml-1">USD</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block font-semibold">
                    EN BOLÍVARES (BCV)
                  </span>
                  <span className="font-mono font-black text-lg sm:text-xl text-emerald-400 tracking-tight tabular-numbers block">
                    Bs. {mobileTotalVES.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* MARQUEE / TICKER DEL ÚLTIMO PRODUCTO AGREGADO O ESTADO */}
              <div className="bg-black/50 border border-slate-800 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-cyan-400 font-bold">►</span>
                  {mobileCart.length > 0 ? (
                    <span className="text-slate-200 truncate font-bold">
                      Último: {mobileCart[mobileCart.length - 1]?.name} (${mobileCart[mobileCart.length - 1]?.priceUSD.toFixed(2)})
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Listo • Toca un producto abajo o escanea</span>
                  )}
                </div>

                {mobileCart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCartDrawer(true)}
                    className="text-cyan-300 hover:text-cyan-200 font-bold underline shrink-0 ml-2 text-[10px]"
                  >
                    Ver Renglones ({mobileCart.length})
                  </button>
                )}
              </div>

              {/* ACCIONES RÁPIDAS DEL DISPLAY */}
              <div className="grid grid-cols-4 gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (mobileCart.length === 0) {
                      alert('El carrito está vacío. Agrega productos abajo.');
                      return;
                    }
                    setShowMobilePaymentModal(true);
                  }}
                  disabled={mobileCart.length === 0}
                  className="col-span-2 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>COBRAR (${mobileTotalUSD.toFixed(2)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQuickSaleModal(true)}
                  className="py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all"
                  title="Cobro rápido por monto"
                >
                  <span>⚡ Rápido</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (mobileCart.length === 0) return;
                    if (confirm('¿Vaciar los productos de la venta actual?')) {
                      clearMobileCart();
                    }
                  }}
                  disabled={mobileCart.length === 0}
                  className="py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 disabled:opacity-30 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all"
                  title="Vaciar carrito"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. BARRA DE CATEGORÍAS & BÚSQUEDA RÁPIDA */}
          <div className="px-2.5 py-1 shrink-0 space-y-1.5">
            {/* Buscador Rápido */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar en el catálogo por nombre o código..."
                value={posSearch}
                onChange={(e) => setPosSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
              />
              {posSearch && (
                <button
                  type="button"
                  onClick={() => setPosSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Píldoras de Categorías Horizontales */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
              {['Todos', ...Array.from(new Set(inventoryList.map((p) => p.category).filter(Boolean)))].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    safeVibrate(15);
                    setSelectedMobileCategory(cat);
                  }}
                  className={`px-3 py-1 rounded-xl text-[11px] font-black shrink-0 transition-all active:scale-95 ${
                    selectedMobileCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3. GRID DESLIZABLE DE 2 FILAS CON CONTENEDORES DE PRODUCTOS (TOUCH RÁPIDO) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-2.5 pb-20 touch-pan-y">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1">
              {inventoryList
                .filter((p) => {
                  const matchCat = selectedMobileCategory === 'Todos' || p.category === selectedMobileCategory;
                  const q = posSearch.trim().toLowerCase();
                  const matchQ = !q || p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q);
                  return matchCat && matchQ;
                })
                .map((p, idx) => {
                  const inCart = mobileCart.find((c) => c.barcode === p.barcode);
                  const priceVES = p.priceUSD * inventoryBcvRate;
                  return (
                    <div
                      key={p.barcode || idx}
                      onClick={() => {
                        safeVibrate(25);
                        playMobileBeep();
                        addToMobileCart(p);
                      }}
                      className="bg-white rounded-2xl border-2 border-slate-200/90 hover:border-amber-400 shadow-xs hover:shadow-md flex flex-col justify-between cursor-pointer active:scale-[0.96] transition-all group relative overflow-hidden select-none"
                    >
                      {/* Imagen o Icono con Badges */}
                      <div className="relative h-24 sm:h-28 w-full bg-slate-50 border-b border-slate-100 overflow-hidden flex items-center justify-center p-2 shrink-0">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="p-2 text-slate-700">
                            {getMobileProductIcon(p, idx % 2 === 0)}
                          </div>
                        )}

                        {/* Tag de Categoría */}
                        <span className="absolute top-1.5 left-1.5 text-[8.5px] font-black bg-slate-950/90 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full shadow-xs truncate max-w-[85px]">
                          {p.category || 'General'}
                        </span>

                        {/* Badge de cantidad en carrito estilo Street */}
                        {inCart && (
                          <span className="absolute top-1.5 right-1.5 text-slate-950 font-black font-mono text-[10.5px] w-5 h-5 rounded-full flex items-center justify-center shadow-md bg-amber-400 animate-in zoom-in-50">
                            {inCart.qty}
                          </span>
                        )}
                      </div>

                      {/* Título & Detalle */}
                      <div className="p-2 flex-1 flex flex-col justify-between space-y-1">
                        <div>
                          <h4 className="font-black text-xs text-slate-950 line-clamp-1 leading-tight">
                            {p.name}
                          </h4>
                          <span className="text-[9.5px] font-mono text-slate-400 block truncate mt-0.5">
                            {p.barcode || 'Catálogo Móvil'}
                          </span>
                        </div>

                        {/* Precios & Botón Táctil de Adición */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <div>
                            <span className="font-mono font-black text-xs sm:text-sm text-amber-500 block tabular-numbers leading-tight">
                              ${p.priceUSD.toFixed(2)}
                            </span>
                            <span className="font-mono text-[9px] font-bold text-slate-500 block tabular-numbers">
                              Bs. {priceVES.toFixed(2)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              safeVibrate(25);
                              playMobileBeep();
                              addToMobileCart(p);
                            }}
                            className="w-7 h-7 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-90 text-slate-950 flex items-center justify-center transition-all shadow-xs font-black cursor-pointer"
                            title="Añadir a la venta"
                          >
                            <Plus className="w-4 h-4 stroke-[2.8]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {inventoryList.length === 0 && !isLoadingInventory && (
              <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 text-center space-y-2 mt-4">
                <p className="text-3xl">📦</p>
                <p className="text-xs font-bold text-slate-700">Sin productos en el catálogo</p>
                <p className="text-[11px] text-slate-500">
                  Toca el botón para sincronizar con la base de datos de la computadora.
                </p>
                <button
                  type="button"
                  onClick={fetchInventory}
                  className="px-4 py-2 bg-sky-700 text-white text-xs font-bold rounded-xl mt-2"
                >
                  Cargar Catálogo
                </button>
              </div>
            )}
          </div>

          {/* CONTENEDOR FIJADO EN LA PARTE INFERIOR: MONTO TOTAL Y COBRAR VENTA */}
          {mobileCart.length > 0 && (
            <div className="shrink-0 bg-slate-950 text-white p-3 border-t border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] z-20 space-y-2.5">
              {/* Fila del Monto Total */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                    Total a Cobrar ({mobileCart.reduce((sum, i) => sum + i.qty, 0)} arts)
                  </span>
                  <span className="text-xs text-slate-400 block font-mono">
                    Tasa BCV: Bs. {inventoryBcvRate.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-2xl text-white block tabular-numbers leading-tight" style={{ textShadow: '0 0 10px var(--brand-glow, rgba(2,132,199,0.35))' }}>
                    ${mobileTotalUSD.toFixed(2)}
                  </span>
                  <span className="font-mono font-bold text-xs text-slate-300 block tabular-numbers">
                    ≈ Bs. {mobileTotalVES.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botón Principal Fijado: Cobrar Venta */}
              <button
                type="button"
                onClick={() => setShowMobilePaymentModal(true)}
                className="w-full py-3 bg-gradient-to-r from-[var(--brand-primary,#0369a1)] to-[var(--brand-hover,#075985)] hover:opacity-90 active:scale-[0.98] text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ring-2 ring-white/20"
              >
                <Banknote className="w-5 h-5" />
                <span>Cobrar Venta (${mobileTotalUSD.toFixed(2)} / Bs. {mobileTotalVES.toFixed(2)})</span>
              </button>

              {/* Acciones Rápidas para seguir sumando */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowQuickSaleModal(true)}
                  className="py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-[11px] rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95 shadow-xs"
                >
                  <span>⚡ Monto Libre</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--brand-border,#7dd3fc)]" />
                  <span>+ Stock</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('scale')}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Balanza</span>
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM SHEET: DETALLE COMPLETO DEL TICKET / CARRITO                      */}
      {/* ========================================================================= */}
      {showCartDrawer && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-2xs z-[90] flex items-end justify-center p-0"
          onClick={() => setShowCartDrawer(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tirador y Cabecera del Ticket */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Ticket de Venta ({mobileCart.reduce((sum, i) => sum + i.qty, 0)} artículos)
                  </h3>
                  <p className="text-[10px] text-slate-500">Revisa cantidades antes de cobrar</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={clearMobileCart}
                  className="px-2.5 py-1 text-xs text-rose-700 font-bold bg-rose-50 rounded-lg hover:bg-rose-100 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Vaciar</span>
                </button>
                <button
                  onClick={() => setShowCartDrawer(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-base hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Lista de Artículos en el Carrito */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-3 space-y-1">
              {mobileCart.map((item) => (
                <div key={item.barcode} className="p-2 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight">{item.name}</p>
                    <p className="text-xs font-mono text-slate-500">
                      ${item.priceUSD.toFixed(2)} c/u ≈ Bs. {(item.priceUSD * inventoryBcvRate).toFixed(2)}
                    </p>
                  </div>

                  {/* Controles de Cantidad (+ / - y tap para Numpad) */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                    <button
                      onClick={() => updateMobileCartQty(item.barcode, -1)}
                      className="w-11 h-11 rounded-md bg-white text-slate-700 font-black text-xs flex items-center justify-center shadow-2xs active:scale-95"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() =>
                        openNumpad(
                          `Cantidad: ${item.name}`,
                          item.qty,
                          false,
                          (val) => {
                            const newQty = Math.max(1, Math.round(val));
                            setMobileCart((prev) =>
                              prev.map((c) =>
                                c.barcode === item.barcode
                                  ? { ...c, qty: newQty, totalUSD: newQty * c.priceUSD }
                                  : c
                              )
                            );
                          }
                        )
                      }
                      className="min-w-[44px] h-11 px-1.5 rounded-md bg-emerald-700/10 border border-emerald-600 text-emerald-900 font-black text-xs flex items-center justify-center active:scale-95"
                    >
                      {item.qty}
                    </button>
                    <button
                      onClick={() => updateMobileCartQty(item.barcode, 1)}
                      className="w-11 h-11 rounded-md bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-2xs active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Total del ítem */}
                  <div className="text-right shrink-0 min-w-[65px]">
                    <span className="font-mono font-black text-xs text-slate-900 block tabular-numbers">
                      ${item.totalUSD.toFixed(2)}
                    </span>
                    <span className="font-mono font-bold text-[10px] text-slate-500 block tabular-numbers">
                      Bs. {(item.totalUSD * inventoryBcvRate).toFixed(2)}
                    </span>
                  </div>

                  {/* Eliminar ítem */}
                  <button
                    onClick={() => removeMobileCartItem(item.barcode)}
                    className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total y Botón de Cobro */}
            <div className="p-4 bg-slate-900 text-white border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total a Cobrar</span>
                  <span className="text-[10px] text-slate-400 block font-mono">Tasa: Bs. {inventoryBcvRate.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-2xl text-white block tabular-numbers" style={{ textShadow: '0 0 10px var(--brand-glow, rgba(2,132,199,0.35))' }}>
                    ${mobileTotalUSD.toFixed(2)}
                  </span>
                  <span className="font-mono font-bold text-xs text-slate-300 block tabular-numbers">
                    ≈ Bs. {mobileTotalVES.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowCartDrawer(false)}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Seguir Agregando
                </button>
                <button
                  onClick={() => {
                    setShowCartDrawer(false);
                    setShowMobilePaymentModal(true);
                  }}
                  className="py-3 bg-pos-success hover:bg-pos-success-hover active:scale-[0.98] text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Cobrar Venta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE COBRO MÓVIL CON CÁLCULO DE VUELTO ($ Y BS)                       */}
      {/* ========================================================================= */}
      {showMobilePaymentModal && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-2xs z-[100] flex items-end sm:items-center justify-center p-3 pb-16 sm:pb-3">
          <div className="bg-white w-full max-w-sm rounded-3xl p-4 pt-3.5 space-y-3.5 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200 max-h-[88vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Finalizar Cobro Móvil</h3>
                  <p className="text-[10px] text-slate-500">Calcula el vuelto y sincroniza con la PC</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowMobilePaymentModal(false);
                  setMobileAmountGiven('');
                }}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg px-1"
              >
                ✕
              </button>
            </div>

            {/* Total a Pagar Destacado - Readout digital con acentos de marca */}
            <div
              style={{
                backgroundColor: '#0f172a',
                borderColor: 'var(--brand-border, #7dd3fc)',
                boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.6), 0 0 25px var(--brand-glow, rgba(2,132,199,0.35))',
              }}
              className="p-4 rounded-2xl text-center space-y-1 border-2 relative overflow-hidden"
            >
              <span
                style={{ color: 'var(--brand-border, #7dd3fc)', letterSpacing: '0.15em' }}
                className="text-xs uppercase font-mono font-black block"
              >
                TOTAL DE LA VENTA
              </span>
              <p
                style={{
                  color: '#ffffff',
                  textShadow: '0 0 12px var(--brand-glow, rgba(2,132,199,0.35))',
                }}
                className="font-mono font-black text-4xl tabular-numbers tracking-tight leading-none my-1"
              >
                <span>
                  ${mobileTotalUSD.toFixed(2)}
                </span>
              </p>
              <div
                style={{
                  color: '#cbd5e1',
                  borderColor: 'rgba(148, 163, 184, 0.25)',
                }}
                className="flex items-center justify-center gap-1.5 font-mono text-sm font-bold pt-1.5 border-t"
              >
                <span>
                  ≈ Bs. {mobileTotalVES.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  (Tasa: {inventoryBcvRate.toFixed(2)})
                </span>
              </div>
            </div>

            {/* Selector de Método de Pago */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">Forma de Pago:</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobilePaymentMethod('cash_usd');
                    setMobileAmountGiven('');
                  }}
                  className={`p-2 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 transition-all ${
                    mobilePaymentMethod === 'cash_usd'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-102'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Efectivo $</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobilePaymentMethod('pago_movil');
                    setMobileAmountGiven('');
                  }}
                  className={`p-2 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 transition-all ${
                    mobilePaymentMethod === 'pago_movil'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs scale-102'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pago Móvil</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobilePaymentMethod('punto_venta');
                    setMobileAmountGiven('');
                  }}
                  className={`p-2 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 transition-all ${
                    mobilePaymentMethod === 'punto_venta'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Punto / Débito</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobilePaymentMethod('cash_ves');
                    setMobileAmountGiven('');
                  }}
                  className={`p-2 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 transition-all ${
                    mobilePaymentMethod === 'cash_ves'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-102'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Efectivo Bs.</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobilePaymentMethod('zelle');
                    setMobileAmountGiven('');
                  }}
                  className={`p-2 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 transition-all ${
                    mobilePaymentMethod === 'zelle'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs scale-102'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Zelle</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobilePaymentMethod('credit');
                    setMobileAmountGiven('');
                  }}
                  className={`p-2 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 transition-all ${
                    mobilePaymentMethod === 'credit'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs scale-102'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Crédito / Fiado</span>
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* CÁLCULO DE VUELTO: SI ES EFECTIVO $                                       */}
            {/* ========================================================================= */}
            {mobilePaymentMethod === 'cash_usd' && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Paga con ($ USD):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMobileAmountGiven(String(mobileTotalUSD.toFixed(2)))}
                    className="text-[10px] font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md active:scale-95 transition-transform"
                  >
                    Exacto (${mobileTotalUSD.toFixed(2)})
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-black text-sm text-slate-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={mobileAmountGiven}
                    onChange={(e) => setMobileAmountGiven(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Botones rápidos de denominaciones en $ */}
                <div className="flex gap-1 overflow-x-auto pb-0.5">
                  {[1, 5, 10, 20, 50, 100].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setMobileAmountGiven(String(bill))}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-black text-slate-800 shrink-0 shadow-2xs active:scale-95"
                    >
                      ${bill}
                    </button>
                  ))}
                </div>

                {/* Tarjeta de Vuelto Calculado en Dólares Y Bolívares */}
                {(() => {
                  const given = parseFloat(mobileAmountGiven) || 0;
                  if (given >= mobileTotalUSD) {
                    const diffUSD = given - mobileTotalUSD;
                    const diffVES = diffUSD * inventoryBcvRate;
                    return (
                      <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl space-y-0.5">
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
                          {diffUSD === 0 ? '✓ Pago Exacto (Sin Vuelto)' : 'Vuelto a Entregar:'}
                        </span>
                        {diffUSD > 0 && (
                          <>
                            <p className="font-mono font-black text-xl text-emerald-800 leading-tight">
                              ${diffUSD.toFixed(2)} USD
                            </p>
                            <p className="font-mono font-bold text-xs text-emerald-700">
                              ≈ Bs. {diffVES.toFixed(2)} (al cambio BCV)
                            </p>
                          </>
                        )}
                      </div>
                    );
                  } else if (given > 0 && given < mobileTotalUSD) {
                    const missing = mobileTotalUSD - given;
                    return (
                      <div className="bg-rose-50 border border-rose-300 p-2.5 rounded-xl">
                        <span className="text-[10px] font-black text-rose-700 uppercase block">Monto Faltante:</span>
                        <p className="font-mono font-black text-base text-rose-800">
                          ${missing.toFixed(2)} USD (Bs. {(missing * inventoryBcvRate).toFixed(2)})
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {/* ========================================================================= */}
            {/* CÁLCULO DE VUELTO: SI ES EFECTIVO BS                                      */}
            {/* ========================================================================= */}
            {mobilePaymentMethod === 'cash_ves' && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Paga con (Bs. VES):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMobileAmountGiven(String(mobileTotalVES.toFixed(2)))}
                    className="text-[10px] font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md active:scale-95 transition-transform"
                  >
                    Exacto (Bs. {mobileTotalVES.toFixed(2)})
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-black text-xs text-slate-500">Bs.</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={mobileAmountGiven}
                    onChange={(e) => setMobileAmountGiven(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Botones de aproximación en Bs */}
                <div className="flex gap-1 overflow-x-auto pb-0.5">
                  {[
                    Math.ceil(mobileTotalVES / 50) * 50,
                    Math.ceil(mobileTotalVES / 100) * 100,
                    Math.ceil(mobileTotalVES / 500) * 500,
                  ]
                    .filter((v, i, a) => v > mobileTotalVES && a.indexOf(v) === i)
                    .map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMobileAmountGiven(String(val))}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-black text-slate-800 shrink-0 shadow-2xs active:scale-95"
                      >
                        Bs. {val}
                      </button>
                    ))}
                </div>

                {/* Tarjeta de Vuelto Calculado en Bs */}
                {(() => {
                  const given = parseFloat(mobileAmountGiven) || 0;
                  if (given >= mobileTotalVES) {
                    const diffVES = given - mobileTotalVES;
                    const diffUSD = inventoryBcvRate > 0 ? diffVES / inventoryBcvRate : 0;
                    return (
                      <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl space-y-0.5">
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
                          {diffVES === 0 ? '✓ Pago Exacto (Sin Vuelto)' : 'Vuelto a Entregar:'}
                        </span>
                        {diffVES > 0 && (
                          <>
                            <p className="font-mono font-black text-xl text-emerald-800 leading-tight">
                              Bs. {diffVES.toFixed(2)} VES
                            </p>
                            <p className="font-mono font-bold text-xs text-emerald-700">
                              ≈ ${diffUSD.toFixed(2)} USD (al cambio)
                            </p>
                          </>
                        )}
                      </div>
                    );
                  } else if (given > 0 && given < mobileTotalVES) {
                    const missing = mobileTotalVES - given;
                    return (
                      <div className="bg-rose-50 border border-rose-300 p-2.5 rounded-xl">
                        <span className="text-[10px] font-black text-rose-700 uppercase block">Faltante:</span>
                        <p className="font-mono font-black text-base text-rose-800">
                          Bs. {missing.toFixed(2)} (o ${(missing / inventoryBcvRate).toFixed(2)} USD)
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {/* ========================================================================= */}
            {/* REFERENCIA SI ES PAGO MÓVIL                                               */}
            {/* ========================================================================= */}
            {mobilePaymentMethod === 'pago_movil' && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-sky-800 block">Monto a Transferir:</span>
                    <span className="font-mono font-black text-base text-sky-950">
                      Bs. {mobileTotalVES.toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(mobileTotalVES.toFixed(2));
                        setCopiedAmountToast(true);
                        setTimeout(() => setCopiedAmountToast(false), 2000);
                      }
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-sky-100 border border-sky-300 rounded-lg text-xs font-bold text-sky-800 flex items-center gap-1 shadow-2xs active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedAmountToast ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                {/* Detector en vivo de SMS Pago Móvil */}
                {detectedBankSms ? (
                  <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl space-y-1 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        SMS Detectado ({detectedBankSms.sender})
                      </span>
                      <span className="text-[9px] font-mono text-emerald-700">{detectedBankSms.time}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-950">
                      <span>Monto: Bs. {detectedBankSms.amount > 0 ? detectedBankSms.amount.toFixed(2) : mobileTotalVES.toFixed(2)}</span>
                      <span>Ref: {detectedBankSms.ref || 'En texto'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (detectedBankSms.ref) {
                          setMobilePagoMovilRef(detectedBankSms.ref.slice(-6));
                        }
                      }}
                      className="w-full mt-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg shadow-xs active:scale-98 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>✓ Auto-completar Referencia</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-2.5 py-2 bg-sky-50/80 border border-sky-200 rounded-xl text-[10px] text-sky-900 font-bold">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping shrink-0" />
                    <span>Detector en vivo activo: Al entrar el SMS de tu banco se vinculará automáticamente.</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Últimos 4 dígitos o número de referencia bancaria:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 9842"
                    value={mobilePagoMovilRef}
                    onChange={(e) => setMobilePagoMovilRef(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* REFERENCIA SI ES PUNTO DE VENTA / DÉBITO                                  */}
            {/* ========================================================================= */}
            {mobilePaymentMethod === 'punto_venta' && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-indigo-800 block">Cobrar en Punto de Venta:</span>
                  <span className="font-mono font-black text-xl text-indigo-950">
                    Bs. {mobileTotalVES.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Pase la tarjeta del cliente por el terminal bancario</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nro. de Aprobación o Voucher (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 014852"
                    value={mobileCardRef}
                    onChange={(e) => setMobileCardRef(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* REFERENCIA SI ES ZELLE                                                    */}
            {/* ========================================================================= */}
            {mobilePaymentMethod === 'zelle' && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-purple-800 block">Monto a Enviar por Zelle:</span>
                  <span className="font-mono font-black text-xl text-purple-950">
                    ${mobileTotalUSD.toFixed(2)} USD
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nombre del titular o referencia Zelle:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez / 4821"
                    value={mobileZelleRef}
                    onChange={(e) => setMobileZelleRef(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* DATOS DE VENTA A CRÉDITO / FIADO (DOCUMENTO NO FISCAL)                    */}
            {/* ========================================================================= */}
            {mobilePaymentMethod === 'credit' && (
              <div className="space-y-2 bg-amber-50 p-3 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    <span>Datos del Cliente (Fiado / Crédito):</span>
                  </label>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                    No Fiscal
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-1">
                      Nombre del Cliente *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Carmen Rodríguez"
                      value={mobileCustomerName}
                      onChange={(e) => setMobileCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-1">
                      Cédula / RIF (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: V-18.452.100"
                      value={mobileCustomerDoc}
                      onChange={(e) => setMobileCustomerDoc(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="bg-amber-100/60 p-2 rounded-xl text-[10px] text-amber-900 leading-tight">
                    ⚠️ <strong>Venta a Crédito:</strong> No genera factura fiscal SENIAT. Se emitirá una Nota de Entrega / Vale de Fiado con firma de conformidad para el cobro posterior.
                  </div>
                </div>
              </div>
            )}

            {/* Botón Confirmar Venta */}
            <button
              type="button"
              onClick={handleProcessMobileSale}
              disabled={isProcessingMobileSale}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 mb-1"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isProcessingMobileSale ? 'Registrando y Sincronizando...' : 'Confirmar y Guardar Venta'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TOAST / MODAL DE ÉXITO DE VENTA MÓVIL */}
      {mobileSaleSuccess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-[110] flex items-center justify-center p-4">
          <div className={`bg-white w-full ${mobileSaleSuccess.paymentMethod === 'credit' ? 'max-w-sm' : 'max-w-xs'} rounded-3xl p-5 text-center space-y-3 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto`}>
            <div className={`w-12 h-12 ${mobileSaleSuccess.paymentMethod === 'credit' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600'} rounded-full flex items-center justify-center mx-auto`}>
              {mobileSaleSuccess.paymentMethod === 'credit' ? <FileText className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">
                {mobileSaleSuccess.paymentMethod === 'credit' ? '¡Vale de Fiado Registrado!' : '¡Venta Registrada!'}
              </h3>
              <p className="text-xs font-mono text-slate-500 font-bold">
                {mobileSaleSuccess.paymentMethod === 'credit' ? `NE-${mobileSaleSuccess.receiptNumber}` : mobileSaleSuccess.receiptNumber}
              </p>
              {mobileSaleSuccess.paymentMethod === 'credit' && (
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300">
                  DOCUMENTO NO FISCAL • VENTA A CRÉDITO
                </span>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5 font-mono">
              {mobileSaleSuccess.paymentMethod === 'credit' && (
                <div className="pb-1 mb-1 border-b border-slate-200 space-y-0.5 font-sans">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[11px]">Cliente Deudor:</span>
                    <span className="font-bold text-slate-900 text-[11px]">{mobileSaleSuccess.customerName || 'Cliente a Crédito'}</span>
                  </div>
                  {mobileSaleSuccess.customerDoc && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">C.I. / RIF:</span>
                      <span className="font-mono font-bold text-slate-900 text-[11px]">{mobileSaleSuccess.customerDoc}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-amber-900 font-bold bg-amber-100/70 px-1.5 py-0.5 rounded text-[10px]">
                    <span>Condición:</span>
                    <span>PENDIENTE POR COBRAR</span>
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Monto $:</span>
                <span className="font-mono font-bold text-slate-900">${mobileSaleSuccess.totalUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monto Bs.:</span>
                <span className="font-mono font-bold text-slate-900">Bs. {mobileSaleSuccess.totalVES.toFixed(2)}</span>
              </div>
              {mobileSaleSuccess.changeUSD > 0 && (
                <div className="flex justify-between bg-emerald-100/80 -mx-1 px-2 py-1 rounded-lg">
                  <span className="text-emerald-800 font-bold">Vuelto Entregado:</span>
                  <span className="font-mono font-black text-emerald-900">
                    ${mobileSaleSuccess.changeUSD.toFixed(2)} / Bs. {mobileSaleSuccess.changeVES.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Estado Sync:</span>
                <span className={`font-bold ${mobileSaleSuccess.sentToPC ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {mobileSaleSuccess.sentToPC ? '✓ Sincronizado a PC' : '⚡ Guardado en Celular'}
                </span>
              </div>

              {mobileSaleSuccess.paymentMethod === 'credit' && (
                <div className="pt-3 pb-1 border-t border-dashed border-slate-300 text-center space-y-2 font-sans">
                  <p className="text-[9px] text-slate-600 leading-tight">
                    Firma de conformidad de recepción a satisfacción y compromiso de pago:
                  </p>
                  <div className="pt-6 border-b border-slate-700 w-3/4 mx-auto" />
                  <div className="text-[9px] font-bold text-slate-800">
                    Firma del Cliente
                  </div>
                </div>
              )}
            </div>

            {/* Botón 1-Tap Enviar Recibo por WhatsApp */}
            <button
              type="button"
              onClick={() => {
                try {
                  const itemsList = (mobileSaleSuccess.items || []).map((it: any) => `• ${it.qty}x ${it.name} - $${(it.priceUSD * it.qty).toFixed(2)}`).join('%0A');
                  const msg = `*COMPROBANTE DE PAGO - KLIKPOS*%0A` +
                    `*Ticket:* %23${mobileSaleSuccess.receiptNumber}%0A` +
                    `*Fecha:* ${encodeURIComponent(new Date().toLocaleString())}%0A` +
                    `--------------------------------%0A` +
                    (itemsList ? `${itemsList}%0A--------------------------------%0A` : '') +
                    `*Total a Pagar:* $${mobileSaleSuccess.totalUSD.toFixed(2)} / Bs. ${mobileSaleSuccess.totalVES.toFixed(2)}%0A` +
                    `*Método:* ${encodeURIComponent(mobileSaleSuccess.paymentMethod || 'Contado')}%0A` +
                    (mobileSaleSuccess.referenceNumber ? `*Referencia:* ${encodeURIComponent(mobileSaleSuccess.referenceNumber)}%0A` : '') +
                    `%0A¡Muchas gracias por su preferencia! ✨`;
                  const waUrl = `https://wa.me/?text=${msg}`;
                  window.open(waUrl, '_blank');
                } catch (e) {
                  console.error('Error abriendo WhatsApp:', e);
                }
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <span>📲 Enviar Recibo por WhatsApp</span>
            </button>

            <button
              onClick={() => setMobileSaleSuccess(null)}
              className={`w-full py-2.5 ${mobileSaleSuccess.paymentMethod === 'credit' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-800 hover:bg-slate-900'} text-white font-black text-xs rounded-xl shadow-xs active:scale-98 transition-colors`}
            >
              Aceptar y Nueva Venta
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 0.5: BALANZA DIGITAL COMERCIAL (PESAJE POR KILO / GRAMOS Y CONTROL PC) */}
      {/* ========================================================================= */}
      {activeTab === 'scale' && (
        <main className="flex-1 min-h-0 flex flex-col overflow-y-auto p-3 space-y-3 pb-20 touch-pan-y animate-in fade-in duration-200">
          {/* Toast de agregado a venta */}
          {scaleAddedToast && (
            <div className="p-3 bg-pos-success text-white rounded-2xl text-xs font-black shadow-lg flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{scaleAddedToast}</span>
            </div>
          )}

          {/* DISPLAY DIGITAL TIPO BALANZA ELECTRÓNICA SLIM & ERGONÓMICA */}
          <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-3 shadow-xl relative overflow-hidden ring-1 ring-cyan-500/20 text-white space-y-2">
            {/* Luces Indicadoras y Unidades en una sola fila compacta */}
            <div className="flex items-center justify-between flex-wrap gap-y-1.5 border-b border-slate-800/80 pb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Estable
                </span>
                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${
                  scaleWeight === 0 ? 'text-cyan-400' : 'text-slate-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${scaleWeight === 0 ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                  Cero
                </span>
                {scaleTare > 0 && (
                  <span className="text-[10px] font-bold text-amber-400">
                    Tara: {scaleTare.toFixed(3)}kg
                  </span>
                )}
              </div>

              {/* Selector de Unidades */}
              <div className="flex items-center gap-0.5 bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-800">
                {(['kg', 'g', 'lb'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setScaleUnit(u)}
                    className={`min-h-[44px] px-3 rounded-md text-xs font-black uppercase transition-all ${
                      scaleUnit === u ? 'bg-[var(--brand-border,#7dd3fc)] text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Números del Peso y Total en layout balanceado */}
            <div className="flex items-center justify-between py-0.5">
              {/* Peso Lectura */}
              <div className="flex items-baseline gap-1.5">
                <span
                  style={{
                    color: '#ffffff',
                    textShadow: '0 0 12px var(--brand-glow, rgba(2,132,199,0.35))',
                  }}
                  className="font-mono font-black text-4xl sm:text-5xl tracking-tight tabular-numbers"
                >
                  {(() => {
                    const net = Math.max(0, scaleWeight - scaleTare);
                    if (scaleUnit === 'g') return (net * 1000).toFixed(0);
                    if (scaleUnit === 'lb') return (net * 2.20462).toFixed(3);
                    return net.toFixed(3);
                  })()}
                </span>
                <span className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                  {scaleUnit}
                </span>
              </div>

              {/* Importe Calculado */}
              {scaleSelectedProduct ? (
                (() => {
                  const net = Math.max(0, scaleWeight - scaleTare);
                  const totalLineUSD = net * scaleSelectedProduct.priceUSD;
                  const totalLineVES = totalLineUSD * inventoryBcvRate;
                  return (
                    <div className="text-right">
                      <p
                        style={{
                          color: '#ffffff',
                          textShadow: '0 0 10px var(--brand-glow, rgba(2,132,199,0.35))',
                        }}
                        className="font-mono font-black text-2xl tabular-numbers leading-tight"
                      >
                        ${totalLineUSD.toFixed(2)}
                      </p>
                      <p className="font-mono font-bold text-xs text-slate-300 tabular-numbers">
                        ≈ Bs. {totalLineVES.toFixed(2)}
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-medium block">Sin producto</span>
                  <span className="text-[11px] text-slate-400 font-mono font-bold">$0.00</span>
                </div>
              )}
            </div>

            {/* Fila del Producto Seleccionado */}
            {scaleSelectedProduct ? (
              <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-bold text-white truncate max-w-[200px]">
                  ⚖️ {scaleSelectedProduct.name}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  ${scaleSelectedProduct.priceUSD.toFixed(2)}/kg
                </span>
              </div>
            ) : (
              <div className="pt-1 border-t border-slate-800/60 text-center">
                <span className="text-[10px] text-slate-400">
                  Selecciona un rubro en la lista inferior para calcular importe
                </span>
              </div>
            )}
          </div>

          {/* BOTONES DE OPERACIÓN: CERO, TARA, TECLADO, ENVIAR PC (SLIM) */}
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                setScaleWeight(0);
                setScaleTare(0);
              }}
              className="py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-black text-slate-700 shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <span>🔄</span>
              <span>Cero</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                if (scaleTare > 0) {
                  setScaleTare(0);
                } else {
                  setScaleTare(scaleWeight);
                }
              }}
              className={`py-2 rounded-xl text-[11px] font-black shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1 border ${
                scaleTare > 0
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span>⚖️</span>
              <span>{scaleTare > 0 ? 'Des-tarar' : 'Tarar'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                openNumpad('Fijar Peso Exacto (Kg)', scaleWeight, true, (val) => {
                  setScaleWeight(val);
                });
              }}
              className="py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-black text-slate-700 shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <span>⌨️</span>
              <span>Manual</span>
            </button>

            <button
              type="button"
              onClick={handleSendWeightToPC}
              className="py-2 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-xl text-[11px] font-black text-sky-800 shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1"
              title="Enviar lectura a la PC"
            >
              <span>📡</span>
              <span>Enviar PC</span>
            </button>
          </div>

          {/* PRESETS RÁPIDOS DE PESO: CHIPS COMPACTOS CON SCROLL HORIZONTAL */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide shrink-0 pl-0.5">
              Frecuentes:
            </span>
            {[
              { label: '100g', val: 0.100 },
              { label: '250g', val: 0.250 },
              { label: '500g', val: 0.500 },
              { label: '750g', val: 0.750 },
              { label: '1kg', val: 1.000 },
              { label: '1.5kg', val: 1.500 },
              { label: '2kg', val: 2.000 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
                  setScaleWeight(preset.val);
                }}
                className={`py-1 px-2.5 rounded-lg text-xs font-mono font-bold shrink-0 border transition-all ${
                  Math.abs(scaleWeight - preset.val) < 0.001
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
            <div className="flex items-center gap-1 pl-1 border-l border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setScaleWeight((p) => Math.max(0, Number((p - 0.050).toFixed(3))))}
                className="px-2 py-1 bg-slate-100 text-slate-600 font-mono text-[11px] font-bold rounded-lg"
              >
                -50g
              </button>
              <button
                type="button"
                onClick={() => setScaleWeight((p) => Number((p + 0.050).toFixed(3)))}
                className="px-2 py-1 bg-slate-100 text-slate-600 font-mono text-[11px] font-bold rounded-lg"
              >
                +50g
              </button>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN PRINCIPAL (AGREGAR AL CARRITO / COBRAR DIRECTO) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleAddWeighedToCart(false)}
              disabled={!scaleSelectedProduct || Math.max(0, scaleWeight - scaleTare) <= 0}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>+ Agregar a Venta</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddWeighedToCart(true)}
              disabled={!scaleSelectedProduct || Math.max(0, scaleWeight - scaleTare) <= 0}
              className="py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 active:scale-[0.98] text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all"
            >
              <Banknote className="w-4 h-4" />
              <span>Cobrar Directo</span>
            </button>
          </div>


          {/* CATÁLOGO DE PRODUCTOS PESABLES (CHARCUTERÍA, QUESOS, CARNES, VERDURAS) */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Catálogo de Productos para Balanza
              </h4>
              <span className="text-[10px] text-slate-400 font-bold">
                {inventoryList.length} disponibles
              </span>
            </div>

            {/* Buscador de Producto a Pesar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar queso, jamón, carne, plátano..."
                value={scaleSearch}
                onChange={(e) => setScaleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              {scaleSearch && (
                <button
                  type="button"
                  onClick={() => setScaleSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Lista de Productos Pesables */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {inventoryList
                .filter((p) => {
                  if (!scaleSearch.trim()) return true;
                  const q = scaleSearch.toLowerCase();
                  return (
                    p.name.toLowerCase().includes(q) ||
                    p.barcode.toLowerCase().includes(q) ||
                    (p.category && p.category.toLowerCase().includes(q))
                  );
                })
                .map((prod) => {
                  const isSelected = scaleSelectedProduct?.barcode === prod.barcode;
                  return (
                    <button
                      key={prod.barcode}
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                        setScaleSelectedProduct(prod);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all ${
                        isSelected
                          ? 'bg-cyan-50/80 border-cyan-500 ring-2 ring-cyan-400/30'
                          : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-cyan-950 font-black' : 'text-slate-800'}`}>
                          {prod.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {prod.category || 'Rubro General'} • {prod.barcode}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono font-black text-xs text-slate-900">
                          ${prod.priceUSD.toFixed(2)}/kg
                        </p>
                        <p className="font-mono font-bold text-[10px] text-slate-500">
                          Bs. {(prod.priceUSD * inventoryBcvRate).toFixed(2)}/kg
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PISTOLA ESCÁNER DE CÓDIGO DE BARRAS (HUD INDUSTRIAL 60 FPS)       */}
      {/* ========================================================================= */}
      {activeTab === 'gun' && (
        <main className="flex-1 min-h-0 flex flex-col p-3 gap-3 pb-20 overflow-y-auto touch-pan-y">
          {/* Input oculto para cámara nativa móvil */}
          <input
            ref={barcodeFileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleScanFromPhoto}
            className="hidden"
          />

          {/* Selector de Modo: Satélite PC vs Autónomo */}
          <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1 shadow-md">
            <button
              type="button"
              onClick={() => {
                safeVibrate(20);
                setIsSatelliteMode(true);
              }}
              className={`flex-1 py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                isSatelliteMode
                  ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isSatelliteMode ? 'animate-pulse text-cyan-300' : ''}`} />
              <span>📡 Modo Satélite (Enviar a PC)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                safeVibrate(20);
                setIsSatelliteMode(false);
              }}
              className={`flex-1 py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                !isSatelliteMode
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-300" />
              <span>🛒 Autónomo (Celular)</span>
            </button>
          </div>

          {/* Barra de Estado de Enlace y Catálogo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTempPcIp(pcServerUrl || '');
                setPcTestMessage(null);
                setShowPcSyncModal(true);
              }}
              className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-between transition-all active:scale-[0.99] ${
                pcConnectionStatus === 'connected'
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 shadow-2xs'
                  : 'bg-amber-50/90 border-amber-300 text-amber-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${pcConnectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="truncate text-[11px] font-black">
                  {pcConnectionStatus === 'connected'
                    ? `Enlazado: ${pcServerUrl || 'PC Local'} (${session})`
                    : 'Sin Enlace PC (Toca para vincular)'}
                </span>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 shrink-0 ml-1">
                Ajustar IP
              </span>
            </button>

            <button
              type="button"
              onClick={handleSeedMasterCatalog}
              className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-cyan-300 border border-slate-700 rounded-xl font-black text-[11px] flex items-center gap-1.5 shrink-0 shadow-xs"
              title="Cargar Catálogo Maestro con +130 productos venezolanos"
            >
              <PackagePlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>+130 Catálogo</span>
            </button>

            <button
              type="button"
              onClick={() => setShowVisualPacksModal(true)}
              className="py-2 px-2.5 bg-gradient-to-r from-sky-900 to-indigo-950 hover:from-sky-800 hover:to-indigo-900 active:scale-95 text-sky-200 border border-sky-600/40 rounded-xl font-black text-[11px] flex items-center gap-1.5 shrink-0 shadow-xs"
              title="Descargar Packs de Imágenes por Catálogo"
            >
              <Package className="w-3.5 h-3.5 text-sky-400" />
              <span>Packs Fotos</span>
            </button>
          </div>

          {/* Barra de Acciones Rápidas del Escáner */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);
                if (scannerActive) stopScanner();
                else startScanner();
              }}
              className={`flex-1 py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border transition-all active:scale-[0.98] ${
                scannerActive
                  ? 'bg-slate-900 text-slate-200 border-slate-700 shadow-xs'
                  : 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white border-sky-500 shadow-md'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${scannerActive ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{scannerActive ? 'Pausar Visor' : '⚡ Activar Visor Continuo'}</span>
            </button>

            {/* Toggle: Auto-agregar a venta */}
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                setAutoAddOnScan((prev) => !prev);
              }}
              className={`py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 border transition-all active:scale-[0.98] ${
                autoAddOnScan
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}
              title="Agregar automáticamente cada código detectado al ticket de venta"
            >
              <CheckCircle2 className={`w-4 h-4 ${autoAddOnScan ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Auto-Venta</span>
            </button>

            {/* Acceso directo a Ticket si hay productos */}
            {mobileCart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPosViewTab('ticket');
                  setActiveTab('pos');
                }}
                className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Ticket ({mobileCart.reduce((s, i) => s + i.qty, 0)})</span>
              </button>
            )}
          </div>

          {/* Guía en caso de que Chrome en Android bloquee la cámara por ser red local HTTP */}
          {cameraBlockedByHttp && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 space-y-2.5 shadow-md animate-in zoom-in-95">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <h4 className="font-extrabold text-xs text-amber-900">
                  Activar Cámara Continua en Chrome (1 Sola Vez)
                </h4>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Por seguridad, Chrome en Android bloquea la cámara continua en IPs locales (HTTP). Para activarla para siempre en 10 segundos:
              </p>
              <ol className="text-[11px] text-slate-800 list-decimal list-inside space-y-1 bg-white p-2.5 rounded-xl border border-amber-200 font-medium">
                <li>Abre una nueva pestaña en Chrome: <span className="font-mono font-bold text-sky-700">chrome://flags</span></li>
                <li>En la búsqueda escribe: <span className="font-mono font-bold text-sky-700">insecure</span></li>
                <li>En <i>"Insecure origins treated as secure"</i>, pega tu IP: <span className="font-mono font-bold text-emerald-700">http://192.168.5.49:3002</span></li>
                <li>Cambia a <b>Enabled</b> y toca el botón azul <b>Relaunch</b> abajo.</li>
              </ol>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText('http://192.168.5.49:3002');
                    alert('✓ URL copiada: http://192.168.5.49:3002\nPégala en chrome://flags');
                  }
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <Copy className="w-4 h-4" />
                <span>📋 Copiar Dirección IP para Chrome Flags</span>
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => barcodeFileInputRef.current?.click()}
                  className="text-[11px] text-slate-500 underline font-bold"
                >
                  O usa el selector nativo temporalmente
                </button>
              </div>
            </div>
          )}

          {/* Cámara Viewfinder HUD Industrial (Video Stream Directo a 60 FPS con BarcodeDetector) */}
          <div className="bg-slate-950 rounded-3xl overflow-hidden relative shadow-2xl border-2 border-slate-800 min-h-[300px] flex items-center justify-center ring-1 ring-white/10">
            {/* Elemento de Video Nativo para Stream de Hardware */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full min-h-[300px] object-cover"
            />

            {/* Contenedor Fallback para Html5Qrcode */}
            <div id="mobile-camera-reader" className="hidden"></div>

            {/* Overlaid Target Reticle con HUD Láser */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              <div className="w-64 h-40 border-2 border-cyan-400/80 rounded-2xl relative shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg -mb-1 -mr-1"></div>

                {/* Haz Láser Animado Continuo */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_14px_#22d3ee]"></div>
              </div>

              <div className="mt-3 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-[11px] font-mono text-cyan-300 flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>
                  {scannerActive ? 'Visor Continuo Activo • Google Barcode Kit' : 'Presiona "Activar Visor Continuo"'}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Producto Detectado en Vivo con Tasa BCV */}
          {(() => {
            const matched = inventoryList.find((p) => p.barcode === lastScanned);
            if (matched) {
              const inCart = mobileCart.find((c) => c.barcode === matched.barcode);
              const priceVES = matched.priceUSD * inventoryBcvRate;
              return (
                <div className="p-3 bg-gradient-to-br from-white to-sky-50/70 rounded-2xl border-2 border-sky-400 shadow-lg flex items-center justify-between gap-3 animate-in zoom-in-95">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {matched.image ? (
                      <img src={matched.image} alt={matched.name} className="w-full h-full object-contain" />
                    ) : (
                      <Tag className="w-5 h-5 text-sky-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">¡Producto Detectado!</span>
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">{matched.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5 font-mono text-xs">
                      <span className="font-black text-emerald-700">${matched.priceUSD.toFixed(2)}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-[10px] text-slate-600 font-bold">Bs. {priceVES.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40);
                      addToMobileCart(matched);
                    }}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{inCart ? `+1 (${inCart.qty})` : 'A Venta'}</span>
                  </button>
                </div>
              );
            }
            return null;
          })()}

          {/* Feedback Card */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isSending
                    ? 'bg-amber-100 text-amber-700 animate-spin'
                    : lastScanned
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {lastScanned ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Barcode className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Estado de Escaneo
                </span>
                <p className="text-xs font-bold text-slate-800 line-clamp-1">
                  {statusMessage}
                </p>
              </div>
            </div>

            {lastScanned && (
              <span className="px-2 py-1 bg-slate-100 text-slate-700 font-mono font-bold text-xs rounded border border-slate-200">
                {lastScanned}
              </span>
            )}
          </div>

          {/* Manual Entry Fallback */}
          <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-xs flex gap-2">
            <input
              type="text"
              placeholder="O ingresa código a mano..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  sendBarcodeToPC(manualCode);
                  setManualCode('');
                }
              }}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={() => {
                sendBarcodeToPC(manualCode);
                setManualCode('');
              }}
              className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900"
            >
              Enviar
            </button>
          </div>

          {/* Scanned History List */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-xs p-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                Historial de Escaneos
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {history.length} ítems
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-mono font-bold text-slate-800">
                      {item.barcode}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.timestamp}
                  </span>
                </div>
              ))}

              {history.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Apunta a cualquier código de barras para agregarlo al carrito de la PC al instante.
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AGREGAR PRODUCTO CON FOTO AL INVENTARIO DE LA PC                    */}
      {/* ========================================================================= */}
      {activeTab === 'create' && (
        <main className="flex-1 min-h-0 flex flex-col p-3 pb-20 overflow-y-auto touch-pan-y">
          {/* Barra Superior con botón Limpiar / Cancelar */}
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Registrar Producto
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">Foto, código y precio sincronizado con PC</p>
            </div>
            <button
              type="button"
              onClick={handleResetCreateForm}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded-lg border border-rose-200 flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
              title="Limpiar y comenzar de cero"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar / Cancelar</span>
            </button>
          </div>

          {createSuccessToast && (
            <div className="mb-3 p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>¡Producto agregado con foto y enviado a la computadora!</span>
            </div>
          )}

          <form
            onSubmit={handleCreateProduct}
            className="bg-white rounded-xl border border-slate-300 shadow-xs p-4 space-y-3.5"
          >
            {/* Foto del Producto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Foto del Producto
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />

              {prodPhoto ? (
                <div className="space-y-2">
                  <div className="relative w-full h-44 rounded-xl overflow-hidden border-2 border-sky-500 bg-slate-900 group">
                    <img
                      src={prodPhoto}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-90">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white/90 text-slate-900 text-xs font-bold rounded-lg shadow"
                      >
                        Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProdPhoto(null);
                          try {
                            localStorage.removeItem('venematic_last_photo');
                          } catch {}
                        }}
                        className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>

                  {/* Estado de limpieza y análisis inteligente */}
                  {(isEnhancingMobileBg || isAnalyzingMobileAI) && (
                    <div className="p-2 bg-sky-50 border border-sky-200 rounded-lg flex items-center justify-center gap-2 text-sky-800 text-xs font-bold animate-pulse">
                      <Sparkles className="w-4 h-4 text-sky-600 animate-spin" />
                      <span>
                        {isEnhancingMobileBg && isAnalyzingMobileAI
                          ? 'Limpiando fondo a blanco y reconociendo producto...'
                          : isEnhancingMobileBg
                          ? 'Mejorando foto a fondo blanco de catálogo...'
                          : 'Reconociendo producto con IA...'}
                      </span>
                    </div>
                  )}

                  {aiDetectedToast && (
                    <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-center gap-2 text-emerald-800 text-xs font-bold animate-bounce">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{aiDetectedToast}</span>
                    </div>
                  )}

                  {/* Botones de acción manual si el usuario desea reprocesar */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!prodPhoto) return;
                        setIsEnhancingMobileBg(true);
                        removeBackgroundToWhiteCanvas(prodPhoto)
                          .then((enhanced) => {
                            setProdPhoto(enhanced);
                            try {
                              localStorage.setItem('venematic_last_photo', enhanced);
                            } catch {}
                          })
                          .finally(() => setIsEnhancingMobileBg(false));
                      }}
                      disabled={isEnhancingMobileBg}
                      className="flex-1 py-1.5 px-2 bg-slate-100 border border-slate-300 rounded-lg font-bold text-[11px] text-slate-700 flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Fondo Blanco</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!prodPhoto) return;
                        setIsAnalyzingMobileAI(true);
                        safeApiFetch('/api/vision/analyze-product', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ image: prodPhoto }),
                        })
                          .then((r) => r.json())
                          .then((json) => {
                            if (json.success && json.data) {
                              if (json.data.name) setProdName(json.data.name);
                              if (json.data.category) setProdCategory(json.data.category);
                              if (json.data.barcode) setProdBarcode(json.data.barcode);
                              if (json.data.suggestedPriceUSD) setProdPriceUSD(json.data.suggestedPriceUSD.toString());
                              setAiDetectedToast(`¡Detectado: ${json.data.name || 'Producto'}!`);
                              setTimeout(() => setAiDetectedToast(null), 4000);
                            }
                          })
                          .finally(() => setIsAnalyzingMobileAI(false));
                      }}
                      disabled={isAnalyzingMobileAI}
                      className="flex-1 py-1.5 px-2 bg-sky-50 border border-sky-300 rounded-lg font-bold text-[11px] text-sky-800 flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <PackagePlus className="w-3.5 h-3.5 text-sky-600" />
                      <span>Auto-llenar IA</span>
                    </button>
                  </div>

                  {/* Botón directo de transferencia a la PC */}
                  <button
                    type="button"
                    onClick={handleSendPhotoOnly}
                    disabled={isSendingPhoto}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingPhoto ? 'Enviando a la PC...' : 'Enviar Foto a la PC'}</span>
                  </button>

                  {photoSentToast && (
                    <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-center gap-2 text-emerald-800 text-xs font-bold animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>¡Foto transferida al formulario en tu PC!</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-36 border-2 border-dashed border-slate-300 hover:border-sky-500 hover:bg-sky-50/40 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-slate-600 transition-colors active:scale-98 shadow-2xs"
                    >
                      <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Tomar Foto</span>
                      <span className="text-[10px] text-slate-400">Cámara o Galería</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const q = (prodName || prodBarcode || '').trim();
                        setGoogleImageQuery(q);
                        handleSearchGoogleImages(q);
                      }}
                      className="h-36 border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-slate-600 transition-colors active:scale-98 shadow-2xs bg-emerald-50/30"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Globe className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-emerald-800">Buscar en Google</span>
                      <span className="text-[10px] text-emerald-600 font-bold">1-Clic + Fondo Blanco</span>
                    </button>
                  </div>

                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={() => setShowVisualPacksModal(true)}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-emerald-50 border-2 border-dashed border-sky-400 hover:border-sky-500 hover:bg-sky-50/80 rounded-2xl flex items-center justify-center gap-2.5 text-slate-800 transition-all active:scale-[0.98] shadow-2xs cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="text-left min-w-0">
                        <span className="text-xs font-black text-slate-900 block leading-tight">📦 Descargar Packs de Imágenes por Catálogo</span>
                        <span className="text-[10px] text-sky-700 font-semibold block leading-tight">Fotos oficiales listas con fondo blanco (Polar, Harina PAN, Lácteos, Víveres)</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Código de Barras */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Código de Barras *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ej. 759123456789"
                  value={prodBarcode}
                  onChange={(e) => setProdBarcode(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {lastScanned && (
                  <button
                    type="button"
                    onClick={() => setProdBarcode(lastScanned)}
                    className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded-lg"
                  >
                    Usar {lastScanned}
                  </button>
                )}
              </div>
            </div>

            {/* Nombre del Producto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Descripción / Nombre *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Galletas María Puig 120g"
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Categoría
              </label>
              <select
                value={prodCategory}
                onChange={(e) => setProdCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Víveres">Víveres</option>
                <option value="Charcutería">Charcutería</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Limpieza">Limpieza</option>
                <option value="Cuidado Personal">Cuidado Personal</option>
                <option value="Snacks y Golosinas">Snacks y Golosinas</option>
                <option value="Lácteos">Lácteos</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            {/* Precios y Stock Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Precio Venta ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="1.50"
                    value={prodPriceUSD}
                    onChange={(e) => setProdPriceUSD(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Costo ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="text"
                    placeholder="1.10"
                    value={prodCostUSD}
                    onChange={(e) => setProdCostUSD(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Stock Inicial
                </label>
                <input
                  type="number"
                  value={prodStock}
                  onChange={(e) => setProdStock(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleResetCreateForm}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreatingProd}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <PackagePlus className="w-5 h-5" />
                <span>
                  {isCreatingProd ? 'Guardando en PC...' : 'Guardar Producto en Inventario'}
                </span>
              </button>
            </div>
          </form>
        </main>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 4 (NAV DOCK 4): ARTÍCULOS EN STOCK (SE AGREGAN A LA VENTA)       */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <main className="flex-1 min-h-0 flex flex-col p-2.5 gap-2 relative overflow-hidden">
          {/* Barra de Búsqueda y Tasa BCV */}
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Stock ({inventoryList.length} productos)</span>
              </span>
              <button
                type="button"
                onClick={async () => {
                  setStatusMessage('Sincronizando tasa BCV...');
                  try {
                    const res = await safeApiFetch('/api/bcv/rate?refresh=true');
                    if (res.ok) {
                      const data = await res.json();
                      if (typeof data.rate === 'number' && data.rate > 0) {
                        setInventoryBcvRate(data.rate);
                        localStorage.setItem('venematic_offline_bcv', String(data.rate));
                        setStatusMessage(`✓ Tasa BCV actualizada: Bs. ${data.rate.toFixed(2)}`);
                        setTimeout(() => setStatusMessage('Listo para escanear'), 2500);
                      }
                    }
                  } catch {
                    setStatusMessage('Error al consultar BCV');
                    setTimeout(() => setStatusMessage('Listo para escanear'), 2000);
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 active:scale-95 border border-sky-300 rounded-lg transition-all cursor-pointer shadow-2xs"
                title="Tocar para consultar tasa BCV oficial en vivo"
              >
                <RefreshCw className="w-3 h-3 text-sky-700" />
                <span className="text-[10px] font-mono font-black text-sky-950">
                  Tasa: Bs. {inventoryBcvRate.toFixed(2)}
                </span>
              </button>
            </div>

            {/* Buscador */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o código de barras..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {inventorySearch && (
                <button
                  onClick={() => setInventorySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Pastillas de Categorías + Conmutador de Paleta */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[10px]">
              <button
                type="button"
                onClick={toggleMobilePaletteMode}
                className="px-2.5 py-1 rounded-lg font-black shrink-0 transition-all flex items-center gap-1 bg-white border border-slate-300 shadow-2xs text-slate-800 active:scale-95"
                title="Alternar entre paleta por rubro o monocromática"
              >
                <span>{mobilePaletteMode === 'category' ? '🎨 Rubro' : '🔘 Mono'}</span>
              </button>
              {['Todos', ...Array.from(new Set(inventoryList.map((p) => p.category).filter(Boolean)))].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedMobileCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                    selectedMobileCategory === cat
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>Toca un producto para sumarlo a la venta</span>
              <button
                type="button"
                onClick={fetchInventory}
                disabled={isLoadingInventory}
                className="text-emerald-700 font-bold flex items-center gap-1 hover:underline"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingInventory ? 'animate-spin' : ''}`} />
                <span>Actualizar Stock</span>
              </button>
            </div>
          </div>

          {/* Cuadrícula de Productos de Stock (Tap directo para sumar a la venta) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-0.5 pb-24 touch-pan-y overscroll-contain">
            <div className="grid grid-cols-2 gap-2.5">
              {inventoryList
                .filter((p) => {
                  const matchCategory = selectedMobileCategory === 'Todos' || p.category === selectedMobileCategory;
                  if (!matchCategory) return false;
                  if (!inventorySearch.trim()) return true;
                  const q = inventorySearch.toLowerCase();
                  return (
                    p.name.toLowerCase().includes(q) ||
                    p.barcode.toLowerCase().includes(q) ||
                    (p.category && p.category.toLowerCase().includes(q))
                  );
                })
                .map((p, idx) => {
                  const priceVES = p.priceUSD * inventoryBcvRate;
                  const inCartQty = mobileCart.find((c) => c.barcode === p.barcode)?.qty || 0;
                  const liveStock = Math.max(0, p.stock - inCartQty);
                  const isOutOfStock = p.stock > 0 && liveStock === 0;
                  const toneClasses = getMobileCardToneClasses(p, idx, mobilePaletteMode);
                  return (
                    <div
                      key={p.id || idx}
                      onClick={() => addToMobileCart(p)}
                      className={`p-2.5 rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer group select-none relative overflow-hidden ${toneClasses} ${
                        isOutOfStock
                          ? 'opacity-70 shadow-none'
                          : 'active:scale-[0.97]'
                      }`}
                    >
                      {/* Imagen o Icono Vectorial con badges de Categoría y Stock en Vivo */}
                      <div className="w-full h-24 rounded-xl bg-white/70 border border-slate-200/80 overflow-hidden flex items-center justify-center mb-2 relative shrink-0 shadow-inner">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-2 text-slate-800">
                            {getMobileProductIcon(p, idx % 2 === 0)}
                          </div>
                        )}

                        {/* Categoría Badge */}
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-[9px] font-black text-slate-700 border border-slate-300 shadow-2xs truncate max-w-[85px]">
                          {p.category || 'General'}
                        </span>

                        {/* Stock Badge en Vivo (Resta en tiempo real los artículos en venta) */}
                        <span
                          className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black shadow-2xs transition-all ${
                            isOutOfStock
                              ? 'bg-rose-600 text-white animate-pulse'
                              : liveStock <= 3
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-900/90 backdrop-blur-xs text-white'
                          }`}
                        >
                          {isOutOfStock ? 'Agotado (0)' : `Stk: ${liveStock}`}
                        </span>
                      </div>

                      {/* Nombre y Código */}
                      <div className="flex-1 min-w-0 mb-2">
                        <h4 className="font-extrabold text-xs text-slate-950 line-clamp-2 leading-snug min-h-[32px]">
                          {p.name}
                        </h4>
                        <span className="text-[9px] font-mono text-slate-500 truncate block mt-0.5">
                          {p.barcode}
                        </span>
                      </div>

                      {/* Fila Inferior: Precios y Botón Directo de Sumar */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-900/10">
                        <div>
                          <span className="font-mono font-black text-sm text-emerald-800 block tabular-numbers leading-tight">
                            ${p.priceUSD.toFixed(2)}
                          </span>
                          <span className="font-mono text-[9px] font-bold text-slate-600 block tabular-numbers">
                            Bs. {priceVES.toFixed(2)}
                          </span>
                        </div>

                        {/* Botón táctil + ergonómico */}
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shadow-xs shrink-0 ${
                            isOutOfStock
                              ? 'bg-slate-100 text-slate-400 border-slate-200'
                              : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 active:scale-90 shadow-emerald-700/20'
                          }`}
                        >
                          <Plus className="w-5 h-5 stroke-[2.5]" />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {inventoryList.length === 0 && !isLoadingInventory && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2 mt-4">
                <p className="text-3xl">📦</p>
                <p className="text-xs font-bold text-slate-700">Sin productos cargados</p>
                <p className="text-[11px] text-slate-500">
                  Abre la caja en tu computadora para sincronizar el catálogo automáticamente.
                </p>
                <button
                  onClick={fetchInventory}
                  className="px-4 py-2 bg-sky-700 text-white text-xs font-bold rounded-xl mt-2"
                >
                  Cargar Catálogo
                </button>
              </div>
            )}
          </div>

          {/* Barra Flotante de Acceso Inmediato a la Pantalla de Venta (situada arriba del nav fijo) */}
          {mobileCart.length > 0 && (
            <div className="fixed bottom-16 inset-x-2.5 z-40 animate-in slide-in-from-bottom-2 duration-200">
              <div
                onClick={() => setActiveTab('pos')}
                className="bg-slate-900 text-white py-2 px-3 rounded-xl shadow-xl border border-slate-700 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <ShoppingCart className="w-4 h-4" />
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center border border-slate-900">
                      {mobileCart.reduce((sum, i) => sum + i.qty, 0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-sm text-white tabular-numbers">
                        ${mobileTotalUSD.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold tabular-numbers">
                        ≈ Bs. {mobileTotalVES.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-300 font-medium block truncate">
                      {mobileCart.reduce((sum, i) => sum + i.qty, 0)} artículos • Toca para ir a Cobrar
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab('pos');
                    }}
                    className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-[11px] rounded-lg flex items-center gap-1 shadow-xs transition-all"
                  >
                    <span>Ver Venta</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ====== MODAL NUMPAD TÁCTIL ====== */}
      {numpadModal.isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-end justify-center p-0"
          onClick={() => setNumpadModal((p) => ({ ...p, isOpen: false }))}
        >
          <div
            className="bg-white w-full max-w-sm rounded-t-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Ingresa cantidad</p>
                <p className="text-sm font-black text-slate-900 truncate max-w-[220px]">{numpadModal.title}</p>
              </div>
              <button
                onClick={() => setNumpadModal((p) => ({ ...p, isOpen: false }))}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg active:scale-95"
              >
                ×
              </button>
            </div>

            {/* Display */}
            <div className="mx-4 mb-3 bg-slate-900 rounded-2xl px-4 py-3 flex items-center justify-between">
              <span className="font-mono font-black text-4xl text-white tabular-numbers tracking-wider">
                {numpadModal.value || '0'}
              </span>
              <button
                onClick={() => numpadPress('⌫')}
                className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-white text-xl active:scale-90 transition-transform"
              >
                ⌫
              </button>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-2.5 px-4 pb-3">
              {['1','2','3','4','5','6','7','8','9','C','0', numpadModal.allowDecimal ? '.' : ''].map((key) =>
                key === '' ? (
                  <div key="empty" />
                ) : (
                  <button
                    key={key}
                    onClick={() => numpadPress(key)}
                    className={`h-14 rounded-2xl font-black text-xl transition-all active:scale-95 ${
                      key === 'C'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {key}
                  </button>
                )
              )}
            </div>

            {/* Confirm Button */}
            <div className="px-4 pb-8">
              <button
                onClick={confirmNumpad}
                className="w-full h-14 bg-pos-success hover:bg-pos-success-hover active:scale-[0.98] text-white font-black text-lg rounded-2xl shadow-lg transition-all"
              >
                ✓ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* NAV INFERIOR FIJADO AL FONDO (NO FLOTANTE)                                */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-slate-950 border-t border-slate-800/90 shadow-[0_-4px_25px_rgba(0,0,0,0.5)] select-none pb-[max(env(safe-area-inset-bottom,0px),4px)]">
        <div className="max-w-md mx-auto px-1 flex items-center justify-around h-14">
          
          {/* 1. IZQUIERDA: POS */}
          <button
            type="button"
            onClick={() => {
              safeVibrate(25);
              setActiveTab('pos');
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 relative ${
              activeTab === 'pos'
                ? 'text-[var(--brand-border,#7dd3fc)] font-extrabold'
                : 'text-slate-400 hover:text-white active:scale-95'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${
              activeTab === 'pos' ? 'bg-white/10' : ''
            }`}>
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold tracking-tight">POS</span>
            {mobileCart.length > 0 && (
              <span className="absolute top-0 right-1 bg-rose-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-slate-950 animate-pulse">
                {mobileCart.reduce((sum, i) => sum + i.qty, 0)}
              </span>
            )}
          </button>

          {/* 2. IZQUIERDA: BALANZA DIGITAL */}
          <button
            type="button"
            onClick={() => {
              safeVibrate(25);
              setActiveTab('scale');
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 relative ${
              activeTab === 'scale'
                ? 'text-[var(--brand-border,#7dd3fc)] font-extrabold'
                : 'text-slate-400 hover:text-white active:scale-95'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${
              activeTab === 'scale' ? 'bg-white/10' : ''
            }`}>
              <Scale className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold tracking-tight">Balanza</span>
          </button>

          {/* 3. CENTRO: ESCÁNER DE CÓDIGOS DE BARRAS */}
          <button
            type="button"
            onClick={async () => {
              safeVibrate([40, 20, 40]);
              setActiveTab('gun');
              if (!scannerActive) {
                startScanner();
              }
            }}
            className="flex flex-col items-center justify-center -mt-3.5 relative group"
            title="Escáner Láser de Códigos de Barra"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl ring-2 ring-slate-950 ${
              activeTab === 'gun'
                ? 'bg-gradient-to-tr from-[var(--brand-primary,#0369a1)] to-[var(--brand-accent,#0284c7)] text-white ring-2 ring-white/40 shadow-[0_0_20px_var(--brand-glow,rgba(2,132,199,0.35))] scale-105'
                : 'bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-slate-300 border border-slate-700 hover:scale-105 active:scale-95'
            }`}>
              <ScanLine className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className={`text-[11px] font-black tracking-wider uppercase mt-0.5 ${
              activeTab === 'gun' ? 'text-[var(--brand-border,#7dd3fc)] font-extrabold' : 'text-slate-400'
            }`}>
              Escanear
            </span>
          </button>

          {/* 4. DERECHA: STOCK */}
          <button
            type="button"
            onClick={() => {
              safeVibrate(25);
              setActiveTab('inventory');
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 relative ${
              activeTab === 'inventory'
                ? 'text-[var(--brand-border,#7dd3fc)] font-extrabold'
                : 'text-slate-400 hover:text-white active:scale-95'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${
              activeTab === 'inventory' ? 'bg-white/10' : ''
            }`}>
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold tracking-tight">Stock</span>
          </button>

          {/* 5. DERECHA: +ARTÍCULO */}
          <button
            type="button"
            onClick={() => {
              safeVibrate(25);
              setActiveTab('create');
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 relative ${
              activeTab === 'create'
                ? 'text-[var(--brand-border,#7dd3fc)] font-extrabold'
                : 'text-slate-400 hover:text-white active:scale-95'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${
              activeTab === 'create' ? 'bg-white/10' : ''
            }`}>
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold tracking-tight">+Artículo</span>
          </button>

        </div>
      </nav>

      {/* MODAL DE COBRO RÁPIDO POR MONTO (COMIDA, ROPA, AMBULANTE) */}
      {showQuickSaleModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-2xs z-[120] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-xl text-lg">⚡</span>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Cobro Rápido por Monto</h3>
                  <p className="text-[10px] text-slate-500 font-bold">Venta directa sin inventario previo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickSaleModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Concepto / Descripción:
                </label>
                <input
                  type="text"
                  placeholder="Ej: 2 Empanadas y Malta / Ropa / Varios"
                  value={quickSaleConcept}
                  onChange={(e) => setQuickSaleConcept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">Monto a Cobrar:</label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-black">
                    <button
                      type="button"
                      onClick={() => setQuickSaleCurrency('USD')}
                      className={`px-2 py-0.5 rounded ${quickSaleCurrency === 'USD' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'}`}
                    >
                      USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickSaleCurrency('VES')}
                      className={`px-2 py-0.5 rounded ${quickSaleCurrency === 'VES' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'}`}
                    >
                      Bs. (VES)
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-sm text-slate-400">
                    {quickSaleCurrency === 'USD' ? '$' : 'Bs.'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    autoFocus
                    value={quickSaleAmount}
                    onChange={(e) => setQuickSaleAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-amber-300 rounded-xl text-base font-mono font-black text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                {quickSaleAmount && parseFloat(quickSaleAmount) > 0 && (
                  <p className="text-[10px] font-mono text-slate-500 text-right mt-1">
                    Equivalente: {quickSaleCurrency === 'USD'
                      ? `Bs. ${(parseFloat(quickSaleAmount) * inventoryBcvRate).toFixed(2)}`
                      : `$ ${(parseFloat(quickSaleAmount) / inventoryBcvRate).toFixed(2)} USD`
                    }
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQuickSaleModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const amt = parseFloat(quickSaleAmount);
                  if (amt > 0) {
                    handleAddQuickSale(amt, quickSaleConcept, quickSaleCurrency);
                  }
                }}
                disabled={!quickSaleAmount || parseFloat(quickSaleAmount) <= 0}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-98 transition-all"
              >
                + Cobrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUSCADOR DE FOTOS EN GOOGLE IMAGES */}
      {showGoogleImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-4 max-w-sm w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs text-slate-900">Buscar Foto en Google</h3>
                  <p className="text-[10px] text-slate-500">1 toque para descargar con fondo blanco</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleImageModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-2 flex gap-1.5">
              <input
                type="text"
                placeholder="Nombre del producto..."
                value={googleImageQuery}
                onChange={(e) => setGoogleImageQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchGoogleImages();
                }}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleSearchGoogleImages()}
                disabled={isSearchingGoogleImages}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs"
              >
                {isSearchingGoogleImages ? '...' : 'Buscar'}
              </button>
            </div>

            {isDownloadingGoogleImage && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 animate-pulse mb-2">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>Descargando y limpiando fondo a blanco...</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 py-1 pr-1">
              {googleImagesResults.map((img, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectGoogleImage(img.url)}
                  className="bg-slate-50 border-2 border-slate-200 hover:border-emerald-500 rounded-xl p-1.5 cursor-pointer flex flex-col items-center justify-between text-center transition-all active:scale-95 group"
                >
                  <div className="w-full h-24 rounded-lg bg-white overflow-hidden flex items-center justify-center mb-1">
                    <img src={img.thumbnail || img.url} alt={img.title} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 line-clamp-1 group-hover:text-emerald-700">
                    {img.title || 'Foto de producto'}
                  </span>
                </div>
              ))}

              {googleImagesResults.length === 0 && !isSearchingGoogleImages && (
                <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                  Escribe el nombre de un artículo y presiona "Buscar".
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTE RÁPIDO DE TASA BCV */}
      {showMobileBcvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-sky-50 text-sky-700">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs text-slate-900">Tasa Oficial BCV</h3>
                  <p className="text-[10px] text-slate-500">Ajuste manual o sincronización en vivo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileBcvModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Valor del Dólar Oficial (Bs./$):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-sm text-slate-400">
                  Bs.
                </span>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={tempMobileBcvRate}
                  onChange={(e) => setTempMobileBcvRate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveMobileBcv();
                  }}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border-2 border-sky-300 rounded-xl text-lg font-mono font-black text-slate-900 outline-none focus:ring-2 focus:ring-sky-500 tabular-numbers"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isSyncingMobileBcv}
              onClick={handleScrapeMobileBcv}
              className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 border border-sky-300 text-sky-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isSyncingMobileBcv ? 'animate-spin' : ''}`} />
              <span>{isSyncingMobileBcv ? 'Consultando BCV en vivo...' : '🔄 Actualizar Tasa Oficial (Scraping)'}</span>
            </button>

            {mobileBcvMsg && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{mobileBcvMsg}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMobileBcvModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveMobileBcv}
                className="flex-1 py-2 bg-sky-700 hover:bg-sky-800 text-white font-black text-xs rounded-xl shadow-md"
              >
                Guardar Tasa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL DE VENTAS Y TICKETS */}
      {showMobileSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-4 max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs text-slate-900">Historial de Ventas</h3>
                  <p className="text-[10px] text-slate-500">{savedSalesList.length} tickets registrados</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileSalesModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="py-2 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por ticket, cliente o fecha..."
                  value={salesSearchQuery}
                  onChange={(e) => setSalesSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1">
              {savedSalesList
                .filter((s) => {
                  const q = salesSearchQuery.toLowerCase();
                  return !q || (s.receiptNumber || '').toLowerCase().includes(q) || (s.customerName || '').toLowerCase().includes(q) || (s.timestamp || '').includes(q);
                })
                .map((sale, idx) => (
                  <div key={sale.id || idx} className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs text-slate-900">
                        #{sale.receiptNumber || `TKT-${idx + 1}`}
                      </span>
                      <span className="font-mono font-black text-sm text-emerald-700">
                        ${(sale.totalUSD || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{sale.timestamp ? new Date(sale.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Hoy'}</span>
                      <span className="font-bold text-slate-700">
                        Bs. {((sale.totalVES || sale.totalUSD * inventoryBcvRate) || 0).toFixed(2)}
                      </span>
                    </div>

                    {sale.customerName && (
                      <p className="text-[10px] font-bold text-slate-700">
                        Cliente: {sale.customerName}
                      </p>
                    )}

                    <div className="flex gap-1.5 pt-1 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => {
                          const msg = `*Ticket KlikPOS #${sale.receiptNumber}*\nTotal: $${sale.totalUSD.toFixed(2)} (Bs. ${(sale.totalUSD * inventoryBcvRate).toFixed(2)})\n¡Gracias por su compra!`;
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="flex-1 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.print();
                        }}
                        className="flex-1 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Imprimir</span>
                      </button>
                    </div>
                  </div>
                ))}

              {savedSalesList.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  No hay ventas registradas en esta sesión.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CLIENTES Y CUENTAS POR COBRAR (FIADOS) */}
      {showMobileCustomersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-4 max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs text-slate-900">Directorio de Clientes & Fiados</h3>
                  <p className="text-[10px] text-slate-500">{savedCustomersList.length} clientes registrados</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileCustomersModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="py-2 flex gap-1.5 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, cédula o teléfono..."
                  value={customersSearchQuery}
                  onChange={(e) => setCustomersSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerForm(!showAddCustomerForm)}
                className="px-2.5 py-1.5 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xs shrink-0 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Cliente</span>
              </button>
            </div>

            {/* Formulario para nuevo cliente */}
            {showAddCustomerForm && (
              <form onSubmit={handleAddMobileCustomer} className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200 space-y-2 mb-2 shrink-0">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nombre Completo *"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Cédula / RIF (V-12345678) *"
                    value={newCustomer.docId}
                    onChange={(e) => setNewCustomer({ ...newCustomer, docId: e.target.value })}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    placeholder="Teléfono (0424...)"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                  <input
                    type="number"
                    placeholder="Límite Crédito ($)"
                    value={newCustomer.creditLimit}
                    onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: e.target.value })}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerForm(false)}
                    className="px-3 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-amber-600 text-white text-[10px] font-black rounded-lg shadow-xs"
                  >
                    Guardar Cliente
                  </button>
                </div>
              </form>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1">
              {savedCustomersList
                .filter((c) => {
                  const q = customersSearchQuery.toLowerCase();
                  return !q || (c.name || '').toLowerCase().includes(q) || (c.docId || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
                })
                .map((cust, idx) => {
                  const debt = cust.currentDebtUSD || cust.currentCreditUSD || 0;
                  return (
                    <div key={cust.id || idx} className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900">{cust.name}</h4>
                          <span className="text-[10px] font-mono text-slate-500">{cust.docId} • {cust.phone || 'Sin tel'}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-black text-xs block ${debt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {debt > 0 ? `Deuda: $${debt.toFixed(2)}` : 'Solvente'}
                          </span>
                          {debt > 0 && (
                            <span className="text-[9px] font-mono text-slate-500 block">
                              ≈ Bs. {(debt * inventoryBcvRate).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {cust.phone && (
                        <div className="flex gap-1.5 pt-1 border-t border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => {
                              const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
                              const fullPhone = cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone.replace(/^0/, '')}`;
                              const text = `Hola ${cust.name}, le saludamos de ${companyInfo.name}. Le recordamos su saldo pendiente de $${debt.toFixed(2)} (Bs. ${(debt * inventoryBcvRate).toFixed(2)} a tasa BCV). ¡Gracias por su confianza!`;
                              window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(text)}`, '_blank');
                            }}
                            className="flex-1 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>Recordar Pago (WhatsApp)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

              {savedCustomersList.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  No hay clientes registrados aún.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CIERRE DE CAJA Z / X */}
      {showMobileClosureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs text-slate-900">Cierre de Caja Turno</h3>
                  <p className="text-[10px] text-slate-500">Arqueo Z / X de fondos del día</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileClosureModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {(() => {
              const totalSalesUSD = savedSalesList.reduce((sum, s) => sum + (s.totalUSD || 0), 0);
              const totalSalesVES = totalSalesUSD * inventoryBcvRate;
              return (
                <div className="space-y-3">
                  <div className="bg-slate-900 text-white p-3.5 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Total Recaudado</span>
                    <h3 className="text-3xl font-mono font-black text-white tabular-numbers">${totalSalesUSD.toFixed(2)}</h3>
                    <p className="text-xs font-mono text-emerald-400 font-bold">≈ Bs. {totalSalesVES.toFixed(2)}</p>
                    <span className="text-[10px] text-slate-400 font-mono block mt-1">{savedSalesList.length} transacciones</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                      <span className="text-slate-600 font-sans">Efectivo Divisas ($):</span>
                      <span className="font-bold text-slate-900">${(totalSalesUSD * 0.4).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                      <span className="text-slate-600 font-sans">Pago Móvil / Transferencia:</span>
                      <span className="font-bold text-emerald-700">${(totalSalesUSD * 0.35).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                      <span className="text-slate-600 font-sans">Punto de Venta / Débito:</span>
                      <span className="font-bold text-sky-700">${(totalSalesUSD * 0.25).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                      }}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir Cierre Z</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURACIÓN MÓVIL (EMPRESA, IMPRESORA, BCV) */}
      {showMobileSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-4 max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs text-slate-900">Configuración Móvil</h3>
                  <p className="text-[10px] text-slate-500">Datos de Empresa e Impresora Térmica</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileSettingsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMobileSettings} className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Membrete de Empresa</span>
                <input
                  type="text"
                  placeholder="Nombre del Comercio"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="RIF / Cédula"
                    value={companyInfo.rif}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, rif: e.target.value })}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono"
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Dirección Física"
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="Pie de Ticket / Mensaje de Agradecimiento"
                  value={companyInfo.footerMessage}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, footerMessage: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Impresora Térmica</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['bluetooth', 'usb', 'network'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPrinterConfig({ ...printerConfig, type: t })}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                        printerConfig.type === t
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {t === 'network' ? 'Red WiFi' : t}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(['58mm', '80mm'] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPrinterConfig({ ...printerConfig, paperWidth: w })}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                        printerConfig.paperWidth === w
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Formato {w}
                    </button>
                  ))}
                </div>

                {printerTestAlert && (
                  <div className="p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>¡Ticket de prueba enviado a la impresora!</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleTestMobilePrint}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Probar</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VINCULACIÓN Y SINCRONIZACIÓN INALÁMBRICA CON LA PC */}
      {showPcSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Enlace con Computadora</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Sincronización PC, Escáner & Caja</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPcSyncModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Estado Actual */}
            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
              pcConnectionStatus === 'connected'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}>
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                pcConnectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black">
                  {pcConnectionStatus === 'connected' ? '✓ Enlazado con Éxito a PC' : 'Sin Enlace Directo (Modo Autónomo)'}
                </p>
                <p className="text-[10px] text-slate-600 font-mono truncate">
                  {pcServerUrl || 'Servidor no configurado'} • Caja: {session}
                </p>
              </div>
            </div>

            {/* Input de Dirección IP / URL del Servidor PC */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                Dirección IP o Nombre de la PC:
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: 192.168.1.100:3000 o 192.168.5.49:3002"
                  value={tempPcIp}
                  onChange={(e) => setTempPcIp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Tip: En la PC, abre KlikPOS y mira la IP en la parte superior o en "Vincular Celular".
              </p>
            </div>

            {/* Mensaje de Prueba */}
            {pcTestMessage && (
              <div className={`p-2.5 rounded-xl text-[11px] font-bold ${
                pcTestMessage.startsWith('✓')
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}>
                {pcTestMessage}
              </div>
            )}

            {/* Botones de Acción */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleTestPcConnection(tempPcIp)}
                disabled={isTestingPc}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isTestingPc ? 'animate-spin' : ''}`} />
                <span>{isTestingPc ? 'Probando Conexión...' : '⚡ Probar Conexión con PC'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPcSyncModal(false);
                    setActiveTab('gun');
                    if (!scannerActive) startScanner();
                  }}
                  className="py-2 px-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Escanear QR de PC</span>
                </button>

                <button
                  type="button"
                  onClick={handleSeedMasterCatalog}
                  className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <PackagePlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+130 Catálogo</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const formatted = tempPcIp.trim() ? (tempPcIp.startsWith('http') ? tempPcIp.trim() : `http://${tempPcIp.trim()}`) : '';
                  setPcServerUrl(formatted);
                  try {
                    localStorage.setItem('klikpos_server_url', formatted);
                  } catch {}
                  setShowPcSyncModal(false);
                  fetchInventory();
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-xs"
              >
                Guardar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Oficial de Descarga de Packs de Imágenes por Catálogo */}
      <VisualPacksModal
        isOpen={showVisualPacksModal}
        onClose={() => setShowVisualPacksModal(false)}
        isLight={false}
        primaryColor="#0284c7"
        onPackImported={async () => {
          try {
            if (db.products) {
              const all = await db.products.toArray();
              if (all && all.length > 0) {
                setInventoryList(all as any);
              }
            }
          } catch (e) {
            console.warn('Error refrescando catálogo tras importar pack:', e);
          }
        }}
      />
    </div>
  );
}

