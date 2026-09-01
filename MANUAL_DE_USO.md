# MANUAL DE USO Y GUÍA TÉCNICA INTEGRAL
## ProcesStudio Portable — BPMN 2.0 (ISO 19510) & ISO 9001:2015
**Versión del Manual:** 4.1 &bull; **Fecha de Emisión:** 2026-09-01 &bull; **Entorno:** Multiplataforma Portable USB (Windows & macOS)

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL SISTEMA

**ProcesStudio Portable** (identificado con el isotipo **`PS`**) es una plataforma profesional concebida para el modelado, análisis, optimización, compresión jerárquica y documentación formal de procedimientos administrativos y flujos operativos institucionales. Integra de manera nativa:

1. **Notación BPMN 2.0 (ISO/IEC 19510:2013)**: Diagramación formal de procesos, compresión y descompresión bidireccional de Subprocesos y Macroprocesos, redimensionamiento libre y proporcional de tarjetas.
2. **Atracción Magnética Real y Guías Inteligentes (Snap-to-Align & Magnetic Drag)**:
   * **Imantación Física en Tiempo Real:** Al desplazar cualquier tarjeta cerca de otra (a menos de 16px de sus centros, bordes o separación contigua de 40px en horizontal / 30px en vertical), la tarjeta **se atrae, salta y se fija magnéticamente** al punto exacto.
   * **Líneas Guía Continuas en Todo el Mapa:** Trazado de líneas luminosas punteadas de alineación que cruzan la pantalla indicando los ejes de coincidencia visual.
3. **Selección de Orientación en Tarjetas y Carriles (Horizontal / Vertical)**:
   * **↔️ Orientación Horizontal (Landscape):** Formato apaisado óptimo para flujos procesales de izquierda a derecha.
   * **↕️ Orientación Vertical (Portrait):** Formato en columna/torre óptimo para flujos jerárquicos de arriba a abajo.
   * **Controles Rápidos:** Disponible con 1-clic en la **Barra Flotante Superior (`🔄 Orientación`)**, en el **Panel de Propiedades Lateral** y en las cabeceras de los carriles.
4. **Carriles (Swimlanes) como Tarjetas Nativas Redimensionables**:
   * **Tarjetas de Primera Clase:** Los carriles se pueden arrastrar, rotar de orientación y redimensionar con manijas en las 4 esquinas (`NodeResizer`).
   * **Escalado Adaptable:** Todo el contenido (cabecera con rol/sistema, barra cromática y cuadrícula) se adapta dinámicamente.
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

## 2. GUÍA DE ALINEACIÓN MAGNÉTICA Y ORIENTACIÓN

### 2.1. Atracción Magnética y Encaje Automático
1. **Alineación de Ejes:** Al mover una tarjeta en línea con otra, sentirá la fuerza de atracción magnética que fija automáticamente la tarjeta sobre el eje horizontal o vertical.
2. **Espaciado Uniforme:** Al acercar una tarjeta al costado de otra, la tarjeta se imanta con la separación reglamentaria de 40px para garantizar diagramas legibles y homogéneos.

### 2.2. Cambio de Orientación (Horizontal ↔️ Vertical)
* **Desde la Barra Superior:** Seleccione la tarjeta y presione el botón `[ 🔄 Orientación ]`.
* **Desde el Panel de Propiedades:** Seleccione la opción deseada en el apartado `📐 Orientación de la Tarjeta` (`[ ↔️ Horizontal ]` o `[ ↕️ Vertical ]`).

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
| 🏊 | **Carril Funcional (Swimlane)** | `#0284C7` (Azul) | Banda contenedora redimensionable y orientable (horizontal/vertical). |
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
