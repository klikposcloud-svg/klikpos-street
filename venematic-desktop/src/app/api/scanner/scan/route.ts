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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session = 'caja-1', barcode } = body;

    if (!barcode) {
      return NextResponse.json({ error: 'Código de barras requerido' }, { status: 400, headers: CORS_HEADERS });
    }

    scannerEmitter.emit('scan', {
      session,
      barcode: String(barcode).trim(),
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, barcode }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
