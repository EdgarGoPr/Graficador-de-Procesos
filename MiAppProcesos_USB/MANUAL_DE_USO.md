# MANUAL DE USO Y GUÍA TÉCNICA INTEGRAL
## ProcesosStudio Portable — BPMN 2.0 (ISO 19510) & ISO 9001:2015
**Versión del Manual:** 2.4 &bull; **Fecha de Emisión:** 2026-09-01 &bull; **Entorno:** Portable Windows Desktop (`.EXE`) / Web

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL SISTEMA

**ProcesosStudio Portable** es una plataforma profesional concebida para el modelado, análisis, optimización, personalización cromática y documentación formal de procedimientos administrativos y flujos operativos institucionales. Integra de manera nativa:

1. **Notación BPMN 2.0 (ISO/IEC 19510:2013)**: Estándar internacional para diagramación de flujos de procesos de negocio, soportando Macroprocesos y Subprocesos jerárquicos expandibles, con redimensionamiento dinámico y libre de tarjetas.
2. **Personalización Cromática de Fondo y Mecánica de Herencia de Temáticas**: 
   * **Fondo de la Pizarra y Carriles**: Personalización libre de la superficie completa del lienzo y de las franjas de los carriles (swimlanes), eliminando fondos fijos y permitiendo cualquier tonalidad (carbón, azul noche, pizarra, perla, etc.).
   * **Herencia de Temática Base**: Primero se selecciona una temática base (Antigravity Dark, Cosmic, Emerald, Violet, Light Studio o Warm Solar) y, al modificar un color específico (como el fondo de pizarra o un acento), **todos los demás colores se mantienen basados fielmente en la temática inicial elegida**.
3. **Sistemas de Gestión de la Calidad (ISO 9001:2015)**: Cumplimiento directo de los requisitos de enfoque en procesos (Cláusula 4.4), pensamiento basado en riesgos (Cláusula 6.1), información documentada (Cláusula 7.5) y control de salidas no conformes / liberación de servicios (Cláusula 8.6).
4. **Cálculo de Tiempos SLA y Lead Time (ISO 8601)**: Cuantificación de plazos administrativos, tiempos de ciclo directo y límites perentorios de prescripción legal.

### 💾 Arquitectura Portable USB (Zero-AppData & Zero-Registry)
A diferencia de los programas tradicionales, **ProcesosStudio Portable** no requiere instaladores, privilegios de administrador ni runtime de Node.js instalado en el equipo del usuario:
* **Ejecutable Directo (`ProcesosStudio.exe`)**: Inicia la aplicación con un solo clic.
* **Persistencia Abierta en JSON**: Cada proyecto se guarda como un archivo de texto estructurado en la subcarpeta `../Proyectos/`.
* **Portabilidad Total**: Permite copiar la carpeta completa a cualquier memoria USB (Pendrive) y trabajar en cualquier computadora con Windows 10/11 manteniendo todos los proyectos sincronizados.

---

## 2. MECÁNICA DE COLORES Y HERENCIA DE TEMÁTICAS

### 2.1. Selección de Temática Base Inicial
En la barra superior, haga clic en el botón **`Temas y Colores`** (ícono de paleta). En la pestaña **`1. Seleccionar Temática Base`**, elija su estilo preferido:
* 🌑 **Antigravity Dark (Clásico)**: Gris carbón profundo (`#18181B`) con cian (`#38BDF8`).
* 🪐 **Antigravity Cosmic (Midnight)**: Azul espacial (`#0B0F19`) con azul eléctrico (`#3B82F6`).
* 🌲 **Antigravity Cyber Emerald**: Gris obsidiana (`#0C1712`) con esmeralda ISO 9001 (`#10B981`).
* 🔮 **Antigravity Nebula Violet**: Púrpura cósmico (`#130D24`) con violeta neón (`#A855F7`).
* ☀️ **Antigravity Light Studio**: Modo claro de alta nitidez (`#F8F9FA` / `#FFFFFF`) con azul cerúleo (`#0284C7`).
* 🏖️ **Antigravity Warm Solar**: Tonalidad arena cálida y ámbar (`#FAF7F2` / `#D97706`).

---

### 2.2. Modificación de la Pizarra con Preservación del Resto de Colores
En la pestaña **`2. Fondo de la Pizarra`**:
1. Elija un color rápido (*Carbón BPMN, Obsidiana, Cosmic, Cyber, Púrpura, Gris Perla, Crema Solar, Blanco Puro*) o use el **selector hexadecimal libre**.
2. **Comportamiento de Herencia:** Al cambiar el color de la parte de atrás de la pizarra, **las franjas de los carriles organizativos (swimlanes) y el lienzo adoptan ese color inmediatamente**, mientras que todos los paneles, botones, textos y acentos de la app continúan basados en la **temática base elegida** en el Paso 1.
3. Si en algún momento desea volver a la paleta original pura, dispone del botón **`Restablecer a base`**.

---

### 2.3. Personalización de Tarjetas (Individual y Grupal)
Al seleccionar cualquier tarjeta o nodo en el lienzo, el panel derecho (*Propiedades*) incluye la sección **🎨 Color de la Tarjeta**:
* **Ajuste Individual**: Muestras rápidas o selector libre para cambiar el color de esa tarjeta específica.
* **Acciones Masivas Grupales**:
  * 🔘 *"Aplicar a todas las tarjetas de tipo: [UserTask / SubProcess / etc.]"*
  * 🔘 *"Aplicar a todas las tarjetas del carril actual: [Nombre de Carril]"*
  * 🔘 *"Aplicar a todas las tarjetas del diagrama"*

