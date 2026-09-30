# INFORME TÉCNICO DE REFACTORIZACIÓN Y ENDURECIMIENTO ARQUITECTÓNICO
## Venematic POS Enterprise v2.0 (Stack: Tauri/Rust + Next.js + SQLite WAL)

---

### 1. RESUMEN DE CAMBIOS EJECUTADOS

| Subsistema | Estado Previo (Vulnerable / Frágil) | Estado Refactorizado (Nivel Enterprise) | Impacto de Seguridad / Resiliencia |
| :--- | :--- | :--- | :--- |
| **Persistencia Local** | IndexedDB (Dexie.js) en hilo WebKit. Corrupción por apagón repentino. | **SQLite Nativo (`rusqlite`) con modo WAL, Foreign Keys y Busy Timeout**. | Consistencia ACID estricta; cero ventas huérfanas sin inventario. |
| **Transaccionalidad** | Operaciones asíncronas no atómicas en frontend. Divergencia en caso de cierre forzado. | **Transacción atómica en Rust:** `sales` + `products` (decremento) + `kardex_audit` + `outbox`. | Rollback automático si stock es insuficiente o ante fallo de I/O. |
| **Licenciamiento** | HMAC-SHA256 simétrico con clave compartida expuesta en cliente. | **Criptografía Asimétrica Ed25519 (curvas elípticas de 255 bits).** | Clave privada aislada en Keygen offline; cliente solo valida con clave pública. |
| **Terminal Móvil (Web)**| `Html5Qrcode` estándar sin control de energía; suspensión silenciosa de pestaña. | **Integración de `navigator.wakeLock` + captura exhaustiva de W3C MediaDevices.** | Cámara persistente sin apagado de pantalla; recuperación ante suspensión. |
| **Sincronización Cloud**| Riesgo de sobreescritura ciega ("Last-Write-Wins" destructivo). | **Patrón Transaccional Outbox con Vector Clocks / Append-Only Log.** | Trazabilidad temporal ordenada por nodo para resolución determinista de conflictos. |

---

### 2. ESPECIFICACIÓN TÉCNICA DE ARCHIVOS IMPLEMENTADOS

#### A. Backend Nativo Rust (Tauri Core)
- **[`venematic-desktop/src-tauri/Cargo.toml`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/venematic-desktop/src-tauri/Cargo.toml):**
  - Dependencias añadidas: `rusqlite` (bundled), `ed25519-dalek` (2.1), `hex`, `base64`, `uuid`, `chrono`, `thiserror`.
- **[`venematic-desktop/src-tauri/src/db/mod.rs`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/venematic-desktop/src-tauri/src/db/mod.rs):**
  - Inicializador de base de datos con pragmas de alto rendimiento:
    ```sql
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    ```
  - Definición de tablas relacionales: `products`, `sales`, `sale_items`, `kardex_audit`, `sync_mutations_outbox`.
- **[`venematic-desktop/src-tauri/src/sales/transaction.rs`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/venematic-desktop/src-tauri/src/sales/transaction.rs):**
  - `execute_atomic_sale(&mut Connection, CreateSalePayload) -> Result<TransactionSuccess, TransactionError>`:
    1. Abre `tx: Transaction = conn.transaction()?`.
    2. Inserta registro en `sales`.
    3. Itera artículos: inserta en `sale_items`, bloquea fila de producto con `SELECT stock WHERE id = ?`, verifica invariante (`stock >= qty`), actualiza stock en `products`, e inserta registro inmutable en `kardex_audit`.
    4. Inserta evento en `sync_mutations_outbox` con contador vectorial autoincrementable por `node_id`.
    5. Ejecuta `tx.commit()?`. Ante cualquier error, el destructor de `tx` ejecuta `ROLLBACK`.
- **[`venematic-desktop/src-tauri/src/crypto/licensing.rs`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/venematic-desktop/src-tauri/src/crypto/licensing.rs):**
  - `verify_license_token(hw_id, token, public_key_hex)`:
    - Valida formato `PAYLOAD_B64.SIGNATURE_HEX`.
    - Verifica firma de 64 bytes contra clave pública de 32 bytes usando `ed25519_dalek::VerifyingKey`.
    - Comprueba coincidencia estricta de `hw_id` y fecha de expiración contra reloj UTC inmutable.
- **[`venematic-desktop/src-tauri/src/main.rs`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/venematic-desktop/src-tauri/src/main.rs):**
  - Exposición de comandos Tauri IPC: `check_license` y `create_sale_transaction` con gestión segura de estado (`Mutex<rusqlite::Connection>`).

#### B. Módulos de Soporte y Frontend
- **[`scripts/private-keygen.mjs`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/scripts/private-keygen.mjs):**
  - Generador maestro de pares Ed25519 y firmador criptográfico offline para emisión de licencias a clientes.
