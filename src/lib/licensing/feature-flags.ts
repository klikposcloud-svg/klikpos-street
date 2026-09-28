/**
 * KlikPOS Enterprise - Granular Feature Flag & Edition Guard Engine
 * Control central de ediciones: KlikPOS Lite, KlikPOS Pro, KlikPOS Elite y Línea Móvil
 */

export type KlikEdition = 'KLIKPOS_LITE' | 'KLIKPOS_PRO' | 'KLIKPOS_ELITE';

export type PosViewMode = 'grid' | 'list' | 'touch' | 'capsule';

export interface EditionCapabilities {
  id: KlikEdition;
  name: string;
  badge: string;
  description: string;
  allowedViews: PosViewMode[];
  canChangeThemes: boolean;
  hasSatelliteScanner: boolean;
  hasAdvancedFinancialDashboard: boolean;
  hasTablesAndKitchen: boolean;
  hasDeliveryModule: boolean;
  hasSmsBankMonitor: boolean;
  hasSeniatFiscal: boolean;
  hasCustomBranding: boolean;
  maxProducts: number;
}

export const EDITION_DEFINITIONS: Record<KlikEdition, EditionCapabilities> = {
  KLIKPOS_LITE: {
    id: 'KLIKPOS_LITE',
    name: 'KlikPOS Lite',
    badge: 'LITE',
    description: 'Versión esencial para bodegas, abastos y pequeños comercios: ventas rápidas, corte Z/X e impresión básica.',
    allowedViews: ['grid'],
    canChangeThemes: false,
    hasSatelliteScanner: false,
    hasAdvancedFinancialDashboard: false,
    hasTablesAndKitchen: false,
    hasDeliveryModule: false,
    hasSmsBankMonitor: false,
    hasSeniatFiscal: false,
    hasCustomBranding: false,
    maxProducts: 500,
  },
  KLIKPOS_PRO: {
    id: 'KLIKPOS_PRO',
    name: 'KlikPOS Pro',
    badge: 'PRO',
    description: 'Para minimarkets, tiendas y multicajeros con escáner celular satélite, métricas profesionales y cobros.',
    allowedViews: ['grid', 'list', 'touch'],
    canChangeThemes: false,
    hasSatelliteScanner: true,
    hasAdvancedFinancialDashboard: true,
    hasTablesAndKitchen: false,
    hasDeliveryModule: true,
    hasSmsBankMonitor: true,
    hasSeniatFiscal: true,
    hasCustomBranding: false,
    maxProducts: 999999,
  },
  KLIKPOS_ELITE: {
    id: 'KLIKPOS_ELITE',
    name: 'KlikPOS Elite',
    badge: 'ELITE',
    description: 'Control total desbloqueado: todas las vistas de catálogo (incluye Gourmet Warm Cream), personalización total de temas/colores, mesas, comandas y finanzas.',
    allowedViews: ['grid', 'list', 'touch', 'capsule'],
    canChangeThemes: true,
    hasSatelliteScanner: true,
    hasAdvancedFinancialDashboard: true,
    hasTablesAndKitchen: true,
    hasDeliveryModule: true,
    hasSmsBankMonitor: true,
    hasSeniatFiscal: true,
    hasCustomBranding: true,
    maxProducts: 999999,
  },
};

const EDITION_STORAGE_KEY = 'klikpos_active_edition';
const LICENSE_STORAGE_KEY = 'klikpos_enterprise_license_payload';

/**
 * Obtiene la edición activa actual en el sistema
 */
export function getActiveEdition(): KlikEdition {
  if (typeof window === 'undefined') return 'KLIKPOS_ELITE';

  try {
    // 1. Revisar si hay una licencia firmada que define el tier
    const rawLic = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (rawLic) {
      const lic = JSON.parse(rawLic);
      if (lic.edition && EDITION_DEFINITIONS[lic.edition as KlikEdition]) {
        return lic.edition as KlikEdition;
      }
      if (lic.tier === 'ENTERPRISE_CLOUD' || lic.tier === 'RESTAURANT_PRO') return 'KLIKPOS_ELITE';
      if (lic.tier === 'RETAIL_PRO') return 'KLIKPOS_PRO';
      if (lic.tier === 'FREE_STARTER') return 'KLIKPOS_LITE';
    }

    // 2. Revisar preset local instalado
    const preset = localStorage.getItem(EDITION_STORAGE_KEY) as KlikEdition;
    if (preset && EDITION_DEFINITIONS[preset]) {
      return preset;
    }
  } catch {}

  // Por defecto arranca en Elite a menos que el instalador o licencia defina lo contrario
  return 'KLIKPOS_ELITE';
}

/**
 * Obtiene las capacidades de la edición activa
 */
export function getActiveCapabilities(): EditionCapabilities {
  const edition = getActiveEdition();
  return EDITION_DEFINITIONS[edition] || EDITION_DEFINITIONS.KLIKPOS_ELITE;
}

