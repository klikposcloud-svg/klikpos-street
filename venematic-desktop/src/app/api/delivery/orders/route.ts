import { NextResponse } from 'next/server'
import { deliveryOrders } from '@/lib/delivery-store'
import { INITIAL_MARKETPLACE_STORES } from '@/lib/delivery/marketplace-engine'
import type { DeliveryOrder, DeliveryOrderStatus } from '@/types/delivery'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as DeliveryOrderStatus | null
  const storeId = searchParams.get('storeId')

  let orders = [...deliveryOrders]

  if (storeId && storeId !== 'all') {
    orders = orders.filter(o => o.storeId === storeId || o.storeId === 'default_store')
  }

  if (status) {
    orders = orders.filter(o => o.status === status)
  }

  return NextResponse.json(orders)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      storeId = 'store_venemarket_chacao',
      storeName,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryZone,
      deliveryCity = 'Caracas',
      deliveryNotes,
      items,
      paymentMethod = 'pago_movil',
      paymentReference,
      orderType = 'delivery',
      deliveryFeeUSD = 2.0,
      bcvRate = 848.55,
    } = body

    if (!customerName || !customerPhone || !deliveryAddress || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Datos incompletos. Se requiere nombre, teléfono, dirección y al menos 1 producto.' },
        { status: 400 }
      )
    }

    const matchedStore = INITIAL_MARKETPLACE_STORES.find(s => s.id === storeId)
    const effectiveStoreName = storeName || matchedStore?.name || 'Venemarket Principal'

    const subtotalUSD = items.reduce((sum: number, item: any) => sum + ((Number(item.priceUSD) || 0) * (item.quantity || 1)), 0)
    const appliedDeliveryFee = orderType === 'pickup' ? 0 : Number(deliveryFeeUSD) || 2.0
    const totalUSD = subtotalUSD + appliedDeliveryFee
    const totalBS = totalUSD * bcvRate

    const newOrder: DeliveryOrder = {
      id: `del_${Date.now()}`,
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      storeId,
      storeName: effectiveStoreName,
      orderType,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryZone: deliveryZone || 'Caracas',
      deliveryCity,
      deliveryNotes: deliveryNotes || '',
      items: items.map((i: any) => ({
        productId: i.productId || i.id || `prod_${Date.now()}`,
        name: i.name || 'Producto',
        quantity: Number(i.quantity) || 1,
        priceUSD: Number(i.priceUSD) || 0,
        priceBS: Number((Number(i.priceUSD) || 0) * bcvRate),
        image: i.image || '',
        category: i.category || 'General',
      })),
      subtotalUSD: Number(subtotalUSD.toFixed(2)),
      deliveryFeeUSD: Number(appliedDeliveryFee.toFixed(2)),
      totalUSD: Number(totalUSD.toFixed(2)),
      totalBS: Number(totalBS.toFixed(2)),
      bcvRate,
      paymentMethod,
      paymentStatus: paymentMethod === 'efectivo' ? 'pending' : 'paid',
      paymentReference: paymentReference || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      channel: 'marketplace',
    }

    deliveryOrders.unshift(newOrder)

    return NextResponse.json({
      success: true,
      message: '¡Pedido recibido exitosamente! Enviado a la caja de la tienda.',
      order: newOrder
    }, { status: 201 })
  } catch (error) {
    console.error('Error al procesar orden de delivery:', error)
    return NextResponse.json({ error: 'Error procesando el pedido' }, { status: 500 })
  }
}
