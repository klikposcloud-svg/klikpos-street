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
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const TRIAL_DURATION_MS = 3 * 60 * 60 * 1000; // 3 Horas de Evaluación Gratuita (180 minutos)
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
 * Reinicia o reactiva el período de prueba de 3 horas desde este momento
 */
export function reactivateTrialFor3Hours(): void {
  if (typeof window === 'undefined') return;
  try {
    const now = Date.now();
    localStorage.setItem('klikpos_trial_start_ts', String(now));
    localStorage.setItem('klikpos_trial_extended_3h_v6', 'true');
    localStorage.removeItem('venematic_trial15m_start');
    localStorage.removeItem('klikpos_trial_force_expired');
    window.dispatchEvent(new CustomEvent('klikpos:trial-reactivated', { detail: { now } }));
  } catch {}
}

/**
 * Obtiene o inicializa el timestamp de inicio del período de prueba (3 horas)
 */
export function getOrCreateTrialStartTime(): number {
  if (typeof window === 'undefined') return Date.now();
  try {
    // Si la actualización a v3.0.9 no se ha activado aún en este dispositivo, garantizamos 180 min frescos
    const extendedV309 = localStorage.getItem('klikpos_trial_extended_v309');
    if (extendedV309 !== 'true') {
      const now = Date.now();
      localStorage.setItem('klikpos_trial_start_ts', String(now));
      localStorage.setItem('klikpos_trial_extended_v309', 'true');
      localStorage.removeItem('venematic_trial15m_start');
      localStorage.removeItem('klikpos_trial_force_expired');
      return now;
    }

    const extended = localStorage.getItem('klikpos_trial_extended_3h_v6');
    if (extended !== 'true') {
      const now = Date.now();
      localStorage.setItem('klikpos_trial_start_ts', String(now));
      localStorage.setItem('klikpos_trial_extended_3h_v6', 'true');
      localStorage.removeItem('venematic_trial15m_start');
      return now;
    }

    const stored = localStorage.getItem('klikpos_trial_start_ts');
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

export const TELEGRAM_BOT_TOKEN = '8699572842:AAHyw4tBMMC6YdqeGexrOqhQzNf2NdnH--M';
export const TELEGRAM_CHAT_ID = '8681182877';

/**
 * Notifica a Telegram en tiempo real cuando un dispositivo instala o abre KlikPOS por primera vez
 */
export async function notifyTelegramInstallation(data: {
  hwid: string;
  edition: string;
  storeName: string;
  platform: string;
  screen: string;
  installedAt: string;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const notifyKey = `klikpos_telemetry_notified_${data.hwid}`;
    if (localStorage.getItem(notifyKey) === 'true') {
      return true; // Ya notificado previamente
    }

    let devType = 'Dispositivo';
    if (/android/i.test(data.platform)) devType = '📱 Android';
    else if (/windows/i.test(data.platform)) devType = '💻 PC Windows';
    else if (/iphone|ipad/i.test(data.platform)) devType = '📱 iOS';
    else devType = '🌐 Web Client';

    const editionName = data.edition === 'street'
      ? 'KlikPOS Street Food'
      : data.edition === 'movil'
      ? 'KlikPOS Móvil Full'
      : 'KlikPOS Suite Desktop';

    const msg = [
      `🎉 *¡NUEVA INSTALACIÓN KLIKPOS DETECTADA!*`,
      `📦 *Edición:* ${editionName}`,
      `🆔 *Terminal ID:* \`${data.hwid}\``,
      `🏪 *Negocio:* ${data.storeName}`,
      `⚙️ *Equipo:* ${devType}`,
      `📐 *Pantalla:* ${data.screen}`,
      `🕒 *Fecha:* ${new Date(data.installedAt).toLocaleString('es-VE')}`,
      `⏳ *Período de Prueba:* 180 Minutos (3h) Iniciados`
    ].join('\n');

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: msg,
        parse_mode: 'Markdown'
      })
    });

    if (res.ok) {
      localStorage.setItem(notifyKey, 'true');
      return true;
    }
    return false;
  } catch {
    // Modo offline silencioso - se reintentará en la siguiente apertura cuando tenga conexión
    return false;
  }
}

/**
 * Registra la instalación y el inicio del trial de 3 horas en Firestore y notifica a Telegram
 */
