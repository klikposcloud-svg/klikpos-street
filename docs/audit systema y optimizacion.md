# 🛡️ Guía Maestra de Auditoría Técnica de Sistema, Escalabilidad y Optimización
## Sistema POS y ERP Comercial Venematic (Offline-First, Cloud Sync & Periféricos)

> **Rol Asignado:** Actúa como un **Comité de Ingenieros Principales de Software, Arquitectos de Backend y Especialistas en Bases de Datos de Alto Rendimiento** (integrando las disciplinas de *agency-backend-architect*, *agency-database-optimizer*, *agency-desktop-app-engineer*, *agency-payments-billing-engineer* y *agency-frontend-developer*).
> 
> **Objetivo:** Someter el código, esquemas de datos y flujos de negocio a una **Auditoría Técnica Rigurosa de Rendimiento, Seguridad y Escalabilidad**, erradicando cuellos de botella silenciosos, bloqueos de interfaz y riesgos de desincronización antes de desplegar en producción masiva.

---

## 🏛️ Pilares de Auditoría Técnica y Normativas Requeridas

### 1. Paginación, Límites de Payload y Anti-Overfetching (Local & Cloud)
- **Supabase / PostgreSQL / Backend:**
  - Prohibir consultas abiertas sin `LIMIT`/`OFFSET` o sin paginación basada en cursor (`WHERE id > last_seen_id` / `ORDER BY created_at DESC LIMIT 50`).
  - Prohibir terminantemente el uso de `SELECT *`. Auditar que solo se seleccionen las columnas estrictamente necesarias para el contexto de la vista o reporte.
- **Dexie.js / IndexedDB / SQLite Local POS:**
  - Erradicar patrones como `db.products.toArray()` o `db.sales.toArray()` cuando el catálogo supera los 5,000 ítems o el historial supera las 10,000 ventas.
  - Implementar cursores indexados (`offset(n).limit(m)`, `.each()`, o colecciones paginadas), virtualización de listas (`react-virtual` / `@tanstack/react-virtual`) en cuadrículas de inventario y tickets.
  - En la versión de escritorio Tauri / SQLite, verificar que las consultas a la base de datos local utilicen índices y no desborden la memoria RAM del WebView2.

### 2. Detección y Erradicación del Problema N+1 y Bloqueo de Ciclos
- **Relaciones en Cloud/SQL:**
  - Detectar consultas a la base de datos dentro de bucles (`map`, `forEach`, `Promise.all`) o en subcomponentes repetitivos.
  - Refactorizar hacia joins nativos, vistas optimizadas, funciones agregadoras (`json_agg` / `json_build_object`) o sintaxis relacional declarativa (`select('*, clientes(*), items(*)')`).
- **Transacciones en Motor Local POS:**
  - Detectar lecturas/escrituras individuales secuenciales (`await db.products.get(...)` en cada ítem de venta).
  - Obligar al uso de transacciones atómicas agrupadas (`db.transaction('rw', [db.sales, db.products, db.inventoryMovements], async () => { ... })`) con `bulkPut`/`bulkUpdate` para aplicar rebaja de stock y registro de venta en una sola operación atómica.

### 3. Estrategia de Indexación, Planes de Consulta y Búsquedas Rápidas (Barcode/PLU)
- **Análisis de Filtros y Ordenamiento:**
  - Analizar cada cláusula `WHERE`, `JOIN`, `ORDER BY`, `GROUP BY` y filtros de búsqueda de productos por código de barras, SKU, PLU de balanza y categoría.
- **Índices en PostgreSQL / Supabase:**
  - Generar el script exacto de migración (`CREATE INDEX CONCURRENTLY IF NOT EXISTS`) para cada clave foránea y columna de alta frecuencia (`barcode`, `tenant_id`, `created_at`, `status`).
  - Emplear índices `GIN` con `pg_trgm` para búsquedas difusas de nombres de productos y clientes, y tipos `B-Tree` para rangos y filtros de fecha.
- **Índices en IndexedDB (Dexie) y SQLite:**
  - Auditar `src/lib/db.ts`: asegurar que los esquemas de Dexie contengan todos los campos buscados (ej: `++id, barcode, name, category, updatedAt`). Si un campo no está indexado en el schema string, Dexie ejecutará un Table Scan en el navegador.

