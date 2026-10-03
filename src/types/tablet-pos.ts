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
  integrityHash?: string;
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

export type CardViewMode = 'food' | 'lista';

export type ThemePreset = 'street_pro' | 'gourmet_clean';
