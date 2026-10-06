---
trigger: always_on
description: Directiva estricta e inquebrantable de Cero Regresión Involuntaria, Preservación de Optimizaciones y Blindaje de Características Críticas en KlikPOS.
---

# 🛡️ Directiva Quirúrgica Inviolable: Protocolo de Cero Regresión Involuntaria (Zero Regression Gate)

Este documento es una **DIRECTIVA DE MÁXIMA PRIORIDAD Y CUMPLIMIENTO OBLIGATORIO** para todo agente de IA y desarrollador en el ecosistema KlikPOS. 

Bajo ninguna circunstancia se permitirá que una característica, optimización de hardware o flujo validado en la calle vuelva a ser degradado, sobreescrito o reemplazado por implementaciones primitivas en futuros commits o bumps de versión.

---

## 1. Principio Rector de Preservación de Código Validado

1. **Lo que funciona en la calle es intocable:** Toda optimización probada en condiciones reales (baja memoria RAM, luz solar directa, redes 4G lentas) tiene carácter de **código blindado**.
2. **Prohibición de "Syncs Ciegas" o Copiado Destructivo:** 
   - Queda terminantemente **PROHIBIDO** sobreescribir archivos completos entre directorios (`src/` y `venematic-desktop/`) sin verificar la preservación de las optimizaciones preexistentes.
   - En todo incremento de versión o refactorización, las mejoras anteriores deben mantenerse al 100%.

---

## 2. Puntos Críticos Blindados (Lista de Vigilancia Permanente)

Todo agente debe verificar activamente que las siguientes arquitecturas permanezcan intactas en cada cambio:

### A. Manejo de Cámara y Compresión de Fotos (`ProductImageSelector.tsx`)
- **Prohibido:** Usar `FileReader.readAsDataURL(file)` en archivos crudos de cámara. Causa OOM (Out Of Memory) en Android y mata la app llevándola al menú principal.
- **Obligatorio:** Utilizar siempre `createImageBitmap(file, { resizeWidth: 400, resizeQuality: 'medium' })` para decodificación directa por hardware con uso de RAM < 1.5MB.
- **Obligatorio:** Utilizar `URL.createObjectURL` en fallback y revocarlo siempre con `URL.revokeObjectURL`.
- **Obligatorio:** Persistir el estado del modal y formulario en `sessionStorage` para resistir pausas de actividad del sistema operativo Android.

### B. Ciclo de Vida del Tour y Presentación (`InteractivePresentationModal.tsx` / `tablet-pos/page.tsx`)
- **Obligatorio:** Marcar `localStorage.setItem('klikpos_onboarding_completed', 'true')` en todo cierre (`handleDismiss`), salto o finalización del tour.
- **Prohibido:** Permitir que el tour se dispare repetidamente en cada recarga o reapertura de la app. Solo debe aparecer una vez en la primera instalación o cuando el usuario lo pida manualmente desde el menú lateral.

### C. Contraste Visual de Alto Rendimiento Exterior (`ProductImageSearchModal.tsx`)
- **Obligatorio:** Mantener la caja de texto con fondo blanco puro (`bg-white`), borde de 2px contrastado, texto negro oscuro (`text-slate-950 font-bold`) y placeholder visible bajo luz solar directa.
- **Obligatorio:** Pestañas activas con texto de alto contraste y retroalimentación táctil visible al aire libre.

### D. Búsqueda Web de Imágenes Multifuente (+30 Fotos) (`route.ts` y Modal)
- **Obligatorio:** Extraer 35+ imágenes combinando DuckDuckGo/Google, OpenFoodFacts y Wikimedia en paralelo.
- **Obligatorio:** Timeout generoso (mínimo 8 segundos) para evitar cancelaciones prematuras en conexiones móviles 4G inestables.

---

## 3. Protocolo de Inspección Pre-Commit (Diff Audit Gate)

Antes de ejecutar cualquier `git commit`, `git push` o publicación de versión, el agente o desarrollador DEBE ejecutar:

```bash
git diff --staged
# o
git diff HEAD~1
```

Y verificar obligatoriamente:
1. ¿El diff borró alguna función de compresión por hardware (`createImageBitmap`, `createObjectURL`)? -> **SI ES ASÍ: ABORTAR INMEDIATAMENTE**.
2. ¿El diff eliminó algún guardado en `localStorage` o `sessionStorage`? -> **SI ES ASÍ: ABORTAR INMEDIATAMENTE**.
3. ¿El diff redujo límites de búsqueda o cambió timeouts a valores frágiles? -> **SI ES ASÍ: ABORTAR INMEDIATAMENTE**.
4. ¿El código compila con `npx tsc --noEmit` en exit code 0? -> **SI NO ES 0: PROHIBIDO HACER COMMIT**.

---

## 4. Política de Tolerancia Cero

Si un agente de IA detecta durante una tarea que un commit anterior o un cambio propuesto introduce una regresión sobre estas características:
- Debe **detener el proceso de publicación de inmediato**.
- Debe **restaurar el código robusto validado**.
- Debe **reportar la detección explícita al usuario** antes de continuar.
