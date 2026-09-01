# MANUAL DE USO Y GUÍA TÉCNICA INTEGRAL
## ProcesosStudio Portable — BPMN 2.0 (ISO 19510) & ISO 9001:2015
**Versión del Manual:** 2.2 &bull; **Fecha de Emisión:** 2026-09-01 &bull; **Entorno:** Portable Windows Desktop (`.EXE`) / Web

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL SISTEMA

**ProcesosStudio Portable** es una plataforma profesional concebida para el modelado, análisis, optimización y documentación formal de procedimientos administrativos y flujos operativos institucionales. Integra de manera nativa:

1. **Notación BPMN 2.0 (ISO/IEC 19510:2013)**: Estándar internacional para diagramación de flujos de procesos de negocio, soportando Macroprocesos y Subprocesos jerárquicos expandibles, con redimensionamiento dinámico y libre de tarjetas.
2. **Sistemas de Gestión de la Calidad (ISO 9001:2015)**: Cumplimiento directo de los requisitos de enfoque en procesos (Cláusula 4.4), pensamiento basado en riesgos (Cláusula 6.1), información documentada (Cláusula 7.5) y control de salidas no conformes / liberación de servicios (Cláusula 8.6).
3. **Cálculo de Tiempos SLA y Lead Time (ISO 8601)**: Cuantificación de plazos administrativos, tiempos de ciclo directo y límites perentorios de prescripción legal.

### 💾 Arquitectura Portable USB (Zero-AppData & Zero-Registry)
A diferencia de los programas tradicionales, **ProcesosStudio Portable** no requiere instaladores, privilegios de administrador ni runtime de Node.js instalado en el equipo del usuario:
* **Ejecutable Directo (`ProcesosStudio.exe`)**: Inicia la aplicación con un solo clic.
* **Persistencia Abierta en JSON**: Cada proyecto se guarda como un archivo de texto estructurado en la subcarpeta `../Proyectos/`.
* **Portabilidad Total**: Permite copiar la carpeta completa a cualquier memoria USB (Pendrive) y trabajar en cualquier computadora con Windows 10/11 manteniendo todos los proyectos sincronizados.

---

## 2. GLOSARIO DE CONCEPTOS Y REFERENCIA DE COMPONENTES

### A. Elementos BPMN 2.0 (ISO 19510) y Paleta Semántica
| Símbolo | Nombre Técnico | Color Hex | Significado y Aplicación en el Proceso |
| :--- | :--- | :--- | :--- |
| 🟢 | **Evento de Inicio (Start Event)** | `#10B981` | Disparador formal que da comienzo al procedimiento (ej: *Recepción de Acta*, *Ingreso de Denuncia*). |
| 🔵 | **Tarea de Usuario (User Task)** | `#3B82F6` | Tarea operativa realizada por un operador humano con asistencia de un sistema informático (ej: *Verificar Documentación*, *Elaborar Dictamen*). |
| 🔵 | **Tarea de Servicio (Service Task)** | `#3B82F6` | Proceso automatizado ejecutado íntegramente por un software (ej: *Cálculo automático de multas*, *Generación de código QR*). |
| 🟡 | **Tarea Manual (Manual Task)** | `#F59E0B` | Actividad física o de inspección en campo sin intervención de software en tiempo real (ej: *Inspección ocular de obra*, *Fijación de faja de clausura*). |
| 🟡 | **Compuerta Exclusiva (Exclusive Gateway - XOR)** | `#F59E0B` | Punto de decisión donde el flujo toma una única rama según la condición (ej: *¿Admite el trámite? Sí / No*). |
| 🟡 | **Compuerta Paralela (Parallel Gateway - AND)** | `#F59E0B` | Bifurcación simultánea donde se inician múltiples tareas concurrentes que luego deben converger. |
| 🔵 | **Subproceso (Sub-Process)** | `#3B82F6` | **Actividad compuesta que agrupa un procedimiento secundario detallado.** En el Macroproceso figura con su icono y nombre, y cuenta con un botón **"Ampliar"** para desglosar sus etapas internas. |
| 🟡 | **Evento de Temporización (Timer Boundary Event)** | `#F59E0B` | Límite temporal reglamentario que dispara una acción tras vencer un plazo legal. |
| 🟢 | **Punto de Control de Calidad (Quality Checkpoint QC)** | `#10B981` | Hito de verificación y auditoría formal bajo norma ISO 9001 con criterio y evidencia documental obligatoria. |
| 🔴 | **Evento de Fin (End Event)** | `#EF4444` | Culminación o estado terminal del flujo (ej: *Expediente Archivado*, *Sentencia Notificada*). |
| ➖ | **Flujo de Secuencia (Sequence Flow)** | `#38BDF8` / `#0284C7` | Flecha direccional que conecta dos nodos y puede contener etiquetas o condiciones lógicas de transición. |
| 🏊 | **Carriles (Swimlanes) y Pools** | `Gris / Azul` | Bandas horizontales que representan las unidades funcionales, roles responsables y sistemas TI intervinientes. |

