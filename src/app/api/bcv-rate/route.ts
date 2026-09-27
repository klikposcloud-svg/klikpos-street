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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const now = Date.now();

  if (!forceRefresh && memoryCache.data && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(memoryCache.data);
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
      return NextResponse.json(data);
    }
  } catch (err) {
    console.warn('[bcv-rate API] Error fetching live BCV:', err);
  }

  if (memoryCache.data) {
    return NextResponse.json(memoryCache.data);
  }

  const today = new Date().toISOString().split('T')[0];
  return NextResponse.json({
    rate: 854.46,
    date: today,
    source: 'Tasa BCV Referencial',
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rate, updatedBy } = body;

    if (!rate || typeof rate !== 'number' || rate <= 0) {
      return NextResponse.json({ error: 'Tasa inválida' }, { status: 400 });
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

    return NextResponse.json(manualRate);
  } catch (error) {
    console.error('Error al actualizar tasa manual:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
