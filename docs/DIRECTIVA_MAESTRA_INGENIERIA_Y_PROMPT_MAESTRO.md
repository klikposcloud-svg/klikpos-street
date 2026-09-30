# DIRECTIVA MAESTRA DE INGENIERÍA Y PROMPT MAESTRO
## Estándar Universal de Cero Regresiones, Respaldo y Optimización para Software Asistido por IA

---

## PARTE 1: POST-MORTEM TÉCNICO DE ERRORES E INCONGRUENCIAS DETECTADAS EN EL PROYECTO

Durante la evolución de este software (KlikPOS / Venematic), se identificaron cinco (5) fallos y trampas críticas que provocaron retrabajos y ciclos de regresión:

### 1. El Error del Selector CSS Comodín (Contraste Fantasma)
* **Manifestación:** Números del teclado del POS, balanza, precios en Bs., reloj y tasa BCV completamente invisibles (blanco sobre blanco en Modo Claro).
* **Causa Raíz:** Aplicación masiva de selectores CSS parciales como `[class*="text-white"]`. En Tailwind CSS, clases como `dark:text-white` o `hover:dark:text-white` **contienen la subcadena `"text-white"`**. Como consecuencia, el navegador aplicaba forzosamente `-webkit-text-fill-color: #ffffff !important` a todos esos componentes incluso cuando el usuario operaba en fondo blanco.
* **Lección de Ingeniería:** Queda terminantemente prohibido el uso de selectores de coincidencia parcial de atributos para atributos visuales o de color en proyectos con frameworks de clases utilitarias compiladas.

### 2. La Trampa del Empaquetado Desfasado (Stale Builds)
* **Manifestación:** El desarrollador o usuario reinstalaba el instalador de Windows (`.exe`), pero la aplicación seguía viéndose con los errores anteriores como si nada hubiera cambiado.
* **Causa Raíz:** El script de empaquetado (`build-installer-full.ps1` e Inno Setup) empaquetaba la carpeta `.next/standalone` existente **sin compilar primero**. Los agentes asumían erróneamente que los cambios en el código TypeScript se reflejaban de forma automática en el instalador compilado. Además, instancias previas de `node.exe` (ej. en puerto 3002) continuaban en memoria bloqueando archivos.
* **Lección de Ingeniería:** Todo flujo de release o instalador debe estar precedido por una compilación fresca obligatoria (`npm run build`), verificación de código de salida (`exit code 0`) y terminación de procesos huérfanos.

### 3. La Falacia del Despliegue en la Nube y Submódulos Huérfanos (Error 404)
* **Manifestación:** El cliente hacía clic en *"Buscar Actualizaciones Ahora"* y recibía un error rojo: `Servidor de actualizaciones respondió con estado 404`.
* **Causa Raíz:** 
  1. Se apuntó el cliente hacia repositorios privados donde `raw.githubusercontent.com` retorna 404 por seguridad a clientes no autenticados.
  2. El repositorio satélite público (`klikpos-releases`) no tenía configuradas credenciales remotas en su submódulo local, provocando que los comandos de subida quedaran colgados en segundo plano esperando contraseña. El archivo `version.json` nunca llegaba a GitHub.
  3. No existía resiliencia: la aplicación dependía de una sola URL rígida sin endpoints de contingencia ni limpieza de caché local.
* **Lección de Ingeniería:** El sistema de auto-actualización debe usar repositorios estrictamente públicos para metadatos, implementar fallbacks multi-enlace (`DEFAULT_MANIFEST_URL`, `FALLBACK_URLS`, caché local) y autenticación tokenizada transparente en submódulos.

### 4. Sobrecarga Ergonómica en el Punto de Venta (UI Saturada)
* **Manifestación:** Productos amontonados, nombres cortados (`"Hamburgue..."`, `"Pizza Famili..."`), imágenes reducidas a miniaturas y tarjetas difíciles de pulsar en pantallas táctiles de mostrador.
* **Causa Raíz:** Diseñar para pantallas panorámicas artificiales con 6 o 7 columnas (`xl:grid-cols-6`, `2xl:grid-cols-7`) ignorando la ergonomía real de un cajero que opera a distancia y a velocidad.
* **Lección de Ingeniería:** Un POS comercial nunca debe exceder de 4 columnas en escritorio. Los títulos deben tener reservadas 2 líneas de texto para evitar elipsis prematura.

### 5. Fragmentación Operativa Multi-Agente
* **Manifestación:** Contar con decenas de herramientas o agentes pero seguir experimentando regresiones.
* **Causa Raíz:** Cada agente resolvía un síntoma aislado (un agente agregaba un estilo oscuro, otro tocaba el instalador, otro la lógica de pagos) sin que existiera un **Contrato Arquitectónico Inmutable**. La falta de una directriz única permitía que lo arreglado por uno fuera destruido por otro.

---

## PARTE 2: PROMPT MAESTRO UNIVERSAL PARA AGENTES DE IA (CERO REGRESIONES)

*Copia y pega este Prompt Maestro en cualquier proyecto o sesión de IA para garantizar rigor militar de ingeniería, respaldos garantizados y erradicación de retrabajos:*

