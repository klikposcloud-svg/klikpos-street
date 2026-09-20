import { NextResponse } from 'next/server'
import { deliveryOrders } from '@/lib/delivery-store'
import type { DeliveryOrderStatus } from '@/types/delivery'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const order = deliveryOrders.find(o => o.id === params.id || o.orderNumber === params.id)
  if (!order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }
  return NextResponse.json(order)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, riderName, riderPhone, riderVehicle, paymentStatus } = body

    const index = deliveryOrders.findIndex(o => o.id === params.id || o.orderNumber === params.id)
    if (index === -1) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    const order = deliveryOrders[index]

    if (status) order.status = status as DeliveryOrderStatus
    if (riderName !== undefined) order.riderName = riderName
    if (riderPhone !== undefined) order.riderPhone = riderPhone
    if (riderVehicle !== undefined) order.riderVehicle = riderVehicle
    if (paymentStatus !== undefined) order.paymentStatus = paymentStatus
    order.updatedAt = new Date().toISOString()

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Error actualizando pedido:', error)
    return NextResponse.json({ error: 'Error actualizando pedido' }, { status: 500 })
  }
}
