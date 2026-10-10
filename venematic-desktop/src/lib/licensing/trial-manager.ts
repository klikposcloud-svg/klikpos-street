/**
 * KlikPOS Trial Manager - 15 Minutos de Evaluación Gratuita
 * Permite probar todas las funcionalidades del POS por 15 minutos exactos.
 * Al cumplirse el tiempo, activa suavemente el modal de conversión sin borrar
 * ningún dato, producto ni configuración.
 */

import { getStoredLicenseStatus } from './license-crypto';
import { getMachineHWID } from './hwid';

export const TRIAL_DURATION_MS = 3 * 60 * 60 * 1000; // 3 Horas de Evaluación Gratuita
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
 * Obtiene el timestamp de inicio del período de prueba (3 horas)
 */
export function getOrCreateTrialStartTime(): number {
  if (typeof window === 'undefined') return Date.now();
  try {
    const extendedV309 = localStorage.getItem('klikpos_trial_extended_v309');
    if (extendedV309 !== 'true') {
      const now = Date.now();
      localStorage.setItem('klikpos_trial_start_ts', String(now));
      localStorage.setItem('klikpos_trial_extended_v309', 'true');
      localStorage.setItem('klikpos_street_license_dismissed', 'true');
      localStorage.removeItem('venematic_trial15m_start');
      return now;
    }

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
      return true;
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
    return false;
  }
}

/**
 * Registra la instalación en segundo plano y notifica a Telegram
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

    notifyTelegramInstallation({
      hwid,
      edition,
      storeName: storeName || 'Mi Negocio',
      platform: typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconocido',
      screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Desconocido',
      installedAt: new Date(startTime).toISOString()
    }).catch(() => {});

    return { success: true };
  } catch (err: any) {
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
      remainingMinutes: 180,
      remainingSeconds: 0,
      formattedRemaining: '3h restantes',
    };
  }

  try {
    const hwid = getMachineHWID();
    const licenseStatus = getStoredLicenseStatus(hwid);

    // Si tiene una licencia activa comercial definitiva (no trial_15m)
    if (licenseStatus.status === 'active' && licenseStatus.payload?.plan !== 'trial_15m') {
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

    // Período de prueba de 15 minutos
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
      remainingMinutes: 15,
      remainingSeconds: 0,
      formattedRemaining: '15:00',
    };
  }
}

/**
 * Genera la URL oficial de WhatsApp con el mensaje pre-armado de alta conversión
 */
export function getWhatsAppActivationUrl(
  hwid: string,
  storeName?: string,
  rif?: string,
  planLabel: string = 'Promo 6 Meses con Nube'
): string {
  const cleanHwid = (hwid || '').trim().toUpperCase();
  const business = (storeName || '').trim() || 'Mi Negocio';
  const docRif = (rif || '').trim().toUpperCase() || 'Pendiente';

  const message = 
    `¡Hola KlikPOS! 🚀 Acabo de probar el sistema en mi negocio y quiero activar mi licencia oficial.\n\n` +
    `🏪 *Comercio / Negocio:* ${business}\n` +
    `📋 *RIF o Cédula:* ${docRif}\n` +
    `💻 *ID de mi Terminal (HWID):* \`${cleanHwid}\`\n` +
    `💳 *Plan solicitado:* ${planLabel}\n\n` +
    `Adjunto mi comprobante de pago para recibir mi Clave de Activación. ¡Muchas gracias!`;

  return `https://wa.me/${OFFICIAL_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
