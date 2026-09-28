/**
 * KlikPOS Financial & Credit Engine - Base de Datos Financiera Offline-First
 * Administra Costos de Mercancía (COGS), Gastos Operativos, Cuentas por Cobrar (Créditos/Fiados),
 * Cuentas por Pagar (Proveedores) e Historial de Rentabilidad Neta.
 */

export interface OperationalExpense {
  id: string;
  category: 'alquiler' | 'servicios' | 'nomina' | 'empaques' | 'mantenimiento' | 'impuestos' | 'otros';
  description: string;
  amountUSD: number;
  amountVES: number;
  bcvRate: number;
  date: string; // YYYY-MM-DD
  paymentMethod: string;
  receiptNumber?: string;
  notes?: string;
}

export interface CustomerCreditRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerDocId: string;
  saleId: string;
  ticketNumber: string;
  initialAmountUSD: number;
  remainingAmountUSD: number;
  bcvRateAtSale: number;
  dateIssued: string; // YYYY-MM-DD
  dueDate: string;    // YYYY-MM-DD
  status: 'pendiente' | 'parcial' | 'pagado' | 'vencido';
  itemsSummary: string;
  payments: {
    id: string;
    date: string;
    amountUSD: number;
    amountVES: number;
    bcvRate: number;
    method: string;
    reference?: string;
  }[];
}

export interface SupplierRecord {
  id: string;
  name: string;
  rif: string;
  contactName: string;
  phone: string;
  email?: string;
  category: string;
  creditDays: number; // Ej: 15 días, 30 días
  address?: string;
  notes?: string;
}

export interface SupplierInvoiceRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierRif: string;
  invoiceNumber: string;
  dateIssued: string; // YYYY-MM-DD
  dueDate: string;    // YYYY-MM-DD
  totalAmountUSD: number;
  remainingAmountUSD: number;
  bcvRate: number;
  status: 'pendiente' | 'parcial' | 'pagada' | 'vencida';
  itemsCount: number;
  notes?: string;
  payments: {
    id: string;
    date: string;
    amountUSD: number;
    method: string;
    reference?: string;
  }[];
}

const EXPENSES_KEY = 'klikpos_financial_expenses';
const CREDITS_KEY = 'klikpos_customer_credits';
const SUPPLIERS_KEY = 'klikpos_suppliers_directory';
const SUPPLIER_INVOICES_KEY = 'klikpos_supplier_invoices';

export const financialDB = {
  // --- GASTOS OPERATIVOS ---
  getExpenses(): OperationalExpense[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(EXPENSES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveExpense(expense: Omit<OperationalExpense, 'id'>): OperationalExpense {
    const list = this.getExpenses();
    const newRecord: OperationalExpense = {
      ...expense,
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    list.unshift(newRecord);
    try {
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(list));
    } catch {}
    return newRecord;
  },

  deleteExpense(id: string): boolean {
    const list = this.getExpenses().filter(e => e.id !== id);
    try {
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  },

  // --- CUENTAS POR COBRAR (CRÉDITOS / FIADOS) ---
  getCredits(): CustomerCreditRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(CREDITS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCredit(credit: Omit<CustomerCreditRecord, 'id' | 'payments' | 'remainingAmountUSD' | 'status'>): CustomerCreditRecord {
    const list = this.getCredits();
    const newRecord: CustomerCreditRecord = {
      ...credit,
      id: `crd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      remainingAmountUSD: credit.initialAmountUSD,
      status: 'pendiente',
      payments: [],
    };
    list.unshift(newRecord);
    try {
      localStorage.setItem(CREDITS_KEY, JSON.stringify(list));
    } catch {}
    return newRecord;
  },

  registerCreditPayment(creditId: string, payment: { amountUSD: number; amountVES: number; bcvRate: number; method: string; reference?: string }): CustomerCreditRecord | null {
    const list = this.getCredits();
    const index = list.findIndex(c => c.id === creditId);
    if (index === -1) return null;

    const record = list[index];
    const newPayment = {
      ...payment,
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
    };

    record.payments.push(newPayment);
    record.remainingAmountUSD = Math.max(0, record.remainingAmountUSD - payment.amountUSD);

    if (record.remainingAmountUSD <= 0.01) {
      record.status = 'pagado';
    } else {
      record.status = 'parcial';
    }

    list[index] = record;
    try {
      localStorage.setItem(CREDITS_KEY, JSON.stringify(list));
    } catch {}
    return record;
  },

  // --- PROVEEDORES ---
  getSuppliers(): SupplierRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(SUPPLIERS_KEY);
      if (data) return JSON.parse(data);
    } catch {}
    // Proveedores de ejemplo si está vacío
    return [
      { id: 'sup_1', name: 'Distribuidora Polar C.A.', rif: 'J-00041367-9', contactName: 'Gerardo Díaz', phone: '04141112233', category: 'Bebidas y Alimentos', creditDays: 15 },
      { id: 'sup_2', name: 'Embutidos y Carnes La Montaña', rif: 'J-31298456-1', contactName: 'Carlos Mendoza', phone: '04245558899', category: 'Charcutería y Carnes', creditDays: 7 },
      { id: 'sup_3', name: 'Empaques e Insumos Plásticos Los Andes', rif: 'J-40192837-0', contactName: 'Mariana Silva', phone: '04127774411', category: 'Empaques y Desechables', creditDays: 30 },
    ];
  },

  saveSupplier(supplier: Omit<SupplierRecord, 'id'>): SupplierRecord {
    const list = this.getSuppliers();
    const newRecord: SupplierRecord = {
      ...supplier,
      id: `sup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    list.unshift(newRecord);
    try {
      localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(list));
    } catch {}
    return newRecord;
  },

  // --- CUENTAS POR PAGAR (FACTURAS PROVEEDOR) ---
  getSupplierInvoices(): SupplierInvoiceRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(SUPPLIER_INVOICES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveSupplierInvoice(inv: Omit<SupplierInvoiceRecord, 'id' | 'remainingAmountUSD' | 'status' | 'payments'>): SupplierInvoiceRecord {
    const list = this.getSupplierInvoices();
    const newRecord: SupplierInvoiceRecord = {
      ...inv,
      id: `sinv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      remainingAmountUSD: inv.totalAmountUSD,
      status: 'pendiente',
      payments: [],
    };
    list.unshift(newRecord);
    try {
      localStorage.setItem(SUPPLIER_INVOICES_KEY, JSON.stringify(list));
    } catch {}
    return newRecord;
  },

  registerSupplierPayment(invoiceId: string, payment: { amountUSD: number; method: string; reference?: string }): SupplierInvoiceRecord | null {
    const list = this.getSupplierInvoices();
    const index = list.findIndex(i => i.id === invoiceId);
    if (index === -1) return null;

    const record = list[index];
    record.payments.push({
      ...payment,
      id: `spay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
    });

    record.remainingAmountUSD = Math.max(0, record.remainingAmountUSD - payment.amountUSD);
    if (record.remainingAmountUSD <= 0.01) {
      record.status = 'pagada';
    } else {
      record.status = 'parcial';
    }

    list[index] = record;
    try {
      localStorage.setItem(SUPPLIER_INVOICES_KEY, JSON.stringify(list));
    } catch {}
    return record;
  },
};
