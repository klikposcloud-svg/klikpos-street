/**
 * =====================================================================
 * VENEMATIC — Servicio de Detección Automática de Pago Móvil por Gmail
 * =====================================================================
 * Arquitectura:
 *   1. El negocio conecta su Gmail (OAuth 2.0 via Google Identity)
 *   2. Al seleccionar "Pago Móvil" en el modal de cobro, este servicio
 *      comienza a hacer polling de la inbox de Gmail cada 8 segundos.
 *   3. Detecta emails de notificación bancaria con patrones específicos
 *      de los principales bancos venezolanos.
 *   4. Extrae: monto en Bs, número de referencia, nombre del pagador,
 *      banco origen, teléfono pagador.
 *   5. Si el monto coincide (±2% tolerancia), confirma la venta automáticamente.
 * =====================================================================
 */

export interface PagoMovilConfirmation {
  referencia: string;
  monto: number;
  bancoOrigen: string;
  bancoDestino: string;
  telefonoPagador?: string;
  nombrePagador?: string;
  cedulaPagador?: string;
  emailSubject: string;
  emailDate: string;
  emailId: string;
  rawText: string;
}

export interface GmailMonitorConfig {
  accessToken: string;
  monitoredEmail: string;
  pollingIntervalMs: number;
  tolerancePct: number;
}

const STORAGE_KEY = 'venematic_gmail_monitor_config';
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

