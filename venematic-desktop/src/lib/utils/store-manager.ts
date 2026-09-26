import { venematicDB } from '@/lib/indexeddb/db';
import { BUSINESS_RUBROS, type BusinessType } from '@/lib/utils/business-rubros';

export interface RegisteredStore {
  id: string;
  name: string;
  rif?: string;
  address?: string;
  phone?: string;
  businessType: BusinessType;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_STORES: RegisteredStore[] = [
  {
    id: 'default_store',
    name: 'Venemarket Supermercado',
    rif: 'J-40123456-7',
    address: 'Av. Principal, Local 1',
    phone: '0212-5551234',
    businessType: 'supermarket',
    icon: '🛒',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'store_bookstore',
    name: 'Librería & Papelería Central',
    rif: 'J-40987654-3',
    address: 'C.C. Metrópolis, Nivel 2',
    phone: '0212-5559876',
    businessType: 'bookstore',
    icon: '📚',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'store_accessories',
    name: 'Boutique & Accesorios Moda',
    rif: 'J-41122334-5',
    address: 'Calle del Comercio, Local 4',
    phone: '0412-8889900',
    businessType: 'accessories',
    icon: '💍',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

type StoreChangeListener = (store: RegisteredStore) => void;

class StoreManager {
  private listeners: StoreChangeListener[] = [];

  // Obtener todas las tiendas registradas
  async getAllStores(): Promise<RegisteredStore[]> {
    if (typeof window === 'undefined') return DEFAULT_STORES;
    const raw = localStorage.getItem('venematic_registered_stores');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Error reading stores:', e);
      }
    }
    // Guardar por defecto
    localStorage.setItem('venematic_registered_stores', JSON.stringify(DEFAULT_STORES));
    return DEFAULT_STORES;
  }

  // Obtener la tienda actualmente activa
  async getActiveStore(): Promise<RegisteredStore> {
    const stores = await this.getAllStores();
    if (typeof window === 'undefined') return stores[0];

    const activeId = localStorage.getItem('venematic_active_store_id');
    const found = stores.find((s) => s.id === activeId);
    if (found) return found;

    // Si no está seteada, setear la primera
    const first = stores[0];
    localStorage.setItem('venematic_active_store_id', first.id);
    return first;
  }

  // Cambiar tienda activa
  async setActiveStore(storeId: string): Promise<RegisteredStore> {
    const stores = await this.getAllStores();
    const target = stores.find((s) => s.id === storeId) || stores[0];
    localStorage.setItem('venematic_active_store_id', target.id);
    await venematicDB.saveSetting('current_store_id', target.id);
    await venematicDB.saveSetting('store_name', target.name);

    // Inicializar catálogo demo si la tienda no tiene productos
    await this.ensureStoreProducts(target);

    // Notificar listeners
    this.listeners.forEach((listener) => listener(target));

    // Despachar evento para componentes de ventana
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('venematic:store-changed', { detail: target }));
    }

    return target;
  }

  // Crear nueva tienda de cualquier rubro
  async createStore(
    name: string,
    businessType: BusinessType,
    rif = '',
    address = '',
    phone = '',
    withSampleProducts = true
  ): Promise<RegisteredStore> {
    const stores = await this.getAllStores();
    const rubroInfo = BUSINESS_RUBROS[businessType] || BUSINESS_RUBROS.general;
    const newId = `store_${businessType}_${Date.now()}`;

    const newStore: RegisteredStore = {
      id: newId,
      name: name.trim() || `${rubroInfo.label} (${stores.length + 1})`,
      rif: rif.trim(),
      address: address.trim(),
      phone: phone.trim(),
      businessType,
      icon: rubroInfo.icon,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...stores, newStore];
    localStorage.setItem('venematic_registered_stores', JSON.stringify(updated));

    // Si se solicitó con productos de muestra del rubro
    if (withSampleProducts && rubroInfo.sampleProducts.length > 0) {
      const prodsToInsert = rubroInfo.sampleProducts.map((p, idx) => ({
        id: `prod_${newId}_${idx + 1}`,
        storeId: newId,
        name: p.name,
        description: p.description,
        barcode: `759${Math.floor(1000000 + Math.random() * 9000000)}`,
        category: p.category,
        subcategory: p.category,
        priceUSD: p.priceUSD,
        costUSD: p.costUSD,
        stock: p.stock,
        minStock: p.minStock,
        maxStock: 100,
        unit: p.unit,
        image: p.image || '',
        supplier: name,
        tags: [p.category.toLowerCase(), businessType],
        isScanned: false,
        visualCategory: p.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      await venematicDB.bulkUpsertProducts(prodsToInsert);
    }

    // Activar inmediatamente la nueva tienda
    await this.setActiveStore(newStore.id);
    return newStore;
  }

  // Asegurar que la tienda tenga productos iniciales si está vacía
  async ensureStoreProducts(store: RegisteredStore): Promise<void> {
    const existing = await venematicDB.getProductsByStore(store.id);
    if (!existing || existing.length === 0) {
      const rubroInfo = BUSINESS_RUBROS[store.businessType] || BUSINESS_RUBROS.general;
      if (rubroInfo.sampleProducts.length > 0) {
        const prods = rubroInfo.sampleProducts.map((p, idx) => ({
          id: `prod_${store.id}_${idx + 1}`,
          storeId: store.id,
          name: p.name,
          description: p.description,
          barcode: `759${Math.floor(1000000 + Math.random() * 9000000)}`,
          category: p.category,
          subcategory: p.category,
          priceUSD: p.priceUSD,
          costUSD: p.costUSD,
          stock: p.stock,
          minStock: p.minStock,
          maxStock: 100,
          unit: p.unit,
          image: p.image || '',
          supplier: store.name,
          tags: [p.category.toLowerCase(), store.businessType],
          isScanned: false,
          visualCategory: p.category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        await venematicDB.bulkUpsertProducts(prods);
      }
    }
  }

  // Actualizar datos de una tienda
  async updateStore(storeId: string, updates: Partial<RegisteredStore>): Promise<RegisteredStore> {
    const stores = await this.getAllStores();
    const idx = stores.findIndex((s) => s.id === storeId);
    if (idx === -1) throw new Error('Tienda no encontrada');

    stores[idx] = {
      ...stores[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('venematic_registered_stores', JSON.stringify(stores));

    const activeId = localStorage.getItem('venematic_active_store_id');
    if (activeId === storeId) {
      this.listeners.forEach((listener) => listener(stores[idx]));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('venematic:store-changed', { detail: stores[idx] }));
      }
    }

    return stores[idx];
  }

  // Suscribirse a cambios de tienda
  onStoreChange(listener: StoreChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const storeManager = new StoreManager();
