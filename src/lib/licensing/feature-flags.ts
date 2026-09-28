/**
 * KlikPOS Enterprise - Granular Feature Flag & License Tier Engine
 * Inspirado en arquitecturas de licenciamiento de grado empresarial (Stripe Billing / LaunchDarkly)
 * Permite control total sobre qué módulos están activos, bloqueados o personalizados por cliente,
 * tanto en modo Free Starter, paquetes comerciales Pro, o planes a la medida.
 */

export type FeatureFlag =
  | 'analytics_financial'      // Dashboard Financiero: Ganancia neta, Costos COGS, Margen %
  | 'credit_management'        // Cuentas por Cobrar: Fiados, Límites de crédito, Cobro WhatsApp
  | 'payables_suppliers'       // Cuentas por Pagar: Proveedores, Facturas de compra, Alertas
  | 'firestore_cloud_sync'     // Sincronización en la Nube: Red de Delivery Caballo de Troya
  | 'seniat_fiscal_api'        // Digitalización SENIAT: Facturación Electrónica API & QR Fiscal
  | 'digital_menu_qr'          // Menú Digital Interactivo en Mesas y Delivery con pedidos WhatsApp
  | 'sms_bank_monitor'         // Lector de SMS Pago Móvil Bancario Anti-Fraude
  | 'unlimited_products'       // Catálogo Ilimitado (Versión Free limitada a 50 productos)
  | 'multi_device_sync'        // Terminales Satélites y Mesas conectadas en LAN/WiFi
  | 'dark_mode_custom_oled'    // Personalización Total de Colores Modo Oscuro / OLED
  | 'export_accounting_pdf'    // Exportación Contable avanzada en PDF / Excel
  | 'customer_loyalty_crm';    // CRM 360° de Hábitos de Consumo y Clientes VIP

export type LicenseTier = 'FREE_STARTER' | 'RETAIL_PRO' | 'RESTAURANT_PRO' | 'ENTERPRISE_CLOUD' | 'CUSTOM_PLAN';

export interface PlanDefinition {
  id: LicenseTier;
  name: string;
  badge: string;
  description: string;
  maxProducts: number;
  features: Record<FeatureFlag, boolean>;
}

export const PLAN_DEFINITIONS: Record<LicenseTier, PlanDefinition> = {
  FREE_STARTER: {
    id: 'FREE_STARTER',
    name: 'KlikPOS Free Starter',
    badge: 'GRATUITO',
    description: 'Punto de Venta esencial para pequeños comercios y emprendimientos.',
    maxProducts: 50,
    features: {
      analytics_financial: false,
      credit_management: false,
      payables_suppliers: false,
      firestore_cloud_sync: false,
      seniat_fiscal_api: false,
      digital_menu_qr: false,
      sms_bank_monitor: false,
      unlimited_products: false,
      multi_device_sync: false,
      dark_mode_custom_oled: true,
      export_accounting_pdf: false,
      customer_loyalty_crm: false,
    },
  },
  RETAIL_PRO: {
    id: 'RETAIL_PRO',
    name: 'KlikPOS Retail Pro',
    badge: 'PRO RETAIL',
    description: 'Para abastos, supermercados, farmacias y ferreterías con escáner e inventario full.',
    maxProducts: 999999,
    features: {
      analytics_financial: true,
      credit_management: true,
      payables_suppliers: true,
      firestore_cloud_sync: true,
      seniat_fiscal_api: true,
      digital_menu_qr: false,
      sms_bank_monitor: true,
      unlimited_products: true,
      multi_device_sync: true,
      dark_mode_custom_oled: true,
      export_accounting_pdf: true,
      customer_loyalty_crm: true,
    },
  },
  RESTAURANT_PRO: {
    id: 'RESTAURANT_PRO',
    name: 'KlikPOS Restaurant & Gourmet',
    badge: 'PRO GOURMET',
    description: 'Para restaurantes, cafeterías, comida rápida con mesas, comandas y menú digital QR.',
    maxProducts: 999999,
    features: {
      analytics_financial: true,
      credit_management: true,
      payables_suppliers: true,
      firestore_cloud_sync: true,
      seniat_fiscal_api: true,
      digital_menu_qr: true,
      sms_bank_monitor: true,
      unlimited_products: true,
      multi_device_sync: true,
      dark_mode_custom_oled: true,
      export_accounting_pdf: true,
      customer_loyalty_crm: true,
    },
  },
  ENTERPRISE_CLOUD: {
    id: 'ENTERPRISE_CLOUD',
    name: 'KlikPOS Enterprise Suite',
    badge: 'ENTERPRISE',
    description: 'Control total multi-sucursal, red de delivery masiva, API SENIAT y analítica ejecutiva.',
    maxProducts: 999999,
    features: {
      analytics_financial: true,
      credit_management: true,
      payables_suppliers: true,
      firestore_cloud_sync: true,
      seniat_fiscal_api: true,
      digital_menu_qr: true,
      sms_bank_monitor: true,
      unlimited_products: true,
      multi_device_sync: true,
      dark_mode_custom_oled: true,
      export_accounting_pdf: true,
      customer_loyalty_crm: true,
    },
  },
  CUSTOM_PLAN: {
    id: 'CUSTOM_PLAN',
    name: 'KlikPOS Plan Personalizado',
    badge: 'A MEDIDA',
    description: 'Configuración granular de módulos activados según contrato comercial.',
    maxProducts: 999999,
    features: {
      analytics_financial: true,
      credit_management: false,
      payables_suppliers: false,
      firestore_cloud_sync: true,
      seniat_fiscal_api: false,
      digital_menu_qr: false,
      sms_bank_monitor: true,
      unlimited_products: true,
      multi_device_sync: false,
      dark_mode_custom_oled: true,
      export_accounting_pdf: true,
      customer_loyalty_crm: false,
    },
  },
};

