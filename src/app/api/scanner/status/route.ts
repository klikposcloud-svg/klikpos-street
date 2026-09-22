import { NextRequest, NextResponse } from 'next/server';
import { scannerEmitter } from '@/lib/scanner-events';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session = 'caja-1', connected, deviceName } = body;

    scannerEmitter.emit('phone_status', {
      session,
      connected: Boolean(connected),
      deviceName: deviceName || 'Teléfono Móvil',
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = req.nextUrl.searchParams.get('session') || 'caja-1';
  return NextResponse.json({ success: true, session, status: 'ready' });
}
