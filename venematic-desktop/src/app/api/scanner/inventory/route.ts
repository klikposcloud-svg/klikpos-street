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

// Caché en memoria de productos compartidos por la caja para consulta rápida del celular
let cachedProducts: any[] = [];
let lastCacheUpdate = 0;
let cachedBcvRate = 848.55;

export async function GET(req: NextRequest) {
  try {
    // Si la caché está vacía, notificar al desktop que envíe el inventario
    if (cachedProducts.length === 0) {
      scannerEmitter.emit('request_inventory', { timestamp: Date.now() });
    }

    return NextResponse.json({
      success: true,
      products: cachedProducts,
      bcvRate: cachedBcvRate,
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
    if (typeof bcvRate === 'number') {
      cachedBcvRate = bcvRate;
    }

    scannerEmitter.emit('inventory_updated', {
      count: cachedProducts.length,
      bcvRate: cachedBcvRate,
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
