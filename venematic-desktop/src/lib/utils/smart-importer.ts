import Papa from 'papaparse';

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'number' | 'currency' | 'integer';
}

export interface ImportedProduct {
  sku: string;
  barcode: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  priceUSD: number;
  costUSD: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  supplier: string;
  unit: string;
  rawData: Record<string, string>;
  validationErrors: string[];
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  validProducts: number;
  duplicateCount: number;
  errorCount: number;
  products: ImportedProduct[];
  errors: string[];
  duplicates: { row: number; sku: string; reason: string }[];
}

export interface FieldDefinition {
  field: string;
  label: string;
  labelEn: string;
  required: boolean;
  type: 'string' | 'number' | 'currency' | 'integer';
  patterns?: string[];
}

export const PRODUCT_FIELDS: FieldDefinition[] = [
  { field: 'sku', label: 'SKU / Código', labelEn: 'SKU / Code', required: true, type: 'string', patterns: ['sku', 'cod_art', 'codigo', 'cod_articulo', 'cod', 'articulo_id', 'product_id', 'id'] },
  { field: 'barcode', label: 'Código de Barras', labelEn: 'Barcode', required: false, type: 'string', patterns: ['barcode', 'ean', 'cod_barra', 'codigo_barra', 'barra', 'cod_barras', 'upc', 'ref'] },
  { field: 'name', label: 'Nombre del Producto', labelEn: 'Product Name', required: true, type: 'string', patterns: ['nombre', 'descripcion', 'producto', 'articulo', 'name', 'articulo_desc', 'desc_art', 'denominacion', 'titulo'] },
  { field: 'description', label: 'Descripción', labelEn: 'Description', required: false, type: 'string', patterns: ['desc', 'detalle', 'observacion', 'nota'] },
  { field: 'category', label: 'Categoría', labelEn: 'Category', required: false, type: 'string', patterns: ['categoria', 'category', 'tipo', 'familia', 'rubro', 'grupo', 'linea', 'seccion'] },
  { field: 'subcategory', label: 'Subcategoría', labelEn: 'Subcategory', required: false, type: 'string', patterns: ['subcategoria', 'sub_category', 'subtipo', 'subfamilia', 'marca', 'brand'] },
  { field: 'priceUSD', label: 'Precio USD', labelEn: 'Price USD', required: true, type: 'currency', patterns: ['precio', 'precio_1', 'precio_usd', 'price', 'pvp', 'precio_venta', 'precio_vta', 'sale_price', 'valor'] },
  { field: 'costUSD', label: 'Costo USD', labelEn: 'Cost USD', required: false, type: 'currency', patterns: ['costo', 'coste', 'precio_compra', 'cost', 'precio_costo', 'compra'] },
  { field: 'stock', label: 'Existencia', labelEn: 'Stock', required: false, type: 'integer', patterns: ['stock', 'existencia', 'exis', 'cantidad', 'cant', 'existencia_actual', 'actual', 'disponible', 'on_hand', 'qty', 'quantity'] },
  { field: 'minStock', label: 'Stock Mínimo', labelEn: 'Min Stock', required: false, type: 'integer', patterns: ['stock_min', 'minimo', 'min_stock', 'stock_minimo', 'reorden', 'punto_reorden', ' reorder'] },
  { field: 'supplier', label: 'Proveedor', labelEn: 'Supplier', required: false, type: 'string', patterns: ['proveedor', 'suplidor', 'supplier', 'distribuidor', 'proveeduria'] },
  { field: 'unit', label: 'Unidad', labelEn: 'Unit', required: false, type: 'string', patterns: ['unidad', 'unit', 'umedida', 'presentacion', 'presentacion', 'formato', 'umed'] },
];

