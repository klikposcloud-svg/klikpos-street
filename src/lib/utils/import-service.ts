import { venematicDB } from '@/lib/indexeddb/db'
import { firestore } from '@/lib/firebase/firestore'
import { writeBatch, doc } from 'firebase/firestore'
import type { IDBProduct } from '@/lib/indexeddb/db'

export interface ImportColumn {
  fileColumn: string
  dbField: string
  required: boolean
}

export interface ImportValidationResult {
  row: number
  field: string
  value: string
  error: string
  severity: 'error' | 'warning'
}

export interface ImportStats {
  totalRows: number
  validRows: number
  invalidRows: number
  duplicateRows: number
  importedRows: number
  failedRows: number
  errors: ImportValidationResult[]
  warnings: ImportValidationResult[]
}

export interface ImportProduct {
  producto_id: string
  sku: string
  nombre: string
  categoria: string
  precio_base_usd: number
  stock_actual: number
  stock_minimo: number
  reconocimiento_visual_data: string
  ultima_actualizacion: string
  unidad?: string
  proveedor?: string
  descripcion?: string
}

const DB_FIELD_OPTIONS = [
  { value: 'nombre', label: 'Nombre del Producto', required: true },
  { value: 'sku', label: 'Código de Barras / SKU', required: false },
  { value: 'categoria', label: 'Categoría', required: false },
  { value: 'precio_base_usd', label: 'Precio Base USD', required: true },
  { value: 'stock_actual', label: 'Stock Actual', required: true },
  { value: 'stock_minimo', label: 'Stock Mínimo', required: false },
  { value: 'costo_usd', label: 'Costo USD', required: false },
  { value: 'unidad', label: 'Unidad (unit/kg/lb/liter/pack)', required: false },
  { value: 'proveedor', label: 'Proveedor', required: false },
  { value: 'descripcion', label: 'Descripción', required: false },
]

const SAINT_MAPPINGS: Record<string, string> = {
  'codprod': 'sku',
  'barra': 'sku',
  'referencia': 'sku',
  'codigo': 'sku',
  'codigo_barra': 'sku',
  'barcode': 'sku',
  'codigo de barra': 'sku',
  'cod_barra': 'sku',
  'descrip': 'nombre',
  'descripcion': 'nombre',
  'nombre': 'nombre',
  'producto': 'nombre',
  'articulo': 'nombre',
  'detalle': 'nombre',
  'codinst': 'categoria',
  'categoria': 'categoria',
  'grupo': 'categoria',
  'linea': 'categoria',
  'precio': 'precio_base_usd',
  'precio_venta': 'precio_base_usd',
  'p_venta': 'precio_base_usd',
  'precio1': 'precio_base_usd',
  'precio2': 'precio_base_usd',
  'costo': 'costo_usd',
  'costo_promedio': 'costo_usd',
  'existen': 'stock_actual',
  'existencia': 'stock_actual',
  'stock': 'stock_actual',
  'cantidad': 'stock_actual',
  'exist': 'stock_actual',
  'stock_min': 'stock_minimo',
  'existencia_min': 'stock_minimo',
  'minimo': 'stock_minimo',
  'unidad': 'unidad',
  'proveedor': 'proveedor',
  'rif_proveedor': 'proveedor',
  'foto': 'image',
  'imagen': 'image',
  'image': 'image',
}

const PROFIT_MAPPINGS: Record<string, string> = {
  'itemcode': 'sku',
  'item_code': 'sku',
  'codigo_articulo': 'sku',
  'descripcion_articulo': 'nombre',
  'descripcion': 'nombre',
  'nombre_articulo': 'nombre',
  'linea': 'categoria',
  'categoria': 'categoria',
  'grupo': 'categoria',
  'precio_venta': 'precio_base_usd',
  'precio': 'precio_base_usd',
  'ultimo_costo': 'costo_usd',
  'costo': 'costo_usd',
  'existencia_actual': 'stock_actual',
  'existencia': 'stock_actual',
  'stock': 'stock_actual',
  'exist_min': 'stock_minimo',
  'stock_minimo': 'stock_minimo',
  'unidad_medida': 'unidad',
}

