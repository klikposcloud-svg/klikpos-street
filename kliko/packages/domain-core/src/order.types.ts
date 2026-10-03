export type DeliveryType = 'DOOR_DELIVERY' | 'KLIKO_HUB_PICKUP';

export type OrderStatus = 
  | 'SUBMITTED'             // Cliente envió la orden
  | 'ACCEPTED_MERCHANT'     // Cocina en KlikPOS aceptó la comanda
  | 'PREPARING'             // Cocinando
  | 'READY_FOR_PICKUP'      // Pedido empacado en mostrador
  | 'ASSIGNED_RIDER'        // Motorizado aceptó el despacho
  | 'IN_TRANSIT'            // Motorizado en camino
  | 'STORED_IN_HUB'         // En custodia temporal en Punto Kliko
  | 'DELIVERED'             // Entregado al cliente final
  | 'CANCELLED';

export interface OrderItem {
  productId: string;
  name: string;
  priceUsd: number;
  quantity: number;
  notes?: string;
}

export interface KlikoHub {
  id: string;
  name: string;
  address: string;
  merchantId: string;       // El local con KlikPOS que actúa como Hub
  zone: string;
  coords: { lat: number; lng: number };
  custodyFeeUsd: number;    // Comisión de custodia para el local (ej. $0.35)
  isOpen: boolean;
}

export interface KlikoOrder {
  id: string;
  merchantId: string;
  merchantName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  riderId?: string;
  riderName?: string;
  deliveryType: DeliveryType;
  hubId?: string;           // Si seleccionó Punto Kliko
  hubName?: string;
  items: OrderItem[];
  subtotalUsd: number;
  deliveryFeeUsd: number;
  totalUsd: number;
  paymentMethod: 'K_TOKENS' | 'PAGO_MOVIL' | 'CASH_USD' | 'CASH_BS';
  bcvRate: number;
  totalBs: number;
  status: OrderStatus;
  deliveryCoords: {
    lat: number;
    lng: number;
    address: string;
  };
  otpCode: string;          // Código de 4 dígitos para entrega o retiro seguro
  createdAt: string;
  updatedAt: string;
}