const COLUMN_ALIASES: Record<string, string[]> = {
  sku: ['sku', 'cod_art', 'codigo', 'cod_articulo', 'cod', 'articulo_id', 'product_id', 'id', 'reference', 'ref', 'art_id'],
  barcode: ['barcode', 'ean', 'cod_barra', 'codigo_barra', 'barra', 'cod_barras', 'upc', 'ref', 'codigo_ean'],
  name: ['nombre', 'descripcion', 'producto', 'articulo', 'name', 'articulo_desc', 'desc_art', 'denominacion', 'titulo', 'descripcion_producto'],
  description: ['desc', 'detalle', 'observacion', 'nota', 'comments', 'observaciones'],
  category: ['categoria', 'category', 'tipo', 'familia', 'rubro', 'grupo', 'linea', 'seccion', 'cat'],
  subcategory: ['subcategoria', 'sub_category', 'subtipo', 'subfamilia', 'marca', 'brand', 'modelo'],
  priceUSD: ['precio', 'precio_1', 'precio_usd', 'price', 'pvp', 'precio_venta', 'precio_vta', 'sale_price', 'valor', 'valor_venta', 'precio_sin_iva', 'precio_con_iva'],
  costUSD: ['costo', 'coste', 'precio_compra', 'cost', 'precio_costo', 'compra', 'costo_unitario'],
  stock: ['stock', 'existencia', 'exis', 'cantidad', 'cant', 'existencia_actual', 'actual', 'disponible', 'on_hand', 'qty', 'quantity', 'inv', 'inventario'],
  minStock: ['stock_min', 'minimo', 'min_stock', 'stock_minimo', 'reorden', 'punto_reorden', 'reorder', 'stock_seguridad', 'min_existencia'],
  supplier: ['proveedor', 'suplidor', 'supplier', 'distribuidor', 'proveeduria', 'vendor'],
  unit: ['unidad', 'unit', 'umedida', 'presentacion', 'presentacion', 'formato', 'umed', 'presentation'],
};

export class SmartImporter {
  private detectedMappings: Map<string, string> = new Map();
  private originalHeaders: string[] = [];

