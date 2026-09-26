# 📜 TÉRMINOS DE SERVICIO, POLÍTICA DE ACTUALIZACIONES Y PRIVACIDAD
## SUITE VENEMATIC POS (Desktop, Móvil y Servicios Conectados)

**Última Actualización:** Septiembre 2026  
**Ámbito de Aplicación:** República Bolivariana de Venezuela  

El presente acuerdo regula el uso del software **Venematic POS** (en sus versiones Windows Desktop, Android Móvil y Android Administrador), así como sus servicios complementarios de sincronización y respaldo.

---

### 1. PROPIEDAD Y CONFIDENCIALIDAD DE LOS DATOS COMERCIALES
1.1. **Propiedad Exclusiva del Comerciante:** Todos los registros contables, costos de adquisición de mercancía, márgenes brutos y netos de ganancia, lista de proveedores e información confidencial de clientes ingresados en el sistema son propiedad estricta y exclusiva del titular de la licencia comercial.  
1.2. **No Comercialización de Datos:** Venematic POS garantiza que bajo ninguna circunstancia venderá, transferirá ni divulgará información financiera privada o libros de ventas a terceros.  
1.3. **Almacenamiento Local Seguro:** El sistema opera bajo arquitectura *Offline-First*, garantizando que la base de datos operativa principal reside físicamente en el dispositivo del comercio (computadora o teléfono Android).

---

### 2. POLÍTICA DE ACTUALIZACIONES AUTOMÁTICAS, INTEGRIDAD Y PRIVACIDAD DEL SISTEMA
2.1. **Actualizaciones de Mantenimiento y Compatibilidad:** Para garantizar la compatibilidad operativa continua con cambios en las tasas cambiarias del Banco Central de Venezuela (BCV), normativas tributarias del SENIAT, formatos de impresión térmica y mejoras en la sincronización, el sistema cuenta con un motor de actualización automática y distribución de parches.
2.2. **Continuidad Operativa Ininterrumpida:** Ninguna verificación o descarga de actualización interrumpirá las ventas en curso. Las actualizaciones se notifican de manera visual al administrador y solo se aplican con su confirmación o en momentos de reinicio seguro del sistema.
2.3. **Privacidad Absoluta y Cero Fuga de Datos (Zero Data Leakage):** Durante las consultas de comprobación de nuevas versiones (consultas HTTP/HTTPS al manifiesto `version.json`), el sistema transmite **única y exclusivamente** el identificador semver de la versión actual instalada y el canal de plataforma (`desktop` o `mobile`). 
   * **Garantía Estricta:** Bajo ninguna circunstancia se envían, transmiten, almacenan en registros remotos ni procesan datos del negocio, montos de venta, libros contables, inventario de productos, márgenes de ganancia, listas de clientes, documentos de identidad (cédulas/RIF) ni claves de acceso.
2.4. **Preservación e Inmunidad de la Base de Datos Local:** El proceso de actualización actualiza exclusivamente el motor ejecutable y los archivos estáticos de la interfaz. La base de datos operativa local (alojada en `%APPDATA%` en Windows y en el almacenamiento de contenedor en Android mediante SQLite / IndexedDB Dexie) permanece completamente intacta e inmune a sobreescrituras o reseteos accidentales durante cualquier actualización.
2.5. **Verificación Criptográfica de Integridad:** Todo paquete de actualización distribuido incluye verificación de integridad criptográfica (SHA-256) y firma digital, garantizando que el software instalado proviene auténticamente del equipo de ingeniería de Venematic y no ha sido alterado por intermediarios.
2.6. **Soberanía y Control del Usuario (Configuración y Opt-Out):** El Administrador del establecimiento goza de soberanía total:
   * Puede activar o desactivar la comprobación automática al iniciar el sistema desde el panel de **Configuración > Actualizaciones**.
   * Puede realizar comprobaciones manuales en el momento que desee.
   * Tiene acceso a la lectura completa de notas de la versión (*changelog*) antes de autorizar la aplicación de un paquete de actualización.
2.7. **Operatividad 100% Fuera de Línea (Offline Resilient):** En ausencia de conectividad a Internet, el módulo de auto-actualización entra en modo de reposo transparente, sin arrojar alertas intrusivas ni degradar en lo más mínimo la velocidad o disponibilidad del punto de venta en caja.

---

### 3. SERVICIO DE RESPALDO EN LA NUBE (PLAN CLOUD BACKUP)
3.1. **Naturaleza del Servicio:** Para los usuarios suscritos al plan de respaldo en la nube ($5.00 USD mensuales o equivalente en Bs.), Venematic POS gestionará de forma automatizada copias de seguridad continuas y cifradas en servidores Google Cloud Firestore.  
3.2. **Cero Configuración para el Usuario:** La infraestructura en la nube es administrada integralmente por Venematic. El comerciante no requiere contratar servidores externos ni manipular claves de API.  
3.3. **Recuperación Inmediata ante Siniestros:** En caso de daño físico, hurto o reemplazo del equipo de caja, el comercio podrá restablecer su catálogo completo, inventario y cuentas pendientes en una nueva terminal en menos de 5 minutos mediante su identificador de licencia.  
3.4. **Pausa del Servicio:** En caso de suspensión o no renovación de la mensualidad de respaldo, los datos locales en la computadora o celular del comercio permanecerán intactos y 100% operativos.

---

### 4. CLÁUSULA ESPECIAL: RED CONECTADA DE DELIVERY Y MARKETPLACE
*(Aplicable únicamente tras el lanzamiento oficial del módulo de Delivery y con previa activación por parte del comercio)*

4.1. **Vitrina Virtual sin Doble Carga:** Al habilitarse la integración con la red de domicilios de Venematic, el sistema publicará automáticamente la disponibilidad de productos para los consumidores de la zona geográfica cercana.  
4.2. **Delimitación de Datos Compartidos en la Red de Delivery:**  
* **Datos Públicos Sincronizados:** Nombre del producto, categoría comercial, precio de venta al público en USD/Bs., existencia disponible para despacho y fotografía referencial.  
* **Datos Excluidos y Protegidos:** Costo de compra del producto, proveedor de origen, saldo total recaudado en caja y transacciones de clientes presenciales ajenos a la plataforma de delivery.  
4.3. **Control del Comerciante:** El propietario del establecimiento mantendrá en todo momento la facultad de pausar su disponibilidad en la red de delivery o marcar productos específicos como "exclusivos para tienda física".

---

*Venematic POS — Garantía de operatividad, privacidad y soberanía de datos para el comercio nacional.*
