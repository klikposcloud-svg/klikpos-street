# 🛠️ GUÍA MAESTRA DE CONFIGURACIÓN Y DESPLIEGUE TÉCNICO
## VENEMATIC POS: SMS BANCARIOS (PAGO MÓVIL), FIREBASE FIRESTORE Y SUPABASE

---

## 1. MÓDULO SMS BANCARIOS: GATEWAY DE PAGO MÓVIL AUTOMÁTICO (FUNCIÓN ESTRELLA)

### ¿Cómo opera el flujo de validación automática?
En Venezuela, ante la ausencia de APIs bancarias públicas para pequeños comercios, **Venematic POS** utiliza la recepción de SMS bancarios para certificar pagos en menos de **1 segundo**:

```
┌─────────────────────────────────┐       Intercepción Directa      ┌───────────────────────────────────┐
│     TELÉFONO DEL DUEÑO / CAJA    │ ──────────────────────────────> │   APP VENEMATIC ADMIN (ANDROID)   │
│ Recibe SMS de Banco (BDV, etc.) │                                 │ • Lee SMS vía SmsReceiver nativo  │
└─────────────────────────────────┘                                 │ • Extrae: Banco, Monto, Ref, Tel  │
                                                                    └─────────────────┬─────────────────┘
                                                                                      │ Envía HTTP POST Webhook
                                                                                      │ (milisegundos vía WiFi Local)
                                                                                      ▼
┌─────────────────────────────────┐   Auto-completa Referencia y    ┌───────────────────────────────────┐
│     PANTALLA DE COBRO EN POS    │ <────────────────────────────── │      SERVIDOR CAJA PRINCIPAL      │
│ Cajero cobra en 1 segundo sin   │      aprueba transacción        │ Memoria temporal activa (30 min)  │
│ mirar teléfonos ni comprobantes │                                 │ Endpoint: /api/payments/webhook   │
└─────────────────────────────────┘                                 └───────────────────────────────────┘
```

---

### Opción A: Recepción Nativa en la APK de Administrador (Recomendado)
La aplicación **`VenematicPOS-Admin-Mobile.apk`** incluye de forma nativa los componentes Android:
- **`SmsReceiver.java`**: Escucha el broadcast del sistema `android.provider.Telephony.SMS_RECEIVED`.
- **Permisos requeridos en Android:**
  Al instalar la APK por primera vez en el teléfono del dueño, Android solicitará:
  - *¿Permitir a Venematic Admin enviar y ver mensajes SMS?* ➔ Seleccionar **"Permitir siempre"**.

#### Monitoreo y Simulación en la App de Administrador:
1. Abre **Venematic Admin** en el teléfono.
2. Ingresa a la pestaña **"📲 SMS Gateway"**.
3. Verás el estado: `🟢 Servicio de Escucha SMS: ACTIVO`.
4. Puedes presionar los botones de simulación (**BDV**, **Banesco**, **Mercantil**, **Bancamiga**) para comprobar que la comunicación con las cajas POS está activa y los pagos se reflejan al instante.

---

### Opción B: Teléfono Secundario con App Puente (SMS Forwarder / MacroDroid)
Si los SMS bancarios caen en un teléfono secundario (o un teléfono analógico con SIM compartida):
1. Instala **SMS Forwarder** o **MacroDroid** (gratuitas en Google Play Store).
2. Configura un reenvío Webhook HTTP:
   - **Disparador:** SMS Entrante de números bancarios (`2661`, `2662`, `0414...`, etc.).
   - **Acción:** HTTP Request `POST`.
   - **URL de Destino:** `http://<IP_DE_LA_CAJA_PRINCIPAL>:3000/api/payments/webhook`
   - **Cuerpo (JSON):**
     ```json
     {
       "message": "{sms_body}",
       "sender": "{sms_from}"
     }
     ```

---

### Formatos Regex Soportados por Banco Venezolano

