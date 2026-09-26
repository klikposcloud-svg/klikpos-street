export type UserRole = 'admin' | 'supervisor' | 'cashier'

export interface User {
  uid: string
  email: string
  role: UserRole
  storeId: string
  displayName: string
  phone: string
  isActive: boolean
  lastLogin: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Store {
  id: string
  name: string
  rif: string
  address: string
  phone: string
  ownerEmail?: string
  igtfEnabled: boolean
  igtfRate: number
  currency: 'USD'
  businessType?: string
  icon?: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  storeId: string
  name: string
  description: string
  barcode: string
  category: string
  subcategory: string
  priceUSD: number
  costUSD: number
  stock: number
  minStock: number
  maxStock: number
  unit: 'unit' | 'kg' | 'lb' | 'liter' | 'pack'
  image: string
  supplier: string
  tags: string[]
  isScanned: boolean
  visualCategory: string
  createdAt: string
  updatedAt: string
}

export interface BcvRate {
  id: string
  rate: number
  date: string
  source: 'scraper' | 'manual'
  updatedBy: string
  createdAt: string
}

export interface Sale {
  id: string
  storeId: string
  cashierId: string
  cashierName: string
  items: SaleItem[]
  subtotalUSD: number
  igtfUSD: number
  totalUSD: number
  bcvRate: number
  totalBS: number
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mobile' | 'mixed'
  payments: PaymentDetail[]
  customerEmail: string
  customerPhone: string
  receiptNumber: string
  synced: boolean
  createdAt: string
  updatedAt: string
}

export interface SaleItem {
  productId: string
  productName: string
  barcode: string
  quantity: number
  priceUSD: number
  discount: number
  totalUSD: number
}

export interface PaymentDetail {
  method: 'cash' | 'card' | 'transfer' | 'mobile'
  amountUSD: number
  amountBS: number
  reference: string
}

export interface InventoryLog {
  id: string
  storeId: string
  productId: string
  productName: string
  type: 'in' | 'out' | 'adjustment' | 'sale' | 'return' | 'waste'
  quantity: number
  previousStock: number
  newStock: number
  userId: string
  reason: string
  createdAt: string
}

export interface Supplier {
  id: string
  storeId: string
  name: string
  rif: string
  phone: string
  email: string
  address: string
  products: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  storeId: string
  name: string
  email: string
  phone: string
  rif: string
  totalPurchasesUSD: number
  visitCount: number
  lastVisit: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Report {
  id: string
  storeId: string
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  startDate: string
  endDate: string
  totalSalesUSD: number
  totalSalesBS: number
  totalItems: number
  totalTransactions: number
  avgTicketUSD: number
  topProducts: { productId: string; name: string; quantity: number; revenueUSD: number }[]
  paymentBreakdown: { method: string; totalUSD: number; percentage: number }[]
  generatedBy: string
  emailSent: boolean
  createdAt: string
}

export interface PendingSync {
  id: string
  type: 'sale' | 'inventory' | 'product' | 'customer'
  data: Record<string, unknown>
  timestamp: number
  retryCount: number
  synced: boolean
}
