import { NextResponse } from 'next/server'
import { scannerEmitter } from '@/lib/scanner-events'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { session, barcode, format } = body

    if (!barcode) {
      return NextResponse.json(
        { error: 'Código de barras requerido' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const payload = {
      session: session || 'default',
      barcode: String(barcode).trim(),
      format: format || 'CODE',
      timestamp: Date.now()
    }

    // Emitir inmediatamente al receptor SSE de la laptop
    scannerEmitter.emit('scan', payload)

    return NextResponse.json({ success: true, payload }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Error al recibir escaneo:', error)
    return NextResponse.json(
      { error: 'Error procesando escaneo' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
