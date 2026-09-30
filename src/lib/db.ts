import Dexie, { Table } from 'dexie';
import { InputGuard } from './security/input-guard';

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
  isTaxExempt?: boolean;
  isFixedPriceVES?: boolean;
  fixedPriceVES?: number;
  icon?: string;
  color?: string;
}

export interface SaleItem {
  productId: number;
  name: string;
  barcode: string;
  qty: number;
  priceUSD: number;
  totalUSD: number;
  taxRate?: number;
  isTaxExempt?: boolean;
  isFixedPriceVES?: boolean;
  fixedPriceVES?: number;
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

export interface CashDenominationBreakdown {
  usd_100?: number;
  usd_50?: number;
  usd_20?: number;
  usd_10?: number;
  usd_5?: number;
  usd_2?: number;
  usd_1?: number;
  usd_coins?: number;

  ves_100?: number;
  ves_50?: number;
  ves_20?: number;
  ves_10?: number;
  ves_5?: number;
  ves_coins?: number;
}

export interface CashMovement {
  id?: number;
  shiftId: number;
  type: 'in' | 'out'; // in: Entrada/Aporte, out: Salida/Retiro/Gasto
  amountUSD: number;
  amountVES: number;
  reason: string;
  performedBy: string;
  timestamp: string;
  notes?: string;
}

export interface LocalCashShift {
  id?: number;
  openedAt: string;
  closedAt?: string;
  cashierName: string;
  initialCashUSD: number;
  initialCashVES: number;
  initialDenominations?: CashDenominationBreakdown;
  totalSalesUSD: number;
  totalCashUSD: number;
  totalCashVES: number;
  totalPagoMovilVES: number;
  totalCardVES: number;
  totalZelleUSD: number;
  cashInUSD?: number;
  cashOutUSD?: number;
  cashInVES?: number;
  cashOutVES?: number;
  expectedCashUSD?: number;
  expectedCashVES?: number;
  actualCashUSD?: number;
  actualCashVES?: number;
  differenceUSD?: number;
  differenceVES?: number;
  finalDenominations?: CashDenominationBreakdown;
  notes?: string;
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
  cashMovements!: Table<CashMovement, number>;

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
    this.version(3).stores({
      products: '++id, &barcode, name, category, stock, updatedAt',
      sales: '++id, &receiptNumber, timestamp, status, cashierName',
      customers: '++id, &docId, name, phone',
      cashShifts: '++id, openedAt, status, cashierName',
      settings: '&key',
      inventoryMovements: '++id, productId, barcode, type, reason, timestamp',
      customerCreditPayments: '++id, customerDoc, timestamp, method',
      cashMovements: '++id, shiftId, type, timestamp',
    });
    this.version(4).stores({
      products: '++id, &barcode, name, category, stock, updatedAt',
      sales: '++id, &receiptNumber, timestamp, status, cashierName, customerDoc, [status+timestamp]',
      customers: '++id, &docId, name, phone',
      cashShifts: '++id, openedAt, status, cashierName',
      settings: '&key',
      inventoryMovements: '++id, productId, barcode, type, reason, timestamp',
      customerCreditPayments: '++id, customerDoc, timestamp, method',
      cashMovements: '++id, shiftId, type, timestamp',
    });

    // ========================================================================
    // HOOKS DE SEGURIDAD AUTOMÁTICOS (INPUTGUARD SHIELD)
    // Sanitiza automáticamente cualquier entidad antes de persistir en BD
    // ========================================================================

    // 1. Productos
    this.products.hook('creating', (_primKey, obj) => {
      if (obj.name) obj.name = InputGuard.sanitizeName(obj.name, 100);
      if (obj.barcode) obj.barcode = InputGuard.sanitizeReference(obj.barcode, 50);
      if (obj.category) obj.category = InputGuard.sanitizeName(obj.category, 60);
      if (obj.priceUSD !== undefined) obj.priceUSD = InputGuard.sanitizeNumber(obj.priceUSD, 0);
      if (obj.costUSD !== undefined) obj.costUSD = InputGuard.sanitizeNumber(obj.costUSD, 0);
      if (obj.stock !== undefined) obj.stock = Math.round(InputGuard.sanitizeNumber(obj.stock, 0));
    });

    this.products.hook('updating', (mods: any) => {
      if (mods.name !== undefined) mods.name = InputGuard.sanitizeName(mods.name, 100);
      if (mods.barcode !== undefined) mods.barcode = InputGuard.sanitizeReference(mods.barcode, 50);
      if (mods.category !== undefined) mods.category = InputGuard.sanitizeName(mods.category, 60);
      if (mods.priceUSD !== undefined) mods.priceUSD = InputGuard.sanitizeNumber(mods.priceUSD, 0);
      if (mods.costUSD !== undefined) mods.costUSD = InputGuard.sanitizeNumber(mods.costUSD, 0);
      if (mods.stock !== undefined) mods.stock = Math.round(InputGuard.sanitizeNumber(mods.stock, 0));
      return mods;
    });

    // 2. Ventas & Comandas
    this.sales.hook('creating', (_primKey, obj) => {
      if (obj.receiptNumber) obj.receiptNumber = InputGuard.sanitizeReference(obj.receiptNumber, 40);
      if (obj.cashierName) obj.cashierName = InputGuard.sanitizeName(obj.cashierName, 60);
      if (obj.customerName) obj.customerName = InputGuard.sanitizeName(obj.customerName, 80);
      if (obj.customerDoc) obj.customerDoc = InputGuard.sanitizeDocument(obj.customerDoc, 20);
      if (Array.isArray(obj.payments)) {
        obj.payments.forEach(p => {
          if (p.reference) p.reference = InputGuard.sanitizeReference(p.reference, 40);
        });
      }
    });

    // 3. Clientes
    this.customers.hook('creating', (_primKey, obj) => {
      if (obj.name) obj.name = InputGuard.sanitizeName(obj.name, 80);
      if (obj.docId) obj.docId = InputGuard.sanitizeDocument(obj.docId, 20);
      if (obj.phone) obj.phone = InputGuard.sanitizeDocument(obj.phone, 25);
      if (obj.address) obj.address = InputGuard.sanitize(obj.address, 150);
    });

    this.customers.hook('updating', (mods: any) => {
      if (mods.name !== undefined) mods.name = InputGuard.sanitizeName(mods.name, 80);
      if (mods.docId !== undefined) mods.docId = InputGuard.sanitizeDocument(mods.docId, 20);
      if (mods.phone !== undefined) mods.phone = InputGuard.sanitizeDocument(mods.phone, 25);
      if (mods.address !== undefined) mods.address = InputGuard.sanitize(mods.address, 150);
      return mods;
    });

    // 4. Turnos de Caja
    this.cashShifts.hook('creating', (_primKey, obj) => {
      if (obj.cashierName) obj.cashierName = InputGuard.sanitizeName(obj.cashierName, 60);
      if (obj.notes) obj.notes = InputGuard.sanitize(obj.notes, 300);
    });
  }
}

export const db = new VenematicDesktopDB();
