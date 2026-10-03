import { 
  CompanyInfo, 
  PagoMovilInfo, 
  Customer, 
  DiningSpot, 
  CartItem, 
  RubroId, 
  CardViewMode, 
  ThemePreset 
} from '@/types/tablet-pos';
import { db } from '@/lib/db';

const STORAGE_KEYS = {
  COMPANY: 'klikpos_company_info',
  PAGO_MOVIL: 'klikpos_pago_movil',
  CLIENTS: 'klikpos_clients',
  DINING_SPOTS: 'klikpos_dining_spots',
  CART: 'klikpos_tablet_cart',
  VIEW_MODE: 'klikpos_card_view_mode',
  THEME: 'venematic_theme',
  PALETTE: 'venematic_branding_palette',
  STYLE_PRESET: 'klikpos_style_preset',
  BCV_RATE: 'klikpos_bcv_rate',
  BCV_MODE: 'klikpos_bcv_mode',
  RUBRO: 'klikpos_active_rubro',
  DOCK_SIDE: 'klikpos_dock_side',
};

export const TabletPosStorage = {
  // Configuración de Empresa
  getCompanyInfo(defaultVal: CompanyInfo): CompanyInfo {
    if (typeof window === 'undefined') return defaultVal;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMPANY);
      return raw ? JSON.parse(raw) : defaultVal;
    } catch {
      return defaultVal;
    }
  },

  setCompanyInfo(info: CompanyInfo): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(info));
      db.settings.put({
        key: 'store_info',
        value: {
          name: info.name,
          rif: info.rif,
          phone: info.phone,
          address: info.address,
          footerMessage: info.footerMsg
        }
      }).catch(() => {});
    } catch {}
  },

  // Pago Móvil
  getPagoMovil(defaultVal: PagoMovilInfo): PagoMovilInfo {
    if (typeof window === 'undefined') return defaultVal;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PAGO_MOVIL);
      return raw ? JSON.parse(raw) : defaultVal;
    } catch {
      return defaultVal;
    }
  },

  setPagoMovil(info: PagoMovilInfo): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PAGO_MOVIL, JSON.stringify(info));
    } catch {}
  },

  // Clientes
  getCustomers(defaultVal: Customer[]): Customer[] {
    if (typeof window === 'undefined') return defaultVal;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return raw ? JSON.parse(raw) : defaultVal;
    } catch {
      return defaultVal;
    }
  },

  setCustomers(customers: Customer[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(customers));
    } catch {}
  },

  // Mesas y Zonas
  getDiningSpots(defaultVal: DiningSpot[]): DiningSpot[] {
    if (typeof window === 'undefined') return defaultVal;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DINING_SPOTS);
      return raw ? JSON.parse(raw) : defaultVal;
    } catch {
      return defaultVal;
    }
  },

  setDiningSpots(spots: DiningSpot[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.DINING_SPOTS, JSON.stringify(spots));
    } catch {}
  },

  // Carrito
  getCart(defaultVal: CartItem[] = []): CartItem[] {
    if (typeof window === 'undefined') return defaultVal;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CART);
      return raw ? JSON.parse(raw) : defaultVal;
    } catch {
      return defaultVal;
    }
  },

  setCart(cart: CartItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch {}
  },

  // Modos de Vista y Temas
  getViewMode(defaultVal: CardViewMode = 'food'): CardViewMode {
    if (typeof window === 'undefined') return defaultVal;
    try {
      const val = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
      return (val === 'lista' || val === 'food') ? val : defaultVal;
    } catch {
      return defaultVal;
    }
  },

  setViewMode(mode: CardViewMode): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
    } catch {}
  },

  // Tasa BCV
  getBcvRate(defaultVal: number = 848.55): number {
    if (typeof window === 'undefined') return defaultVal;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BCV_RATE);
      const val = raw ? parseFloat(raw) : defaultVal;
      return !isNaN(val) && val > 0 ? val : defaultVal;
    } catch {
      return defaultVal;
    }
  },

  setBcvRate(rate: number, mode: 'auto' | 'manual' = 'auto'): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.BCV_RATE, String(rate));
      localStorage.setItem(STORAGE_KEYS.BCV_MODE, mode);
    } catch {}
  }
};
