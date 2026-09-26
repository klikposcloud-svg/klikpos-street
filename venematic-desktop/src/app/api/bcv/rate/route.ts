import { NextResponse } from 'next/server';
import { fetchLiveBcvRate } from '@/lib/services/bcv-service';

// In-memory cache for server lifecycle
let latestBcvData: {
  rate: number;
  date: string;
  source: string;
  lastUpdated: string;
  isManual?: boolean;
} = {
  rate: 855.66,
  date: new Date().toISOString().split('T')[0],
  source: 'Predeterminada',
  lastUpdated: new Date().toISOString(),
  isManual: false,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceLive = searchParams.get('refresh') === 'true';

  // Si se solicita refresco forzado o no ha sido sincronizado hoy
  const todayStr = new Date().toISOString().split('T')[0];
  const needsSync = forceLive || latestBcvData.date !== todayStr;

  if (needsSync && !latestBcvData.isManual) {
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
      }
    } catch (e) {
      console.warn('Error fetching live BCV in API route:', e);
    }
  }

  return NextResponse.json({
    success: true,
    ...latestBcvData,
  });
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
        return NextResponse.json({ success: true, ...latestBcvData });
      }
    }

    if (typeof rate === 'number' && rate > 0) {
      latestBcvData = {
        rate: Math.round(rate * 100) / 100,
        date: new Date().toISOString().split('T')[0],
        source: 'Ajuste Manual en Terminal',
        lastUpdated: new Date().toISOString(),
        isManual: true,
      };
      return NextResponse.json({ success: true, ...latestBcvData });
    }

    return NextResponse.json({ success: false, message: 'Tasa inválida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
