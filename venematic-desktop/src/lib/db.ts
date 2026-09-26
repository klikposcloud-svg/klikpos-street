import Dexie, { Table } from 'dexie';

export interface LocalProduct {
  id?: number;
  barcode: string;
  name: string;
  category: string;
  priceUSD: number;
  costUSD: number;
  stock: number;
  minStock: number;
  unit: string;
  image?: string;
  updatedAt: string;
  costPerBox?: number;
  packageUnits?: number;
  profitMarginPercent?: number;
  isTaxExempt?: boolean; // Verdadero si el artículo está exento de IVA (Tasa 0% SENIAT)
}

export interface SaleItem {
  productId: number;
  name: string;
  barcode: string;
  qty: number;
  priceUSD: number;
  totalUSD: number;
  taxRate?: number;
  isTaxExempt?: boolean; // Verdadero si el artículo vendido está exento de IVA
}

export interface SalePayment {
  method: 'cash_usd' | 'cash_ves' | 'pago_movil' | 'card_debit' | 'card_credit' | 'zelle' | 'binance' | 'credit';
  amountUSD: number;
  amountVES: number;
  reference?: string;
}

export interface LocalSale {
  id?: number;
  receiptNumber: string;
  timestamp: string;
  items: SaleItem[];
  subtotalUSD: number;
  taxUSD: number;
  totalUSD: number;
  totalVES: number;
  bcvRate: number;
  payments: SalePayment[];
  changeUSD: number;
  changeVES: number;
  cashierName: string;
  customerDoc?: string;
  customerName?: string;
  status: 'completed' | 'cancelled' | 'voided';
  source?: 'desktop' | 'mobile' | string;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
}

export interface LocalCustomer {
  id?: number;
  docId: string; // V-12345678, J-123456789
  name: string;
  phone: string;
  email?: string;
  address?: string;
  currentCreditUSD: number;
  creditLimitUSD?: number;
  currentDebtUSD?: number;
  createdAt: string;
}

export interface LocalCashShift {
  id?: number;
  openedAt: string;
  closedAt?: string;
  cashierName: string;
  initialCashUSD: number;
  initialCashVES: number;
  totalSalesUSD: number;
  totalCashUSD: number;
  totalCashVES: number;
  totalPagoMovilVES: number;
  totalCardVES: number;
  totalZelleUSD: number;
  status: 'open' | 'closed';
}

export interface LocalSetting {
  key: string;
  value: any;
}

export interface InventoryMovement {
  id?: number;
  productId: number;
  productName: string;
  barcode: string;
  type: 'in' | 'out' | 'adjustment' | 'void_return';
  reason: 'sale' | 'purchase' | 'count_adjustment' | 'spoilage_damaged' | 'expiration' | 'internal_consumption' | 'return_supplier' | 'sale_void';
  qtyDelta: number;
  previousStock: number;
  newStock: number;
  timestamp: string;
  performedBy: string;
  notes?: string;
}

export interface CustomerCreditPayment {
  id?: number;
  customerId?: number;
  customerDoc: string;
  customerName: string;
  amountUSD: number;
  amountVES: number;
  bcvRate: number;
  method: 'cash_usd' | 'cash_ves' | 'pago_movil' | 'card_debit' | 'zelle' | 'transfer';
  reference?: string;
  timestamp: string;
  cashierName: string;
  notes?: string;
}

export class VenematicDesktopDB extends Dexie {
  products!: Table<LocalProduct, number>;
  sales!: Table<LocalSale, number>;
  customers!: Table<LocalCustomer, number>;
  cashShifts!: Table<LocalCashShift, number>;
  settings!: Table<LocalSetting, string>;
  inventoryMovements!: Table<InventoryMovement, number>;
  customerCreditPayments!: Table<CustomerCreditPayment, number>;

  constructor() {
    super('VenematicDesktopDB');
    this.version(1).stores({
      products: '++id, &barcode, name, category, stock, updatedAt',
      sales: '++id, &receiptNumber, timestamp, status, cashierName',
      customers: '++id, &docId, name, phone',
      cashShifts: '++id, openedAt, status, cashierName',
      settings: '&key',
    });
    this.version(2).stores({
      products: '++id, &barcode, name, category, stock, updatedAt',
      sales: '++id, &receiptNumber, timestamp, status, cashierName',
      customers: '++id, &docId, name, phone',
      cashShifts: '++id, openedAt, status, cashierName',
      settings: '&key',
      inventoryMovements: '++id, productId, barcode, type, reason, timestamp',
      customerCreditPayments: '++id, customerDoc, timestamp, method',
    });
  }
}

export const db = new VenematicDesktopDB();