  normalizeColumnName(header: string): string {
    return header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_\-\s]+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .trim();
  }

  autoDetectMappings(headers: string[]): Map<string, string> {
    this.originalHeaders = headers;
    this.detectedMappings.clear();

    const normalizedHeaders = headers.map((h, idx) => ({
      original: h,
      normalized: this.normalizeColumnName(h),
      index: idx
    }));

    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      for (const header of normalizedHeaders) {
        if (aliases.includes(header.normalized)) {
          this.detectedMappings.set(header.original, field);
          break;
        }
      }
    }

    return this.detectedMappings;
  }

  parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
    const result = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim()
    });

    return {
      headers: result.meta.fields || [],
      rows: result.data
    };
  }

  async parseFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
    const content = await file.text();
    return this.parseCSV(content);
  }

  transformValue(value: string, type: string, field: string): number | string {
    if (!value || value === '' || value === '-' || value === 'N/A') {
      return type === 'number' || type === 'currency' || type === 'integer' ? 0 : '';
    }

    const cleanValue = value
      .replace(/[^\d.,\-]/g, '')
      .replace(/\s+/g, '')
      .trim();

    switch (type) {
      case 'currency':
      case 'number': {
        let normalized = cleanValue.replace(',', '.');
        const parts = normalized.split('.');
        if (parts.length > 2) {
          normalized = parts[0] + '.' + parts.slice(1).join('');
        }
        const num = parseFloat(normalized);
        return isNaN(num) ? 0 : Math.round(num * 100) / 100;
      }
      case 'integer': {
        const num = parseInt(cleanValue.replace(/[^\d\-]/g, ''), 10);
        return isNaN(num) ? 0 : num;
      }
      default:
        return value.trim();
    }
  }

  validateProduct(product: Partial<ImportedProduct>): string[] {
    const errors: string[] = [];

    if (!product.sku || product.sku === '') {
      errors.push('SKU requerido');
    }

    if (!product.name || product.name === '') {
      errors.push('Nombre requerido');
    }

    if (product.priceUSD !== undefined && product.priceUSD < 0) {
      errors.push('Precio no puede ser negativo');
    }

    if (product.costUSD !== undefined && product.costUSD < 0) {
      errors.push('Costo no puede ser negativo');
    }

    if (product.stock !== undefined && product.stock < 0) {
      errors.push('Stock no puede ser negativo');
    }

    if (product.minStock !== undefined && product.minStock < 0) {
      errors.push('Stock mínimo no puede ser negativo');
    }

    if (product.priceUSD !== undefined && product.costUSD !== undefined && product.costUSD > product.priceUSD) {
      errors.push('⚠️ Costo mayor al precio (¿invertido?)');
    }

    return errors;
  }

  mapRowToProduct(
    row: Record<string, string>,
    mapping: Map<string, string>
  ): Partial<ImportedProduct> {
    const product: Partial<ImportedProduct> & { rawData: Record<string, string> } = {
      rawData: { ...row }
    };

    for (const [sourceCol, targetField] of Array.from(mapping.entries())) {
      const value = row[sourceCol] || '';
      const fieldDef = PRODUCT_FIELDS.find(f => f.field === targetField);

      if (fieldDef) {
        const transformed = this.transformValue(value, fieldDef.type, fieldDef.field);
        (product as Record<string, unknown>)[targetField] = transformed;
      }
    }

    if (!product.sku && product.barcode) {
      product.sku = product.barcode;
    }

    if (!product.name) {
      product.name = `Producto ${product.sku || 'sin nombre'}`;
    }

    if (product.stock === undefined || product.stock === null) {
      product.stock = 0;
    }

    if (product.minStock === undefined || product.minStock === null) {
      product.minStock = 5;
    }

    return product;
  }

  async batchImport(
    rows: Record<string, string>[],
    mapping: Map<string, string>,
    onProgress?: (current: number, total: number) => void
  ): Promise<ImportResult> {
    const products: ImportedProduct[] = [];
    const errors: string[] = [];
    const duplicates: { row: number; sku: string; reason: string }[] = [];
    const seenSkus = new Map<string, number>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (onProgress) {
        onProgress(i + 1, rows.length);
      }

      const partialProduct = this.mapRowToProduct(row, mapping);
      const errors_product = this.validateProduct(partialProduct);

      if (partialProduct.sku) {
        const skuUpper = (partialProduct.sku as string).toUpperCase();
        if (seenSkus.has(skuUpper)) {
          duplicates.push({
            row: i + 1,
            sku: partialProduct.sku as string,
            reason: `Duplicado de fila ${seenSkus.get(skuUpper)}`
          });
          continue;
        }
        seenSkus.set(skuUpper, i + 1);
      }

      if (errors_product.length > 0) {
        errors.push(`Fila ${i + 1}: ${errors_product.join(', ')}`);
      }

      products.push({
        ...partialProduct,
        validationErrors: errors_product
      } as ImportedProduct);
    }

    const validProducts = products.filter(p => p.validationErrors.length === 0);

    return {
      success: errors.length === 0 && duplicates.length === 0,
      totalRows: rows.length,
      validProducts: validProducts.length,
      duplicateCount: duplicates.length,
      errorCount: errors.length,
      products,
      errors,
      duplicates
    };
  }

  generateSKU(product: Partial<ImportedProduct>): string {
    const prefix = product.category?.substring(0, 3).toUpperCase() || 'PRD';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  prepareForFirestore(
    products: ImportedProduct[],
    storeId: string
  ): Array<Record<string, unknown>> {
    return products.map((product) => ({
      id: `import_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      storeId,
      sku: product.sku || this.generateSKU(product),
      barcode: product.barcode || '',
      name: product.name,
      description: product.description || '',
      category: product.category || 'Sin Categoría',
      subcategory: product.subcategory || '',
      priceUSD: product.priceUSD || 0,
      costUSD: product.costUSD || 0,
      profitMargin: product.priceUSD && product.costUSD
        ? ((product.priceUSD - product.costUSD) / product.priceUSD) * 100
        : 0,
      stock: product.stock || 0,
      minStock: product.minStock || 5,
      maxStock: product.maxStock || 100,
      unit: product.unit || 'unidad',
      supplier: product.supplier || '',
      tags: [],
      isScanned: false,
      visualCategory: '',
      image: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      importBatch: `batch_${Date.now()}`
    }));
  }
}

export const smartImporter = new SmartImporter();
