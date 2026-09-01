# MANUAL DE USO Y GUÍA TÉCNICA INTEGRAL
## ProcesStudio Portable — BPMN 2.0 (ISO 19510) & ISO 9001:2015
**Versión del Manual:** 4.0 &bull; **Fecha de Emisión:** 2026-09-01 &bull; **Entorno:** Multiplataforma Portable USB (Windows & macOS)

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL SISTEMA

**ProcesStudio Portable** (identificado con el isotipo **`PS`**) es una plataforma profesional concebida para el modelado, análisis, optimización, compresión jerárquica y documentación formal de procedimientos administrativos y flujos operativos institucionales. Integra de manera nativa:

1. **Notación BPMN 2.0 (ISO/IEC 19510:2013)**: Diagramación formal de procesos, compresión y descompresión bidireccional de Subprocesos y Macroprocesos, redimensionamiento libre y proporcional de tarjetas.
2. **Carriles (Swimlanes) como Tarjetas Nativas Redimensionables**:
   * **Tarjetas de Primera Clase:** Los carriles son tarjetas contenedoras que se pueden arrastrar, mover, personalizar y redimensionar libremente mediante sus manijas en las 4 esquinas (`NodeResizer`).
   * **Escalado Adaptable:** Todo el contenido (cabecera con rol/sistema, barra de acento cromático y cuadrícula de fondo) se ajusta dinámicamente al ancho y alto configurado.
   * **Inmunidad Total al Zoom y Paneo:** Al integrarse como nodos en el lienzo, permanecen en sincronía matemática perfecta ante cualquier escala o desplazamiento del mapa.
3. **Líneas Guía Inteligentes y Atracción Magnética (Smart Guides & Snap-to-Align)**:
   * **Líneas Guía en Todo el Mapa:** Al arrastrar cualquier tarjeta, se trazan líneas luminosas continuas verticales y horizontales para indicar la alineación exacta respecto a las demás tarjetas.
   * **Imantación Magnética (Snap):** Al acercar una tarjeta al lado de otra (horizontalmente) o una encima/debajo de otra (verticalmente), las tarjetas se atraen y alinean automáticamente con espaciado uniforme y prolijo.
4. **Ejecución Multiplataforma 1-Clic (Windows & macOS)**:
   * 🖥️ **Windows:** Inicio instantáneo mediante `ProcesStudio.exe` (o `ProcesStudio.bat` en `App/`).
   * 🍎 **macOS (Apple Mac):** Inicio instantáneo mediante `ProcesStudio_Mac.command` en cualquier Mac (Intel y chips M1/M2/M3/M4).
5. **Persistencia 100% Autocontenida (Zero-AppData & Zero-Registry)**:
   * Todo proyecto nuevo, modificación o exportación se guarda dentro de la subcarpeta local:
     ```text
     MiAppProcesos_USB/Proyectos/
     ```
   * Cero residuos en el sistema operativo; la carpeta puede copiarse a cualquier pendrive o PC/Mac y mantener todo su contenido.
6. **Conectores Laterales Exclusivos y Redimensionamiento en Esquinas:**
   * **Conexión Lateral:** Puntos conectores únicamente en los costados (izquierdo para entradas, derecho para salidas).
   * **Anillo de Selección Brillante:** Halo luminoso al seleccionar cualquier elemento.
7. **Navegación Fluida del Lienzo y Control de Zoom:**
   * **Desplazamiento Vertical con la Rueda:** Mover la rueda del ratón desplaza el mapa de arriba a abajo.
   * **Zoom Focalizado en el Puntero (`Ctrl + Rueda` / `Cmd + Rueda`):** Zoom in/out enfocado exactamente en las coordenadas del cursor.
   * **Arrastre Libre:** Agarrar y arrastrar desde el fondo para mover el tablero.
8. **Personalización Granular de Tarjetas y Tipografía:**
   * **Modo de Visualización:** Alternancia entre `📋 Toda la info` y `🏷️ Solo título`.
   * **Tamaño de Letra:** Ajuste entre 9px y 20px con contención estricta sin desbordamiento.
   * **Temáticas:** Catálogo preconfigurado (*Pizarra Slate Pro, Midnight Acero, Salvia Forestal, etc.*).

---

## 2. GUÍA DE ALINEACIÓN MAGNÉTICA Y CARRILES

### 2.1. Uso de Carriles (Swimlanes)
1. **Insertar un Carril:** Arrastre un **Carril (Swimlane)** desde la paleta izquierda hacia el lienzo o presione sobre él para crearlo.
2. **Ajustar Tamaño:** Seleccione el carril y arrastre los puntos de las 4 esquinas para expandir su ancho y alto según la cantidad de tareas requeridas.
3. **Personalizar:** Haga clic en el botón `[ ✏️ ]` de la cabecera lateral del carril para editar su nombre, rol, sistema y color de acento.

### 2.2. Guías Inteligentes y Atracción Magnética
* **Alineación de Ejes:** Al mover una tarjeta en la misma línea que otra (centro con centro, o borde con borde), una línea punteada azul cielo atravesará el lienzo confirmando la alineación.
* **Encaje Automático:** Al aproximar dos tarjetas consecutivas, notará una fuerza de atracción magnética que fija automáticamente la tarjeta con la separación visual reglamentaria.

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
| 🏊 | **Carril Funcional (Swimlane)** | `#0284C7` (Azul) | Banda contenedora redimensionable con escalado dinámico. |
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