---

### 2.4. Personalización de Conexiones y Flechas
Al hacer clic sobre cualquier flecha de flujo, el panel de propiedades permite configurar:
* **Color de la Flecha**: Paleta rápida o selector de color libre.
* **Grosor**: Fino (1.5px), Normal (2px), Grueso (3px) o Énfasis (4px).
* **Flujo Animado**: Conmutador para activar el movimiento de flujo continuo.
* **Botón Masivo**: *"Aplicar a todas las conexiones del proyecto"*.

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
| 🔵 | **Subproceso (Sub-Process)** | `#3B82F6` | **Actividad compuesta que agrupa un procedimiento secundario.** Incluye botón **"Ampliar"** para desglosar sus etapas internas. |
| 🟡 | **Evento de Temporización (Timer Event)** | `#F59E0B` | Límite temporal reglamentario que fija plazos perentorios (ISO 8601). |
| 🟢 | **Punto de Control de Calidad (Quality Checkpoint QC)** | `#10B981` | Hito de verificación formal bajo norma ISO 9001 con evidencia obligatoria. |
| 🔴 | **Evento de Fin (End Event)** | `#EF4444` | Culminación o estado terminal del flujo (ej: *Expediente Archivado*). |
| ➖ | **Flujo de Secuencia (Sequence Flow)** | Configurable | Flecha direccional con soporte para etiquetas, colores, grosores y animación. |
| 🏊 | **Carriles (Swimlanes) y Pools** | Adaptable | Bandas horizontales que representan unidades funcionales y sistemas TI. |

---

## 4. REDIMENSIONAMIENTO Y CONTROL DE PANELES

* **Redimensionamiento de Tarjetas/Nodos**: Al seleccionar cualquier nodo en el lienzo, arrastre los bordes o **arrastre desde cualquiera de las 4 esquinas circulares para redimensionar de forma proporcional**.
* **Ajuste de Paneles con Ratón**: Arrastre los bordes divisorios de la Paleta izquierda y del Navegador derecho para calibrar su ancho libremente.
* **Botones de Colapso**: Permiten contraer la paleta a un dock compacto de iconos o cerrar el panel derecho para maximizar la superficie del lienzo.

---

## 5. TUTORIAL PRÁCTICO INTEGRAL PASO A PASO

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
[ ACT-02: Notificación de Emplazamiento Legal ] ──> [ TMR-01: Plazo Fatal 5 Días ]
                                                             │
                                                             ▼
                                     [ DEC-01: ¿Presenta Descargo o Subsanación? ]
                                            ├── (Rama A: Regulariza) ──> [ SUB-01: Subproceso Regularización ] ──> [ FIN-01: Archivo ]
                                            │                                 │
                                            │                                 └──> [Paso 1: Plano Conforme a Obra]
                                            │                                      [Paso 2: Liquidación Derechos]
                                            │                                      [Paso 3: Pago en Caja y Libre Deuda]
                                            │
                                            └── (Rama B: Rebelde) ────> [ ACT-03: Sentencia de Clausura ] (Riesgo RSK-01) ──> [ FIN-02: Clausura ]
```

### PASO 1: Alta del Proyecto y Elección de Temática Base
1. En el Dashboard haga clic en **`Nuevo Proyecto`**. Complete el título, autor y unidad organizativa.
2. En la barra superior, haga clic en **`Temas y Colores`** y elija su temática base (ej: *Antigravity Cosmic*).
3. En la pestaña **`Fondo de la Pizarra`**, seleccione el color deseado para la parte de atrás del diagrama (ej: *Carbón Profundo* o un tono personalizado).

### PASO 2: Modelado, Personalización Cromática y Redimensionamiento
1. Arrastre los nodos desde la paleta izquierda.
2. Seleccione las tarjetas y personalice su color de fondo desde el panel derecho. Use la opción **`Aplicar a todas de tipo`** para dar un estilo visual coherente.
3. Conecte los flujos y ajuste el color y grosor de las flechas (activando el flujo animado si lo desea).
4. Redimensione cualquier tarjeta arrastrando desde las esquinas para ajustar la proporción.
5. En el nodo `SUB-01`, haga clic en **`Ampliar`** para cargar las tareas internas.

### PASO 3: Navegación y Reporte Oficial ISO 9001
1. En el menú derecho (`Navegador`), haga clic en `SUB-01` para comprobar el **zoom y centrado automático**.
2. Presione `Ctrl + S` para guardar en `Proyectos/`.
3. Acceda a la **Ficha Técnica ISO 9001** y descargue el PDF oficial.

---

## 6. MANTENIMIENTO, COPIAS DE SEGURIDAD Y RESPALDOS USB

* Todos los proyectos residen en:
  ```text
  MiAppProcesos_USB/Proyectos/
  ```
* Para realizar copias de seguridad, copie la carpeta `Proyectos/` a cualquier unidad externa o almacenamiento en la nube.

---
*ProcesosStudio Portable &bull; Conforme a las normas ISO/IEC 19510:2013 y Sistemas de Gestión de la Calidad ISO 9001:2015.*
