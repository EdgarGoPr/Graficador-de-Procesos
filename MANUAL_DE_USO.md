# MANUAL DE USO Y GUÍA TÉCNICA INTEGRAL
## ProcesosStudio Portable — BPMN 2.0 (ISO 19510) & ISO 9001:2015
**Versión del Manual:** 2.6 &bull; **Fecha de Emisión:** 2026-09-01 &bull; **Entorno:** Portable Windows Desktop (`.EXE`) / Web

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL SISTEMA

**ProcesosStudio Portable** es una plataforma profesional concebida para el modelado, análisis, optimización, personalización cromática y documentación formal de procedimientos administrativos y flujos operativos institucionales. Integra de manera nativa:

1. **Notación BPMN 2.0 (ISO/IEC 19510:2013)**: Diagramación formal de procesos, compresión y descompresión bidireccional de Subprocesos y Macroprocesos, redimensionamiento libre y proporcional de tarjetas.
2. **Compresión y Descompresión Bidireccional de Subprocesos**:
   * **Compresión (Encapsular):** Permite seleccionar múltiples tarjetas y comprimirlas en un único Subproceso con título personalizado, validando la regla BPMN de **una sola entrada y una sola salida**.
   * **Descompresión (Desagrupar):** Permite presionar *"Descomprimir en el Lienzo"* para volver a desplegar todas las etapas individuales secuenciadas en el macroproceso.
3. **Portapapeles Integral de Procesos (`Ctrl + C` / `Ctrl + V`)**: Copiado y pegado de tarjetas individuales, selecciones múltiples y Subprocesos completos con todas sus tareas internas.
4. **Persistencia Total y Autoguardado en Segundo Plano**: Disposiciones espaciales `(X, Y)`, dimensiones, colores de tarjetas y conexiones guardados en tiempo real en los archivos JSON de `../Proyectos/`.
5. **Personalización Cromática Integral y Herencia de Temáticas**: Fondos de pizarra personalizables sin bloqueos blancos y catálogo de temáticas Antigravity IDE.

### 💾 Arquitectura Portable USB (Zero-AppData & Zero-Registry)
* **Ejecutable Directo (`ProcesosStudio.exe`)**: Inicia la aplicación con un solo clic.
* **Persistencia Abierta en JSON**: Cada proyecto se guarda como un archivo de texto estructurado en la subcarpeta `../Proyectos/`.
* **Portabilidad Total**: Funciona en cualquier pendrive o PC con Windows 10/11 sin instalaciones ni permisos de administrador.

---

## 2. COMPRESIÓN, DESCOMPRESIÓN Y COPIADO DE PROCESOS

### 2.1. Compresión de Actividades en un Subproceso (Agrupar)
1. **Selección Múltiple:** Arrastre un recuadro de selección sobre las tarjetas deseadas o mantenga presionado `Shift` y haga clic en cada nodo.
2. **Barra de Acciones Flotante:** Aparecerá el botón **`📦 Comprimir en Subproceso`**.
3. **Validación BPMN 2.0 (Entrada y Salida Única):** El sistema verificará que el conjunto seleccionado tenga una sola flecha entrante desde el exterior y una sola flecha saliente hacia el exterior. Si existen múltiples ramificaciones externas, el sistema le indicará cómo regularizar el flujo.
4. **Creación del Subproceso:** Ingrese el Título y Código del Subproceso. Las actividades se retirarán del macroproceso y se guardarán ordenadas como etapas internas (`subProcessSteps`), reconectando automáticamente las flechas exteriores al nuevo nodo.

---

### 2.2. Visualización y Descompresión en el Lienzo (Desagrupar)
* **Modo Ampliación (`Ampliar ↗`):** Permite ver y editar la lista secuencial de tareas internas del subproceso con sus roles, sistemas y tiempos sin desarmar el mapa general.
* **Descompresión en el Lienzo (`📂 Descomprimir`):** Al hacer clic en el botón de descompresión (disponible en la tarjeta del subproceso, en el panel lateral o en el modal de detalle), el sistema:
  1. Extrae todas las etapas internas.
  2. Genera nuevamente las tarjetas individuales en el carril.
  3. Reconstruye automáticamente las conexiones secuenciales entre ellas (`Paso 1 -> Paso 2 -> Paso 3...`).
  4. Reconecta la flecha entrante al primer paso y la saliente al último paso.
  5. Elimina la tarjeta contenedora del subproceso.

---

### 2.3. Copiar y Pegar Nodos y Subprocesos (`Ctrl + C` / `Ctrl + V`)
* **Atajos de Teclado:** Seleccione uno o varios nodos y presione `Ctrl + C` para copiar y `Ctrl + V` para pegar.
* **Preservación Integral:** Al copiar un Subproceso, se duplican todas sus etapas internas, roles y sistemas informáticos asociados, asignando nuevos identificadores correlativos.
* **Conexiones Internas:** Si copia un grupo de actividades interconectadas, las flechas internas entre ellas se duplican conservando su disposición relativa.

