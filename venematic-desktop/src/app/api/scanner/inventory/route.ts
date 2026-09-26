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

import { INITIAL_PRODUCTS } from '@/lib/seed-data';

// Caché en memoria de productos compartidos por la caja para consulta rápida del celular
let cachedProducts: any[] = INITIAL_PRODUCTS.map((p, idx) => ({
  id: idx + 1,
  barcode: p.barcode,
  name: p.name,
  category: p.category,
  priceUSD: p.priceUSD,
  stock: p.stock,
  image: p.image,
  isWeighable: p.unit === 'kg' || p.category === 'Charcutería' || p.category === 'Carnes y Pollo' || p.barcode.startsWith('20')
}));
let lastCacheUpdate = Date.now();
let cachedBcvRate = 848.55;

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      products: cachedProducts,
      bcvRate: cachedBcvRate,
      count: cachedProducts.length,
      updatedAt: lastCacheUpdate,
      needsSync: false,
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
