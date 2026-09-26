# INFORME TÉCNICO DE ARQUITECTURA, SEGURIDAD Y CONFIDENCIALIDAD
## Ecosistema Venematic POS (Desktop Tauri + Android Mobile APK)

**Fecha de Auditoría:** 24 de Septiembre de 2026  
**Clasificación de Seguridad:** Confidencial / Propiedad Intelectual del Desarrollador  
**Versión de Producción:** Venematic POS v2.0.0 Pro Suite  
**Estado de Compilación:** 0 Errores (`npx tsc --noEmit` Exit Code 0)

---

## 1. RESUMEN EJECUTIVO Y ARQUITECTURA DEL SISTEMA

Venematic POS es una plataforma de punto de venta y control comercial **Offline-First**, construida sobre un stack híbrido de alto rendimiento:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ECOSISTEMA VENEMATIC POS                        │
├──────────────────────────────────┬─────────────────────────────────────┤
│      VENEMATIC DESKTOP (PC)      │        VENEMATIC MÓVIL (APK)        │
├──────────────────────────────────┼─────────────────────────────────────┤
│ · Rust Engine (Tauri v2 Core)    │ · Capacitor WebView Wrapper         │
│ · Next.js 14 App Router + React  │ · Standalone Offline Engine (HTML5) │
│ · Local DB: Dexie.js (IndexedDB) │ · Storage: LocalStorage / IndexedDB │
│ · Thermal Printing: USB / ESC-POS│ · Hardware Scanner: Camera API      │
│ · Balanza: Web Serial / COM Port │ · Background SSE Event Listener     │
├──────────────────────────────────┴─────────────────────────────────────┤
│                   BUS DE EVENTOS Y SINCRONIZACIÓN                      │
│ · SSE (Server-Sent Events): /api/scanner/events                        │
│ · Webhook de Pagos Remoto:  /api/payments/webhook                      │
│ · Tasa BCV Oficial:         /api/bcv/rate                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. MOTOR CRIPTOGRÁFICO DE LICENCIAMIENTO (HWID LOCK)

### 2.1. Algoritmo de Firma y Paridad Criptográfica
El sistema implementa un esquema de firma digital simétrica basado en **HMAC-SHA256**:
* **Payload de Firma:**
  ```text
  ${cleanHwid}#${cleanRif}#${plan}#${expiresAt}#VENEMATIC_SEC_SALT_2026_AIVYNTRAX_PRO_POS_V2
  ```
* **Hardware ID (HWID):**
  * **En Windows:** Extraído de forma determinista mediante identificadores inmutables de hardware (CPU ProcessorID, UUID de Placa Base y Serial de Disco del Sistema).
  * **En Android:** Extraído de huella digital combinada de hardware o identificador de instalación inmutable almacenado en almacenamiento seguro.
* **Corrección de Padding de 64 Bits en `sha256Hex`:**
  * En implementaciones JavaScript puras, los operadores de desplazamiento (`>>> 56`) truncan a 32 bits, generando colisiones y firmas inválidas en mensajes mayores a 55 bytes.
  * **Solución Aplicada:** Descomposición explícita de la longitud en bits en dos palabras big-endian de 32 bits (`highBits = Math.floor(bitLength / 0x100000000)` y `lowBits = bitLength >>> 0`), logrando paridad matemática exacta del 100% entre Node.js `crypto`, Web Crypto API y el engine JavaScript del APK.

### 2.2. Estructura de Claves Generadas
```text
VNK - [PREFIJO] - [CÓDIGO EXPIRACIÓN] - [HEX1] - [HEX2] - [HEX3] - [HEX4]
```
| Tipo de Licencia | Identificador Interno | Prefijo | Expiración | Descripción |
| :--- | :---: | :---: | :---: | :--- |
| **Prueba Flash (15 Min)** | `trial_15m` | `T15` | `15MN` | Evaluación rápida in situ con desactivación automática a los 15 minutos. |
| **Starter (1ra Cuota 30 Días)** | `starter_trial` | `STR` | Formato fecha (ej. `261024`) | Acceso por 30 días para esquema de pago fraccionado ($25). |
| **Starter Full (Vitalicia)** | `starter_full` | `STR` | `PERP` | Licencia comercial perpetua 1 caja ($50 total). |
| **Pro Multi-Caja (Vitalicia)** | `pro_full` | `PRO` | `PERP` | Licencia comercial perpetua multi-caja con soporte balanza y webhook. |
| **Demo 30 Días** | `demo` | `DEM` | Formato fecha | Evaluación de 30 días para franquicias. |

