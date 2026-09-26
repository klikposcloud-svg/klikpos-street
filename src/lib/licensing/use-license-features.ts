'use client';
import { useState, useEffect, useCallback } from 'react';
import { getMachineHWID } from '@/lib/licensing/hwid';
import { getStoredLicenseStatus } from '@/lib/licensing/license-crypto';
import { getFeaturesForPlan, PlanFeatures, LicensePlan, getPlanDisplayName, isTrialPlan } from '@/lib/licensing/plan-features';

export interface UseLicenseReturn {
  plan: LicensePlan;
  planName: string;
  features: PlanFeatures;
  status: 'active' | 'expired' | 'trial' | 'invalid' | 'tampered';
  isTrial: boolean;
  daysRemaining: number;
  isLoaded: boolean;
  refresh: () => void;
}

export function useLicenseFeatures(): UseLicenseReturn {
  const [result, setResult] = useState<UseLicenseReturn>({
    plan: 'demo',
    planName: 'Cargando...',
    features: getFeaturesForPlan('demo'),
    status: 'trial',
    isTrial: true,
    daysRemaining: 0,
    isLoaded: false,
    refresh: () => {},
  });

  const load = useCallback(() => {
    if (typeof window === 'undefined') return;
    const hwid = getMachineHWID();
    const info = getStoredLicenseStatus(hwid);
    const plan: LicensePlan = (info.payload?.plan as LicensePlan) || 'demo';
    setResult({
      plan,
      planName: getPlanDisplayName(plan),
      features: getFeaturesForPlan(plan),
      status: info.status,
      isTrial: isTrialPlan(plan) || info.status === 'trial',
      daysRemaining: info.daysRemaining || 0,
      isLoaded: true,
      refresh: load,
    });
  }, []);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('venematic:license-activated', handler);
    return () => window.removeEventListener('venematic:license-activated', handler);
  }, [load]);

  return result;
}
