'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  MarketplaceStore, 
  CrossStoreProduct, 
  DeliveryOrder,
  DeliveryOrderItem 
} from '@/types/delivery'
import { POPULAR_ZONES } from '@/lib/delivery/marketplace-engine'
import { BUSINESS_RUBROS, type BusinessType } from '@/lib/utils/business-rubros'
import { getProductIcon } from '@/lib/utils/product-icons'
import { playSuccessChime, playBeep } from '@/lib/utils/sound'

interface CartItem extends CrossStoreProduct {
  quantity: number
}

export default function MarketplaceDeliveryApp() {
  const [stores, setStores] = useState<MarketplaceStore[]>([])
  const [products, setProducts] = useState<CrossStoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [bcvRate, setBcvRate] = useState(848.55)

  // Filters & State
  const [selectedZone, setSelectedZone] = useState<string>('all')
  const [selectedRubro, setSelectedRubro] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'products' | 'stores'>('products')
  
  // Selected Store Modal
  const [activeStoreModal, setActiveStoreModal] = useState<MarketplaceStore | null>(null)
  const [storeProducts, setStoreProducts] = useState<any[]>([])
  const [storeCategoryFilter, setStoreCategoryFilter] = useState<string>('all')

  // Cart & Checkout
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery')
  
  // Customer Checkout Form
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'pago_movil' | 'zelle' | 'efectivo' | 'tarjeta'>('pago_movil')
  const [paymentReference, setPaymentReference] = useState('')
  const [submittingOrder, setSubmittingOrder] = useState(false)

  // Active Placed Order Tracking
  const [activeOrder, setActiveOrder] = useState<DeliveryOrder | null>(null)
  const [isTrackingOpen, setIsTrackingOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchRate()
    fetchStores()
    fetchProducts()
  }, [selectedZone, selectedRubro, searchQuery])

  // Polling para tracking del pedido si hay uno activo
  useEffect(() => {
    if (!activeOrder) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/delivery/orders/${activeOrder.id}`)
        if (res.ok) {
          const updated = await res.json()
          if (updated && updated.status !== activeOrder.status) {
            setActiveOrder(updated)
            playSuccessChime()
            showToast(`¡Tu pedido se actualizó a: ${getStatusLabel(updated.status)}!`)
          }
        }
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [activeOrder])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const fetchRate = async () => {
    try {
      const res = await fetch('/api/bcv-rate')
      if (res.ok) {
        const data = await res.json()
        if (data.rate) setBcvRate(data.rate)
      }
    } catch {}
  }

  const fetchStores = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedZone !== 'all') params.set('zone', selectedZone)
      if (selectedRubro !== 'all') params.set('businessType', selectedRubro)

      const res = await fetch(`/api/delivery/stores?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setStores(data.stores || [])
      }
    } catch (err) {
      console.warn('Error fetching stores:', err)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (selectedZone !== 'all') params.set('zone', selectedZone)
      if (selectedRubro !== 'all') params.set('businessType', selectedRubro)

      const res = await fetch(`/api/delivery/products?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (err) {
      console.warn('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const openStoreModal = async (store: MarketplaceStore) => {
    setActiveStoreModal(store)
    setStoreCategoryFilter('all')
    try {
      const res = await fetch(`/api/delivery/products?storeId=${store.id}`)
      if (res.ok) {
        const data = await res.json()
        setStoreProducts(data.products || [])
      }
    } catch {}
  }

  const addToCart = (product: CrossStoreProduct | any) => {
    // Si el carrito tiene productos de otra tienda, advertir o agrupar
    const targetStoreId = product.storeId || activeStoreModal?.id || 'store_venemarket_chacao'
    const targetStoreName = product.storeName || activeStoreModal?.name || 'Tienda Venematic'

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [
        ...prev,
        {
          ...product,
          storeId: targetStoreId,
          storeName: targetStoreName,
          quantity: 1,
        }
      ]
    })
    playSuccessChime()
    showToast(`✓ Agregado: ${product.name}`)
  }

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.id !== productId))
    } else {
      setCart(prev => prev.map(i => i.id === productId ? { ...i, quantity: qty } : i))
    }
  }

  // Totales del carrito
  const currentStoreInCart = cart.length > 0 ? cart[0] : null
  const subtotalUSD = cart.reduce((sum, i) => sum + i.priceUSD * i.quantity, 0)
  const deliveryFeeUSD = orderType === 'pickup' ? 0 : (currentStoreInCart?.deliveryFeeUSD || 2.0)
  const totalUSD = subtotalUSD + deliveryFeeUSD
  const totalBS = totalUSD * bcvRate

  // Enviar Pedido a la Red
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName || !customerPhone || (orderType === 'delivery' && !deliveryAddress)) {
      alert('Por favor completa todos los datos de contacto y entrega.')
      return
    }

    setSubmittingOrder(true)
    try {
      const payload = {
        storeId: currentStoreInCart?.storeId || 'store_venemarket_chacao',
        storeName: currentStoreInCart?.storeName || 'Venemarket Express',
        orderType,
        customerName,
        customerPhone,
        deliveryAddress: orderType === 'pickup' ? 'Retiro en Tienda' : deliveryAddress,
        deliveryZone: selectedZone,
        deliveryNotes,
        items: cart.map(i => ({
          productId: i.id,
          name: i.name,
          quantity: i.quantity,
          priceUSD: i.priceUSD,
          priceBS: i.priceUSD * bcvRate,
          image: i.image,
          category: i.category,
        })),
        deliveryFeeUSD,
        paymentMethod,
        paymentReference,
        bcvRate,
      }

      const res = await fetch('/api/delivery/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        setActiveOrder(data.order)
        setCart([])
        setIsCheckoutOpen(false)
        setIsCartOpen(false)
        setIsTrackingOpen(true)
        playSuccessChime()
        showToast('🎉 ¡Tu pedido ha sido enviado con éxito a la caja del local!')
      } else {
        alert('Error al procesar el pedido. Intenta nuevamente.')
      }
    } catch (err) {
      console.error('Error placing order:', err)
      alert('Error de conexión al enviar el pedido')
    } finally {
      setSubmittingOrder(false)
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Recibido en Caja'
      case 'preparing': return 'En Preparación / Empaque'
      case 'ready': return 'Listo para Despacho'
      case 'on_way': return 'Repartidor en Camino'
      case 'delivered': return 'Entregado con Éxito'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-montserrat flex flex-col">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-3 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <Link href="/marketplace" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xl text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                🚀
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Venemarket Red
                </span>
                <span className="hidden sm:block text-[10px] text-slate-500 font-semibold leading-none">
                  Delivery & Inventarios en Vivo
                </span>
              </div>
            </Link>
          </div>

          {/* Selector de Zona / Ciudad */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 py-2 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {POPULAR_ZONES.map(z => (
                  <option key={z.key} value={z.key}>{z.label}</option>
                ))}
              </select>
            </div>

            {/* Tasa BCV Oficial */}
            <div className="hidden md:flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl border border-blue-200/60 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold">
              <span>BCV:</span>
              <span>{bcvRate.toFixed(2)} Bs/$</span>
            </div>

            {/* Botón Carrito */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="hidden sm:inline">Carrito</span>
              {cart.length > 0 && (
                <span className="bg-emerald-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>

            {/* Acceso a POS Admin */}
            <Link
              href="/dashboard/pos"
              className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <span>Acceso Caja POS</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO & BUSCADOR GLOBAL DE PRODUCTOS / TIENDAS */}
      <section className="bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent pt-6 pb-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold">
            <span>🌐 Red de Inventarios en Tiempo Real</span>
            <span>•</span>
            <span>{stores.length} Tiendas Conectadas</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Busca cualquier producto en las tiendas de tu zona
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Consulta disponibilidad exacta en los pasillos de supermercados, farmacias, librerías y ferreterías con delivery inmediato.
          </p>

          {/* Selector de Modo de Búsqueda */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setSearchMode('products')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                searchMode === 'products'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              🔍 Buscar Productos en Todas las Tiendas
            </button>
            <button
              onClick={() => setSearchMode('stores')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                searchMode === 'stores'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              🏪 Explorar Locales y Comercios
            </button>
          </div>

          {/* Barra de Búsqueda Principal */}
          <div className="relative max-w-2xl mx-auto pt-2">
            <input
              type="text"
              placeholder={searchMode === 'products' ? "Ej: Harina PAN, Acetaminofén, Cuaderno, Bombillo LED, Queso..." : "Ej: Venemarket, Farmacia Las Mercedes, Ferretería..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 pl-11 pr-4 py-3.5 rounded-2xl border-2 border-blue-500/40 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 shadow-lg text-sm font-semibold transition-all"
            />
            <svg className="w-5 h-5 text-blue-600 absolute left-4 top-1/2 translate-y-[2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 translate-y-[2px] text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* CARRUSEL DE RUBROS COMERCIALES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4 w-full">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedRubro('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 shrink-0 ${
              selectedRubro === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-102'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
            }`}
          >
            <span>✨</span>
            <span>Todos los Rubros</span>
          </button>

          {Object.entries(BUSINESS_RUBROS).map(([key, rubro]) => {
            const isSelected = selectedRubro === key
            return (
              <button
                key={key}
                onClick={() => setSelectedRubro(key)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-102'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                }`}
              >
                <span>{rubro.icon}</span>
                <span>{rubro.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* CUERPO PRINCIPAL: RESULTADOS SEGÚN MODO */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex-1 w-full space-y-8">
        {/* MODO 1: RED DE PRODUCTOS Y COMPARADOR MULTITIENDA */}
        {searchMode === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Resultados de la Red de Inventarios</span>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-black px-2.5 py-0.5 rounded-full">
                    {products.length} productos
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Precios sincronizados al segundo con el punto de venta físico de cada tienda
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-slate-400">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold">Consultando inventarios en vivo...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-slate-800/60 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8">
                <span className="text-4xl block mb-2">🔍</span>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                  No se encontraron productos con "{searchQuery}"
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Prueba cambiando la zona de búsqueda a "Toda Venezuela" o explorando otro rubro comercial.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <div
                    key={`${product.storeId}_${product.id}`}
                    className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-4 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Tienda & Distancia */}
                      <div className="flex items-center justify-between gap-1 pb-2 mb-2 border-b border-slate-100 dark:border-slate-700/60 text-[10px]">
                        <span className="font-extrabold text-blue-600 dark:text-blue-400 truncate" title={product.storeName}>
                          🏪 {product.storeName}
                        </span>
                        <span className="font-semibold text-slate-500 shrink-0 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          📍 {product.distanceKm} km
                        </span>
                      </div>

                      {/* Icono / Imagen del Producto */}
                      <div className="h-24 flex items-center justify-center mb-2">
                        {getProductIcon(product.name, product.category, product.image, 'w-16 h-16')}
                      </div>

                      {/* Nombre y Categoría */}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        {product.category}
                      </span>
                      <h3 className="font-bold text-xs text-slate-800 dark:text-white line-clamp-2 min-h-[32px]" title={product.name}>
                        {product.name}
                      </h3>

                      {/* Stock en Vivo */}
                      <div className="flex items-center gap-1.5 my-2">
                        <span className={`w-2 h-2 rounded-full ${product.isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-semibold text-slate-500">
                          {product.isAvailable ? `${product.stock} disponibles en tienda` : 'Agotado'}
                        </span>
                      </div>
                    </div>

                    {/* Precios y Botón Agregar */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2 mt-2">
                      <div>
                        <div className="text-base font-black text-slate-900 dark:text-white leading-none">
                          ${product.priceUSD.toFixed(2)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                          Bs. {product.priceBS.toFixed(2)}
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(product)}
                        disabled={!product.isAvailable}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white text-xs font-extrabold px-3 py-2 rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <span>+</span>
                        <span>Pedir</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODO 2: EXPLORAR LOCALES Y COMERCIOS */}
        {searchMode === 'stores' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Comercios en {POPULAR_ZONES.find(z => z.key === selectedZone)?.label || 'Venezuela'}</span>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-black px-2.5 py-0.5 rounded-full">
                    {stores.length} locales
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Selecciona una tienda para ver su catálogo completo y hacer tu pedido
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {stores.map((store) => (
                <div
                  key={store.id}
                  onClick={() => openStoreModal(store)}
                  className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    {/* Banner con Badge de Rubro y Rating */}
                    <div className="h-32 bg-slate-200 relative overflow-hidden">
                      <img
                        src={store.banner}
                        alt={store.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                      
                      <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-black text-slate-800 dark:text-white shadow-xs">
                        {store.businessTypeLabel}
                      </div>

                      <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black shadow-xs flex items-center gap-1">
                        <span>★</span>
                        <span>{store.rating}</span>
                      </div>

                      <div className="absolute bottom-2 left-3 text-white text-xs font-bold">
                        📍 {store.zone}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{store.logo}</span>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {store.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {store.tagline}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400">
                        <div>⏱️ {store.deliveryTime}</div>
                        <div>🛵 Envío: ${store.deliveryFeeUSD.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button className="w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 group-hover:bg-blue-600 group-hover:text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5">
                      <span>Ver Catálogo en Vivo</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE TIENDA Y SU CATÁLOGO EN VIVO */}
      {activeStoreModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveStoreModal(null)
          }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 my-auto">
            {/* Header del Local */}
            <div className="relative h-40 bg-slate-900 text-white p-6 flex flex-col justify-end overflow-hidden">
              <img
                src={activeStoreModal.banner}
                alt={activeStoreModal.name}
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

              <button
                onClick={() => setActiveStoreModal(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
              >
                ✕
              </button>

              <div className="relative z-10 flex items-center gap-3">
                <span className="text-4xl">{activeStoreModal.logo}</span>
                <div>
                  <h2 className="text-xl font-extrabold">{activeStoreModal.name}</h2>
                  <p className="text-xs text-slate-300">
                    📍 {activeStoreModal.address} • ⏱️ {activeStoreModal.deliveryTime} • Envío: ${activeStoreModal.deliveryFeeUSD.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Catálogo del Local */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                  Inventario en Tiempo Real ({storeProducts.length} productos)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {storeProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:border-blue-400 transition-all"
                  >
                    <div>
                      <div className="h-16 flex items-center justify-center mb-1">
                        {getProductIcon(p.name, p.category, p.image, 'w-12 h-12')}
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate">
                        {p.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">{p.category}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-700">
                      <div>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          ${p.priceUSD.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          Bs. {p.priceBS.toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart({ ...p, storeId: activeStoreModal.id, storeName: activeStoreModal.name })}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg shadow-xs active:scale-95 transition-all"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER: CARRITO DE COMPRAS */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full p-6 flex flex-col justify-between shadow-2xl border-l border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛍️</span>
                  <h3 className="font-extrabold text-base">Tu Carrito de Delivery</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <span className="text-4xl block mb-2">🛒</span>
                  <p className="text-xs font-semibold">Tu carrito está vacío</p>
                  <p className="text-[10px] mt-1 text-slate-400">Agrega productos desde la red de tiendas</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto pr-1 my-3 scrollbar-thin">
                  {cart.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400">
                          {item.storeName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          ${item.priceUSD.toFixed(2)} c/u
                        </p>
                      </div>

                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateCartQty(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-slate-100 dark:bg-slate-800"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-slate-100 dark:bg-slate-800"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right w-16">
                        <p className="text-xs font-bold text-emerald-600">
                          ${(item.priceUSD * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="space-y-1 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold">${subtotalUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tarifa de Delivery:</span>
                    <span className="font-bold">${deliveryFeeUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Total a Pagar:</span>
                    <span>${totalUSD.toFixed(2)}</span>
                  </div>
                  <div className="text-right text-xs text-blue-600 font-extrabold">
                    Bs. {totalBS.toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false)
                    setIsCheckoutOpen(true)
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 text-sm transition-all active:scale-95"
                >
                  Continuar al Pago y Envío 🚀
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CHECKOUT Y PAGO */}
      {isCheckoutOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCheckoutOpen(false)
          }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-700 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-extrabold text-base">Finalizar Pedido Online</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-3.5 mt-4">
              {/* Tipo de Pedido */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    orderType === 'delivery' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  🛵 Delivery a Domicilio
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('pickup')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    orderType === 'pickup' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  🏪 Retiro en Local
                </button>
              </div>

              {/* Datos de Contacto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Pérez"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. +58 414 1234567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              {/* Dirección si es delivery */}
              {orderType === 'delivery' && (
                <div>
                  <label className="block text-xs font-bold mb-1">Dirección de Entrega Exacta *</label>
                  <input
                    type="text"
                    required
                    placeholder="Calle, Edificio/Casa, Piso, Apto, Punto de referencia"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
              )}

              {/* Método de Pago */}
              <div>
                <label className="block text-xs font-bold mb-1">Método de Pago</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'pago_movil', label: 'Pago Móvil', icon: '📱' },
                    { key: 'zelle', label: 'Zelle', icon: '💵' },
                    { key: 'efectivo', label: 'Efectivo', icon: '💵' },
                    { key: 'tarjeta', label: 'Tarjeta', icon: '💳' },
                  ].map(m => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setPaymentMethod(m.key as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                        paymentMethod === m.key
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 border-blue-500 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Datos de Pago Móvil */}
              {paymentMethod === 'pago_movil' && (
                <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-200 dark:border-blue-900 space-y-2 text-xs">
                  <p className="font-bold text-blue-800 dark:text-blue-300">
                    Datos para Pago Móvil del Local ({currentStoreInCart?.storeName}):
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Banco:</strong> Banesco (0134) • <strong>Teléfono:</strong> 0414-1234567 • <strong>CI/RIF:</strong> J-40123456-0
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Número de Referencia (Últimos 6 dígitos) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 984723"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="input-field text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Total y Botón Enviar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Total a Pagar:</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    ${totalUSD.toFixed(2)} / <strong className="text-blue-600">Bs. {totalBS.toFixed(2)}</strong>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 text-xs active:scale-95 transition-all"
                >
                  {submittingOrder ? 'Procesando...' : 'Confirmar Pedido 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SEGUIMIENTO EN VIVO (TRACKING) */}
      {isTrackingOpen && activeOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-700 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl mx-auto shadow-inner">
              🛵
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Estado del Pedido en Vivo</span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {activeOrder.orderNumber}
              </h2>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {getStatusLabel(activeOrder.status)}
              </p>
            </div>

            {/* Barra de Progreso de Estados */}
            <div className="grid grid-cols-4 gap-1 text-[9px] font-bold text-slate-500 pt-2">
              <div className={`p-2 rounded-xl border ${activeOrder.status !== 'cancelled' ? 'bg-blue-50 text-blue-600 border-blue-300' : ''}`}>
                1. Recibido
              </div>
              <div className={`p-2 rounded-xl border ${['preparing', 'ready', 'on_way', 'delivered'].includes(activeOrder.status) ? 'bg-blue-50 text-blue-600 border-blue-300' : 'opacity-40'}`}>
                2. Empaque
              </div>
              <div className={`p-2 rounded-xl border ${['on_way', 'delivered'].includes(activeOrder.status) ? 'bg-blue-50 text-blue-600 border-blue-300' : 'opacity-40'}`}>
                3. En Camino
              </div>
              <div className={`p-2 rounded-xl border ${activeOrder.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'opacity-40'}`}>
                4. Entregado
              </div>
            </div>

            {/* Datos del Repartidor si está asignado */}
            {activeOrder.riderName && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-2xl border text-left text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400">Repartidor Asignado:</span>
                <p className="font-bold text-slate-800 dark:text-white">
                  {activeOrder.riderName} • {activeOrder.riderVehicle || 'Moto'}
                </p>
                <p className="text-slate-500">Teléfono: {activeOrder.riderPhone}</p>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setIsTrackingOpen(false)}
                className="btn-secondary text-xs py-2.5 px-4 w-full"
              >
                Cerrar Seguimiento
              </button>

              <a
                href={`https://wa.me/584141234567?text=Hola,%20quisiera%20consultar%20el%20estado%20de%20mi%20pedido%20${activeOrder.orderNumber}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 w-full shadow-md transition-all"
              >
                <span>WhatsApp Tienda</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-6 px-4 sm:px-6 text-center text-xs text-slate-500">
        <p>
          Venemarket Red de Delivery e Inventarios © 2026. Conectado en tiempo real con el punto de venta de cada comercio.
        </p>
      </footer>
    </div>
  )
}
