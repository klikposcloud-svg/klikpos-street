# 📖 LA BIBLIA DE VENEMATIC POS: GUÍA MAESTRA DE DESARROLLO, ARQUITECTURA Y MARKETING (2026)
> **Documento Oficial de Referencia Absoluta para Ingeniería, Soporte Técnico, Ventas y Consultoría Comercial**  
> *Suite Venematic POS v2.0.0 — Edición Consolidada Desktop (Windows) y Móvil (Android)*

---

## 📑 ÍNDICE GENERAL
1. **Resumen Ejecutivo y Propuesta de Valor Comercial (Marketing)**
2. **Comparativa Competitiva Frente a Sistemas Tradicionales**
3. **Arquitectura Tecnológica y Stack de Desarrollo**
4. **Módulos del Sistema y Funcionalidades de Élite**
5. **Protocolo y Motor de Actualizaciones (Online & Offline)**
6. **Políticas de Privacidad, Soberanía de Datos y Cumplimiento Legal**
7. **Esquema de Licenciamiento, Niveles y Precios de Venta**
8. **Blindaje Criptográfico HWID y Manual del Generador de Claves**
9. **Guía de Instalación y Puesta en Marcha (Windows & Android)**
10. **Directorio Maestro de Archivos, Binarios e Instaladores**

---

## 1. RESUMEN EJECUTIVO Y PROPUESTA DE VALOR COMERCIAL (MARKETING)

### ¿Qué es Venematic POS?
**Venematic POS** es la solución definitiva de punto de venta e inventario diseñada a medida para el comercio en Venezuela y Latinoamérica. Combina la velocidad instantánea de una aplicación local instalada en la computadora o teléfono con la capacidad de operar **100% sin conexión a internet**, incorporando manejo multimoneda en tiempo real (USD y Bolívares a tasa oficial del BCV), soporte fiscal para normativas SENIAT, integración directa con balanzas de peso, y conciliación automatizada de pagos móviles bancarios.

### Propuesta de Valor Única (Puntos de Venta para Clientes):
1. **Independencia Total de Internet (Zero Cloud Dependency):** Si la luz o el internet fallan, tu caja registradora sigue facturando, pesando y emitiendo tickets sin retrasos.
2. **Cero Mensualidades Forzosas:** El comercio adquiere una licencia perpetua o en cómodas cuotas fraccionadas. El software no se apaga ni secuestra los datos si no hay suscripción mensual.
3. **Manejo Nativo de la Economía Venezolana:** Doble moneda en pantalla (USD y Bs) calculada a la tasa oficial del Banco Central de Venezuela (BCV), con discriminación de productos exentos de IVA, base gravable del 16%, e impuesto IGTF del 3% en divisas.
4. **Balanza Inteligente de Charcutería/Carnicería:** Soporte inmediato para balanzas seriales y lectura automática de tickets con código de barras embutido (peso y precio). Si el cajero pulsa un producto pesable, el sistema solicita inmediatamente el peso exacto para evitar errores de cobro.
5. **Confirmación Instantánea de Pago Móvil por Sonido:** Cuando un cliente paga por Pago Móvil, el sistema detecta la transferencia mediante webhook, reproduce un sonido de confirmación en la caja y llena la referencia automáticamente.
6. **Multiplataforma Integrada:** Funciona en computadoras de escritorio Windows (PC estándar, táctil o todo-en-uno) y en celulares o tablets Android (versión Cajero y versión Administrador para el dueño).

---

## 2. COMPARATIVA COMPETITIVA FRENTE A SISTEMAS TRADICIONALES

| Característica | Venematic POS v2.0.0 | Sistemas Tradicionales (Saint, A2, Valery, Premium) | Apps Cloud Genéricas (Loyverse, Square) |
| :--- | :--- | :--- | :--- |
| **Arquitectura de Red** | **Offline-First Nativo** (Opera sin internet y sincroniza opcional) | Cliente-Servidor local pesado (requiere red LAN cableada compleja) | 100% Nube (Se detiene la caja si se cae la conexión) |
| **Manejo Multimoneda (USD/VES)** | **Automático a Tasa BCV Oficial** con desglose en tiempo real | Parches agregados o módulos externos engorrosos | Solo moneda única (incompatible con bimonetarismo de Venezuela) |
| **Cumplimiento SENIAT** | **Nativo:** Exento, IVA 16%, IGTF 3%, Reporte X/Z, Libro Ventas | Requiere impresoras fiscales costosas obligatorias para funcionar | No cumple normativas venezolanas |
| **Pesaje en Charcutería y Balanzas** | **Integrado:** Serial COM, códigos 20/21 y modal automático | Módulos opcionales cobrados por separado | No disponible en versión gratuita |
| **Conciliación de Pago Móvil** | **Webhook con Parser Bancario** (BDV, Banesco, Mercantil, etc.) | Verificación manual lenta papel por papel | No soportado |
| **Instalación y Puesta en Marcha** | **1 Clic en 60 segundos** (binario autocontenido con Node portable) | Requiere técnico, SQL Server, ODBC, licencias de red complejas | Instalación rápida pero dependiente de internet |
| **Costo Operativo** | **Pago único accesible** o cuotas fijas | Licencias de cientos de dólares + mantenimiento anual obligatorio | Mensualidades fijas en dólares de por vida |

