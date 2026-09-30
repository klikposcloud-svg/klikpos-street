import { db } from '../db';

export interface MenuSyncSettings {
  enabled: boolean;
  developerPlanOverride: boolean;
  allowedModes: ('local' | 'lan')[];
  activeMode: 'local' | 'lan';
  lanPort: number;
  autoDeductStock: boolean;
  autoPrintKitchenTicket: boolean;
  assignedCashier: string;
}

export const DEFAULT_MENU_SYNC_SETTINGS: MenuSyncSettings = {
  enabled: true,
  developerPlanOverride: true,
  allowedModes: ['local', 'lan'],
  activeMode: 'local',
  lanPort: 3000,
  autoDeductStock: true,
  autoPrintKitchenTicket: false,
  assignedCashier: 'Caja Principal / Menú',
};

class MenuPosBridgeService {
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.initLocalChannel();
  }

  public initLocalChannel() {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    if (this.channel) return;

    try {
      this.channel = new BroadcastChannel('klikpos_sync_channel');
      this.channel.onmessage = async (event) => {
        await this.handleIncomingMessage(event.data);
      };
    } catch (e) {
      console.warn('BroadcastChannel initialization error:', e);
    }
  }

  private async handleIncomingMessage(payload: { type: string; data: any }) {
    if (!payload || !payload.type) return;

    const settingsRecord = await db.settings.get('menu_sync_config');
    const settings: MenuSyncSettings = settingsRecord?.value || DEFAULT_MENU_SYNC_SETTINGS;

    if (!settings.enabled && !settings.developerPlanOverride) {
      return;
    }

    switch (payload.type) {
      case 'SALE_COMPLETED':
        await this.recordSaleFromMenu(payload.data, settings);
        break;

      case 'REQUEST_CATALOG':
        await this.broadcastCurrentCatalog();
        break;

      case 'REQUEST_RATE':
        await this.broadcastCurrentRate();
        break;

      default:
        break;
    }
  }

  private async recordSaleFromMenu(saleData: any, settings: MenuSyncSettings) {
    try {
      if (!saleData || !saleData.items) return;

      const saleId = await db.sales.add({
        receiptNumber: saleData.receiptNumber || `MENU-${Date.now().toString().slice(-6)}`,
        timestamp: saleData.timestamp || new Date().toISOString(),
        items: saleData.items,
        subtotalUSD: saleData.subtotalUSD || 0,
        taxUSD: saleData.taxUSD || 0,
        totalUSD: saleData.totalUSD || 0,
        totalVES: saleData.totalVES || 0,
        bcvRate: saleData.bcvRate || 1,
        payments: saleData.payments || [{ method: 'cash_usd', amountUSD: saleData.totalUSD, amountVES: saleData.totalVES }],
        changeUSD: 0,
        changeVES: 0,
        cashierName: saleData.cashierName || settings.assignedCashier,
        customerDoc: saleData.customerDoc || '',
        customerName: saleData.customerName || 'Cliente Menú Digital',
        status: 'completed',
        source: 'menu_01_food',
      });

      if (settings.autoDeductStock) {
        for (const item of saleData.items) {
          const barcode = item.barcode;
          if (barcode) {
            const product = await db.products.where('barcode').equals(barcode).first();
            if (product && product.id) {
              const newStock = Math.max(0, product.stock - (item.qty || 1));
              await db.products.update(product.id, { stock: newStock });
            }
          }
        }
      }

      console.log(`[KlikPOS Menu Bridge] Venta #${saleId} registrada exitosamente desde Menú Interactivo.`);
    } catch (e) {
      console.error('[KlikPOS Menu Bridge] Error procesando venta:', e);
    }
  }

  public async broadcastCurrentCatalog() {
    if (!this.channel) return;
    try {
      const products = await db.products.toArray();
      const rateSetting = await db.settings.get('bcv_rate');
      const bcvRate = typeof rateSetting?.value === 'number' ? rateSetting.value : 865.0;

      this.channel.postMessage({
        type: 'CATALOG_SYNC_RESPONSE',
        data: {
          products,
          bcvRate,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.error('[KlikPOS Menu Bridge] Error emitiendo catalogo:', e);
    }
  }

  public async broadcastCurrentRate() {
    if (!this.channel) return;
    try {
      const rateSetting = await db.settings.get('bcv_rate');
      const bcvRate = typeof rateSetting?.value === 'number' ? rateSetting.value : 865.0;

      this.channel.postMessage({
        type: 'RATE_SYNC_RESPONSE',
        data: {
          rate: bcvRate,
        },
      });
    } catch (e) {
      console.error('[KlikPOS Menu Bridge] Error emitiendo tasa:', e);
    }
  }
}

export const menuPosBridge = new MenuPosBridgeService();
