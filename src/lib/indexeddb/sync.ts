import { venematicDB } from './db'
import { firestore } from '@/lib/firebase/firestore'
import { collection, query, where, orderBy, limit } from 'firebase/firestore'
import type { Product, Sale, InventoryLog, Customer, BcvRate } from '@/types'

export class SyncManager {
  private isOnline: boolean = true
  private syncInProgress: boolean = false
  private listeners: Array<(status: SyncStatus) => void> = []

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.notifyListeners({ status: 'online', message: 'Connection restored' })
        this.syncAll()
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
        this.notifyListeners({ status: 'offline', message: 'Working offline' })
      })

      this.isOnline = navigator.onLine
    }
  }

  getStatus(): { isOnline: boolean; syncInProgress: boolean } {
    return { isOnline: this.isOnline, syncInProgress: this.syncInProgress }
  }

  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners(status: SyncStatus) {
    this.listeners.forEach((l) => l(status))
  }

  async syncProducts(storeId: string): Promise<void> {
    try {
      const products = await firestore.getAll<Product>('products', [
        where('storeId', '==', storeId),
      ])

      await venematicDB.bulkUpsertProducts(products)
      this.notifyListeners({ status: 'synced', message: `Synced ${products.length} products` })
    } catch (error) {
      console.error('Failed to sync products:', error)
      this.notifyListeners({ status: 'error', message: 'Failed to sync products' })
    }
  }

  async syncSales(): Promise<void> {
    if (!this.isOnline) return

    const unsyncedSales = await venematicDB.getUnsyncedSales()

    for (const sale of unsyncedSales) {
      try {
        await firestore.create('sales', sale, sale.id)
        await venematicDB.markSaleSynced(sale.id)
        this.notifyListeners({ status: 'synced', message: `Sale ${sale.id} synced` })
      } catch (error) {
        console.error('Failed to sync sale:', error)
      }
    }
  }

  async syncInventoryLogs(storeId: string): Promise<void> {
    try {
      const logs = await firestore.getAll<InventoryLog>('inventory_logs', [
        where('storeId', '==', storeId),
        orderBy('createdAt', 'desc'),
        limit(500),
      ])

      for (const log of logs) {
        await venematicDB.addInventoryLog(log)
      }
    } catch (error) {
      console.error('Failed to sync inventory logs:', error)
    }
  }

  async syncCustomers(storeId: string): Promise<void> {
    try {
      const customers = await firestore.getAll<Customer>('customers', [
        where('storeId', '==', storeId),
      ])

      for (const customer of customers) {
        await venematicDB.addCustomer(customer)
      }
    } catch (error) {
      console.error('Failed to sync customers:', error)
    }
  }

  async syncBcvRates(): Promise<void> {
    try {
      const rates = await firestore.getAll<BcvRate>('bcv_rates', [
        orderBy('date', 'desc'),
        limit(90),
      ])

      for (const rate of rates) {
        await venematicDB.saveBcvRate(rate)
      }
    } catch (error) {
      console.error('Failed to sync BCV rates:', error)
    }
  }

  async syncAll(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return

    this.syncInProgress = true
    this.notifyListeners({ status: 'syncing', message: 'Syncing all data...' })

    try {
      const storeId = await venematicDB.getSetting<string>('current_store_id')
      if (storeId) {
        await Promise.all([
          this.syncProducts(storeId),
          this.syncSales(),
          this.syncInventoryLogs(storeId),
          this.syncCustomers(storeId),
          this.syncBcvRates(),
        ])
      }
      this.notifyListeners({ status: 'synced', message: 'All data synced' })
    } catch (error) {
      console.error('Sync failed:', error)
      this.notifyListeners({ status: 'error', message: 'Sync failed' })
    } finally {
      this.syncInProgress = false
    }
  }

  async saveSaleOffline(sale: any): Promise<void> {
    await venematicDB.addSale(sale)

    if (this.isOnline) {
      await this.syncSales()
    }
  }
}

export interface SyncStatus {
  status: 'online' | 'offline' | 'syncing' | 'synced' | 'error'
  message: string
}

export const syncManager = new SyncManager()
