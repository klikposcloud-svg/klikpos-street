import { NextRequest, NextResponse } from 'next/server';

interface ImageResult {
  title: string;
  url: string;
  thumbnail: string;
  source: string;
}

// Filtro negativo para purgar monumentos, estatuas, personas, banderas y tumbas de enciclopedias
const EXCLUDED_TITLE_PATTERNS = /\b(portrait|person|people|politician|statue|monument|tomb|cemetery|grave|church|castle|palace|mayor|flag|coat of arms|wappen|heraldry|map|karte|plan|building|street|ruins|bishop|president|general|soldier|author|actor|actress|judge|memorial|facade|cathedral|archaeological|bust|bronze)\b/i;

// Diccionario gastronómico y expansión culinaria inteligente
function getCulinaryExpansions(rawQuery: string): { normalized: string; culinaryQueries: string[]; isFood: boolean } {
  const q = rawQuery.trim().toLowerCase();

  const foodDictionary: { [key: string]: string[] } = {
    'burguer': ['hamburguesa comida rápida plato', 'burger fast food', 'hamburguesa casera'],
    'burger': ['hamburguesa comida rápida plato', 'burger fast food', 'hamburguesa'],
    'hamburguesa': ['hamburguesa comida rápida plato', 'delicious burger fast food', 'hamburguesa con papas'],
    'hamburguesas': ['hamburguesa comida rápida plato', 'delicious burger fast food', 'hamburguesa'],
    'hot dog': ['perro caliente comida', 'hot dog fast food', 'perro caliente con salsas'],
    'hot dogs': ['perro caliente comida', 'hot dogs fast food', 'perro caliente'],
    'perro caliente': ['perro caliente comida', 'hot dog fast food', 'perro caliente venezolano'],
    'perros calientes': ['perros calientes comida', 'hot dogs fast food', 'perro caliente'],
    'pepito': ['pepito sandwich venezolano', 'pepito mixto comida', 'pepito carne pollo'],
    'pepitos': ['pepito sandwich venezolano', 'pepito mixto comida', 'pepito'],
    'shawarma': ['shawarma enrollado comida', 'shawarma mixto fast food', 'shawarma de carne pollo'],
    'shuarma': ['shawarma enrollado comida', 'shawarma mixto fast food', 'shawarma'],
    'cachapa': ['cachapa con queso de mano y cochino', 'cachapa venezolana comida', 'cachapa'],
    'cachapas': ['cachapa con queso cochino', 'cachapa venezolana comida', 'cachapas'],
    'arepa': ['arepa venezolana rellena comida', 'arepa reina pepiada', 'arepa'],
    'arepas': ['arepas venezolanas rellenas', 'arepa reina pepiada', 'arepas'],
    'empanada': ['empanada venezolana comida', 'empanada frita queso carne', 'empanadas'],
    'empanadas': ['empanadas venezolanas comida', 'empanada frita', 'empanadas'],
    'tequeño': ['tequeños venezolanos queso fritos', 'tequeños con salsa', 'tequeños'],
    'tequeños': ['tequeños venezolanos queso', 'tequeños fritos', 'tequeños'],
    'tequeno': ['tequeños venezolanos queso', 'tequeños fritos', 'tequeños'],
    'tequenos': ['tequeños venezolanos queso', 'tequeños fritos', 'tequeños'],
    'pizza': ['pizza artesanal comida rápida', 'pizza de queso pepperoni', 'pizza slice'],
    'pizzas': ['pizza artesanal comida', 'pizza queso pepperoni', 'pizzas'],
    'salchipapa': ['salchipapa comida rápida con salsas', 'salchipapa con papas fritas', 'salchipapa'],
    'salchipapas': ['salchipapa comida rápida con salsas', 'salchipapas con papas', 'salchipapa'],
    'pollo frito': ['pollo frito crujiente comida', 'crispy fried chicken fast food', 'pollo frito con papas'],
    'alitas': ['alitas de pollo bbq comida', 'chicken wings fast food', 'alitas'],
    'nuggets': ['chicken nuggets comida', 'nuggets de pollo fritos', 'nuggets'],
    'papas fritas': ['papas fritas crujientes comida', 'french fries fast food', 'papas fritas'],
    'chicha': ['chicha venezolana bebida con canela', 'chicha criolla', 'chicha'],
    'malta': ['malta polar botella bebida', 'malta bebida fria', 'malta'],
    'refresco': ['refresco vaso hielo soda', 'soda beverage drink', 'refresco vaso'],
  };

  const matchedKey = Object.keys(foodDictionary).find(k => q === k || q.includes(k) || k.includes(q));
  if (matchedKey) {
    return {
      normalized: matchedKey,
      culinaryQueries: foodDictionary[matchedKey],
      isFood: true,
    };
  }

  const isGenericFood = /\b(comida|combo|plato|sandwich|taco|tapas|postre|torta|dulce|jugo|bebida|arroz|sopa|carne|pollo|cerdo|pescado|asado|parrilla|ensalada)\b/i.test(q);
  if (isGenericFood) {
    return {
      normalized: q,
      culinaryQueries: [`${q} comida plato`, `${q} delicious food photography`],
      isFood: true,
    };
  }

  return {
    normalized: q,
    culinaryQueries: [q, `${q} producto`],
    isFood: false,
  };
}

