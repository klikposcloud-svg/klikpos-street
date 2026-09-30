import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

function getLocalNetworkIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

export async function GET() {
  const localIp = getLocalNetworkIp();
  const port = process.env.PORT || '3000';

  return NextResponse.json({
    success: true,
    server: {
      localIp,
      port,
      serverUrl: `http://${localIp}:${port}`,
      syncApiUrl: `http://${localIp}:${port}/api/sync/menu/orders`,
    },
    message: 'KlikPOS Menu Sync Gateway Activo',
    timestamp: new Date().toISOString(),
  });
}
