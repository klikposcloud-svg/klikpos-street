import {
  collection,
  doc,
  setDoc,
  writeBatch,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db as firestoreDb, isFirebaseConfigured, getActiveFirebaseConfig } from './config';
import { db as localDb, LocalSale, LocalProduct } from '@/lib/db';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'unconfigured' | 'error';

export interface CloudSyncStatus {
  state: SyncState;
  pendingSales: number;
  lastSyncAt: string | null;
  storeId: string;
  errorMessage?: string;
}

const DEFAULT_STORE_ID = process.env.NEXT_PUBLIC_STORE_ID || 'tienda_principal';
const LAST_SYNC_KEY = 'venematic_last_cloud_sync_timestamp';

class CloudSyncService {
  private isSyncing = false;
  private autoSyncTimer: any = null;
  private currentStoreId: string = DEFAULT_STORE_ID;
  private listeners: Array<(status: CloudSyncStatus) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initListeners();
    }
  }

  public setStoreId(storeId: string) {
    this.currentStoreId = storeId || DEFAULT_STORE_ID;
  }

  public getStoreId(): string {
    return this.currentStoreId;
  }

  private initListeners() {
    window.addEventListener('online', () => {
      console.log('[CloudSync] Conexión a internet restablecida. Iniciando sincronización...');
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      console.log('[CloudSync] Dispositivo sin conexión. Modo local activo.');
      this.notifyStatus('offline');
    });
  }

  public onStatusChange(callback: (status: CloudSyncStatus) => void): () => void {
    this.listeners.push(callback);
    callback(this.getCurrentStatus());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyStatus(state: SyncState, errorMessage?: string, pendingCount?: number) {
    const status = this.getCurrentStatus(state, errorMessage, pendingCount);
    this.listeners.forEach((callback) => callback(status));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('venematic:cloud-sync-status', { detail: status })
      );
    }
  }

  public getCurrentStatus(
    overrideState?: SyncState,
    errorMessage?: string,
    overridePending?: number
  ): CloudSyncStatus {
    let state: SyncState = overrideState || 'synced';

    if (!isFirebaseConfigured()) {
      state = 'unconfigured';
    } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
      state = 'offline';
    } else if (this.isSyncing) {
      state = 'syncing';
    }

    const lastSyncAt =
      typeof window !== 'undefined'
        ? localStorage.getItem(LAST_SYNC_KEY)
        : null;

    return {
      state,
      pendingSales: overridePending ?? 0,
      lastSyncAt,
      storeId: this.currentStoreId,
      errorMessage,
    };
  }

  /**
   * Sincroniza todas las ventas pendientes de la base de datos local hacia Firestore
   */
  public async syncPendingSales(): Promise<{ syncedCount: number; errors: number }> {
    if (!isFirebaseConfigured()) {
      return { syncedCount: 0, errors: 0 };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.notifyStatus('offline');
      return { syncedCount: 0, errors: 0 };
    }

    try {
      // 1. Buscar ventas que aún no tengan marca de sincronización
      const allSales = await localDb.sales.toArray();
      const unsyncedSales = allSales.filter((s: any) => !s.synced);

      if (unsyncedSales.length === 0) {
        return { syncedCount: 0, errors: 0 };
      }

      this.notifyStatus('syncing', undefined, unsyncedSales.length);

      const batchSize = 100;
      let totalSynced = 0;

      for (let i = 0; i < unsyncedSales.length; i += batchSize) {
        const chunk = unsyncedSales.slice(i, i + batchSize);
        const batch = writeBatch(firestoreDb);

        for (const sale of chunk) {
          const docId = sale.receiptNumber || `SALE-${sale.id}-${Date.now()}`;
          const saleRef = doc(
            firestoreDb,
            `stores/${this.currentStoreId}/sales`,
            docId
          );

          batch.set(
            saleRef,
            {
              id: docId,
              storeId: this.currentStoreId,
              receiptNumber: sale.receiptNumber,
              timestamp: sale.timestamp,
              items: sale.items || [],
              subtotalUSD: sale.subtotalUSD || 0,
              taxUSD: sale.taxUSD || 0,
              totalUSD: sale.totalUSD || 0,
              totalVES: sale.totalVES || 0,
              bcvRate: sale.bcvRate || 1,
              payments: sale.payments || [],
              cashierName: sale.cashierName || 'Caja 1',
              customerDoc: sale.customerDoc || '',
              customerName: sale.customerName || 'Cliente General',
              status: sale.status || 'completed',
              source: sale.source || 'desktop_pos',
              syncedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        await batch.commit();

        // 2. Marcar las ventas locales como sincronizadas
        for (const sale of chunk) {
          if (sale.id) {
            await localDb.sales.update(sale.id, { synced: true } as any);
          }
        }

        totalSynced += chunk.length;
      }

      const now = new Date().toISOString();
      if (typeof window !== 'undefined') {
        localStorage.setItem(LAST_SYNC_KEY, now);
      }

      this.notifyStatus('synced', undefined, 0);
      return { syncedCount: totalSynced, errors: 0 };
    } catch (error: any) {
      console.error('[CloudSync] Error sincronizando ventas a Firestore:', error);
      this.notifyStatus('error', error?.message || 'Error en sincronización');
      return { syncedCount: 0, errors: 1 };
    }
  }

  /**
   * Sube el inventario local a Firestore (para alimentar la tienda web y la app móvil)
   */
  public async pushProductsToCloud(): Promise<number> {
    if (!isFirebaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return 0;
    }

    try {
      const localProducts = await localDb.products.toArray();
      if (localProducts.length === 0) return 0;

      const batchSize = 150;
      let uploaded = 0;

      for (let i = 0; i < localProducts.length; i += batchSize) {
        const chunk = localProducts.slice(i, i + batchSize);
        const batch = writeBatch(firestoreDb);

        for (const prod of chunk) {
          const docId = prod.barcode || `PROD-${prod.id}`;
          const prodRef = doc(
            firestoreDb,
            `stores/${this.currentStoreId}/products`,
            docId
          );

          batch.set(
            prodRef,
            {
              id: docId,
              storeId: this.currentStoreId,
              barcode: prod.barcode,
              name: prod.name,
              category: prod.category || 'General',
              priceUSD: prod.priceUSD || 0,
              costUSD: prod.costUSD || 0,
              stock: prod.stock || 0,
              minStock: prod.minStock || 0,
              unit: prod.unit || 'UND',
              image: prod.image || '',
              updatedAt: prod.updatedAt || new Date().toISOString(),
              isActive: true,
            },
            { merge: true }
          );
        }

        await batch.commit();
        uploaded += chunk.length;
      }

      return uploaded;
    } catch (error) {
      console.error('[CloudSync] Error subiendo productos a Firestore:', error);
      return 0;
    }
  }

  /**
   * Descarga productos creados o editados en la nube hacia la base de datos local
   */
  public async pullProductsFromCloud(): Promise<number> {
    if (!isFirebaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return 0;
    }

    try {
      const colRef = collection(firestoreDb, `stores/${this.currentStoreId}/products`);
      const snapshot = await getDocs(colRef);

      if (snapshot.empty) return 0;

      let count = 0;
      for (const docSnap of snapshot.docs) {
        const cloudProd = docSnap.data();
        if (!cloudProd.barcode && !cloudProd.name) continue;

        const existing = await localDb.products
          .where('barcode')
          .equals(cloudProd.barcode)
          .first();

        if (existing) {
          // Si el producto existe localmente, actualizamos precio y stock
          if (existing.id) {
            await localDb.products.update(existing.id, {
              name: cloudProd.name || existing.name,
              priceUSD: cloudProd.priceUSD ?? existing.priceUSD,
              stock: cloudProd.stock ?? existing.stock,
              category: cloudProd.category || existing.category,
              updatedAt: new Date().toISOString(),
            });
            count++;
          }
        } else {
          // Producto nuevo creado en la web -> Agregar a local
          await localDb.products.add({
            barcode: cloudProd.barcode,
            name: cloudProd.name,
            category: cloudProd.category || 'General',
            priceUSD: cloudProd.priceUSD || 0,
            costUSD: cloudProd.costUSD || 0,
            stock: cloudProd.stock || 0,
            minStock: cloudProd.minStock || 0,
            unit: cloudProd.unit || 'UND',
            image: cloudProd.image || '',
            updatedAt: new Date().toISOString(),
          });
          count++;
        }
      }

      return count;
    } catch (error) {
      console.error('[CloudSync] Error descargando productos de Firestore:', error);
      return 0;
    }
  }

  /**
   * Ejecuta una sincronización bidireccional completa
   */
  public async syncAll(): Promise<{ sales: number; productsUploaded: number; productsPulled: number }> {
    if (this.isSyncing) {
      return { sales: 0, productsUploaded: 0, productsPulled: 0 };
    }

    this.isSyncing = true;
    try {
      const salesResult = await this.syncPendingSales();
      const productsUploaded = await this.pushProductsToCloud();
      const productsPulled = await this.pullProductsFromCloud();

      return {
        sales: salesResult.syncedCount,
        productsUploaded,
        productsPulled,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Inicia el ciclo periódico de sincronización automática en segundo plano
   */
  public startAutoSync(intervalSeconds: number = 45) {
    if (this.autoSyncTimer) return;

    // Ejecutar sincronización inicial inmediata
    this.syncAll();

    this.autoSyncTimer = setInterval(() => {
      this.syncAll();
    }, intervalSeconds * 1000);
  }

  public stopAutoSync() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }
}

export const cloudSyncService = new CloudSyncService();
