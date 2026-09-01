# MANUAL DE USO Y GUÍA TÉCNICA INTEGRAL
## ProcesStudio Portable — BPMN 2.0 (ISO 19510) & ISO 9001:2015
**Versión del Manual:** 3.7 &bull; **Fecha de Emisión:** 2026-09-01 &bull; **Entorno:** Multiplataforma Portable USB (Windows & macOS)

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL SISTEMA

**ProcesStudio Portable** (identificado con el isotipo **`PS`**) es una plataforma profesional concebida para el modelado, análisis, optimización, compresión jerárquica y documentación formal de procedimientos administrativos y flujos operativos institucionales. Integra de manera nativa:

1. **Notación BPMN 2.0 (ISO/IEC 19510:2013)**: Diagramación formal de procesos, compresión y descompresión bidireccional de Subprocesos y Macroprocesos, redimensionamiento libre y proporcional de tarjetas.
2. **Gestión Dinámica de Carriles (Swimlanes) con Persistencia Relativa**:
   * **Agregar Múltiples Carriles:** Botón `[ + Agregar Carril ]` para sumar tantas áreas como tenga el proceso.
   * **Reordenar Arriba / Abajo (`▲` / `▼`):** Al mover un carril, **todas las tarjetas asignadas a él se desplazan solidariamente en bloque**, conservando intacta su posición relativa dentro del carril.
   * **Edición y Personalización Cromática (`✏️`):** Modificación de nombre, rol de usuario, sistema informático TI y color de acento lateral.
   * **Eliminación Segura (`🗑️`):** Con reasignación de tarjetas al carril adyacente.
   * **Persistencia Inmune al Zoom y Paneo:** Los carriles residen en el sistema de coordenadas universal de la aplicación, garantizando alineación geométrica perfecta a cualquier nivel de zoom o paneo del mapa.
3. **Ejecución Multiplataforma 1-Clic (Windows & macOS)**:
   * 🖥️ **Windows:** Inicio instantáneo mediante `ProcesStudio.exe` (o `ProcesStudio.bat` en `App/`).
   * 🍎 **macOS (Apple Mac):** Inicio instantáneo mediante `ProcesStudio_Mac.command` en cualquier Mac (Intel y procesadores M1/M2/M3/M4).
4. **Persistencia 100% Autocontenida (Zero-AppData & Zero-Registry)**:
   * Todo proyecto nuevo, modificación o exportación se guarda de forma permanente dentro de la subcarpeta local:
     ```text
     MiAppProcesos_USB/Proyectos/
     ```
   * Cero residuos en el sistema operativo; la carpeta puede copiarse a cualquier pendrive o PC/Mac y mantener todo su contenido.
5. **Conectores Laterales Exclusivos y Redimensionamiento en Esquinas:**
   * **Conexión Lateral:** Puntos conectores únicamente en los costados (izquierdo para entradas, derecho para salidas).
   * **Anillo de Selección Brillante:** Halo luminoso al seleccionar cualquier elemento.
   * **Esquinas de Redimensionamiento:** Puntos interactivos en las 4 esquinas para estirar o contraer tarjetas.
6. **Navegación Fluida del Lienzo y Control de Zoom:**
   * **Desplazamiento Vertical con la Rueda:** Mover la rueda del ratón (scroll) desplaza el mapa de arriba a abajo.
   * **Zoom Focalizado en el Puntero (`Ctrl + Rueda` / `Cmd + Rueda`):** Zoom in/out enfocado exactamente en las coordenadas del cursor.
   * **Arrastre Libre:** Agarrar y arrastrar desde cualquier punto de los carriles o fondo para mover el tablero.
7. **Personalización Granular de Tarjetas y Tipografía:**
   * **Modo de Visualización:** Alternancia entre `📋 Toda la info` y `🏷️ Solo título`.
   * **Tamaño de Letra:** Ajuste entre 9px y 20px con contención estricta sin desbordamiento.
   * **Fondo, Opacidad, Borde y Cabecera:** Configuración cromática independiente por ámbito (`Esta tarjeta`, `Mismo tipo`, `Todo el mapa`).
   * **Temáticas:** Catálogo preconfigurado (*Pizarra Slate Pro, Midnight Acero, Salvia Forestal, Nebula Violeta, etc.*).
