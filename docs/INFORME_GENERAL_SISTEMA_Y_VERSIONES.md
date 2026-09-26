# 📋 INFORME GENERAL DEL SISTEMA VENEMATIC POS
## Arquitectura Multi-Caja, Funcionalidades por Versión y Manual Operativo

**Fecha de Publicación:** Septiembre 2026  
**Ecosistema:** Windows Desktop POS (Tauri / Next.js) + Android Mobile POS (APK) + Android Admin Suite (APK)  
**Cobertura Regional:** República Bolivariana de Venezuela (Multi-Moneda USD/VES, Tasa BCV Oficial, Normativa SENIAT)

---

## 1. RESUMEN EJECUTIVO: ¿QUÉ ES VENEMATIC POS?

**Venematic POS** es un sistema integral de punto de venta, facturación, control de inventario y conciliación bancaria diseñado específicamente para superar las adversidades de conectividad, fluctuación cambiaria e interrupciones eléctricas del comercio venezolano.

### Pilares Fundamentales:
1. **Offline-First Absoluto (Cero Dependencia de Internet):** Si se cae la fibra óptica o el internet móvil, el negocio continúa facturando a máxima velocidad.
2. **Respaldo ante Fallas Eléctricas (Modo Batería Móvil):** Si se apaga la PC por corte de energía sin UPS/planta, todas las cajas pueden seguir cobrando desde celulares Android con sincronización en la nube (4G) o almacenamiento local en cola.
3. **Validación Automática de Pago Móvil por SMS (Función Estrella):** Intercepción nativa de mensajes bancarios (BDV, Banesco, Mercantil, Bancamiga, Provincial, BNC) en el celular del dueño con retransmisión instantánea a las pantallas de los cajeros en menos de 1 segundo.
4. **Tasa Oficial BCV Dinámica:** Conversión bimonetaria instantánea en Dólares ($ USD) y Bolívares (Bs. VES).

---

## 2. ARQUITECTURA MULTI-CAJA Y TOPOLOGÍA DE RED

### A. Operación Ordinaria (Con Electricidad en el Local)
En un negocio con 1 a 10 terminales de cobro:

* **Caja 1 (PC Mostrador Principal / Servidor LAN):**
  * Corre en la PC principal con Windows (puerto `3000`).
  * Posee IP fija en el router local (ej: `192.168.1.100`).
  * Contiene la base de datos maestra de productos, precios y ventas.
  * Distribuye eventos en tiempo real mediante **Server-Sent Events (SSE)** hacia las demás cajas.
* **Cajas 2, 3... N (PCs de Cobro Secundarias):**
  * Se conectan a la red local y abren la interfaz apuntando a `http://192.168.1.100:3000`.
  * Cada terminal posee su propia sesión (`session=caja-2`, `session=caja-3`) y cajero asignado.
  * Todo cobro descuenta inmediatamente del inventario de la Caja 1.
* **Cajas Móviles (Smartphones / Tablets Android - APK Caja Móvil):**
  * Los pasilleros o cajeros de contingencia usan la APK enlazada por Wi-Fi a `http://192.168.1.100:3000`.
  * Emiten cobros, escanean productos con la cámara del celular e imprimen tickets por Bluetooth.
* **APK Administrador (Teléfono Personal del Dueño):**
  * Recibe los SMS de Pago Móvil en su línea personal.
  * La APK extrae los datos y envía un webhook a la Caja 1 (`POST /api/payments/webhook`).
  * La Caja 1 notifica en verde a la caja correspondiente para que el cajero entregue la mercancía sin esperar capturas de pantalla falsas.

---

### B. Operación en Contingencia Eléctrica (Apagón Sin UPS ni Planta)
¿Qué ocurre si se va la luz y la PC Servidor se apaga?

1. **Escenario con Datos Móviles 4G (Google Cloud Firestore / Supabase):**
   * Los cajeros abren la APK de Venematic en sus celulares personales con datos de Digitel o Movistar.
   * La app conmuta automáticamente a la base de datos en la Nube (Firestore / Supabase).
   * Todas las cajas móviles leen el inventario central en la nube y descuentan existencias en tiempo real.
   * El teléfono del dueño sigue validando pagos móviles y subiéndolos a la nube.
2. **Escenario sin Señal ni Electricidad (Zona Muerta):**
   * Cada teléfono opera en **modo autónomo local** (IndexedDB / SQLite local).
   * Cada caja emite tickets con correlativo único (Caja A: `A-0001`, Caja B: `B-0001`) para evitar choques de numeración.
   * Al regresar la energía o la señal telefónica, el sistema ejecuta `syncPendingSales()` y consolida todas las ventas del día automáticamente sin duplicados.

---

## 3. COMPARATIVA COMPLETA DE FUNCIONALIDADES SEGÚN VERSIÓN

