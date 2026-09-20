export type DeliveryOrderStatus = 
  | 'pending'      // Nuevo pedido entrante desde la app móvil
  | 'preparing'    // Pedido aceptado por el cajero / En cocina o empaque
  | 'ready'        // Listo en mostrador para retiro del repartidor
  | 'on_way'       // Repartidor en camino al domicilio del cliente
  | 'delivered'    // Entregado con éxito (registrado en caja e inventario)
  | 'cancelled';   // Pedido cancelado

export interface DeliveryOrderItem {
  productId: string;
  name: string;
  quantity: number;
  priceUSD: number;
  priceBS: number;
  image?: string;
  category?: string;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  orderType: 'delivery' | 'pickup';
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryZone?: string;
  deliveryCity?: string;
  deliveryNotes?: string;
  items: DeliveryOrderItem[];
  subtotalUSD: number;
  deliveryFeeUSD: number;
  totalUSD: number;
  totalBS: number;
  bcvRate: number;
  paymentMethod: 'pago_movil' | 'zelle' | 'efectivo' | 'tarjeta' | 'app';
  paymentStatus: 'pending' | 'paid';
  paymentReference?: string;
  riderName?: string;
  riderPhone?: string;
  riderVehicle?: string;
  status: DeliveryOrderStatus;
  createdAt: string;
  updatedAt: string;
  channel: 'mobile_app' | 'manual' | 'marketplace';
}

export interface MarketplaceStore {
  id: string;
  name: string;
  businessType: string; // supermarket, pharmacy, bookstore, hardware, fashion, petshop, electronics, butcher, bakery
  businessTypeLabel: string;
  tagline: string;
  city: string;
  state: string;
  zone: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFeeUSD: number;
  minOrderUSD: number;
  isOpen: boolean;
  openingHours: string;
  logo: string;
  banner: string;
  acceptsPagoMovil: boolean;
  acceptsZelle: boolean;
  acceptsCash: boolean;
  acceptsCard: boolean;
}

export interface CrossStoreProduct {
  id: string;
  name: string;
  category: string;
  priceUSD: number;
  priceBS: number;
  stock: number;
  isAvailable: boolean;
  barcode?: string;
  image?: string;
  storeId: string;
  storeName: string;
  storeZone: string;
  storeCity: string;
  storeBusinessType: string;
  storeRating: number;
  deliveryTime: string;
  deliveryFeeUSD: number;
  distanceKm?: number;
}
