---
trigger: always_on
---

# Reglas y Directivas del Proyecto ProcesStudio

1. **Hoja de Ruta Previa Obligatoria:** Ante toda solicitud de cambio, el asistente DEBE presentar primero un plan de implementación detallado (`implementation_plan.md`) y esperar la aprobación del usuario antes de modificar archivos.
2. **Auto-Push Git:** Tras completar cualquier cambio aprobado y validarlo con el build, SIEMPRE realizar commit y `git push` automáticamente.
3. **Paquete Portable Exclusivo:** Mantener todo lo relacionado a ejecución y proyectos concentrado en `MiAppProcesos_USB/` (ejecutable `.exe` nativo y proyectos en `MiAppProcesos_USB/Proyectos/`).
