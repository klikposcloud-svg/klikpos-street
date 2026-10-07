import { EventEmitter } from 'events';
import { scannerEmitter } from '@/lib/scanner-events';

export interface WebhookPagoMovil {
  id: string;
  referencia: string;
  monto: number;
  banco: string;
  telefono?: string;
  pagador?: string;
  cedula?: string;
  timestamp: number;
  rawText?: string;
  used: boolean;
  usedAt?: number;
}

// Global buffer across hot reloads in Next.js
const globalForWebhook = globalThis as unknown as {
  webhookPaymentsBuffer?: WebhookPagoMovil[];
  webhookSecret?: string;
};

if (!globalForWebhook.webhookPaymentsBuffer) {
  globalForWebhook.webhookPaymentsBuffer = [];
}
export const webhookPaymentsBuffer = globalForWebhook.webhookPaymentsBuffer;

export const DEFAULT_WEBHOOK_SECRET = 'klikpos-pm-secure-secret-2026';

export function getWebhookSecret(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('klikpos_pm_webhook_secret') || 
           localStorage.getItem('venematic_pm_webhook_secret') || 
           DEFAULT_WEBHOOK_SECRET;
  }
  return globalForWebhook.webhookSecret || DEFAULT_WEBHOOK_SECRET;
}

export function setWebhookSecret(secret: string) {
  globalForWebhook.webhookSecret = secret;
  if (typeof window !== 'undefined') {
    localStorage.setItem('klikpos_pm_webhook_secret', secret);
  }
}

/**
 * Normaliza montos en formato venezolano o estándar a número flotante.
 * Ej: "1.250,50" -> 1250.50 | "150,00" -> 150.00 | "150.00" -> 150.00
 */
