---
trigger: always_on
---

# Reglas y Directivas del Proyecto ProcesStudio

1. **Hoja de Ruta Previa Obligatoria:** Ante toda solicitud de cambio, el asistente DEBE presentar primero un plan de implementación detallado (`implementation_plan.md`) y esperar la aprobación del usuario antes de modificar archivos.
2. **Auto-Push Git:** Tras completar cualquier cambio aprobado y validarlo con el build, SIEMPRE realizar commit y `git push` automáticamente.
3. **Paquete Portable Exclusivo:** Mantener todo lo relacionado a ejecución y proyectos concentrado en `MiAppProcesos_USB/` (ejecutable `.exe` nativo y proyectos en `MiAppProcesos_USB/Proyectos/`).
4. **Registro de Historias de Usuario en Excel (.xlsx):** Todos los desarrollos y novedades deben documentarse en `HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx` con ID (`PST-001`...), Título, Historia de Usuario (*Como... Quiero... Para...*), Criterios de Aceptación, Fecha y Estado.
