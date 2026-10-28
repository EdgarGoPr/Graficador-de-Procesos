# Directivas Obligatorias de Desarrollo - ProcesStudio

Este archivo establece las directivas y reglas permanentes de pair-programming y desarrollo para este proyecto:

## 1. Plan de Ruta Obligatorio en PLAN_ACCION.md (Planning First)
- Ante **CUALQUIER** solicitud de cambio, refactorización, corrección o nueva funcionalidad, el asistente **SIEMPRE debe registrar primero la propuesta y hoja de ruta técnica directamente en el archivo `PLAN_ACCION.md`**.
- El asistente **NO debe proceder** con ningún desarrollo, modificación de código o ejecución hasta que el usuario haya revisado el documento, entregado sus observaciones y brindado su aprobación explícita.

## 2. Commit y Push Automático tras Cada Cambio (Auto-Push)
- Inmediatamente después de completar y verificar cualquier conjunto de cambios aprobados, se debe realizar:
  1. Compilación/Sincronización del paquete y actualización de historias de usuario (`npm run build`).
  2. `git add -A`
  3. `git commit -m "tipo: descripción clara del cambio"` (siguiendo Conventional Commits).
  4. `git push origin <rama-actual>` de forma automática.
- Mantener siempre el repositorio remoto sincronizado con el estado local.

## 3. Arquitectura Portable (Zero-AppData)
- Todo ejecutable, proyecto y dato de sesión se concentra en `MiAppProcesos_USB/`:
  - Ejecutable: `MiAppProcesos_USB/ProcesStudio.exe` (únicamente `.exe`, sin archivos `.bat`).
  - Proyectos: `MiAppProcesos_USB/Proyectos/*.json`.
  - Caché y datos: `MiAppProcesos_USB/data/`.
  - Documentación e Historias de Usuario: `MiAppProcesos_USB/HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx`.
- Mantener limpia la carpeta raíz del proyecto, dejando solo código fuente, configuración y dependencias.

## 4. Registro de Historias de Usuario en Excel (.xlsx)
- Todos los cambios, desarrollos y novedades deben registrarse y mantenerse actualizados en el archivo **`HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx`** (y su copia en `MiAppProcesos_USB/`).
- Cada registro debe estructurarse con:
  - **ID:** Nomenclatura correlativa `PST-001`, `PST-002`...
  - **Módulo / Componente:** Área funcional correspondiente.
  - **Título:** Resumen del desarrollo.
  - **Historia de Usuario:** Formato canónico *"Como [rol], quiero [acción] para [beneficio]"*.
  - **Criterios de Aceptación:** Lista de condiciones verificables.
  - **Fecha de Implementación:** Formato `AAAA-MM-DD`.
  - **Estado:** Estado del requerimiento (`Implementado / Producción`).