export async function registerTrialInstallation(
  customHwid?: string,
  storeName?: string,
  rif?: string,
  edition: string = 'street'
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') return { success: false };

  try {
    const hwid = (customHwid || getMachineHWID()).trim().toUpperCase();
    const startTime = getOrCreateTrialStartTime();
    const expiresAt = new Date(startTime + TRIAL_DURATION_MS).toISOString();

    const payload = {
      hwid,
      edition,
      storeName: storeName || 'Mi Negocio',
      rif: rif || 'Pendiente',
      installedAt: new Date(startTime).toISOString(),
      trialDurationMinutes: 180,
      trialExpiresAt: expiresAt,
      status: Date.now() >= (startTime + TRIAL_DURATION_MS) ? 'trial_expired' : 'trial_active',
      platform: typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconocido',
      screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Desconocido',
      lastSeenAt: new Date().toISOString()
    };

    // Disparar notificación en segundo plano a Telegram sin bloquear el POS
    notifyTelegramInstallation({
      hwid,
      edition,
      storeName: payload.storeName,
      platform: payload.platform,
      screen: payload.screen,
      installedAt: payload.installedAt
    }).catch(() => {});

    if (firestoreDb) {
      const docRef = doc(firestoreDb, 'pos_installations', hwid);
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remoteData = snap.data();
          if (remoteData?.status === 'suspended' || remoteData?.status === 'revoked' || remoteData?.isSuspended === true) {
            localStorage.setItem('klikpos_license_revoked', 'true');
            localStorage.removeItem('venematic_activated_license_payload');
          } else if (remoteData?.status === 'active' || remoteData?.status === 'trial_active') {
            localStorage.removeItem('klikpos_license_revoked');
          }
        }
      } catch {}

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
 * Evalúa el estado actual de la prueba o licencia comercial (3 Horas)
 */
export function evaluateTrialState(): TrialState {
  if (typeof window === 'undefined') {
    return {
      isLicensed: false,
      isTrial: true,
      isExpired: false,
      canOperate: true,
      remainingMs: TRIAL_DURATION_MS,
      remainingMinutes: 180,
      remainingSeconds: 0,
      formattedRemaining: '3h restantes',
    };
  }

  try {
    // 0. Si la licencia fue suspendida o revocada remotamente por falta de pago
    const isRevoked = localStorage.getItem('klikpos_license_revoked') === 'true';
    if (isRevoked) {
      return {
        isLicensed: false,
        isTrial: false,
        isExpired: true,
        canOperate: false,
        remainingMs: 0,
        remainingMinutes: 0,
        remainingSeconds: 0,
        formattedRemaining: 'Licencia Suspendida',
      };
    }

    const hwid = getMachineHWID();
    const licenseStatus = getStoredLicenseStatus(hwid);

    // 1. Si el usuario ya activó su licencia comercial formal (Contado $15, Crédito $20 o VIP $50)
    if (licenseStatus.status === 'active') {
      return {
        isLicensed: true,
        isTrial: false,
        isExpired: false,
        canOperate: true,
        remainingMs: Infinity,
        remainingMinutes: 99999,
        remainingSeconds: 0,
        formattedRemaining: 'Licencia Oficial Activa',
      };
    }

    // 2. Si no tiene licencia, evaluar las 3 horas de prueba
    const startTs = getOrCreateTrialStartTime();
    const elapsed = Date.now() - startTs;
    const remainingMs = Math.max(0, TRIAL_DURATION_MS - elapsed);

    if (remainingMs > 0) {
      const remainingSecs = Math.floor(remainingMs / 1000);
      const hours = Math.floor(remainingSecs / 3600);
      const mins = Math.floor((remainingSecs % 3600) / 60);
      const secs = remainingSecs % 60;
      const formatted = hours > 0 
        ? `${hours}h ${String(mins).padStart(2, '0')}m restantes`
        : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} min`;

      return {
        isLicensed: false,
        isTrial: true,
        isExpired: false,
        canOperate: true,
        remainingMs,
        remainingMinutes: Math.floor(remainingSecs / 60),
        remainingSeconds: secs,
        formattedRemaining: formatted,
      };
    } else {
      // 3. Período de 3 horas expirado
      return {
        isLicensed: false,
        isTrial: false,
        isExpired: true,
        canOperate: false,
        remainingMs: 0,
        remainingMinutes: 0,
        remainingSeconds: 0,
        formattedRemaining: 'Prueba 3 Horas Finalizada',
      };
    }
  } catch (err) {
    console.warn('[TrialManager] Error evaluando estado de prueba:', err);
    return {
      isLicensed: false,
      isTrial: true,
      isExpired: false,
      canOperate: true,
      remainingMs: TRIAL_DURATION_MS,
      remainingMinutes: 180,
      remainingSeconds: 0,
      formattedRemaining: '3h restantes',
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
    planLabel = 'Plan Financiado $20 USD ($10 inicial hoy + $10 a la quincena)';
  } else if (planOption === 'vip') {
    planLabel = 'Plan Vitalicio Pro $50 USD (2 cuotas de $25 quincenal + 24 Meses Cloud)';
  }

  const message = 
    `¡Hola KlikPOS! 🚀 He probado las 3 horas de prueba en mi negocio y quiero activar mi licencia oficial.\n\n` +
    `🏪 *Comercio / Negocio:* ${business}\n` +
    `📋 *RIF o Cédula:* ${docRif}\n` +
    `💻 *ID del Equipo (HWID):* \`${cleanHwid}\`\n` +
    `💳 *Modalidad de Licencia:* ${planLabel}\n` +
    `📦 *Catálogo:* Mis productos y ventas están listos para seguir facturando.\n\n` +
    `Adjunto mi comprobante de pago para recibir mi Clave de Activación. ¡Muchas gracias!`;

  return `https://wa.me/${OFFICIAL_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
