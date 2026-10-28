---
trigger: always_on
---

# Reglas y Directivas del Proyecto ProcesStudio

1. **Hoja de Ruta Previa Obligatoria en PLAN_ACCION.md:** Ante toda solicitud de cambio, refactorización o nueva funcionalidad, el asistente DEBE registrar primero la propuesta técnica directamente en el archivo `PLAN_ACCION.md`. Una vez entregadas las observaciones y la aprobación explícita del usuario, se podrá proceder con los desarrollos.
2. **Auto-Push Git:** Tras completar cualquier cambio aprobado y validarlo con el build, SIEMPRE realizar commit y `git push` automáticamente.
3. **Paquete Portable Exclusivo:** Mantener todo lo relacionado a ejecución y proyectos concentrado en `MiAppProcesos_USB/` (ejecutable `.exe` nativo y proyectos en `MiAppProcesos_USB/Proyectos/`).
4. **Registro de Historias de Usuario en Excel (.xlsx):** Todos los desarrollos y novedades deben documentarse en `HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx` con ID (`PST-001`...), Título, Historia de Usuario (*Como... Quiero... Para...*), Criterios de Aceptación, Fecha y Estado.
