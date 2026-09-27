'use client';

import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  LayoutGrid,
  ClipboardList,
  Bike,
  CircleDollarSign,
  Menu,
  ShoppingCart,
  QrCode,
  Printer,
  Moon,
  Sun,
  X,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Search,
  Sparkles,
  Phone,
  Store,
  ChevronRight,
  TrendingUp,
  Receipt,
  Share2,
  Copy,
  Clock,
  ExternalLink,
  Flame,
  Check,
  Edit3,
  SlidersHorizontal,
  Tag,
  Palette
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  priceUSD: number;
  qty: number;
  notes?: string;
  category: string;
  image?: string;
  sku?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  priceUSD: number;
  image: string;
  description: string;
  tag: string;
  prepTime: string;
  sku: string;
  ingredients?: string[];
}

const BRAND_PALETTES = [
  { id: 'slate', name: 'Grafito Klik', primary: '#1e293b', hover: '#0f172a', accent: '#334155', glow: 'rgba(30, 41, 59, 0.4)' },
  { id: 'emerald', name: 'Esmeralda', primary: '#059669', hover: '#047857', accent: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
  { id: 'petrol', name: 'Petróleo', primary: '#0e4f5a', hover: '#0a3d46', accent: '#15616d', glow: 'rgba(14, 79, 90, 0.4)' },
  { id: 'blue', name: 'Azul Real', primary: '#2563eb', hover: '#1d4ed8', accent: '#3b82f6', glow: 'rgba(37, 99, 235, 0.4)' },
  { id: 'sky', name: 'Cielo', primary: '#0284c7', hover: '#0369a1', accent: '#38bdf8', glow: 'rgba(2, 132, 199, 0.4)' },
  { id: 'amber', name: 'Ámbar Sol', primary: '#d97706', hover: '#b45309', accent: '#f59e0b', glow: 'rgba(217, 119, 6, 0.4)' },
  { id: 'ruby', name: 'Rubí', primary: '#dc2626', hover: '#b91c1c', accent: '#ef4444', glow: 'rgba(220, 38, 38, 0.4)' },
  { id: 'purple', name: 'Púrpura', primary: '#7c3aed', hover: '#6d28d9', accent: '#8b5cf6', glow: 'rgba(124, 58, 237, 0.4)' },
  { id: 'coral', name: 'Coral Cálido', primary: '#ea580c', hover: '#c2410c', accent: '#f97316', glow: 'rgba(234, 88, 12, 0.4)' }
];

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Hamburguesa Doble Especial',
    category: 'Hamburguesas',
    priceUSD: 6.50,
    tag: '🔥 Más Vendido',
    prepTime: '8-10 min',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    description: 'Carne 200g, doble queso cheddar fundido, tocineta crujiente, vegetales frescos y salsa especial.',
    sku: 'HMB-01',
    ingredients: ['Carne Res 200g', 'Cheddar Fundido', 'Tocineta Ahumada', 'Salsa de la Casa']
  },
  {
    id: '2',
    name: 'Perro Caliente Especial Jumbo',
    category: 'Perros',
    priceUSD: 3.50,
    tag: '⭐ Favorito',
    prepTime: '4-6 min',
    image: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&q=80',
    description: 'Salchicha polaca premium, lluvia de queso blanco rallado, papitas crocantes y combo de 4 salsas.',
    sku: 'PER-01',
    ingredients: ['Salchicha Polaca', 'Queso Rallado', 'Papitas Rellenas', '4 Salsas']
  },
  {
    id: '3',
    name: 'Combo Parrillero Mixto XL',
    category: 'Combos',
    priceUSD: 12.00,
    tag: '💥 Ahorro',
    prepTime: '12-15 min',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    description: 'Lomito de res, pechuga a la brasa, chorizo ahumado, papas rústicas, ensalada cole slaw y guasacaca.',
    sku: 'CMB-01',
    ingredients: ['Lomito Res', 'Pechuga Grille', 'Chorizo Ahumado', 'Papas Rústicas']
  },
  {
    id: '4',
    name: 'Papas Fritas Gratinadas Tocineta',
    category: 'Extras',
    priceUSD: 4.00,
    tag: '🥓 Crujiente',
    prepTime: '6-8 min',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80',
    description: 'Canasta de papas fritas recién hechas bañadas en salsa cheddar y tocineta ahumada picada.',
    sku: 'EXT-01',
    ingredients: ['Papas Corte Grueso', 'Cheddar Caliente', 'Tocineta Crispy']
  },
  {
    id: '5',
    name: 'Pepito Mixto Gratinado 30cm',
    category: 'Hamburguesas',
    priceUSD: 8.50,
    tag: '🏆 Gigante',
    prepTime: '10-12 min',
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=80',
    description: 'Pan artesanal de 30cm, lomito jugoso, pollo grille, queso de mano gratinado, maíz y papitas.',
    sku: 'PEP-01',
    ingredients: ['Lomito Tierno', 'Pechuga Pollo', 'Queso de Mano', 'Maíz Tierno']
  },
  {
    id: '6',
    name: 'Refresco Familiar 1.5L Frío',
    category: 'Bebidas',
    priceUSD: 2.50,
    tag: '🧊 Bien Frío',
    prepTime: 'Inmediato',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80',
    description: 'Coca-Cola, Pepsi, Chinotto o Frescolita a temperatura bajo cero.',
    sku: 'BEB-01',
    ingredients: ['Envase 1.5 Litros', 'Bien Frío']
  },
  {
    id: '7',
    name: 'Tequeños Gourmet de Queso (6 uds)',
    category: 'Extras',
    priceUSD: 4.50,
    tag: '🧀 Crujientes',
    prepTime: '5-7 min',
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&q=80',
    description: 'Masa fina dorada rellena de abundante queso llanero fundido acompañado de salsa tártara de ajo.',
    sku: 'EXT-02',
    ingredients: ['6 Unidades Grandes', 'Queso Llanero Fundido', 'Salsa Tártara']
  },
  {
    id: '8',
    name: 'Crispy Chicken Supreme Burger',
    category: 'Hamburguesas',
    priceUSD: 7.00,
    tag: '🍗 Pollo Crispy',
    prepTime: '8-10 min',
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&q=80',
    description: 'Pechuga de pollo súper crujiente marinada con especias, lechuga romana, pepinillos y mayonesa chipotle.',
    sku: 'HMB-02',
    ingredients: ['Pechuga Empanizada', 'Lechuga Romana', 'Pepinillos Dulces', 'Mayo Chipotle']
  },
  {
    id: '9',
    name: 'Perro Caliente Tradicional Con Todo',
    category: 'Perros',
    priceUSD: 2.50,
    tag: '🌭 Callejero',
    prepTime: '3-5 min',
    image: 'https://images.unsplash.com/photo-1627054234036-749e4975f284?w=600&q=80',
    description: 'El clásico de la noche: salchicha, cebolla picadita, repollo, papitas, queso blanco y las 3 salsas.',
    sku: 'PER-02',
    ingredients: ['Salchicha Viena', 'Repollo y Cebollita', 'Queso Blanco', '3 Salsas Tradicionales']
  },
  {
    id: '10',
    name: 'Combo Pareja (2 Burgers + Papas + 2 Bebidas)',
    category: 'Combos',
    priceUSD: 14.50,
    tag: '👥 Para Dos',
    prepTime: '10-14 min',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80',
    description: '2 Hamburguesas Clásicas completas + 1 porción grande de papas + 2 bebidas de lata a elección.',
    sku: 'CMB-02',
    ingredients: ['2x Hamburguesas Clásicas', '1x Papas Grandes', '2x Bebidas Lata']
  },
  {
    id: '11',
    name: 'Malta Polar Retornable Bien Fría',
    category: 'Bebidas',
    priceUSD: 1.25,
    tag: '🍺 Clásica',
    prepTime: 'Inmediato',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
    description: 'Malta Polar con hielo frappé o servida directamente de la nevera.',
    sku: 'BEB-02',
    ingredients: ['Botella Vidrio 222ml', 'Fría de Nevera']
  },
  {
    id: '12',
    name: 'Aros de Cebolla Crujientes (8 uds)',
    category: 'Extras',
    priceUSD: 3.50,
    tag: '🧅 Frito',
    prepTime: '5-7 min',
    image: 'https://images.unsplash.com/photo-1639024471287-032f6640dc1f?w=600&q=80',
    description: 'Aros de cebolla dulce rebozados con panko extra crujiente servidos con salsa barbacoa.',
    sku: 'EXT-03',
    ingredients: ['8 Aros Grandes', 'Rebozado Panko', 'Salsa BBQ Ahumada']
  }
];

