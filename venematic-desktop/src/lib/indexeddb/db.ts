import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'venematic-db'
const DB_VERSION = 4

const STORES = {
  PRODUCTS: 'products',
  SALES: 'sales',
  PENDING_SYNC: 'pending_sync',
  BCV_RATES: 'bcv_rates',
  APP_SETTINGS: 'app_settings',
  INVENTORY_LOGS: 'inventory_logs',
  CUSTOMERS: 'customers',
  SYNC_QUEUE: 'sync_queue',
  CACHE_META: 'cache_meta',
} as const

const INDEX_CONFIG = {
  [STORES.PRODUCTS]: [
    { name: 'storeId', keyPath: 'storeId', options: { unique: false } },
    { name: 'barcode', keyPath: 'barcode', keyPathType: 'string', options: { unique: false } },
    { name: 'category', keyPath: 'category', options: { unique: false } },
    { name: 'stock', keyPath: 'stock', options: { unique: false } },
    { name: 'updatedAt', keyPath: 'updatedAt', options: { unique: false } },
  ],
  [STORES.SALES]: [
    { name: 'storeId', keyPath: 'storeId', options: { unique: false } },
    { name: 'cashierId', keyPath: 'cashierId', options: { unique: false } },
    { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } },
    { name: 'synced', keyPath: 'synced', options: { unique: false } },
    { name: 'receiptNumber', keyPath: 'receiptNumber', options: { unique: true } },
  ],
  [STORES.INVENTORY_LOGS]: [
    { name: 'storeId', keyPath: 'storeId', options: { unique: false } },
    { name: 'productId', keyPath: 'productId', options: { unique: false } },
    { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } },
  ],
  [STORES.CUSTOMERS]: [
    { name: 'storeId', keyPath: 'storeId', options: { unique: false } },
    { name: 'phone', keyPath: 'phone', options: { unique: false } },
    { name: 'email', keyPath: 'email', options: { unique: false } },
  ],
  [STORES.SYNC_QUEUE]: [
    { name: 'type', keyPath: 'type', options: { unique: false } },
    { name: 'synced', keyPath: 'synced', options: { unique: false } },
    { name: 'priority', keyPath: 'priority', options: { unique: false } },
    { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } },
  ],
} as const

class VenematicDB {
  private db: IDBPDatabase | null = null
  private initPromise: Promise<IDBPDatabase> | null = null

  async init(): Promise<IDBPDatabase> {
    if (this.db) return this.db
    if (this.initPromise) return this.initPromise

    this.initPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const productsStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' })
          productsStore.createIndex('storeId', 'storeId', { unique: false })
          productsStore.createIndex('barcode', 'barcode', { unique: false })
          productsStore.createIndex('category', 'category', { unique: false })

          const salesStore = db.createObjectStore(STORES.SALES, { keyPath: 'id' })
          salesStore.createIndex('storeId', 'storeId', { unique: false })
          salesStore.createIndex('cashierId', 'cashierId', { unique: false })
          salesStore.createIndex('createdAt', 'createdAt', { unique: false })
          salesStore.createIndex('synced', 'synced', { unique: false })

          db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id' })
        }

        if (oldVersion < 2) {
          db.createObjectStore(STORES.BCV_RATES, { keyPath: 'id' })
          db.createObjectStore(STORES.APP_SETTINGS, { keyPath: 'key' })
        }

        if (oldVersion < 3) {
          const inventoryStore = db.createObjectStore(STORES.INVENTORY_LOGS, { keyPath: 'id' })
          inventoryStore.createIndex('storeId', 'storeId', { unique: false })
          inventoryStore.createIndex('productId', 'productId', { unique: false })
          inventoryStore.createIndex('createdAt', 'createdAt', { unique: false })

          const customersStore = db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' })
          customersStore.createIndex('storeId', 'storeId', { unique: false })
          customersStore.createIndex('phone', 'phone', { unique: false })
          customersStore.createIndex('email', 'email', { unique: false })
        }

