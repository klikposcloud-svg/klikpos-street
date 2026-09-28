---
trigger: always_on
description: Normas estrictas e inquebrantables de ingeniería visual, prevención de regresiones, ergonomía POS y sincronización continua en KlikPOS.
---

## KlikPOS Strict Engineering & Zero-Regression Standards

Todos los agentes de inteligencia artificial y desarrolladores que operen en este repositorio deben cumplir estricta e incondicionalmente las siguientes reglas de calidad para erradicar retrabajos y regresiones:

### 1. Prohibición Absoluta de Selectores CSS Destructivos (Tailwind Safe)
- **NUNCA** utilizar selectores CSS de coincidencia parcial o comodín para colores o fuentes, tales como `[class*="text-white"]` o `[class*="text-..."]`.
- **Causa del fallo previo:** En Tailwind CSS, los prefijos como `dark:text-white` o `hover:dark:text-white` contienen la subcadena `"text-white"`. El selector `[class*="text-white"]` aplicaba `-webkit-text-fill-color: #ffffff !important` a todos esos elementos incluso en Modo Claro, volviendo invisibles los números del teclado, fórmulas y precios sobre fondos blancos.
- **Forma correcta:** Usar únicamente clases directas (`.text-white`) o selectores de palabra aislada delimitada por espacios (`[class~="text-white"]`).

### 2. Contraste Visual Obligatorio (WCAG AAA >= 7:1)
- Todo elemento crítico de operación de caja en Modo Claro (**Teclado Numérico del POS**, **Balanza de mostrador**, **Tasa BCV**, **Reloj del sistema**, **Precios en Bs. y USD**, y **Enlaces del Menú Lateral**) debe renderizarse con texto oscuro profundo (`#0f172a` / slate-900).
- Queda terminantemente prohibido dejar textos en tonos grises claros o blancos sobre fondos claros (`bg-slate-100`, `bg-white`). Ante cualquier duda, aplicar estilos inline protectores (`style={{ color: '#0f172a' }}`) en las teclas y cifras numéricas.

### 3. Ergonomía de Pantalla POS (Máximo 4 Columnas)
- El catálogo de productos en el Punto de Venta **nunca debe exceder 4 columnas por fila** en escritorio (`grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4`).
- **Nombres legibles:** Los títulos de los productos deben tener espacio para 2 líneas completas (`line-clamp-2 min-h-[36px]`) para evitar que se corten con elipsis prematuras (`"Hamburgue..."`, `"Pizza Famili..."`).
- **Accesos directos:** Las tarjetas del carrusel superior deben mantener un ancho mínimo ergonómico de 270px a 300px.

### 4. Compilación Completa Pre-Empaquetado (No Builds Obsoletos)
- Al generar ejecutables o instaladores para Windows (`build-installer-full.ps1` o Inno Setup), es **obligatorio ejecutar previamente `npm run build`**.
- Ningún instalador debe generarse reutilizando carpetas `.next/standalone` viejas sin previa compilación fresca y validación de tipos/sintaxis.

### 5. Sincronización Continua con GitHub y Protocolo Anti-Falla de Actualizador
- Cada vez que se finalice un bloque de mejoras o correcciones en el software, el agente debe ejecutar de inmediato:
  1. `git add -A`
  2. `git commit -m "..."` con mensaje semántico claro.
  3. `git push origin main` hacia el repositorio remoto `github.com/klikposcloud-svg/klikpos.git`.
- **Protocolo de Auto-Actualizaciones (Zero-Regression):**
  - **Fuente Única de Verdad:** Toda modificación de versión se define en `version.json` raíz y se sincroniza obligatoriamente mediante `node scripts/sync-version.js` a todos los manifiestos (`public/version.json`, `dist-installer/version.json`, `klikpos-releases/version.json`, `venematic-desktop/version.json`, `package.json` e `installer.iss`).
  - **Prohibido Forzar Descargas Manuales:** Las actualizaciones en PC/Desktop y Web deben ejecutarse de forma **automática en 1 solo clic o en segundo plano silencioso** (`/api/system/update` o `applyPwaUpdate`). La opción de descarga manual `.exe` es estrictamente secundaria para respaldos offline o pendrives USB.
  - **Publicación Obligatoria en la Nube:** Al generar un instalador con `build-installer-full.ps1`, el pipeline debe obligatoriamente:
    1. Pushear `version.json` al repositorio `klikposcloud-svg/klikpos-releases.git`.
    2. Publicar la Release y subir los binarios mediante `node scripts/publish-release-to-github.js`.
    3. Validar con llamada HTTP activa que `https://raw.githubusercontent.com/klikposcloud-svg/klikpos-releases/main/version.json` responde la nueva versión.
  - **Prevención de Bucles de Recarga:** Nunca hardcodear `CURRENT_VERSION` en `update-service.ts`. La versión debe importarse dinámicamente de `version.json` y persistirse en `localStorage` (`klikpos_applied_pwa_version`) para evitar recargas infinitas.

### 6. Carpeta Oficial Obligatoria de Distribución (DISTRIBUCION_KLIKPOS)
- Toda entrega de software, instaladores para el cliente, combos para puntos de venta y APKs móviles se ubican y entregan **ESTRICTAMENTE** en la carpeta: `DISTRIBUCION_KLIKPOS/`.
- El instalador principal oficial para el usuario es:
  - `DISTRIBUCION_KLIKPOS/02_Combo_Empresarial_Full/INSTALAR_KLIKPOS_FULL.bat`
  - `DISTRIBUCION_KLIKPOS/02_Combo_Empresarial_Full/KlikPOS_Desktop_Full_Setup.exe`
- Queda terminantemente prohibido indicar al usuario carpetas intermedias de compilación técnica (como `dist-installer/` o `venematic-desktop/`). Toda referencia debe ser siempre dentro de `DISTRIBUCION_KLIKPOS/`.