---

## 3. ARQUITECTURA TECNOLÓGICA Y STACK DE DESARROLLO

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       SUITE VENEMATIC POS v2.0.0                        │
└─────────────────────────────────────────────────────────────────────────┘
          │                                           │
          ▼                                           ▼
┌───────────────────────────┐               ┌───────────────────────────┐
│      WINDOWS DESKTOP      │               │        ANDROID APK        │
├───────────────────────────┤               ├───────────────────────────┤
│ • Inno Setup 6 Installer  │               │ • Capacitor Native Engine │
│ • Launcher C# Nativo      │               │ • Android Gradle SDK 21   │
│ • Node.js Portable Embed  │               │ • ARM64 / x86_64 Support  │
│ • Next.js 14 Standalone   │               │ • Single-File PWA Bundle  │
│ • Chromium / Edge Webview │               │ • Hardware Camera Barcode │
└───────────────────────────┘               └───────────────────────────┘
          │                                           │
          ▼                                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  MOTOR COMÚN DE DATOS Y TRANSACCIONES                   │
├─────────────────────────────────────────────────────────────────────────┤
│ • Dexie.js (IndexedDB v1..v4): Índices B-Tree optimizados para 100k+    │
│ • Cero Bloqueo de Hilos: Consultas con límite y rangos de fecha         │
│ • LocalStorage & SQLite Cifrado: HWID Lock HMAC-SHA256                 │
│ • SSE (Server-Sent Events) + Webhooks Bancarios en tiempo real          │
│ • Auto-Update Engine: Comparación Semver segura con version.json        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tecnologías Aplicadas:
* **Frontend:** React 18.3, Next.js 14.2 (compilación `output: 'standalone'`), Tailwind CSS, Lucide React Icons.
* **Base de Datos Local:** Dexie.js (IndexedDB) con esquemas versionados:
  * `version(1..3)`: Catálogo de productos, ventas, clientes, turnos de caja, movimientos de inventario y caja.
  * `version(4)`: Índices compuestos optimizados `[status+timestamp]`, índice de `customerDoc` e `isTaxExempt` para eliminar escaneos de tabla completa y garantizar fluidez absoluta durante años de ventas continuas.
* **Empaquetado Desktop:**
  * Inno Setup 6 con compresión LZMA2 ultra-sólida.
  * Launcher en C# (`launcher/VenematicPOS.cs`) que inicializa `server.js` en el puerto 3002 e invoca la ventana de la aplicación sin marco de navegador.
  * Firma digital Authenticode con certificado local `Venematic Software C.A.`.
* **Empaquetado Android:**
  * Motor nativo Capacitor con compilación Gradle (`assembleDebug`).
  * Generación dual: APK de Cajero (`com.venematic.pos`) y APK de Administrador (`com.venematic.admin`).

---

## 4. MÓDULOS DEL SISTEMA Y FUNCIONALIDADES DE ÉLITE

### 4.1. Punto de Venta (POS) y Caja Mostrador
* **Manejo de Productos Pesables:** Al seleccionar cualquier artículo comercializado por kilogramos (`kg`), gramos (`g`), o libras (`lb`), el sistema detecta inmediatamente si la balanza serial está conectada. De no haber lectura activa, despliega automáticamente el modal de pesaje manual para impedir que se cobre 1 unidad fija por error.
* **Lector de Códigos de Barras Embutidos de Charcutería:** Interpreta códigos que inician con `20` o `21` desglosando en milisegundos el código interno del producto y el peso o monto cobrado.
* **Calculadora de Costos y Margen de Ganancia:** Permite al comerciante desglosar cajas con múltiples unidades (ej. caja de 24 refrescos), calculando automáticamente el costo unitario y sugiriendo el precio de venta final según el margen de rentabilidad deseado (20%, 30%, 50%).
* **Impresión Térmica Configurable:** Compatible con rollos de 58mm y 80mm vía ESC/POS directo o driver de Windows, con ajuste de márgenes de avance y código QR verificador.

