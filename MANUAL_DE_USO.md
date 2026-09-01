# MANUAL DE USO Y GUÍA TÉCNICA INTEGRAL
## ProcesStudio Portable — BPMN 2.0 (ISO 19510) & ISO 9001:2015
**Versión del Manual:** 3.4 &bull; **Fecha de Emisión:** 2026-09-01 &bull; **Entorno:** Portable Windows Desktop (`ProcesStudio.exe`) / Web

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL SISTEMA

**ProcesStudio Portable** (identificado con el isotipo **`PS`**) es una plataforma profesional concebida para el modelado, análisis, optimización, compresión jerárquica y documentación formal de procedimientos administrativos y flujos operativos institucionales. Integra de manera nativa:

1. **Notación BPMN 2.0 (ISO/IEC 19510:2013)**: Diagramación formal de procesos, compresión y descompresión bidireccional de Subprocesos y Macroprocesos, redimensionamiento libre y proporcional de tarjetas.
2. **Selección Activa, Redimensionamiento y Conectores Laterales:**
   * **Anillo de Selección Brillante:** Al hacer clic en una tarjeta, su borde se resalta con un halo luminoso nítido.
   * **Esquinas de Redimensionamiento:** Puntos interactivos en las 4 esquinas para estirar o achicar la tarjeta de forma intuitiva.
   * **Conectores Laterales (Handles):** Puntos de conexión visibles en los bordes para tirar flechas de flujo de secuencia hacia otras actividades.
3. **Navegación Fluida del Lienzo y Control de Zoom:**
   * **Desplazamiento Vertical con la Rueda:** Al mover la rueda del ratón (scroll), el mapa se desplaza suavemente de arriba a abajo.
   * **Zoom Focalizado en el Puntero (`Ctrl + Rueda`):** Mantener presionada la tecla `Ctrl` mientras se gira la rueda del ratón realiza acercamiento o alejamiento enfocado con precisión en la ubicación del cursor.
   * **Arrastre desde Swimlanes:** Agarrar y arrastrar desde el área de carriles (swimlanes) o el fondo permite desplazar el lienzo con total libertad.
4. **Personalización Granular de Tarjetas y Tipografía:**
   * **Modo de Visualización de Contenido:** Alternancia entre `📋 Toda la info` (detallado con SLA, riesgos, calidad y sistemas) y `🏷️ Solo título` (vista panorámica limpia y compacta).
   * **Tamaño de Letra Ajustable:** Pastillas rápidas (*10px Compacta, 12px Normal, 14px Mediana, 16px Grande*) y control deslizante de 9px a 20px con contención estricta sin desbordamiento.
   * **Fondo, Opacidad, Borde y Recuadro del Título:** Selección cromática independiente y aplicación por ámbito (`Esta tarjeta`, `Mismo tipo`, `Todo el mapa`).
   * **Temáticas de Tarjeta:** Catálogo preconfigurado (*Pizarra Slate Pro, Midnight Acero, Salvia Forestal, Nebula Violeta, Ámbar Cálido, Vidrio Esmerilado, Nórdico Claro, Arena Suave*).
5. **Catálogo Exclusivo de Temas de ProcesStudio:**
   * 🌑 **ProcesStudio Slate Pro** (Grafito profundo y azul pizarra mate)
   * 🪐 **Midnight Executive** (Azul espacial y acero relajante)
   * 🌿 **Forest Sage ISO** (Gris bosque y verde salvia)
   * 🔮 **Nebula Modern** (Grafito violeta y lavanda suave)
   * ☀️ **Nordic Studio Light** (Fondo perla claro y azul cerúleo)
   * 🏖️ **Warm Sandpaper** (Arena cálida y ámbar mate)
6. **Compresión y Descompresión con Geometría Relativa**:
   * Preservación inmutable de todos los tipos de nodos y estilos de conectores al comprimir y descomprimir.
   * Movimiento en bloque sincronizado de todas las tarjetas descomprimidas.
