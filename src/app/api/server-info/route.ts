import { NextResponse } from 'next/server'
import os from 'os'

export const dynamic = 'force-dynamic'

function getLocalIP(): string {
  const interfaces = os.networkInterfaces()
  const candidates: { ip: string; name: string; priority: number }[] = []

  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name]
    if (!iface) continue
    const lowerName = name.toLowerCase()

    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        let priority = 10
        if (lowerName.includes('wi-fi') || lowerName.includes('wifi') || lowerName.includes('wlan') || lowerName.includes('wireless')) {
          priority = 100
        } else if (lowerName.includes('ethernet') || lowerName.includes('eth')) {
          priority = 80
        } else if (alias.address.startsWith('192.168.')) {
          priority = 60
        } else if (alias.address.startsWith('10.')) {
          priority = 40
        } else if (lowerName.includes('vEthernet') || lowerName.includes('wsl') || lowerName.includes('virtualbox')) {
          priority = 1
        }
        candidates.push({ ip: alias.address, name, priority })
      }
    }
  }

  candidates.sort((a, b) => b.priority - a.priority)
  return candidates[0]?.ip || 'localhost'
}

export async function GET() {
  const ip = getLocalIP()
  const port = process.env.PORT || '3000'
  return NextResponse.json({
    ip,
    port,
    baseUrl: `http://${ip}:${port}`,
  })
}
