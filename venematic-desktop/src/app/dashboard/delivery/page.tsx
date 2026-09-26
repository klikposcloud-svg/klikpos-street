'use client'

import { useState, useEffect } from 'react'
import { DeliveryOrder, DeliveryOrderStatus } from '@/types/delivery'
import { venematicDB } from '@/lib/indexeddb/db'
import { playSuccessChime, playBeep } from '@/lib/utils/sound'
import { licenseManager, type StoreLicense } from '@/lib/licensing/license-manager'

export default function DeliveryDashboardPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [bcvRate, setBcvRate] = useState(848.55)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showRiderModal, setShowRiderModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null)
  
  // Licencia y Suscripción SaaS
  const [license, setLicense] = useState<StoreLicense>(licenseManager.getLicense())
  const [activationKeyInput, setActivationKeyInput] = useState('')
  const [activationError, setActivationError] = useState<string | null>(null)
  
  // Rider form state
  const [riderName, setRiderName] = useState('')
  const [riderPhone, setRiderPhone] = useState('')
  const [riderVehicle, setRiderVehicle] = useState('Moto')

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
    fetchRate()
    const unsubLic = licenseManager.onLicenseChange((lic) => setLicense(lic))
    const interval = setInterval(fetchOrders, 10000)
    return () => {
      unsubLic()
      clearInterval(interval)
    }
  }, [])

  const handleRedeemKey = (e: React.FormEvent) => {
    e.preventDefault()
    setActivationError(null)
    const result = licenseManager.redeemLicenseKey(activationKeyInput)
    if (result.success) {
      playSuccessChime()
      showToast(result.message)
      setActivationKeyInput('')
    } else {
      setActivationError(result.message)
      playBeep(400, 0.2, 'sawtooth')
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const fetchRate = async () => {
    try {
      const res = await fetch('/api/bcv-rate')
      if (res.ok) {
        const data = await res.json()
        if (data.rate) setBcvRate(data.rate)
      }
    } catch {
      // ignore
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/delivery/orders')
      if (res.ok) {
        const data: DeliveryOrder[] = await res.json()
        setOrders(data)
      }
    } catch (err) {
      console.warn('Error fetching delivery orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (
    orderId: string, 
    newStatus: DeliveryOrderStatus, 
    riderDetails?: { riderName: string; riderPhone: string; riderVehicle: string }
  ) => {
    try {
      const res = await fetch(`/api/delivery/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...(riderDetails || {}),
        }),
      })

      if (res.ok) {
        const result = await res.json()
        
        // Si el estado pasa a 'delivered', registrar la venta y descontar stock
        if (newStatus === 'delivered') {
          const order = orders.find(o => o.id === orderId)
          if (order) {
            await finalizeDeliverySale(order)
            playSuccessChime()
            showToast(`¡Pedido ${order.orderNumber} entregado! Venta registrada e inventario descontado.`)
          }
        } else {
          playBeep(1800, 0.08)
          showToast(`Pedido actualizado a: ${getStatusLabel(newStatus)}`)
        }

        fetchOrders()
      }
    } catch (err) {
      console.error('Error updating order:', err)
      alert('Error al actualizar estado del pedido')
    }
  }

  // Registrar venta oficial en caja e impactar inventario
  const finalizeDeliverySale = async (order: DeliveryOrder) => {
    try {
      const saleRecord = {
        id: `sale_del_${order.id}`,
        storeId: 'default_store',
        cashierId: 'delivery_system',
        items: order.items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          priceUSD: i.priceUSD,
          priceBS: i.priceBS,
          discount: 0,
          totalUSD: i.priceUSD * i.quantity,
          totalBS: i.priceBS * i.quantity,
        })),
        subtotalUSD: order.subtotalUSD,
        taxUSD: 0,
        igtfUSD: 0,
        totalUSD: order.totalUSD,
        totalBS: order.totalBS,
        bcvRate: order.bcvRate,
        payments: [{
          method: order.paymentMethod,
          amountUSD: order.totalUSD,
          amountBS: order.totalBS,
          rate: order.bcvRate,
          reference: order.paymentReference || 'DELIVERY_APP',
          status: 'completed',
          igtf_aplicado: false,
        }],
        status: 'completed' as const,
        receiptNumber: `REC-${order.orderNumber}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false,
      }

      await venematicDB.saveSale(saleRecord)

      // Descontar inventario de cada producto
      for (const item of order.items) {
        const product = await venematicDB.getProduct(item.productId)
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity)
          await venematicDB.updateProductStock(item.productId, newStock)
        }
      }
    } catch (err) {
      console.error('Error al registrar venta de delivery en base de datos:', err)
    }
  }

  const handleCreateDemoOrder = async () => {
    try {
      const demoNames = ['Alejandro Colmenares', 'Carmen Silva', 'Daniela Rivas', 'Luis Fernando Gil']
      const randomName = demoNames[Math.floor(Math.random() * demoNames.length)]
      const randomPhone = `+58412${Math.floor(1000000 + Math.random() * 9000000)}`

      const res = await fetch('/api/delivery/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: randomName,
          customerPhone: randomPhone,
          deliveryAddress: 'Urb. El Rosal, Av. Principal, Torre Financiera, Piso 8',
          deliveryNotes: 'Dejar en recepción si no bajo de inmediato',
          items: [
            { productId: 'prod_1', name: 'Harina PAN 1kg', quantity: 2, priceUSD: 1.25 },
            { productId: 'prod_4', name: 'Leche Completa 1L', quantity: 1, priceUSD: 1.95 },
            { productId: 'prod_7', name: 'Refresco Coca-Cola 2L', quantity: 1, priceUSD: 2.50 }
          ],
          paymentMethod: 'pago_movil',
          paymentReference: `0102-${Math.floor(100000 + Math.random() * 900000)}`,
          deliveryFeeUSD: 2.0,
          bcvRate,
        })
      })

      if (res.ok) {
        playBeep(2200, 0.12)
        showToast('¡Nuevo pedido demo recibido en la bandeja!')
        fetchOrders()
      }
    } catch (err) {
      alert('Error creando pedido demo')
    }
  }

  const handleAssignRiderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return

    updateOrderStatus(selectedOrder.id, 'on_way', {
      riderName: riderName || 'Repartidor Asignado',
      riderPhone: riderPhone || '+584120000000',
      riderVehicle: riderVehicle || 'Moto',
    })

    setShowRiderModal(false)
    setSelectedOrder(null)
    setRiderName('')
    setRiderPhone('')
  }

  const getStatusBadge = (status: DeliveryOrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Nuevo Pedido
          </span>
        )
      case 'preparing':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            En Preparación
          </span>
        )
      case 'ready':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Listo para Repartidor
          </span>
        )
      case 'on_way':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            En Camino (Delivery)
          </span>
        )
      case 'delivered':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Entregado
          </span>
        )
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Cancelado
          </span>
        )
    }
  }

  const getStatusLabel = (status: DeliveryOrderStatus) => {
    switch (status) {
      case 'pending': return 'Nuevo Pedido'
      case 'preparing': return 'En Preparación'
      case 'ready': return 'Listo para Despacho'
      case 'on_way': return 'En Camino con Repartidor'
      case 'delivered': return 'Entregado'
      case 'cancelled': return 'Cancelado'
    }
  }

  const counts = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    on_way: orders.filter(o => o.status === 'on_way').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  const filteredOrders = activeFilter === 'all'
    ? orders
    : orders.filter(o => o.status === activeFilter)

  return (
    <div className="space-y-6 font-montserrat">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-3 animate-fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Barra de Estado de Suscripción SaaS / Cloud License */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-850 dark:to-slate-800 p-3.5 rounded-2xl border border-blue-200/80 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${licenseManager.isDeliveryActive() ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="font-bold text-slate-800 dark:text-white">
            {licenseManager.isDeliveryActive() ? 'Suscripción Delivery & D-Panas:' : 'Módulo Delivery:'}
          </span>
          <span className={`font-extrabold px-2 py-0.5 rounded-full text-[11px] ${
            licenseManager.isDeliveryActive()
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
          }`}>
            {licenseManager.isDeliveryActive() ? `Activo (${licenseManager.getDaysRemaining()} días restantes)` : 'Bloqueado / Inactivo'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/admin/cloud-license"
            className="text-[11px] font-bold text-slate-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
          >
            <span>🔐 Panel Maestro SaaS</span>
          </a>
        </div>
      </div>

      {/* PAYWALL / ACTIVACIÓN SI ESTÁ BLOQUEADO POR MENSUALIDAD */}
      {!licenseManager.isDeliveryActive() ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/10">
            🔒
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full">
              Función Premium Mensual
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Módulo de Delivery & Conexión D-Panas Inactivo
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Para recibir pedidos desde la app móvil <strong>D-Panas</strong>, publicar tu inventario en la red nacional y despachar con motorizados, debes activar tu plan mensual ($25/mes).
            </p>
          </div>

          {/* Formulario de Canje de Clave Serial */}
          <form onSubmit={handleRedeemKey} className="max-w-md mx-auto space-y-3">
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Pega aquí tu clave serial (Ej. VNK-DELIV-...)"
                value={activationKeyInput}
                onChange={(e) => setActivationKeyInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-750 border-2 border-slate-200 dark:border-slate-600 focus:border-blue-500 rounded-2xl py-3 px-4 text-xs font-mono font-bold text-center text-slate-900 dark:text-white outline-none uppercase"
              />
            </div>

            {activationError && (
              <p className="text-xs font-bold text-red-500">{activationError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              Validar y Desbloquear Módulo 🚀
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 space-y-2">
            <p>¿Aún no tienes tu clave de activación?</p>
            <a
              href="https://wa.me/584141234567?text=Hola,%20quisiera%20activar%20la%20mensualidad%20del%20m%C3%B3dulo%20de%20Delivery%20en%20Venematic"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-emerald-600 hover:underline"
            >
              <span>Contactar a Soporte Venematic por WhatsApp</span>
              <span>→</span>
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                    Despacho de Pedidos Online / Delivery
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Recepción en caja, asignación de repartidores y sincronización de inventario
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <a
                href="/marketplace"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                <span>📱</span>
                <span>Ver App Móvil / Marketplace (D-Panas)</span>
                <span>↗</span>
              </a>

              <button
                onClick={handleCreateDemoOrder}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Crear Pedido Demo</span>
              </button>

              <button
                onClick={() => setShowConfigModal(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                <span>Conexión con D-Panas</span>
              </button>
            </div>
          </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div 
          onClick={() => setActiveFilter('pending')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeFilter === 'pending'
              ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700 ring-2 ring-amber-400'
              : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Nuevos
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {counts.pending}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Pendientes de aceptar</p>
        </div>

        <div 
          onClick={() => setActiveFilter('preparing')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeFilter === 'preparing'
              ? 'bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:border-blue-700 ring-2 ring-blue-400'
              : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-blue-300'
          }`}
        >
          <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
            En Preparación
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {counts.preparing}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">En cocina / empaque</p>
        </div>

        <div 
          onClick={() => setActiveFilter('ready')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeFilter === 'ready'
              ? 'bg-purple-50 border-purple-300 dark:bg-purple-950/40 dark:border-purple-700 ring-2 ring-purple-400'
              : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-purple-300'
          }`}
        >
          <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
            Listos
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {counts.ready}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Esperando repartidor</p>
        </div>

        <div 
          onClick={() => setActiveFilter('delivered')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeFilter === 'delivered'
              ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700 ring-2 ring-emerald-400'
              : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-emerald-300'
          }`}
        >
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Entregados
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {counts.delivered}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Facturados con éxito</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { key: 'all', label: 'Todos los Pedidos' },
          { key: 'pending', label: `Nuevos (${counts.pending})` },
          { key: 'preparing', label: `En Preparación (${counts.preparing})` },
          { key: 'ready', label: `Listos (${counts.ready})` },
          { key: 'on_way', label: `En Camino (${counts.on_way})` },
          { key: 'delivered', label: `Entregados (${counts.delivered})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeFilter === tab.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Cargando pedidos de delivery...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 p-12 text-center text-slate-400">
          <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
            No hay pedidos en esta sección
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Usa el botón "Crear Pedido Demo" para simular una compra desde la app móvil.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const timeAgo = new Date(order.createdAt).toLocaleTimeString('es-VE', {
              hour: '2-digit',
              minute: '2-digit',
            })

            const cleanPhone = order.customerPhone.replace(/[^\d]/g, '')
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              `¡Hola ${order.customerName}! Te escribimos de Venemarket sobre tu pedido ${order.orderNumber}.`
            )}`

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Header of Card */}
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-slate-400">| {timeAgo}</span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Customer Info */}
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-white">
                        {order.customerName}
                      </span>
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <span>WhatsApp</span>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" />
                        </svg>
                      </a>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 flex items-start gap-1">
                      <span className="text-slate-400">📍</span>
                      <span>{order.deliveryAddress}</span>
                    </p>
                    {order.deliveryNotes && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl">
                        Nota: {order.deliveryNotes}
                      </p>
                    )}
                  </div>

                  {/* Order Products */}
                  <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                    {order.items.map((item, i) => (
                      <div key={i} className="py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {item.quantity}x
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          ${(item.priceUSD * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Payment & Total */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                        Método de Pago
                      </span>
                      <span className="font-bold uppercase text-slate-700 dark:text-slate-200">
                        {order.paymentMethod === 'pago_movil' ? 'Pago Móvil' : order.paymentMethod}
                      </span>
                      {order.paymentReference && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Ref: {order.paymentReference}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        ${order.totalUSD.toFixed(2)}
                      </span>
                      <p className="text-[10px] font-bold text-slate-500">
                        Bs. {order.totalBS.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Repartidor Asignado (si existe) */}
                  {order.riderName && (
                    <div className="mt-3 p-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🛵</span>
                        <div>
                          <p className="font-bold text-indigo-950 dark:text-indigo-200">
                            {order.riderName} ({order.riderVehicle || 'Moto'})
                          </p>
                          <p className="text-[10px] text-indigo-500">{order.riderPhone}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
                        Repartidor
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                      >
                        Aceptar y Preparar
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors"
                      >
                        Rechazar
                      </button>
                    </>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20"
                    >
                      Marcar Listo para Repartidor ✓
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowRiderModal(true)
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                      <span>🛵</span>
                      <span>Asignar Repartidor / Despachar</span>
                    </button>
                  )}

                  {order.status === 'on_way' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                    >
                      Marcar como Entregado (Impactar Caja) ✓
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <div className="w-full py-2 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                      Pedido Finalizado e Impactado en Caja ✓
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <div className="w-full py-2 text-center text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/30 rounded-xl">
                      Pedido Cancelado
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      </>
      )}

      {/* Modal: Asignar Repartidor */}
      {showRiderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
              Despachar Pedido {selectedOrder.orderNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ingresa los datos del repartidor para entregar al cliente
            </p>

            <form onSubmit={handleAssignRiderSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Repartidor
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Silva"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: +584141234567"
                  value={riderPhone}
                  onChange={(e) => setRiderPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vehículo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Moto Bera SBR (Placa AB123)"
                  value={riderVehicle}
                  onChange={(e) => setRiderVehicle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRiderModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20"
                >
                  Confirmar y Despachar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Configuración de Enlace con App Móvil */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Conectar con la App Móvil D-Panas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sincronización bidireccional entre el Punto de Venta y la App de Delivery
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Capa de Integración con D-Panas Lista</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  Tu app <strong>D-Panas</strong> (`C:\Users\pcpro\OneDrive\Documents\D-Panas-main`) puede consultar el catálogo de tiendas e inventarios en vivo por zona, y enviar las órdenes de los clientes directamente a la caja de Venematic.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  1. Listado de Tiendas por Zona / Coordenadas (GET):
                </label>
                <div className="bg-slate-100 dark:bg-slate-700 p-2.5 rounded-xl font-mono text-[11px] text-blue-600 dark:text-blue-400 select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/delivery/stores` : '/api/delivery/stores'}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  2. Búsqueda de Productos Multitienda en Tiempo Real (GET):
                </label>
                <div className="bg-slate-100 dark:bg-slate-700 p-2.5 rounded-xl font-mono text-[11px] text-blue-600 dark:text-blue-400 select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/delivery/products?q=harina&zone=chacao` : '/api/delivery/products?q=harina&zone=chacao'}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  3. Enviar Pedido desde D-Panas hacia el POS de la Tienda (POST):
                </label>
                <div className="bg-slate-100 dark:bg-slate-700 p-2.5 rounded-xl font-mono text-[11px] text-emerald-600 dark:text-emerald-400 select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/delivery/orders` : '/api/delivery/orders'}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ejemplo de llamada desde D-Panas (fetch / axios):
                </label>
                <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[10px] overflow-x-auto leading-relaxed">
{`// En D-Panas (src/services/venemarketBridge.js):
const response = await fetch('http://localhost:3000/api/delivery/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    storeId: 'store_venemarket_chacao',
    customerName: 'Cliente D-Panas',
    customerPhone: '+584141234567',
    deliveryAddress: 'Chacao, Calle Elice...',
    items: [{ productId: 'prod_1', name: 'Harina PAN', quantity: 2, priceUSD: 1.25 }],
    paymentMethod: 'pago_movil',
    paymentReference: '0102-984723'
  })
});`}
                </pre>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <a
                href="/marketplace"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Probar App Móvil en Navegador</span>
                <span>↗</span>
              </a>

              <button
                onClick={() => setShowConfigModal(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
