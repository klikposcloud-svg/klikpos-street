export interface StoreLicense {
  storeId: string;
  storeName: string;
  licenseKey: string;
  plan: 'free_pos' | 'pro_delivery_monthly' | 'enterprise_annual';
  status: 'active' | 'expired' | 'trial' | 'locked';
  activatedAt: string;
  expiresAt: string;
  features: {
    posOffline: boolean;
    multiStore: boolean;
    deliveryHub: boolean;
    dpanasIntegration: boolean;
    cloudSync: boolean;
    customBranding: boolean;
  };
  monthlyFeeUSD: number;
  lastPaymentDate?: string;
  adminNotes?: string;
}

const STORAGE_KEY = 'venematic_cloud_license';
// Claves maestras hardcodeadas eliminadas por estándar PCI-DSS.

// Licencia por defecto inicial
export const DEFAULT_LICENSE: StoreLicense = {
  storeId: 'default_store',
  storeName: 'Venemarket Principal',
  licenseKey: 'VNK-DEMO-TRIAL-2026',
  plan: 'pro_delivery_monthly',
  status: 'active',
  activatedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 días
  features: {
    posOffline: true,
    multiStore: true,
    deliveryHub: true,
    dpanasIntegration: true,
    cloudSync: true,
    customBranding: true,
  },
  monthlyFeeUSD: 25.0,
  adminNotes: 'Plan Pro con Módulo Delivery y D-Panas activo',
};

class LicenseManager {
  private currentLicense: StoreLicense = DEFAULT_LICENSE;
  private listeners: Array<(license: StoreLicense) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadLicense();
    }
  }

  private loadLicense() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.currentLicense = JSON.parse(saved);
      } else {
        this.currentLicense = DEFAULT_LICENSE;
        this.saveLicense(this.currentLicense);
      }
    } catch {
      this.currentLicense = DEFAULT_LICENSE;
    }
  }

  public getLicense(): StoreLicense {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          this.currentLicense = JSON.parse(saved);
        } catch {}
      }
    }
    return this.currentLicense;
  }

  public isDeliveryActive(): boolean {
    const lic = this.getLicense();
    if (lic.status === 'locked' || lic.status === 'expired') {
      return false;
    }
    const isExpired = new Date(lic.expiresAt).getTime() < Date.now();
    if (isExpired) {
      return false;
    }
    return lic.features?.deliveryHub === true && lic.features?.dpanasIntegration === true;
  }

  public isCloudBackupActive(): boolean {
    const lic = this.getLicense();
    if (lic.status === 'locked' || lic.status === 'expired') {
      return false;
    }
    const isExpired = new Date(lic.expiresAt).getTime() < Date.now();
    if (isExpired) {
      return false;
    }
    return lic.features?.cloudSync === true;
  }

  public getDaysRemaining(): number {
    const lic = this.getLicense();
    const diffTime = new Date(lic.expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  public saveLicense(license: StoreLicense) {
    this.currentLicense = license;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(license));
      window.dispatchEvent(new CustomEvent('venematic:license-changed', { detail: license }));
    }
    this.listeners.forEach(cb => cb(license));
  }

  // Activar o desactivar el módulo de delivery (Capa Oculta de Administración)
  public setDeliveryModuleStatus(active: boolean, daysExtension: number = 30) {
    const lic = { ...this.getLicense() };
    lic.features.deliveryHub = active;
    lic.features.dpanasIntegration = active;
    lic.status = active ? 'active' : 'locked';
    if (active) {
      lic.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * daysExtension).toISOString();
      lic.plan = 'pro_delivery_monthly';
    } else {
      lic.plan = 'free_pos';
    }
    this.saveLicense(lic);
  }

  // Activar o desactivar el respaldo en la nube (Cloud Backup)
  public setCloudSyncStatus(active: boolean) {
    const lic = { ...this.getLicense() };
    lic.features.cloudSync = active;
    this.saveLicense(lic);
  }

  // Generar clave de activación mensual válida
  public generateLicenseKey(storeId: string, months: number = 1): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VNK-DELIV-${months}M-${timestamp}-${rand}`;
  }

  // Canjear clave de licencia introducida por el usuario
  public redeemLicenseKey(key: string): { success: boolean; message: string } {
    const cleanKey = key.trim().toUpperCase();
    if (!cleanKey.startsWith('VNK-')) {
      return { success: false, message: 'Formato de clave de licencia inválido.' };
    }

    let daysToAdd = 30;
    if (cleanKey.includes('12M') || cleanKey.includes('ANNUAL')) {
      daysToAdd = 365;
    } else if (cleanKey.includes('3M')) {
      daysToAdd = 90;
    } else if (cleanKey.includes('6M')) {
      daysToAdd = 180;
    }

    const lic = { ...this.getLicense() };
    lic.licenseKey = cleanKey;
    lic.status = 'active';
    lic.features.deliveryHub = true;
    lic.features.dpanasIntegration = true;
    lic.plan = daysToAdd >= 365 ? 'enterprise_annual' : 'pro_delivery_monthly';
    lic.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * daysToAdd).toISOString();
    lic.activatedAt = new Date().toISOString();

    this.saveLicense(lic);
    return { 
      success: true, 
      message: `¡Licencia activada con éxito! Módulo de Delivery y D-Panas habilitado por ${daysToAdd} días.` 
    };
  }

  public verifyMasterPIN(_pin: string): boolean {
    return Boolean(_pin && false);
  }

  public onLicenseChange(cb: (license: StoreLicense) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }
}

export const licenseManager = new LicenseManager();
