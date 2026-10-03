# 🏛️ Directrices Obligatorias de Proyecto: KlikPOS Matriz & Firestore Core

Este archivo es leído automáticamente por el asistente de inteligencia artificial en cada sesión, comando y modificación de código en este repositorio.

---

## 1. Principio Fundamental: KlikPOS es la Aplicación Matriz
- **Cero improvisación ni parches rápidos:** KlikPOS es el software base y matriz. Ningún módulo (Tablet POS, Desktop POS, Móvil Autónomo, Delivery) debe tener colecciones o lógicas desconectadas.
- **Respeto al Esquema Maestro:** Todo tipo, modelo y colección debe regirse por [`src/lib/firebase/firestore-schema.ts`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/src/lib/firebase/firestore-schema.ts).

---

## 2. Esquema Canónico e Inquebrantable de Firestore

### Jerarquía Multi-Comercio (Tenancy)
```
stores / {storeId}
  ├── products / {productId}         -> Catálogo de productos
  ├── categories / {categoryId}      -> Categorías
  ├── sales / {saleId}               -> Ventas inmutables (historial y kardex)
  ├── customers / {customerId}       -> Clientes y control de crédito
  ├── cash_closures / {closureId}    -> Arqueos y cortes X/Z de caja
  ├── inventory_logs / {logId}       -> Kardex append-only de inventario
  ├── credit_vouchers / {voucherId}  -> Vales de crédito emitidos
  └── summary / latest               -> Resumen de totales, última venta y telemetría
```

### Colecciones Globales de Infraestructura Cloud
```
bcv_rates / {rateId}
  ├── latest                         -> Tasa oficial BCV vigente (Bs./USD) - ÚNICA FUENTE OFICIAL
  └── {YYYY-MM-DD}                   -> Histórico diario inmutable
marketplace_packs / {packId}         -> Catálogos fotográficos y paquetes visuales
system_updates / {updateId}          -> Motor de versiones y actualización remota OTA
cloud_licenses / {licenseId}         -> Licencias comerciales y recuperación de negocio
users / {userId}                     -> Perfiles RBAC (owner, admin, supervisor, cashier)
```

> ⚠️ **PROHIBICIÓN ESTRICTA:** No crear colecciones inventadas como `fleet_config` o usar `system_config` como ruta principal. La tasa BCV siempre se lee y escribe en `bcv_rates/latest` a través de `cloudSyncService`.

---

## 3. Blindaje de Seguridad en `firestore.rules`
- Toda colección utilizada en la aplicación **DEBE estar declarada y autorizada en [`firestore.rules`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/firestore.rules)**.
- `bcv_rates/{rateId}`, `marketplace_packs/{packId}`, `system_updates/{updateId}` y `stores/{storeId}/summary/{summaryId}` deben tener permisos de lectura pública para que las terminales funcionen sin bloqueo alguno.

---

## 4. Prohibición de Consultas Crudas en Componentes UI
- Los componentes visuales (`page.tsx`, `Modal.tsx`) **NUNCA** deben ejecutar consultas crudas a Firestore (`getDoc(doc(db, ...))`).
- Toda operación de red y persistencia debe realizarse a través de la capa de servicios:
  - **Ventas, Inventario y BCV:** [`cloudSyncService`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/src/lib/firebase/cloud-sync-service.ts)
  - **Catálogos y Packs Fotográficos:** [`visualPacksService`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/src/lib/marketplace/visual-packs-service.ts)

---

## 5. Publicación Obligatoria en Nube de Catálogos
- Todo nuevo paquete visual (como `pack-comida-street-venezuela`) debe publicarse tanto en el código offline como en la colección `marketplace_packs` de Firestore, para que los dispositivos ya instalados puedan descargarlo inmediatamente sin reinstalación.

---

## 6. Reglas de Calidad y Cierre de Cambios
- **Límite de 400 líneas por componente (Anti-Frankenstein):** Dividir en submódulos especializados.
- **Contraste WCAG AAA (>= 7:1):** Textos oscuros profundos (`#0f172a`) en teclados, precios y tasas en modo claro.
- **Sincronización de Versión y Binarios:** Siempre ejecutar `npm run build` y sincronizar versiones antes de dar por finalizada una tarea.