### 4.2. Control de Turnos y Arqueo de Caja (Corte X y Z)
* **Apertura de Turno:** Registro del fondo de caja con desglose detallado de billetes en USD ($100, $50, $20, $10, $5, $2, $1) y Bolívares.
* **Movimientos de Efectivo:** Registro auditado de entradas (aportes) y salidas (pago a proveedores, gastos varios) con identificación del cajero.
* **Cierre de Caja y Fiscal:** Comparación automática entre el efectivo esperado según ventas registradas y el efectivo contado físicamente por el cajero, calculando sobrantes o faltantes al centavo.

### 4.3. Clientes y Ventas a Crédito (Fiado)
* **Gestión de Cuentas por Cobrar:** Registro de clientes por Cédula o RIF, asignación de límites de crédito y seguimiento de saldos pendientes tanto en USD como en Bolívares.
* **Abonos Parciales:** Los clientes pueden abonar a su deuda en cualquier método de pago (efectivo, pago móvil, transferencia), generando el comprobante de liquidación y actualizando su estado de cuenta en tiempo real.

### 4.4. Autenticación, Seguridad y Roles
* **Control de Acceso Estricto:** Separación absoluta entre **Administrador** y **Cajero**.
* **Protección de Ajustes Críticos:** Módulos de configuración (F8), borrado de catálogo, auditoría financiera y reportes de rentabilidad bloqueados tras la clave de administrador.
* **Credenciales Personalizables:** El administrador puede cambiar su contraseña y los PINes de cajeros en cualquier momento desde el panel de Configuración.
* **Cero Puertas Traseras:** Eliminación definitiva de claves hardcodeadas o accesos de escape; toda sesión se valida contra la base de datos interna.

---

## 5. PROTOCOLO Y MOTOR DE ACTUALIZACIONES (ONLINE & OFFLINE)

Venematic POS cuenta con una arquitectura de actualización híbrida diseñada para comercios con o sin internet.

### Canal 1: Actualizaciones Automáticas en Línea (Online Auto-Update)
1. **Comprobación Silenciosa al Arranque:** Si la opción está activa en Configuración, el sistema realiza una consulta HTTP GET ligera al archivo `version.json` publicado en el servidor del desarrollador.
2. **Evaluación Semver Criptográfica:** El servicio compara la versión actual (ej. `2.0.0`) con la versión remota (ej. `2.0.1`). Si la remota es superior, activa el evento de actualización.
3. **Modal Informativo de Actualización:** Muestra al administrador las notas de la versión (*changelog*), novedades de seguridad y mejoras fiscales.
4. **Preservación Absoluta de la Base de Datos:** La base de datos local residente en `%APPDATA%` (Windows) o en el contenedor de datos privado (Android) **NUNCA** es tocada, sobreescrita ni reseteada. Toda la información histórica de ventas, clientes e inventario permanece intacta.

### Canal 2: Distribución Manual Acumulativa (Clientes Offline)
Para establecimientos ubicados en zonas con nula o deficiente conectividad a internet:
1. El técnico o desarrollador entrega el nuevo instalador ejecutable (`Venematic-POS-Setup-v2.0.0.exe` o `VenematicPOS-Caja-Mobile.apk`).
2. Se ejecuta el instalador directamente sobre la instalación previa.
3. El instalador reemplaza los binarios y archivos de programa sin afectar las rutas de almacenamiento de datos del usuario.

### Herramienta para el Desarrollador (`DASHBOARD_DESARROLLADOR.html`):
El panel del desarrollador cuenta con el botón **🚀 Lanzar Actualización**, que despliega un modal donde se redactan las novedades, se selecciona la plataforma y se genera/copia instantáneamente el manifiesto JSON listo para subir a GitHub Releases, Firebase Hosting o cualquier servidor web.

---

## 6. POLÍTICAS DE PRIVACIDAD, SOBERANÍA DE DATOS Y CUMPLIMIENTO LEGAL

Las directivas de privacidad de Venematic POS están fundamentadas en el principio de **Privacidad por Diseño (Privacy by Design)** y **Cero Responsabilidad en la Nube (Zero Cloud Liability)**:

