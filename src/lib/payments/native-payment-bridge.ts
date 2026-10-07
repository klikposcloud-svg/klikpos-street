'use client';

import { parseBankNotificationText } from '@/lib/payments/pago-movil-webhook-store';

/**
 * Puente Pago Móvil nativo (APK KlikPOS Street / Móvil).
 * - Recibe eventos en vivo del MainActivity ('klikpos:sms_received' / 'venematic:sms_received').
 * - Recupera SMS/notificaciones que llegaron con la app cerrada vía plugin KlikSms.drain().
 * - Guarda todo en localStorage para que la pantalla de cobro encuentre el pago aunque
 *   el SMS haya llegado ANTES de abrir "Pago Móvil".
 */

export interface NativePaymentItem {
  id: string;
  body: string;
  sender: string;
  source: string;
  timestamp: number;
  monto: number;
  referencia: string;
  banco: string;
  telefono?: string;
  pagador?: string;
  used: boolean;
}

const STORAGE_KEY = 'klikpos_native_pm_buffer';
const MAX_AGE_MS = 1000 * 60 * 60 * 2;
export const NATIVE_PAYMENT_EVENT = 'klikpos:payment_text';

type KlikSmsPlugin = {
  drain: () => Promise<{ items: any[] }>;
  status: () => Promise<{ sms: boolean; notifications: boolean }>;
  requestSms: () => Promise<{ sms: boolean }>;
  openNotificationAccess: () => Promise<void>;
  openAppSettings: () => Promise<void>;
};

function getPlugin(): KlikSmsPlugin | null {
  if (typeof window === 'undefined') return null;
  return (window as any).Capacitor?.Plugins?.KlikSms ?? null;
}

export function isNativeApp(): boolean {
  return !!getPlugin();
}

function load(): NativePaymentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: NativePaymentItem[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    return list.filter(i => now - i.timestamp < MAX_AGE_MS);
  } catch {
    return [];
  }
}

function save(list: NativePaymentItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {}
}

function ingest(raw: any) {
  const body = String(raw?.body || raw?.message || '').trim();
  if (!body) return;
  const id = String(raw?.id || `ev_${Date.now()}_${body.length}`);
  const list = load();
  if (list.some(i => i.id === id || (i.body === body && Math.abs(i.timestamp - (raw?.timestamp || Date.now())) < 60000))) return;

  const parsed = parseBankNotificationText(body);
  if (!parsed.monto) return; // no parece un pago

  const item: NativePaymentItem = {
    id,
    body,
    sender: String(raw?.sender || ''),
    source: String(raw?.source || 'sms'),
    timestamp: Number(raw?.timestamp) || Date.now(),
    monto: parsed.monto,
    referencia: parsed.referencia || '',
    banco: parsed.banco || 'Pago Móvil',
    telefono: parsed.telefono,
    pagador: parsed.pagador,
    used: false,
  };
  list.unshift(item);
  save(list);
  window.dispatchEvent(new CustomEvent(NATIVE_PAYMENT_EVENT, { detail: item }));
}

export async function drainNativeQueue() {
  const plugin = getPlugin();
  if (!plugin) return;
  try {
    const res = await plugin.drain();
    (res?.items || []).forEach(ingest);
  } catch {}
}

let installed = false;
export function installNativePaymentBridge() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const onEvent = (e: Event) => ingest((e as CustomEvent).detail);
  window.addEventListener('klikpos:sms_received', onEvent);
  window.addEventListener('venematic:sms_received', onEvent);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') drainNativeQueue();
  });
  drainNativeQueue();
}

/** Busca un pago no usado (últimos 30 min) cuyo monto coincida con el total esperado. */
export function findNativeMatch(targetVES: number): NativePaymentItem | null {
  if (!targetVES || targetVES <= 0) return null;
  const now = Date.now();
  const tol = Math.max(targetVES * 0.02, 0.5);
  return load().find(i => !i.used && now - i.timestamp < 1000 * 60 * 30 && Math.abs(i.monto - targetVES) <= tol) || null;
}

export function getRecentNativePayments(): NativePaymentItem[] {
  return load();
}

export function markNativePaymentUsed(idOrRef: string) {
  const list = load();
  const key = idOrRef.trim().toUpperCase();
  list.forEach(i => {
    if (i.id === idOrRef || (i.referencia && i.referencia.toUpperCase() === key)) i.used = true;
  });
  save(list);
}

export async function getNativePermissionStatus(): Promise<{ sms: boolean; notifications: boolean } | null> {
  const plugin = getPlugin();
  if (!plugin) return null;
  try { return await plugin.status(); } catch { return null; }
}

export async function requestNativeSmsPermission() {
  try { await getPlugin()?.requestSms(); } catch {}
}

export async function openNativeNotificationAccess() {
  try { await getPlugin()?.openNotificationAccess(); } catch {}
}

export async function openNativeAppSettings() {
  try { await getPlugin()?.openAppSettings(); } catch {}
}