const BANK_PATTERNS = [
  { bank: 'Mercantil', senderRx: /mercantil/i, subjectRx: /pago m.vil|transferencia recibida/i, amountRx: /(?:monto|importe)[:\s]+Bs\.?\s*([\d.,]+)/i, refRx: /(?:referencia|operaci.n)[:\s#]+([A-Z0-9-]+)/i },
  { bank: 'Banesco',   senderRx: /banesco/i,   subjectRx: /pago m.vil|recibiste|transferencia/i, amountRx: /Bs\.?\s*([\d.,]+)/i, refRx: /(?:Operaci.n|Referencia)[:\s#]+([A-Z0-9-]+)/i },
  { bank: 'BDV',       senderRx: /bancodevenezuela|bdv/i, subjectRx: /pago m.vil|operaci.n exitosa/i, amountRx: /Bs\.?\s*([\d.,]+)/i, refRx: /(?:referencia)[:\s#]+([A-Z0-9-]+)/i },
  { bank: 'BOD',       senderRx: /\bbod\b|bancoocci/i, subjectRx: /pago m.vil|cobro/i, amountRx: /Bs\.?\s*([\d.,]+)/i, refRx: /(?:referencia|transacci.n)[:\s#]+([A-Z0-9-]+)/i },
  { bank: 'BNC',       senderRx: /\bbnc\b/i,  subjectRx: /pago m.vil|recibiste/i, amountRx: /Bs\.?\s*([\d.,]+)/i, refRx: /(?:ref|referencia)[:\s#]+([A-Z0-9-]+)/i },
  { bank: 'Bicentenario', senderRx: /bicentenario/i, subjectRx: /pago m.vil/i, amountRx: /Bs\.?\s*([\d.,]+)/i, refRx: /(?:referencia|operaci.n)[:\s#]+([A-Z0-9-]+)/i },
  { bank: 'Provincial', senderRx: /provincial|bbva/i, subjectRx: /pago m.vil|transferencia/i, amountRx: /Bs\.?\s*([\d.,]+)/i, refRx: /(?:referencia)[:\s#]+([A-Z0-9-]+)/i },
  // Fallback genérico
  { bank: 'Banco', senderRx: /.*/,  subjectRx: /pago m.vil|cobro recibido|transferencia recibida/i, amountRx: /Bs\.?\s*([\d.,]+)/i, refRx: /(?:referencia|n.mero)[:\s#]+([A-Z0-9-]+)/i },
];

function decodeBase64Url(str: string): string {
  try { return atob(str.replace(/-/g, '+').replace(/_/g, '/')); } catch { return ''; }
}

function extractEmailBody(payload: Record<string, unknown>): string {
  if (!payload) return '';
  const body = payload.body as { data?: string } | undefined;
  if (body?.data) return decodeBase64Url(body.data);
  const parts = payload.parts as Record<string, unknown>[] | undefined;
  if (parts) {
    let plain = '', html = '';
    for (const p of parts) {
      const mimeType = p.mimeType as string | undefined;
      const partBody = p.body as { data?: string } | undefined;
      if (mimeType === 'text/plain' && partBody?.data) plain = decodeBase64Url(partBody.data);
      else if (mimeType === 'text/html' && partBody?.data) {
        html = decodeBase64Url(partBody.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      } else if (p.parts) plain = extractEmailBody(p as Record<string, unknown>) || plain;
    }
    return plain || html;
  }
  return '';
}

function parseEmail(subject: string, body: string, senderEmail: string): Omit<PagoMovilConfirmation, 'emailDate' | 'emailId'> | null {
  const text = `${subject}\n${body}`;
  for (const bp of BANK_PATTERNS) {
    if (!bp.senderRx.test(senderEmail) && !bp.subjectRx.test(subject)) continue;
    const amountMatch = text.match(bp.amountRx);
    if (!amountMatch) continue;
    const monto = parseFloat(amountMatch[1].replace(/\./g, '').replace(',', '.'));
    if (isNaN(monto) || monto <= 0) continue;
    const refMatch = text.match(bp.refRx);
    return {
      referencia: refMatch?.[1]?.trim() ?? `AUTO-${Date.now()}`,
      monto,
      bancoOrigen: bp.bank,
      bancoDestino: 'Tu cuenta',
      emailSubject: subject,
      rawText: text.slice(0, 400),
    };
  }
  return null;
}

export class PagoMovilGmailMonitor {
  private config: GmailMonitorConfig | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private seen = new Set<string>();
  private onOk: ((c: PagoMovilConfirmation) => void) | null = null;
  private onErr: ((e: string) => void) | null = null;
  private active = false;
  private expectedVES = 0;

  constructor() { this.loadConfig(); }

  private loadConfig() {
    if (typeof window === 'undefined') return;
    try { const r = localStorage.getItem(STORAGE_KEY); if (r) this.config = JSON.parse(r); } catch {}
  }

  saveConfig(c: GmailMonitorConfig) {
    this.config = c;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch {}
  }

  clearConfig() { this.config = null; try { localStorage.removeItem(STORAGE_KEY); } catch {} }
  getConfig() { return this.config; }
  isConfigured() { return Boolean(this.config?.accessToken && this.config?.monitoredEmail); }

  async startMonitoring(expectedVES: number, onOk: (c: PagoMovilConfirmation) => void, onErr: (e: string) => void) {
    if (!this.config) { onErr('Gmail no configurado. Ve a Configuración → Pagos → Pago Móvil Gmail.'); return; }
    this.expectedVES = expectedVES;
    this.onOk = onOk; this.onErr = onErr; this.active = true;
    await this.markExisting();
    const ms = this.config.pollingIntervalMs || 8000;
    this.timer = setInterval(() => { if (this.active) this.poll(); }, ms);
  }

  stopMonitoring() {
    this.active = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.onOk = null; this.onErr = null;
  }

  private async markExisting() {
    try { (await this.fetchIds()).forEach(id => this.seen.add(id)); } catch {}
  }

  private async fetchIds(): Promise<string[]> {
    if (!this.config) return [];
    const q = encodeURIComponent('subject:(pago movil OR transferencia OR cobro recibido OR operacion exitosa) newer_than:1d');
    const res = await fetch(`${GMAIL_API}/messages?q=${q}&maxResults=10`, { headers: { Authorization: `Bearer ${this.config.accessToken}` } });
    if (!res.ok) {
      if (res.status === 401) { this.onErr?.('Token Gmail expirado. Reconecta tu cuenta.'); this.stopMonitoring(); }
      return [];
    }
    const data = await res.json();
    return (data.messages ?? []).map((m: { id: string }) => m.id);
  }

  private async poll() {
    try {
      const ids = await this.fetchIds();
      for (const id of ids.filter(id => !this.seen.has(id))) {
        this.seen.add(id);
        await this.processEmail(id);
      }
    } catch {}
  }

  private async processEmail(id: string) {
    if (!this.config) return;
    const res = await fetch(`${GMAIL_API}/messages/${id}?format=full`, { headers: { Authorization: `Bearer ${this.config.accessToken}` } });
    if (!res.ok) return;
    const msg = await res.json();
    const headers: { name: string; value: string }[] = msg.payload?.headers ?? [];
    const subject = headers.find(h => h.name === 'Subject')?.value ?? '';
    const from    = headers.find(h => h.name === 'From')?.value ?? '';
    const body    = extractEmailBody(msg.payload as Record<string, unknown>);
    const parsed  = parseEmail(subject, body, from);
    if (!parsed) return;
    const tol = (this.config.tolerancePct || 2) / 100;
    if (parsed.monto >= this.expectedVES * (1 - tol) && parsed.monto <= this.expectedVES * (1 + tol)) {
      this.onOk?.({ ...parsed, emailId: id, emailDate: new Date().toISOString() });
      this.stopMonitoring();
    }
  }
}

export const pagoMovilMonitor = new PagoMovilGmailMonitor();

export function initiateGmailOAuth(clientId: string) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: window.location.origin + '/dashboard/settings',
    response_type: 'token',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    include_granted_scopes: 'true',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function extractOAuthTokenFromUrl(): { accessToken: string; expiresIn: number } | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = params.get('access_token');
  if (!accessToken) return null;
  window.history.replaceState({}, '', window.location.pathname + window.location.search);
  return { accessToken, expiresIn: parseInt(params.get('expires_in') ?? '3600') };
}

export async function verifyGmailToken(accessToken: string): Promise<{ email: string } | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return null;
    const d = await res.json();
    return { email: d.email };
  } catch { return null; }
}