---

### B. Gestión de Calidad (ISO 9001:2015)
* **Matriz SIPOC (Cláusula 4.4)**:
  * **S (Suppliers / Proveedores)**: Áreas o actores que entregan los insumos previos.
  * **I (Inputs / Insumos)**: Requisitos, actas, formularios o datos necesarios para ejecutar la etapa.
  * **P (Process / Proceso)**: La actividad o transformación efectuada en el nodo BPMN.
  * **O (Outputs / Salidas)**: Entregables, resoluciones, cédulas o constancias resultantes.
  * **C (Customers / Clientes)**: Receptores del producto o servicio (interno o ciudadano).
* **Gestión de Riesgos Operativos (Cláusula 6.1)**:
  * **Identificación del Riesgo**: Fallas potenciales que amenazan la eficacia, legalidad o continuidad del proceso (ej: *Caducidad de plazos por extravío de cédula*).
  * **Severidad / Impacto**: Nivel de criticidad (`BAJO`, `MEDIO`, `ALTO`, `CRÍTICO`).
  * **Control Mitigante Obligatorio**: Medida preventiva estandarizada para anular o minimizar la probabilidad del riesgo.
* **Control Documental y Trazabilidad (Cláusula 7.5)**:
  * **Código de Proceso**: Nomenclatura normalizada (ej: `PRC-OBR-001`).
  * **Versión y Fecha UTC**: Control estricto de revisiones (ej: `v1.0`).
  * **Historial de Cambios**: Registro auditado de modificaciones, autor y justificación técnica.

---

## 3. NOVEDADES: REDIMENSIONAMIENTO Y CONTROL DE PANELES

### 3.1. Redimensionamiento Libre y Proporcional de Tarjetas/Nodos
* Al hacer clic sobre cualquier nodo (Tarea, Subproceso o Punto de Control QC), se activan los **tiradores interactivos de redimensionamiento**.
* **Ajuste de Alto y Ancho**: Arrastre los bordes superior, inferior, izquierdo o derecho para ajustar el tamaño del bloque.
* **Ajuste Proporcional por Esquinas**: Al hacer clic y arrastrar sobre cualquiera de las **4 esquinas circulares**, la tarjeta se amplía o reduce en alto y largo de forma suave y proporcional.

### 3.2. Ajuste Manual con Ratón y Colapso de Paneles Laterales
* **Paleta de Modelado (Panel Izquierdo)**:
  * **Ajuste con Ratón**: Pase el cursor sobre el borde derecho de la paleta (cursor `↔`) y arrastre horizontalmente para ensanchar o reducir la barra (entre 180px y 460px).
  * **Botón de Colapso**: Haga clic en el botón `Contraer` en el encabezado para convertir la paleta en un **dock compacto de iconos**, ganando el máximo espacio en pantalla para el lienzo.