const CATEGORIES = ['Todos', 'Combos', 'Hamburguesas', 'Perros', 'Bebidas', 'Extras'];

const NOTE_PRESETS = [
  'Con todo (tradicional)',
  'Sin cebolla',
  'Sin salsas',
  'Extra salsa tártara',
  'Extra salsa de ajo',
  'Extra queso rallado',
  'Bien cocido / Dorado',
  'Para Llevar (Empaque térmico)'
];

export default function TabletMobilePosPage() {
  const [bcvRate, setBcvRate] = useState(848.55);
  const [activeTab, setActiveTab] = useState<'menu' | 'mesas' | 'pedidos' | 'delivery' | 'cobro'>('menu');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 4 Modos de Vista: 'food' (cards grandes), 'cuadricula', 'lista', 'minimalista'
  const [cardViewMode, setCardViewMode] = useState<'food' | 'cuadricula' | 'lista' | 'minimalista'>('food');

  // Identidad de Marca KlikPOS: Blanco Puro por defecto + Logo Gris Grafito
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [activePalette, setActivePalette] = useState('slate'); // Slate = Gris Grafito Oficial

  // Drawers y Modales
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [editingItemNotes, setEditingItemNotes] = useState<CartItem | null>(null);
  const [activeTable, setActiveTable] = useState<number | null>(null);

  // Cart State (Persistencia en LocalStorage para no perder ventas accidentales)
  const [cart, setCart] = useState<CartItem[]>([
    { id: '1', name: 'Hamburguesa Doble Especial', priceUSD: 6.50, qty: 2, category: 'Hamburguesas', notes: 'Sin cebolla, extra salsa tártara', sku: 'HMB-01', image: SAMPLE_PRODUCTS[0].image },
    { id: '6', name: 'Refresco Familiar 1.5L Frío', priceUSD: 2.50, qty: 1, category: 'Bebidas', sku: 'BEB-01', image: SAMPLE_PRODUCTS[5].image }
  ]);

  // Cargar estado guardado de Marca y Carrito
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('klikpos_card_view_mode') as 'food' | 'cuadricula' | 'lista' | 'minimalista';
      if (savedMode && ['food', 'cuadricula', 'lista', 'minimalista'].includes(savedMode)) {
        setCardViewMode(savedMode);
      }
      const savedTheme = localStorage.getItem('venematic_theme') as 'light' | 'dark';
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setThemeMode(savedTheme);
      }
      const savedPalette = localStorage.getItem('venematic_branding_palette');
      if (savedPalette && BRAND_PALETTES.some(p => p.id === savedPalette)) {
        setActivePalette(savedPalette);
      }
      const savedCart = localStorage.getItem('klikpos_tablet_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
        }
      }
    } catch {
      // Ignorar errores en modo incógnito
    }
  }, []);

  // Guardar cambios de branding y modo
  const changePalette = (palId: string) => {
    setActivePalette(palId);
    try {
      localStorage.setItem('venematic_branding_palette', palId);
    } catch {}
  };

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    try {
      localStorage.setItem('venematic_theme', next);
    } catch {}
  };

  useEffect(() => {
    try {
      localStorage.setItem('klikpos_card_view_mode', cardViewMode);
      localStorage.setItem('klikpos_tablet_cart', JSON.stringify(cart));
    } catch {}
  }, [cardViewMode, cart]);

  const currentPal = BRAND_PALETTES.find(p => p.id === activePalette) || BRAND_PALETTES[0];

  const totalUSD = cart.reduce((acc, item) => acc + (item.priceUSD * item.qty), 0);
  const totalVES = totalUSD * bcvRate;
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  const getCartQty = (productId: string) => {
    const found = cart.find((i) => i.id === productId);
    return found ? found.qty : 0;
  };

  const addToCart = (prod: Product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === prod.id);
      if (exists) {
        return prev.map((item) =>
          item.id === prod.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, {
        id: prod.id,
        name: prod.name,
        priceUSD: prod.priceUSD,
        qty: 1,
        category: prod.category,
        image: prod.image,
        sku: prod.sku
      }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const filteredProducts = SAMPLE_PRODUCTS.filter((p) => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isLight = themeMode === 'light';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans select-none overflow-x-hidden relative transition-colors duration-300 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
      style={{
        '--brand-color': currentPal.primary,
        '--brand-hover': currentPal.hover,
        '--brand-accent': currentPal.accent,
        '--brand-glow': currentPal.glow,
      } as React.CSSProperties}
    >
      {/* ========================================================================= */}
      {/* ESTILOS Y KEYFRAMES DINÁMICOS PARA FLUIDEZ Y MICROANIMACIONES             */}
      {/* ========================================================================= */}
      <style jsx global>{`
        @keyframes cobrarBreathe {
          0%, 100% {
            box-shadow: 0 0 18px var(--brand-glow), 0 0 40px rgba(0,0,0,0.15);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 32px var(--brand-glow), 0 0 60px rgba(0,0,0,0.25);
            transform: scale(1.04);
          }
        }
        @keyframes badgeSpring {
          0% { transform: scale(0.6); }
          60% { transform: scale(1.22); }
          100% { transform: scale(1); }
        }
        @keyframes viewSwitchSmooth {
          0% { opacity: 0; transform: scale(0.985) translateY(6px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes drawerSlideInLeft {
          from { transform: translateX(-100%); opacity: 0.5; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes drawerSlideInRight {
          from { transform: translateX(100%); opacity: 0.5; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes staggeredItem {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .anim-breathe {
          animation: cobrarBreathe 3s ease-in-out infinite;
        }
        .anim-badge-spring {
          animation: badgeSpring 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .anim-view-switch {
          animation: viewSwitchSmooth 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-drawer-left {
          animation: drawerSlideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-drawer-right {
          animation: drawerSlideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .stagger-1 { animation: staggeredItem 0.25s ease-out 0.05s both; }
        .stagger-2 { animation: staggeredItem 0.25s ease-out 0.10s both; }
        .stagger-3 { animation: staggeredItem 0.25s ease-out 0.15s both; }
        .stagger-4 { animation: staggeredItem 0.25s ease-out 0.20s both; }
        .stagger-5 { animation: staggeredItem 0.25s ease-out 0.25s both; }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. HEADER SUPERIOR OFICIAL KLIKPOS (BLANCO PURO + LOGO GRIS GRAFITO)       */}
      {/* ========================================================================= */}
      <header
        className={`h-14 px-3 flex items-center justify-between sticky top-0 z-30 shadow-xs border-b transition-colors duration-300 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        {/* Left: Botón Drawer Izquierdo (Ajustes, Branding y QR) */}
        <button
          onClick={() => setIsLeftDrawerOpen(true)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all duration-200 shadow-2xs active:scale-92 ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-100'
          }`}
          title="Abrir Ajustes y Branding de Colores"
        >
          <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300 transition-transform duration-200 group-hover:rotate-6" />
          <span className="text-xs font-black tracking-tight hidden sm:inline" style={{ color: isLight ? '#0f172a' : '#f8fafc' }}>
            Ajustes
          </span>
        </button>

        {/* Center: Identidad Oficial KlikPOS (Logo Gris Grafito sobre Blanco) */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse shadow-xs"
              style={{ backgroundColor: currentPal.primary }}
            />
            {/* Logo Oficial KlikPOS en Gris Grafito Intenso */}
            <span
              className="text-base font-black tracking-tight uppercase"
              style={{ color: isLight ? '#0f172a' : '#ffffff' }}
            >
              Klik<span style={{ color: currentPal.primary }}>POS</span>
            </span>
            <span className="text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-700 dark:text-slate-300 font-mono">
              PRO
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-500">
            BCV: <b className="font-mono" style={{ color: isLight ? '#0f172a' : '#38bdf8' }}>Bs. {bcvRate.toFixed(2)}</b>
          </span>
        </div>

        {/* Right: Botón Comanda / Carrito Activo */}
        <button
          onClick={() => setIsRightDrawerOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-md text-white transition-all duration-200 relative active:scale-92"
          style={{ backgroundColor: currentPal.primary }}
          title="Ver Comanda Activa"
        >
          <ShoppingCart className="w-4 h-4 text-white" />
          <span className="text-xs font-black text-white">${totalUSD.toFixed(2)}</span>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs anim-badge-spring">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      {/* ========================================================================= */}
      {/* 2. CANVAS PRINCIPAL                                                        */}
      {/* ========================================================================= */}
      <main className="flex-1 p-3 pb-28 max-w-5xl mx-auto w-full">
        {/* VISTA 1: MENÚ Y CATÁLOGO TÁCTIL */}
        {activeTab === 'menu' && (
          <div className="space-y-3">
            {/* Buscador + Píldoras de Categoría + Selector de Modo de Vista */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar perros, hamburguesas, bebidas, combos o SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs placeholder-slate-400 focus:outline-none transition-all duration-200 border ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                      : 'bg-slate-900 border-slate-800 text-white focus:border-slate-400'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-800"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Fila 1: Categorías con Conteo */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const count = cat === 'Todos'
                    ? SAMPLE_PRODUCTS.length
                    : SAMPLE_PRODUCTS.filter((p) => p.category === cat).length;
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 active:scale-95 border ${
                        isSelected
                          ? 'text-white shadow-sm scale-102 font-black'
                          : isLight
                          ? 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'
                          : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                      }`}
                      style={{
                        backgroundColor: isSelected ? currentPal.primary : undefined,
                        borderColor: isSelected ? currentPal.primary : undefined
                      }}
                    >
                      <span>{cat}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-white/20 text-white' : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Fila 2: Selector de los 4 Estilos de Vista de Cards */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1.5 border-t ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Estilo de Vista:
                  </span>
                </div>

                <div className={`grid grid-cols-4 gap-1 p-1 rounded-xl border ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  {/* Botón 1: Food (Cards Grandes) */}
                  <button
                    onClick={() => setCardViewMode('food')}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-black transition-all duration-250 flex items-center justify-center gap-1 active:scale-95 ${
                      cardViewMode === 'food'
                        ? 'bg-white text-slate-900 shadow-sm font-black dark:bg-slate-800 dark:text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                    style={{
                      borderBottom: cardViewMode === 'food' ? `2px solid ${currentPal.primary}` : undefined
                    }}
                    title="Tarjetas grandes de comida con fotos apetitosas e ingredientes"
                  >
                    <span>🍔 Food</span>
                  </button>

                  {/* Botón 2: Cuadrícula Estándar */}
                  <button
                    onClick={() => setCardViewMode('cuadricula')}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-black transition-all duration-250 flex items-center justify-center gap-1 active:scale-95 ${
                      cardViewMode === 'cuadricula'
                        ? 'bg-white text-slate-900 shadow-sm font-black dark:bg-slate-800 dark:text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                    style={{
                      borderBottom: cardViewMode === 'cuadricula' ? `2px solid ${currentPal.primary}` : undefined
                    }}
                    title="Cuadrícula compacta de 2 a 4 columnas"
                  >
                    <span>⊞ Cuadrícula</span>
                  </button>

                  {/* Botón 3: Lista Compacta */}
                  <button
                    onClick={() => setCardViewMode('lista')}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-black transition-all duration-250 flex items-center justify-center gap-1 active:scale-95 ${
                      cardViewMode === 'lista'
                        ? 'bg-white text-slate-900 shadow-sm font-black dark:bg-slate-800 dark:text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                    style={{
                      borderBottom: cardViewMode === 'lista' ? `2px solid ${currentPal.primary}` : undefined
                    }}
                    title="Lista de alta densidad para inventario o abastos"
                  >
                    <span>☰ Lista</span>
                  </button>

                  {/* Botón 4: Minimalista (Horas Pico) */}
                  <button
                    onClick={() => setCardViewMode('minimalista')}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-black transition-all duration-250 flex items-center justify-center gap-1 active:scale-95 ${
                      cardViewMode === 'minimalista'
                        ? 'bg-white text-slate-900 shadow-sm font-black dark:bg-slate-800 dark:text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                    style={{
                      borderBottom: cardViewMode === 'minimalista' ? `2px solid ${currentPal.primary}` : undefined
                    }}
                    title="Botones táctiles sin fotos para máxima velocidad"
                  >
                    <span>⚡ Minimalista</span>
                  </button>
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* RENDERIZADO DE LAS 4 VISTAS (EN BLANCO PURO + GRIS GRAFITO)        */}
            {/* =================================================================== */}

            {/* VISTA 1: FOOD CON CARDS GRANDES */}
            {cardViewMode === 'food' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 anim-view-switch">
                {filteredProducts.map((prod) => {
                  const qtyInCart = getCartQty(prod.id);
                  return (
                    <div
                      key={prod.id}
                      className={`border rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-slate-400'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Imagen Hero Grande Apetitosa con Badges */}
                      <div className="relative h-44 w-full overflow-hidden bg-slate-950 cursor-pointer" onClick={() => addToCart(prod)}>
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/25" />

                        {/* Badge de Etiqueta */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 text-[10px] font-black text-amber-400 shadow-md">
                          <span>{prod.tag}</span>
                        </div>

                        {/* Badge Tiempo de Preparación */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 text-[10px] font-mono font-bold text-slate-300">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span>{prod.prepTime}</span>
                        </div>

                        {/* Indicador Flotante si ya está en la Comanda */}
                        {qtyInCart > 0 && (
                          <div
                            className="absolute bottom-2.5 left-2.5 text-white px-2.5 py-0.5 rounded-full text-xs font-black shadow-lg flex items-center gap-1 anim-badge-spring"
                            style={{ backgroundColor: currentPal.primary }}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>{qtyInCart} en comanda</span>
                          </div>
                        )}
                      </div>

                      {/* Cuerpo de la Card Grande */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3
                              onClick={() => addToCart(prod)}
                              className="text-sm font-black transition-colors line-clamp-1 cursor-pointer"
                              style={{ color: isLight ? '#0f172a' : '#ffffff' }}
                            >
                              {prod.name}
                            </h3>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">#{prod.sku}</span>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {prod.description}
                          </p>

                          {/* Chips de Ingredientes Clave */}
                          {prod.ingredients && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {prod.ingredients.slice(0, 3).map((ing, idx) => (
                                <span
                                  key={idx}
                                  className={`text-[9px] px-2 py-0.5 rounded-md border ${
                                    isLight
                                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                                      : 'bg-slate-800/80 text-slate-300 border-slate-700/50'
                                  }`}
                                >
                                  {ing}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Barra Inferior: Precios Duales y Acciones */}
                        <div className={`pt-2.5 border-t flex items-center justify-between gap-2 ${
                          isLight ? 'border-slate-100' : 'border-slate-800'
                        }`}>
                          <div>
                            <span
                              className="text-base font-black font-mono block"
                              style={{ color: currentPal.primary }}
                            >
                              ${prod.priceUSD.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 block">
                              Bs. {(prod.priceUSD * bcvRate).toFixed(2)}
                            </span>
                          </div>

                          {/* Botón de Añadir o Stepper Directo */}
                          <div className="flex items-center gap-1.5">
                            {qtyInCart > 0 ? (
                              <div className={`flex items-center p-1 rounded-xl border gap-1.5 shadow-2xs ${
                                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
                              }`}>
                                <button
                                  onClick={() => updateQty(prod.id, -1)}
                                  className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white flex items-center justify-center active:scale-90 transition-transform"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span
                                  className="font-mono font-black text-xs w-5 text-center anim-badge-spring"
                                  style={{ color: currentPal.primary }}
                                >
                                  {qtyInCart}
                                </span>
                                <button
                                  onClick={() => updateQty(prod.id, 1)}
                                  className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-black active:scale-90 transition-transform shadow-xs"
                                  style={{ backgroundColor: currentPal.primary }}
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(prod)}
                                className="px-3.5 py-2 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 active:scale-92 transition-all duration-200"
                                style={{ backgroundColor: currentPal.primary }}
                              >
                                <Plus className="w-4 h-4 stroke-[3]" />
                                <span>Agregar</span>
                              </button>
                            )}

                            {/* Botón Personalizar Notas */}
                            <button
                              onClick={() => setEditingItemNotes({
                                id: prod.id,
                                name: prod.name,
                                priceUSD: prod.priceUSD,
                                qty: qtyInCart || 1,
                                category: prod.category,
                                notes: ''
                              })}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center border active:scale-92 transition-all duration-200 ${
                                isLight
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                              }`}
                              title="Personalizar (sin cebolla, salsas extras)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VISTA 2: CUADRÍCULA ESTÁNDAR (2 A 4 COLUMNAS - REGLA #3 CUMPLIDA) */}
            {cardViewMode === 'cuadricula' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 anim-view-switch">
                {filteredProducts.map((prod) => {
                  const qtyInCart = getCartQty(prod.id);
                  return (
                    <div
                      key={prod.id}
                      className={`border rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-200 shadow-2xs group relative ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-slate-400'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Imagen Cuadrada con Zoom Suave */}
                      <div className="relative overflow-hidden rounded-xl bg-slate-950 cursor-pointer" onClick={() => addToCart(prod)}>
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-28 sm:h-32 object-cover group-hover:scale-108 transition-transform duration-300 ease-out"
                        />
                        {qtyInCart > 0 && (
                          <span
                            className="absolute top-1.5 right-1.5 text-white font-black text-[10px] px-1.5 py-0.2 rounded-md shadow-md anim-badge-spring"
                            style={{ backgroundColor: currentPal.primary }}
                          >
                            x{qtyInCart}
                          </span>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 bg-slate-950/80 backdrop-blur-xs text-[9px] text-slate-300 font-mono px-1.5 py-0.2 rounded">
                          {prod.prepTime}
                        </span>
                      </div>

                      {/* Título de 2 líneas completas con min-h-[36px] (Regla #3 estricta) */}
                      <div className="mt-2 flex-1 flex flex-col justify-between">
                        <div>
                          <h4
                            onClick={() => addToCart(prod)}
                            className="text-xs font-black transition-colors line-clamp-2 min-h-[36px] leading-tight cursor-pointer"
                            style={{ color: isLight ? '#0f172a' : '#ffffff' }}
                          >
                            {prod.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">#{prod.sku}</span>
                        </div>

                        {/* Precios y Botón Tactil */}
                        <div className={`flex items-center justify-between mt-2 pt-1.5 border-t ${
                          isLight ? 'border-slate-100' : 'border-slate-800'
                        }`}>
                          <div>
                            <span
                              className="text-xs font-black font-mono block"
                              style={{ color: currentPal.primary }}
                            >
                              ${prod.priceUSD.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 block">
                              Bs. {(prod.priceUSD * bcvRate).toFixed(2)}
                            </span>
                          </div>

                          <button
                            onClick={() => addToCart(prod)}
                            className="w-7 h-7 rounded-lg text-white active:scale-90 flex items-center justify-center text-sm font-black transition-all shadow-xs"
                            style={{ backgroundColor: currentPal.primary }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VISTA 3: LISTA COMPACTA (ALTA DENSIDAD) */}
            {cardViewMode === 'lista' && (
              <div className={`border rounded-2xl divide-y overflow-hidden anim-view-switch ${
                isLight
                  ? 'bg-white border-slate-200 divide-slate-100'
                  : 'bg-slate-900 border-slate-800 divide-slate-800/80'
              }`}>
                {filteredProducts.map((prod) => {
                  const qtyInCart = getCartQty(prod.id);
                  return (
                    <div
                      key={prod.id}
                      className={`p-2.5 flex items-center justify-between transition-colors duration-150 gap-2 ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2 cursor-pointer flex-1" onClick={() => addToCart(prod)}>
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4
                              className="text-xs font-black truncate"
                              style={{ color: isLight ? '#0f172a' : '#ffffff' }}
                            >
                              {prod.name}
                            </h4>
                            {qtyInCart > 0 && (
                              <span
                                className="font-mono text-[10px] px-1.5 py-0.2 rounded font-black shrink-0 anim-badge-spring text-white"
                                style={{ backgroundColor: currentPal.primary }}
                              >
                                x{qtyInCart}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="font-mono">#{prod.sku}</span>
                            <span>•</span>
                            <span>{prod.category}</span>
                            <span>•</span>
                            <span>⏱️ {prod.prepTime}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span
                            className="text-xs font-black font-mono block"
                            style={{ color: currentPal.primary }}
                          >
                            ${prod.priceUSD.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 block">
                            Bs. {(prod.priceUSD * bcvRate).toFixed(2)}
                          </span>
                        </div>

                        {qtyInCart > 0 ? (
                          <div className={`flex items-center p-0.5 rounded-lg border gap-1 ${
                            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
                          }`}>
                            <button
                              onClick={() => updateQty(prod.id, -1)}
                              className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center text-xs font-black active:scale-90"
                            >
                              -
                            </button>
                            <span
                              className="font-mono font-black text-xs w-4 text-center anim-badge-spring"
                              style={{ color: currentPal.primary }}
                            >
                              {qtyInCart}
                            </span>
                            <button
                              onClick={() => updateQty(prod.id, 1)}
                              className="w-6 h-6 rounded text-white flex items-center justify-center text-xs font-black active:scale-90"
                              style={{ backgroundColor: currentPal.primary }}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(prod)}
                            className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-black text-base shadow-xs active:scale-90 transition-transform"
                            style={{ backgroundColor: currentPal.primary }}
                          >
                            +
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VISTA 4: MINIMALISTA (BOTONES TÁCTILES RÁPIDOS) */}
            {cardViewMode === 'minimalista' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 anim-view-switch">
                {filteredProducts.map((prod) => {
                  const qtyInCart = getCartQty(prod.id);
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => addToCart(prod)}
                      className={`p-3 rounded-2xl text-left flex flex-col justify-between h-28 transition-all duration-200 shadow-2xs group relative overflow-hidden active:scale-94 border-2 ${
                        isLight
                          ? 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-400'
                          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full gap-1">
                        <span
                          className="text-xs font-black line-clamp-2 leading-tight"
                          style={{ color: isLight ? '#0f172a' : '#ffffff' }}
                        >
                          {prod.name}
                        </span>
                        {qtyInCart > 0 ? (
                          <span
                            className="text-white font-black font-mono text-[10px] px-1.5 py-0.2 rounded-md shadow-xs shrink-0 anim-badge-spring"
                            style={{ backgroundColor: currentPal.primary }}
                          >
                            x{qtyInCart}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {prod.category}
                          </span>
                        )}
                      </div>

                      <div className={`w-full flex items-baseline justify-between pt-1.5 border-t ${
                        isLight ? 'border-slate-100' : 'border-slate-800'
                      }`}>
                        <span
                          className="text-sm font-black font-mono"
                          style={{ color: currentPal.primary }}
                        >
                          ${prod.priceUSD.toFixed(2)}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          Bs. {(prod.priceUSD * bcvRate).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VISTA 2: MESAS Y COMANDAS */}
        {activeTab === 'mesas' && (
          <div className="space-y-4 anim-view-switch">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                <LayoutGrid className="w-4 h-4" style={{ color: currentPal.primary }} />
                <span>Gestión de Mesas y Cuentas de Barra</span>
              </h2>
              <span className="text-xs text-slate-500">4 Cuentas Abiertas</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { id: 1, name: 'Mesa 1', status: 'libre', total: 0 },
                { id: 2, name: 'Mesa 2', status: 'ocupada', total: 18.50, items: 3, time: '14 min' },
                { id: 3, name: 'Mesa 3', status: 'ocupada', total: 6.50, items: 1, time: '5 min' },
                { id: 4, name: 'Mesa 4', status: 'libre', total: 0 },
                { id: 5, name: 'Barra 1', status: 'ocupada', total: 4.00, items: 1, time: '20 min' },
                { id: 6, name: 'Barra 2', status: 'libre', total: 0 },
                { id: 7, name: 'Puesto Calle', status: 'ocupada', total: 12.00, items: 2, time: '8 min' },
                { id: 8, name: 'Para Llevar #1', status: 'preparando', total: 15.00, items: 3, time: '3 min' },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setActiveTable(m.id);
                    if (m.total > 0) setIsRightDrawerOpen(true);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-28 relative active:scale-95 shadow-2xs ${
                    m.status === 'libre'
                      ? isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-900/60 border-slate-800'
                      : isLight ? 'bg-slate-50 border-slate-300 shadow-sm' : 'bg-slate-900 border-slate-700 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                      {m.name}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        m.status === 'libre'
                          ? 'bg-slate-400'
                          : m.status === 'preparando'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-emerald-500 animate-pulse'
                      }`}
                    />
                  </div>

                  {m.status !== 'libre' ? (
                    <div>
                      <span className="text-sm font-black font-mono block" style={{ color: currentPal.primary }}>
                        ${m.total.toFixed(2)}
                      </span>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>{m.items} ítems</span>
                        <span>⏱️ {m.time}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Disponible
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA 3: PEDIDOS ENTRANTES / COCINA */}
        {activeTab === 'pedidos' && (
          <div className="space-y-4 anim-view-switch">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                <ClipboardList className="w-4 h-4" style={{ color: currentPal.primary }} />
                <span>Pedidos en Tiempo Real (QR, WhatsApp & Local)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Columna 1: Nuevos */}
              <div className={`border rounded-2xl p-3 space-y-2.5 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between text-xs font-black text-amber-600 pb-1 border-b border-slate-200 dark:border-slate-800">
                  <span>🟡 NUEVOS ENTRANTES (2)</span>
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">QR Mesa</span>
                </div>
                <div className={`p-2.5 rounded-xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>Mesa 4 • Juan C.</span>
                    <span className="font-mono font-bold" style={{ color: currentPal.primary }}>$15.50</span>
                  </div>
                  <p className="text-[11px] text-slate-500">2x Hamburguesa Especial, 1x Papas Gratinadas</p>
                  <div className="flex gap-2 pt-1">
                    <button
                      className="flex-1 py-1.5 text-white rounded-lg text-xs font-black active:scale-95 transition-all"
                      style={{ backgroundColor: currentPal.primary }}
                    >
                      Aceptar
                    </button>
                    <button className="px-2 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold active:scale-95">
                      Imprimir
                    </button>
                  </div>
                </div>
              </div>

              {/* Columna 2: En Preparación */}
              <div className={`border rounded-2xl p-3 space-y-2.5 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between text-xs font-black text-sky-600 pb-1 border-b border-slate-200 dark:border-slate-800">
                  <span>🔵 EN PLANCHA / COCINA (1)</span>
                </div>
                <div className={`p-2.5 rounded-xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>Barra Puesto • María P.</span>
                    <span className="font-mono font-bold" style={{ color: currentPal.primary }}>$6.50</span>
                  </div>
                  <p className="text-[11px] text-slate-500">1x Pepito Mixto (Sin cebolla)</p>
                  <button className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-black active:scale-95">
                    Marcar Listo para Servir
                  </button>
                </div>
              </div>

              {/* Columna 3: Listos */}
              <div className={`border rounded-2xl p-3 space-y-2.5 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between text-xs font-black text-emerald-600 pb-1 border-b border-slate-200 dark:border-slate-800">
                  <span>🟢 LISTOS / ENTREGADOS</span>
                </div>
                <div className="p-3 text-center text-xs text-slate-400 italic">
                  Todos los pedidos listos fueron despachados.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VISTA 4: DELIVERY Y RUTAS */}
        {activeTab === 'delivery' && (
          <div className="space-y-4 anim-view-switch">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                <Bike className="w-4 h-4" style={{ color: currentPal.primary }} />
                <span>Despacho a Domicilio (Motorizados & WhatsApp)</span>
              </h2>
            </div>
            <div className={`border rounded-2xl p-6 text-center space-y-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <Bike className="w-14 h-14 mx-auto opacity-80" style={{ color: currentPal.primary }} />
              <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                Módulo de Repartidores Autónomo
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Controla los despachos con tu propio motorizado o canalízalos a través de la Red Universal de Delivery de KlikPOS.
              </p>
            </div>
          </div>
        )}

        {/* VISTA 5: PANTALLA DE COBRO COMPLETA */}
        {activeTab === 'cobro' && (
          <div className={`max-w-md mx-auto border rounded-3xl p-5 space-y-4 anim-view-switch shadow-xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="text-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total a Liquidar</span>
              <div className="text-3xl font-black font-mono mt-0.5" style={{ color: currentPal.primary }}>
                ${totalUSD.toFixed(2)} USD
              </div>
              <div className="text-sm font-mono font-bold text-slate-600 dark:text-slate-300">
                Bs. {totalVES.toFixed(2)} BCV
              </div>
            </div>

            {/* Métodos de Pago Rápidos */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                className="p-3.5 text-white active:scale-95 rounded-2xl text-xs font-black flex flex-col items-center gap-1.5 shadow-sm transition-all duration-200"
                style={{ backgroundColor: currentPal.primary }}
              >
                <Phone className="w-5 h-5" />
                <span>Pago Móvil (QR)</span>
              </button>
              <button className={`p-3.5 active:scale-95 rounded-2xl text-xs font-black flex flex-col items-center gap-1.5 border transition-all duration-200 ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
              }`}>
                <CircleDollarSign className="w-5 h-5 text-amber-500" />
                <span>Efectivo ($ / Bs)</span>
              </button>
              <button className={`p-3.5 active:scale-95 rounded-2xl text-xs font-black flex flex-col items-center gap-1.5 border transition-all duration-200 ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
              }`}>
                <Store className="w-5 h-5 text-sky-500" />
                <span>Zelle</span>
              </button>
              <button className={`p-3.5 active:scale-95 rounded-2xl text-xs font-black flex flex-col items-center gap-1.5 border transition-all duration-200 ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
              }`}>
                <Printer className="w-5 h-5 text-purple-500" />
                <span>Ticket Bluetooth</span>
              </button>
            </div>

            <button
              onClick={() => {
                alert('¡Venta Cobrada con Éxito!');
                setCart([]);
                setActiveTab('menu');
              }}
              className="w-full py-4 text-white font-black text-sm rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: currentPal.primary }}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirmar y Finalizar Venta</span>
            </button>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 3. DOCK INFERIOR CURVO ANIMADO (CON BOTÓN CENTRAL FLOTANTE "COBRAR")       */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 inset-x-0 z-40 flex justify-center pb-2 pointer-events-none">
        <div className="relative w-full max-w-md h-18 pointer-events-auto">
          {/* Fondo SVG Curvo con Notcha Cóncava en el Centro */}
          <svg
            className="absolute inset-0 w-full h-full drop-shadow-[0_-6px_18px_rgba(0,0,0,0.18)]"
            viewBox="0 0 380 68"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="
                M 24 0
                L 138 0
                C 152 0 158 10 163 24
                C 170 44 210 44 217 24
                C 222 10 228 0 242 0
                L 356 0
                C 369 0 380 11 380 24
                L 380 44
                C 380 57 369 68 356 68
                L 24 68
                C 11 68 0 57 0 44
                L 0 24
                C 0 11 11 0 24 0
                Z
              "
              fill={isLight ? '#ffffff' : '#090d16'}
              stroke={isLight ? '#cbd5e1' : '#1e293b'}
              strokeWidth="1.5"
            />
          </svg>

          {/* Iconos de Navegación Distribuidos con Animación de Selección Suave */}
          <div className="relative z-10 w-full h-full flex items-center justify-between px-5">
            {/* 1. Menú / Catálogo */}
            <button
              onClick={() => setActiveTab('menu')}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 active:scale-90 ${
                activeTab === 'menu' ? 'font-black scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}
              style={{ color: activeTab === 'menu' ? currentPal.primary : undefined }}
            >
              {activeTab === 'menu' && (
                <span
                  className="absolute inset-0 rounded-2xl -z-10 shadow-2xs opacity-15"
                  style={{ backgroundColor: currentPal.primary }}
                />
              )}
              <UtensilsCrossed className="w-5 h-5 stroke-[2.2] transition-transform duration-200" />
              <span className="text-[10px] mt-0.5 font-bold">Menú</span>
              {activeTab === 'menu' && (
                <span
                  className="w-1.5 h-1.5 rounded-full mt-0.5 anim-badge-spring shadow-xs"
                  style={{ backgroundColor: currentPal.primary }}
                />
              )}
            </button>

            {/* 2. Mesas / Cuentas */}
            <button
              onClick={() => setActiveTab('mesas')}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 active:scale-90 mr-8 ${
                activeTab === 'mesas' ? 'font-black scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}
              style={{ color: activeTab === 'mesas' ? currentPal.primary : undefined }}
            >
              {activeTab === 'mesas' && (
                <span
                  className="absolute inset-0 rounded-2xl -z-10 shadow-2xs opacity-15"
                  style={{ backgroundColor: currentPal.primary }}
                />
              )}
              <LayoutGrid className="w-5 h-5 stroke-[2.2] transition-transform duration-200" />
              <span className="text-[10px] mt-0.5 font-bold">Mesas</span>
              {activeTab === 'mesas' && (
                <span
                  className="w-1.5 h-1.5 rounded-full mt-0.5 anim-badge-spring shadow-xs"
                  style={{ backgroundColor: currentPal.primary }}
                />
              )}
            </button>

            {/* =================================================================== */}
            {/* BOTÓN CENTRAL FLOTANTE MÁS GRANDE "COBRAR" CON PULSO Y BRANDING     */}
            {/* =================================================================== */}
            <div className="absolute left-1/2 -top-4.5 -translate-x-1/2 flex flex-col items-center">
              <button
                onClick={() => setActiveTab('cobro')}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 group cursor-pointer anim-breathe text-white shadow-lg"
                style={{ backgroundColor: currentPal.primary }}
                title="Cobrar Cuenta / Abrir Caja"
              >
                <CircleDollarSign className="w-7 h-7 stroke-[2.5] text-white group-hover:rotate-12 transition-transform duration-200" />
              </button>
              <span
                className="text-[9px] font-black uppercase tracking-wider mt-1 drop-shadow-xs"
                style={{ color: currentPal.primary }}
              >
                Cobrar
              </span>
            </div>

            {/* 3. Pedidos / Cocina */}
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 active:scale-90 ml-8 ${
                activeTab === 'pedidos' ? 'font-black scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}
              style={{ color: activeTab === 'pedidos' ? currentPal.primary : undefined }}
            >
              {activeTab === 'pedidos' && (
                <span
                  className="absolute inset-0 rounded-2xl -z-10 shadow-2xs opacity-15"
                  style={{ backgroundColor: currentPal.primary }}
                />
              )}
              <ClipboardList className="w-5 h-5 stroke-[2.2] transition-transform duration-200" />
              <span className="text-[10px] mt-0.5 font-bold">Pedidos</span>
              {activeTab === 'pedidos' && (
                <span
                  className="w-1.5 h-1.5 rounded-full mt-0.5 anim-badge-spring shadow-xs"
                  style={{ backgroundColor: currentPal.primary }}
                />
              )}
            </button>

            {/* 4. Delivery / Envíos */}
            <button
              onClick={() => setActiveTab('delivery')}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 active:scale-90 ${
                activeTab === 'delivery' ? 'font-black scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}
              style={{ color: activeTab === 'delivery' ? currentPal.primary : undefined }}
            >
              {activeTab === 'delivery' && (
                <span
                  className="absolute inset-0 rounded-2xl -z-10 shadow-2xs opacity-15"
                  style={{ backgroundColor: currentPal.primary }}
                />
              )}
              <Bike className="w-5 h-5 stroke-[2.2] transition-transform duration-200" />
              <span className="text-[10px] mt-0.5 font-bold">Delivery</span>
              {activeTab === 'delivery' && (
                <span
                  className="w-1.5 h-1.5 rounded-full mt-0.5 anim-badge-spring shadow-xs"
                  style={{ backgroundColor: currentPal.primary }}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DRAWER IZQUIERDO: CONFIGURACIONES Y SELECTOR DE BRANDING DE COLORES     */}
      {/* ========================================================================= */}
      {isLeftDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop con Blur y Transición Suave */}
          <div
            onClick={() => setIsLeftDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
          />

          {/* Panel Lateral Deslizable de Ajustes */}
          <aside
            className={`relative w-80 max-w-[85vw] border-r h-full p-4 flex flex-col justify-between shadow-2xl z-10 anim-drawer-left overflow-y-auto ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5" style={{ color: currentPal.primary }} />
                  <span className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    Configuración KlikPOS
                  </span>
                </div>
                <button
                  onClick={() => setIsLeftDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 active:scale-90 transition-all duration-150"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SECCIÓN BRANDING DE COLORES (REQUERIMIENTO EXPLÍCITO) */}
              <div className={`p-3 rounded-2xl border space-y-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    <Palette className="w-4 h-4" style={{ color: currentPal.primary }} />
                    <span>Branding de Colores</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {currentPal.name}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {BRAND_PALETTES.map((pal) => (
                    <button
                      key={pal.id}
                      onClick={() => changePalette(pal.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all duration-200 active:scale-95 ${
                        activePalette === pal.id
                          ? 'ring-2 shadow-xs font-black'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: isLight ? '#ffffff' : '#0f172a',
                        borderColor: activePalette === pal.id ? pal.primary : isLight ? '#e2e8f0' : '#1e293b'
                      }}
                    >
                      <span
                        className="w-5 h-5 rounded-full shadow-xs flex items-center justify-center text-white text-[10px]"
                        style={{ backgroundColor: pal.primary }}
                      >
                        {activePalette === pal.id && '✓'}
                      </span>
                      <span className="text-[10px] truncate max-w-full font-bold" style={{ color: isLight ? '#0f172a' : '#f8fafc' }}>
                        {pal.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Alternador de Tema Blanco / Oscuro */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Lienzo:</span>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95"
                    style={{
                      backgroundColor: isLight ? '#ffffff' : '#1e293b',
                      borderColor: isLight ? '#cbd5e1' : '#334155',
                      color: isLight ? '#0f172a' : '#ffffff'
                    }}
                  >
                    {isLight ? <Moon className="w-3.5 h-3.5 text-slate-700" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{isLight ? 'Modo Oscuro' : 'Blanco Oficial'}</span>
                  </button>
                </div>
              </div>

              {/* Botón Destacado: Menú QR (Stagger 1) */}
              <button
                onClick={() => {
                  setIsLeftDrawerOpen(false);
                  setShowQrModal(true);
                }}
                className={`w-full p-3 rounded-2xl border flex items-center gap-3 text-left transition-all duration-200 shadow-2xs active:scale-96 stagger-1 ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    : 'bg-slate-950 hover:bg-slate-850 border-slate-800'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-black shrink-0 shadow-xs"
                  style={{ backgroundColor: currentPal.primary }}
                >
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    Menú Digital QR
                  </h4>
                  <p className="text-[10px] text-slate-500">Mostrar QR o Enviar por WhatsApp</p>
                </div>
              </button>

              {/* Lista de Herramientas Rápidas */}
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    const newRate = prompt('Ingresa nueva tasa BCV:', String(bcvRate));
                    if (newRate && !isNaN(Number(newRate))) setBcvRate(Number(newRate));
                  }}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all duration-150 active:scale-96 stagger-2 ${
                    isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <RefreshCw className="w-4 h-4 text-sky-500" />
                    <span>Ajustar Tasa BCV</span>
                  </div>
                  <span className="font-mono font-bold" style={{ color: currentPal.primary }}>
                    Bs. {bcvRate.toFixed(2)}
                  </span>
                </button>

                <button
                  onClick={() => alert('Datos de Pago Móvil configurados: Banco Banesco / 0414-1234567 / V-12345678')}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all duration-150 active:scale-96 stagger-3 ${
                    isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span>Datos Pago Móvil</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => alert('Ventas de Hoy:\nTotal $: $142.50\nTotal Bs: Bs. 120,918.37\nTickets: 18 ventas')}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all duration-150 active:scale-96 stagger-4 ${
                    isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <span>Reporte X del Día</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => alert('Buscando impresoras Bluetooth portátiles de 58mm...')}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all duration-150 active:scale-96 stagger-5 ${
                    isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Printer className="w-4 h-4 text-purple-500" />
                    <span>Impresora Bluetooth</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Conectar</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400 font-mono">
              KlikPOS Standalone v2.4.5 • Blanco & Grafito
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DRAWER DERECHO CON DESGLOSE DE COMANDA Y COBRO                         */}
      {/* ========================================================================= */}
      {isRightDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop con Blur */}
          <div
            onClick={() => setIsRightDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
          />

          {/* Panel Lateral de Comanda */}
          <aside
            className={`relative w-84 max-w-[88vw] border-l h-full p-4 flex flex-col justify-between shadow-2xl z-10 anim-drawer-right ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" style={{ color: currentPal.primary }} />
                  <span className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    {activeTable ? `Mesa #${activeTable}` : 'Comanda Actual'}
                  </span>
                </div>
                <button
                  onClick={() => setIsRightDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 active:scale-90 transition-all duration-150"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lista de Ítems en el Carrito */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs italic">
                    No hay productos en esta cuenta. Toca el menú para agregar.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border space-y-1.5 transition-all duration-200 ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <h4 className="text-xs font-black line-clamp-1" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-mono" style={{ color: currentPal.primary }}>
                            ${item.priceUSD.toFixed(2)} c/u
                          </span>
                        </div>
                        <span className="text-xs font-black font-mono" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                          ${(item.priceUSD * item.qty).toFixed(2)}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-[9px] text-amber-700 dark:text-amber-300 italic bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/40">
                          📝 {item.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => setEditingItemNotes(item)}
                          className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-white underline flex items-center gap-1 active:scale-95 transition-all"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{item.notes ? 'Editar Nota' : '+ Nota'}</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center text-xs font-black active:scale-90 transition-transform"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span
                            className="text-xs font-mono font-black w-4 text-center anim-badge-spring"
                            style={{ color: currentPal.primary }}
                          >
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-black active:scale-90 transition-transform shadow-xs"
                            style={{ backgroundColor: currentPal.primary }}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Totalizadores y Botón de Cobro Inmediato */}
            {cart.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Total USD:</span>
                  <span className="font-mono font-black text-base" style={{ color: currentPal.primary }}>
                    ${totalUSD.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Total Bs (BCV):</span>
                  <span className="font-mono font-black text-xs" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    Bs. {totalVES.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setCart([])}
                    className={`py-2.5 active:scale-95 text-xs font-bold rounded-xl border transition-all ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    Vaciar
                  </button>
                  <button
                    onClick={() => {
                      setIsRightDrawerOpen(false);
                      setActiveTab('cobro');
                    }}
                    className="py-2.5 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all duration-200"
                    style={{ backgroundColor: currentPal.primary }}
                  >
                    Ir a Cobrar ➔
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL INTERACTIVO DE PERSONALIZACIÓN Y NOTAS DE COCINA                 */}
      {/* ========================================================================= */}
      {editingItemNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md anim-view-switch">
          <div className={`border rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              onClick={() => setEditingItemNotes(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 active:scale-90 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: currentPal.primary }}>
                Personalizar Ítem
              </span>
              <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                {editingItemNotes.name}
              </h3>
            </div>

            {/* Presets de Comida Rápida Venezolana */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Opciones Frecuentes (1 Tap):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {NOTE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const current = editingItemNotes.notes || '';
                      const updated = current ? `${current}, ${preset}` : preset;
                      setEditingItemNotes({ ...editingItemNotes, notes: updated });
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all duration-150 active:scale-95 ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo Libre */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Nota Específica:
              </label>
              <input
                type="text"
                value={editingItemNotes.notes || ''}
                onChange={(e) => setEditingItemNotes({ ...editingItemNotes, notes: e.target.value })}
                placeholder="Ej. Tocineta bien crujiente, sin tártara..."
                className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-800'
                    : 'bg-slate-950 border-slate-800 text-white focus:border-slate-400'
                }`}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setCart((prev) =>
                    prev.map((i) =>
                      i.id === editingItemNotes.id ? { ...i, notes: '' } : i
                    )
                  );
                  setEditingItemNotes(null);
                }}
                className="py-2.5 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl active:scale-95 transition-all"
              >
                Limpiar
              </button>
              <button
                onClick={() => {
                  setCart((prev) => {
                    const exists = prev.find((i) => i.id === editingItemNotes.id);
                    if (exists) {
                      return prev.map((i) =>
                        i.id === editingItemNotes.id ? { ...i, notes: editingItemNotes.notes } : i
                      );
                    }
                    return [...prev, {
                      id: editingItemNotes.id,
                      name: editingItemNotes.name,
                      priceUSD: editingItemNotes.priceUSD,
                      qty: 1,
                      category: editingItemNotes.category,
                      notes: editingItemNotes.notes
                    }];
                  });
                  setEditingItemNotes(null);
                }}
                className="flex-1 py-2.5 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all duration-200"
                style={{ backgroundColor: currentPal.primary }}
              >
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL INTERACTIVO DE CÓDIGO QR PARA CLIENTES                           */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md anim-view-switch">
          <div className={`border rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 active:scale-90 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <span
                className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  backgroundColor: `${currentPal.primary}20`,
                  color: currentPal.primary
                }}
              >
                Menú Digital Interactivo
              </span>
              <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                Escanea para Ordenar
              </h3>
              <p className="text-xs text-slate-500">
                Apunta con la cámara de tu teléfono para ver la carta y hacer tu pedido.
              </p>
            </div>

            {/* Código QR Ilustrado */}
            <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-inner mx-auto max-w-[210px] border border-slate-200">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://klikpos.app/menu/klikburger?mesa=barra"
                alt="Código QR del Menú"
                className="w-40 h-40"
              />
              <span className="text-[10px] font-mono font-black text-slate-900 mt-1">
                klikpos.app/menu/klikburger
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText('https://klikpos.app/menu/klikburger');
                  alert('¡Enlace copiado al portapapeles!');
                }}
                className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Enlace</span>
              </button>
              <button
                onClick={() => {
                  window.open(
                    'https://api.whatsapp.com/send?text=Mira%20nuestro%20menú%20digital%20aquí:%20https://klikpos.app/menu/klikburger',
                    '_blank'
                  );
                }}
                className="py-2.5 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                style={{ backgroundColor: currentPal.primary }}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
