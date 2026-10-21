import { NextResponse } from 'next/server';
import { fetchLiveBcvRate, getSharedBcvState, setSharedBcvState } from '@/lib/services/bcv-service';
import { scannerEmitter } from '@/lib/scanner-events';

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
  const forceLive = searchParams.get('refresh') === 'true';

  let shared = getSharedBcvState();
  const todayStr = new Date().toISOString().split('T')[0];
  const needsSync = forceLive || shared.date !== todayStr || shared.source === 'Predeterminada' || shared.updatedAt === 0;

  // Si se solicita refresco forzado (clic del usuario) o no está sincronizado hoy
  if (forceLive || (needsSync && !shared.isManual)) {
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
        scannerEmitter.emit('inventory_updated', {
          bcvRate: shared.rate,
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      console.warn('Error fetching live BCV in API route:', e);
    }
  }

  return NextResponse.json({
    success: true,
    rate: shared.rate,
    date: shared.date,
    source: shared.source,
    lastUpdated: shared.lastUpdated,
    isManual: shared.isManual,
  }, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rate, forceScrape } = body;

    if (forceScrape) {
      const live = await fetchLiveBcvRate();
      if (live.success && live.rate > 0) {
        const shared = setSharedBcvState({
          rate: live.rate,
          date: live.date,
          source: live.source,
          lastUpdated: live.lastUpdated,
          isManual: false,
        });
        scannerEmitter.emit('inventory_updated', {
          bcvRate: shared.rate,
          timestamp: Date.now(),
        });
        return NextResponse.json({ success: true, ...shared }, { headers: CORS_HEADERS });
      }
    }

    const numRate = Number(rate);
    if (Number.isFinite(numRate) && numRate >= 1 && numRate <= 10000000) {
      const shared = setSharedBcvState({
        rate: Math.round(numRate * 100) / 100,
        date: new Date().toISOString().split('T')[0],
        source: body.source || 'Ajuste Manual en Terminal',
        lastUpdated: new Date().toISOString(),
        isManual: true,
      });
      scannerEmitter.emit('inventory_updated', {
        bcvRate: shared.rate,
        timestamp: Date.now(),
      });
      return NextResponse.json({ success: true, ...shared }, { headers: CORS_HEADERS });
    }

    return NextResponse.json(
      { success: false, message: 'Tasa inválida. Debe ser un número finito entre 1 y 10,000,000.' },
      { status: 400, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
