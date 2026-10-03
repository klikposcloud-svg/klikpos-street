/**
 * KlikPOS Trial Manager - 30 Minutos de Evaluación Gratuita
 * Permite probar todas las funcionalidades del POS por 30 minutos exactos.
 * Al cumplirse el tiempo, activa suavemente el modal de conversión sin borrar
 * ningún dato, producto ni configuración.
 * Registra automáticamente la instalación en Firestore.
 */

import { getStoredLicenseStatus } from './license-crypto';
import { getMachineHWID } from './hwid';
import { db as firestoreDb } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';

export const TRIAL_DURATION_MS = 30 * 60 * 1000; // 30 minutos en milisegundos
export const OFFICIAL_WHATSAPP_PHONE = '584248298026'; // +58 424 829 8026

export interface TrialState {
  isLicensed: boolean;
  isTrial: boolean;
  isExpired: boolean;
  canOperate: boolean;
  remainingMs: number;
  remainingMinutes: number;
  remainingSeconds: number;
  formattedRemaining: string;
}

/**
 * Obtiene o inicializa el timestamp de inicio del período de prueba (30 min)
 */
export function getOrCreateTrialStartTime(): number {
  if (typeof window === 'undefined') return Date.now();
  try {
    const stored = localStorage.getItem('klikpos_trial_start_ts') || localStorage.getItem('venematic_trial15m_start');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    const now = Date.now();
    localStorage.setItem('klikpos_trial_start_ts', String(now));
    return now;
  } catch {
    return Date.now();
  }
}

/**
 * Registra la instalación y el inicio del trial de 30 minutos en Firestore
 */
export async function registerTrialInstallation(
  customHwid?: string,
  storeName?: string,
  rif?: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') return { success: false };

  try {
    const hwid = (customHwid || getMachineHWID()).trim().toUpperCase();
    const startTime = getOrCreateTrialStartTime();
    const expiresAt = new Date(startTime + TRIAL_DURATION_MS).toISOString();

    const payload = {
      hwid,
      edition: 'street',
      storeName: storeName || 'Mi Negocio',
      rif: rif || 'Pendiente',
      installedAt: new Date(startTime).toISOString(),
      trialDurationMinutes: 30,
      trialExpiresAt: expiresAt,
      status: Date.now() >= (startTime + TRIAL_DURATION_MS) ? 'trial_expired' : 'trial_active',
      platform: typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconocido',
      screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Desconocido',
      lastSeenAt: new Date().toISOString()
    };

    if (firestoreDb) {
      const docRef = doc(firestoreDb, 'pos_installations', hwid);
      await setDoc(docRef, payload, { merge: true });
      try { localStorage.setItem('klikpos_trial_synced_firestore', 'true'); } catch {}
      return { success: true };
    }

    return { success: false, error: 'Firestore no inicializado' };
  } catch (err: any) {
    console.warn('[TrialManager] No se pudo registrar instalación en Firestore (modo offline):', err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Evalúa el estado actual de la prueba o licencia comercial
 */
export function evaluateTrialState(): TrialState {
  if (typeof window === 'undefined') {
    return {
      isLicensed: true,
      isTrial: false,
      isExpired: false,
      canOperate: true,
      remainingMs: TRIAL_DURATION_MS,
      remainingMinutes: 30,
      remainingSeconds: 0,
      formattedRemaining: '30:00',
    };
  }

  try {
    const hwid = getMachineHWID();
    const licenseStatus = getStoredLicenseStatus(hwid);

    // Si tiene una licencia activa comercial definitiva (no trial)
    if (licenseStatus.status === 'active' && licenseStatus.payload?.plan !== 'trial_15m' && (licenseStatus.payload?.plan as any) !== 'trial_30m') {
      return {
        isLicensed: true,
        isTrial: false,
        isExpired: false,
        canOperate: true,
        remainingMs: Infinity,
        remainingMinutes: 99999,
        remainingSeconds: 0,
        formattedRemaining: 'Permanente',
      };
    }

    // Período de prueba de 30 minutos
    const startTime = getOrCreateTrialStartTime();
    const elapsed = Date.now() - startTime;
    const remainingMs = Math.max(0, TRIAL_DURATION_MS - elapsed);
    const isExpired = remainingMs <= 0;

    const totalSec = Math.floor(remainingMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return {
      isLicensed: false,
      isTrial: true,
      isExpired,
      canOperate: !isExpired,
      remainingMs,
      remainingMinutes: mins,
      remainingSeconds: secs,
      formattedRemaining: formatted,
    };
  } catch {
    return {
      isLicensed: false,
      isTrial: true,
      isExpired: false,
      canOperate: true,
      remainingMs: TRIAL_DURATION_MS,
      remainingMinutes: 30,
      remainingSeconds: 0,
      formattedRemaining: '30:00',
    };
  }
}

/**
 * Genera la URL oficial de WhatsApp con el mensaje pre-armado de los 3 planes comerciales
 */
export function getWhatsAppActivationUrl(
  hwid: string,
  storeName?: string,
  rif?: string,
  planOption: 'cash' | 'credit' | 'vip' | string = 'cash'
): string {
  const cleanHwid = (hwid || '').trim().toUpperCase();
  const business = (storeName || '').trim() || 'Mi Negocio';
  const docRif = (rif || '').trim().toUpperCase() || 'Pendiente';

  let planLabel = 'Plan Contado $15 USD (Vitalicio de por vida, sin mensualidades)';
  if (planOption === 'credit') {
    planLabel = 'Plan Crédito $25 USD ($10 inicial + $15 en 15 días)';
  } else if (planOption === 'vip') {
    planLabel = 'Plan Vitalicio Pro $50 USD (Dividido en dos partes: 2 cuotas de $25 quincenal + Cloud 1 Año)';
  }

  const message = 
    `¡Hola KlikPOS! 🚀 He probado los 30 minutos de prueba en mi negocio y quiero activar mi licencia oficial.\n\n` +
    `🏪 *Comercio / Negocio:* ${business}\n` +
    `📋 *RIF o Cédula:* ${docRif}\n` +
    `💻 *ID del Equipo (HWID):* \`${cleanHwid}\`\n` +
    `💳 *Modalidad de Licencia:* ${planLabel}\n` +
    `📦 *Catálogo:* Mis productos y ventas están listos para seguir facturando.\n\n` +
    `Adjunto mi comprobante de pago para recibir mi Clave de Activación. ¡Muchas gracias!`;

  return `https://wa.me/${OFFICIAL_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