| Módulo / Característica | Edición 1: Móvil Full POS | Edición 2: Desktop + Móvil | Edición 3: Full Master Enterprise |
| :--- | :---: | :---: | :---: |
| **Dispositivos Incluidos** | 1 Teléfono / POS Android | 1 PC Windows + 1 Celular | 1 PC Windows Server + Cajas Auxiliares + APK Admin |
| **Facturación en Mostrador PC (Windows)** | ❌ No | ✅ Sí | ✅ Sí (Multi-Caja) |
| **Punto de Venta Táctil Portátil (Android)** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Cajas Móviles Ilimitadas (Red LAN)** | ❌ No | Limitado (1 móvil) | ✅ **Ilimitadas** |
| **App Móvil de Administrador / Dueño** | ❌ No | ❌ No | ✅ **Incluida (Exclusiva)** |
| **Intercepción Automática de SMS Pago Móvil** | ❌ No | ❌ No | ✅ **Incluida con Regex Multibanca** |
| **Envío de Resumen Diario a WhatsApp** | ❌ No | Manual | ✅ **1 Clic con Formato Profesional** |
| **Reportes X y Z (Fiscal SENIAT y Gerencial)** | Estándar | Completo | ✅ **Completo + Auditoría en Vivo** |
| **Modo Offline-First (Cobro Sin Internet)** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Sincronización en la Nube (Firestore/Supabase)** | Opcional | Opcional | ✅ **Incluida y Automatizada** |
| **Soporte de Gaveta de Dinero y Balanza** | ❌ No | ✅ Sí | ✅ Sí |
| **Lector de Código de Barras** | Cámara del Celular | USB / Inalámbrico | USB / Láser / Cámara |
| **Impresión Térmica Dual (58mm / 80mm)** | Bluetooth | USB / Red LAN | USB / Bluetooth / Red LAN |
| **Bloqueo Rápido de Pantalla por PIN** | PIN Básico | PIN Cajero | ✅ **PIN Maestro + Supervisor** |
| **Edición en Vivo de Precios ($) y Stock** | Desde menú | Desde inventario | ✅ **En vivo desde celular del Dueño** |

---

## 4. GATEWAY DE VALIDACIÓN AUTOMÁTICA DE PAGO MÓVIL POR SMS

### Bancos Soportados Nativamente:
1. **Banco de Venezuela (BDV - PagoClave):**
   * Regex: `BDV|PAGOCLAVE` → Extrae Monto Bs., Referencia y Teléfono origen.
2. **Banesco (PagoMóvil):**
   * Regex: `BANESCO|PAGOMOVIL` → Extrae Monto Bs., Cédula/Nombre y Referencia.
3. **Banco Mercantil (Tpago):**
   * Regex: `TPAGO|MERCANTIL` → Extrae Monto Bs., Comprobante y Teléfono.
4. **Bancamiga (Pago Móvil):**
   * Regex: `BANCAMIGA` → Extrae Monto Bs. y Referencia.
5. **BBVA Provincial (Dinero Rápido):**
   * Regex: `PROVINCIAL|DINERO RAPIDO` → Extrae Monto Bs. y Referencia.
6. **Banco Nacional de Crédito (BNC):**
   * Regex: `BNC` → Extrae Monto Bs. y Referencia.

### Flujo de Verificación:
1. El cliente efectúa el pago desde su aplicación bancaria.
2. El SMS oficial de notificación llega al teléfono del dueño en 5-15 segundos.
3. La APK Administradora intercepta el mensaje sin que el dueño tenga que desbloquear el teléfono.
4. La APK extrae los datos y los envía al endpoint `/api/payments/webhook`.
5. La caja donde está el cliente recibe la confirmación instantáneamente por SSE:
   * **Monto exacto verificado.**
   * **Referencia cruzada confirmada.**
   * **Alerta sonora y visual en verde.**
6. El ticket se imprime y se liquida automáticamente como Pago Móvil.

---

## 5. SUITE DE HERRAMIENTAS DE LICENCIAMIENTO (KEYGEN)

Para emitir licencias comerciales a los clientes sin depender de servicios externos:

1. **`VenematicKeygenPortable.exe`**:
   * Aplicación nativa portable para Windows (.NET).
   * Permite ingresar el Hardware ID (HWID) del cliente, seleccionar el plan (Starter 30 días, Starter Permanente, Pro Master 30 días, Full Master Permanente) y generar la clave criptográfica firmada en 1 clic.
2. **`KEYGEN_VENEMATIC.html`**:
   * Generador web autónomo HTML5/WebCrypto para usar desde cualquier navegador o teléfono sin instalar nada.
3. **`ABRIR_KEYGEN_PORTABLE.bat` / `GENERAR_LICENCIA.bat`**:
   * Acceso directo de escritorio para uso rápido por parte de los distribuidores o personal de soporte.

---

## 6. ESQUEMA DE VENTAS Y FINANCIAMIENTO EN 2 CUOTAS

| Plan Comercial | Precio Total | Cuota 1 (Día 0) | Cuota 2 (Día 30) | Entrega al Cliente |
| :--- | :---: | :---: | :---: | :--- |
| **Plan Starter (Móvil o Desktop Básico)** | **$50.00** | $25.00 | $25.00 | Licencia 30 días inicial → Licencia Permanente definitiva al completar pago. |
| **Plan Pro Master (Desktop + Móvil + Nube)** | **$75.00** | $37.50 | $37.50 | Licencia 30 días inicial → Licencia Permanente definitiva al completar pago. |
| **Full Master Enterprise (Suite Completa + SMS)** | Cotización según terminales | 50% inicial | 50% a los 30 días | Despliegue completo con APK Admin y servidor multi-caja. |

---

*Desarrollado y mantenido por el equipo de ingeniería de Venematic POS.*