8. **Compresión y Descompresión con Geometría Relativa**:
   * Preservación inmutable de tipos de nodos y conectores al comprimir/descomprimir con movimiento en bloque.

---

## 2. GESTIÓN DE CARRILES (SWIMLANES) Y NAVEGACIÓN

### 2.1. Controles de Carriles
1. **Mover de Posición:** En la cabecera del carril, use los botones `[ ▲ ]` o `[ ▼ ]` para subir o bajar el carril. Sus actividades se moverán automáticamente acompañándolo.
2. **Editar Metadatos del Carril:** Haga clic en el botón `[ ✏️ ]` o sobre el título del carril para editar nombre, rol, sistema y color.
3. **Eliminar Carril:** Haga clic en `[ 🗑️ ]` para suprimir el carril no deseado.
4. **Agregar Nuevos Carriles:** Presione `[ + Agregar Carril ]` en la barra del pool o al pie de los carriles.

### 2.2. Atajos de Navegación del Lienzo
| Acción | Atajo / Movimiento | Resultado en el Lienzo |
| :--- | :--- | :--- |
| **Scroll Vertical** | `Rueda del ratón (arriba / abajo)` | Desplaza el mapa hacia arriba o hacia abajo. |
| **Zoom Focalizado** | `Ctrl + Rueda` (Win) / `Cmd + Rueda` (Mac) | Hace zoom in/out centrado exactamente en el puntero del ratón. |
| **Paneo Libre** | `Clic y arrastre en fondo / carriles` | Mueve el mapa en cualquier dirección. |
| **Copiar y Pegar** | `Ctrl + C` / `Ctrl + V` (o `Cmd + C`/`V`) | Duplica tarjetas, subprocesos o selecciones múltiples. |
| **Eliminar** | `Supr` o `Retroceso` | Elimina nodos o conexiones seleccionadas. |

---

## 3. GUÍA DE COMPONENTES Y NOTACIÓN BPMN 2.0

| Símbolo | Nombre Técnico | Acento Mate | Significado y Aplicación en el Proceso |
| :--- | :--- | :--- | :--- |
| 🟢 | **Evento de Inicio (Start Event)** | `#2DD4BF` (Salvia) | Disparador formal que da comienzo al procedimiento. |
| 🔵 | **Tarea de Usuario (User Task)** | `#38BDF8` (Acero) | Tarea operativa realizada por un operador asistido por software. |
| 🔵 | **Tarea de Servicio (Service Task)** | `#22D3EE` (Cian) | Proceso automatizado ejecutado íntegramente por un software. |
| 🟡 | **Tarea Manual (Manual Task)** | `#FBBF24` (Ámbar) | Actividad física o de inspección en campo sin intervención de software. |
| 🟡 | **Compuerta Exclusiva (Exclusive Gateway - XOR)** | `#F59E0B` (Ocre) | Bifurcación condicional donde el flujo toma una única rama. |
| 🟡 | **Compuerta Paralela (Parallel Gateway - AND)** | `#F59E0B` (Ocre) | Bifurcación simultánea donde se inician múltiples tareas concurrentes. |
| 🟣 | **Subproceso (Sub-Process)** | `#818CF8` (Índigo) | **Actividad compuesta que encapsula un procedimiento secundario.** |
| 🟡 | **Evento de Temporización (Timer Event)** | `#F59E0B` (Miel) | Límite temporal reglamentario que fija plazos perentorios (ISO 8601). |
| 🟢 | **Punto de Control de Calidad (Quality Checkpoint QC)** | `#34D399` (Esmeralda) | Hito de verificación formal bajo norma ISO 9001 con evidencia obligatoria. |
| 🔴 | **Evento de Fin (End Event)** | `#F87171` (Coral) | Culminación o estado terminal del flujo. |
| ➖ | **Flujo de Secuencia (Sequence Flow)** | `#64748B` (Grafito) | Flecha direccional con soporte para etiquetas, colores y animación. |
| 🏊 | **Carriles (Swimlanes) y Pools** | Adaptable | Bandas dinámicas con reordenamiento sincronizado y edición modal. |

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
