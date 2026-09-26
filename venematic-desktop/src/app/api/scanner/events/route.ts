import { NextRequest } from 'next/server';
import { scannerEmitter, scannerSessions } from '@/lib/scanner-events';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = req.nextUrl.searchParams.get('session') || 'caja-1';

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connected event
  const sendEvent = async (event: string, data: any) => {
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(payload));
    } catch {
      // Stream may be closed
    }
  };

  sendEvent('connected', { session, timestamp: Date.now() });

  // Enviar estado actual del celular de inmediato
  const currentPhone = scannerSessions.get(session);
  const isOnline = Boolean(currentPhone && currentPhone.connected && Date.now() - currentPhone.lastSeen < 12000);
  sendEvent('phone_status', {
    session,
    connected: isOnline,
    deviceName: isOnline ? currentPhone?.deviceName : '',
    timestamp: Date.now(),
  });

  const onScan = (data: any) => {
    if (!data.session || data.session === session) {
      sendEvent('scan', data);
    }
  };

  const onNewProduct = (data: any) => {
    if (!data.session || data.session === session) {
      sendEvent('new_product', data);
    }
  };

  const onPhoneStatus = (data: any) => {
    if (!data.session || data.session === session) {
      sendEvent('phone_status', data);
    }
  };

  const onPhotoReceived = (data: any) => {
    if (!data.session || data.session === session) {
      sendEvent('photo_received', data);
    }
  };

  const onMobileSale = (data: any) => {
    sendEvent('mobile_sale_completed', data);
  };

  const onInventoryUpdated = (data: any) => {
    sendEvent('inventory_updated', data);
  };

  const onRequestInventory = (data: any) => {
    // Pide al desktop que envíe el inventario (el desktop lo escucha via SSE)
    sendEvent('request_inventory', data);
  };

  const onRemoteTrigger = (data: any) => {
    sendEvent('remote_trigger', data);
  };

  const onPaymentConfirmed = (data: any) => {
    sendEvent('payment_confirmed', data);
  };

  scannerEmitter.on('scan', onScan);
  scannerEmitter.on('new_product', onNewProduct);
  scannerEmitter.on('phone_status', onPhoneStatus);
  scannerEmitter.on('photo_received', onPhotoReceived);
  scannerEmitter.on('mobile_sale_completed', onMobileSale);
  scannerEmitter.on('inventory_updated', onInventoryUpdated);
  scannerEmitter.on('request_inventory', onRequestInventory);
  scannerEmitter.on('remote_trigger', onRemoteTrigger);
  scannerEmitter.on('payment_confirmed', onPaymentConfirmed);

  // Keep alive ping every 15s
  const interval = setInterval(() => {
    sendEvent('ping', { time: Date.now() });
  }, 15000);

  req.signal.addEventListener('abort', () => {
    clearInterval(interval);
    scannerEmitter.off('scan', onScan);
    scannerEmitter.off('new_product', onNewProduct);
    scannerEmitter.off('phone_status', onPhoneStatus);
    scannerEmitter.off('photo_received', onPhotoReceived);
    scannerEmitter.off('mobile_sale_completed', onMobileSale);
    scannerEmitter.off('inventory_updated', onInventoryUpdated);
    scannerEmitter.off('request_inventory', onRequestInventory);
    scannerEmitter.off('remote_trigger', onRemoteTrigger);
    scannerEmitter.off('payment_confirmed', onPaymentConfirmed);
    writer.close().catch(() => {});
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
