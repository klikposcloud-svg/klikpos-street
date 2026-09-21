import { FieldValue } from 'firebase-admin/firestore';

export interface FirestoreStore {
  id: string;
  name: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  settings: StoreSettings;
  subscription: SubscriptionInfo;
  logoUrl?: string;
  timezone: string;
  currency: 'USD';
  taxId?: string;
}

export interface StoreSettings {
  defaultPaymentMethod: 'cash' | 'card' | 'mobile' | 'zelle';
  applyIgtfByDefault: boolean;
  minStockAlert: number;
  currency: 'USD';
  language: 'es' | 'en';
  darkMode: boolean;
  receiptFooter: string;
  invoicePrefix: string;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'manual';
}

export interface SubscriptionInfo {
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  startDate: string;
  endDate?: string;
  features: string[];
  maxProducts: number;
  maxUsers: number;
}

export interface FirestoreUser {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  photoUrl?: string;
  role: UserRole;
  storeIds: string[];
  currentStoreId?: string;
  createdAt: string;
  lastLoginAt?: string;
  settings: UserSettings;
  permissions: string[];
  active: boolean;
}

export type UserRole = 'owner' | 'admin' | 'supervisor' | 'cashier';

export interface UserSettings {
  language: 'es' | 'en';
  darkMode: boolean;
  notifications: NotificationSettings;
  dashboardLayout?: string;
}

export interface NotificationSettings {
  lowStock: boolean;
  dailySales: boolean;
  weeklyReport: boolean;
  newUser: boolean;
}

export interface FirestoreProduct {
  id: string;
  storeId: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  priceUSD: number;
  costUSD?: number;
  profitMargin?: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  imageUrl?: string;
  supplier?: string;
  tags: string[];
  visualCategory?: string;
  visualData?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface FirestoreCategory {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  parentId?: string;
  color?: string;
  icon?: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreSale {
  id: string;
  storeId: string;
  receiptNumber: string;
  cashierId: string;
  cashierName: string;
  items: SaleItem[];
  subtotalUSD: number;
  discountUSD: number;
  igtfUSD: number;
  totalUSD: number;
  bcvRate: number;
  totalBS: number;
  paymentMethod: PaymentMethodType;
  payments: PaymentRecord[];
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  status: 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  barcode?: string;
  quantity: number;
  priceUSD: number;
  discountPercent: number;
  discountUSD: number;
  totalUSD: number;
}

export type PaymentMethodType = 'cash' | 'card' | 'zelle' | 'mobile_payment' | 'mixed' | 'qr_bcv';

export interface PaymentRecord {
  method: PaymentMethodType;
  amountUSD: number;
  amountBS: number;
  rate: number;
  reference?: string;
  bank?: string;
  phone?: string;
  status: 'pending' | 'verified' | 'rejected';
  igtf_aplicado: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface FirestoreCustomer {
  id: string;
  storeId: string;
  name: string;
  idType?: 'V' | 'E' | 'J' | 'G' | 'P';
  idNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  creditBalance?: number;
  creditLimit?: number;
  totalPurchases: number;
  lastPurchaseAt?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  notes?: string;
}

export interface CreditVoucher {
  id: string;
  storeId: string;
  customerId?: string;
  customerName: string;
  customerIdNumber?: string;
  amountUSD: number;
  amountBS: number;
  remainingUSD: number;
  remainingBS: number;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  usedAt?: string;
  usedInSaleId?: string;
}

export interface FirestoreInventoryLog {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'transfer' | 'damaged' | 'expired';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  referenceId?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface FirestoreBcvRate {
  id: string;
  rate: number;
  date: string;
  source: string;
  updatedBy?: string;
  createdAt: string;
}

export interface FirestoreReport {
  id: string;
  storeId: string;
  type: ReportType;
  period: ReportPeriod;
  generatedBy: string;
  generatedAt: string;
  data: Record<string, unknown>;
  sentTo: string[];
  status: 'pending' | 'sent' | 'failed';
}

export type ReportType = 'daily_sales' | 'weekly_sales' | 'monthly_sales' | 'inventory' | 'profit' | 'stock_alert' | 'customer_activity';
export type ReportPeriod = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

export interface FirestoreSyncLog {
  id: string;
  storeId: string;
  deviceId: string;
  type: 'full' | 'incremental' | 'manual';
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  recordsProcessed: number;
  recordsFailed: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface FirestoreActivityLog {
  id: string;
  storeId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'sale' | 'product' | 'customer' | 'user' | 'settings' | 'report';
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  deviceInfo?: string;
  createdAt: string;
}

export const FIRESTORE_COLLECTIONS = {
  stores: 'stores',
  users: 'users',
  products: 'products',
  categories: 'categories',
  sales: 'sales',
  customers: 'customers',
  credit_vouchers: 'credit_vouchers',
  inventory_logs: 'inventory_logs',
  bcv_rates: 'bcv_rates',
  reports: 'reports',
  sync_logs: 'sync_logs',
  activity_logs: 'activity_logs',
  settings: 'settings',
} as const;

export const SECURITY_RULES = {
  stores: {
    read: 'auth != null && resource.data.ownerId == auth.uid || auth.uid in resource.data.userIds',
    write: 'resource.data.ownerId == auth.uid',
  },
  users: {
    read: 'auth != null',
    write: 'auth.uid == resource.data.id || get(/databases/$(database)/documents/stores/$(request.auth.token.storeId)).data.ownerId == auth.uid',
  },
  products: {
    read: 'auth != null && request.auth.token.storeId == resource.data.storeId',
    create: 'auth != null && request.auth.token.storeId == request.resource.data.storeId && request.auth.token.role in ["owner", "admin", "supervisor"]',
    update: 'auth != null && request.auth.token.storeId == resource.data.storeId && request.auth.token.role in ["owner", "admin", "supervisor"]',
    delete: 'auth != null && request.auth.token.storeId == resource.data.storeId && request.auth.token.role in ["owner", "admin"]',
  },
  sales: {
    read: 'auth != null && request.auth.token.storeId == resource.data.storeId',
    create: 'auth != null && request.auth.token.storeId == request.resource.data.storeId && request.auth.token.role in ["owner", "admin", "supervisor", "cashier"]',
    update: 'auth != null && request.auth.token.storeId == resource.data.storeId && request.auth.token.role in ["owner", "admin"]',
    delete: 'request.auth.token.role == "owner"',
  },
  customers: {
    read: 'auth != null && request.auth.token.storeId == resource.data.storeId',
    write: 'auth != null && request.auth.token.storeId == resource.data.storeId && request.auth.token.role in ["owner", "admin", "supervisor", "cashier"]',
  },
} as const;

export const COLLECTION_INDEXES = [
  { collection: 'products', fields: ['storeId', 'category', 'updatedAt'] },
  { collection: 'products', fields: ['storeId', 'barcode'] },
  { collection: 'products', fields: ['storeId', 'stock', 'minStock'] },
  { collection: 'sales', fields: ['storeId', 'createdAt'] },
  { collection: 'sales', fields: ['storeId', 'cashierId', 'createdAt'] },
  { collection: 'inventory_logs', fields: ['storeId', 'productId', 'createdAt'] },
  { collection: 'customers', fields: ['storeId', 'phone'] },
  { collection: 'bcv_rates', fields: ['date'] },
];
