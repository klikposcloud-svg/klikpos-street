import { NextRequest, NextResponse } from 'next/server';
import { scannerEmitter } from '@/lib/scanner-events';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session = 'caja-1', image, barcode } = body;

    if (!image) {
      return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 });
    }

    scannerEmitter.emit('photo_received', {
      session,
      image,
      barcode,
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