/**
 * Valida si una vista de catálogo de POS está permitida en la edición actual
 */
export function isPosViewAllowed(view: PosViewMode): boolean {
  const caps = getActiveCapabilities();
  return caps.allowedViews.includes(view);
}

/**
 * Valida si una función específica está desbloqueada
 */
export function canUseFeature(feature: keyof Omit<EditionCapabilities, 'id' | 'name' | 'badge' | 'description' | 'allowedViews' | 'maxProducts'>): boolean {
  const caps = getActiveCapabilities();
  return Boolean(caps[feature]);
}

/**
 * Permite cambiar la edición (Usado por el activador de licencias de desarrollador)
 */
export function setActiveEdition(edition: KlikEdition) {
  if (typeof window === 'undefined') return;
  if (!EDITION_DEFINITIONS[edition]) return;
  localStorage.setItem(EDITION_STORAGE_KEY, edition);
  window.dispatchEvent(new CustomEvent('klikpos_edition_changed', { detail: { edition } }));
}

// ============================================================================
// COMPATIBILIDAD CON SISTEMA DE LICENCIAS PREVIO
// ============================================================================

export type FeatureFlag =
  | 'analytics_financial'
  | 'credit_management'
  | 'payables_suppliers'
  | 'firestore_cloud_sync'
  | 'seniat_fiscal_api'
  | 'digital_menu_qr'
  | 'sms_bank_monitor'
  | 'unlimited_products'
  | 'multi_device_sync'
  | 'dark_mode_custom_oled'
  | 'export_accounting_pdf'
  | 'customer_loyalty_crm';

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
    name: 'KlikPOS Lite (Free Starter)',
    badge: 'LITE',
    description: 'Punto de Venta esencial para pequeños comercios y bodegas.',
    maxProducts: 500,
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
      dark_mode_custom_oled: false,
      export_accounting_pdf: false,
      customer_loyalty_crm: false,
    },
  },
  RETAIL_PRO: {
    id: 'RETAIL_PRO',
    name: 'KlikPOS Pro (Retail & Comercial)',
    badge: 'PRO',
    description: 'Para minimarkets, tiendas y multicajeros con escáner celular satélite.',
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
      dark_mode_custom_oled: false,
      export_accounting_pdf: true,
      customer_loyalty_crm: true,
    },
  },
  RESTAURANT_PRO: {
    id: 'RESTAURANT_PRO',
    name: 'KlikPOS Elite (Restaurant & Gourmet)',
    badge: 'ELITE',
    description: 'Para restaurantes, cafeterías y locales con mesas, comandas y menú digital QR.',
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
    name: 'KlikPOS Elite (Enterprise Suite)',
    badge: 'ELITE',
    description: 'Control total multi-sucursal, finanzas, vistas completas y personalización de temas.',
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

const CUSTOM_OVERRIDES_KEY = 'klikpos_feature_overrides';

export interface LicensePayload {
  hwid: string;
  tier: LicenseTier;
  edition?: KlikEdition;
  companyRif?: string;
  issuedAt: string;
  expiresAt?: string;
  customFlags?: Partial<Record<FeatureFlag, boolean>>;
  signature?: string;
}

export function getActiveLicensePayload(): LicensePayload {
  if (typeof window === 'undefined') {
    return { hwid: 'SERVER', tier: 'ENTERPRISE_CLOUD', edition: 'KLIKPOS_ELITE', issuedAt: new Date().toISOString() };
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

  const currentEd = getActiveEdition();
  const defaultTier: LicenseTier = currentEd === 'KLIKPOS_LITE' ? 'FREE_STARTER' : currentEd === 'KLIKPOS_PRO' ? 'RETAIL_PRO' : 'ENTERPRISE_CLOUD';

  return {
    hwid: 'LOCAL_DEVICE',
    tier: defaultTier,
    edition: currentEd,
    issuedAt: new Date().toISOString(),
  };
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const rawOverrides = localStorage.getItem(CUSTOM_OVERRIDES_KEY);
    if (rawOverrides) {
      const overrides = JSON.parse(rawOverrides);
      if (typeof overrides[flag] === 'boolean') {
        return overrides[flag];
      }
    }

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

export function applyLicenseUpdate(newPayload: LicensePayload): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (newPayload.edition) {
      setActiveEdition(newPayload.edition);
    } else if (newPayload.tier === 'FREE_STARTER') {
      setActiveEdition('KLIKPOS_LITE');
    } else if (newPayload.tier === 'RETAIL_PRO') {
      setActiveEdition('KLIKPOS_PRO');
    } else {
      setActiveEdition('KLIKPOS_ELITE');
    }

    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(newPayload));
    window.dispatchEvent(new CustomEvent('klikpos_license_updated', { detail: newPayload }));
    return true;
  } catch (err) {
    console.error('Error aplicando licencia:', err);
    return false;
  }
}

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


