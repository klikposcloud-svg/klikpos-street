export interface CartItem {
  id: string;
  name: string;
  priceUSD: number;
  qty: number;
  notes?: string;
  category: string;
  image?: string;
  sku?: string;
}

export interface Product {
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

export interface Customer {
  id: string;
  name: string;
  docId: string;
  phone: string;
  address?: string;
}

export interface CompanyInfo {
  name: string;
  rif: string;
  phone: string;
  address: string;
  footerMsg: string;
}

export interface PagoMovilInfo {
  bank: string;
  phone: string;
  idDoc: string;
  ownerName: string;
}

export interface MixedPaymentEntry {
  id: string;
  method: 'pago_movil' | 'cash_usd' | 'cash_ves' | 'card_debit' | 'zelle';
  currency: 'USD' | 'VES';
  amount: number;
  amountUSD: number;
  amountVES: number;
  reference?: string;
}

export interface CompletedSaleTicket {
  ticketNumber: string;
  timestamp: string;
  items: CartItem[];
  subtotalUSD: number;
  totalUSD: number;
  totalVES: number;
  bcvRate: number;
  paymentMethod: string;
  reference?: string;
  amountReceivedUSD?: number;
  changeUSD?: number;
  changeVES?: number;
  customer: Customer;
  table?: string;
  mixedPayments?: MixedPaymentEntry[];
  integrityHash?: string;
  orderType?: 'local' | 'delivery' | 'llevar';
  paymentStatus?: 'pagado' | 'por_cobrar';
  driverName?: string;
  deliveryAddress?: string;
  cashierName?: string;
}

export interface PosOrder {
  id: string;
  orderNumber: string;
  type: 'local' | 'delivery' | 'llevar';
  status: 'en_cola' | 'listo' | 'despachado';
  paymentStatus: 'pagado' | 'por_cobrar';
  paymentMethod: string;
  items: CartItem[];
  totalUSD: number;
  totalVES: number;
  customer: Customer;
  table?: string;
  driverId?: string;
  driverName?: string;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  timeFormatted: string;
}

export interface Motorizado {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'disponible' | 'en_ruta' | 'inactivo';
}

export interface DiningSpot {
  id: number;
  name: string;
  type: 'mesa' | 'barra' | 'llevar';
  status: 'libre' | 'ocupada' | 'preparando' | 'entregada';
  total: number;
  items: number;
  time: string;
}

export interface PrinterConfig {
  connection: 'bluetooth' | 'lan' | 'usb';
  ip: string;
  port: number;
  paperWidth: '58mm' | '80mm';
  autoCut: boolean;
}

export type RubroId = 'comida' | 'ropa' | 'panaderia' | 'minimarket' | 'farmacia' | 'ferreteria';

export type CardViewMode = 'food' | 'reels' | 'grid' | 'lista';

export type ThemePreset = 'street_pro' | 'gourmet_clean';

export interface CanvasTheme {
  id: 'obsidian' | 'light-graphite';
  name: string;
  subtitle: string;
  bg: string;
  surface: string;
  card: string;
  border: string;
  isLight: boolean;
}

export type CanvasThemeId = CanvasTheme['id'];