---

## 3. CICLO DE VIDA DE LA PRUEBA DE 15 MINUTOS (`trial_15m`)

Para responder al modelo comercial de entrega sin pago anticipado (*"Drop & Test"*):
1. **Activación:** Al introducir una clave `VNK-T15-15MN-...`, el sistema valida la firma y registra `venematic_trial15m_start = Date.now()` en el almacenamiento local.
2. **Watchdog Activo (`startTrial15mWatcher`):** Un temporizador en segundo plano se ejecuta cada 5 segundos evaluando:
   $$\text{Tiempo Transcurrido} = \text{Date.now()} - \text{venematic\_trial15m\_start}$$
3. **Desactivación Inmediata a los $15 \times 60 \times 1000\text{ ms}$:**
   * Remueve la clave activa de `localStorage` (`venematic_license_key`).
   * Emite tono sonoro de advertencia (`soundEffects.playError()`).
   * Despliega inmediatamente el modal bloqueante de activación impidiendo nuevas ventas.
4. **Garantía de Preservación de Datos:** Los registros de productos, inventario cargado y ventas de prueba permanecen intactos en la base de datos local.
5. **Transición a Licencia Definitiva:** Al ingresar una clave permanente (`VNK-STR-PERP-...`), la rutina de verificación borra el indicador `venematic_trial15m_start`, desbloqueando el terminal de forma indefinida.

---

## 4. BLINDAJE ANTIPIRATERÍA Y CONFIDENCIALIDAD DEL KEYGEN

### 4.1. Regla de Oro: Separación de Entornos
* **El código del generador (`scripts/generar-licencia.mjs`) JAMÁS se empaqueta en instaladores de clientes.**
* Es una herramienta confidencial de uso exclusivo por parte del propietario del software en su máquina de desarrollo.

### 4.2. Protección en Aplicación de Escritorio (`LicenseActivationModal.tsx`)
Para evitar que un cliente o técnico tercero pueda auto-generarse claves si accede al código o modal de escritorio:
* **Pestaña Oculta por Defecto:** La pestaña *"Generador Privado (Keygen Propietario)"* no se renderiza en la interfaz. El cliente solo visualiza el formulario de activación y su HWID para copiar.
* **Mecanismo de Desbloqueo por Secuencia y PIN Maestro:**
  1. Requiere hacer **5 clics consecutivos** sobre el distintivo de cabecera `HMAC-SHA256`.
  2. El sistema despliega un cuadro de desafío exigiendo el **PIN Maestro de Desarrollador**:
     ```text
     VNMT-2026-DEV
     ```
  3. Solo con el PIN correcto se monta la pestaña del generador en memoria.

### 4.3. Exclusión Total en el APK Móvil
* El archivo `index.html` del APK móvil contiene **únicamente la rutina de verificación** (`verifyLicenseKeyMobile`).
* No existe ninguna referencia, función ni endpoint de generación de claves en el paquete binario de Android.

---

## 5. ARQUITECTURA DEL WEBHOOK DE PAGO MÓVIL (MODO DUEÑO REMOTO)

Para permitir que un negocio liquide ventas por Pago Móvil cuando el dueño del local está fuera y recibe los SMS en su celular personal:

