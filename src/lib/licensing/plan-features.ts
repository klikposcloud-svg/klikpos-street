/**
 * =====================================================================
 * VENEMATIC POS - Sistema de Planes y Features por Licencia
 * =====================================================================
 * Planes:
 *   STR (Starter)  $50 USD pago unico - en 2 cuotas de $25
 *   PRO (Pro)      $75 USD pago unico - en 2 cuotas de $37.50
 *
 * Prefijos de clave:
 *   VNK-STT-... -> Starter Trial  (30 dias, primera cuota pagada)
 *   VNK-STR-... -> Starter Full   (permanente, segunda cuota pagada)
 *   VNK-PTT-... -> Pro Trial      (30 dias, primera cuota pagada)
 *   VNK-PRO-... -> Pro Full       (permanente, segunda cuota pagada)
 *   VNK-DMO-... -> Demo           (15 dias, sin pago, para evaluacion)
 * =====================================================================
 */

export type LicensePlan =
  | 'vitalicia' | 'anual' | 'demo'
  | 'starter_trial' | 'starter_full'
  | 'pro_trial' | 'pro_full'
  | 'promo_6m' | 'basico_local' | 'cloud_monthly' | 'trial_15m';

export interface PlanFeatures {
  posOffline: boolean;
  inventory: boolean;
  thermalPrint: boolean;
  multiPaymentMethods: boolean;
  customBranding: boolean;
  maxCashiers: number;
  labelsBarcode: boolean;
  cloudBackup: boolean;
  gmailPagoMovil: boolean;
  digitalScale: boolean;
  advancedReports: boolean;
  creditCustomers: boolean;
}

export const PLAN_FEATURES: Record<LicensePlan, PlanFeatures> = {
  trial_15m: {
    posOffline: true, inventory: true, thermalPrint: true,
    multiPaymentMethods: true, customBranding: true,
    maxCashiers: 99, labelsBarcode: true,
    cloudBackup: false, gmailPagoMovil: true,
    digitalScale: true, advancedReports: true, creditCustomers: true,
  },
  promo_6m: {
    posOffline: true, inventory: true, thermalPrint: true,
    multiPaymentMethods: true, customBranding: true,
    maxCashiers: 99, labelsBarcode: true,
    cloudBackup: true, gmailPagoMovil: true,
    digitalScale: true, advancedReports: true, creditCustomers: true,
  },
  basico_local: {
    posOffline: true, inventory: true, thermalPrint: true,
    multiPaymentMethods: true, customBranding: true,
    maxCashiers: 2, labelsBarcode: true,
    cloudBackup: false, gmailPagoMovil: false,
    digitalScale: false, advancedReports: false, creditCustomers: false,
  },
  cloud_monthly: {
    posOffline: true, inventory: true, thermalPrint: true,
    multiPaymentMethods: true, customBranding: true,
    maxCashiers: 99, labelsBarcode: true,
    cloudBackup: true, gmailPagoMovil: true,
    digitalScale: true, advancedReports: true, creditCustomers: true,
  },
  demo: {
    posOffline: true, inventory: true, thermalPrint: true,
    multiPaymentMethods: true, customBranding: false,
    maxCashiers: 1, labelsBarcode: false,
    cloudBackup: false, gmailPagoMovil: false,
    digitalScale: false, advancedReports: false, creditCustomers: false,
  },
  starter_trial: {
    posOffline: true, inventory: true, thermalPrint: true,
    multiPaymentMethods: true, customBranding: true,
    maxCashiers: 2, labelsBarcode: true,
    cloudBackup: false, gmailPagoMovil: false,
    digitalScale: false, advancedReports: false, creditCustomers: false,
  },
  starter_full: {
    posOffline: true, inventory: true, thermalPrint: true,
    multiPaymentMethods: true, customBranding: true,
    maxCashiers: 2, labelsBarcode: true,
    cloudBackup: false, gmailPagoMovil: false,
    digitalScale: false, advancedReports: false, creditCustomers: false,
  },
  pro_trial: {
    posOffline: true, inventory: true, thermalPrint: true,
    multiPaymentMethods: true, customBranding: true,
    maxCashiers: 99, labelsBarcode: true,
    cloudBackup: true, gmailPagoMovil: true,
    digitalScale: true, advancedReports: true, creditCustomers: true,
  },
  pro_full: {
    posOffline: true, inventory: true, thermalPrint: true,
    multiPaymentMethods: true, customBranding: true,
    maxCashiers: 99, labelsBarcode: true,
    cloudBackup: true, gmailPagoMovil: true,
    digitalScale: true, advancedReports: true, creditCustomers: true,
  },
  vitalicia: {
    posOffline: true, inventory: true, thermalPrint: true,
    multiPaymentMethods: true, customBranding: true,
    maxCashiers: 99, labelsBarcode: true,
    cloudBackup: true, gmailPagoMovil: true,
    digitalScale: true, advancedReports: true, creditCustomers: true,
  },
  anual: {
    posOffline: true, inventory: true, thermalPrint: true,
    multiPaymentMethods: true, customBranding: true,
    maxCashiers: 2, labelsBarcode: true,
    cloudBackup: false, gmailPagoMovil: false,
    digitalScale: false, advancedReports: false, creditCustomers: false,
  },
};

export function getFeaturesForPlan(plan: LicensePlan): PlanFeatures {
  return PLAN_FEATURES[plan] ?? PLAN_FEATURES['demo'];
}
export function isProPlan(plan: LicensePlan): boolean {
  return plan === 'pro_trial' || plan === 'pro_full' || plan === 'vitalicia' || plan === 'promo_6m' || plan === 'cloud_monthly';
}
export function isTrialPlan(plan: LicensePlan): boolean {
  return plan === 'starter_trial' || plan === 'pro_trial' || plan === 'demo' || plan === 'trial_15m';
}
export function isFullPlan(plan: LicensePlan): boolean {
  return plan === 'starter_full' || plan === 'pro_full' || plan === 'vitalicia' || plan === 'basico_local';
}
export function getPlanDisplayName(plan: LicensePlan): string {
  const names: Record<LicensePlan, string> = {
    promo_6m: 'Promo Lanzamiento (6 Meses con Nube)',
    basico_local: 'Básico Local (Permanente sin Nube)',
    cloud_monthly: 'Suscripción Cloud ($5/mes)',
    trial_15m: 'Prueba Flash (15 Minutos)',
    demo: 'Demostracion (15 dias)',
    starter_trial: 'Starter - Primera Cuota (30 dias)',
    starter_full: 'Starter - Licencia Completa',
    pro_trial: 'Pro - Primera Cuota (30 dias)',
    pro_full: 'Pro - Licencia Completa Empresarial',
    vitalicia: 'Vitalicia Legacy',
    anual: 'Anual',
  };
  return names[plan] ?? 'Desconocido';
}
export function getPlanPrice(plan: LicensePlan): { firstPayment: number; secondPayment: number; total: number } {
  if (plan === 'starter_trial' || plan === 'starter_full') return { firstPayment: 25, secondPayment: 25, total: 50 };
  if (plan === 'pro_trial' || plan === 'pro_full') return { firstPayment: 37.50, secondPayment: 37.50, total: 75 };
  if (plan === 'promo_6m') return { firstPayment: 35, secondPayment: 0, total: 35 };
  if (plan === 'basico_local') return { firstPayment: 40, secondPayment: 0, total: 40 };
  if (plan === 'cloud_monthly') return { firstPayment: 5, secondPayment: 0, total: 5 };
  return { firstPayment: 0, secondPayment: 0, total: 0 };
}
