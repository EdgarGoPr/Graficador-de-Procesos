# MANUAL DE USO Y GUÍA TÉCNICA INTEGRAL
## ProcesStudio Portable — BPMN 2.0 (ISO 19510) & ISO 9001:2015
**Versión del Manual:** 4.2 &bull; **Fecha de Emisión:** 2026-09-01 &bull; **Entorno:** Multiplataforma Portable USB (Windows & macOS)

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL SISTEMA

**ProcesStudio Portable** (identificado con el isotipo **`PS`**) es una plataforma profesional concebida para el modelado, análisis, optimización, compresión jerárquica y documentación formal de procedimientos administrativos y flujos operativos institucionales. Integra de manera nativa:

1. **Notación BPMN 2.0 (ISO/IEC 19510:2013)**: Diagramación formal de procesos, compresión y descompresión bidireccional de Subprocesos y Macroprocesos, redimensionamiento libre y proporcional de tarjetas.
2. **Atracción Magnética y Acoplamiento de Carriles (Lane Snapping & Auto-Docking)**:
   * **Imantación de Carril con Carril:** Al arrastrar un carril cerca de otro, se alinea automáticamente sobre el mismo eje $X$ y se acopla inmediatamente debajo (o al lado si es vertical) sin solapamientos.
   * **Botón de 1-Clic "Acoplar Carriles":** Organiza, apila en secuencia, iguala anchos y alinea todos los carriles presentes en el mapa al instante.
3. **Atracción Magnética Real en Tarjetas de Actividad (Snap-to-Align)**:
   * **Imantación Física:** Las tarjetas se atraen y encajan a los centros y bordes de otras tarjetas, con una separación uniforme de 40px en horizontal y 30px en vertical.
   * **Líneas Guía Continuas en Todo el Mapa:** Trazado de líneas luminosas punteadas indicando los ejes de coincidencia visual.
4. **Selección de Orientación en Tarjetas y Carriles (Horizontal / Vertical)**:
   * **↔️ Orientación Horizontal (Landscape):** Formato apaisado para flujos de izquierda a derecha.
   * **↕️ Orientación Vertical (Portrait):** Formato en columna para flujos jerárquicos de arriba a abajo.
   * **Controles Rápidos:** Botón `[ 🔄 Orientación ]` en la barra flotante superior, en el panel de propiedades lateral y en las cabeceras de carriles.
5. **Ejecución Multiplataforma 1-Clic (Windows & macOS)**:
   * 🖥️ **Windows:** Inicio instantáneo mediante `ProcesStudio.exe` (o `ProcesStudio.bat` en `App/`).
   * 🍎 **macOS (Apple Mac):** Inicio instantáneo mediante `ProcesStudio_Mac.command` en cualquier Mac (Intel y procesadores Apple Silicon M1/M2/M3/M4).
6. **Persistencia 100% Autocontenida (Zero-AppData & Zero-Registry)**:
   * Todo proyecto se guarda de forma permanente dentro de la subcarpeta local:
     ```text
     MiAppProcesos_USB/Proyectos/
     ```
7. **Navegación Fluida del Lienzo y Control de Zoom:**
   * **Desplazamiento Vertical con la Rueda:** Mover la rueda del ratón desplaza el mapa verticalmente.
   * **Zoom Focalizado en el Puntero (`Ctrl + Rueda` / `Cmd + Rueda`):** Zoom in/out enfocado exactamente en las coordenadas del cursor.

---

## 2. GUÍA DE ALINEACIÓN MAGNÉTICA Y CARRILES

### 2.1. Acoplamiento de Carriles (Swimlanes)
1. **Arrastrar y Acoplar:** Al mover un carril hacia la parte inferior de otro, se pegará automáticamente en contacto directo sin solaparse.
2. **Botón Acoplar Carriles:** Presione `[ 📐 Acoplar Carriles ]` en la barra superior para organizar y uniformar automáticamente todos los carriles del diagrama.

