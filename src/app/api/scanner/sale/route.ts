import { NextRequest, NextResponse } from 'next/server';
import { scannerEmitter, mobileSalesQueue } from '@/lib/scanner-events';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      pendingSales: mobileSalesQueue,
      count: mobileSalesQueue.length,
    }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sale } = body;

    if (!sale || !sale.items || sale.items.length === 0) {
      return NextResponse.json({ error: 'Datos de venta incompletos' }, { status: 400, headers: CORS_HEADERS });
    }

    mobileSalesQueue.push({
      ...sale,
      receivedAt: new Date().toISOString(),
    });

    // Notificar por SSE a la pantalla de POS de la PC
    scannerEmitter.emit('mobile_sale_completed', {
      sale,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      receiptNumber: sale.receiptNumber,
      message: 'Venta móvil registrada y sincronizada',
    }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

// Endpoint para limpiar ventas procesadas
export async function DELETE(req: NextRequest) {
  try {
    const { receiptNumber } = await req.json();
    if (receiptNumber) {
      const idx = mobileSalesQueue.findIndex(s => s.receiptNumber === receiptNumber);
      if (idx !== -1) {
        mobileSalesQueue.splice(idx, 1);
      }
    } else {
      mobileSalesQueue.length = 0;
    }
    return NextResponse.json({ success: true, remaining: mobileSalesQueue.length }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
