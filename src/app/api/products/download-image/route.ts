import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns';

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageUrl = body?.url?.trim();

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'URL de imagen no válida' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: 'Formato de URL no válido' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json(
        { error: 'Protocolo no permitido. Solo se aceptan URLs http/https.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Prevención de SSRF (Server-Side Request Forgery)
    const hostname = parsedUrl.hostname.toLowerCase();
    const isLocalOrPrivate = 
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '169.254.169.254' || // AWS/GCP/Azure instance metadata
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname);

    if (isLocalOrPrivate) {
      return NextResponse.json(
        { error: 'Acceso a redes internas o direcciones locales bloqueado por seguridad.' },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    // Descargar imagen en servidor con User-Agent de navegador
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `No se pudo descargar la imagen (código HTTP ${res.status})` },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo recibido no es una imagen válida' },
        { status: 415, headers: CORS_HEADERS }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Si la imagen supera 4 MB, retornar advertencia para no saturar memoria
    if (buffer.length > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'La imagen seleccionada es demasiado pesada (>4MB). Por favor selecciona otra.' },
        { status: 413, headers: CORS_HEADERS }
      );
    }

    const base64 = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      dataUrl,
      base64: dataUrl,
      savedPath: dataUrl,
      contentType,
      sizeBytes: buffer.length,
    }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error('Error al descargar imagen de producto:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al procesar la descarga de imagen' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
