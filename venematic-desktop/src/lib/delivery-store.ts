import { DeliveryOrder } from '@/types/delivery'

const globalForDelivery = global as unknown as { deliveryOrders?: DeliveryOrder[] }

export const initialOrders: DeliveryOrder[] = [
  {
    id: 'del_1001',
    orderNumber: 'ORD-1001',
    storeId: 'store_venemarket_chacao',
    storeName: 'Venemarket Express Chacao',
    orderType: 'delivery',
    customerName: 'María González',
    customerPhone: '+584141234567',
    deliveryAddress: 'Av. Francisco de Miranda, Edif. Parque Cristal, Piso 5',
    deliveryZone: 'Chacao / Altamira',
    deliveryCity: 'Caracas',
    deliveryNotes: 'Llamar al llegar a la garita',
    items: [
      { productId: 'prod_1', name: 'Harina PAN 1kg', quantity: 2, priceUSD: 1.25, priceBS: 1060.68 },
      { productId: 'prod_2', name: 'Arroz Mary Tradicional 1kg', quantity: 1, priceUSD: 1.40, priceBS: 1187.96 },
      { productId: 'prod_5', name: 'Queso Blanco Duro 500g', quantity: 1, priceUSD: 3.80, priceBS: 3224.47 }
    ],
    subtotalUSD: 7.70,
    deliveryFeeUSD: 2.00,
    totalUSD: 9.70,
    totalBS: 8230.89,
    bcvRate: 848.55,
    paymentMethod: 'pago_movil',
    paymentStatus: 'paid',
    paymentReference: '0102-984723',
    riderName: 'José Pérez',
    riderPhone: '+584129876543',
    riderVehicle: 'Moto Bera BR 150',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    channel: 'mobile_app'
  },
  {
    id: 'del_1002',
    orderNumber: 'ORD-1002',
    storeId: 'store_venemarket_chacao',
    storeName: 'Venemarket Express Chacao',
    orderType: 'delivery',
    customerName: 'Roberto Mendoza',
    customerPhone: '+584245558899',
    deliveryAddress: 'Urb. Santa Rosa, Calle 3, Casa #14',
    deliveryZone: 'Chacao / Altamira',
    deliveryCity: 'Caracas',
    deliveryNotes: 'Pago en efectivo con billete de $20 (llevar vuelto)',
    items: [
      { productId: 'prod_3', name: 'Café Fama de América 500g', quantity: 2, priceUSD: 3.50, priceBS: 2969.93 },
      { productId: 'prod_4', name: 'Leche Completa La Pastora 1L', quantity: 3, priceUSD: 1.95, priceBS: 1654.67 }
    ],
    subtotalUSD: 12.85,
    deliveryFeeUSD: 2.50,
    totalUSD: 15.35,
    totalBS: 13025.24,
    bcvRate: 848.55,
    paymentMethod: 'efectivo',
    paymentStatus: 'pending',
    status: 'preparing',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    channel: 'mobile_app'
  }
]

export const deliveryOrders: DeliveryOrder[] = globalForDelivery.deliveryOrders || initialOrders

if (process.env.NODE_ENV !== 'production') {
  globalForDelivery.deliveryOrders = deliveryOrders
}