7. **Portapapeles Integral de Procesos (`Ctrl + C` / `Ctrl + V`)**: Copiado y pegado de tarjetas individuales, selecciones múltiples y Subprocesos completos con todas sus tareas internas.
8. **Persistencia Total y Autoguardado en Segundo Plano**: Disposiciones espaciales `(X, Y)`, dimensiones, colores de tarjetas y conexiones guardados en tiempo real en los archivos JSON de `../Proyectos/`.

### 💾 Arquitectura Portable USB (Zero-AppData & Zero-Registry)
* **Ejecutable Directo (`ProcesStudio.exe`)**: Inicia la aplicación con un solo clic.
* **Persistencia Abierta en JSON**: Cada proyecto se guarda como un archivo de texto estructurado en la subcarpeta `../Proyectos/`.
* **Portabilidad Total**: Funciona en cualquier pendrive o PC con Windows 10/11 sin instalaciones ni permisos de administrador.

---

## 2. INTERACCIÓN CON TARJETAS, NAVEGACIÓN Y PERSONALIZACIÓN

### 2.1. Interacción con Tarjetas en el Lienzo
1. **Selección y Resaltado:** Haga clic sobre cualquier tarjeta para seleccionarla; se iluminará con un borde brillante activo y abrirá el panel lateral de propiedades.
2. **Redimensionamiento (Esquinas):** Al seleccionar la tarjeta, aparecen puntos en sus cuatro esquinas. Arrástrelos para expandir o contraer sus dimensiones libremente.
3. **Conexiones (Puntos Laterales):** Pase el cursor sobre los laterales de la tarjeta; haga clic y arrastre desde el conector hacia la tarjeta de destino para crear un flujo de secuencia BPMN 2.0.

### 2.2. Atajos de Navegación del Lienzo
| Acción | Atajo / Movimiento | Resultado en el Lienzo |
| :--- | :--- | :--- |
| **Scroll Vertical** | `Rueda del ratón (arriba / abajo)` | Desplaza el mapa hacia arriba o hacia abajo. |
| **Zoom Focalizado** | `Ctrl + Rueda del ratón` | Hace zoom in/out centrado exactamente en el puntero del ratón. |
| **Paneo Libre** | `Clic y arrastre en swimlanes / fondo` | Mueve el mapa en cualquier dirección. |
| **Copiar y Pegar** | `Ctrl + C` / `Ctrl + V` | Duplica tarjetas, subprocesos o selecciones múltiples. |
| **Eliminar** | `Supr` o `Retroceso` | Elimina nodos o conexiones seleccionadas. |

### 2.3. Opciones de Personalización en el Panel Lateral
* **Ámbito de Aplicación:** `🎯 Esta tarjeta`, `🏷️ Mismo tipo`, `🌐 Todo el mapa`.
* **Modo de Visualización:** `📋 Toda la info` vs `🏷️ Solo título`.
* **Tamaño de Letra:** Ajuste entre 9px y 20px con contención estricta.
* **Temáticas y Colores:** Combinaciones armoniosas para fondo, transparencia, borde y recuadro de cabecera.

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

### PASO 1: Modelado, Conexiones y Redimensionamiento
1. Seleccione cualquier tarjeta para ver su borde brillante y ajustar su tamaño desde las esquinas.
2. Arrastre desde sus conectores laterales para trazar conexiones fluidas hacia otras tarjetas.
3. Utilice la rueda del ratón para desplazarse verticalmente y `Ctrl + Rueda` para hacer zoom focalizado.

### PASO 2: Compresión y Descompresión
1. Seleccione las actividades y presione **`📦 Comprimir en Subproceso`**.
2. Al trasladar el Subproceso y presionar **`Descomprimir`**, las tarjetas reaparecen en la nueva posición con sus tamaños, colores, conectores y transparencias intactos.

---

## 5. MANTENIMIENTO, COPIAS DE SEGURIDAD Y RESPALDOS USB

* Todos los proyectos residen en:
  ```text
  MiAppProcesos_USB/Proyectos/
  ```
* Para respaldar su trabajo, copie la carpeta `Proyectos/` a cualquier unidad externa.

---
*ProcesStudio Portable &bull; Conforme a las normas ISO/IEC 19510:2013 y Sistemas de Gestión de la Calidad ISO 9001:2015.*
