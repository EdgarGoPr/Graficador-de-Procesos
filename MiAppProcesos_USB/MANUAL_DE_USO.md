# MANUAL DE USO Y GUÍA TÉCNICA INTEGRAL
## ProcesStudio Portable — BPMN 2.0 (ISO 19510) & ISO 9001:2015
**Versión del Manual:** 3.1 &bull; **Fecha de Emisión:** 2026-09-01 &bull; **Entorno:** Portable Windows Desktop (`ProcesStudio.exe`) / Web

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL SISTEMA

**ProcesStudio Portable** (identificado con el isotipo **`PS`**) es una plataforma profesional concebida para el modelado, análisis, optimización, compresión jerárquica y documentación formal de procedimientos administrativos y flujos operativos institucionales. Integra de manera nativa:

1. **Notación BPMN 2.0 (ISO/IEC 19510:2013)**: Diagramación formal de procesos, compresión y descompresión bidireccional de Subprocesos y Macroprocesos, redimensionamiento libre y proporcional de tarjetas.
2. **Personalización Granular de Tarjetas y Temáticas:**
   * **Fondo y Opacidad:** Color de fondo con control deslizante de transparencia (de 10% translúcido a 100% sólido).
   * **Borde y Recuadro del Título:** Selección cromática independiente para el marco exterior y la franja superior de la cabecera/título.
   * **Ámbito de Aplicación:** Selector para aplicar el estilo a `[ 🎯 Esta tarjeta ]`, `[ 🏷️ Mismo tipo ]` o `[ 🌐 Todo el mapa ]`.
   * **Temáticas de Tarjeta:** Catálogo de combos (*Pizarra Slate Pro, Midnight Acero, Salvia Forestal, Nebula Violeta, Ámbar Cálido, Vidrio Esmerilado, Nórdico Claro, Arena Suave*).
3. **Catálogo Exclusivo de Temas de ProcesStudio:**
   * 🌑 **ProcesStudio Slate Pro** (Grafito profundo y azul pizarra mate)
   * 🪐 **Midnight Executive** (Azul espacial y acero relajante)
   * 🌿 **Forest Sage ISO** (Gris bosque y verde salvia)
   * 🔮 **Nebula Modern** (Grafito violeta y lavanda suave)
   * ☀️ **Nordic Studio Light** (Fondo perla claro y azul cerúleo)
   * 🏖️ **Warm Sandpaper** (Arena cálida y ámbar mate)
4. **Compresión y Descompresión con Geometría Relativa**:
   * Preservación inmutable de todos los tipos de nodos y estilos de conectores al comprimir y descomprimir.
   * Movimiento en bloque sincronizado de todas las tarjetas descomprimidas.
5. **Portapapeles Integral de Procesos (`Ctrl + C` / `Ctrl + V`)**: Copiado y pegado de tarjetas individuales, selecciones múltiples y Subprocesos completos con todas sus tareas internas.
6. **Persistencia Total y Autoguardado en Segundo Plano**: Disposiciones espaciales `(X, Y)`, dimensiones, colores de tarjetas y conexiones guardados en tiempo real en los archivos JSON de `../Proyectos/`.

### 💾 Arquitectura Portable USB (Zero-AppData & Zero-Registry)
* **Ejecutable Directo (`ProcesStudio.exe`)**: Inicia la aplicación con un solo clic.
* **Persistencia Abierta en JSON**: Cada proyecto se guarda como un archivo de texto estructurado en la subcarpeta `../Proyectos/`.
* **Portabilidad Total**: Funciona en cualquier pendrive o PC con Windows 10/11 sin instalaciones ni permisos de administrador.

---

## 2. PERSONALIZACIÓN VISUAL Y TEMÁTICAS DE TARJETAS

### 2.1. Opciones de Personalización en el Panel Lateral
Al seleccionar cualquier tarjeta del lienzo, el panel de propiedades ofrece la sección **"Estilo y Temática de Tarjeta"**:
1. **Ámbito de Aplicación:**
   * `🎯 Esta tarjeta`: Modifica únicamente el elemento seleccionado.
   * `🏷️ Mismo tipo`: Actualiza todas las tarjetas de la misma clase (ej. todas las tareas de usuario o todas las compuertas).
   * `🌐 Todo el mapa`: Aplica el estilo seleccionado a la totalidad de las tarjetas del diagrama.
