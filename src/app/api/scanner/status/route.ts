import { NextRequest, NextResponse } from 'next/server';
import { scannerEmitter, scannerSessions } from '@/lib/scanner-events';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const session = req.nextUrl.searchParams.get('session') || 'caja-1';
  const data = scannerSessions.get(session);
  const isOnline = Boolean(data && data.connected && Date.now() - data.lastSeen < 15000);

  return NextResponse.json({
    success: true,
    session,
    status: 'ready',
    connected: isOnline,
    deviceName: isOnline ? data?.deviceName : '',
  }, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session = 'caja-1', connected, deviceName } = body;

    const isConnected = Boolean(connected);
    scannerSessions.set(session, {
      connected: isConnected,
      deviceName: deviceName || 'Teléfono Móvil',
      lastSeen: Date.now(),
    });

    scannerEmitter.emit('phone_status', {
      session,
      connected: isConnected,
      deviceName: deviceName || 'Teléfono Móvil',
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
