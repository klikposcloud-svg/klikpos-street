import { NextResponse } from 'next/server';
import { CURRENT_VERSION } from '@/lib/services/update-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    version: CURRENT_VERSION,
    releaseDate: '2026-09-27',
    title: `KlikPOS Enterprise v${CURRENT_VERSION}`,
    system: 'KlikPOS Cloud & Desktop Enterprise',
    notes: [
      'Modo Standalone Tablet & Móvil (/tablet-pos) para comida rápida y ambulantes',
      '4 Estilos de Vista de Cards: Food, Cuadrícula, Lista y Minimalista táctil',
      'Barra lateral de navegación minimalista con íconos vectoriales Lucide React',
      'Selector de Branding con 9 paletas de color y modo blanco profesional',
      'Balanza comercial con apertura automática y obligatoria en pesables',
      'Inicio de sesión seguro con roles estrictos de Cajero y Administrador',
    ],
    windowsUrl: 'https://github.com/klikposcloud-svg/klikpos-releases/releases/download/v2.4.5/KlikPOS_Desktop_Full_Setup.exe',
    androidUrl: 'https://github.com/klikposcloud-svg/klikpos-releases/releases/download/v2.4.5/KlikPOS_Movil_Full.apk',
    mandatory: false,
  });
}
