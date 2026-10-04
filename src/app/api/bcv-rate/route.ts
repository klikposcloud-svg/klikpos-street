import { NextResponse } from 'next/server';
import { fetchLiveBcvRate } from '@/lib/services/bcv-service';
import { scannerEmitter } from '@/lib/scanner-events';

interface BcvRateResponse {
  rate: number;
  date: string;
  source: string;
  updatedAt: string;
}

let memoryCache: {
  data: BcvRateResponse | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const now = Date.now();

  if (!forceRefresh && memoryCache.data && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(memoryCache.data, { headers: CORS_HEADERS });
  }

  try {
    const live = await fetchLiveBcvRate();
    if (live && live.rate > 0) {
      const data: BcvRateResponse = {
        rate: Number(live.rate.toFixed(2)),
        date: live.date,
        source: live.source,
        updatedAt: live.lastUpdated,
      };
      memoryCache = {
        data,
        timestamp: now,
      };
      return NextResponse.json(data, { headers: CORS_HEADERS });
    }
  } catch (err) {
    console.warn('[bcv-rate API] Error fetching live BCV:', err);
  }

  if (memoryCache.data) {
    return NextResponse.json(memoryCache.data, { headers: CORS_HEADERS });
  }

  const today = new Date().toISOString().split('T')[0];
  return NextResponse.json({
    rate: 854.46,
    date: today,
    source: 'Tasa BCV Referencial',
    updatedAt: new Date().toISOString(),
  }, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rate, updatedBy } = body;
    const numRate = Number(rate);

    if (!Number.isFinite(numRate) || numRate < 1 || numRate > 10000000) {
      return NextResponse.json(
        { error: 'Tasa inválida. Debe ser un número finito entre 1 y 10,000,000.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const manualRate: BcvRateResponse = {
      rate: Number(rate.toFixed(2)),
      date: today,
      source: `Manual (${updatedBy || body.source || 'Cajero'})`,
      updatedAt: new Date().toISOString(),
    };

    memoryCache = {
      data: manualRate,
      timestamp: Date.now(),
    };

    scannerEmitter.emit('inventory_updated', {
      bcvRate: manualRate.rate,
      timestamp: Date.now(),
    });

    return NextResponse.json(manualRate, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Error al actualizar tasa manual:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: CORS_HEADERS });
  }
}
