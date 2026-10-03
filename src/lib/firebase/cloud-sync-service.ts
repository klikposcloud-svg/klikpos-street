import {
  collection,
  doc,
  setDoc,
  getDoc,
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
      const savedHwid = localStorage.getItem('klikpos_terminal_hwid') || localStorage.getItem('venematic_terminal_hwid') || localStorage.getItem('venematic_store_id');
      if (savedHwid) {
        this.currentStoreId = savedHwid;
      }
      this.initListeners();
    }
  }

  public setStoreId(storeId: string) {
    this.currentStoreId = storeId || DEFAULT_STORE_ID;
  }

  public getStoreId(): string {
    if (typeof window !== 'undefined') {
      const savedHwid = localStorage.getItem('klikpos_terminal_hwid') || localStorage.getItem('venematic_terminal_hwid') || localStorage.getItem('venematic_store_id');
      if (savedHwid) {
        this.currentStoreId = savedHwid;
      }
    }
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
      storeId: this.getStoreId(),
      errorMessage,
    };
  }

  /**
   * Obtiene la tasa oficial BCV desde Firestore según el esquema canónico de KlikPOS (bcv_rates/latest)
   */
  public async fetchLatestBcvRate(): Promise<{ rate: number; source: string; updatedAt: string } | null> {
    if (!isFirebaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return null;
    }
    try {
      // 1. Probar colección canónica matriz de KlikPOS: bcv_rates/latest
      const bcvDoc = await getDoc(doc(firestoreDb, 'bcv_rates', 'latest'));
      if (bcvDoc.exists()) {
        const data = bcvDoc.data();
        const rate = Number(data?.rate);
        if (rate && rate > 0) {
          return {
            rate,
            source: data?.source || 'BCV Oficial (Firestore bcv_rates)',
            updatedAt: data?.updatedAt || new Date().toISOString()
          };
        }
      }

      // 2. Fallback de compatibilidad: system_config/bcv_rate
      const legacyDoc = await getDoc(doc(firestoreDb, 'system_config', 'bcv_rate'));
      if (legacyDoc.exists()) {
        const data = legacyDoc.data();
        const rate = Number(data?.rate);
        if (rate && rate > 0) {
          return {
            rate,
            source: data?.source || 'BCV Oficial (Firestore system_config)',
            updatedAt: data?.updatedAt || new Date().toISOString()
          };
        }
      }
    } catch (e) {
      console.warn('[CloudSync] Error leyendo tasa BCV desde Firestore:', e);
    }
    return null;
  }

  /**
   * Publica la tasa oficial BCV en Firestore bajo el esquema canónico de KlikPOS (bcv_rates/latest)
   */
  public async pushBcvRate(rate: number, source: string = 'Banco Central de Venezuela (BCV Oficial)'): Promise<boolean> {
    if (!isFirebaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine) || !rate || rate <= 0) {
      return false;
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = {
        id: 'latest',
        rate: Number(rate),
        date: today,
        source: source,
        updatedAt: new Date().toISOString(),
        updatedTimestamp: Date.now()
      };

      // 1. Colección canónica matriz
      await setDoc(doc(firestoreDb, 'bcv_rates', 'latest'), payload, { merge: true });
      await setDoc(doc(firestoreDb, 'bcv_rates', today), payload, { merge: true });

      // 2. Reflejo para compatibilidad histórica
      await setDoc(doc(firestoreDb, 'system_config', 'bcv_rate'), payload, { merge: true });

      return true;
    } catch (e) {
      console.warn('[CloudSync] Error guardando tasa BCV en Firestore:', e);
      return false;
    }
  }

  /**
   * Publica el resumen de totales y la tasa oficial BCV a Firestore
   */
  public async pushSummaryToCloud(customBcvRate?: number): Promise<boolean> {
    if (!isFirebaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return false;
    }

    try {
      const storeId = this.getStoreId();
      const allSales = await localDb.sales.toArray();
      let currentBcv = customBcvRate;
      if (!currentBcv || currentBcv <= 0) {
        const bcvSetting = await localDb.settings.get('bcv_rate');
        currentBcv = bcvSetting?.value || 1;
      }

      const bcvVal = Number(currentBcv) || 1;
      let totalUSD = 0;
      let totalVES = 0;
      allSales.forEach((s: any) => {
        const u = Number(s?.totalUSD) || 0;
        totalUSD += u;
        const sRate = Number(s?.bcvRate) || bcvVal;
        totalVES += Number(s?.totalVES) || (u * sRate);
      });

      const summaryRef = doc(firestoreDb, `stores/${storeId}/summary`, 'latest');
      await setDoc(
        summaryRef,
        {
          storeId: storeId,
          totalUSD: Number(totalUSD.toFixed(2)),
          totalVES: Number(totalVES.toFixed(2)),
          bcvRate: Number(currentBcv),
          salesCount: allSales.length,
          lastSaleAt: allSales.length > 0 ? allSales[allSales.length - 1].timestamp : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: 'desktop_pos',
          terminalName: 'Caja Principal'
        },
        { merge: true }
      );

      return true;
    } catch (err) {
      console.error('[CloudSync] Error actualizando resumen en Firestore:', err);
      return false;
    }
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

      const storeId = this.getStoreId();
      for (let i = 0; i < unsyncedSales.length; i += batchSize) {
        const chunk = unsyncedSales.slice(i, i + batchSize);
        const batch = writeBatch(firestoreDb);

        for (const sale of chunk) {
          const docId = sale.receiptNumber || `SALE-${sale.id}-${Date.now()}`;
          const saleRef = doc(
            firestoreDb,
            `stores/${storeId}/sales`,
            docId
          );

          batch.set(
            saleRef,
            {
              id: docId,
              storeId: storeId,
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

      // 3. Actualizar resumen y tasa BCV en Firestore
      await this.pushSummaryToCloud();

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
      const storeId = this.getStoreId();
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
            `stores/${storeId}/products`,
            docId
          );

          batch.set(
            prodRef,
            {
              id: docId,
              storeId: storeId,
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
      const storeId = this.getStoreId();
      const colRef = collection(firestoreDb, `stores/${storeId}/products`);
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
   * Sube los turnos y arqueos de caja a Firestore (para que el dueño los vea en KlikAdmin.apk en tiempo real)
   */
  public async pushShiftsToCloud(): Promise<number> {
    if (!isFirebaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return 0;
    }

    try {
      const storeId = this.getStoreId();
      const localShifts = await localDb.cashShifts.toArray();
      if (localShifts.length === 0) return 0;

      const batchSize = 50;
      let uploaded = 0;

      for (let i = 0; i < localShifts.length; i += batchSize) {
        const chunk = localShifts.slice(i, i + batchSize);
        const batch = writeBatch(firestoreDb);

        for (const shift of chunk) {
          const docId = `SHIFT-${shift.id || shift.openedAt}`;
          const shiftRef = doc(firestoreDb, `stores/${storeId}/shifts`, docId);

          batch.set(
            shiftRef,
            {
              id: docId,
              storeId: storeId,
              openedAt: shift.openedAt,
              closedAt: shift.closedAt || null,
              cashierName: shift.cashierName,
              initialCashUSD: shift.initialCashUSD || 0,
              initialCashVES: shift.initialCashVES || 0,
              totalSalesUSD: shift.totalSalesUSD || 0,
              totalCashUSD: shift.totalCashUSD || 0,
              totalCashVES: shift.totalCashVES || 0,
              totalPagoMovilVES: shift.totalPagoMovilVES || 0,
              totalCardVES: shift.totalCardVES || 0,
              totalZelleUSD: shift.totalZelleUSD || 0,
              actualCashUSD: shift.actualCashUSD || 0,
              actualCashVES: shift.actualCashVES || 0,
              differenceUSD: shift.differenceUSD || 0,
              differenceVES: shift.differenceVES || 0,
              status: shift.status || 'open',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }

        await batch.commit();
        uploaded += chunk.length;
      }

      return uploaded;
    } catch (error) {
      console.error('[CloudSync] Error subiendo turnos a Firestore:', error);
      return 0;
    }
  }

  /**
   * Registra el usuario, la versión del aplicativo y la configuración inicial en Firestore
   * al activarse la licencia oficial o de prueba.
   */
  public async registerUserLicenseAndConfig(params: {
    hwid: string;
    rif: string;
    storeName?: string;
    productKey?: string;
    appVersion?: string;
    plan?: string;
    initialConfig?: any;
  }): Promise<{ success: boolean; message: string }> {
    if (!isFirebaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      console.warn('[CloudSync] Firestore no disponible u offline. Se guardará localmente.');
      return { success: false, message: 'Offline: Guardado solo localmente.' };
    }

    try {
      const cleanRif = (params.rif || 'STREET').trim().toUpperCase();
      const cleanHwid = (params.hwid || this.getStoreId()).trim().toUpperCase();
      const storeId = cleanHwid;

      // 1. Recopilar configuración del negocio activa
      let localStoreInfo: any = {};
      let localCompanyInfo: any = {};
      let localPagoMovil: any = {};
      if (typeof window !== 'undefined') {
        try {
          const rawStore = localStorage.getItem('venematic_store_info');
          if (rawStore) localStoreInfo = JSON.parse(rawStore);
          const rawCompany = localStorage.getItem('klikpos_company_info');
          if (rawCompany) localCompanyInfo = JSON.parse(rawCompany);
          const rawPm = localStorage.getItem('klikpos_pago_movil');
          if (rawPm) localPagoMovil = JSON.parse(rawPm);
        } catch {}
      }

      const mergedConfig = {
        storeName: params.storeName || localCompanyInfo.name || localStoreInfo.name || 'Mi Negocio',
        rif: cleanRif,
        phone: localCompanyInfo.phone || localStoreInfo.phone || '',
        address: localCompanyInfo.address || localStoreInfo.address || '',
        pagoMovil: localPagoMovil,
        appVersion: params.appVersion || 'KlikPOS Street v1.0',
        plan: params.plan || 'vitalicia',
        currency: 'USD/VES',
        ...params.initialConfig,
      };

      // 2. Registrar en la colección `users` indexado por HWID y RIF
      const userRef = doc(firestoreDb, 'users', cleanHwid);
      const payload = {
        uid: cleanHwid,
        hwid: cleanHwid,
        rif: cleanRif,
        storeName: mergedConfig.storeName,
        productKey: params.productKey || 'DEMO-TRIAL',
        appVersion: params.appVersion || 'KlikPOS Street v1.0',
        plan: params.plan || 'vitalicia',
        status: 'active',
        activatedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
        initialConfig: mergedConfig,
        currentConfig: mergedConfig,
      };

      await setDoc(userRef, payload, { merge: true });

      // 3. Registrar también en la configuración central de la tienda
      const configRef = doc(firestoreDb, `stores/${storeId}/config`, 'initial_settings');
      await setDoc(configRef, { ...payload, updatedAt: new Date().toISOString() }, { merge: true });

      console.log(`[CloudSync] ✅ Usuario y configuración inicial respaldados con éxito en Firestore (HWID: ${cleanHwid}, RIF: ${cleanRif})`);
      return { success: true, message: 'Usuario y configuración respaldados en la nube exitosamente.' };
    } catch (err: any) {
      console.error('[CloudSync] Error registrando usuario en Firestore:', err);
      return { success: false, message: err?.message || 'Error al conectar con Firestore.' };
    }
  }

  /**
   * Recupera la configuración inicial y datos de un negocio desde Firestore
   * mediante RIF o Clave de Producto (para casos de pérdida de teléfono o reinstalación en blanco).
   */
  public async restoreUserAndConfig(queryKey: string): Promise<{
    success: boolean;
    config?: any;
    message: string;
  }> {
    if (!isFirebaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return { success: false, message: 'Se requiere conexión a internet para restaurar el respaldo de la nube.' };
    }

    try {
      const cleanKey = queryKey.trim().toUpperCase();
      console.log(`[CloudSync] Buscando respaldo en Firestore para: ${cleanKey}...`);

      // Intentar buscar por HWID directo
      let userDocRef = doc(firestoreDb, 'users', cleanKey);
      let snapshot = await getDocs(query(collection(firestoreDb, 'users'), where('rif', '==', cleanKey), limit(1)));
      
      let userData: any = null;
      if (!snapshot.empty) {
        userData = snapshot.docs[0].data();
      } else {
        // Buscar por productKey
        const keySnapshot = await getDocs(query(collection(firestoreDb, 'users'), where('productKey', '==', cleanKey), limit(1)));
        if (!keySnapshot.empty) {
          userData = keySnapshot.docs[0].data();
        }
      }

      if (!userData) {
        return { success: false, message: 'No se encontró ningún negocio registrado con ese RIF o Clave en la nube.' };
      }

      const restoredConfig = userData.currentConfig || userData.initialConfig;

      // Restaurar localmente en el navegador / terminal
      if (typeof window !== 'undefined' && restoredConfig) {
        if (restoredConfig.storeName || restoredConfig.rif) {
          const storeInfo = {
            name: restoredConfig.storeName,
            rif: restoredConfig.rif,
            phone: restoredConfig.phone || '',
            address: restoredConfig.address || '',
          };
          localStorage.setItem('venematic_store_info', JSON.stringify(storeInfo));
          localStorage.setItem('klikpos_company_info', JSON.stringify(storeInfo));
          if (restoredConfig.pagoMovil) {
            localStorage.setItem('klikpos_pago_movil', JSON.stringify(restoredConfig.pagoMovil));
          }
        }
      }

      // Descargar productos de ese comercio
      const oldStoreId = userData.hwid || userData.uid;
      if (oldStoreId) {
        this.setStoreId(oldStoreId);
        await this.pullProductsFromCloud();
      }

      return {
        success: true,
        config: restoredConfig,
        message: `¡Negocio "${restoredConfig?.storeName || 'Comercio'}" restaurado exitosamente desde la nube!`
      };
    } catch (err: any) {
      console.error('[CloudSync] Error restaurando desde Firestore:', err);
      return { success: false, message: err?.message || 'Error al restaurar desde Firestore.' };
    }
  }

  /**
   * Ejecuta una sincronización bidireccional completa en segundo plano
   */
  public async syncAll(): Promise<{ sales: number; productsUploaded: number; productsPulled: number; shiftsUploaded: number }> {
    if (this.isSyncing) {
      return { sales: 0, productsUploaded: 0, productsPulled: 0, shiftsUploaded: 0 };
    }

    this.isSyncing = true;
    try {
      const salesResult = await this.syncPendingSales();
      const productsUploaded = await this.pushProductsToCloud();
      const productsPulled = await this.pullProductsFromCloud();
      const shiftsUploaded = await this.pushShiftsToCloud();
      await this.pushSummaryToCloud();

      return {
        sales: salesResult.syncedCount,
        productsUploaded,
        productsPulled,
        shiftsUploaded,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Disparo no bloqueante inmediato en segundo plano tras una venta o cambio
   */
  public triggerFastSync() {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      this.syncPendingSales().catch(() => {});
      this.pushSummaryToCloud().catch(() => {});
      this.pushProductsToCloud().catch(() => {});
      this.pushShiftsToCloud().catch(() => {});
    }, 100);
  }

  /**
   * Inicia el ciclo periódico de sincronización automática en segundo plano (Auto-Sync cada 1 Hora por defecto)
   */
  public startAutoSync(intervalSeconds: number = 3600) {
    if (this.autoSyncTimer) return;

    console.log(`[CloudSync] ⏱️ Iniciando Auto-Sincronización en segundo plano (Intervalo: ${intervalSeconds}s = ${Math.round(intervalSeconds / 60)} min)...`);

    // Sincronización inicial en diferido (5 segundos tras arranque para no retrasar la UI)
    setTimeout(() => {
      this.syncAll().catch(() => {});
    }, 5000);

    this.autoSyncTimer = setInterval(() => {
      console.log('[CloudSync] 🔄 Ejecutando ciclo de sincronización automática periódica (1 Hora)...');
      this.syncAll().catch(() => {});
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