* **Navegador y Propiedades (Panel Derecho)**:
  * **Ajuste con Ratón**: Pase el cursor sobre el borde izquierdo del panel (cursor `↔`) y arrastre horizontalmente para ajustar su ancho (entre 260px y 680px).
  * **Botón de Colapso / Apertura**: Botón directo para cerrar o reabrir el panel, o conmutarlo desde el botón `Navegador` del Header.

---

## 4. RECORRIDO INTEGRAL DE LA APLICACIÓN

### 4.1. Barra Superior de Control (Header)
* **Identificador de Proyecto**: Muestra el título, código formal, versión y autor del proceso abierto.
* **Pestañas de Navegación**:
  * `Proyectos USB`: Retorna al Dashboard de administración de archivos.
  * `Lienzo BPMN 2.0`: Espacio de modelado visual interactivo.
  * `Matriz SIPOC`: Tabla sincronizada de entradas, salidas y actores.
  * `Ficha Técnica ISO 9001`: Reporte ejecutivo estructurado con ordenamiento topológico y salida a PDF.
* **Botones de Acción**:
  * 🧭 **`Navegador`**: Abre el menú lateral derecho de navegación jerárquica de Macroprocesos y Subprocesos.
  * 📁 **`Ver Carpeta`**: Abre la carpeta `Proyectos/` directamente en el Explorador de Windows.
  * ☀️/🌙 **`Modo Claro / Oscuro`**: Conmuta el tema visual. En modo oscuro, el lienzo adopta un fondo gris carbón (`#18181B`).
  * ➕ **`Nuevo`**: Asistente de creación de nuevos procedimientos.
  * ⬇️ **`JSON`**: Descarga el archivo de datos del proyecto a su disco.
  * 💾 **`Guardar (Ctrl+S)`**: Guarda los cambios físicos en el archivo JSON.

---

### 4.2. Panel Lateral Derecho: Navegador Jerárquico & Propiedades
Ubicado a la derecha del lienzo, cuenta con dos pestañas intercambiables:

1. 🧭 **Pestaña "Navegador" (Estructura de Macroprocesos y Subprocesos)**:
   * **Tarjeta del Macroproceso**: Muestra el título, código formal y total de elementos. Al hacer clic o pulsar **"Macroproceso"**, la cámara centra suavemente todo el diagrama global.
   * **Sección de Subprocesos**: Lista todos los subprocesos modelados (ej: `SUB-01: Trámite de Subsanación`).
     * **Al hacer clic en un subproceso:** El sistema realiza un **desplazamiento y acercamiento suave (smooth zoom animado)** centrando la pantalla exactamente sobre el subproceso en el lienzo.
     * **Botón "Ampliar":** Despliega el modal de detalle del subproceso para desglosar sus tareas internas paso a paso.
   * **Buscador y Filtros de Hitos**: Permite filtrar y localizar instantáneamente cualquier tarea, compuerta, control QC o evento del diagrama.
2. ⚙️ **Pestaña "Propiedades"**:
   * Formulario para editar identificadores, marco legal, duraciones SLA, insumos, entregables, checkpoints QC y matriz de riesgos del elemento seleccionado.

---

### 4.3. Subprocesos en el Macroproceso y Detalle Expandible
* **En el Macroproceso**:
  * El Subproceso se representa como un nodo azul con su icono característico de capas (`Layers`), su código identificador (`SUB-01`), el título y el conteo de etapas internas configuradas.
  * Incluye el botón interactivo **`Ampliar ↗`**.
* **Al Seleccionar "Ampliar"**:
  * Se abre el **Visualizador de Detalle del Subproceso** con la ruta de navegación (*Breadcrumb*):
    `Macroproceso > Subproceso: [SUB-01] Nombre`
  * Permite listar, agregar y eliminar las **etapas internas secuenciales** (Paso 1, Paso 2, Paso 3...), asignando a cada una su rol ejecutor, sistema TI y duración.
  * Cuenta con el botón **`Enfocar en Lienzo`** para dirigir la cámara directamente a la posición del subproceso en el diagrama global.

---

