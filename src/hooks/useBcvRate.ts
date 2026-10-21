'use client';

import { useState, useCallback, useEffect } from 'react';
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

const FALLBACK_RATE = 883.40;

export function useBcvRate(initialRate = FALLBACK_RATE): UseBcvRateReturn {
  const [bcvRate, setBcvRate] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('klikpos_bcv_rate') || localStorage.getItem('venematic_offline_bcv');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return initialRate;
  });
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
      localStorage.setItem('venematic_offline_bcv', String(rate));
      localStorage.setItem('klikpos_bcv_mode', 'auto');
      if (isFirebaseConfigured()) {
        cloudSyncService.pushBcvRate(rate, source).catch(() => {});
        setDoc(doc(firestoreDb, 'system_config', 'bcv_rate'), {
          rate,
          source,
          updatedAt: new Date().toISOString(),
        }, { merge: true }).catch(() => {});
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pos:bcv_updated', { detail: rate }));
        window.dispatchEvent(new CustomEvent('venematic:bcv_updated', { detail: rate }));
      }
      fetch('/api/scanner/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bcvRate: rate }),
      }).catch(() => {});
      fetch('/api/bcv/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate, source }),
      }).catch(() => {});
    } catch {}
  }, []);

  const fetchBcvRateAuto = useCallback(async (isManualClick = false) => {
    setIsFetchingBcv(true);
    let resolvedRate: number | null = null;
    let resolvedSource = '';

    try {
      // 1. Prioridad 1: DolarAPI Venezuela (Tiempo Real Oficial BCV, 0 CORS, ultra-rápido)
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          const rate = data.promedio || data.precio || data.valor;
          if (typeof rate === 'number' && rate > 0) {
            resolvedRate = rate;
            resolvedSource = 'BCV Oficial (DolarAPI Venezuela)';
          }
        }
      } catch {}

      // 2. Prioridad 2: API Route interna (Scraper directo a bcv.org.ve)
      if (!resolvedRate) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch('/api/bcv/rate?refresh=true', { signal: controller.signal });
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            if (data && typeof data.rate === 'number' && data.rate > 0) {
              resolvedRate = data.rate;
              resolvedSource = data.source || 'Portal Oficial BCV (bcv.org.ve)';
            }
          }
        } catch {}
      }

      // 3. Prioridad 3: Open Exchange Rates VES (Live)
      if (!resolvedRate) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);
          const res = await fetch('https://open.er-api.com/v6/latest/USD', {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
            cache: 'no-store'
          });
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            const val = parseFloat(data?.rates?.VES);
            if (!isNaN(val) && val > 0) {
              resolvedRate = val;
              resolvedSource = 'OpenExchange Rates (VES)';
            }
          }
        } catch {}
      }

      // 4. Prioridad 4: Fawaz Ahmed Currency CDN
      if (!resolvedRate) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);
          const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
            cache: 'no-store'
          });
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            const val = parseFloat(data?.usd?.ves);
            if (!isNaN(val) && val > 0) {
              resolvedRate = val;
              resolvedSource = 'CurrencyCDN (Oficial)';
            }
          }
        } catch {}
      }

      // 5. Prioridad 5 (Modo Offline / Respaldo Cloud): Solo si no hay respuesta de APIs en vivo
      if (!resolvedRate) {
        try {
          const cloudRate = await cloudSyncService.fetchLatestBcvRate();
          if (cloudRate && cloudRate.rate > 0) {
            resolvedRate = cloudRate.rate;
            resolvedSource = cloudRate.source || 'Respaldo Cloud Firestore';
          }
        } catch (e) {
          console.warn('[BCV] Firestore read fallback:', e);
        }
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
        localStorage.setItem('venematic_offline_bcv', String(rounded));
        localStorage.setItem('klikpos_bcv_mode', 'manual');
        if (isFirebaseConfigured()) {
          cloudSyncService.pushBcvRate(rounded, 'Ajuste Manual en Terminal').catch(() => {});
          setDoc(doc(firestoreDb, 'system_config', 'bcv_rate'), {
            rate: rounded,
            source: 'Ajuste Manual en Terminal',
            updatedAt: new Date().toISOString(),
          }, { merge: true }).catch(() => {});
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pos:bcv_updated', { detail: rounded }));
          window.dispatchEvent(new CustomEvent('venematic:bcv_updated', { detail: rounded }));
        }
        fetch('/api/scanner/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bcvRate: rounded }),
        }).catch(() => {});
        fetch('/api/bcv/rate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rate: rounded, source: 'Ajuste Manual en Terminal' }),
        }).catch(() => {});
      } catch {}

      showToast({ message: `✅ Tasa manual fijada: Bs. ${rounded.toFixed(2)}`, type: 'info' });
    }
  }, [customBcvInput, showToast]);

  // Sincronización reactiva bidireccional en tiempo real
  useEffect(() => {
    const handleBcvUpdate = (e: any) => {
      const val = typeof e.detail === 'number' ? e.detail : parseFloat(e.detail);
      if (!isNaN(val) && val > 0) {
        setBcvRate(val);
        setCustomBcvInput(val.toFixed(2));
      }
    };
    window.addEventListener('pos:bcv_updated', handleBcvUpdate);
    window.addEventListener('venematic:bcv_updated', handleBcvUpdate);
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === 'klikpos_bcv_rate' || e.key === 'venematic_offline_bcv') && e.newValue) {
        const val = parseFloat(e.newValue);
        if (!isNaN(val) && val > 0) {
          setBcvRate(val);
          setCustomBcvInput(val.toFixed(2));
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('pos:bcv_updated', handleBcvUpdate);
      window.removeEventListener('venematic:bcv_updated', handleBcvUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

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