// 1. Motor Web Bing Images (Extracción directa de fotos de alta definición como en la web real)
async function searchBing(query: string): Promise<ImageResult[]> {
  try {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];
    const html = await res.text();
    const mRegex = /m="(\{[^"]+\})"/g;
    const results: ImageResult[] = [];
    let m;

    while ((m = mRegex.exec(html)) !== null) {
      try {
        const decoded = m[1].replace(/&quot;/g, '"');
        const parsed = JSON.parse(decoded);
        const title = parsed.t || query;
        if (parsed.murl && parsed.murl.startsWith('http') && !EXCLUDED_TITLE_PATTERNS.test(title)) {
          results.push({
            title,
            url: parsed.murl,
            thumbnail: parsed.turl || parsed.murl,
            source: 'Web HD',
          });
        }
      } catch {}
    }

    return results.slice(0, 40);
  } catch (e) {
    console.warn('Error en búsqueda Bing Images:', e);
    return [];
  }
}

// 2. DuckDuckGo Images
async function searchDuckDuckGo(query: string): Promise<ImageResult[]> {
  try {
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    const initRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(6000),
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
      signal: AbortSignal.timeout(6000),
    });

    if (!apiRes.ok) return [];
    const data = await apiRes.json();
    const results: ImageResult[] = [];

    if (Array.isArray(data.results)) {
      for (const item of data.results.slice(0, 35)) {
        const title = item.title || query;
        if (item.image && item.image.startsWith('http') && !EXCLUDED_TITLE_PATTERNS.test(title)) {
          results.push({
            title,
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

// 3. Open Food Facts (Ideal para alimentos empaquetados y productos con código de barras)
async function searchOpenFoodFacts(query: string, barcode?: string): Promise<ImageResult[]> {
  try {
    const results: ImageResult[] = [];

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
      } catch {}
    }

    const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;
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
    return [];
  }
}

// 4. Wikimedia Commons (Filtrado con lista negra estricta de monumentos y personas)
async function searchWikimedia(query: string): Promise<ImageResult[]> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=25&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=400&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'VenematicPOS - Web - Version 2.0' },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const results: ImageResult[] = [];

    if (data.query?.pages) {
      for (const pageId of Object.keys(data.query.pages)) {
        const page = data.query.pages[pageId];
        const title = (page.title || '').replace('File:', '');
        if (EXCLUDED_TITLE_PATTERNS.test(title)) continue;
        const info = page.imageinfo?.[0];
        if (info?.url) {
          results.push({
            title: title || query,
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
  const { culinaryQueries, isFood } = getCulinaryExpansions(cleanQuery);

  // Ejecución paralela de alta velocidad y fidelidad web
  const primaryQuery = culinaryQueries[0] || cleanQuery;
  const secondaryQuery = culinaryQueries[1] || `${cleanQuery} comida`;

  const promises: Promise<ImageResult[]>[] = [
    searchBing(primaryQuery),
    searchDuckDuckGo(primaryQuery),
  ];

  if (culinaryQueries.length > 1) {
    promises.push(searchBing(secondaryQuery));
  }

  if (!isFood) {
    promises.push(searchOpenFoodFacts(cleanQuery, barcode));
    if (cleanQuery.length > 3) {
      promises.push(searchWikimedia(cleanQuery));
    }
  }

  const resultsArrays = await Promise.all(promises);

  // Combinación y deduplicación inteligente
  const combined: ImageResult[] = [];
  const seenUrls = new Set<string>();

  for (const arr of resultsArrays) {
    for (const item of arr) {
      if (item && item.url && !seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        combined.push(item);
      }
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