        if (oldVersion < 4) {
          const syncQueueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' })
          syncQueueStore.createIndex('type', 'type', { unique: false })
          syncQueueStore.createIndex('synced', 'synced', { unique: false })
          syncQueueStore.createIndex('priority', 'priority', { unique: false })
          syncQueueStore.createIndex('createdAt', 'createdAt', { unique: false })

          db.createObjectStore(STORES.CACHE_META, { keyPath: 'key' })
        }
      },
    })

    this.db = await this.initPromise
    this.initPromise = null

    await this.migrateOldData()

    return this.db
  }

  private async migrateOldData(): Promise<void> {
    const db = await this.getDb()
    const migrated = await db.get(STORES.CACHE_META, 'migrated_v4')
    if (migrated) return

    try {
      const oldPending = await db.getAll('pending_sync')
      if (oldPending.length > 0) {
        const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite')
        for (const item of oldPending) {
          await tx.store.put({
            ...item,
            priority: item.type === 'sale' ? 1 : 2,
            createdAt: item.timestamp || Date.now(),
          })
        }
        await tx.done

        const clearTx = db.transaction('pending_sync', 'readwrite')
        await clearTx.store.clear()
        await clearTx.done
      }

      await db.put(STORES.CACHE_META, { key: 'migrated_v4', value: true, timestamp: Date.now() })
    } catch (error) {
      console.error('Migration error:', error)
    }
  }

  private async getDb(): Promise<IDBPDatabase> {
    if (!this.db) await this.init()
    return this.db!
  }

  async getProductsByStore(storeId: string): Promise<any[]> {
    const db = await this.getDb()
    const tx = db.transaction(STORES.PRODUCTS, 'readonly')
    const index = tx.store.index('storeId')
    return index.getAll(storeId)
  }

  async getProductByBarcode(barcode: string): Promise<any | undefined> {
    if (!barcode) return undefined
    const db = await this.getDb()
    const tx = db.transaction(STORES.PRODUCTS, 'readonly')
    const index = tx.store.index('barcode')
    const results = await index.getAll(barcode)
    return results[0]
  }

  async getProduct(id: string): Promise<any | undefined> {
    const db = await this.getDb()
    return db.get(STORES.PRODUCTS, id)
  }

  async upsertProduct(product: any): Promise<void> {
    const db = await this.getDb()
    await db.put(STORES.PRODUCTS, product)
  }

  async bulkUpsertProducts(products: any[]): Promise<void> {
    const db = await this.getDb()
    const batchSize = 500

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      const tx = db.transaction(STORES.PRODUCTS, 'readwrite')
      await Promise.all(batch.map((p) => tx.store.put(p)))
      await tx.done
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const db = await this.getDb()
    await db.delete(STORES.PRODUCTS, id)
  }

  async getLowStockProducts(storeId: string, threshold?: number): Promise<any[]> {
    const db = await this.getDb()
    const products = await this.getProductsByStore(storeId)
    return products.filter((p) => {
      const limit = threshold ?? p.minStock ?? 5
      return p.stock <= limit
    })
  }

  async addSale(sale: any): Promise<void> {
    const db = await this.getDb()
    const tx = db.transaction([STORES.SALES, STORES.SYNC_QUEUE], 'readwrite')

    await tx.objectStore(STORES.SALES).add(sale)
    await tx.objectStore(STORES.SYNC_QUEUE).add({
      id: `sync_sale_${sale.id}`,
      type: 'sale',
      data: sale,
      priority: 1,
      synced: false,
      retryCount: 0,
      createdAt: Date.now(),
      lastError: null,
    })

    await tx.done
  }

  async saveSale(sale: any): Promise<void> {
    return this.addSale(sale)
  }

  async updateProductStock(productId: string, newStock: number): Promise<void> {
    const product = await this.getProduct(productId)
    if (product) {
      product.stock = newStock
      product.updatedAt = new Date().toISOString()
      await this.upsertProduct(product)
    }
  }

  async getSalesByStore(storeId: string): Promise<any[]> {
    const db = await this.getDb()
    const tx = db.transaction(STORES.SALES, 'readonly')
    const index = tx.store.index('storeId')
    return index.getAll(storeId)
  }

  async getUnsyncedSales(): Promise<any[]> {
    const db = await this.getDb()
    const tx = db.transaction(STORES.SALES, 'readonly')
    const index = tx.store.index('synced')
    return index.getAll(false as any)
  }

  async markSaleSynced(saleId: string): Promise<void> {
    const db = await this.getDb()
    const sale = await db.get(STORES.SALES, saleId)
    if (sale) {
      sale.synced = true
      await db.put(STORES.SALES, sale)
    }
  }

  async getSyncQueue(): Promise<any[]> {
    const db = await this.getDb()
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly')
    const index = tx.store.index('synced')
    const items = await index.getAll(false as any)
    return items.sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt)
  }

  async markSyncQueueItemSynced(id: string): Promise<void> {
    const db = await this.getDb()
    await db.delete(STORES.SYNC_QUEUE, id)
  }

  async incrementSyncRetry(id: string, error: string): Promise<void> {
    const db = await this.getDb()
    const item = await db.get(STORES.SYNC_QUEUE, id)
    if (item) {
      item.retryCount = (item.retryCount || 0) + 1
      item.lastError = error
      item.lastRetryAt = Date.now()
      await db.put(STORES.SYNC_QUEUE, item)
    }
  }

  async saveBcvRate(rate: any): Promise<void> {
    const db = await this.getDb()
    await db.put(STORES.BCV_RATES, rate)
  }

  async getLatestBcvRate(): Promise<any | undefined> {
    const db = await this.getDb()
    const rates = await db.getAll(STORES.BCV_RATES)
    return rates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  }

  async getAllBcvRates(): Promise<any[]> {
    const db = await this.getDb()
    const rates = await db.getAll(STORES.BCV_RATES)
    return rates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  async saveSetting(key: string, value: unknown): Promise<void> {
    const db = await this.getDb()
    await db.put(STORES.APP_SETTINGS, { key, value, updatedAt: Date.now() })
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    const db = await this.getDb()
    const setting = await db.get(STORES.APP_SETTINGS, key)
    return setting?.value as T
  }

  async addInventoryLog(log: any): Promise<void> {
    const db = await this.getDb()
    await db.add(STORES.INVENTORY_LOGS, log)
  }

  async getInventoryLogsByStore(storeId: string, limit = 500): Promise<any[]> {
    const db = await this.getDb()
    const tx = db.transaction(STORES.INVENTORY_LOGS, 'readonly')
    const index = tx.store.index('storeId')
    const all = await index.getAll(storeId)
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit)
  }

  async addCustomer(customer: any): Promise<void> {
    const db = await this.getDb()
    await db.put(STORES.CUSTOMERS, customer)
  }

  async getCustomersByStore(storeId: string): Promise<any[]> {
    const db = await this.getDb()
    const tx = db.transaction(STORES.CUSTOMERS, 'readonly')
    const index = tx.store.index('storeId')
    return index.getAll(storeId)
  }

  async getDatabaseSize(): Promise<{ totalBytes: number; storeSizes: Record<string, number> }> {
    const db = await this.getDb()
    const storeSizes: Record<string, number> = {}
    let totalBytes = 0

    for (const storeName of Array.from(db.objectStoreNames)) {
      const items = await db.getAll(storeName)
      const size = new Blob([JSON.stringify(items)]).size
      storeSizes[storeName] = size
      totalBytes += size
    }

    return { totalBytes, storeSizes }
  }

  async cleanupOldSales(daysToKeep = 180): Promise<number> {
    const db = await this.getDb()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    const cutoffStr = cutoffDate.toISOString()

    const sales = await db.getAll(STORES.SALES)
    const oldSales = sales.filter((s) => s.createdAt < cutoffStr && s.synced)

    if (oldSales.length === 0) return 0

    const tx = db.transaction(STORES.SALES, 'readwrite')
    for (const sale of oldSales) {
      await tx.store.delete(sale.id)
    }
    await tx.done

    return oldSales.length
  }

  async cleanupOldInventoryLogs(daysToKeep = 90): Promise<number> {
    const db = await this.getDb()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    const cutoffStr = cutoffDate.toISOString()

    const logs = await db.getAll(STORES.INVENTORY_LOGS)
    const oldLogs = logs.filter((l) => l.createdAt < cutoffStr)

    if (oldLogs.length === 0) return 0

    const tx = db.transaction(STORES.INVENTORY_LOGS, 'readwrite')
    for (const log of oldLogs) {
      await tx.store.delete(log.id)
    }
    await tx.done

    return oldLogs.length
  }

  async compactDatabase(): Promise<void> {
    await this.cleanupOldSales(180)
    await this.cleanupOldInventoryLogs(90)

    const db = await this.getDb()
    const bcvRates = await db.getAll(STORES.BCV_RATES)
    if (bcvRates.length > 365) {
      const sorted = bcvRates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      const toDelete = sorted.slice(365)
      const tx = db.transaction(STORES.BCV_RATES, 'readwrite')
      for (const rate of toDelete) {
        await tx.store.delete(rate.id)
      }
      await tx.done
    }
  }

  async clearStore(storeName: string): Promise<void> {
    const db = await this.getDb()
    await db.clear(storeName)
  }

  async clearAll(): Promise<void> {
    const db = await this.getDb()
    const stores = db.objectStoreNames
    for (let i = 0; i < stores.length; i++) {
      await db.clear(stores[i])
    }
  }

  async exportAllData(): Promise<Record<string, any[]>> {
    const db = await this.getDb()
    const data: Record<string, any[]> = {}

    for (const storeName of Array.from(db.objectStoreNames)) {
      data[storeName] = await db.getAll(storeName)
    }

    return data
  }

  async importAllData(data: Record<string, any[]>): Promise<void> {
    const db = await this.getDb()

    for (const [storeName, items] of Object.entries(data)) {
      if (!db.objectStoreNames.contains(storeName as any)) continue

      const tx = db.transaction(storeName as any, 'readwrite')
      await tx.objectStore(storeName as any).clear()

      for (const item of items) {
        await tx.objectStore(storeName as any).put(item)
      }
      await tx.done
    }
  }
}