- **[`venematic-desktop/src/app/scanner/page.tsx`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/venematic-desktop/src/app/scanner/page.tsx):**
  - Módulo de escáner móvil endurecido:
    - Adquisición y liberación de `navigator.wakeLock` (`screen`).
    - Suscripción al ciclo de vida (`visibilitychange`) para reactivar la cámara tras suspensión del dispositivo móvil.
    - Captura diferenciada de errores de cámara: `NotAllowedError`, `NotFoundError`, `NotReadableError` (cámara bloqueada por ahorro de batería), y `OverconstrainedError`.

---

### 3. PROTOCOLO DE VERIFICACIÓN TÉCNICA (STEP-BY-STEP)

#### Prueba 1: Verificación de Integridad y Rollback ACID (Simulación de Stock Negativo)
1. **Objetivo:** Garantizar que si un producto carece de existencias durante la venta, no quede asentada la cabecera en `sales` ni registros huérfanos en `kardex_audit`.
2. **Procedimiento SQL en terminal SQLite:**
```bash
# Abrir SQLite en la base de datos local generada por la app
sqlite3 "$env:APPDATA/com.venematic.desktop/venematic_enterprise.sqlite"
```
```sql
-- 1. Consultar estado antes de inducir fallo
SELECT id, barcode, stock FROM products WHERE barcode = '7591234567890';

-- 2. Ejecutar consulta de auditoría de integridad referencial
SELECT s.id, s.receipt_number 
FROM sales s 
LEFT JOIN kardex_audit k ON s.id = k.reference_id 
WHERE k.id IS NULL;
-- Resultado esperado: 0 filas.

-- 3. Comprobar que no existan items de venta sin producto asignado
SELECT si.id, si.sale_id, si.product_id
FROM sale_items si
LEFT JOIN products p ON si.product_id = p.id
WHERE p.id IS NULL;
-- Resultado esperado: 0 filas.
```

#### Prueba 2: Verificación de Criptografía Asimétrica Ed25519
1. **Objetivo:** Comprobar que licencias alteradas por un solo bit sean rechazadas inmediatamente por el motor en Rust.
2. **Comando de Emisión y Prueba:**
```bash
# Generar token de prueba
node scripts/private-keygen.mjs
```
3. **Simulación de Ataque (Manipulación de Token):**
   - Tomar el token resultante `BASE64_PAYLOAD.SIGNATURE_HEX`.
   - Modificar un único carácter en la firma hexadecimal o en el payload Base64.
   - Enviar al IPC `check_license`.
   - **Resultado esperado:** Retorno de error `InvalidSignature` o `Base64Decode`, impidiendo el arranque del sistema.

#### Prueba 3: Verificación de Bloqueo de Suspensión (Wake Lock Móvil)
1. **Objetivo:** Verificar que el dispositivo móvil no apague la pantalla durante la operación de escaneo continuo.
2. **Procedimiento:**
   - Abrir `http://<IP_LOCAL>:3002/scanner?session=caja-1` desde un navegador móvil (Safari iOS o Chrome Android).
   - Acceder a la pestaña "Pistola Láser".
   - Abrir consola remota en Chrome (`chrome://inspect`) y verificar:
   ```javascript
   navigator.wakeLock.request('screen').then(lock => console.log('WAKELOCK_ACTIVO:', !lock.released));
   // Debe retornar true mientras la pestaña esté en primer plano.
   ```
   - Bloquear el teléfono, desbloquearlo y confirmar en logs que el evento `visibilitychange` reasigna el bloqueo sin recargar la página.

---

### 4. ACCIONES MANUALES REQUERIDAS (PRÓXIMOS PASOS CRÍTICOS)

> [!IMPORTANT]
> Debes ejecutar estas dos acciones manuales antes de desplegar binarios en producción a clientes comerciales:

1. **Generación y Resguardo del Par de Claves Maestro (Air-Gapped):**
   - Ejecutar en un entorno seguro aislado:
     ```bash
     node -e "import('./scripts/private-keygen.mjs').then(m => console.log(m.generateMasterKeyPair()))"
     ```
   - **Clave Privada (`privateKeyHex`):** Almacenarla en un gestor de secretos offline protegido con MFA. **Bajo ninguna circunstancia debe commitearse en Git ni incluirse en el frontend o binario del cliente.**
   - **Clave Pública (`publicKeyHex`):** Copiar los 64 caracteres hexadecimales y pegarlos en la constante `EMBEDDED_PUBLIC_KEY_HEX` dentro de [`venematic-desktop/src-tauri/src/main.rs`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/venematic-desktop/src-tauri/src/main.rs).

2. **Volcado Inicial de Datos Históricos (Migración IndexedDB $\rightarrow$ SQLite):**
   - Para las instancias que ya operaron con Dexie.js, ejecutar el backup local desde la interfaz (`Exportar Respaldo JSON`), e importarlo en la nueva base de datos SQLite mediante el comando de carga inicial antes de congelar las tablas de IndexedDB.