### 4. Seguridad a Nivel de Fila (RLS), RBAC y Aislamiento Multi-Caja
- **Políticas RLS en Supabase / Cloud:**
  - Auditar políticas RLS para evitar que funciones como `auth.uid()` provoquen escaneos secuenciales innecesarios (usar `(select auth.uid())` para forzar evaluación única por consulta en lugar de por fila).
  - Garantizar el aislamiento estricto por tienda o sucursal (`tenant_id` o `store_id`).
- **Control de Acceso POS (RBAC & Supervisor):**
  - Validar roles de Cajero vs. Administrador: anulación de tickets, notas de crédito, descuentos discrecionales y cambios de precio deben requerir PIN de supervisor auditado en bitácora (`voidReason`, `voidedBy`, `voidedAt`).

### 5. Transaccionalidad Fiscal, Balanza y Finanzas Multi-Moneda (SENIAT & BCV)
- **Integridad de Ventas y Pagos Mixtos:**
  - Validar que la sumatoria de pagos (`SalePayment[]`: USD efectivo, Bs. efectivo, Pago Móvil, Tarjeta, Zelle) cubra exactamente el total de la venta considerando la tasa oficial BCV del día, sin pérdidas por redondeo flotante (utilizar enteros de centavos o redondeo estricto a 2 decimales en moneda fiduciaria y 3 decimales en peso/kg).
- **Control de Balanza Comercial:**
  - Garantizar que los productos pesables (`unit: 'kg' | 'gr' | 'lb'`) invoquen siempre el pesaje de balanza (Web Serial / COM) o el modal de peso manual con cálculo `Precio = Peso × Precio Base`, evitando adiciones ciegas de cantidad entera al ticket.
- **Arqueo y Cortes X / Z:**
  - Auditar que el fondo de caja inicial y los cobros del turno se mantengan inmutables en auditoría para el cuadre ciego final y emisión del reporte Z.

### 6. Caching, Estado en el Cliente y Prevención de Re-Renders
- **Ciclo de Vida React en POS:**
  - Erradicar peticiones duplicadas y llamadas redundantes a APIs o IndexedDB en cada renderizado (usar `useMemo`, `useCallback`, y referencias estables `useRef`).
  - Aislar el estado del numpad táctil y lecturas continuas de balanza (varias lecturas por segundo) para que no re-rendericen la cuadrícula entera de productos ni el árbol completo del ticket.
- **Deduplicación e Idempotencia:**
  - Enviar encabezados `Idempotency-Key` o UUID en la creación de ventas para evitar ventas duplicadas ante dobles clics o reintentos de red.

### 7. Sincronización Offline-to-Cloud y Resiliencia de Red
- **Patrón Outbox Local:**
  - Las transacciones generadas sin internet deben persistirse en cola local (`pending_sync_queue`) con estado, timestamp y reintentos exponenciales.
- **Estrategia de Resolución de Conflictos:**
  - Aplicar *Last-Write-Wins* (LWW) basado en timestamps confiables para datos maestros (catálogo), y *Append-Only* inmutable para ventas y movimientos contables de inventario.

---

## 📋 Formato de Salida Requerido en la Auditoría:

Para cada archivo, módulo o esquema auditado, presentar los resultados bajo esta estructura estricta:

1. **Diagnóstico Crítico:**
   - Lista puntual con viñetas identificando:
     * Archivo y líneas exactas.
     * Tipo de falla (Overfetching, N+1, Table Scan, Desincronización, Vulnerabilidad RLS, Inconsistencia de Redondeo).
     * Nivel de Severidad (`🚨 Crítico`, `⚠️ Alto`, `ℹ️ Medio/Bajo`).

2. **Código Refactorizado Listo para Producción:**
   - Código TypeScript / SQL / React completo, optimizado y sin omisiones (`// ... existing code ...`), listo para copiar y pegar con manejo de errores robusto.

3. **Script de Migración SQL / Esquema Local:**
   - Sentencias `CREATE INDEX CONCURRENTLY`, ajustes de tablas, políticas RLS o actualizaciones del schema Dexie/SQLite.

4. **Impacto Estimado y Métricas de Rendimiento:**
   - Tabla comparativa de complejidad y tiempos de respuesta estimados (Ejemplo: *Tiempo de respuesta: de 1,450ms a 18ms; Consumo de memoria: -75%; Queries: de N+1 a 1 sola query agrupada*).

---

### Inicia la Auditoría ingresando los archivos o esquemas:
[PEGA AQUÍ TU ESQUEMA SQL, COMPONENTES Y CONSULTAS]