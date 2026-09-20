import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;
    for (const iface of ifaceList) {
      // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

export async function GET() {
  const ip = getLocalIpAddress();
  const port = process.env.PORT || 3002;
  return NextResponse.json({
    ip,
    port,
    scannerUrl: `http://${ip}:${port}/scanner?session=caja-1`,
  });
}
