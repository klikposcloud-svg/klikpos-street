import { NextRequest, NextResponse } from 'next/server';
import { scannerEmitter } from '@/lib/scanner-events';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

import masterCatalog from '@/lib/data/master-catalog.json';
import { fetchLiveBcvRate, getSharedBcvState, setSharedBcvState } from '@/lib/services/bcv-service';

// Caché en memoria de productos compartidos por la caja para consulta rápida del celular
// Inicializado con el Catálogo Maestro (+130 productos) para disponibilidad inmediata
let cachedProducts: any[] = Array.isArray(masterCatalog) && masterCatalog.length > 0 ? masterCatalog : [];
let lastCacheUpdate = Date.now();

// Sincronizar en memoria cuando cualquier otro componente o endpoint actualice la tasa BCV
scannerEmitter.on('inventory_updated', (data: any) => {
  if (typeof data?.bcvRate === 'number' && data.bcvRate > 0) {
    setSharedBcvState({ rate: data.bcvRate });
  }
});

export async function GET(req: NextRequest) {
  try {
    // Si la caché está vacía, notificar al desktop que envíe el inventario
    if (cachedProducts.length === 0) {
      cachedProducts = Array.isArray(masterCatalog) ? masterCatalog : [];
      scannerEmitter.emit('request_inventory', { timestamp: Date.now() });
    }

    // Asegurar que la tasa BCV esté actualizada en vivo (al inicio o cada 15 min)
    let shared = getSharedBcvState();
    if (shared.updatedAt === 0 || Date.now() - shared.updatedAt > 15 * 60 * 1000) {
      try {
        const live = await fetchLiveBcvRate();
        if (live.success && live.rate > 0) {
          shared = setSharedBcvState({
            rate: live.rate,
            date: live.date,
            source: live.source,
            lastUpdated: live.lastUpdated,
            isManual: false,
          });
        }
      } catch (e) {
        console.warn('[Scanner Inventory] Error consultando tasa BCV en vivo:', e);
      }
    }

    return NextResponse.json({
      success: true,
      products: cachedProducts,
      bcvRate: shared.rate,
      count: cachedProducts.length,
      updatedAt: lastCacheUpdate,
      needsSync: cachedProducts.length === 0,
    }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { products = [], bcvRate, requestSync } = body;

    // El celular pide sincronización (no envía productos, solo pide que el desktop los mande)
    if (requestSync) {
      scannerEmitter.emit('request_inventory', { timestamp: Date.now() });
      return NextResponse.json({ success: true, requested: true }, { headers: CORS_HEADERS });
    }

    if (Array.isArray(products) && products.length > 0) {
      cachedProducts = products;
      lastCacheUpdate = Date.now();
    }
    if (typeof bcvRate === 'number' && bcvRate > 0) {
      setSharedBcvState({
        rate: Math.round(bcvRate * 100) / 100,
        source: 'Ajuste Celular / Red Local',
        lastUpdated: new Date().toISOString(),
        isManual: true,
      });
    }

    const currentRate = getSharedBcvState().rate;

    scannerEmitter.emit('inventory_updated', {
      count: cachedProducts.length,
      bcvRate: currentRate,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      received: cachedProducts.length,
    }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
