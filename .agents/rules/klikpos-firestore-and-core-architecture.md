---
trigger: always_on
description: Normas maestras e inquebrantables de arquitectura KlikPOS Matriz, esquema canónico de Firestore, seguridad y cero fragmentación entre módulos.
---

# 🏛️ KlikPOS Matriz: Reglas Maestras de Arquitectura y Firestore

Este documento es una **DIRECTIVA DE OBLIGATORIO CUMPLIMIENTO** para todo agente de IA y desarrollador en cada modificación, refactorización o adición en el repositorio.

---

## 1. Principio Rector: KlikPOS es la Aplicación Matriz
- **Cero improvisación:** KlikPOS es un ecosistema POS empresarial y retail unificado. Todo módulo (Desktop PC, Tablet Standalone, Móvil Autónomo, Delivery, Kiosco) se rige bajo las mismas reglas maestras.
- **Prohibido el "parcheo rápido":** Queda terminantemente prohibido inventar colecciones ad-hoc, rutas auxiliares temporales o duplicar lógica para resolver una petición inmediata. Toda solución debe construirse sobre los cimientos arquitectónicos existentes.
- **Fuente única de verdad:** Las definiciones de tipos, esquemas e interfaces viven en `src/lib/firebase/firestore-schema.ts`.

---

## 2. Esquema Canónico e Inquebrantable de Firestore

Toda interacción con la base de datos Firestore debe respetar estrictamente esta jerarquía canónica:

### A. Jerarquía Multi-Comercio (Tenancy)
```
stores / {storeId}
  ├── products / {productId}         -> Catálogo de productos de la tienda
  ├── categories / {categoryId}      -> Categorías del comercio
  ├── sales / {saleId}               -> Ventas inmutables (historial y kardex fiscal)
  ├── customers / {customerId}       -> Clientes y control de crédito
  ├── cash_closures / {closureId}    -> Arqueos y cortes X/Z de caja
  ├── inventory_logs / {logId}       -> Kardex append-only inmutable de movimientos
  ├── credit_vouchers / {voucherId}  -> Vales de crédito emitidos
  └── summary / latest               -> Resumen en vivo de totales, última venta y heartbeat
```

### B. Colecciones Globales de Infraestructura Cloud
```
bcv_rates / {rateId}
  ├── latest                         -> Tasa oficial BCV vigente en tiempo real (Bs./USD)
  └── {YYYY-MM-DD}                   -> Histórico diario inmutable de tasas
marketplace_packs / {packId}         -> Catálogos fotográficos y paquetes visuales en la nube
system_updates / {updateId}          -> Motor de versiones, notas de lanzamiento y URLs OTA
cloud_licenses / {licenseId}         -> Licencias comerciales, HWID y recuperación de negocio
users / {userId}                     -> Perfiles RBAC (owner, admin, supervisor, cashier)
marketplace_orders / {orderId}       -> Pedidos web, delivery y comandas
```

> ⚠️ **REGLA CRÍTICA SOBRE TASAS BCV:**  
> La **ÚNICA** colección oficial para la tasa BCV es `bcv_rates` (documento `latest`).  
> Prohibido crear colecciones inventadas como `fleet_config` o usar `system_config` como ruta principal (este último solo se actualiza como espejo de retrocompatibilidad para terminales viejas).

---

## 3. Blindaje de Seguridad en `firestore.rules`
1. **Regla de Correspondencia Obligatoria:** Toda colección o subcolección que la app lea o escriba **DEBE estar explícitamente declarada y autorizada en `firestore.rules`**.
2. **Auditoría Previa a Modificaciones:** Antes de crear una nueva ruta de datos, el agente debe verificar que las reglas de Firestore no la bloqueen con `PERMISSION_DENIED`.
3. **Accesos Públicos de Infraestructura:**
   - `bcv_rates/{rateId}`: Lectura pública (`allow read: if true;`) para que cualquier caja (incluso en arranque offline o sin login previo) obtenga la tasa oficial.
   - `marketplace_packs/{packId}`: Lectura pública para que cualquier terminal explore y descargue paquetes fotográficos.
   - `system_updates/{updateId}`: Lectura pública para chequeo de versiones OTA.
   - `stores/{storeId}/summary/{summaryId}`: Lectura pública / escritura permitida para el heartbeat y telemetría de las cajas.

---

## 4. Prohibición de Consultas Crudas en Componentes UI (Capa de Servicios)
- **Ningún componente React (`page.tsx`, `Modal.tsx`, `Card.tsx`) puede ejecutar llamadas crudas directas a Firestore (`getDoc(doc(db, ...))` o `setDoc(...)`) en su código interno.**
- Toda operación debe canalizarse a través de la capa de servicios especializada:
  - **Ventas, Inventario y Tasas:** `cloudSyncService` (`src/lib/firebase/cloud-sync-service.ts`).
    - Para leer tasa: `cloudSyncService.fetchLatestBcvRate()`.
    - Para guardar tasa: `cloudSyncService.pushBcvRate(rate, source)`.
    - Para sincronizar ventas: `cloudSyncService.syncPendingSales()`.
    - Para telemetría y resumen: `cloudSyncService.pushSummaryToCloud()`.
  - **Catálogos y Paquetes de Imágenes:** `visualPacksService` (`src/lib/marketplace/visual-packs-service.ts`).
  - **Licenciamiento y Respaldo:** Servicios de licencias en `src/lib/`.

---

## 5. Publicación Obligatoria en Nube para Packs y Catálogos
- Si se añade un nuevo paquete de productos o imágenes (por ejemplo, comida street, farmacia, ferretería):
  1. Debe definirse en el código local como fallback offline (`DEFAULT_VISUAL_PACKS`).
  2. **DEBE publicarse inmediatamente en Firestore** en la colección `marketplace_packs/{packId}`.
  3. De lo contrario, **las apps ya instaladas en tablets o móviles nunca verán el catálogo**, obligando al usuario a reinstalar la app (lo cual está terminantemente prohibido).

---

## 6. Checklist Obligatorio en Cada Modificación
Antes de entregar cualquier cambio al usuario, el agente debe verificar:
- [ ] ¿La colección o documento utilizado pertenece al esquema oficial en `firestore-schema.ts`?
- [ ] ¿Está autorizada la lectura/escritura en `firestore.rules` para evitar `PERMISSION_DENIED`?
- [ ] ¿Se utilizó el servicio centralizado (`cloudSyncService`, `visualPacksService`) en lugar de consultas Firestore crudas en la UI?
- [ ] Si se modificó la tasa BCV o la sincronización, ¿se actualizó `bcv_rates/latest`?
- [ ] Si se añadieron imágenes o productos nuevos, ¿se publicaron en `marketplace_packs` en Firestore?
- [ ] ¿Se mantiene el principio Offline-First (Dexie local primero, Firestore en segundo plano)?
