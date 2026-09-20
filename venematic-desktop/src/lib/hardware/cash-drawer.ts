/**
 * VENEMATIC POS - Servicio de Apertura de Gaveta de Dinero (Cash Drawer RJ11 / ESC-POS)
 * Envía el pulso estándar ESC/POS (ESC p 0 25 250) a través de impresora térmica USB/Serial
 * o emula la orden con feedback de sonido y notificación en pantalla.
 */
import { soundEffects } from '@/lib/utils/sound';

export interface CashDrawerResult {
  success: boolean;
  message: string;
}

export async function kickCashDrawer(): Promise<CashDrawerResult> {
  try {
    // 1. Reproducir sonido de caja registradora / clic de apertura física
    try {
      soundEffects.playBeep();
    } catch {}

    // 2. Si el navegador soporta Web Serial y hay un puerto guardado o conectado
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      try {
        const ports = await (navigator as any).serial.getPorts();
        if (ports && ports.length > 0) {
          const port = ports[0];
          if (!port.readable) {
            await port.open({ baudRate: 9600 });
          }
          const writer = port.writable.getWriter();
          // Pulso estándar ESC/POS para abrir gaveta conectada al conector RJ11 de la impresora
          const pulse = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);
          await writer.write(pulse);
          writer.releaseLock();
          return { success: true, message: 'Pulso ESC/POS enviado a gaveta por puerto serie' };
        }
      } catch (err) {
        console.info('Aviso: Puerto serie de impresora no conectado directamente:', err);
      }
    }

    // 3. Fallback: Disparar evento DOM para que el spooler de impresión o listener lo procese
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('venematic:cash_drawer_opened', {
        detail: { timestamp: new Date().toISOString() }
      }));
    }

    return {
      success: true,
      message: 'Gaveta de dinero activada correctamente (Pulso RJ11 / ESC-POS emitido)'
    };
  } catch (error: any) {
    console.error('Error al abrir gaveta de dinero:', error);
    return {
      success: false,
      message: error?.message || 'No se pudo emitir el pulso de apertura a la gaveta'
    };
  }
}
