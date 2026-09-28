import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { windowsUrl, version } = body;

    if (!windowsUrl) {
      return NextResponse.json({ error: 'URL de instalador no especificada.' }, { status: 400 });
    }

    const tempDir = os.tmpdir();
    const installerFile = path.join(tempDir, `KlikPOS-Setup-v${version || 'update'}.exe`);

    // Descargar el instalador binario directamente desde GitHub Releases
    const downloadRes = await fetch(windowsUrl, {
      headers: {
        'User-Agent': 'KlikPOS-AutoUpdater',
      },
    });

    if (!downloadRes.ok) {
      return NextResponse.json(
        { error: `Error descargando instalador de GitHub: HTTP ${downloadRes.status}` },
        { status: 502 }
      );
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    fs.writeFileSync(installerFile, Buffer.from(arrayBuffer));

    // Ejecutar el instalador de Inno Setup en modo silencioso desatendido
    // Parámetros estándar Inno Setup:
    // /VERYSILENT : instalación completamente silenciosa sin ventanas
    // /SUPPRESSMSGBOXES : suprime todas las alertas modales
    // /NORESTART : no reinicia la computadora
    // /SP- : deshabilita el prompt inicial de bienvenida
    const installerProcess = spawn(
      installerFile,
      ['/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART', '/SP-'],
      {
        detached: true,
        stdio: 'ignore',
      }
    );
    installerProcess.unref();

    return NextResponse.json({
      success: true,
      message: `Actualización v${version} descargada e instalada automáticamente en segundo plano.`,
      installerPath: installerFile,
    });
  } catch (error: any) {
    console.error('[API system/update error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno durante la actualización automática.' },
      { status: 500 }
    );
  }
}
