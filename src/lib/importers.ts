import { LocalProduct } from './db';

export interface ParseResult {
  products: Omit<LocalProduct, 'id'>[];
  totalParsed: number;
  formatDetected: string;
  errors: string[];
}

function cleanText(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/^["']|["']$/g, '');
}

function parseNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  // Handle Venezuelan / European format "1.250,50" -> 1250.50
  const str = String(val).trim();
  const normalized = str.includes(',') && str.includes('.')
    ? str.replace(/\./g, '').replace(',', '.')
    : str.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

// Split a CSV line respecting quoted strings
function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuote = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === delimiter && !insideQuote) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(cleanText);
}

// Auto-detect delimiter (, or ; or \t)
function detectDelimiter(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  const pipes = (firstLine.match(/\|/g) || []).length;

  if (semicolons > commas && semicolons > tabs) return ';';
  if (tabs > commas && tabs > semicolons) return '\t';
  if (pipes > commas && pipes > semicolons) return '|';
  return ',';
}

export function parseInventoryFile(fileContent: string, fileName: string): ParseResult {
  const trimmed = fileContent.trim();
  const ext = fileName.toLowerCase().split('.').pop() || '';

  // 1. JSON
  if (ext === 'json' || trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const rawList = Array.isArray(parsed)
        ? parsed
        : parsed.products || parsed.items || parsed.data || [];

      if (!Array.isArray(rawList)) {
        return { products: [], totalParsed: 0, formatDetected: 'JSON Inválido', errors: ['El archivo JSON no contiene una lista de productos'] };
      }

      const products: Omit<LocalProduct, 'id'>[] = [];
      const errors: string[] = [];

      rawList.forEach((item: any, idx: number) => {
        const barcode = cleanText(item.barcode || item.codigo || item.sku || item.id || `PROD-${idx + 1}`);
        const name = cleanText(item.name || item.nombre || item.descripcion || item.descrip);
        const priceUSD = parseNumber(item.priceUSD || item.price || item.precio || item.precio_usd || item.precio1);

        if (!name) {
          errors.push(`Fila ${idx + 1}: Producto sin nombre`);
          return;
        }

        products.push({
          barcode,
          name,
          category: cleanText(item.category || item.categoria || 'Víveres'),
          priceUSD: priceUSD || 1.0,
          costUSD: parseNumber(item.costUSD || item.costo || item.costo_usd),
          stock: parseNumber(item.stock || item.cantidad || item.existencia) || 0,
          minStock: parseNumber(item.minStock || item.stock_minimo) || 3,
          unit: cleanText(item.unit || item.unidad || 'unidad'),
          image: cleanText(item.image || item.foto || item.imagen) || undefined,
          updatedAt: new Date().toISOString(),
        });
      });

      return {
        products,
        totalParsed: products.length,
        formatDetected: 'JSON Estructurado',
        errors,
      };
    } catch (err: any) {
      return { products: [], totalParsed: 0, formatDetected: 'JSON Inválido', errors: [`Error al leer JSON: ${err.message}`] };
    }
  }

  // 2. CSV / SVS / TXT (Saint Enterprise o Genérico)
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { products: [], totalParsed: 0, formatDetected: 'Archivo Vacío', errors: ['El archivo no contiene suficientes líneas'] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCSVLine(lines[0], delimiter).map((h) =>
    h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  );

  // Check if it's Saint Enterprise SAPROD
  // Saint typical fields: codprod, descrip, precio1, precio2, precio3, existen, costo, codinst, barra
  const isSaint =
    headers.some((h) => h.includes('codprod')) ||
    headers.some((h) => h.includes('descrip')) ||
    headers.some((h) => h.includes('precio1')) ||
    headers.some((h) => h.includes('existen'));

  const formatDetected = isSaint ? 'Saint Enterprise (SAPROD)' : `CSV / Delimitado (${delimiter === '\t' ? 'Tab' : delimiter})`;

  // Header Indices
  const idxBarcode = headers.findIndex((h) =>
    ['barra', 'barcode', 'codprod', 'codigo', 'cod', 'sku', 'ean', 'referencia'].includes(h)
  );
  const idxName = headers.findIndex((h) =>
    ['descrip', 'descripcion', 'nombre', 'name', 'articulo', 'producto'].includes(h)
  );
  const idxPrice = headers.findIndex((h) =>
    ['precio1', 'precio', 'precio_usd', 'price', 'pvp', 'venta', 'precioventa'].includes(h)
  );
  const idxCost = headers.findIndex((h) =>
    ['costo', 'cost', 'costo_usd', 'preciocosto', 'compra'].includes(h)
  );
  const idxStock = headers.findIndex((h) =>
    ['existen', 'existencia', 'stock', 'cantidad', 'qty', 'cant'].includes(h)
  );
  const idxCategory = headers.findIndex((h) =>
    ['codinst', 'categoria', 'departamento', 'category', 'rubro', 'grupo'].includes(h)
  );
  const idxImage = headers.findIndex((h) =>
    ['imagen', 'foto', 'image', 'url', 'img', 'fotourl'].includes(h)
  );

  const products: Omit<LocalProduct, 'id'>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = splitCSVLine(lines[i], delimiter);
    if (rawCols.length < 2) continue;

    const barcode = idxBarcode !== -1 ? rawCols[idxBarcode] : `ITEM-${i}`;
    const name = idxName !== -1 ? rawCols[idxName] : rawCols[1] || '';
    const priceUSD = idxPrice !== -1 ? parseNumber(rawCols[idxPrice]) : 1.0;
    const costUSD = idxCost !== -1 ? parseNumber(rawCols[idxCost]) : 0;
    const stock = idxStock !== -1 ? parseNumber(rawCols[idxStock]) : 0;
    const category = idxCategory !== -1 && rawCols[idxCategory] ? rawCols[idxCategory] : 'Víveres';
    const image = idxImage !== -1 && rawCols[idxImage] ? rawCols[idxImage] : undefined;

    if (!name.trim()) {
      errors.push(`Línea ${i + 1}: Producto sin descripción`);
      continue;
    }

    products.push({
      barcode: barcode.trim() || `PROD-${Date.now()}-${i}`,
      name: name.trim(),
      category: category.trim(),
      priceUSD: priceUSD || 1.0,
      costUSD: costUSD || 0,
      stock: Math.max(0, stock),
      minStock: 3,
      unit: 'unidad',
      image,
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    products,
    totalParsed: products.length,
    formatDetected,
    errors,
  };
}
