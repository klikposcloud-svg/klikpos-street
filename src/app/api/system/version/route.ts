import { NextResponse } from 'next/server';
import manifest from '../../../../../version.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  const version = manifest.version || '2.4.7';
  return NextResponse.json({
    version,
    releaseDate: manifest.releaseDate || new Date().toISOString().split('T')[0],
    title: manifest.title || `KlikPOS Enterprise v${version}`,
    system: 'KlikPOS Cloud & Desktop Enterprise',
    notes: manifest.notes || [],
    windowsUrl: manifest.windowsUrl || `https://github.com/klikposcloud-svg/klikpos-releases/releases/download/v${version}/KlikPOS_Desktop_Full_Setup.exe`,
    androidUrl: manifest.androidUrl || `https://github.com/klikposcloud-svg/klikpos-releases/releases/download/v${version}/KlikPOS_Movil_Full.apk`,
    mandatory: manifest.mandatory ?? false,
  });
}
