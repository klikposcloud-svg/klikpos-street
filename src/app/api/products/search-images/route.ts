import { NextRequest, NextResponse } from 'next/server';

interface ImageResult {
  title: string;
  url: string;
  thumbnail: string;
  source: string;
}

// 1. DuckDuckGo Images
async function searchDuckDuckGo(query: string): Promise<ImageResult[]> {
  try {
    // Paso 1: Obtener token vqd
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    const initRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      next: { revalidate: 3600 },
    });

    const html = await initRes.text();
    const vqdMatch = html.match(/vqd=([0-9-_]+)/) || html.match(/vqd="([0-9-_]+)"/) || html.match(/vqd='([0-9-_]+)'/);
    if (!vqdMatch) return [];

    const vqd = vqdMatch[1];
    const apiUrl = `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,type:photo,&p=1`;

    const apiRes = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://duckduckgo.com/',
      },
    });

    if (!apiRes.ok) return [];
    const data = await apiRes.json();
    const results: ImageResult[] = [];

    if (Array.isArray(data.results)) {
      for (const item of data.results.slice(0, 45)) {
        if (item.image && item.image.startsWith('http')) {
          results.push({
            title: item.title || query,
            url: item.image,
            thumbnail: item.thumbnail || item.image,
            source: 'Web',
          });
        }
      }
    }

    return results;
  } catch (e) {
    console.warn('Error en búsqueda DuckDuckGo:', e);
    return [];
  }
}

// 2. Open Food Facts (Ideal para alimentos de supermercado y productos con código de barras)
async function searchOpenFoodFacts(query: string, barcode?: string): Promise<ImageResult[]> {
  try {
    const results: ImageResult[] = [];

    // Si viene código de barras, buscar exacto
    if (barcode && barcode.length >= 8) {
      try {
        const bcRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
          headers: { 'User-Agent': 'VenematicPOS - Web - Version 2.0' },
          signal: AbortSignal.timeout(3000),
        });
        if (bcRes.ok) {
          const bcData = await bcRes.json();
          if (bcData.status === 1 && bcData.product?.image_url) {
            results.push({
              title: bcData.product.product_name || query,
              url: bcData.product.image_url,
              thumbnail: bcData.product.image_front_thumb_url || bcData.product.image_url,
              source: 'Catálogo Oficial',
            });
          }
        }
      } catch (err) {}
    }

    // Búsqueda por texto en base de datos de productos de supermercado
    const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=25`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'VenematicPOS - Web - Version 2.0' },
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products)) {
        for (const p of data.products) {
          const img = p.image_front_url || p.image_url || p.image_small_url;
          if (img && typeof img === 'string' && img.startsWith('http')) {
            results.push({
              title: p.product_name || p.generic_name || query,
              url: img,
              thumbnail: p.image_front_small_url || img,
              source: 'Catálogo Alimentos',
            });
          }
        }
      }
    }

    return results;
  } catch (e) {
    console.warn('Error en búsqueda OpenFoodFacts:', e);
    return [];
  }
}

// 3. Wikimedia / Wikipedia Commons (Fallback adicional para marcas y productos generales)
async function searchWikimedia(query: string): Promise<ImageResult[]> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=35&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=400&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'VenematicPOS - Web - Version 2.0' },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const results: ImageResult[] = [];

    if (data.query?.pages) {
      for (const pageId of Object.keys(data.query.pages)) {
        const page = data.query.pages[pageId];
        const info = page.imageinfo?.[0];
        if (info?.url) {
          results.push({
            title: page.title?.replace('File:', '') || query,
            url: info.url,
            thumbnail: info.thumburl || info.url,
            source: 'Wikimedia',
          });
        }
      }
    }

    return results;
  } catch (e) {
    return [];
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();
  const barcode = searchParams.get('barcode')?.trim();

  if (!query && !barcode) {
    return NextResponse.json({ error: 'Debes proporcionar un término de búsqueda o código de barras' }, { status: 400, headers: CORS_HEADERS });
  }

  const cleanQuery = query || barcode || '';

  // Ejecutar búsquedas en paralelo con motores complementarios
  const [offResults, ddgResultsWhite, ddgResultsGeneral, wikiResults] = await Promise.all([
    searchOpenFoodFacts(cleanQuery, barcode),
    searchDuckDuckGo(`${cleanQuery} fondo blanco producto`),
    searchDuckDuckGo(cleanQuery),
    cleanQuery.length > 3 ? searchWikimedia(cleanQuery) : Promise.resolve([]),
  ]);

  // Combinar resultados priorizando catálogo de alimentos y fotos sin duplicados
  const combined: ImageResult[] = [];
  const seenUrls = new Set<string>();

  for (const item of [...offResults, ...ddgResultsWhite, ...ddgResultsGeneral, ...wikiResults]) {
    if (item && item.url && !seenUrls.has(item.url)) {
      seenUrls.add(item.url);
      combined.push(item);
    }
  }

  return NextResponse.json({
    success: true,
    query: cleanQuery,
    count: combined.length,
    results: combined,
    images: combined,
  }, { headers: CORS_HEADERS });
}