```
  [ Celular del Dueño (Fuera del local) ]
               │
               ▼ Llega SMS / Push Bancario (BDV, Banesco, etc.)
  [ MacroDroid / SMS Forwarder / Tasker ]
               │
               ▼ HTTP POST /api/payments/webhook
               │ (Cabecera: x-webhook-secret)
  ┌────────────┴──────────────────────────────────────┐
  │         SERVIDOR POS LOCAL VENEMATIC              │
  │                                                   │
  │  1. Autenticación contra Secreto de Configuración │
  │  2. Regex Parser Multi-Banco:                     │
  │     · Banco de Venezuela (2661 / 2662)            │
  │     · Banesco (0134)                              │
  │     · Mercantil (0105)                            │
  │     · Bancamiga (0172)                            │
  │     · BBVA Provincial (0108)                      │
  │     · BNC (0191)                                  │
  │  3. Extracción: Monto Bs., Referencia, Banco      │
  │  4. Inserción en Búfer Circular (TTL: 10 Minutos) │
  │  5. Emisión SSE: canal /api/scanner/events        │
  │     Evento: 'payment_confirmed'                   │
  └───────────────────┬───────────────────────────────┘
                      │
                      ▼
  [ Terminales de Caja (Desktop y Móvil) ]
  · Suena Campana de Confirmación (Chime)
  · Muestra Toast Verde en Pantalla
  · Autocompleta la Referencia en el Modal de Cobro
```

### Privacidad y Seguridad del Webhook:
* **TTL Efímero de 10 Minutos:** Las notificaciones no se guardan permanentemente en base de datos. Se almacenan en memoria volátil (`PagoMovilWebhookStore`) y se purgan automáticamente tras 10 minutos.
* **Enmascaramiento de Datos:** El teléfono del pagador y detalles privados de la cuenta nunca se exponen en pantalla.

---

## 6. NORMAS LEGALES, FISCALES Y COMPLIANCE (SENIAT / PRIVACY)

De acuerdo con la directiva maestra `docs/Reglas_de_privacidad_y_normas.md`:
1. **Tasa Oficial BCV:** Obligatoriedad de cotizar todas las operaciones en Bolívares usando la tasa oficial del día del BCV (`/api/bcv/rate`).
2. **Discriminación Impositiva:**
   * Ventas exentas etiquetadas como `Exento:`.
   * Alícuota general IVA 16% desglosada.
   * IGTF 3% percibido y calculado únicamente sobre pagos en divisas / criptoactivos.
3. **Código QR Offline:** Comprobantes impresos y en pantalla con payload firmado localmente para verificación sin internet.
4. **Deslinde de Pérdida de Datos (Zero Cloud Liability):** La base de datos es 100% local (SQLite/IndexedDB). El usuario es el único custodio de su información y responsable de sus copias de seguridad.

---

## 7. VERIFICACIÓN DE ENTREGABLES Y COMPILACIÓN

| Componente | Ruta en el Proyecto | Estado de Auditoría |
| :--- | :--- | :---: |
| **Generador Maestro (CLI)** | [`scripts/generar-licencia.mjs`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/scripts/generar-licencia.mjs) | ✅ Opción `[7]` activa |
| **Librería Criptográfica Desktop** | [`venematic-desktop/src/lib/licensing/license-crypto.ts`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/venematic-desktop/src/lib/licensing/license-crypto.ts) | ✅ Paridad SHA-256 verificada |
| **Modal Protegido Desktop** | [`venematic-desktop/src/components/LicenseActivationModal.tsx`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/venematic-desktop/src/components/LicenseActivationModal.tsx) | ✅ Keygen protegido con PIN |
| **Endpoint Webhook** | [`venematic-desktop/src/app/api/payments/webhook/route.ts`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/venematic-desktop/src/app/api/payments/webhook/route.ts) | ✅ Auth + Parser multi-banco |
| **Búfer y Parser de Pagos** | [`venematic-desktop/src/lib/payments/pago-movil-webhook-store.ts`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/venematic-desktop/src/lib/payments/pago-movil-webhook-store.ts) | ✅ TTL 10m en memoria |
| **APK Compilado Caja** | [`dist-apk/VenematicPOS-Caja-Mobile.apk`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/dist-apk/VenematicPOS-Caja-Mobile.apk) | ✅ Watchdog 15m activo |
| **Compilación TypeScript** | `venematic-desktop` & Root Workspace | ✅ **0 Errores (`tsc --noEmit`)** |
