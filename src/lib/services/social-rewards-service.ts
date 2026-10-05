// social-rewards-service.ts - Servicio de Recompensas y Redes Sociales con Actualización en Caliente (Hot OTA)
// Permite actualizar en vivo los enlaces de redes sociales, montos y promociones sin recompilar la app.

export interface SocialNetworkItem {
  id: string;
  name: string;
  handle: string;
  url: string;
  active: boolean;
}

export interface SocialRewardsConfig {
  campaignTitle: string;
  campaignSubtitle: string;
  brandTag: string;
  rewardAmountUSD: number;
  shareMessage: string;
  instructions: string[];
  whatsappSupportPhone: string;
  socialNetworks: SocialNetworkItem[];
  lastUpdated?: string;
}

export const DEFAULT_SOCIAL_CONFIG: SocialRewardsConfig = {
  campaignTitle: "Comparte en nuestras redes: Klikpos",
  campaignSubtitle: "¡Gana $5 USD por cada referido ilimitado y $5 USD al compartir en redes sociales!",
  brandTag: "Klikpos",
  rewardAmountUSD: 5.0,
  shareMessage: "🚀 ¡Estoy usando KlikPOS en mi negocio! Es súper rápido, calcula la tasa BCV automática, emite ticket térmico y funciona hasta sin internet. 100% recomendado para todo comercio. Síguelos en sus redes: Klikpos",
  instructions: [
    "Publica una foto, video o recomendación de KlikPOS en tus redes (Instagram, TikTok, WhatsApp Estados o Facebook).",
    "Menciona o etiqueta a Klikpos.",
    "Toma capture de pantalla de tu publicación.",
    "Envía el capture a nuestro WhatsApp de soporte con tu Pago Móvil o cuenta para recibir tus $5 USD al instante."
  ],
  whatsappSupportPhone: "584248298026",
  socialNetworks: [
    {
      id: "instagram",
      name: "Instagram",
      handle: "@klikpos",
      url: "https://instagram.com/klikpos",
      active: true
    },
    {
      id: "tiktok",
      name: "TikTok",
      handle: "@klikpos",
      url: "https://tiktok.com/@klikpos",
      active: true
    },
    {
      id: "facebook",
      name: "Facebook",
      handle: "Klikpos Oficial",
      url: "https://facebook.com/klikpos",
      active: true
    },
    {
      id: "whatsapp",
      name: "WhatsApp Soporte",
      handle: "+58 424-8298026",
      url: "https://wa.me/584248298026",
      active: true
    }
  ],
  lastUpdated: new Date().toISOString()
};

const REMOTE_SOCIAL_URL = 'https://raw.githubusercontent.com/klikposcloud-svg/klikpos-releases/main/social-links.json';
const LOCAL_SOCIAL_URL = '/social-links.json';
const STORAGE_KEY = 'klikpos_social_links_cache';

class SocialRewardsService {
  private currentConfig: SocialRewardsConfig = DEFAULT_SOCIAL_CONFIG;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        this.currentConfig = { ...DEFAULT_SOCIAL_CONFIG, ...JSON.parse(cached) };
      }
    } catch {
      this.currentConfig = DEFAULT_SOCIAL_CONFIG;
    }
  }

  public getConfig(): SocialRewardsConfig {
    return this.currentConfig;
  }

  /**
   * Actualización en caliente (Hot Update):
   * Consulta el manifest remoto de GitHub o el local con cache-busting.
   * Si hay cambios, actualiza la memoria y el localStorage inmediatamente.
   */
  public async fetchLatestConfig(): Promise<SocialRewardsConfig> {
    const urls = [
      `${REMOTE_SOCIAL_URL}?t=${Date.now()}`,
      `${LOCAL_SOCIAL_URL}?t=${Date.now()}`
    ];

    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(url, {
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data: Partial<SocialRewardsConfig> = await res.json();
          if (data && (data.campaignTitle || data.brandTag)) {
            this.currentConfig = {
              ...DEFAULT_SOCIAL_CONFIG,
              ...data,
              socialNetworks: data.socialNetworks && data.socialNetworks.length > 0
                ? data.socialNetworks
                : DEFAULT_SOCIAL_CONFIG.socialNetworks
            };
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentConfig));
            }
            return this.currentConfig;
          }
        }
      } catch {
        // Seguir al siguiente endpoint
      }
    }

    return this.currentConfig;
  }

  /**
   * Genera el enlace de WhatsApp para enviar el capture de redes y cobrar los $5 USD
   */
  public generateClaimRewardUrl(storeName?: string, phoneOrPagoMovil?: string): string {
    const phone = this.currentConfig.whatsappSupportPhone || '584248298026';
    const amount = this.currentConfig.rewardAmountUSD || 5.0;
    const brand = this.currentConfig.brandTag || 'Klikpos';

    const message =
      `¡Hola ${brand}! 🚀 Acabo de compartir en mis redes sociales recomendando a @${brand}.\n\n` +
      `📸 *Aquí adjunto mi capture de pantalla* para verificar mi publicación y recibir mi recompensa de *$${amount.toFixed(2)} USD*.\n\n` +
      `🏪 *Comercio / Negocio:* ${storeName || 'Mi Negocio'}\n` +
      `💳 *Datos para mi Pago Móvil / Pago:* ${phoneOrPagoMovil || 'Por favor indícame para enviártelos'}\n\n` +
      `¡Muchas gracias! Quedo a la espera de la confirmación.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }
}

export const socialRewardsService = new SocialRewardsService();
