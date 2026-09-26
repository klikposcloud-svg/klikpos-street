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
  | 'pro_trial' | 'pro_full';

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
  return plan === 'pro_trial' || plan === 'pro_full' || plan === 'vitalicia';
}
export function isTrialPlan(plan: LicensePlan): boolean {
  return plan === 'starter_trial' || plan === 'pro_trial' || plan === 'demo';
}
export function isFullPlan(plan: LicensePlan): boolean {
  return plan === 'starter_full' || plan === 'pro_full' || plan === 'vitalicia';
}
export function getPlanDisplayName(plan: LicensePlan): string {
  const names: Record<LicensePlan, string> = {
    demo: 'Demostracion (15 dias)',
    starter_trial: 'Starter - Primera Cuota (30 dias)',
    starter_full: 'Starter - Licencia Completa',
    pro_trial: 'Pro - Primera Cuota (30 dias)',
    pro_full: 'Pro - Licencia Completa',
    vitalicia: 'Vitalicia',
    anual: 'Anual',
  };
  return names[plan] ?? 'Desconocido';
}
export function getPlanPrice(plan: LicensePlan): { firstPayment: number; secondPayment: number; total: number } {
  if (plan === 'starter_trial' || plan === 'starter_full') return { firstPayment: 25, secondPayment: 25, total: 50 };
  if (plan === 'pro_trial' || plan === 'pro_full') return { firstPayment: 37.50, secondPayment: 37.50, total: 75 };
  return { firstPayment: 0, secondPayment: 0, total: 0 };
}