export class ImportService {
  static detectSourceSystem(headers: string[]): 'saint' | 'profit' | 'unknown' {
    const lowerHeaders = headers.map((h) => h.toLowerCase().trim().replace(/\s+/g, '_'))

    let saintScore = 0
    let profitScore = 0

    for (const header of lowerHeaders) {
      if (SAINT_MAPPINGS[header]) saintScore++
      if (PROFIT_MAPPINGS[header]) profitScore++
    }

    if (saintScore > profitScore && saintScore >= 2) return 'saint'
    if (profitScore > saintScore && profitScore >= 2) return 'profit'
    if (saintScore >= 1 || profitScore >= 1) return saintScore >= profitScore ? 'saint' : 'profit'
    return 'unknown'
  }

  static autoMapColumns(headers: string[]): ImportColumn[] {
    const sourceSystem = this.detectSourceSystem(headers)
    const mappings = sourceSystem === 'saint' ? SAINT_MAPPINGS : sourceSystem === 'profit' ? PROFIT_MAPPINGS : {}

    const columns: ImportColumn[] = []
    const mappedDbFields = new Set<string>()

    for (const header of headers) {
      const normalizedKey = header.toLowerCase().trim().replace(/\s+/g, '_')
      const dbField = mappings[normalizedKey] || ''

      if (dbField && !mappedDbFields.has(dbField)) {
        mappedDbFields.add(dbField)
        const fieldOption = DB_FIELD_OPTIONS.find((f) => f.value === dbField)
        columns.push({
          fileColumn: header,
          dbField,
          required: fieldOption?.required || false,
        })
      }
    }

    return columns
  }

  static getDbFieldOptions(): typeof DB_FIELD_OPTIONS {
    return DB_FIELD_OPTIONS
  }

  static validateRow(
    row: Record<string, string>,
    columnMapping: ImportColumn[],
    existingBarcodes: Set<string>
  ): { product: ImportProduct | null; errors: ImportValidationResult[]; warnings: ImportValidationResult[] } {
    const errors: ImportValidationResult[] = []
    const warnings: ImportValidationResult[] = []
    const product: Partial<ImportProduct> = {}

    for (const mapping of columnMapping) {
      const rawValue = row[mapping.fileColumn]?.trim() || ''

      switch (mapping.dbField) {
        case 'nombre':
          if (!rawValue && mapping.required) {
            errors.push({
              row: 0,
              field: 'nombre',
              value: rawValue,
              error: 'El nombre del producto es obligatorio',
              severity: 'error',
            })
          }
          product.nombre = rawValue || 'Sin nombre'
          break

        case 'sku':
          if (rawValue) {
            const cleanedSku = rawValue.replace(/[^a-zA-Z0-9]/g, '')
            if (existingBarcodes.has(cleanedSku)) {
              warnings.push({
                row: 0,
                field: 'sku',
                value: rawValue,
                error: 'Código de barras duplicado - se actualizará el producto existente',
                severity: 'warning',
              })
            }
            product.sku = cleanedSku
          } else {
            product.sku = ''
          }
          break

        case 'categoria':
          product.categoria = rawValue || 'Sin categoría'
          break

        case 'precio_base_usd':
          if (!rawValue && mapping.required) {
            errors.push({
              row: 0,
              field: 'precio_base_usd',
              value: rawValue,
              error: 'El precio es obligatorio',
              severity: 'error',
            })
          } else if (rawValue) {
            const price = parseFloat(rawValue.replace(/[$,]/g, '').replace(',', '.'))
            if (isNaN(price) || price < 0) {
              errors.push({
                row: 0,
                field: 'precio_base_usd',
                value: rawValue,
                error: `Precio inválido: debe ser un número positivo`,
                severity: 'error',
              })
            } else if (price > 100000) {
              warnings.push({
                row: 0,
                field: 'precio_base_usd',
                value: rawValue,
                error: `Precio inusualmente alto: $${price.toFixed(2)}. ¿Está en USD?`,
                severity: 'warning',
              })
            } else {
              product.precio_base_usd = Math.round(price * 100) / 100
            }
          } else {
            product.precio_base_usd = 0
          }
          break

        case 'stock_actual':
          if (!rawValue && mapping.required) {
            errors.push({
              row: 0,
              field: 'stock_actual',
              value: rawValue,
              error: 'El stock es obligatorio',
              severity: 'error',
            })
          } else if (rawValue) {
            const stock = parseInt(rawValue.replace(/,/g, ''), 10)
            if (isNaN(stock) || stock < 0) {
              errors.push({
                row: 0,
                field: 'stock_actual',
                value: rawValue,
                error: 'Stock inválido: debe ser un número entero positivo',
                severity: 'error',
              })
            } else {
              product.stock_actual = stock
            }
          } else {
            product.stock_actual = 0
          }
          break

        case 'stock_minimo':
          if (rawValue) {
            const minStock = parseInt(rawValue.replace(/,/g, ''), 10)
            product.stock_minimo = isNaN(minStock) ? 5 : minStock
          } else {
            product.stock_minimo = 5
          }
          break

        case 'costo_usd':
          if (rawValue) {
            const cost = parseFloat(rawValue.replace(/[$,]/g, '').replace(',', '.'))
            product.precio_base_usd = isNaN(cost) || cost < 0 ? 0 : Math.round(cost * 100) / 100
          }
          break

        case 'unidad':
          const validUnits = ['unit', 'kg', 'lb', 'liter', 'pack']
          const unit = rawValue.toLowerCase().trim()
          product.unidad = validUnits.includes(unit) ? unit : 'unit'
          break

        case 'proveedor':
          product.proveedor = rawValue || ''
          break

        case 'descripcion':
          product.descripcion = rawValue || ''
          break
      }
    }

    if (!product.nombre) product.nombre = 'Sin nombre'
    if (!product.categoria) product.categoria = 'Sin categoría'
    if (product.precio_base_usd === undefined) product.precio_base_usd = 0
    if (product.stock_actual === undefined) product.stock_actual = 0
    if (product.stock_minimo === undefined) product.stock_minimo = 5

    const importProduct: ImportProduct = {
      producto_id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sku: product.sku || '',
      nombre: product.nombre,
      categoria: product.categoria,
      precio_base_usd: product.precio_base_usd,
      stock_actual: product.stock_actual,
      stock_minimo: product.stock_minimo,
      reconocimiento_visual_data: '',
      ultima_actualizacion: new Date().toISOString(),
    }

    return { product: errors.length > 0 ? null : importProduct, errors, warnings }
  }

