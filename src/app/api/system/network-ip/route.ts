import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

function getLocalNetworkIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Filtrar IPv4 válidas no internas y que no sean auto-asignadas 169.254
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
  const serverUrl = `http://${localIp}:${port}`;

  return NextResponse.json({
    success: true,
    localIp,
    port,
    serverUrl,
    adminConnectUrl: serverUrl,
    scannerUrl: `${serverUrl}/scanner?session=caja-1`,
    menuUrl: `${serverUrl}/menu`,
  });
}