---

## 3. GLOSARIO DE COMPONENTES BPMN 2.0 (ISO 19510)

| Símbolo | Nombre Técnico | Color Base | Significado y Aplicación en el Proceso |
| :--- | :--- | :--- | :--- |
| 🟢 | **Evento de Inicio (Start Event)** | `#10B981` | Disparador formal que da comienzo al procedimiento (ej: *Recepción de Acta*). |
| 🔵 | **Tarea de Usuario (User Task)** | `#3B82F6` | Tarea operativa realizada por un operador asistido por software. |
| 🔵 | **Tarea de Servicio (Service Task)** | `#3B82F6` | Proceso automatizado ejecutado íntegramente por un software. |
| 🟡 | **Tarea Manual (Manual Task)** | `#F59E0B` | Actividad física o de inspección en campo sin intervención de software. |
| 🟡 | **Compuerta Exclusiva (Exclusive Gateway - XOR)** | `#F59E0B` | Bifurcación condicional donde el flujo toma una única rama. |
| 🟡 | **Compuerta Paralela (Parallel Gateway - AND)** | `#F59E0B` | Bifurcación simultánea donde se inician múltiples tareas concurrentes. |
| 🔵 | **Subproceso (Sub-Process)** | `#3B82F6` | **Actividad compuesta que encapsula un procedimiento secundario.** Permite compresión y descompresión bidireccional. |
| 🟡 | **Evento de Temporización (Timer Event)** | `#F59E0B` | Límite temporal reglamentario que fija plazos perentorios (ISO 8601). |
| 🟢 | **Punto de Control de Calidad (Quality Checkpoint QC)** | `#10B981` | Hito de verificación formal bajo norma ISO 9001 con evidencia obligatoria. |
| 🔴 | **Evento de Fin (End Event)** | `#EF4444` | Culminación o estado terminal del flujo (ej: *Expediente Archivado*). |
| ➖ | **Flujo de Secuencia (Sequence Flow)** | Configurable | Flecha direccional con soporte para etiquetas, colores, grosores y animación. |
| 🏊 | **Carriles (Swimlanes) y Pools** | Adaptable | Bandas horizontales que representan unidades funcionales y sistemas TI. |

---

## 4. TUTORIAL PRÁCTICO: COMPRESIÓN, MODELADO Y COPIADO

### 🏢 Caso de Estudio: *"Procedimiento Sancionatorio por Obras Clandestinas"* (Código: `PRC-OBR-001`)

```
[ INI-01: Acta de Infracción ]
              │
              ▼
[ ACT-01: Cotejo Catastral ] (Sistema SAM)
              │
              ▼
[ QC-01: Verificación de Firma y Plano ] (Inspección ISO 9001)
              │
              ▼
[ ACT-02: Emplazamiento Legal ] ──> [ TMR-01: Plazo 5 Días ] ──> [ DEC-01: ¿Subsanación? ]
                                                                        │
                                       ┌────────────────────────────────┴────────────────────────────────┐
                                       ▼ (Rama A: Regulariza)                                             ▼ (Rama B: Rebelde)
                 ┌───────────────────────────────────────────────┐                             [ ACT-03: Sentencia Clausura ]
                 │  [ SUB-01: Subproceso Regularización ]       │                                             │
                 │   ├── Paso 1: Plano Conforme a Obra           │                                             ▼
                 │   ├── Paso 2: Liquidación de Derechos         │                                     [ FIN-02: Clausura ]
                 │   └── Paso 3: Pago en Caja y Libre Deuda      │
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
                                  [ FIN-01: Archivo ]
```

### PASO 1: Selección y Compresión
1. Dibuje las 3 tareas de regularización (*Plano*, *Liquidación*, *Pago*).
2. Selecciónelas arrastrando el ratón y presione **`📦 Comprimir en Subproceso`**.
3. asígneles el título *"Subproceso de Regularización de Obras"*. El sistema creará el nodo `SUB-01` unificado.

### PASO 2: Descompresión o Copiado
1. Si desea duplicar el subproceso en otra rama, selecciónelo y presione `Ctrl + C` y `Ctrl + V`.
2. Si desea volver a ver las 3 tarjetas sueltas en el lienzo principal, haga clic en el botón **`Descomprimir`**.

---

## 5. MANTENIMIENTO, COPIAS DE SEGURIDAD Y RESPALDOS USB

* Todos los proyectos residen en:
  ```text
  MiAppProcesos_USB/Proyectos/
  ```
* Para respaldar su trabajo, copie la carpeta `Proyectos/` a cualquier unidad externa.

---
*ProcesosStudio Portable &bull; Conforme a las normas ISO/IEC 19510:2013 y Sistemas de Gestión de la Calidad ISO 9001:2015.*