  static convertToIDBProduct(importProduct: ImportProduct, storeId: string): IDBProduct {
    return {
      id: importProduct.producto_id,
      storeId,
      name: importProduct.nombre,
      description: '',
      barcode: importProduct.sku,
      category: importProduct.categoria,
      subcategory: '',
      priceUSD: importProduct.precio_base_usd,
      costUSD: 0,
      stock: importProduct.stock_actual,
      minStock: importProduct.stock_minimo,
      maxStock: importProduct.stock_actual * 3,
      unit: 'unit',
      image: '',
      supplier: '',
      tags: [],
      isScanned: false,
      visualCategory: importProduct.reconocimiento_visual_data,
      createdAt: importProduct.ultima_actualizacion,
      updatedAt: importProduct.ultima_actualizacion,
    }
  }

  static async batchUploadToFirestore(
    products: IDBProduct[],
    batchSize: number = 250
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)

      try {
        const fw = await import('firebase/firestore')
        const batchWriter = fw.writeBatch(fw.getFirestore())

        for (const product of batch) {
          const docRef = fw.doc(fw.getFirestore(), 'products', product.id)
          batchWriter.set(docRef, {
            ...product,
            createdAt: fw.serverTimestamp(),
            updatedAt: fw.serverTimestamp(),
          })
        }

        await batchWriter.commit()
        success += batch.length
      } catch (error) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error)
        failed += batch.length
        errors.push(`Lote ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`)

        for (const product of batch) {
          try {
            await firestore.create('products', product as unknown as Record<string, unknown>, product.id)
            success++
            failed--
          } catch (individualError) {
            errors.push(`Producto ${product.name}: ${individualError instanceof Error ? individualError.message : 'Error'}`)
          }
        }
      }

      if (i + batchSize < products.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    return { success, failed, errors }
  }

  static async batchSaveToIndexedDB(products: IDBProduct[]): Promise<void> {
    await venematicDB.bulkUpsertProducts(products)
  }
}
