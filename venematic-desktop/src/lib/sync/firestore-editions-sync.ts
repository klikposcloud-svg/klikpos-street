/**
 * ============================================================================
 * KLIKPOS ENTERPRISE - LIBRERÍA MULTIVERSIÓN DE SINCRONIZACIÓN FIRESTORE
 * ============================================================================
 * Categorización oficial de colecciones en Firestore por Edición, Comercio y Licencia:
 * 
 * Ruta jerárquica obligatoria:
 *   klikpos_ediciones / {edicion} / comercios / {comercioId} / licencias / {licenciaKey} / {coleccion}
 * 
 * Ediciones soportadas:
 *   1. satelite_pc          -> KlikPOS Móvil Satélite PC (Contingencia sin luz / Escáner)
 *   2. desktop_pc_full      -> KlikPOS Desktop Empresarial PC (Windows POS con balanza y servidor local)
 *   3. tablet_standalone    -> KlikPOS Tablet / Móvil Standalone (Restaurantes / Mesas sin PC)
 *   4. movil_full_autonomo  -> KlikPOS Móvil Full Autónomo (Retail Nube autónomo sin PC)
 *   5. movil_full_pc        -> KlikPOS Móvil Full para PC (Companion completo enlazado a PC)
 * ============================================================================
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db as firestoreDb, isFirebaseConfigured } from '@/lib/firebase/config';

export type KlikposEditionType = 
  | 'satelite_pc'
  | 'desktop_pc_full'
  | 'tablet_standalone'
  | 'movil_full_autonomo'
  | 'movil_full_pc';

export interface EditionMetadata {
  edition: KlikposEditionType;
  displayName: string;
  category: 'PC_COMPLEMENT' | 'DESKTOP_CORE' | 'STANDALONE_HORECA' | 'STANDALONE_RETAIL';
  primaryActionButton: 'SCANNER' | 'CHECKOUT';
  requiresPCServer: boolean;
  cloudSyncEnabled: boolean;
}

export const KLIKPOS_EDITIONS_REGISTRY: Record<KlikposEditionType, EditionMetadata> = {
  satelite_pc: {
    edition: 'satelite_pc',
    displayName: 'KlikPOS Móvil Satélite PC (Contingencia)',
    category: 'PC_COMPLEMENT',
    primaryActionButton: 'SCANNER',
    requiresPCServer: true,
    cloudSyncEnabled: true,
  },
  desktop_pc_full: {
    edition: 'desktop_pc_full',
    displayName: 'KlikPOS Desktop Empresarial Full PC',
    category: 'DESKTOP_CORE',
    primaryActionButton: 'CHECKOUT',
    requiresPCServer: false,
    cloudSyncEnabled: true,
  },
  tablet_standalone: {
    edition: 'tablet_standalone',
    displayName: 'KlikPOS Tablet / Móvil Standalone (Mesas & Comandas)',
    category: 'STANDALONE_HORECA',
    primaryActionButton: 'CHECKOUT',
    requiresPCServer: false,
    cloudSyncEnabled: true,
  },
  movil_full_autonomo: {
    edition: 'movil_full_autonomo',
    displayName: 'KlikPOS Móvil Full Autónomo (Retail Nube)',
    category: 'STANDALONE_RETAIL',
    primaryActionButton: 'SCANNER',
    requiresPCServer: false,
    cloudSyncEnabled: true,
  },
  movil_full_pc: {
    edition: 'movil_full_pc',
    displayName: 'KlikPOS Móvil Full para PC (Companion)',
    category: 'PC_COMPLEMENT',
    primaryActionButton: 'SCANNER',
    requiresPCServer: true,
    cloudSyncEnabled: true,
  }
};

export interface SyncProductItem {
  id: string;
  barcode: string;
  name: string;
  category: string;
  priceUSD: number;
  costUSD?: number;
  stock: number;
  minStock?: number;
  unit?: string;
  image?: string;
  ingredients?: string[];
  prepTime?: string;
  isActive?: boolean;
  updatedAt?: string;
}

export interface SyncSaleItem {
  id: string;
  receiptNumber: string;
  timestamp: string;
  items: any[];
  subtotalUSD: number;
  taxUSD?: number;
  totalUSD: number;
  totalVES: number;
  bcvRate: number;
  payments: any[];
  cashierName?: string;
  customerDoc?: string;
  customerName?: string;
  table?: string;
  status: string;
}

export interface SyncCompanyConfig {
  name: string;
  rif: string;
  phone: string;
  address: string;
  footerMsg?: string;
  pagoMovil?: {
    bank: string;
    phone: string;
    idDoc: string;
    ownerName: string;
  };
}

export interface SyncRateBCV {
  rate: number;
  lastUpdated: string;
  source: string;
}

export interface SyncVersionCheck {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  downloadUrl?: string;
  changelog?: string;
}

/**
 * Motor Base de Sincronización Categorizado por Edición, Comercio y Licencia
 */
export abstract class KlikposEditionBaseSync {
  public readonly edition: KlikposEditionType;
  public readonly metadata: EditionMetadata;
  protected comercioId: string;
  protected licenciaKey: string;