const LICENSE_STORAGE_KEY = 'klikpos_enterprise_license_payload';
const CUSTOM_OVERRIDES_KEY = 'klikpos_feature_overrides';

export interface LicensePayload {
  hwid: string;
  tier: LicenseTier;
  companyRif?: string;
  issuedAt: string;
  expiresAt?: string;
  customFlags?: Partial<Record<FeatureFlag, boolean>>;
  signature?: string;
}

/**
 * Obtiene el plan activo actual o Free Starter por defecto
 */
export function getActiveLicensePayload(): LicensePayload {
  if (typeof window === 'undefined') {
    return { hwid: 'SERVER', tier: 'ENTERPRISE_CLOUD', issuedAt: new Date().toISOString() };
  }

  try {
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LicensePayload;
      if (parsed && parsed.tier) {
        return parsed;
      }
    }
  } catch {}

  return {
    hwid: 'LOCAL_DEVICE',
    tier: 'FREE_STARTER',
    issuedAt: new Date().toISOString(),
  };
}

/**
 * Evalúa si una característica específica está desbloqueada en la terminal actual
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  if (typeof window === 'undefined') return true;

  try {
    // 1. Verificar si hay un override local explícito (para pruebas del administrador)
    const rawOverrides = localStorage.getItem(CUSTOM_OVERRIDES_KEY);
    if (rawOverrides) {
      const overrides = JSON.parse(rawOverrides);
      if (typeof overrides[flag] === 'boolean') {
        return overrides[flag];
      }
    }

    // 2. Obtener plan de la licencia
    const payload = getActiveLicensePayload();
    if (payload.customFlags && typeof payload.customFlags[flag] === 'boolean') {
      return payload.customFlags[flag]!;
    }

    const tierDef = PLAN_DEFINITIONS[payload.tier] || PLAN_DEFINITIONS.FREE_STARTER;
    return Boolean(tierDef.features[flag]);
  } catch {
    return false;
  }
}

/**
 * Actualiza el plan o características activas sin necesidad de reinstalar
 */
export function applyLicenseUpdate(newPayload: LicensePayload): boolean {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(newPayload));
    // Disparar evento en la ventana para que los componentes reaccionen al instante
    window.dispatchEvent(new CustomEvent('klikpos_license_updated', { detail: newPayload }));
    return true;
  } catch (err) {
    console.error('Error aplicando licencia:', err);
    return false;
  }
}

/**
 * Configura un override directo de características (Panel de Control de Distribuidor)
 */
export function setFeatureOverride(flag: FeatureFlag, enabled: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CUSTOM_OVERRIDES_KEY);
    const overrides = raw ? JSON.parse(raw) : {};
    overrides[flag] = enabled;
    localStorage.setItem(CUSTOM_OVERRIDES_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new CustomEvent('klikpos_license_updated', { detail: { flag, enabled } }));
  } catch {}
}