2. **Temáticas Predefinidas de Tarjeta:** Aplica combinaciones armoniosas de fondo, transparencia, borde y cabecera con un solo clic.
3. **Control de Fondo y Transparencia:** Selector RGB/Hex acompañado de un control deslizante de 10% a 100% de opacidad.
4. **Borde y Recuadro de Título:** Colores configurables independientemente para resaltar hitos críticos o separar jerarquías.

---

## 3. GUÍA DE COMPONENTES Y NOTACIÓN BPMN 2.0

| Símbolo | Nombre Técnico | Acento Mate | Significado y Aplicación en el Proceso |
| :--- | :--- | :--- | :--- |
| 🟢 | **Evento de Inicio (Start Event)** | `#2DD4BF` (Salvia) | Disparador formal que da comienzo al procedimiento (ej: *Recepción de Acta*). |
| 🔵 | **Tarea de Usuario (User Task)** | `#38BDF8` (Acero) | Tarea operativa realizada por un operador asistido por software. |
| 🔵 | **Tarea de Servicio (Service Task)** | `#22D3EE` (Cian) | Proceso automatizado ejecutado íntegramente por un software. |
| 🟡 | **Tarea Manual (Manual Task)** | `#FBBF24` (Ámbar) | Actividad física o de inspección en campo sin intervención de software. |
| 🟡 | **Compuerta Exclusiva (Exclusive Gateway - XOR)** | `#F59E0B` (Ocre) | Bifurcación condicional donde el flujo toma una única rama. |
| 🟡 | **Compuerta Paralela (Parallel Gateway - AND)** | `#F59E0B` (Ocre) | Bifurcación simultánea donde se inician múltiples tareas concurrentes. |
| 🟣 | **Subproceso (Sub-Process)** | `#818CF8` (Índigo) | **Actividad compuesta que encapsula un procedimiento secundario.** Permite compresión y descompresión bidireccional con geometría relativa. |
| 🟡 | **Evento de Temporización (Timer Event)** | `#F59E0B` (Miel) | Límite temporal reglamentario que fija plazos perentorios (ISO 8601). |
| 🟢 | **Punto de Control de Calidad (Quality Checkpoint QC)** | `#34D399` (Esmeralda) | Hito de verificación formal bajo norma ISO 9001 con evidencia obligatoria. |
| 🔴 | **Evento de Fin (End Event)** | `#F87171` (Coral) | Culminación o estado terminal del flujo (ej: *Expediente Archivado*). |
| ➖ | **Flujo de Secuencia (Sequence Flow)** | `#64748B` (Grafito) | Flecha direccional con soporte para etiquetas, colores, grosores y animación. |
| 🏊 | **Carriles (Swimlanes) y Pools** | Adaptable | Bandas horizontales que representan unidades funcionales y sistemas TI. |

---

## 4. TUTORIAL PRÁCTICO: MODELADO, COMPRESIÓN Y DESCOMPRESIÓN

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

### PASO 1: Modelado y Personalización Visual
1. Dibuje las actividades en el lienzo y personalice sus colores de fondo, transparencia o aplique temáticas predefinidas.
2. Si desea homogeneizar el diseño, seleccione una tarjeta y aplique el color con el alcance **"A todas las tarjetas del mismo tipo"** o **"A todas las tarjetas"**.

### PASO 2: Compresión y Descompresión
1. Seleccione las 3 tareas de regularización y presione **`📦 Comprimir en Subproceso`**.
2. Al trasladar el Subproceso y presionar **`Descomprimir`**, las tarjetas reaparecen en la nueva posición con sus colores y transparencias intactos.

---

## 5. MANTENIMIENTO, COPIAS DE SEGURIDAD Y RESPALDOS USB

* Todos los proyectos residen en:
  ```text
  MiAppProcesos_USB/Proyectos/
  ```
* Para respaldar su trabajo, copie la carpeta `Proyectos/` a cualquier unidad externa.

---
*ProcesStudio Portable &bull; Conforme a las normas ISO/IEC 19510:2013 y Sistemas de Gestión de la Calidad ISO 9001:2015.*
