'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  PhoneCall, 
  ChevronRight, 
  UtensilsCrossed, 
  Share2, 
  Store, 
  QrCode,
  ArrowLeft,
  X
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  priceUSD: number;
  image: string;
  description: string;
  tag: string;
  prepTime: string;
  sku: string;
}

interface CartItem extends MenuItem {
  qty: number;
  notes?: string;
}

import { SAMPLE_PRODUCTS } from '@/lib/data/tablet-pos-rubros';

const DEFAULT_MENU_ITEMS: MenuItem[] = SAMPLE_PRODUCTS.map(p => ({
  id: p.id,
  name: p.name,
  category: p.category,
  priceUSD: p.priceUSD,
  image: p.image,
  description: p.description,
  tag: p.tag,
  prepTime: p.prepTime,
  sku: p.sku
}));


export default function DigitalMenuPage() {
  const [bcvRate, setBcvRate] = useState<number>(848.55);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<'mesa' | 'llevar' | 'delivery'>('mesa');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderSent, setOrderSent] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<MenuItem | null>(null);

  // Obtener Tasa BCV y Parámetros de URL (ej: ?mesa=4)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mesaParam = params.get('mesa') || params.get('table');
      if (mesaParam) setTableNumber(mesaParam);
    } catch {}

    fetch('/api/bcv')
      .then(res => res.json())
      .then(data => {
        if (data?.rate && typeof data.rate === 'number') {
          setBcvRate(data.rate);
        }
      })
      .catch(() => {});
  }, []);

  const categories = useMemo(() => {
    const cats = ['Todos', 'Combos', 'Hamburguesas', 'Perros', 'Bebidas', 'Extras'];
    return cats;
  }, []);

  const filteredItems = useMemo(() => {
    return DEFAULT_MENU_ITEMS.filter(item => {
      const matchesCat = selectedCategory === 'Todos' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const totalUSD = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.priceUSD * item.qty), 0);
  }, [cart]);

  const totalVES = useMemo(() => {
    return totalUSD * bcvRate;
  }, [totalUSD, bcvRate]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  // Enviar Pedido por WhatsApp
  const handleSendWhatsApp = () => {
    if (cart.length === 0) return;

    let text = `🍔 *NUEVO PEDIDO DIGITAL - KLIKPOS*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📍 *Modalidad:* ${orderType.toUpperCase()}\n`;
    if (orderType === 'mesa') text += `🪑 *Mesa:* ${tableNumber || 'No especificada'}\n`;
    if (customerName) text += `👤 *Cliente:* ${customerName}\n`;
    if (customerPhone) text += `📱 *Teléfono:* ${customerPhone}\n`;
    if (orderType === 'delivery' && customerAddress) text += `🛵 *Dirección:* ${customerAddress}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🛒 *DETALLE DEL PEDIDO:*\n`;

    cart.forEach(item => {
      const subUSD = (item.priceUSD * item.qty).toFixed(2);
      const subVES = (item.priceUSD * item.qty * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 });
      text += `• ${item.qty}x ${item.name} ($${subUSD} / Bs. ${subVES})\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💵 *TOTAL USD:* $${totalUSD.toFixed(2)}\n`;
    text += `🇻🇪 *TOTAL BCV:* Bs. ${totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    text += `📊 *Tasa BCV:* Bs. ${bcvRate.toFixed(2)}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Pedido generado desde el Menú Digital Interactivo KlikPOS._`;

    const encoded = encodeURI(text);
    const whatsappUrl = `https://wa.me/?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
    setOrderSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased pb-28">
      {/* 1. Header de Marca y Tasa BCV en Tiempo Real */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  KLIKPOS MARKET & GOURMET
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  ABIERTO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Carta & Menú Digital Interactivo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tasa BCV</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 font-mono">
                Bs. {bcvRate.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Hero y Buscador */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4 pb-2">
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar hamburguesas, combos, bebidas, extras..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-xs placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Categorías Flotantes con Animación Elástica */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-md scale-105'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Catálogo de Productos */}
      <main className="max-w-4xl mx-auto w-full px-4 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {filteredItems.map((item) => {
            const priceVES = item.priceUSD * bcvRate;
            const inCart = cart.find(c => c.id === item.id);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                {/* Imagen del Plato */}
                <div 
                  className="relative h-44 w-full overflow-hidden cursor-pointer bg-slate-100 dark:bg-slate-800"
                  onClick={() => setSelectedProductDetail(item)}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-slate-950/80 backdrop-blur-md text-white shadow-md">
                      {item.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-slate-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {item.prepTime}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-3.5 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 font-normal leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-base font-black text-slate-900 dark:text-white font-mono block">
                        ${item.priceUSD.toFixed(2)}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                        Bs. {priceVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {inCart ? (
                      <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 p-1 rounded-2xl border border-amber-200 dark:border-amber-800/60">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shadow-xs active:scale-90 font-bold"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-black text-amber-700 dark:text-amber-300 font-mono">
                          {inCart.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs active:scale-90 font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="px-3 py-2 rounded-2xl bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 4. Barra Flotante Inferior de Pedido (Checkout Sticky Pill) */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto">
          <div 
            onClick={() => setIsCartOpen(true)}
            className="bg-slate-950/95 dark:bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl p-3.5 shadow-2xl border border-slate-700/80 flex items-center justify-between cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black relative shadow-md">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-white text-slate-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {totalItemsCount}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Ver Mi Pedido</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-black text-amber-400 font-mono">${totalUSD.toFixed(2)}</span>
                  <span className="text-xs font-bold text-slate-300 font-mono">
                    (Bs. {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-amber-400 text-slate-950 px-4 py-2 rounded-2xl text-xs font-black shadow-md">
              <span>Continuar</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Drawer de Confirmación de Pedido */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Mi Pedido ({totalItemsCount} platos)
                </h2>
              </div>
              <button
                onClick={() => setCart([])}
                className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vaciar
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Modalidad de Pedido */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-2">
                  ¿Cómo deseas recibir tu pedido?
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOrderType('mesa')}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all ${
                      orderType === 'mesa'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🪑 En Mesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('llevar')}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all ${
                      orderType === 'llevar'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🛍️ Para Llevar
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all ${
                      orderType === 'delivery'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🛵 Delivery
                  </button>
                </div>

                {orderType === 'mesa' && (
                  <div className="mt-3">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Número de Mesa o Ubicación:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Mesa 4, Terraza 2"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}

                {orderType === 'delivery' && (
                  <div className="mt-3">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Dirección exacta de entrega:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Calle, edificio, casa, punto de referencia..."
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Datos de Contacto Opcionales */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Tu Nombre:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Carlos"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Teléfono WhatsApp:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 04141234567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Lista de Ítems */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Platos Seleccionados
                </span>
                {cart.map(item => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={item.image} alt={item.name} className="w-11 h-11 rounded-xl object-cover" />
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white block line-clamp-1">
                          {item.name}
                        </span>
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 font-mono">
                          ${(item.priceUSD * item.qty).toFixed(2)} · Bs. {(item.priceUSD * item.qty * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-lg text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center text-xs font-black font-mono">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-lg text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer con Totales y Botón WhatsApp */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                  <span>Subtotal:</span>
                  <span className="font-mono">${totalUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-base font-black text-slate-900 dark:text-white">
                  <span>Total a Pagar:</span>
                  <div className="text-right">
                    <span className="font-mono text-amber-500 block">${totalUSD.toFixed(2)}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                      Bs. {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSendWhatsApp}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Pedido por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal de Detalle de Producto */}
      {selectedProductDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="relative h-56 w-full">
              <img
                src={selectedProductDetail.image}
                alt={selectedProductDetail.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/70 text-white flex items-center justify-center hover:bg-slate-950"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {selectedProductDetail.category} · {selectedProductDetail.tag}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {selectedProductDetail.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {selectedProductDetail.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-lg font-black text-slate-900 dark:text-white font-mono block">
                    ${selectedProductDetail.priceUSD.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    Bs. {(selectedProductDetail.priceUSD * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  onClick={() => {
                    addToCart(selectedProductDetail);
                    setSelectedProductDetail(null);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar al Pedido</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