1. **Soberanía y Custodia Local:** La base de datos operacional pertenece exclusivamente al dueño del negocio y reside en su hardware local. Venematic no copia, no intercepta ni revende cifras contables, listas de proveedores ni información de clientes.
2. **Cero Telemetría Comercial:** Durante las consultas de auto-actualización (`version.json`), se transmite únicamente el número de versión y el canal del sistema operativo. No se envían identificadores del negocio ni métricas de facturación.
3. **Protección de Datos Bancarios:** El software nunca almacena contraseñas bancarias, pines de tarjetas de crédito/débito ni códigos de seguridad CVV. Los mensajes de Pago Móvil procesados por webhook se retienen de forma efímera en memoria volátil (TTL 10 minutos) solo para conciliación y se purgan de inmediato.
4. **Deslinde Técnico Fiscal:** El software provee herramientas de cálculo matemático exacto y registro de notas de entrega conforme a los decretos del BCV y SENIAT. Corresponde al contribuyente evaluar si su volumen de ventas requiere la interconexión con impresoras fiscales homologadas por las autoridades tributarias.

---

## 7. ESQUEMA DE LICENCIAMIENTO, NIVELES Y PRECIOS DE VENTA

| Modalidad | Inversión Inicial | Cuota 2 (30 días) | Costo Total | Características Clave |
| :--- | :--- | :--- | :--- | :--- |
| **Starter / Lite** | **$25.00 USD** | $25.00 USD | **$50.00 USD** (Vitalicia) | Punto de venta completo, inventario local, hasta 2 cajeros, reportes básicos, impresión térmica. Conciliación Pago Móvil manual. |
| **Pro Comercial** | **$37.50 USD** | $37.50 USD | **$75.00 USD** (Vitalicia) | Todo lo de Starter + Integración de balanza continua, Webhook Pago Móvil con lectura de SMS y audio, cajeros ilimitados y panel móvil. |
| **Prueba Flash (15 Min)** | **$0.00** | — | — | Demo de demostración presencial con bloqueo automático a los 15 min exactos y resguardo de datos cargados. |
| **Demo Extendida** | **$0.00** | — | — | Evaluación completa temporal por 15 o 30 días para capacitación de personal. |
| **Plan Cloud Backup** | **$5.00 USD/mes** | Mensual | Suscripción | Respaldo diario automático en Google Cloud Firestore con restauración ante siniestros en 5 minutos. |

### 7.1. MATRIZ DE DIFERENCIACIÓN ENTRE VERSIONES Y RECEPCIÓN DE SMS BANCARIOS

| Módulo / Capacidad | Full Desktop (.exe) | Desktop Estándar (.exe) | POS APK Full (.apk) | POS APK Lite Companion (.apk) | POS Administrador (.apk) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Recepción Automática de SMS Pago Móvil** | ✅ **SÍ (Nativo Webhook)** | ❌ *No (Manual)* | ✅ **SÍ (Vía Webhook)** | ❌ *No (Solo Terminal)* | ✅ **SÍ (Captura & Reenvío)** |
| **Campana Sonora de Confirmación de Pago** | ✅ **SÍ** | ❌ *No* | ✅ **SÍ** | ❌ *No* | ✅ **SÍ** |
| **Soporte Balanza Serial Continua (COM)** | ✅ **SÍ** | ❌ *Solo código barra* | ❌ *Solo táctil/cámara* | ❌ *Solo escáner* | ❌ *N/A (Gerencia)* |
| **Modal Automático para Productos Pesables**| ✅ **SÍ** | ✅ **SÍ** | ✅ **SÍ** | ✅ **SÍ** | ❌ *N/A (Gerencia)* |
| **Catálogo e Inventario Local Autónomo** | ✅ **SÍ** | ✅ **SÍ** | ✅ **SÍ** | ❌ *(Espejo de PC)* | ✅ **SÍ (Vista & KPIs)** |
| **Arqueo y Cierre de Turnos (Corte X y Z)** | ✅ **SÍ** | ✅ **SÍ** | ✅ **SÍ** | ❌ *(Reporta a PC)* | ✅ **SÍ (Auditoría)** |
| **Modificación Remota de Tasa BCV** | ✅ **SÍ (Receptor/Emisor)**| ✅ **SÍ (Local)** | ✅ **SÍ** | ❌ *Solo lectura* | ✅ **SÍ (Emisor Maestro)**|
| **Límite de Cajeros Concurrentes** | **Ilimitado (Pro)** | **Hasta 2 (Starter)** | **1 por dispositivo** | **Auxiliar** | **Acceso Dueño** |