export function normalizeAmountVES(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  let str = String(val).trim();
  // Si contiene puntos y comas (ej 1.250,50), quitamos el punto y cambiamos la coma a punto
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // Si solo tiene coma (ej 150,50), cambiamos la coma a punto
    str = str.replace(',', '.');
  }
  const parsed = parseFloat(str.replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parser inteligente de mensajes bancarios venezolanos (SMS / Notificaciones Push).
 */
export function parseBankNotificationText(raw: string): Partial<WebhookPagoMovil> {
  const text = raw.trim();
  let banco = 'Desconocido';
  let monto = 0;
  let referencia = '';
  let telefono = '';
  let pagador = '';

  // 1. Detectar Banco
  if (/bancodevenezuela|bdv|pagoclave/i.test(text)) {
    banco = 'Banco de Venezuela';
  } else if (/banesco|pagomovil banesco/i.test(text)) {
    banco = 'Banesco';
  } else if (/mercantil|tpago/i.test(text)) {
    banco = 'Mercantil';
  } else if (/bancamiga/i.test(text)) {
    banco = 'Bancamiga';
  } else if (/provincial|bbva|dinero rapido/i.test(text)) {
    banco = 'BBVA Provincial';
  } else if (/bnc|banco nacional de cr[eé]dito/i.test(text)) {
    banco = 'BNC';
  } else if (/bicentenario/i.test(text)) {
    banco = 'Banco Bicentenario';
  } else if (/bancaribe|mi pago bancaribe/i.test(text)) {
    banco = 'Bancaribe';
  } else if (/tesoro/i.test(text)) {
    banco = 'Banco del Tesoro';
  } else if (/activo/i.test(text)) {
    banco = 'Banco Activo';
  } else if (/plaza/i.test(text)) {
    banco = 'Banco Plaza';
  } else if (/exterior/i.test(text)) {
    banco = 'Banco Exterior';
  } else if (/caroni/i.test(text)) {
    banco = 'Banco Caroní';
  } else if (/100%|cien por ciento/i.test(text)) {
    banco = '100% Banco';
  } else if (/banco/i.test(text)) {
    banco = 'Pago Móvil';
  }

  // 2. Extraer Monto
  // Formatos comunes: "Bs. 150,00", "Bs 1.250,50", "Bs.S 150,00", "BsD 150,00", "por Bs. 150,00", "monto: 150,00", "150,00 Bs"
  const amountMatch = text.match(/(?:bs\.?s?|bsd|ves|monto[:\s]*bs\.?|importe[:\s]*bs\.?|por\s+bs\.?)\s*([0-9.,]+)/i) ||
                      text.match(/([0-9]+[.,][0-9]{2})\s*(?:bs\.?|ves)/i);
  if (amountMatch && amountMatch[1]) {
    monto = normalizeAmountVES(amountMatch[1]);
  }

  // 3. Extraer Teléfono (0414, 0424, 0412, 0416, 0426) antes de la referencia para no confundirlos
  const phoneMatch = text.match(/\b(0412|0414|0424|0416|0426)[0-9]{7}\b/);
  if (phoneMatch) {
    telefono = phoneMatch[0];
  }

  // 4. Extraer Referencia
  // Patrones comunes: "ref: 123456", "referencia 12345678", "operacion: 123456", "nro 123456", "secuencia 123456"
  const refMatch = text.match(/(?:ref(?:erencia)?|operaci[oó]n|secuencia|nro\.?|comprobante|recibo)[:\s#.]+([A-Za-z0-9]{4,14})/i) ||
                   text.match(/\b([0-9]{6,12})\b/);
  if (refMatch && refMatch[1]) {
    const candidate = refMatch[1].trim();
    // Evitar que capture el teléfono o una fecha como referencia
    if (candidate !== telefono && !candidate.startsWith('0412') && !candidate.startsWith('0414') && !candidate.startsWith('0424') && !candidate.startsWith('0416') && !candidate.startsWith('0426')) {
      referencia = candidate;
    }
  }

  // 5. Extraer Pagador (si viene "de NOMBRE APELLIDO" o similar)
  const pagadorMatch = text.match(/(?:de|del)\s+([A-Za-zÁ-ÿ\s]{4,30}?)(?:,|\.|\bref\b|\btel\b|\btlf\b|\bpor\b)/i);
  if (pagadorMatch && pagadorMatch[1]) {
    pagador = pagadorMatch[1].trim();
  }

  return {
    banco,
    monto,
    referencia,
    telefono,
    pagador,
    rawText: text
  };
}

/**
 * Registra una confirmación entrante en el buffer y emite el evento en vivo.
 */
export function registerWebhookPayment(data: {
  referencia: string;
  monto: number;
  banco?: string;
  telefono?: string;
  pagador?: string;
  cedula?: string;
  rawText?: string;
}): WebhookPagoMovil {
  // Evitar duplicados por referencia dentro de los últimos 20 minutos
  const existing = webhookPaymentsBuffer.find(p => 
    p.referencia.toUpperCase() === data.referencia.trim().toUpperCase() &&
    Date.now() - p.timestamp < 1000 * 60 * 20
  );

  if (existing) {
    return existing;
  }

  const newPayment: WebhookPagoMovil = {
    id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    referencia: data.referencia.trim().toUpperCase(),
    monto: Number(data.monto) || 0,
    banco: data.banco || 'Pago Móvil',
    telefono: data.telefono,
    pagador: data.pagador,
    cedula: data.cedula,
    timestamp: Date.now(),
    rawText: data.rawText,
    used: false
  };

  // Agregar al inicio del buffer (máximo 100 elementos)
  webhookPaymentsBuffer.unshift(newPayment);
  if (webhookPaymentsBuffer.length > 100) {
    webhookPaymentsBuffer.pop();
  }

  // Notificar por el event emitter global a todas las cajas conectadas por SSE
  try {
    scannerEmitter.emit('payment_confirmed', newPayment);
  } catch (err) {
    console.error('[WebhookStore] Error emitiendo evento payment_confirmed:', err);
  }

  return newPayment;
}

/**
 * Busca un pago en el buffer que coincida con el monto solicitado (con tolerancia) y no haya sido usado.
 */
export function findMatchingPayment(targetVES: number, tolerancePct: number = 2): WebhookPagoMovil | null {
  const now = Date.now();
  // Considerar pagos recibidos en los últimos 30 minutos
  const validPayments = webhookPaymentsBuffer.filter(p => !p.used && (now - p.timestamp) < 1000 * 60 * 30);

  return validPayments.find(p => {
    const diff = Math.abs(p.monto - targetVES);
    const maxDiff = (targetVES * tolerancePct) / 100;
    return diff <= Math.max(maxDiff, 0.5); // Permite hasta 0.50 Bs de diferencia o el porcentaje de tolerancia
  }) || null;
}

/**
 * Marca una referencia como consumida por una venta para que no se use dos veces.
 */
export function markPaymentAsUsed(referencia: string) {
  const p = webhookPaymentsBuffer.find(item => item.referencia.toUpperCase() === referencia.trim().toUpperCase());
  if (p) {
    p.used = true;
    p.usedAt = Date.now();
  }
}
