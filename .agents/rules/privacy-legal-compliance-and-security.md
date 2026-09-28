# KlikPOS & Web Ecosystem: Strict Legal, Privacy & Regulatory Compliance Standards (Zero-Liability Engineering)

Todos los desarrolladores y agentes de IA que implementen funcionalidades en este y cualquier otro proyecto deben cumplir estrictamente los siguientes 7 estándares legales y de privacidad para evitar multas regulatorias y demandas internacionales:

---

### 1. 🛡️ Protección de Menores (COPPA en EE.UU. & GDPR-K en Europa)
* **Regulación:** Ley COPPA (hasta $53,044 por infracción) y GDPR Art. 8.
* **Regla de Ingeniería:**
  - Todo formulario de registro de usuarios o clientes que recopile datos personales (nombre, email, teléfono, dirección) debe incluir validación de edad o casilla obligatoria de confirmación de mayoría de edad (>= 18 años o >= 13/16 con autorización).
  - Nunca recopilar datos biométricos ni perfiles de menores sin flujo explícito de consentimiento parental verificable.

---

### 2. 🔤 Prohibición de Fuga de IPs en Tipografías y CDNs (Fallo Tribunal de Múnich / GDPR)
* **Regulación:** Fallo LG München (Case 3 O 17493/20) – La transferencia no consentida de la dirección IP del visitante a servidores de Google Fonts / CDNs de terceros viola el RGPD.
* **Regla de Ingeniería:**
  - **100% Fuentes Auto-alojadas (Self-Hosted):** Todas las fuentes (Inter, Outfit, Plus Jakarta Sans, JetBrains Mono) deben residir localmente en `public/fonts/` o empaquetarse estáticamente con `next/font/local` o `@font-face` relativo.
  - Prohibido enlazar `https://fonts.googleapis.com` o `https://fonts.gstatic.com` en tiempo de ejecución en producción sin proxy local.
  - Esto además garantiza que el software POS sea 100% autónomo y funcione offline sin internet.

---

### 3. 🎙️ Grabación de Sesiones & Keystroke Tracking (CIPA / Leyes Anti-Escucha de California)
* **Regulación:** California Invasion of Privacy Act (CIPA) – Hasta $5,000 por sesión sin consentimiento explícito.
* **Regla de Ingeniería:**
  - Prohibido activar herramientas de grabación de sesión en tiempo real (Hotjar, FullStory, Microsoft Clarity, LogRocket) por defecto.
  - Si se implementa analítica de interacción:
    1. Debe requerir consentimiento explícito mediante banner de privacidad previo.
    2. **Enmascaramiento Total Obligatorio:** Todo campo de contraseña, tarjeta de crédito, token bancario, PIN o cédula/RIF debe tener atributos de anonimización (`data-private`, `data-mask-input`, `type="password"`).

---

### 4. 📬 Cumplimiento de Comunicaciones por Correo (CAN-SPAM Act & Leyes Anti-Spam)
* **Regulación:** FTC CAN-SPAM Act (hasta $53,044 por correo infractor).
* **Regla de Ingeniería:**
  - Todo correo enviado desde el sistema (notificaciones de lanzamiento, recibos por email, boletines o avisos de cobro) debe incluir obligatoriamente:
    1. Enlace claro y funcional de desuscripción en 1 solo clic (`Darse de baja` / `Unsubscribe`).
    2. Dirección postal física o domicilio fiscal verificable de la empresa en el pie de página.
    3. Asunto claro y no engañoso que refleje el contenido real del mensaje.

---

### 5. 💳 Transparencia en Renovaciones Automáticas y Pagos (California ARL & Derechos del Consumidor)
* **Regulación:** California Automatic Renewal Law (ARL) y Directiva Europea de Derechos de los Consumidores.
* **Regla de Ingeniería:**
  - Si el software ofrece planes de suscripción recurrente o crédito (ej. Respaldo Nube $5/mes, Cuotas Pro):
    1. Los términos de renovación (frecuencia, monto exacto de cobro y cómo cancelar en 1 clic) deben mostrarse **de forma visible e inmediata justo al lado o encima del botón de pago**.
    2. Prohibido el uso de patrones oscuros (*dark patterns*) que dificulten la cancelación.

---

### 6. ⚖️ Protección de Derechos de Autor en Contenido Subido (DMCA Safe Harbor)
* **Regulación:** Digital Millennium Copyright Act (DMCA) 17 U.S.C. § 512 (hasta $150,000 por obra infringida).
* **Regla de Ingeniería:**
  - En módulos donde los usuarios suban imágenes de catálogo, avatares o logos:
    1. Incluir en los términos y condiciones el descargo de responsabilidad donde el usuario declara poseer los derechos o licencias de las imágenes subidas.
    2. Disponer de un canal o correo de contacto directo para avisos de retirada de contenido por derechos de autor (`dmca@klikposcloud.com` o similar).

---

### 7. 🍪 Privacidad de Cookies & Derechos ARCO / GDPR
* **Regulación:** Directiva ePrivacy y GDPR (Art. 15-22: Acceso, Rectificación, Cancelación y Oposición).
* **Regla de Ingeniería:**
  - El almacenamiento local (IndexedDB, LocalStorage) de KlikPOS debe priorizar el procesamiento en el dispositivo del cliente (*Privacy by Design* / *Edge Computing*).
  - Incluir botón de `Exportar mis Datos (JSON/Excel)` y `Restablecer / Borrar Base de Datos Local` para garantizar el derecho al olvido y portabilidad.
