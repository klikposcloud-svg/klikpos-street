import { NextResponse } from 'next/server';
import { CURRENT_VERSION } from '@/lib/services/update-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    version: CURRENT_VERSION,
    releaseDate: '2026-09-26',
    title: `Venematic POS v${CURRENT_VERSION}`,
    system: 'Venematic Commercial POS Enterprise',
    notes: [
      'Balanza comercial con apertura automática y obligatoria en pesables',
      'Inicio de sesión seguro con roles estrictos de Cajero y Administrador',
      'Módulo de Auto-Actualizaciones en Línea y Fuera de Línea',
      'Optimización de motor local Dexie IndexedDB y sincronización LAN',
    ],
    windowsUrl: '/dist-installer/Venematic-POS-Setup-v2.0.0.exe',
    androidUrl: '/dist-apk/venematic-pos.apk',
    mandatory: false,
  });
}