  constructor(edition: KlikposEditionType, comercioId: string = 'demo_comercio', licenciaKey: string = 'KLIK-DEMO-001') {
    this.edition = edition;
    this.metadata = KLIKPOS_EDITIONS_REGISTRY[edition];
    this.comercioId = comercioId;
    this.licenciaKey = licenciaKey;
  }

  public setCredentials(comercioId: string, licenciaKey: string) {
    this.comercioId = comercioId || 'demo_comercio';
    this.licenciaKey = licenciaKey || 'KLIK-DEMO-001';
  }

  public getBasePath(): string {
    return `klikpos_ediciones/${this.edition}/comercios/${this.comercioId}/licencias/${this.licenciaKey}`;
  }

  /**
   * Actualización automática de la tasa BCV oficial
   * Consulta APIs en vivo (DolarAPI / Fallbacks) y sincroniza a Firestore
   */
  public async fetchAndSyncBcvRate(): Promise<SyncRateBCV> {
    let rate = 848.55;
    let source = 'offline_default';

    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const apiRate = data.promedio || data.precio;
        if (typeof apiRate === 'number' && apiRate > 0) {
          rate = apiRate;
          source = 'BCV Oficial (DolarAPI)';
        }
      }
    } catch (e) {
      console.warn(`[${this.edition}] Falló DolarAPI, intentando fallback...`, e);
      try {
        const res2 = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv', { cache: 'no-store' });
        if (res2.ok) {
          const data2 = await res2.json();
          const apiRate2 = data2?.monitors?.usd?.price;
          if (typeof apiRate2 === 'number' && apiRate2 > 0) {
            rate = apiRate2;
            source = 'BCV Oficial (PyDolar)';
          }
        }
      } catch (errFallback) {
        console.warn(`[${this.edition}] Falló fallback BCV. Usando tasa guardada en caché.`, errFallback);
      }
    }

    const rateData: SyncRateBCV = {
      rate,
      lastUpdated: new Date().toISOString(),
      source,
    };

    // Guardar en LocalStorage para acceso offline instantáneo
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('klikpos_bcv_rate', String(rate));
        localStorage.setItem('klikpos_bcv_source', source);
        localStorage.setItem('klikpos_bcv_updated', rateData.lastUpdated);
      } catch {}
    }

    // Sincronizar en Firestore bajo la jerarquía de la edición
    if (isFirebaseConfigured()) {
      try {
        const rateDocRef = doc(firestoreDb, `${this.getBasePath()}/tasas_bcv/current`);
        await setDoc(rateDocRef, {
          ...rateData,
          serverTimestamp: serverTimestamp(),
          edition: this.edition,
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn(`[${this.edition}] No se pudo subir tasa a Firestore:`, firestoreErr);
      }
    }

    return rateData;
  }

  /**
   * Sincroniza un lote de productos al catálogo clasificado de esta edición
   */
  public async syncProducts(products: SyncProductItem[]): Promise<number> {
    if (!isFirebaseConfigured() || products.length === 0) return 0;

    try {
      const batchSize = 100;
      let count = 0;

      for (let i = 0; i < products.length; i += batchSize) {
        const chunk = products.slice(i, i + batchSize);
        const batch = writeBatch(firestoreDb);

        for (const p of chunk) {
          const docId = p.barcode || p.id;
          const ref = doc(firestoreDb, `${this.getBasePath()}/productos/${docId}`);
          batch.set(ref, {
            ...p,
            edition: this.edition,
            comercioId: this.comercioId,
            licenciaKey: this.licenciaKey,
            syncedAt: serverTimestamp(),
          }, { merge: true });
        }

        await batch.commit();
        count += chunk.length;
      }

      return count;
    } catch (err) {
      console.error(`[${this.edition}] Error sincronizando productos:`, err);
      return 0;
    }
  }

  /**
   * Sincroniza ventas realizadas a la colección categorizada de esta edición
   */
  public async syncSale(sale: SyncSaleItem): Promise<boolean> {
    if (!isFirebaseConfigured()) return false;

    try {
      const docId = sale.receiptNumber || sale.id;
      const ref = doc(firestoreDb, `${this.getBasePath()}/ventas/${docId}`);
      await setDoc(ref, {
        ...sale,
        edition: this.edition,
        comercioId: this.comercioId,
        licenciaKey: this.licenciaKey,
        syncedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (err) {
      console.error(`[${this.edition}] Error sincronizando venta:`, err);
      return false;
    }
  }

  /**
   * Sincroniza la configuración de la empresa y Pago Móvil
   */
  public async syncCompanyConfig(config: SyncCompanyConfig): Promise<boolean> {
    if (!isFirebaseConfigured()) return false;

    try {
      const ref = doc(firestoreDb, `${this.getBasePath()}/configuracion/empresa`);
      await setDoc(ref, {
        ...config,
        edition: this.edition,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (err) {
      console.error(`[${this.edition}] Error guardando configuración:`, err);
      return false;
    }
  }

  /**
   * Consulta de Actualizaciones del Sistema
   */
  public async checkForUpdates(currentVersion: string = '2.4.7'): Promise<SyncVersionCheck> {
    try {
      const res = await fetch('/version.json', { cache: 'no-store' });
      if (res.ok) {
        const manifest = await res.json();
        const latest = manifest.version || currentVersion;
        return {
          currentVersion,
          latestVersion: latest,
          hasUpdate: latest !== currentVersion,
          downloadUrl: manifest.downloadUrl || manifest.download_url,
          changelog: manifest.changelog || 'Mejoras de rendimiento y estabilidad.'
        };
      }
    } catch {}

    return {
      currentVersion,
      latestVersion: currentVersion,
      hasUpdate: false
    };
  }
}

// ============================================================================
// CLASES ESPECÍFICAS POR EDICIÓN DE KLIKPOS
// ============================================================================

/**
 * 1. KlikPOS Móvil Satélite PC (Contingencia sin luz / Escáner de apoyo)
 */
export class KlikposSateliteSync extends KlikposEditionBaseSync {
  constructor(comercioId?: string, licenciaKey?: string) {
    super('satelite_pc', comercioId, licenciaKey);
  }

  public async fetchContingencyCatalog(): Promise<SyncProductItem[]> {
    if (!isFirebaseConfigured()) return [];
    try {
      const q = query(
        collection(firestoreDb, `${this.getBasePath()}/productos`),
        orderBy('name'),
        limit(500)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as SyncProductItem);
    } catch (err) {
      console.warn('[KlikposSateliteSync] Error cargando catálogo de contingencia:', err);
      return [];
    }
  }
}

/**
 * 2. KlikPOS Desktop Empresarial PC (Instalador Full Windows)
 */
export class KlikposDesktopSync extends KlikposEditionBaseSync {
  constructor(comercioId?: string, licenciaKey?: string) {
    super('desktop_pc_full', comercioId, licenciaKey);
  }

  public async broadcastCatalogToSatellites(products: SyncProductItem[]): Promise<number> {
    return this.syncProducts(products);
  }
}

/**
 * 3. KlikPOS Tablet / Móvil Standalone (Restaurantes, Mesas, Comandas sin PC)
 */
export class KlikposTabletStandaloneSync extends KlikposEditionBaseSync {
  constructor(comercioId?: string, licenciaKey?: string) {
    super('tablet_standalone', comercioId, licenciaKey);
  }

  public async syncDiningSpots(spots: any[]): Promise<boolean> {
    if (!isFirebaseConfigured()) return false;
    try {
      const ref = doc(firestoreDb, `${this.getBasePath()}/comandas/mesas_activas`);
      await setDoc(ref, {
        spots,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 4. KlikPOS Móvil Full Autónomo (Retail Nube autónomo sin PC)
 */
export class KlikposMovilFullAutonomoSync extends KlikposEditionBaseSync {
  constructor(comercioId?: string, licenciaKey?: string) {
    super('movil_full_autonomo', comercioId, licenciaKey);
  }

  public async syncInventoryMovements(barcode: string, stockDelta: number): Promise<boolean> {
    if (!isFirebaseConfigured()) return false;
    try {
      const ref = doc(firestoreDb, `${this.getBasePath()}/productos/${barcode}`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const currentStock = snap.data().stock || 0;
        await setDoc(ref, { stock: Math.max(0, currentStock + stockDelta), updatedAt: new Date().toISOString() }, { merge: true });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

/**
 * 5. KlikPOS Móvil Full para PC (Companion completo enlazado a PC)
 */
export class KlikposMovilFullPCSync extends KlikposEditionBaseSync {
  private pcServerUrl: string = 'http://192.168.1.100:3000';

  constructor(comercioId?: string, licenciaKey?: string, pcServerUrl?: string) {
    super('movil_full_pc', comercioId, licenciaKey);
    if (pcServerUrl) this.pcServerUrl = pcServerUrl;
  }

  public setPCServerUrl(url: string) {
    this.pcServerUrl = url;
  }

  public getPCServerUrl(): string {
    return this.pcServerUrl;
  }
}

/**
 * Factoría para instanciar la clase de sincronización correspondiente a cada edición
 */
export function getEditionSyncService(
  edition: KlikposEditionType,
  comercioId: string = 'demo_comercio',
  licenciaKey: string = 'KLIK-DEMO-001'
): KlikposEditionBaseSync {
  switch (edition) {
    case 'satelite_pc':
      return new KlikposSateliteSync(comercioId, licenciaKey);
    case 'desktop_pc_full':
      return new KlikposDesktopSync(comercioId, licenciaKey);
    case 'tablet_standalone':
      return new KlikposTabletStandaloneSync(comercioId, licenciaKey);
    case 'movil_full_autonomo':
      return new KlikposMovilFullAutonomoSync(comercioId, licenciaKey);
    case 'movil_full_pc':
      return new KlikposMovilFullPCSync(comercioId, licenciaKey);
    default:
      return new KlikposMovilFullAutonomoSync(comercioId, licenciaKey);
  }
}
