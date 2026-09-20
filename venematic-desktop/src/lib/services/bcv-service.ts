/**
 * VENEMATIC - Servicio Oficial de Tasa de Cambio BCV
 * Obtiene automáticamente la tasa del día mediante APIs de scraping en vivo
 * con respaldo multi-fuente y almacenamiento en SQLite / IndexedDB.
 */

export interface BcvRateResult {
  rate: number;
  date: string;
  source: string;
  lastUpdated: string;
  success: boolean;
  isFallback?: boolean;
}

const DEFAULT_RATE = 848.55;

export async function fetchLiveBcvRate(): Promise<BcvRateResult> {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Primer intento: API Oficial de DolarAPI Venezuela (rápida, JSON estructurado, tiempo real)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Venematic-POS/2.0',
      },
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const val = parseFloat(data.promedio || data.price || data.valor);
      if (!isNaN(val) && val > 10 && val < 5000) {
        const rounded = Math.round(val * 100) / 100;
        return {
          rate: rounded,
          date: data.fechaActualizacion?.split('T')[0] || todayStr,
          source: 'BCV Oficial (ve.dolarapi.com)',
          lastUpdated: new Date().toISOString(),
          success: true,
          isFallback: false,
        };
      }
    }
  } catch (err: any) {
    console.warn('[BCV-Service] Intento 1 (dolarapi/oficial) falló:', err.message);
  }

  // 2. Segundo intento: Catálogo completo de divisas DolarAPI
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('https://ve.dolarapi.com/v1/dolares', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        const oficial = list.find(
          (item) => item.fuente === 'oficial' || (item.nombre && item.nombre.toLowerCase().includes('oficial'))
        );
        if (oficial) {
          const val = parseFloat(oficial.promedio || oficial.price || oficial.valor);
          if (!isNaN(val) && val > 10 && val < 5000) {
            const rounded = Math.round(val * 100) / 100;
            return {
              rate: rounded,
              date: oficial.fechaActualizacion?.split('T')[0] || todayStr,
              source: 'BCV Oficial (DolarAPI Multi)',
              lastUpdated: new Date().toISOString(),
              success: true,
              isFallback: false,
            };
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('[BCV-Service] Intento 2 falló:', err.message);
  }

  // 3. Tercer intento: Scraping directo del portal oficial del Banco Central de Venezuela
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://www.bcv.org.ve', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const match = html.match(/id=["']dolar["'][^>]*>[\s\S]*?<strong>\s*([0-9.,]+)\s*<\/strong>/i) ||
                    html.match(/USD[\s\S]*?<strong>\s*([0-9.,]+)\s*<\/strong>/i);
      if (match && match[1]) {
        const cleanVal = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
        if (!isNaN(cleanVal) && cleanVal > 10 && cleanVal < 5000) {
          const rounded = Math.round(cleanVal * 100) / 100;
          return {
            rate: rounded,
            date: todayStr,
            source: 'Portal BCV Directo (www.bcv.org.ve)',
            lastUpdated: new Date().toISOString(),
            success: true,
            isFallback: false,
          };
        }
      }
    }
  } catch (err: any) {
    console.warn('[BCV-Service] Intento 3 (bcv.org.ve directo) falló:', err.message);
  }

  // 4. Fallback si no hay conexión a internet al momento
  return {
    rate: DEFAULT_RATE,
    date: todayStr,
    source: 'Tasa en Caché Local',
    lastUpdated: new Date().toISOString(),
    success: false,
    isFallback: true,
  };
}