export const venematicDB = new VenematicDB()

export interface IDBProduct {
  id: string;
  storeId: string;
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  priceUSD: number;
  costUSD?: number;
  stock: number;
  minStock?: number;
  maxStock?: number;
  unit?: string;
  imageUrl?: string;
  image?: string;
  supplier?: string;
  tags?: string[];
  isScanned?: boolean;
  visualCategory?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDBSale {
  id: string;
  storeId: string;
  cashierId: string;
  cashierName: string;
  items: Array<{
    productId: string;
    productName: string;
    barcode?: string;
    sku?: string;
    quantity: number;
    priceUSD: number;
    discount: number;
    totalUSD: number;
  }>;
  subtotalUSD: number;
  discountUSD?: number;
  igtfUSD: number;
  totalUSD: number;
  bcvRate: number;
  totalBS: number;
  paymentMethod: string;
  payments?: Array<{
    method: string;
    amountUSD: number;
    amountBS: number;
    rate: number;
    reference: string;
    bank?: string;
    phone?: string;
    status: string;
    igtf_aplicado?: boolean;
  }>;
  customerEmail?: string;
  customerPhone?: string;
  receiptNumber: string;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IDBBcvRate {
  id: string;
  rate: number;
  date: string;
  source: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IDBCustomer {
  id: string;
  storeId: string;
  name: string;
  email?: string;
  phone?: string;
  rif?: string;
  totalPurchasesUSD?: number;
  visitCount?: number;
  lastVisit?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
