import { NextRequest, NextResponse } from 'next/server';
import { scannerEmitter } from '@/lib/scanner-events';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const session = body.session || 'caja-1';
    const action = body.action || 'activate_camera';

    // Disparar evento remoto al celular conectado vía SSE
    scannerEmitter.emit('remote_trigger', {
      session,
      action,
      timestamp: Date.now(),
      message: 'Escáner activado desde la PC',
    });

    return NextResponse.json({
      success: true,
      message: 'Comando de activación enviado al móvil',
      action,
      session,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error disparando escáner móvil' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
