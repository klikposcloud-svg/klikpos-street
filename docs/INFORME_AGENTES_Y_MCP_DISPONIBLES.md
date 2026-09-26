# 🤖 Catálogo de Agentes de IA, Servidores MCP y Skills Disponibles en Venematic

> **Proyecto**: Venematic POS (Desktop, Web Full & APK Móvil)  
> **Fecha de Actualización**: Septiembre 2026  
> **Propósito**: Mapeo exhaustivo de capacidades agenticas, protocolos de herramientas y especializaciones activas para potenciar el desarrollo pro-elite.

---

## 📑 Índice General
1. [Servidores MCP (Model Context Protocol) Conectados](#1-servidores-mcp-conectados)
2. [Agentes y Subagentes Especializados](#2-agentes-y-subagentes-especializados)
3. [Skills de Ingeniería Venematic Agency (Locales)](#3-skills-de-ingeniería-venematic-agency)
4. [Skills de Diseño y Frontend Pro-Elite (Emil / Apple / Impeccable)](#4-skills-de-diseño-y-frontend-pro-elite)
5. [Plugins y Suites de Ecosistema Integrados](#5-plugins-y-suites-de-ecosistema-integrados)
6. [Matriz de Uso Rápido por Caso de Uso](#6-matriz-de-uso-rápido-por-tarea)

---

## 1. 🔌 Servidores MCP Conectados

Los servidores MCP proporcionan herramientas nativas que permiten a la IA interactuar con el navegador, bases de datos, código Flutter/Dart y documentación oficial en tiempo real.

| Servidor MCP | Tipo | Herramientas Principales | Función en Venematic |
|---|---|---|---|
| **`playwright`** | Lazy | `browser_navigate`, `browser_click`, `browser_type`, `browser_take_screenshot`, `browser_snapshot`, `browser_wait_for`, `browser_network_requests` | Automatización E2E en navegador web real. Permite probar el POS, validar flujos de venta y auditar interfaces. |
| **`gemini-api-docs`** | Eager | `gemini_search_docs`, `gemini_get_doc` | Consulta en vivo de la documentación oficial de Google Gemini SDK y APIs de IA generativa. |
| **`dart-mcp-server`** | Lazy | `analyze_files`, `hot_reload`, `hot_restart`, `widget_inspector`, `lsp`, `flutter_driver_command`, `pub_dev_search` | Control y análisis de código Flutter/Dart para aplicaciones móviles multiplataforma. |
| **`data-agent-kit`** | Lazy | `get_active_editor_context`, `get_active_gcp_connection`, `read_resource` | Conexión e integración con servicios de datos y contexto activo de edición. |
| **`notebooks`** | Lazy | `create_notebook`, `insert_code_cell`, `get_notebook_info`, `search_cells` | Creación y ejecución de notebooks para análisis de métricas, reportes de ventas y finanzas. |
| **`visualization`** | Lazy | `render_chart` | Generación y renderizado de gráficos estadísticos interactivos. |

---

## 2. 👥 Agentes y Subagentes Especializados

Agentes autónomos configurados para asumir roles específicos de ejecución, auditoría y pruebas:

### 1. `browser_subagent`
* **Capacidad**: Opera una instancia de navegador de forma autónoma con grabación de video WebP.
* **Uso**: Pruebas de integración visual, verificación de flujos de caja y captura de evidencia de UI.

### 2. `flutter_a11y_agent`
* **Capacidad**: Auditor de accesibilidad (a11y), contrastes, navegación asistida por voz y semántica táctil.
* **Uso**: Validar que la interfaz móvil cumpla con estándares para pantallas táctiles industriales.

---

## 3. 🏢 Skills de Ingeniería Venematic Agency

Roles de arquitectura creados específicamente para las particularidades operativas, fiscales y tecnológicas de Venezuela:

| Skill | Archivo / Ubicación | Especialidad y Tareas |
|---|---|---|
| **`agency-payments-billing-engineer`** | `.agents/skills/agency-payments-billing-engineer/` | Pagos multimoneda (USD / Bs), liquidación con tasa oficial BCV, Pago Móvil (validación y webhooks), Zelle, Efectivo con cálculo de vuelto dual, Binance USDT e IGTF. |
| **`agency-database-optimizer`** | `.agents/skills/agency-database-optimizer/` | Rendimiento de SQLite local, IndexedDB / Dexie en navegador, sincronización offline-first, búsqueda ultrarrápida de artículos por código de barras y caché de inventario. |
| **`agency-desktop-app-engineer`** | `.agents/skills/agency-desktop-app-engineer/` | Especialista en empaquetado nativo para Windows/Desktop (Tauri / C# Launcher / Electron), persistencia local sin internet y setup con instalador `.exe`. |
| **`agency-frontend-developer`** | `.agents/skills/agency-frontend-developer/` | Desarrollo React / Next.js de alta velocidad, layouts industriales para pantallas de 15.6" y 1080p, optimización de renderizado y estados de carrito. |
| **`agency-identity-access-engineer`** | `.agents/skills/agency-identity-access-engineer/` | Autenticación de cajeros por PIN rápido, control de supervisores para anulaciones, roles RBAC y candados de seguridad. |
| **`agency-backend-architect`** | `.agents/skills/agency-backend-architect/` | Arquitectura de APIs Next.js, sincronización en segundo plano de ventas locales hacia la nube Firebase/Firestore. |
| **`agency-ui-designer`** | `.agents/skills/agency-ui-designer/` | Especialista en sistema de diseño limpio, tema blanco de alto contraste, ergonomía de touch targets y consistencia de marca. |

---

## 4. 🎨 Skills de Diseño y Frontend Pro-Elite

Técnicas avanzadas de animación, micro-interacciones y ergonomía humana:

* **`impeccable`**: Modo de diseño integral. Audita densidad, contraste, jerarquía visual, eliminación de fricción y pulido extremo de interfaces.
* **`emil-design-eng`**: Filosofía de diseño de Emil Kowalski. Detalles invisibles, animaciones físicas naturales, estados intermedios y transiciones fluidas.
* **`apple-design`**: Principios de diseño de Apple para la web. Manejo de resortes (springs), áreas seguras (safe-area), física de desplazamiento y tipografía con escalado óptico.
* **`mobile-native`**: Optimización de aplicaciones web en teléfonos para que se sientan como aplicaciones 100% nativas (eliminación de delays de tap, rebotes de scroll, viewport con notch/Dynamic Island).
* **`animate`** / **`animate-expo`**: Creación de transiciones de pantalla, apertura de modales, efectos de agregación al carrito y feedback háptico.
* **`animation-vocabulary`**: Glosario para referenciar exactamente el comportamiento dinámico deseado.
* **`find-animation-opportunities`** & **`improve-animations`**: Detección de oportunidades de micro-interacciones (ej. rebote del badge de carrito, confirmación de ticket).
* **`ask-sonner`**: Notificaciones toast modernas, apilables y sin interferencia en pantalla.

---

## 5. 📦 Plugins y Suites de Ecosistema Integrados

| Plugin | Skills Incluidas | Propósito |
|---|---|---|
| **`ponytail`** | `ponytail`, `ponytail-audit`, `ponytail-review`, `ponytail-debt`, `ponytail-gain` | Enfoque de ingeniería pragmática y minimalista: elimina dependencias innecesarias, código sobre-estructurado y mantiene el código directo y rápido. |
| **`graphify`** | Workflow `/graphify`, `graphify update` | Creación y mantenimiento de grafos de conocimiento AST del repositorio para navegación y análisis contextual instantáneo. |
| **`android-cli-plugin`** | `android-cli` | Gestión y compilación de APKs de Android, inspección de dispositivos y herramientas ADB. |
| **`firebase`** | `firebase-firestore`, `firebase-auth-basics`, `firebase-hosting-basics`, `firebase-crashlytics` | Conexión e integración con Firebase Cloud para respaldo y licenciamiento SaaS. |
| **`gemini-api`** | `gemini-api-dev`, `gemini-interactions-api`, `gemini-live-api-dev` | Integración de inteligencia artificial multimodal para escaneo de fotos y reconocimiento de productos. |
| **`google_maps_platform`** | `google-maps-platform` | Mapas, geolocalización de tiendas y rutas de despacho para el marketplace/delivery. |
| **`modern-web-guidance`** | `modern-web-guidance`, `chrome-extensions` | Buenas prácticas actualizadas de CSS moderno (`:has()`, container queries, View Transitions API). |

---

## 6. ⚡ Matriz de Uso Rápido por Tarea

| Si necesitas... | Usa esta combinación |
|---|---|
| **Rediseñar o pulir una pantalla** | Skill `impeccable` + `emil-design-eng` + `agency-ui-designer` |
| **Ajustar la versión móvil / APK** | Skill `mobile-native` + `animate` + `android-cli` |
| **Revisar cobros, BCV o Pago Móvil** | Skill `agency-payments-billing-engineer` |
| **Probar un flujo en navegador en vivo** | Servidor MCP `playwright` + `browser_subagent` |
| **Optimizar SQLite o Dexie IndexedDB** | Skill `agency-database-optimizer` |
| **Simplificar código y quitar sobre-ingeniería** | Plugin `ponytail` (`ponytail-review`) |
| **Mapear la arquitectura del código** | Workflow `/graphify` o regla `graphify` |
