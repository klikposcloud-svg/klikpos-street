import { NextResponse } from 'next/server';
import { fetchLiveBcvRate } from '@/lib/services/bcv-service';
import { scannerEmitter } from '@/lib/scanner-events';

// In-memory cache for server lifecycle
let latestBcvData: {
  rate: number;
  date: string;
  source: string;
  lastUpdated: string;
  isManual?: boolean;
} = {
  rate: 871.37,
  date: '',
  source: 'Predeterminada',
  lastUpdated: '',
  isManual: false,
};

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

  // Si se solicita refresco forzado, no ha sido sincronizado hoy, o aún tiene valores por defecto
  const todayStr = new Date().toISOString().split('T')[0];
  const needsSync = forceLive || latestBcvData.date !== todayStr || latestBcvData.source === 'Predeterminada' || !latestBcvData.lastUpdated;

  // Si se solicita refresco forzado (clic del usuario), forzar consulta en vivo sin importar el estado manual
  if (forceLive || (needsSync && !latestBcvData.isManual)) {
    try {
      const live = await fetchLiveBcvRate();
      if (live.success && live.rate > 0) {
        latestBcvData = {
          rate: live.rate,
          date: live.date,
          source: live.source,
          lastUpdated: live.lastUpdated,
          isManual: false,
        };
        scannerEmitter.emit('inventory_updated', {
          bcvRate: latestBcvData.rate,
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      console.warn('Error fetching live BCV in API route:', e);
    }
  }

  return NextResponse.json({
    success: true,
    ...latestBcvData,
  }, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rate, forceScrape } = body;

    if (forceScrape) {
      const live = await fetchLiveBcvRate();
      if (live.success && live.rate > 0) {
        latestBcvData = {
          rate: live.rate,
          date: live.date,
          source: live.source,
          lastUpdated: live.lastUpdated,
          isManual: false,
        };
        scannerEmitter.emit('inventory_updated', {
          bcvRate: latestBcvData.rate,
          timestamp: Date.now(),
        });
        return NextResponse.json({ success: true, ...latestBcvData }, { headers: CORS_HEADERS });
      }
    }

    const numRate = Number(rate);
    if (Number.isFinite(numRate) && numRate >= 1 && numRate <= 10000000) {
      latestBcvData = {
        rate: Math.round(numRate * 100) / 100,
        date: new Date().toISOString().split('T')[0],
        source: body.source || 'Ajuste Manual en Terminal',
        lastUpdated: new Date().toISOString(),
        isManual: true,
      };
      scannerEmitter.emit('inventory_updated', {
        bcvRate: latestBcvData.rate,
        timestamp: Date.now(),
      });
      return NextResponse.json({ success: true, ...latestBcvData }, { headers: CORS_HEADERS });
    }

    return NextResponse.json(
      { success: false, message: 'Tasa inválida. Debe ser un número finito entre 1 y 10,000,000.' },
      { status: 400, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
