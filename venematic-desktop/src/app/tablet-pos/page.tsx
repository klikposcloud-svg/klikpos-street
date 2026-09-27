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
  Tag
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
  badgeColor: 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan';
  sku: string;
  ingredients?: string[];
}

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Hamburguesa Doble Especial',
    category: 'Hamburguesas',
    priceUSD: 6.50,
    tag: '🔥 Más Vendido',
    prepTime: '8-10 min',
    badgeColor: 'amber',
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
    badgeColor: 'rose',
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
    badgeColor: 'emerald',
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
    badgeColor: 'purple',
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
    badgeColor: 'amber',
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
    badgeColor: 'cyan',
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
    badgeColor: 'purple',
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
    badgeColor: 'amber',
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
    badgeColor: 'rose',
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
    badgeColor: 'emerald',
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
    badgeColor: 'cyan',
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
    badgeColor: 'purple',
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

  // Cargar estado guardado al iniciar
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('klikpos_card_view_mode') as 'food' | 'cuadricula' | 'lista' | 'minimalista';
      if (savedMode && ['food', 'cuadricula', 'lista', 'minimalista'].includes(savedMode)) {
        setCardViewMode(savedMode);
      }
      const savedCart = localStorage.getItem('klikpos_tablet_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
        }
      }
    } catch {
      // Ignorar errores de localStorage en modo incógnito
    }
  }, []);

  // Guardar carrito y vista al cambiar
  useEffect(() => {
    try {
      localStorage.setItem('klikpos_card_view_mode', cardViewMode);
      localStorage.setItem('klikpos_tablet_cart', JSON.stringify(cart));
    } catch {
      // Ignorar
    }
  }, [cardViewMode, cart]);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden relative">
      {/* ========================================================================= */}
      {/* 1. HEADER SUPERIOR TÁCTIL (Alto Contraste y Acceso Directo a Drawers)       */}
      {/* ========================================================================= */}
      <header
        className="h-14 border-b border-slate-800 px-3 flex items-center justify-between sticky top-0 z-30 shadow-md"
        style={{ backgroundColor: '#090d16' }}
      >
        {/* Left: Botón Drawer Izquierdo (Herramientas, Tasa BCV y Menú QR) */}
        <button
          onClick={() => setIsLeftDrawerOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-xl transition-all shadow-xs"
          title="Abrir Herramientas y Ajustes"
        >
          <Menu className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-black tracking-tight text-white hidden sm:inline" style={{ color: '#ffffff' }}>
            Ajustes & QR
          </span>
        </button>

        {/* Center: Nombre del Puesto / Logo */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-sm font-black tracking-tight uppercase" style={{ color: '#ffffff' }}>
              KlikBurger Express
            </h1>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">
            BCV: <b className="text-emerald-400 font-mono">Bs. {bcvRate.toFixed(2)}</b>
          </span>
        </div>

        {/* Right: Botón Drawer Derecho (Comanda / Ticket Activo con Contador) */}
        <button
          onClick={() => setIsRightDrawerOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl shadow-md transition-all relative"
          title="Ver Comanda Activa"
        >
          <ShoppingCart className="w-4 h-4 text-white" />
          <span className="text-xs font-black" style={{ color: '#ffffff' }}>${totalUSD.toFixed(2)}</span>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-bounce">
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
          <div className="space-y-3 animate-fadeIn">
            {/* Buscador + Píldoras de Categoría + Selector de Modo de Vista */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar perros, hamburguesas, bebidas, combos o SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Fila 1: Categorías en Píldoras Horizontales con Conteo */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const count = cat === 'Todos'
                    ? SAMPLE_PRODUCTS.length
                    : SAMPLE_PRODUCTS.filter((p) => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        selectedCategory === cat
                          ? 'bg-emerald-500 text-slate-950 shadow-md scale-102'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        selectedCategory === cat ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Fila 2: Selector de los 4 Estilos de Vista de Cards */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Estilo de Cards:
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                  {/* Botón 1: Food (Cards Grandes con Foto) */}
                  <button
                    onClick={() => setCardViewMode('food')}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1 ${
                      cardViewMode === 'food'
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Tarjetas grandes de comida con fotos apetitosas e ingredientes"
                  >
                    <span>🍔 Food</span>
                  </button>

                  {/* Botón 2: Cuadrícula Estándar */}
                  <button
                    onClick={() => setCardViewMode('cuadricula')}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1 ${
                      cardViewMode === 'cuadricula'
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Cuadrícula compacta de 2 a 4 columnas"
                  >
                    <span>⊞ Cuadrícula</span>
                  </button>

                  {/* Botón 3: Lista Compacta */}
                  <button
                    onClick={() => setCardViewMode('lista')}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1 ${
                      cardViewMode === 'lista'
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Lista de alta densidad para inventario o abastos"
                  >
                    <span>☰ Lista</span>
                  </button>

                  {/* Botón 4: Minimalista (Horas Pico) */}
                  <button
                    onClick={() => setCardViewMode('minimalista')}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1 ${
                      cardViewMode === 'minimalista'
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Botones táctiles sin fotos para máxima velocidad"
                  >
                    <span>⚡ Minimalista</span>
                  </button>
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* RENDERIZADO DE LAS 4 VISTAS DE PRODUCTOS                           */}
            {/* =================================================================== */}

            {/* VISTA 1: FOOD CON CARDS GRANDES (ESPECIAL COMIDA RÁPIDA / FOOD TRUCKS) */}
            {cardViewMode === 'food' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 animate-fadeIn">
                {filteredProducts.map((prod) => {
                  const qtyInCart = getCartQty(prod.id);
                  return (
                    <div
                      key={prod.id}
                      className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition-all hover:border-emerald-500/50 flex flex-col justify-between group relative"
                    >
                      {/* Imagen Hero Grande Apetitosa con Badges */}
                      <div className="relative h-44 w-full overflow-hidden bg-slate-950 cursor-pointer" onClick={() => addToCart(prod)}>
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Gradiente sutil inferior */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />

                        {/* Badge de Etiqueta (Más Vendido / Favorito) */}
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
                          <div className="absolute bottom-2.5 left-2.5 bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full text-xs font-black shadow-lg flex items-center gap-1 animate-pulse">
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
                              className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors line-clamp-1 cursor-pointer"
                            >
                              {prod.name}
                            </h3>
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">#{prod.sku}</span>
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {prod.description}
                          </p>

                          {/* Chips de Ingredientes Clave */}
                          {prod.ingredients && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {prod.ingredients.slice(0, 3).map((ing, idx) => (
                                <span
                                  key={idx}
                                  className="text-[9px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50"
                                >
                                  {ing}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Barra Inferior: Precios Duales y Acciones */}
                        <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-base font-black text-emerald-400 font-mono block">
                              ${prod.priceUSD.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              Bs. {(prod.priceUSD * bcvRate).toFixed(2)}
                            </span>
                          </div>

                          {/* Botón de Añadir o Stepper Directo en la Card */}
                          <div className="flex items-center gap-1.5">
                            {qtyInCart > 0 ? (
                              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1.5">
                                <button
                                  onClick={() => updateQty(prod.id, -1)}
                                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center active:scale-95"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono font-black text-xs text-emerald-400 w-5 text-center">
                                  {qtyInCart}
                                </span>
                                <button
                                  onClick={() => updateQty(prod.id, 1)}
                                  className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-black active:scale-95"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(prod)}
                                className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 text-xs font-black rounded-xl shadow-md flex items-center gap-1.5"
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
                              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700 active:scale-95"
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 animate-fadeIn">
                {filteredProducts.map((prod) => {
                  const qtyInCart = getCartQty(prod.id);
                  return (
                    <div
                      key={prod.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between hover:border-emerald-500/60 transition-all shadow-sm group relative"
                    >
                      {/* Imagen Cuadrada con Zoom */}
                      <div className="relative overflow-hidden rounded-xl bg-slate-950 cursor-pointer" onClick={() => addToCart(prod)}>
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-28 sm:h-32 object-cover group-hover:scale-105 transition-transform"
                        />
                        {qtyInCart > 0 && (
                          <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-md shadow-md">
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
                            className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors line-clamp-2 min-h-[36px] leading-tight cursor-pointer"
                          >
                            {prod.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">#{prod.sku}</span>
                        </div>

                        {/* Precios y Botón Tactil */}
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80">
                          <div>
                            <span className="text-xs font-black font-mono text-emerald-400 block">
                              ${prod.priceUSD.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 block">
                              Bs. {(prod.priceUSD * bcvRate).toFixed(2)}
                            </span>
                          </div>

                          <button
                            onClick={() => addToCart(prod)}
                            className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 active:scale-95 flex items-center justify-center text-sm font-black transition-all shadow-xs"
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

            {/* VISTA 3: LISTA COMPACTA (ALTA DENSIDAD PARA INVENTARIO / BODEGAS) */}
            {cardViewMode === 'lista' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden animate-fadeIn">
                {filteredProducts.map((prod) => {
                  const qtyInCart = getCartQty(prod.id);
                  return (
                    <div
                      key={prod.id}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2 cursor-pointer flex-1" onClick={() => addToCart(prod)}>
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-white truncate">{prod.name}</h4>
                            {qtyInCart > 0 && (
                              <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[10px] px-1.5 py-0.2 rounded font-black shrink-0">
                                x{qtyInCart}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="text-slate-500 font-mono">#{prod.sku}</span>
                            <span>•</span>
                            <span className="text-slate-300">{prod.category}</span>
                            <span>•</span>
                            <span>⏱️ {prod.prepTime}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-black font-mono text-emerald-400 block">
                            ${prod.priceUSD.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            Bs. {(prod.priceUSD * bcvRate).toFixed(2)}
                          </span>
                        </div>

                        {qtyInCart > 0 ? (
                          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 gap-1">
                            <button
                              onClick={() => updateQty(prod.id, -1)}
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs font-black"
                            >
                              -
                            </button>
                            <span className="font-mono font-black text-xs text-emerald-400 w-4 text-center">
                              {qtyInCart}
                            </span>
                            <button
                              onClick={() => updateQty(prod.id, 1)}
                              className="w-6 h-6 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center text-xs font-black"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(prod)}
                            className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-black text-base shadow-xs active:scale-95"
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

            {/* VISTA 4: MINIMALISTA (BOTONES TÁCTILES RÁPIDOS PARA HORAS PICO) */}
            {cardViewMode === 'minimalista' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 animate-fadeIn">
                {filteredProducts.map((prod) => {
                  const qtyInCart = getCartQty(prod.id);
                  // Color coding táctil por categoría
                  const borderClass =
                    prod.category === 'Hamburguesas'
                      ? 'border-amber-500/40 hover:border-amber-400'
                      : prod.category === 'Perros'
                      ? 'border-rose-500/40 hover:border-rose-400'
                      : prod.category === 'Combos'
                      ? 'border-emerald-500/40 hover:border-emerald-400'
                      : prod.category === 'Bebidas'
                      ? 'border-cyan-500/40 hover:border-cyan-400'
                      : 'border-purple-500/40 hover:border-purple-400';

                  const badgeBg =
                    prod.category === 'Hamburguesas'
                      ? 'bg-amber-500/20 text-amber-300'
                      : prod.category === 'Perros'
                      ? 'bg-rose-500/20 text-rose-300'
                      : prod.category === 'Combos'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : prod.category === 'Bebidas'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-purple-500/20 text-purple-300';

                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => addToCart(prod)}
                      className={`p-3 bg-slate-900 hover:bg-slate-850 active:scale-96 border-2 ${borderClass} rounded-2xl text-left flex flex-col justify-between h-28 transition-all shadow-xs group relative overflow-hidden`}
                    >
                      <div className="flex items-start justify-between w-full gap-1">
                        <span className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-tight">
                          {prod.name}
                        </span>
                        {qtyInCart > 0 ? (
                          <span className="bg-emerald-500 text-slate-950 font-black font-mono text-[10px] px-1.5 py-0.2 rounded-md shadow-xs shrink-0">
                            x{qtyInCart}
                          </span>
                        ) : (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${badgeBg}`}>
                            {prod.category}
                          </span>
                        )}
                      </div>

                      <div className="w-full flex items-baseline justify-between pt-1.5 border-t border-slate-800">
                        <span className="text-sm font-black font-mono text-emerald-400">
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
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-emerald-400" />
                <span>Gestión de Mesas y Cuentas de Barra</span>
              </h2>
              <span className="text-xs text-slate-400">4 Cuentas Abiertas</span>
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
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-28 relative ${
                    m.status === 'libre'
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      : m.status === 'preparando'
                      ? 'bg-amber-950/30 border-amber-500/60 shadow-md'
                      : 'bg-emerald-950/30 border-emerald-500/60 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{m.name}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        m.status === 'libre'
                          ? 'bg-slate-600'
                          : m.status === 'preparando'
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-emerald-400 animate-pulse'
                      }`}
                    />
                  </div>

                  {m.status !== 'libre' ? (
                    <div>
                      <span className="text-sm font-black font-mono text-emerald-400 block">
                        ${m.total.toFixed(2)}
                      </span>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>{m.items} ítems</span>
                        <span>⏱️ {m.time}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
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
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-400" />
                <span>Pedidos en Tiempo Real (QR, WhatsApp & Local)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Columna 1: Nuevos */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-amber-400 pb-1 border-b border-slate-800">
                  <span>🟡 NUEVOS ENTRANTES (2)</span>
                  <span className="text-[10px] bg-amber-400/20 px-2 py-0.5 rounded-full">QR Mesa</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-white">Mesa 4 • Juan C.</span>
                    <span className="text-emerald-400 font-mono font-bold">$15.50</span>
                  </div>
                  <p className="text-[11px] text-slate-400">2x Hamburguesa Especial, 1x Papas Gratinadas</p>
                  <div className="flex gap-2 pt-1">
                    <button className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black">
                      Aceptar
                    </button>
                    <button className="px-2 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">
                      Imprimir
                    </button>
                  </div>
                </div>
              </div>

              {/* Columna 2: En Preparación */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-sky-400 pb-1 border-b border-slate-800">
                  <span>🔵 EN PLANCHA / COCINA (1)</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-white">Barra Puesto • María P.</span>
                    <span className="text-emerald-400 font-mono font-bold">$6.50</span>
                  </div>
                  <p className="text-[11px] text-slate-400">1x Pepito Mixto (Sin cebolla)</p>
                  <button className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-black">
                    Marcar Listo para Servir
                  </button>
                </div>
              </div>

              {/* Columna 3: Listos */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-emerald-400 pb-1 border-b border-slate-800">
                  <span>🟢 LISTOS / ENTREGADOS</span>
                </div>
                <div className="p-3 text-center text-xs text-slate-500 italic">
                  Todos los pedidos listos fueron despachados.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VISTA 4: DELIVERY Y RUTAS */}
        {activeTab === 'delivery' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Bike className="w-4 h-4 text-emerald-400" />
                <span>Despacho a Domicilio (Motorizados & WhatsApp)</span>
              </h2>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
              <Bike className="w-14 h-14 text-emerald-400 mx-auto opacity-80" />
              <h3 className="text-sm font-black text-white">Módulo de Repartidores Autónomo</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Controla los despachos con tu propio motorizado o canalízalos a través de la Red Universal de Delivery de KlikPOS.
              </p>
            </div>
          </div>
        )}

        {/* VISTA 5: PANTALLA DE COBRO COMPLETA (CUANDO SE TOCA EL BOTÓN CENTRAL) */}
        {activeTab === 'cobro' && (
          <div className="max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 animate-fadeIn shadow-2xl">
            <div className="text-center pb-2 border-b border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total a Liquidar</span>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-0.5">
                ${totalUSD.toFixed(2)} USD
              </div>
              <div className="text-sm font-mono font-bold text-slate-300">
                Bs. {totalVES.toFixed(2)} BCV
              </div>
            </div>

            {/* Métodos de Pago Rápidos */}
            <div className="grid grid-cols-2 gap-2.5">
              <button className="p-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 rounded-2xl text-white text-xs font-black flex flex-col items-center gap-1.5 shadow-md">
                <Phone className="w-5 h-5" />
                <span>Pago Móvil (QR)</span>
              </button>
              <button className="p-3.5 bg-slate-800 hover:bg-slate-700 active:scale-98 rounded-2xl text-white text-xs font-black flex flex-col items-center gap-1.5 border border-slate-700">
                <CircleDollarSign className="w-5 h-5 text-amber-400" />
                <span>Efectivo ($ / Bs)</span>
              </button>
              <button className="p-3.5 bg-slate-800 hover:bg-slate-700 active:scale-98 rounded-2xl text-white text-xs font-black flex flex-col items-center gap-1.5 border border-slate-700">
                <Store className="w-5 h-5 text-sky-400" />
                <span>Zelle</span>
              </button>
              <button className="p-3.5 bg-slate-800 hover:bg-slate-700 active:scale-98 rounded-2xl text-white text-xs font-black flex flex-col items-center gap-1.5 border border-slate-700">
                <Printer className="w-5 h-5 text-purple-400" />
                <span>Ticket Bluetooth</span>
              </button>
            </div>

            <button
              onClick={() => {
                alert('¡Venta Cobrada con Éxito!');
                setCart([]);
                setActiveTab('menu');
              }}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirmar y Finalizar Venta</span>
            </button>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 3. DOCK INFERIOR CURVO ANIMADO (CON BOTÓN CENTRAL FLOTANTE MÁS GRANDE)     */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 inset-x-0 z-40 flex justify-center pb-2 pointer-events-none">
        <div className="relative w-full max-w-md h-18 pointer-events-auto">
          {/* Fondo SVG Curvo con Notcha Cóncava en el Centro (Exacto a la Imagen de Referencia) */}
          <svg
            className="absolute inset-0 w-full h-full drop-shadow-[0_-8px_20px_rgba(0,0,0,0.6)]"
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
              fill="#090d16"
              stroke="#1e293b"
              strokeWidth="1.5"
            />
          </svg>

          {/* Iconos de Navegación Distribuidos */}
          <div className="relative z-10 w-full h-full flex items-center justify-between px-5">
            {/* 1. Menú / Catálogo */}
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
                activeTab === 'menu' ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UtensilsCrossed className="w-5 h-5 stroke-[2.2]" />
              <span className="text-[10px] mt-1 font-bold">Menú</span>
            </button>

            {/* 2. Mesas / Cuentas */}
            <button
              onClick={() => setActiveTab('mesas')}
              className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-xl transition-all duration-200 active:scale-95 mr-8 ${
                activeTab === 'mesas' ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
              <span className="text-[10px] mt-1 font-bold">Mesas</span>
            </button>

            {/* =================================================================== */}
            {/* BOTÓN CENTRAL FLOTANTE MÁS GRANDE (COBRAR)                         */}
            {/* =================================================================== */}
            <div className="absolute left-1/2 -top-4 -translate-x-1/2 flex flex-col items-center">
              <button
                onClick={() => setActiveTab('cobro')}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(34,197,94,0.45)] transition-all duration-200 active:scale-95 group ${
                  activeTab === 'cobro'
                    ? 'bg-emerald-400 text-slate-950 scale-105 ring-4 ring-emerald-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:scale-105'
                }`}
                title="Cobrar Cuenta / Abrir Caja"
              >
                <CircleDollarSign className="w-7 h-7 stroke-[2.5] text-slate-950 group-hover:rotate-12 transition-transform" />
              </button>
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 mt-1 drop-shadow-xs">
                Cobrar
              </span>
            </div>

            {/* 3. Pedidos / Cocina */}
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-xl transition-all duration-200 active:scale-95 ml-8 ${
                activeTab === 'pedidos' ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardList className="w-5 h-5 stroke-[2.2]" />
              <span className="text-[10px] mt-1 font-bold">Pedidos</span>
            </button>

            {/* 4. Delivery / Envíos */}
            <button
              onClick={() => setActiveTab('delivery')}
              className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
                activeTab === 'delivery' ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bike className="w-5 h-5 stroke-[2.2]" />
              <span className="text-[10px] mt-1 font-bold">Delivery</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DRAWER IZQUIERDO (Herramientas, Ajustes, QR, Tasa BCV)                 */}
      {/* ========================================================================= */}
      {isLeftDrawerOpen && (
        <div className="fixed inset-0 z-50 flex animate-fadeIn">
          {/* Backdrop Blur oscuro */}
          <div
            onClick={() => setIsLeftDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
          />

          {/* Panel Lateral Deslizable */}
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 h-full p-4 flex flex-col justify-between shadow-2xl z-10 animate-slideRight">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white">Ajustes del Puesto</span>
                </div>
                <button
                  onClick={() => setIsLeftDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Botón Destacado: Menú QR */}
              <button
                onClick={() => {
                  setIsLeftDrawerOpen(false);
                  setShowQrModal(true);
                }}
                className="w-full p-3 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-left hover:bg-emerald-600/40 transition-all shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Menú Digital QR</h4>
                  <p className="text-[10px] text-slate-400">Mostrar QR o Enviar por WhatsApp</p>
                </div>
              </button>

              {/* Lista de Herramientas Rápidas */}
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    const newRate = prompt('Ingresa nueva tasa BCV:', String(bcvRate));
                    if (newRate && !isNaN(Number(newRate))) setBcvRate(Number(newRate));
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <RefreshCw className="w-4 h-4 text-sky-400" />
                    <span>Ajustar Tasa BCV</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">Bs. {bcvRate.toFixed(2)}</span>
                </button>

                <button
                  onClick={() => alert('Datos de Pago Móvil configurados: Banco Banesco / 0414-1234567 / V-12345678')}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>Datos Pago Móvil</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => alert('Ventas de Hoy:\nTotal $: $142.50\nTotal Bs: Bs. 120,918.37\nTickets: 18 ventas')}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>Reporte X del Día</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => alert('Buscando impresoras Bluetooth portátiles de 58mm...')}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Printer className="w-4 h-4 text-purple-400" />
                    <span>Impresora Bluetooth</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Conectar</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono">
              KlikPOS Standalone v2.4 • Offline Ready
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DRAWER DERECHO (Comanda Activa, Desglose y Venta en Curso)              */}
      {/* ========================================================================= */}
      {isRightDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
          {/* Backdrop Blur oscuro */}
          <div
            onClick={() => setIsRightDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
          />

          {/* Panel Lateral Deslizable */}
          <aside className="relative w-80 max-w-[88vw] bg-slate-900 border-l border-slate-800 h-full p-4 flex flex-col justify-between shadow-2xl z-10 animate-slideLeft">
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white">
                    {activeTable ? `Mesa #${activeTable}` : 'Comanda Actual'}
                  </span>
                </div>
                <button
                  onClick={() => setIsRightDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lista de Ítems en el Carrito */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs italic">
                    No hay productos en esta cuenta. Toca el menú para agregar.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <h4 className="text-xs font-black text-white line-clamp-1">{item.name}</h4>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            ${item.priceUSD.toFixed(2)} c/u
                          </span>
                        </div>
                        <span className="text-xs font-black font-mono text-white">
                          ${(item.priceUSD * item.qty).toFixed(2)}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-[9px] text-amber-300 italic bg-amber-950/20 px-1.5 py-0.5 rounded">
                          📝 {item.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                        <button
                          onClick={() => setEditingItemNotes(item)}
                          className="text-[10px] text-slate-400 hover:text-white underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{item.notes ? 'Editar Nota' : '+ Nota'}</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs font-black"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-black text-white w-4 text-center">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-xs font-black"
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
              <div className="pt-3 border-t border-slate-800 space-y-2 shrink-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total USD:</span>
                  <span className="font-mono font-black text-base text-emerald-400">
                    ${totalUSD.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Bs (BCV):</span>
                  <span className="font-mono font-black text-xs text-white">
                    Bs. {totalVES.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setCart([])}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                  >
                    Vaciar
                  </button>
                  <button
                    onClick={() => {
                      setIsRightDrawerOpen(false);
                      setActiveTab('cobro');
                    }}
                    className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setEditingItemNotes(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Personalizar Ítem
              </span>
              <h3 className="text-sm font-black text-white">{editingItemNotes.name}</h3>
            </div>

            {/* Presets de Comida Rápida Venezolana */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
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
                    className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg border border-slate-700 transition-all"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo Libre */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Nota Específica:
              </label>
              <input
                type="text"
                value={editingItemNotes.notes || ''}
                onChange={(e) => setEditingItemNotes({ ...editingItemNotes, notes: e.target.value })}
                placeholder="Ej. Tocineta bien crujiente, sin tártara..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold rounded-xl"
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
                    // Si se abrió desde la card sin estar en carrito, lo añade con la nota
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
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <span className="text-[10px] bg-emerald-400/20 text-emerald-400 font-mono font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Menú Digital Interactivo
              </span>
              <h3 className="text-sm font-black text-white">Escanea para Ordenar</h3>
              <p className="text-xs text-slate-400">
                Apunta con la cámara de tu teléfono para ver la carta y hacer tu pedido.
              </p>
            </div>

            {/* Código QR Ilustrado */}
            <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-inner mx-auto max-w-[210px]">
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
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
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
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5"
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
