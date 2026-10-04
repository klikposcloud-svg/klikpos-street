'use client';

import { useState, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db as firestoreDb, isFirebaseConfigured } from '@/lib/firebase/config';
import { cloudSyncService } from '@/lib/firebase/cloud-sync-service';

export type BcvMode = 'auto' | 'manual';

export interface BcvToast {
  message: string;
  type: 'success' | 'info' | 'error';
}

export interface UseBcvRateReturn {
  bcvRate: number;
  bcvMode: BcvMode;
  isBcvEditing: boolean;
  setIsBcvEditing: (v: boolean) => void;
  customBcvInput: string;
  setCustomBcvInput: (v: string) => void;
  isFetchingBcv: boolean;
  bcvToast: BcvToast | null;
  setBcvToast: (t: BcvToast | null) => void;
  setBcvRate: (rate: number) => void;
  setBcvMode: (mode: BcvMode) => void;
  fetchBcvRateAuto: (isManualClick?: boolean) => Promise<void>;
  handleSaveManualBcv: () => void;
}

const FALLBACK_RATE = 871.37;

export function useBcvRate(initialRate = FALLBACK_RATE): UseBcvRateReturn {
  const [bcvRate, setBcvRate] = useState(initialRate);
  const [bcvMode, setBcvMode] = useState<BcvMode>('auto');
  const [isBcvEditing, setIsBcvEditing] = useState(false);
  const [customBcvInput, setCustomBcvInput] = useState(String(initialRate));
  const [isFetchingBcv, setIsFetchingBcv] = useState(false);
  const [bcvToast, setBcvToast] = useState<BcvToast | null>(null);

  const showToast = useCallback((toast: BcvToast, durationMs = 4000) => {
    setBcvToast(toast);
    setTimeout(() => setBcvToast(null), durationMs);
  }, []);

  const persistRate = useCallback((rate: number, source: string) => {
    try {
      localStorage.setItem('klikpos_bcv_rate', String(rate));
      localStorage.setItem('klikpos_bcv_mode', 'auto');
      if (isFirebaseConfigured()) {
        cloudSyncService.pushBcvRate(rate, source).catch(() => {});
        setDoc(doc(firestoreDb, 'system_config', 'bcv_rate'), {
          rate,
          source,
          updatedAt: new Date().toISOString(),
        }, { merge: true }).catch(() => {});
      }
    } catch {}
  }, []);

  const fetchBcvRateAuto = useCallback(async (isManualClick = false) => {
    setIsFetchingBcv(true);
    let resolvedRate: number | null = null;
    let resolvedSource = '';

    try {
      // 1. Prioridad 1: API Route interna (scraper directo a bcv.org.ve)
      try {
        const res = await fetch('/api/bcv/rate?refresh=true');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.rate === 'number' && data.rate > 0) {
            resolvedRate = data.rate;
            resolvedSource = data.source || 'Portal Oficial BCV (bcv.org.ve)';
          }
        }
      } catch {}

      // 2. Prioridad 2: Respaldo Cloud Firestore (0 CORS)
      if (!resolvedRate) {
        try {
          const cloudRate = await cloudSyncService.fetchLatestBcvRate();
          if (cloudRate && cloudRate.rate > 0) {
            resolvedRate = cloudRate.rate;
            resolvedSource = cloudRate.source || 'Respaldo Cloud';
          }
        } catch (e) {
          console.warn('[BCV] Firestore read fallback:', e);
        }
      }

      // 3. Prioridad 3: DolarAPI Venezuela
      if (!resolvedRate) {
        try {
          const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
          if (res.ok) {
            const data = await res.json();
            const rate = data.promedio || data.precio || data.valor;
            if (typeof rate === 'number' && rate > 0) {
              resolvedRate = rate;
              resolvedSource = 'DolarAPI Venezuela';
            }
          }
        } catch {}
      }

      // 4. Prioridad 4: PyDolar Venezuela
      if (!resolvedRate) {
        try {
          const res = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv');
          if (res.ok) {
            const data = await res.json();
            const val = parseFloat(data?.monitors?.usd?.price);
            if (!isNaN(val) && val > 0) {
              resolvedRate = val;
              resolvedSource = 'PyDolar Venezuela';
            }
          }
        } catch {}
      }

      // 5. Prioridad 5: Open Exchange Rates VES
      if (!resolvedRate) {
        try {
          const res = await fetch('https://open.er-api.com/v6/latest/USD');
          if (res.ok) {
            const data = await res.json();
            const val = parseFloat(data?.rates?.VES);
            if (!isNaN(val) && val > 0) {
              resolvedRate = val;
              resolvedSource = 'OpenExchange';
            }
          }
        } catch {}
      }

      // 6. Prioridad 6: Fawaz Ahmed Currency CDN
      if (!resolvedRate) {
        try {
          const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
          if (res.ok) {
            const data = await res.json();
            const val = parseFloat(data?.usd?.ves);
            if (!isNaN(val) && val > 0) {
              resolvedRate = val;
              resolvedSource = 'CurrencyCDN';
            }
          }
        } catch {}
      }

      if (resolvedRate && resolvedRate > 0) {
        const rounded = Math.round(resolvedRate * 100) / 100;
        setBcvRate(rounded);
        setCustomBcvInput(rounded.toFixed(2));
        persistRate(rounded, resolvedSource);

        if (isManualClick) {
          showToast({
            message: `✅ Tasa BCV Actualizada: Bs. ${rounded.toFixed(2)} (${resolvedSource})`,
            type: 'success',
          });
        }
      } else {
        if (isManualClick) {
          showToast({
            message: `⚠️ Conectado en modo offline. Tasa actual: Bs. ${bcvRate.toFixed(2)}`,
            type: 'info',
          });
        }
      }
    } catch {
      try {
        const saved = localStorage.getItem('klikpos_bcv_rate');
        if (saved) setBcvRate(parseFloat(saved));
      } catch {}
    } finally {
      setIsFetchingBcv(false);
    }
  }, [bcvRate, persistRate, showToast]);

  const handleSaveManualBcv = useCallback(() => {
    const parsed = parseFloat(customBcvInput.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      const rounded = Math.round(parsed * 100) / 100;
      setBcvRate(rounded);
      setBcvMode('manual');
      setIsBcvEditing(false);
      try {
        localStorage.setItem('klikpos_bcv_rate', String(rounded));
        localStorage.setItem('klikpos_bcv_mode', 'manual');
        if (isFirebaseConfigured()) {
          cloudSyncService.pushBcvRate(rounded, 'Ajuste Manual en Terminal').catch(() => {});
          setDoc(doc(firestoreDb, 'system_config', 'bcv_rate'), {
            rate: rounded,
            source: 'Ajuste Manual en Terminal',
            updatedAt: new Date().toISOString(),
          }, { merge: true }).catch(() => {});
        }
      } catch {}

      showToast({ message: `✅ Tasa manual fijada: Bs. ${rounded.toFixed(2)}`, type: 'info' });
    }
  }, [customBcvInput, showToast]);

  return {
    bcvRate,
    bcvMode,
    isBcvEditing,
    setIsBcvEditing,
    customBcvInput,
    setCustomBcvInput,
    isFetchingBcv,
    bcvToast,
    setBcvToast,
    setBcvRate,
    setBcvMode,
    fetchBcvRateAuto,
    handleSaveManualBcv,
  };
}