> **¿Cómo opera la diferenciación de SMS Pago Móvil?**  
> * **En Versión Full Desktop y POS APK Full:** El sistema activa el endpoint interno `/api/payments/webhook`. Al llegar un SMS de alerta bancaria (del teléfono del dueño o de la tienda vía apps como MacroDroid o SMS Forwarder), el parser extrae automáticamente el monto en Bs, referencia y banco, haciendo sonar el timbre en caja y autocompletando la pasarela de cobro.
> * **En Versión Desktop Estándar y POS APK Lite:** No se incluye el motor de webhook en tiempo real; el cajero cobra verificando el comprobante que le muestra el cliente en pantalla e ingresa manualmente los últimos dígitos de la referencia.

---

## 8. BLINDAJE CRIPTOGRÁFICO HWID Y MANUAL DEL GENERADOR DE CLAVES

### 8.1. Mecanismo de Seguridad por Hardware (HWID Lock)
Cada equipo genera un identificador único irrepetible a partir de la firma de su placa madre, procesador y disco duro:
* Formato Windows: `VN8F-XXXX-XXXX-XXXX`
* Formato Android: `ANDR-XXXX-XXXX-XXXX`

La clave de activación válida (`VNK-XXXX-XXXX-...`) se calcula mediante una función **HMAC-SHA256** utilizando una clave criptográfica maestra secreta con salteado de 64 bits. Una clave generada para un equipo es matemáticamente inservible en otra computadora o teléfono.

### 8.2. Herramientas de Generación de Claves (Uso Exclusivo del Desarrollador)
Bajo ninguna circunstancia las herramientas de generación deben distribuirse al cliente final. Existen tres vías oficiales:

1. **Dashboard Web del Desarrollador:**
   * Archivo: `DASHBOARD_DESARROLLADOR.html`
   * Uso: Abrir en cualquier navegador, ingresar el HWID del cliente, seleccionar el nivel (`starter_installment_1`, `starter_full`, `pro_full`, `demo_30d`, etc.) y generar la clave con 1 clic.
2. **Generador Script Node.js:**
   * Archivo: `scripts/generar-licencia.mjs`
   * Comando: `node scripts/generar-licencia.mjs <HWID> <TIPO>`
3. **Generador Compilado en C# (.NET):**
   * Archivo: `scripts/VenematicKeygen.cs`

### 8.3. Acceso Oculto de Desarrollador en Pantalla de Clientes
Si el desarrollador necesita activar una máquina directamente en el local del cliente sin abrir herramientas externas:
* Realizar **5 toques rápidos** sobre el distintivo de candado/escudo criptográfico en la ventana de activación.
* Ingresar el **PIN Maestro de Desarrollador:** `VNMT-2026-DEV`.

---

## 9. GUÍA DE INSTALACIÓN Y PUESTA EN MARCHA

### 9.1. Instalación en Windows Desktop (PC / All-in-One / Laptop)
1. Copiar el instalador `Venematic-POS-Setup-v2.0.0.exe` a la computadora.
2. Hacer doble clic sobre el instalador. Si Windows SmartScreen muestra una advertencia, hacer clic en *"Más información"* y luego en *"Ejecutar de todas formas"*.
3. El instalador creará el acceso directo en el Escritorio y en el Menú Inicio con el logo de Venematic.
4. Al abrirse por primera vez, copiar el HWID que aparece en pantalla, generar la licencia correspondiente y pegarla para activar el sistema.

### 9.2. Instalación en Celulares y Tablets Android
1. Transferir los archivos APK al dispositivo (por cable USB, WhatsApp o Telegram):
   * `VenematicPOS-Caja-Mobile.apk` para el cajero o tablet de mostrador.
   * `VenematicPOS-Admin-Mobile.apk` para el teléfono personal del dueño del comercio.
2. Habilitar la opción *"Instalar aplicaciones de fuentes desconocidas"* en los ajustes de Android.
3. Tocar el archivo APK para instalar.
4. Otorgar permisos de cámara (requeridos exclusivamente para el escaneo de códigos de barra y códigos QR).

---

## 10. DIRECTORIO MAESTRO DE ARCHIVOS, BINARIOS E INSTALADORES

A continuación se detallan las rutas absolutas dentro del disco de trabajo para rápida localización de los entregables y utilidades:

### 📦 Instaladores de Producción Compilados (5 Ediciones Oficiales Listas para Distribuir):