### 4.4. Matriz SIPOC Sincronizada
* Cruce automático en tiempo real de todos los nodos del lienzo.
* Identifica Proveedores (S), Insumos (I), Etapa del Proceso (P), Entregables (O), Clientes (C), Sistemas TI y Controles.
* Botón **`Exportar CSV`**: Genera un archivo `.csv` compatible con Excel para reportes gerenciales.

---

### 4.5. Ficha Técnica Formal ISO 9001
* Aplica un algoritmo de **Ordenamiento Topológico (DAG)** para resolver dependencias y ordenar las tareas cronológicamente (Paso 1, Paso 2, Paso 3...).
* Genera un documento técnico formal con encabezado, objetivo, tiempos de ciclo, matriz de riesgos, reglas de decisión y firmas técnicas.
* Botón **`Imprimir / Guardar en PDF`**: Formatea el reporte para impresión o guardado como PDF vectorial oficial.

---

## 5. TUTORIAL PRÁCTICO: MODELADO INTEGRAL PASO A PASO

### 🏢 Caso de Estudio: *"Procedimiento de Fiscalización y Trámite Sancionatorio por Obras Clandestinas"* (Código: `PRC-OBR-001`)

```
[ INI-01: Acta de Infracción ]
              │
              ▼
[ ACT-01: Cotejo Catastral y Digitalización ] (Sitema SAM)
              │
              ▼
[ QC-01: Verificación de Firma y Domicilio ] (Inspección ISO 9001)
              │
              ▼
[ ACT-02: Notificación de Emplazamiento Legal ] (Plazo: 5 Días Hábiles Perentorios)
              │
              ▼
[ TMR-01: Plazo Fatal de 5 Días Hábiles ]
              │
              ▼
[ DEC-01: Compuerta de Decisión: ¿Presenta Descargo o Subsanación? ]
       ├── (Rama A: Regulariza / Pago Voluntario) ──> [ SUB-01: Subproceso de Regularización ] ──> [ FIN-01: Archivo por Subsanación ]
       │                                                    │
       │                                                    └──> [Paso 1: Presentación de Plano Conforme a Obra]
       │                                                         [Paso 2: Liquidación de Derechos de Construcción]
       │                                                         [Paso 3: Pago en Caja y Emisión de Libre Deuda]
       │
       └── (Rama B: No Subsanado / Rebelde) ────────> [ ACT-03: Dictamen y Sentencia de Clausura ] (Riesgo RSK-01) ──> [ FIN-02: Clausura y Ejecución ]
```

### PASO 1: Alta del Proyecto
En el Dashboard haga clic en **`Nuevo Proyecto`**. Complete el título, autor y unidad organizativa.

### PASO 2: Modelado y Redimensionamiento
1. Arrastre los nodos desde la paleta izquierda.
2. Seleccione cualquier tarjeta para **redimensionarla desde las esquinas** o bordes según la extensión del texto o la jerarquía visual deseada.
3. Conecte los flujos y configure plazos legales y checkpoints QC.
4. En el nodo `SUB-01`, haga clic en **`Ampliar`** para cargar las tareas internas.

### PASO 3: Navegación y Calibración de Paneles
1. Ajuste el ancho de la paleta izquierda y del navegador derecho arrastrando los bordes divisorios.
2. En el menú `Navegador`, haga clic en `SUB-01` para comprobar el **zoom y centrado automático**.

### PASO 4: Guardado y Reportes
1. Presione `Ctrl + S` para guardar en `Proyectos/`.
2. Acceda a la **Ficha Técnica ISO 9001** y descargue el PDF oficial.

---

## 6. MANTENIMIENTO, COPIAS DE SEGURIDAD Y RESPALDOS USB

* Todos los proyectos residen en:
  ```text
  MiAppProcesos_USB/Proyectos/
  ```
* Para realizar copias de seguridad, copie la carpeta `Proyectos/` a cualquier unidad externa o nube.

---
*ProcesosStudio Portable &bull; Conforme a las normas ISO/IEC 19510:2013 y Sistemas de Gestión de la Calidad ISO 9001:2015.*
