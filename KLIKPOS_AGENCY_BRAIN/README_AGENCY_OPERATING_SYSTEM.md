# 🧠 KLIKPOS & KLIKO AGENCY MASTER OPERATING SYSTEM
> Manual Centralizado de Agentes Especialistas, Skills de Ingeniería, Reglas de Arquitectura y Playbooks de Desarrollo.

---

## 📂 Directorio Centralizado
Todos los módulos y habilidades de este sistema residen físicamente en:
`D:\Kliko\KLIKPOS_AGENCY_BRAIN\skills\`

---

## 🏛️ Catálogo de Agentes Especialistas y Skills

| Agente / Skill | Dominio de Especialidad | Rol en KlikPOS & Kliko |
| :--- | :--- | :--- |
| **`anti-frankenstein-architect`** | Arquitectura y Modularidad | Guardián supremo. Prohíbe componentes de más de 400 líneas, elimina duplicación de código y separa lógica de UI. |
| **`agency-ui-designer`** | Diseño y Sistemas Visuales | Diseña interfaces Obsidian Dark Grafito y Blanco con acentos Grafito, cuidando contrastes y jerarquía. |
| **`impeccable`** | UX de Alto Nivel Mundial | Pule micro-interacciones, tipografía, estados táctiles, sombras y animaciones sutiles. |
| **`agency-frontend-developer`** | Frontend e Integración React | Implementación en React 19, Next.js, Vite, WebSockets y estado reactivo. |
| **`agency-backend-architect`** | APIs y Microservicios | Conexión cloud-local, webhooks de pedidos de delivery y sincronización de catálogos. |
| **`agency-database-optimizer`** | Bases de Datos y Caching | Rendimiento en Dexie.js (IndexedDB local), SQLite y optimización de lecturas Firestore. |
| **`agency-desktop-app-engineer`** | Empaquetado Nativo | Compilación de instaladores Windows (Inno Setup) y APKs Android con evasión Play Protect. |
| **`agency-identity-access-engineer`** | Seguridad y RBAC | Control de roles (Admin, Merchant, Rider, Cliente), PINs de supervisor y autenticación. |
| **`agency-payments-billing-engineer`** | Finanzas y Tokenomics | Pasarelas bimonetarias (Bs. BCV, Pago Móvil, Zelle) y contabilidad interna de K-Tokens. |
| **`firestore_rules_creation`** | Ciberseguridad Cloud | Diseño de reglas Firestore herméticas que bloquean transacciones no auditadas. |
| **`react-doctor`** | Auditoría y Triage | Detección de fugas de memoria, optimización de renderizados y accesibilidad. |
| **`ponytail`** | Eficiencia y Anti-Overengineering | Regla YAGNI: la solución más simple, rápida y sin dependencias innecesarias. |
| **`accidental-data-loss-prevention`** | Prevención de Desastres | Bloqueo estricto de borrados masivos o sobreescritura accidental de bases de datos. |

---

## 🛡️ Las 5 Leyes Inviolables de Desarrollo (Anti-Frankenstein Protocol)
1. **Regla de las 400 Líneas:** Ningún archivo de interfaz puede superar las 400 líneas de código. Modales, tablas y docks deben residir en archivos atómicos independientes.
2. **Fuente Única de Verdad:** Nunca mantener carpetas duplicadas (cero código espejo). Los scripts de empaquetado consumen los mismos componentes.
3. **Storage Centralizado:** Prohibido invocar `localStorage` o Firebase directo desde componentes visuales; todo pasa por repositorios tipados.
4. **Lógica Pura Aislada:** Cálculos matemáticos, conversiones de tasa BCV y máquina de estados viven en funciones puras TypeScript en `/packages/domain-core`.
5. **Seguridad Cero Fugas:** Cero llaves maestras en texto plano en el repositorio del cliente.

---

## 🪙 Guía de Tokenomics K-Tokens (Kliko Ledger)
* **1 K-Token = 1 USD de poder adquisitivo indexado a tasa oficial BCV.**
* **Circuito Cerrado Legal:** No requiere licencia de intermediación bancaria al operar como valor almacenado de lealtad (Closed-Loop Stored Value).
* **K-Crédito:** Financiamiento directo emitido por el comercio afiliado respaldado por la confianza del punto de venta KlikPOS.