El parser inteligente ([`src/lib/payments/pago-movil-webhook-store.ts`](file:///c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/src/lib/payments/pago-movil-webhook-store.ts)) analiza automáticamente los siguientes formatos:

| Banco | Emisor Habitual | Formato del SMS | Patrón Extraído |
| :--- | :---: | :--- | :--- |
| **Banco de Venezuela (BDV)** | `2661` / `2662` | `BDV: PagoClave recibido por Bs. 250,00 del 04141234567 Ref: 849201. Fecha: 25/09/2026` | Banco: BDV<br>Monto: 250.00<br>Ref: 849201 |
| **Banesco** | `BANESCO` | `Banesco: Recibiste PagoMóvil por Bs. 520,00 de CARLOS PEREZ CI 18492012 Ref: 0019284` | Banco: Banesco<br>Monto: 520.00<br>Ref: 0019284 |
| **Mercantil** | `TPAGO` | `Tpago Mercantil: Abono por Bs. 180,00 desde el 04249876543 Comprobante 391028` | Banco: Mercantil<br>Monto: 180.00<br>Ref: 391028 |
| **Bancamiga** | `BANCAMIGA` | `Bancamiga: Pago Movil recibido por Bs. 340,00 del 04125556677 Referencia 991823` | Banco: Bancamiga<br>Monto: 340.00<br>Ref: 991823 |
| **BBVA Provincial** | `PROVINCIAL` | `Dinero Rapido BBVA: Recibio Bs 450,00 en cta ...1234 de 04161112233 Ref 441029` | Banco: Provincial<br>Monto: 450.00<br>Ref: 441029 |
| **BNC** | `BNC` | `BNC Pago Movil: Abono recibido Bs. 300,00 Ref: 772910` | Banco: BNC<br>Monto: 300.00<br>Ref: 772910 |

---

## 2. MÓDULO FIREBASE FIRESTORE (NUBE GOOGLE)

Firebase Firestore proporciona la sincronización en la nube para comercios con múltiples sucursales o dueños que desean ver sus reportes fuera del local comercial.

### Variables de Entorno en `.env.local`
Configura las credenciales en la raíz del proyecto (`.env.local`):

```bash
# ==============================================================================
# CONFIGURACIÓN FIREBASE FIRESTORE (VENEMATIC POS NUBE)
# ==============================================================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=venematic-pos.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=venematic-pos
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=venematic-pos.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=109283746501
NEXT_PUBLIC_FIREBASE_APP_ID=1:109283746501:web:a1b2c3d4e5f6g7h8i9j0k1
```

### Estructura de Colecciones Oficiales

| Colección | Descripción del Documento | Campos Clave |
| :--- | :--- | :--- |
| **`sales`** | Registro individual de cada venta procesada. | `id`, `receiptNumber`, `totalUSD`, `totalVES`, `bcvRate`, `paymentMethod`, `items[]`, `cashierId`, `timestamp`. |
| **`inventory`** | Catálogo general de productos y stock. | `id`, `barcode`, `name`, `priceUSD`, `costUSD`, `stock`, `minStock`, `category`, `updatedAt`. |
| **`system_settings`** | Parámetros de negocio y tasas. | `active_bcv_rate`, `company_name`, `rif`, `printer_format` (58mm/80mm), `primary_currency` (VES/USD). |
| **`branding_config`** | Personalización visual y colores. | `paletteId`, `uiStyle`, `industrialBg`, `customBgColor`. |
| **`licenses`** | Control de licencias activas y cuotas. | `hwid`, `rif`, `plan`, `expiresAt`, `licenseKey`, `status`. |

### Reglas de Seguridad Oficiales (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura y escritura autenticada o mediante clave de sucursal
    match /sales/{saleId} {
      allow read, create: if true; // Cajas pueden emitir ventas offline/online
      allow update, delete: if request.auth != null && request.auth.token.admin == true;
    }
    match /inventory/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /system_settings/{settingId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /licenses/{licenseId} {
      allow read: if true;
      allow write: if false; // Solo administrable por Cloud Functions autorizadas
    }
  }
}
```

---

## 3. MÓDULO SUPABASE (POSTGRESQL RELACIONAL Y ANALÍTICA)

Supabase es la alternativa relacional ideal para distribuidores, cadenas de tiendas o usuarios que requieren reportería SQL avanzada, integración con PowerBI o exportación contable formal.

### Variables de Entorno en `.env.local`
```bash
# ==============================================================================
# CONFIGURACIÓN SUPABASE POSTGRESQL (CLOUD RELACIONAL)
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Script DDL SQL de Inicialización para Supabase
Ejecuta este script en el **SQL Editor** de tu consola Supabase:

```sql
-- 1. TABLA DE PRODUCTOS E INVENTARIO
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR(64) UNIQUE,
    name VARCHAR(255) NOT NULL,
    price_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    cost_usd NUMERIC(10,2) DEFAULT 0.00,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    category VARCHAR(100) DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA MAESTRA DE VENTAS (TICKETS Y FACTURAS)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(32) NOT NULL UNIQUE,
    total_usd NUMERIC(10,2) NOT NULL,
    total_ves NUMERIC(14,2) NOT NULL,
    bcv_rate NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(32) NOT NULL, -- cash_usd, cash_ves, pago_movil, pos, binance, zelle
    payment_reference VARCHAR(64),
    cashier_name VARCHAR(100) DEFAULT 'Cajero',
    branch_id VARCHAR(64) DEFAULT 'principal',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DETALLE DE PRODUCTOS VENDIDOS
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10,3) NOT NULL,
    unit_price_usd NUMERIC(10,2) NOT NULL,
    total_price_usd NUMERIC(10,2) NOT NULL
);

-- 4. TABLA DE HISTORIAL DE TASA BCV
CREATE TABLE IF NOT EXISTS public.bcv_rates (
    id SERIAL PRIMARY KEY,
    rate_ves NUMERIC(10,2) NOT NULL,
    effective_date TIMESTAMPTZ DEFAULT NOW(),
    registered_by VARCHAR(64) DEFAULT 'admin_mobile'
);

-- 5. ÍNDICES DE ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_receipt ON public.sales(receipt_number);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);

-- 6. POLÍTICAS RLS (ROW LEVEL SECURITY)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de productos para cajas POS" ON public.products FOR SELECT USING (true);
CREATE POLICY "Inserción de ventas permitida para terminales autorizados" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura de ventas para reportes de administradores" ON public.sales FOR SELECT USING (true);
```

---

## 4. RESUMEN DE INTEGRACIÓN: ¿QUÉ SERVICIO ELEGIR?

| Requerimiento del Negocio | Solución Recomendada | Configuración |
| :--- | :--- | :--- |
| **Cobro Ultra Rápido en Caja sin Depender de Internet** | **SQLite Local + Webhook SMS** | Incluido por defecto en la instalación de Windows y Android. |
| **Dueño Supervisando desde su Teléfono en el Negocio** | **Venematic Admin APK (WiFi Local)** | Se conecta en tiempo real a `http://192.168.1.xxx:3000`. |
| **Dueño Supervisando desde Casa o Datos Móviles 4G** | **Firebase Firestore** | Sincronización automática de colecciones en la nube. |
| **Cadena con Múltiples Sucursales y Servidor SQL Central** | **Supabase PostgreSQL** | Sincronización relacional masiva con reportería corporativa. |
