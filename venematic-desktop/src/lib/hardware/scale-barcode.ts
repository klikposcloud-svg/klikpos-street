// scale-barcode.ts - Decodificador Profesional de Códigos de Barras de Balanzas (EAN-13 / GS1 In-Store)
// Compatible con balanzas etiquetadoras: Torrey, CAS, Toledo, Dibal, Systel, Kretz, Bizerba, etc.

export interface ScaleBarcodeConfig {
  enabled: boolean;
  weightPrefixes: string[]; // Prefijos que indican peso (por defecto '20', '22', '24')
  pricePrefixes: string[];  // Prefijos que indican importe/precio (por defecto '21', '23')
  pluLength: 4 | 5;         // Longitud del PLU del producto: 4 dígitos (estándar) o 5 dígitos
  weightDecimals: number;   // Decimales del peso: 3 (ej: 00450 = 0.450 kg)
  priceDecimals: number;    // Decimales del precio: 2 (ej: 00450 = 4.50)
}

export const DEFAULT_SCALE_BARCODE_CONFIG: ScaleBarcodeConfig = {
  enabled: true,
  weightPrefixes: ['20', '22', '24'],
  pricePrefixes: ['21', '23'],
  pluLength: 4,
  weightDecimals: 3,
  priceDecimals: 2,
};

export interface ParsedScaleBarcode {
  isScaleBarcode: boolean;
  type: 'weight' | 'price';
  rawBarcode: string;
  prefix: string;
  plu: string;
  candidatePlus: string[]; // Lista de variantes para búsqueda: '0123', '123', '00123', 'PLU-0123'
  value: number;           // Si type === 'weight': peso en kg (0.450). Si type === 'price': importe (4.50)
  formattedValue: string;  // '0.450 kg' o '$4.50'
  checksum: string;
}

const STORAGE_KEY = 'venematic_scale_barcode_config';

export function getScaleBarcodeConfig(): ScaleBarcodeConfig {
  if (typeof window === 'undefined') return DEFAULT_SCALE_BARCODE_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SCALE_BARCODE_CONFIG, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_SCALE_BARCODE_CONFIG;
}

export function saveScaleBarcodeConfig(cfg: Partial<ScaleBarcodeConfig>): ScaleBarcodeConfig {
  const current = getScaleBarcodeConfig();
  const updated = { ...current, ...cfg };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

/**
 * Decodifica un código de barras de 12 o 13 dígitos emitido por una balanza etiquetadora.
 * 
 * Estructuras estándar:
 * EAN-13 con PLU de 4 dígitos: 20 + PPPP (4) + VVVVV (5) + C (1) = 13 dígitos
 * EAN-13 con PLU de 5 dígitos: 20 + PPPPP (5) + VVVV (4 o 5) + C (1) = 12 o 13 dígitos
 */
export function parseScaleBarcode(
  rawCode: string,
  userConfig?: Partial<ScaleBarcodeConfig>
): ParsedScaleBarcode | null {
  if (!rawCode) return null;
  const clean = rawCode.trim().replace(/\D/g, ''); // Solo dígitos

  // Debe tener 12 o 13 dígitos para ser un código GS1 In-Store / EAN-13
  if (clean.length !== 12 && clean.length !== 13) {
    return null;
  }

  const config = { ...getScaleBarcodeConfig(), ...userConfig };
  if (!config.enabled) return null;

  const prefix2 = clean.slice(0, 2);
  const isWeight = config.weightPrefixes.includes(prefix2);
  const isPrice = config.pricePrefixes.includes(prefix2);

  if (!isWeight && !isPrice) {
    return null;
  }

  const type: 'weight' | 'price' = isWeight ? 'weight' : 'price';
  const pluLen = config.pluLength;
  const plu = clean.slice(2, 2 + pluLen);
  
  // El remanente antes del dígito de control final
  const valuePart = clean.length === 13 
    ? clean.slice(2 + pluLen, 12) 
    : clean.slice(2 + pluLen, 11);

  const checksum = clean.slice(-1);
  const rawNum = parseInt(valuePart, 10);

  if (isNaN(rawNum)) return null;

  let value = 0;
  let formattedValue = '';

  if (type === 'weight') {
    // 00450 con 3 decimales = 0.450 kg
    const divisor = Math.pow(10, config.weightDecimals);
    value = Number((rawNum / divisor).toFixed(config.weightDecimals));
    formattedValue = `${value.toFixed(3)} kg`;
  } else {
    // 00450 con 2 decimales = $4.50
    const divisor = Math.pow(10, config.priceDecimals);
    value = Number((rawNum / divisor).toFixed(config.priceDecimals));
    formattedValue = `$${value.toFixed(2)}`;
  }

  // Generar variantes de búsqueda para coincidir con cómo el usuario registró el código en inventario
  const numericPlu = parseInt(plu, 10).toString();
  const candidatePlus = Array.from(
    new Set([
      plu,                     // '0123'
      numericPlu,              // '123'
      plu.padStart(5, '0'),    // '00123'
      plu.padStart(6, '0'),    // '000123'
      `PLU-${plu}`,            // 'PLU-0123'
      `PLU-${numericPlu}`,     // 'PLU-123'
      `${prefix2}${plu}`,      // '200123'
    ])
  );

  return {
    isScaleBarcode: true,
    type,
    rawBarcode: clean,
    prefix: prefix2,
    plu,
    candidatePlus,
    value,
    formattedValue,
    checksum,
  };
}

/**
 * Busca un producto en el inventario que coincida con el PLU extraído de una etiqueta de balanza.
 */
export function findProductByScalePLU(
  products: any[],
  parsed: ParsedScaleBarcode
): any | null {
  if (!parsed || !parsed.candidatePlus) return null;

  for (const candidate of parsed.candidatePlus) {
    const found = products.find((p) => {
      const b = (p.barcode || '').trim().toLowerCase();
      const c = candidate.toLowerCase();
      return b === c || b === `plu-${c}` || b === `p-${c}`;
    });
    if (found) return found;
  }

  // Si no encontró por coincidencia exacta de código, probar por ID numérico si coincide con el PLU
  const numericId = parseInt(parsed.plu, 10);
  if (!isNaN(numericId)) {
    const foundById = products.find((p) => p.id === numericId);
    if (foundById) return foundById;
  }

  return null;
}
