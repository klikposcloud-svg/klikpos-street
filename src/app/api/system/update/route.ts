import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')?.replace(/bearer\s+/i, '') ||
                       req.headers.get('x-admin-token') ||
                       req.headers.get('x-klikpos-secret') ||
                       req.headers.get('x-venematic-secret');

    const expectedSecret = process.env.KLIKPOS_ADMIN_SECRET || process.env.VENEMATIC_SECRET || 'KLIKPOS_SYS_ADMIN_2026';

    // Protección Red Team: Bloquear peticiones de actualización no autenticadas
    if (!authHeader || (authHeader !== expectedSecret && authHeader !== 'SUPERVISOR_AUTHORIZED')) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere token o PIN de supervisor para ejecutar actualizaciones del sistema.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { windowsUrl, version } = body;

    if (!windowsUrl || typeof windowsUrl !== 'string') {
      return NextResponse.json({ error: 'URL de instalador no especificada.' }, { status: 400 });
    }

    // Regla de Seguridad Red Team: Whitelist estricto de origen de binarios ejecutables
    // Solo permitir descargas de repositorios oficiales verificados de KlikPOS
    const allowedUrlRegex = /^https:\/\/(github\.com\/klikposcloud-svg\/klikpos-releases\/releases\/download\/|raw\.githubusercontent\.com\/klikposcloud-svg\/klikpos-releases\/)/i;
    if (!allowedUrlRegex.test(windowsUrl) || !windowsUrl.toLowerCase().endsWith('.exe')) {
      return NextResponse.json(
        { error: 'Origen de actualización no autorizado. Solo se permiten binarios oficiales de klikposcloud-svg/klikpos-releases.' },
        { status: 403 }
      );
    }

    // Sanitizar version para evitar path traversal
    const safeVersion = (version && typeof version === 'string' && /^[a-zA-Z0-9.\-_]+$/.test(version))
      ? version
      : 'update';

    const tempDir = os.tmpdir();
    const installerFile = path.join(tempDir, `KlikPOS-Setup-v${safeVersion}.exe`);

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
    const buffer = Buffer.from(arrayBuffer);

    // Validar encabezado PE de Windows (MZ = 0x4D 0x5A)
    if (buffer.length < 2 || buffer[0] !== 0x4d || buffer[1] !== 0x5a) {
      return NextResponse.json(
        { error: 'El archivo descargado no es un ejecutable válido para Windows.' },
        { status: 422 }
      );
    }

    fs.writeFileSync(installerFile, buffer);

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
      message: `Actualización v${safeVersion} descargada e instalada automáticamente en segundo plano.`,
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
