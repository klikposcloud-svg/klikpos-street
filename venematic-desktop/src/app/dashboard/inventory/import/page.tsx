'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from '@/lib/i18n/I18nProvider'
import { ImportService, type ImportColumn, type ImportValidationResult, type ImportProduct } from '@/lib/utils/import-service'
import { venematicDB } from '@/lib/indexeddb/db'
import type { IDBProduct } from '@/lib/indexeddb/db'
import { syncManager } from '@/lib/indexeddb/sync'

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'

type ParsedRow = {
  _rowIndex: number
  [key: string]: any
}

export default function ImportPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState<ImportStep>('upload')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [columnMapping, setColumnMapping] = useState<ImportColumn[]>([])
  const [validationResults, setValidationResults] = useState<{ errors: ImportValidationResult[]; warnings: ImportValidationResult[] }>({ errors: [], warnings: [] })
  const [validProducts, setValidProducts] = useState<ImportProduct[]>([])
  const [importStats, setImportStats] = useState({ total: 0, imported: 0, failed: 0, duplicates: 0, errors: [] as string[] })
  const [dragOver, setDragOver] = useState(false)
  const [sourceSystem, setSourceSystem] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name)
    const extension = file.name.split('.').pop()?.toLowerCase() || ''

    if (['csv', 'svs', 'txt'].includes(extension)) {
      await parseCSV(file)
    } else if (extension === 'xlsx' || extension === 'xls') {
      await parseExcel(file)
    } else if (extension === 'json') {
      await parseJSON(file)
    } else {
      alert('Formato no soportado. Use CSV, SVS, TXT, JSON o Excel (.xlsx, .xls)')
    }
  }, [])

  const parseJSON = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const list: any[] = Array.isArray(data) ? data : data.products || data.items || []

      if (!list.length) {
        alert('El archivo JSON no contiene una lista válida de productos')
        return
      }

      const fileHeaders = Object.keys(list[0])
      setHeaders(fileHeaders)

      const parsedRows: ParsedRow[] = list.map((item, index) => {
        const row: ParsedRow = { _rowIndex: index + 2 }
        fileHeaders.forEach((h) => {
          row[h] = item[h] !== undefined && item[h] !== null ? String(item[h]).trim() : ''
        })
        return row
      })

      setRows(parsedRows)
      autoDetectAndMap(fileHeaders)
      setStep('mapping')
    } catch (err: any) {
      alert(`Error al leer archivo JSON: ${err.message}`)
    }
  }

  const parseCSV = async (file: File) => {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((line) => line.trim())

    if (lines.length < 2) {
      alert('El archivo está vacío o no tiene datos válidos')
      return
    }

    const delimiter = detectDelimiter(lines[0])
    const fileHeaders = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim())

    setHeaders(fileHeaders)

    const parsedRows: ParsedRow[] = lines.slice(1).map((line, index) => {
      const values = parseCSVLine(line, delimiter)
      const row: ParsedRow = { _rowIndex: index + 2 }
      fileHeaders.forEach((header, i) => {
        row[header] = values[i]?.replace(/^["']|["']$/g, '').trim() || ''
      })
      return row
    })

    setRows(parsedRows)
    autoDetectAndMap(fileHeaders)
    setStep('mapping')
  }

  const parseExcel = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()

    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })

      if (jsonData.length < 2) {
        alert('El archivo está vacío o no tiene datos válidos')
        return
      }

      const fileHeaders = jsonData[0].map((h: any) => String(h).trim())
      setHeaders(fileHeaders)

      const parsedRows: ParsedRow[] = jsonData.slice(1).map((rowValues, index) => {
        const row: ParsedRow = { _rowIndex: index + 2 }
        fileHeaders.forEach((header, i) => {
          row[header] = String(rowValues[i] ?? '').trim()
        })
        return row
      })

      setRows(parsedRows)
      autoDetectAndMap(fileHeaders)
      setStep('mapping')
    } catch (error) {
      console.error('Error parsing Excel:', error)
      alert('Error al leer el archivo Excel. Asegúrese de que sea un archivo .xlsx válido.')
    }
  }

  const detectDelimiter = (line: string): string => {
    const delimiters = [',', ';', '\t', '|']
    const counts = delimiters.map((d) => ({ delimiter: d, count: (line.match(new RegExp(d === '|' ? '\\|' : d, 'g')) || []).length }))
    return counts.sort((a, b) => b.count - a.count)[0]?.delimiter || ','
  }

  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }

  const autoDetectAndMap = (fileHeaders: string[]) => {
    const detected = ImportService.detectSourceSystem(fileHeaders)
    setSourceSystem(detected === 'saint' ? 'Saint Admin' : detected === 'profit' ? 'Profit Plus' : 'Desconocido')

    const autoMapped = ImportService.autoMapColumns(fileHeaders)
    setColumnMapping(autoMapped)
  }

  const updateMapping = (fileColumn: string, dbField: string) => {
    setColumnMapping((prev) =>
      prev.map((m) => (m.fileColumn === fileColumn ? { ...m, dbField } : m))
    )
  }

  const addMapping = () => {
    const unmappedHeaders = headers.filter(
      (h) => !columnMapping.some((m) => m.fileColumn === h)
    )
    if (unmappedHeaders.length > 0) {
      setColumnMapping((prev) => [
        ...prev,
        { fileColumn: unmappedHeaders[0], dbField: '', required: false },
      ])
    }
  }

  const removeMapping = (fileColumn: string) => {
    setColumnMapping((prev) => prev.filter((m) => m.fileColumn !== fileColumn))
  }

  const validateAndPreview = useCallback(() => {
    const activeMapping = columnMapping.filter((m) => m.dbField)
    if (activeMapping.length === 0) {
      alert('Debe mapear al menos una columna')
      return
    }

    const existingBarcodes = new Set<string>()

    const allErrors: ImportValidationResult[] = []
    const allWarnings: ImportValidationResult[] = []
    const valid: ImportProduct[] = []

    rows.forEach((row, index) => {
      const { product, errors, warnings } = ImportService.validateRow(
        row,
        activeMapping,
        existingBarcodes
      )

      const rowErrors = errors.map((e) => ({ ...e, row: row._rowIndex }))
      const rowWarnings = warnings.map((w) => ({ ...w, row: row._rowIndex }))

      allErrors.push(...rowErrors)
      allWarnings.push(...rowWarnings)

      if (product) {
        if (product.sku) existingBarcodes.add(product.sku)
        valid.push(product)
      }
    })

    setValidationResults({ errors: allErrors, warnings: allWarnings })
    setValidProducts(valid)
    setStep('preview')
  }, [columnMapping, rows])

  const executeImport = async () => {
    setStep('importing')

    const storeId = await venematicDB.getSetting<string>('current_store_id') || 'default_store'
    const existingBarcodes = new Set<string>()

    const existingProducts = await venematicDB.getProductsByStore(storeId)
    existingProducts.forEach((p) => {
      if (p.barcode) existingBarcodes.add(p.barcode)
    })

    const idbProducts: IDBProduct[] = []
    let duplicates = 0

    for (const importProduct of validProducts) {
      const idbProduct = ImportService.convertToIDBProduct(importProduct, storeId)

      if (importProduct.sku && existingBarcodes.has(importProduct.sku)) {
        const existing = existingProducts.find((p) => p.barcode === importProduct.sku)
        if (existing) {
          const updated = {
            ...existing,
            name: importProduct.nombre || existing.name,
            priceUSD: importProduct.precio_base_usd || existing.priceUSD,
            stock: importProduct.stock_actual,
            minStock: importProduct.stock_minimo,
            category: importProduct.categoria || existing.category,
            updatedAt: new Date().toISOString(),
          }
          idbProducts.push(updated)
          duplicates++
        }
      } else {
        idbProducts.push(idbProduct)
      }
    }

    await venematicDB.bulkUpsertProducts(idbProducts)

    let firestoreSuccess = 0
    let firestoreFailed = 0
    let firestoreErrors: string[] = []

    if (navigator.onLine) {
      const result = await ImportService.batchUploadToFirestore(idbProducts, 100)
      firestoreSuccess = result.success
      firestoreFailed = result.failed
      firestoreErrors = result.errors
    }

    setImportStats({
      total: validProducts.length,
      imported: idbProducts.length,
      failed: validProducts.length - idbProducts.length,
      duplicates,
      errors: firestoreErrors,
    })

    if (navigator.onLine) {
      syncManager.syncProducts(storeId)
    }

    setStep('complete')
  }

  const resetImport = () => {
    setStep('upload')
    setFileName('')
    setHeaders([])
    setRows([])
    setColumnMapping([])
    setValidationResults({ errors: [], warnings: [] })
    setValidProducts([])
    setImportStats({ total: 0, imported: 0, failed: 0, duplicates: 0, errors: [] })
    setSourceSystem('')
  }

  const dbFieldOptions = ImportService.getDbFieldOptions()

  const unmappedFields = headers.filter(
    (h) => !columnMapping.some((m) => m.fileColumn === h)
  )

  const previewColumns = columnMapping.filter((m) => m.dbField)

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1329] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Importación Masiva</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Carga productos desde CSV/Excel (Saint, Profit, o cualquier sistema)
            </p>
          </div>
          {step !== 'upload' && (
            <button onClick={resetImport} className="btn-secondary text-sm">
              Nueva Importación
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-6">
          {[
            { key: 'upload', label: '1. Cargar', icon: '📁' },
            { key: 'mapping', label: '2. Mapear', icon: '🔗' },
            { key: 'preview', label: '3. Validar', icon: '✅' },
            { key: 'importing', label: '4. Importar', icon: '📦' },
            { key: 'complete', label: '5. Listo', icon: '🎉' },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  step === s.key
                    ? 'bg-emerald-600 text-white'
                    : ['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(step) >
                      ['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(s.key)
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                }`}
              >
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < 4 && <div className="w-4 h-px bg-slate-300 dark:bg-slate-600" />}
            </div>
          ))}
        </div>

        {step === 'upload' && (
          <div className="card">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                  : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const file = e.dataTransfer.files[0]
                if (file) handleFile(file)
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />
              <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Arrastra tu archivo aquí o haz clic para seleccionar
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Formatos soportados: CSV, Excel (.xlsx, .xls)
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <span className="badge badge-info">Saint Admin</span>
                <span className="badge badge-info">Profit Plus</span>
                <span className="badge badge-info">Cualquier CSV</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Formato esperado del archivo:</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-600">
                      <th className="text-left py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">sku</th>
                      <th className="text-left py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">nombre</th>
                      <th className="text-left py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">categoria</th>
                      <th className="text-left py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">precio_base_usd</th>
                      <th className="text-left py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">stock_actual</th>
                      <th className="text-left py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">stock_minimo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">759123456789</td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">Harina PAN 1kg</td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">Víveres</td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">1.20</td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">45</td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">10</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            {sourceSystem && (
              <div className="card bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    Sistema detectado: <strong>{sourceSystem}</strong> — Se mapearon automáticamente {columnMapping.length} columnas
                  </p>
                </div>
              </div>
            )}

            <div className="card">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Mapeo de Columnas</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Relaciona cada columna de tu archivo con los campos de la base de datos
              </p>

              <div className="space-y-3">
                {columnMapping.map((mapping) => (
                  <div key={mapping.fileColumn} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate block">
                        📄 {mapping.fileColumn}
                      </span>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <select
                      value={mapping.dbField}
                      onChange={(e) => updateMapping(mapping.fileColumn, e.target.value)}
                      className="input-field flex-1 text-sm"
                    >
                      <option value="">-- Seleccionar campo --</option>
                      {dbFieldOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} {opt.required ? '*' : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeMapping(mapping.fileColumn)}
                      className="text-red-500 hover:text-red-600 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {unmappedFields.length > 0 && (
                <button onClick={addMapping} className="mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar columna ({unmappedFields.length} disponibles)
                </button>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={resetImport} className="btn-secondary">Cancelar</button>
                <button onClick={validateAndPreview} className="btn-primary">
                  Validar y Previsualizar ({rows.length} filas)
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="card text-center">
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{rows.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Filas</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-emerald-600">{validProducts.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Válidas</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-red-600">{validationResults.errors.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Errores</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-amber-600">{validationResults.warnings.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Advertencias</p>
              </div>
            </div>

            {validationResults.errors.length > 0 && (
              <div className="card border-red-200 dark:border-red-800">
                <h3 className="text-sm font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Errores ({validationResults.errors.length})
                </h3>
                <div className="max-h-40 overflow-y-auto scrollbar-thin space-y-1">
                  {validationResults.errors.slice(0, 20).map((err, i) => (
                    <div key={i} className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded">
                      Fila {err.row}: <strong>{err.field}</strong> — {err.error}
                    </div>
                  ))}
                  {validationResults.errors.length > 20 && (
                    <p className="text-xs text-slate-500">... y {validationResults.errors.length - 20} errores más</p>
                  )}
                </div>
              </div>
            )}

            {validationResults.warnings.length > 0 && (
              <div className="card border-amber-200 dark:border-amber-800">
                <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Advertencias ({validationResults.warnings.length})
                </h3>
                <div className="max-h-40 overflow-y-auto scrollbar-thin space-y-1">
                  {validationResults.warnings.slice(0, 10).map((warn, i) => (
                    <div key={i} className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded">
                      Fila {warn.row}: {warn.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">
                Previsualización ({validProducts.length > 0 ? `${Math.min(5, validProducts.length)} de ${validProducts.length} productos` : 'Sin productos válidos'})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      {previewColumns.map((col) => (
                        <th key={col.dbField} className="text-left py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">
                          {col.dbField}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validProducts.slice(0, 5).map((product, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                        {previewColumns.map((col) => (
                          <td key={col.dbField} className="py-2 px-3 text-slate-700 dark:text-slate-300">
                            {product[col.dbField as keyof ImportProduct]?.toString() || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setStep('mapping')} className="btn-secondary">Volver al Mapeo</button>
              <button
                onClick={executeImport}
                disabled={validProducts.length === 0}
                className="btn-primary disabled:opacity-50"
              >
                Importar {validProducts.length} Productos
              </button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="card text-center py-16">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Importando productos...</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Guardando {validProducts.length} productos en IndexedDB
              {navigator.onLine ? ' y sincronizando con Firestore' : ' (modo offline)'}
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4">
            <div className="card text-center py-10">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Importación Completada</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {fileName} — {new Date().toLocaleString('es-VE')}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="card text-center">
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{importStats.total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Procesados</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-emerald-600">{importStats.imported}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Importados</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-amber-600">{importStats.duplicates}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Actualizados</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-red-600">{importStats.failed}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Fallidos</p>
              </div>
            </div>

            {importStats.errors.length > 0 && (
              <div className="card border-red-200 dark:border-red-800">
                <h3 className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">Errores de Sincronización Firestore</h3>
                <div className="max-h-32 overflow-y-auto scrollbar-thin space-y-1">
                  {importStats.errors.map((err, i) => (
                    <div key={i} className="text-xs text-red-600 dark:text-red-400">{err}</div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">Los datos se guardaron localmente y se sincronizarán al reconectar.</p>
              </div>
            )}

            <div className="flex justify-center">
              <button onClick={resetImport} className="btn-primary">
                Importar Otro Archivo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
