# Manual Oficial de Generación y Emisión de Licencias | Venematic POS

**Versión del Sistema de Licenciamiento:** v2.0 (Criptografía Asimétrica SHA-256 Offline-First)  
**Autoridad Emisora:** Aivyntrax / Venematic Core Engineering  
**Última Actualización:** Septiembre 2026

---

## 1. Métodos Disponibles para Generar Licencias

Tienes a tu disposición **3 métodos rápidos** para generar claves de activación en cualquier momento y lugar:

### Método 1: Programa Portable Windows (.exe) - *¡El más Rápido y Cómodo!*
- **Archivo:** `VenematicKeygenPortable.exe` o ejecutando el acceso directo `ABRIR_KEYGEN_PORTABLE.bat`.
- **Ventajas:**
  - Aplicación nativa de Windows con interfaz visual moderna en Modo Oscuro.
  - **Cero dependencias:** No requiere Node.js, no requiere instalación, no requiere internet.
  - Permite copiar la clave con un clic o generar el mensaje de WhatsApp formateado con negritas y emojis.
  - Guarda automáticamente un historial de todas las licencias emitidas en `LICENCIAS_EMITIDAS_REGISTRO.txt`.

### Método 2: Interfaz Web / Generador HTML
- **Archivo:** `KEYGEN_VENEMATIC.html`.
- **Ventajas:**
  - Doble clic y abre en cualquier navegador web moderno (Edge, Chrome, Brave, Firefox) o en el teléfono.
  - Cálculo instantáneo mediante WebCrypto API SHA-256.

### Método 3: Consola / Terminal por Lotes
- **Archivo:** `GENERAR_LICENCIA.bat` (ejecuta `node scripts/generar-licencia.mjs`).
- **Ventajas:**
  - Guía interactiva paso a paso por consola.

---

## 2. Parámetros Requeridos para Emitir una Licencia

Para que una clave sea válida, el algoritmo requiere dos datos únicos del cliente:

| Parámetro | Dónde se Obtiene | Ejemplo |
| :--- | :--- | :--- |
| **HWID (Hardware ID)** | El cliente lo ve en la pantalla de activación de su PC o teléfono Android. Es único por dispositivo. | `VN8F-3A12-9C84-7F21` o `ANDR-4B9F-8812` |
| **RIF / Cédula** | El documento fiscal del negocio o comerciante. | `J-12345678-9` o `V-18765432` |
| **Plan Seleccionado** | El paquete acordado con el cliente. | *Ver catálogo de planes abajo* |

---

## 3. Planes Disponibles y Esquema de Cuotas

El sistema de Venematic POS utiliza un modelo de financiamiento en **dos cuotas** para facilitar la adquisición sin fricción:

| Código Plan | Prefijo | Nombre del Plan | Modalidad / Duración | Precio | Características Incluidas |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `starter_trial` | **STT** | **Starter - 1ra Cuota** | 30 días de acceso completo | **$25.00** | Caja POS, Inventario, Tickets 58/80mm, Códigos de barra, 2 Cajeros. |
| `starter_full` | **STR** | **Starter - Licencia Completa** | **PERMANENTE (Sin vencimiento)** | **$50.00** *(Segunda cuota de $25 pagada)* | Licencia definitiva permanente para 1 terminal. |
| `pro_trial` | **PTT** | **Pro Master - 1ra Cuota** | 30 días de acceso completo | **$37.50** | Todo Starter + Firebase Cloud, Verificador Pago Móvil, Balanza, Cajeros ilimitados. |
| `pro_full` | **PRO** | **Pro Master - Licencia Completa** | **PERMANENTE (Sin vencimiento)** | **$75.00** *(Segunda cuota de $37.50 pagada)* | Licencia definitiva permanente para la suite Pro. |
| `demo` | **DMO** | **Demo / Evaluación de Cortesía** | 15 días continuos | **GRATIS** | Para demostraciones comerciales a prospectos. |
| `trial_15m` | **T15** | **Prueba Flash In Situ** | 15 minutos exactos | **GRATIS / DEMO** | Para probar la instalación frente al cliente antes de que realice el pago. |
| `anual` | **ANL** | **Plan Anual de Renovación** | 365 días continuos | **A convenir** | Para contratos corporativos con soporte anual. |
| `vitalicia` | **VIT** | **Licencia Vitalicia Especial** | **PERMANENTE** | **Especial** | Cuentas corporativas o franquicias. |

---

## 4. Estructura Criptográfica de la Clave de Producto

Cada clave generada tiene el formato estándar:

$$\mathbf{VNK - [PREFIJO] - [EXPIRACION] - [XXXX-XXXX-XXXX-XXXX]}$$

- **`VNK`**: Identificador de producto oficial Venematic Key.
- **`[PREFIJO]`**: Código del plan (`STR`, `STT`, `PRO`, `PTT`, `DMO`, `T15`, etc.).
- **`[EXPIRACION]`**: 
  - `PERP` = Permanente / Vitalicia.
  - `15MN` = 15 minutos flash.
  - `YYMM` (ej. `2610`) = Año y mes límite de validez.
- **`[16 caracteres hexadecimales]`**: Firma HMAC-SHA256 matemática derivada de la combinación única `HWID + RIF + PLAN + EXPIRACION + MASTER_SALT`.
- **Seguridad Garantizada:** Si un cliente altera la fecha en su Windows o clona la clave en otra computadora, la firma matemática no coincidirá y el sistema se bloqueará automáticamente.

---

## 5. Plantilla de Mensaje para Enviar al Cliente por WhatsApp

Cuando usas el botón **"💬 Copiar Mensaje WhatsApp"** del programa portable, se copia automáticamente este formato listo para enviar:

```text
✨ *ACTIVACIÓN OFICIAL VENEMATIC POS* ✨
-----------------------------------------
Hola, *Bodegón El Éxito C.A.*! Aquí tienes tu clave de activación oficial para tu sistema:

📌 *Comercio / RIF:* J-50123456-7
💻 *HWID Terminal:* VN8F-3A12-9C84-7F21
📦 *Plan Asignado:* Starter - Licencia Completa Permanente ($50.00)
⏳ *Vigencia:* PERMANENTE (Sin Vencimiento)

🔑 *TU CLAVE DE ACTIVACIÓN:*
`VNK-STR-PERP-63FC-DE73-6A3C-BB3B`

📋 *Pasos para activar:*
1. Abre Venematic POS en tu equipo o teléfono.
2. En la pantalla de Activación / Configuración, escribe tu RIF y pega esta clave.
3. Presiona 'Activar Licencia'. El sistema se desbloqueará de inmediato.
-----------------------------------------
¡Gracias por confiar en Venematic POS!
```

---

## 6. Registro de Auditoría y Control de Claves

Cada vez que generas una clave con `VenematicKeygenPortable.exe`, puedes presionar **"💾 Guardar en Registro (.txt)"**. Se creará/actualizará el archivo:

`LICENCIAS_EMITIDAS_REGISTRO.txt`

Con el formato:
```text
[2026-09-25 23:30:15] | RIF: J-50123456-7 | HWID: VN8F-3A12-9C84-7F21 | PLAN: starter_full ($50.00) | KEY: VNK-STR-PERP-63FC-DE73-6A3C-BB3B | NEGOCIO: Bodegón El Éxito C.A.
```
Esto te permite tener un control contable exacto de qué clientes han pagado la 1ra cuota y cuándo les toca cancelar la 2da cuota para recibir su clave definitiva permanente.