1. **Versión Full Desktop (.exe):**  
   * Archivo: `Venematic-POS-Full-Desktop-Setup-v2.0.0.exe`  
   * Ruta: `C:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\dist-installer\Venematic-POS-Full-Desktop-Setup-v2.0.0.exe`  
   * *Copia espejo:* `...\venematic-desktop\dist-installer\Venematic-POS-Full-Desktop-Setup-v2.0.0.exe`  
   * Tamaño: 28.6 MB | SHA-256: `C78D943DAE7EF5FB9D853B16020345244488AC80CC261ADEAB5DBFE615DF2AD8`  
   * *Descripción:* Versión de escritorio completa con Cloud Sync, Webhooks de Pago Móvil automáticos, balanza serial continua y cajeros ilimitados.

2. **Versión Desktop Estándar (.exe):**  
   * Archivo: `Venematic-POS-Desktop-Setup-v2.0.0.exe` (y `Venematic-POS-Setup-v2.0.0.exe`)  
   * Ruta: `C:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\dist-installer\Venematic-POS-Desktop-Setup-v2.0.0.exe`  
   * *Copia espejo:* `...\venematic-desktop\dist-installer\Venematic-POS-Desktop-Setup-v2.0.0.exe`  
   * Tamaño: 28.6 MB | SHA-256: `C78D943DAE7EF5FB9D853B16020345244488AC80CC261ADEAB5DBFE615DF2AD8`  
   * *Descripción:* Versión de mostrador local autónoma para tiendas minoristas y negocios con hasta 2 cajeros.

3. **POS APK Lite Complementaria (.apk):**  
   * Archivo: `VenematicPOS-Lite-Companion.apk`  
   * Ruta: `C:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\dist-apk\VenematicPOS-Lite-Companion.apk`  
   * *Copia espejo:* `...\venematic-desktop\dist-apk\VenematicPOS-Lite-Companion.apk`  
   * Tamaño: 4.2 MB | SHA-256: `FAC5FE73F99E50BBF637A53EDA53AE695B37E265477898C88DDE9F098AF7D3F1`  
   * *Descripción:* Terminal auxiliar que complementa la estación de escritorio de la PC para escaneo inalámbrico de productos, chequeo de precios en pasillo y agilización de cobro en colas.

4. **POS APK Full (.apk):**  
   * Archivo: `VenematicPOS-Full-Mobile.apk` (y `VenematicPOS-Caja-Mobile.apk`)  
   * Ruta: `C:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\dist-apk\VenematicPOS-Full-Mobile.apk`  
   * *Copia espejo:* `...\venematic-desktop\dist-apk\VenematicPOS-Full-Mobile.apk`  
   * Tamaño: 4.2 MB | SHA-256: `FAC5FE73F99E50BBF637A53EDA53AE695B37E265477898C88DDE9F098AF7D3F1`  
   * *Descripción:* Punto de venta móvil 100% independiente para cobros táctiles, inventario autónomo y ventas en ferias o mostradores sin PC.

5. **POS APK Administrador (.apk):**  
   * Archivo: `VenematicPOS-Admin-Mobile.apk`  
   * Ruta: `C:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\dist-apk\VenematicPOS-Admin-Mobile.apk`  
   * *Copia espejo:* `...\venematic-desktop\dist-apk\VenematicPOS-Admin-Mobile.apk`  
   * Tamaño: 4.1 MB | SHA-256: `A3E8E7AFCF61B54AA7E917C1FD7D55DEB102B4D91E6644E23D871DC0EBA22E36`  
   * *Descripción:* Módulo de control gerencial del dueño para monitoreo en vivo de ingresos, arqueo de caja, modificación remota de tasa BCV y captura/reenvío de SMS bancarios.

### 🔑 Generadores de Licencias (Confidencial Desarrollador):
* **Panel Gráfico Interactivo:**  
  `C:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\DASHBOARD_DESARROLLADOR.html`
* **Script de Línea de Comandos:**  
  `C:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\scripts\generar-licencia.mjs`
* **Fuente C# del Keygen:**  
  `C:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\scripts\VenematicKeygen.cs`

### 📜 Scripts de Compilación y Automatización (Scripts/):
* Compilador de Instalador Desktop: `scripts\build-installer-full.ps1`
* Compilador de APK de Caja: `scripts\build-pos-apk.ps1`
* Compilador de APK de Administrador: `scripts\build-admin-apk.ps1`
* Firma Digital Authenticode: `scripts\sign-installer.ps1`

---
*Venematic POS — La herramienta definitiva de soberanía tecnológica, precisión comercial y continuidad operativa para el comercio nacional.*
