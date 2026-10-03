---
trigger: always_on
description: Protocolo quirúrgico inquebrantable de publicación de versiones, GitHub Releases, manifiestos OTA y sincronización de binarios móviles y desktop para KlikPOS.
---

# 🚀 Protocolo Quirúrgico Inquebrantable de Publicación y Distribución OTA KlikPOS

Este documento es una **DIRECTIVA DE OBLIGATORIO CUMPLIMIENTO** para todo agente de IA y desarrollador. Ninguna versión o release comercial de KlikPOS puede considerarse finalizada ni "lista para la calle" sin haber cumplido el 100% de esta cadena quirúrgica de verificación.

---

## 1. El Principio Rector de Distribución OTA (Over-The-Air)

### A. La Trampa de los Git Tags
- Hacer `git tag vX.Y.Z` y `git push` **NO actualiza las aplicaciones en los clientes**.
- Los clientes (POS Desktop, Tablet y Móvil Android) consultan dos canales oficiales en este orden:
  1. **GitHub Releases API:** `https://api.github.com/repos/klikposcloud-svg/klikpos-releases/releases/latest`
  2. **Raw Manifest:** `https://raw.githubusercontent.com/klikposcloud-svg/klikpos-releases/main/version.json`
- Si no se publica el **objeto formal de GitHub Release** en el repositorio `klikpos-releases`, la API de GitHub continuará respondiendo con la versión anterior y ningún cliente en la calle detectará la actualización.

---

## 2. Los 3 Repositorios Obligatorios de la Cadena

Toda publicación de versión involucra a los 3 repositorios oficiales:

| Repositorio | Función | Acción Requerida |
| :--- | :--- | :--- |
| **`klikpos` (origin)** | Código fuente unificado Next.js, Desktop, PWA y Studio. | `git commit` + `git push origin main` |
| **`klikpos-street` (street)** | Canal oficial de distribución comercial de calle. | `git push street main` |
| **`klikpos-releases` (releases)** | Repositorio de manifiestos, tags y hosting de binarios (APK/EXE). | `version.json` en `main` + GitHub Release API + Subida de Assets |

---

## 3. Checklist Quirúrgico Obligatorio en Todo Incremento de Versión

Antes de confirmar al usuario que una versión está disponible para actualizar:

### Paso 1: Sincronización de Manifiestos Locales
Ejecutar `node scripts/sync-version.js [nueva_versión]` para propagar la versión en:
- `package.json`
- `version.json`
- `venematic-desktop/package.json`
- `venematic-desktop/version.json`
- `src/lib/services/update-service.ts`

### Paso 2: Validación de Integridad (Cero Errores)
- Ejecutar `npx tsc --noEmit` y verificar `exit code 0`.
- Prohibido hacer push o crear releases con errores de tipado o módulos rotos.

### Paso 3: Publicación en Repositorios de Código
- Commit atómico: `git commit -m "release: bump to vX.Y.Z"`
- Push doble: `git push origin main` y `git push street main`.

### Paso 4: Publicación en `klikpos-releases` (Manifiesto Nube)
- El archivo `version.json` debe sincronizarse y commitearse en la rama `main` de `klikposcloud-svg/klikpos-releases`.
- El tag `vX.Y.Z` debe apuntar al commit que contiene el `version.json` actualizado.

### Paso 5: Creación del Objeto Oficial "GitHub Release"
- Se debe invocar la API de GitHub (`POST /repos/klikposcloud-svg/klikpos-releases/releases`) con el token de despliegue:
  ```json
  {
    "tag_name": "vX.Y.Z",
    "target_commitish": "main",
    "name": "KlikPOS Suite vX.Y.Z - [Título]",
    "body": "• Notas de la versión...",
    "draft": false,
    "prerelease": false
  }
  ```

### Paso 6: Subida de Binarios Oficiales (Assets)
Toda Release debe tener adjuntos como mínimo los siguientes binarios:
- `KlikPOS_Street.apk` (Instalador Android Street)
- `KlikPOS_Movil_Full.apk` (Instalador Android Autónomo)
- `KlikPOS_Desktop_Full_Setup.exe` (Instalador Windows)

### Paso 7: Prueba de Humo en Vivo (Verificación Automática)
El agente debe ejecutar una prueba HTTP real contra la API de GitHub:
```javascript
const res = await fetch('https://api.github.com/repos/klikposcloud-svg/klikpos-releases/releases/latest');
const data = await res.json();
// La prueba PASA solo si: data.tag_name === 'vX.Y.Z' y data.assets.length >= 2
```
Si la respuesta no coincide o los assets faltan, **la tarea NO se considera terminada** y se debe corregir de inmediato antes de responder al usuario.

---

## 4. Política de Prohibición

- ❌ **PROHIBIDO** responder "ya está actualizada en release" basándose solo en un `git commit` local.
- ❌ **PROHIBIDO** asumir que `raw.githubusercontent.com` se actualiza al instante (tiene TTL de 5 minutos; la fuente en tiempo real es la GitHub API).
- ❌ **PROHIBIDO** omitir la subida de los archivos `.apk` y `.exe` correspondientes a la nueva versión.
- ❌ **PROHIBIDO** usar saludos o textos informales no acordados (ej. "pana") en las notas de versión ni en los mensajes de WhatsApp generados por el sistema.