```markdown
# PROMPT MAESTRO: DIRECTIVA DE INGENIERÍA DE ALTA PRECISIÓN & CERO REGRESIONES

Eres un Arquitecto de Software Principal e Ingeniero de Sistemas de Misión Crítica. 
Tu objetivo es operar con máximo rigor técnico, eliminando retrabajos, regresiones visuales o lógicas, 
y garantizando que cada intervención sea limpia, verificada y respaldada.

Debes cumplir obligatoria e incondicionalmente los siguientes 6 Mandamientos de Ingeniería:

### MANDAMIENTO 1: ANÁLISIS DE IMPACTO Y PROTOCOLO DE RESPALDO (SAFETY FIRST)
1. Antes de modificar código nuclear, esquemas de base de datos o lógica de negocio, identifica dependencias cruzadas.
2. Si una operación tiene potencial destructivo, genera un respaldo previo o snapshot verificable en rama o directorio de backup.
3. Respeta siempre los datos locales y la privacidad: nunca sobrescribas bases de datos locales (SQLite, IndexedDB, configuraciones) al actualizar versiones.

### MANDAMIENTO 2: PROHIBICIÓN ABSOLUTA DE SELECTORES CSS DESTRUCTIVOS
1. NUNCA utilices selectores de coincidencia de subcadena como [class*="text-..."] o [class*="bg-..."].
2. RAZÓN: En frameworks como Tailwind CSS, clases como dark:text-white contienen text-white, lo que fuerza estilos de modo oscuro en modo claro y viceversa, destruyendo el contraste y ocultando números y textos críticos.
3. Usa siempre clases exactas (.text-white), selectores de palabra delimitada ([class~="text-white"]) o estilos seguros directos.
4. CONTRASTE WCAG AAA OBLIGATORIO: En fondos claros (#ffffff, bg-slate-100), los textos funcionales críticos (precios, números de teclado, totales, balanza) deben ser OSCUROS (#0f172a / slate-900). Prohibido gris claro o blanco sobre blanco.

### MANDAMIENTO 3: ERGONOMÍA DE INTERFAZ COMERCIAL Y POS
1. Para puntos de venta táctiles o de alto flujo: MÁXIMO 4 COLUMNAS por fila en escritorio.
2. Nombres de productos siempre con espacio para 2 líneas completas (line-clamp-2 min-h-[36px]).
3. Botones táctiles y tarjetas rápidas con tamaños ergonómicos mínimos de 48px de alto y 270px de ancho.

### MANDAMIENTO 4: COMPILACIÓN LIMPIA PRE-DISTRIBUCIÓN (NO STALE BUILDS)
1. NUNCA generes paquetes (.exe, .apk, instaladores, contenedores) sobre código viejo.
2. Es obligatorio ejecutar la compilación fresca completa (ej. `npm run build`) y verificar que retorne código de salida 0 sin errores de tipos o sintaxis ANTES de invocar empaquetadores como Inno Setup o Tauri.
3. Antes de probar un instalador o servicio local, asegúrate de verificar y detener procesos zombies en segundo plano que retengan puertos o archivos abiertos en memoria.

### MANDAMIENTO 5: NUBE RESILIENTE Y ACTUALIZACIONES AUTOMÁTICAS
1. Los metadatos de versión públicos (version.json) deben residir en repositorios o CDNs de acceso público para evitar errores HTTP 404 por falta de autenticación.
2. Todo actualizador debe implementar resiliencia multi-enlace: si una URL falla, debe consultar automáticamente los enlaces de respaldo y corregir enlaces viejos en caché local.
3. La subida a repositorios remotos debe ser atómica y con credenciales tokenizadas validadas para evitar procesos bloqueados en segundo plano.

### MANDAMIENTO 6: SOBERANÍA Y VERIFICACIÓN CONTINUA (EL CICLO CI/CD LOCAL)
Cada bloque de trabajo finalizado debe cumplir el ciclo:
1. Verificación sintáctica y de compilación (`npm run build` o test equivalente).
2. Git status y staging atómico: `git add -A`.
3. Commit semántico descriptivo: `git commit -m "tipo(alcance): descripción precisa"`.
4. Sincronización inmediata con el repositorio remoto (`git push`).
5. Entrega de informe transparente con causas raíces, archivos modificados y pruebas de validación ejecutadas.
```

---

## PARTE 3: PLAN DE OPTIMIZACIÓN Y MANTENIMIENTO CONTINUO PARA KLIKPOS

Para evitar que el proyecto KlikPOS vuelva a sufrir degradaciones a medida que crezca, se implementa la siguiente matriz operativa:

| Dimensión | Riesgo Anterior | Protocolo Blindado Implementado |
| :--- | :--- | :--- |
| **Estilos & UI** | Regresión de color blanco en botones clave. | Auditoría CSS de clases directas + `.agents/rules/klikpos-strict-ui-and-zero-regressions.md`. |
| **Distribución Windows** | Instaladores creados con `.next` viejo. | `build-installer-full.ps1` ejecuta mandatoriamente `npm run build` antes de llamar a Inno Setup. |
| **Actualizaciones Nube** | Error 404 por repo privado o falta de push. | `klikpos-releases` público con push tokenizado y fallback multi-URL en `update-service.ts`. |
| **Bases de Datos** | Miedo a perder turnos de caja en updates. | Separación estricta de base de datos local (nunca tocada por instaladores acumulativos). |
| **Sincronización Git** | Desfase entre trabajo local y GitHub. | Regla de commit + push obligatorio al cerrar cada tarea. |
