# Directivas Obligatorias de Desarrollo - ProcesStudio

Este archivo establece las directivas y reglas permanentes de pair-programming y desarrollo para este proyecto:

## 1. Plan de Ruta Obligatorio (Planning First)
- Ante **CUALQUIER** solicitud de cambio, refactorización, corrección o nueva funcionalidad, el asistente **SIEMPRE debe presentar primero una hoja de ruta o plan de implementación detallado** (`implementation_plan.md`).
- Se debe solicitar y esperar la aprobación explícita del usuario antes de realizar cualquier modificación de archivos o ejecución de cambios.

## 2. Commit y Push Automático tras Cada Cambio (Auto-Push)
- Inmediatamente después de completar y verificar cualquier conjunto de cambios aprobados, se debe realizar:
  1. Compilación/Sincronización del paquete si aplica (`npm run build`).
  2. `git add -A`
  3. `git commit -m "tipo: descripción clara del cambio"` (siguiendo Conventional Commits).
  4. `git push origin <rama-actual>` de forma automática.
- Mantener siempre el repositorio remoto sincronizado con el estado local.

## 3. Arquitectura Portable (Zero-AppData)
- Todo ejecutable, proyecto y dato de sesión se concentra en `MiAppProcesos_USB/`:
  - Ejecutable: `MiAppProcesos_USB/ProcesStudio.exe` (únicamente `.exe`, sin archivos `.bat`).
  - Proyectos: `MiAppProcesos_USB/Proyectos/*.json`.
  - Caché y datos: `MiAppProcesos_USB/data/`.
- Mantener limpia la carpeta raíz del proyecto, dejando solo código fuente, configuración y dependencias.
