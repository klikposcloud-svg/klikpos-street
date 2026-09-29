import { NextResponse } from 'next/server';
import { CrashReport } from '@/lib/telemetry/crash-reporter';

// Almacenamiento en memoria para la sesión del servidor (se sincroniza con base de datos)
let serverCrashLogs: CrashReport[] = [
  {
    id: 'sample_crash_01',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    edition: 'KLIKPOS_PRO',
    version: '3.0.0',
    terminalId: 'HWID-PC-K782A1',
    errorMessage: 'NetworkTimeout: El escáner Wi-Fi no respondió en el puerto 3000 tras 5000ms',
    errorStack: 'Error: NetworkTimeout\n    at CameraScannerModal.tsx:48:12\n    at WebSocket.onclose (scanner-events.ts:32:15)',
    route: '/dashboard/pos',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KlikPOS Desktop Client',
    severity: 'warning',
    resolved: false,
  }
];

export async function GET() {
  return NextResponse.json({
    success: true,
    total: serverCrashLogs.length,
    reports: serverCrashLogs,
  });
}

export async function POST(request: Request) {
  try {
    const report = (await request.json()) as CrashReport;
    if (!report || !report.errorMessage) {
      return NextResponse.json({ success: false, message: 'Reporte inválido' }, { status: 400 });
    }

    serverCrashLogs.unshift(report);
    // Limitar historial a 100 eventos
    if (serverCrashLogs.length > 100) {
      serverCrashLogs = serverCrashLogs.slice(0, 100);
    }

    return NextResponse.json({ success: true, count: serverCrashLogs.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  serverCrashLogs = [];
  return NextResponse.json({ success: true, message: 'Logs de telemetría vaciados' });
}