### 2.2. Atracción Magnética de Tarjetas
* Al aproximar dos tarjetas consecutivas, el motor magnético encajará automáticamente la tarjeta con la separación visual reglamentaria (40px).

---

## 3. GUÍA DE COMPONENTES Y NOTACIÓN BPMN 2.0

| Símbolo | Nombre Técnico | Acento Mate | Significado y Aplicación en el Proceso |
| :--- | :--- | :--- | :--- |
| 🟢 | **Evento de Inicio (Start Event)** | `#2DD4BF` (Salvia) | Disparador formal que da comienzo al procedimiento. |
| 🔵 | **Tarea de Usuario (User Task)** | `#38BDF8` (Acero) | Tarea operativa realizada por un operador asistido por software. |
| 🔵 | **Tarea de Servicio (Service Task)** | `#22D3EE` (Cian) | Proceso automatizado ejecutado íntegramente por un software. |
| 🟡 | **Tarea Manual (Manual Task)** | `#FBBF24` (Ámbar) | Actividad física o de inspección en campo sin intervención de software. |
| 🟡 | **Compuerta Exclusiva (Exclusive Gateway - XOR)** | `#F59E0B` (Ocre) | Bifurcación condicional donde el flujo toma una única rama de decisión. |
| 🟡 | **Compuerta Paralela (Parallel Gateway - AND)** | `#F59E0B` (Ocre) | Bifurcación simultánea donde se inician múltiples tareas concurrentes. |
| 🟣 | **Subproceso (Sub-Process)** | `#818CF8` (Índigo) | **Actividad compuesta que encapsula un procedimiento secundario.** |
| 🟡 | **Evento de Temporización (Timer Event)** | `#F59E0B` (Miel) | Límite temporal reglamentario que fija plazos perentorios (ISO 8601). |
| 🟢 | **Punto de Control de Calidad (Quality Checkpoint QC)** | `#34D399` (Esmeralda) | Hito de verificación formal bajo norma ISO 9001 con evidencia obligatoria. |
| 🔴 | **Evento de Fin (End Event)** | `#F87171` (Coral) | Culminación o estado terminal del flujo. |
| 🏊 | **Carril Funcional (Swimlane)** | `#0284C7` (Azul) | Banda contenedora con acoplamiento magnético y autoalineación. |
| ➖ | **Flujo de Secuencia (Sequence Flow)** | `#64748B` (Grafito) | Flecha direccional con soporte para etiquetas, colores y animación. |

---

## 4. TUTORIAL PRÁCTICO: MODELADO Y COMPRESIÓN

### 🏢 Caso de Estudio: *"Procedimiento Sancionatorio por Obras Clandestinas"* (Código: `PRC-OBR-001`)

```
[ INI-01: Acta de Infracción ] ──> [ ACT-01: Cotejo Catastral ] ──> [ QC-01: Verificación ]
                                                                             │
                                                                             ▼
                                                                [ DEC-01: ¿Subsanación? ]
                                                                             │
                                              ┌──────────────────────────────┴──────────────────────────────┐
                                              ▼ (Rama A: Regulariza)                                        ▼ (Rama B: Rebelde)
                        ┌─────────────────────────────────────────────────────────────┐           [ ACT-03: Clausura ]
                        │ [ SUB-01: Subproceso de Regularización de Obras ]           │                     │
                        │  ├── Paso 1: Presentación de Plano Conforme a Obra          │                     ▼
                        │  ├── Paso 2: Liquidación de Derechos y Multas               │             [ FIN-02: Clausura ]
                        │  └── Paso 3: Pago en Caja Municipal y Certificado           │
                        └─────────────────────────────┬───────────────────────────────┘
                                                      │
                                                      ▼
                                             [ FIN-01: Archivo ]
```

---

## 5. MANTENIMIENTO Y RESPALDOS

* Todos los proyectos residen en:
  ```text
  MiAppProcesos_USB/Proyectos/
  ```

---
*ProcesStudio Portable &bull; Conforme a las normas ISO/IEC 19510:2013 y Sistemas de Gestión de la Calidad ISO 9001:2015.*
