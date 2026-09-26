import { NextRequest, NextResponse } from 'next/server'
import os from 'os'

export const dynamic = 'force-dynamic'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

function getLocalIP(): string {
  const interfaces = os.networkInterfaces()
  const candidates: { ip: string; name: string; priority: number }[] = []

  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name]
    if (!iface) continue
    const lowerName = name.toLowerCase()

    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        // Excluir direcciones APIPA / link-local inalcanzables (169.254.x.x)
        if (alias.address.startsWith('169.254.')) continue;

        let priority = 10
        if (lowerName.includes('wi-fi') || lowerName.includes('wifi') || lowerName.includes('wlan') || lowerName.includes('wireless')) {
          priority = 100
        } else if (lowerName.includes('ethernet') || lowerName.includes('eth')) {
          priority = 80
        } else if (alias.address.startsWith('192.168.')) {
          priority = 70
        } else if (alias.address.startsWith('10.')) {
          priority = 50
        } else if (lowerName.includes('vethernet') || lowerName.includes('wsl') || lowerName.includes('virtualbox') || lowerName.includes('vmware') || lowerName.includes('bluetooth')) {
          priority = 1
        }
        candidates.push({ ip: alias.address, name, priority })
      }
    }
  }

  candidates.sort((a, b) => b.priority - a.priority)
  return candidates[0]?.ip || 'localhost'
}

export async function GET(req: NextRequest) {
  const ip = getLocalIP()
  // Si la petición viene con host (ej. localhost:3000), extraer el puerto real usado
  const host = req.headers.get('host') || ''
  const hostPort = host.includes(':') ? host.split(':')[1] : null
  const port = hostPort || process.env.PORT || '3000'
  const session = req.nextUrl.searchParams.get('session') || 'caja-1'

  return NextResponse.json({
    ip,
    port,
    baseUrl: `http://${ip}:${port}`,
    scannerUrl: `http://${ip}:${port}/scanner?session=${session}`,
  }, { headers: CORS_HEADERS })
}
