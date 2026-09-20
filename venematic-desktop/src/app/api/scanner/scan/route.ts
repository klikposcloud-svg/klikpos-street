import { NextRequest, NextResponse } from 'next/server';
import { scannerEmitter } from '@/lib/scanner-events';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session = 'caja-1', barcode } = body;

    if (!barcode) {
      return NextResponse.json({ error: 'Código de barras requerido' }, { status: 400 });
    }

    scannerEmitter.emit('scan', {
      session,
      barcode: String(barcode).trim(),
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, barcode });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
