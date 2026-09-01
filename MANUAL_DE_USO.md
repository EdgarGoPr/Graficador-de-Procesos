# MANUAL DE USO Y GUÍA TÉCNICA INTEGRAL
## ProcesosStudio Portable — BPMN 2.0 (ISO 19510) & ISO 9001:2015
**Versión del Manual:** 2.1 &bull; **Fecha de Emisión:** 2026-09-01 &bull; **Entorno:** Portable Windows Desktop (`.EXE`) / Web

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL SISTEMA

**ProcesosStudio Portable** es una plataforma profesional concebida para el modelado, análisis, optimización y documentación formal de procedimientos administrativos y flujos operativos institucionales. Integra de manera nativa:

1. **Notación BPMN 2.0 (ISO/IEC 19510:2013)**: Estándar internacional para diagramación de flujos de procesos de negocio, soportando Macroprocesos y Subprocesos jerárquicos expandibles.
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

### C. Parámetros de Plazos y SLA (ISO 8601)
* **Lead Time**: Tiempo total transcurrido desde la recepción del trámite hasta su resolución final.
* **Tiempo de Ciclo Directo**: Sumatoria neta del tiempo de trabajo efectivo de las tareas.
* **Días Hábiles (`P`)**: Cómputo excluyendo sábados, domingos y feriados administrativos.
* **Horas Administrativas (`PT`)**: Jornadas horarias aplicadas a tareas específicas (ej: `PT4H` = 4 horas).
* **Plazo Perentorio / Fatal**: Término improrrogable cuyo vencimiento extingue de pleno derecho la potestad administrativa o el derecho del particular.

---

## 3. RECORRIDO INTEGRAL DE LA APLICACIÓN

### 3.1. Barra Superior de Control (Header)
* **Identificador de Proyecto**: Muestra el título, código formal, versión y autor del proceso abierto.
* **Pestañas de Navegación**:
  * `Proyectos USB`: Retorna al Dashboard de administración de archivos.
  * `Lienzo BPMN 2.0`: Espacio de modelado visual interactivo.
  * `Matriz SIPOC`: Tabla sincronizada de entradas, salidas y actores.
  * `Ficha Técnica ISO 9001`: Reporte ejecutivo estructurado con ordenamiento topológico y salida a PDF.
* **Botones de Acción**:
  * 🧭 **`Navegador`**: Abre el menú lateral derecho de navegación jerárquica de Macroprocesos y Subprocesos.
  * 📁 **`Ver Carpeta`**: Abre la carpeta `Proyectos/` directamente en el Explorador de Windows (o descarga el archivo en modo Web).
  * ☀️/🌙 **`Modo Claro / Oscuro`**: Conmuta el tema visual de la interfaz. En modo oscuro, el lienzo adopta un fondo gris carbón (`#18181B`) de alto contraste.
  * ➕ **`Nuevo`**: Abre el asistente de creación de nuevos procedimientos.
  * ⬇️ **`JSON`**: Descarga el archivo de datos del proyecto a su disco.
  * 💾 **`Guardar (Ctrl+S)`**: Guarda los cambios físicos en el archivo JSON.

---

### 3.2. Panel Lateral Derecho: Navegador Jerárquico & Propiedades
Ubicado a la derecha del lienzo, cuenta con dos pestañas intercambiables:

1. 🧭 **Pestaña "Navegador" (Estructura de Macroprocesos y Subprocesos)**:
   * **Tarjeta del Macroproceso**: Muestra el título, código formal, cantidad total de nodos, subprocesos y carriles. Al hacer clic o pulsar **"Macroproceso"**, la cámara centra suavemente todo el diagrama global.
   * **Sección de Subprocesos**: Lista todos los subprocesos modelados (ej: `SUB-01: Trámite de Subsanación`).
     * **Al hacer clic en un subproceso:** El sistema realiza un **desplazamiento y acercamiento suave (zoom animado)** centrando la pantalla exactamente sobre el subproceso en el lienzo.
     * **Botón "Ampliar":** Despliega el modal de detalle del subproceso para desglosar sus tareas internas paso a paso.
   * **Buscador y Filtros de Hitos**: Permite filtrar y localizar instantáneamente cualquier tarea, compuerta, control QC o evento del diagrama.
2. ⚙️ **Pestaña "Propiedades"**:
   * Formulario para editar identificadores, marco legal, duraciones SLA, insumos, entregables, checkpoints QC y matriz de riesgos del elemento seleccionado.

---

### 3.3. Subprocesos en el Macroproceso y Detalle Expandible
* **En el Macroproceso**:
  * El Subproceso se representa como un nodo azul con su icono característico de capas (`Layers`), su código identificador (`SUB-01`), el título y el conteo de etapas internas configuradas.
  * Incluye el botón interactivo **`Ampliar ↗`**.
* **Al Seleccionar "Ampliar"**:
  * Se abre el **Visualizador de Detalle del Subproceso** con la ruta de navegación (*Breadcrumb*):
    `Macroproceso > Subproceso: [SUB-01] Nombre`
  * Permite listar, agregar y eliminar las **etapas internas secuenciales** (Paso 1, Paso 2, Paso 3...), asignando a cada una su rol ejecutor, sistema TI y duración.
  * Cuenta con el botón **`Enfocar en Lienzo`** para dirigir la cámara directamente a la posición del subproceso en el diagrama global.

---

### 3.4. Matriz SIPOC Sincronizada
* Cruce automático en tiempo real de todos los nodos del lienzo.
* Identifica Proveedores (S), Insumos (I), Etapa del Proceso (P), Entregables (O), Clientes (C), Sistemas TI y Controles.
* Botón **`Exportar CSV`**: Genera un archivo `.csv` compatible con Excel para reportes gerenciales.

---

### 3.5. Ficha Técnica Formal ISO 9001
* Aplica un algoritmo de **Ordenamiento Topológico (DAG)** para resolver dependencias y ordenar las tareas cronológicamente (Paso 1, Paso 2, Paso 3...).
* Genera un documento técnico formal que consolida:
  * Encabezado institucional y control documental.
  * Objetivo declarativo y marco normativo consolidado.
  * Resumen ejecutivo de tiempos de ciclo y plazos de prescripción extintiva.
  * Matriz de responsabilidades y sistemas informáticos.
  * Secuencia operativa cronológica paso a paso.
  * Matriz de riesgos operativos y mitigaciones (Cláusula 6.1).
  * Matriz de compuertas y reglas de decisión.
  * Historial formal de revisiones y bloques de firma técnica.
* Botón **`Imprimir / Guardar en PDF`**: Formatea el reporte para impresión o guardado como PDF vectorial oficial.

---

## 4. TUTORIAL PRÁCTICO: MODELADO INTEGRAL DE UN PROCESO CON SUBPROCESOS

### 🏢 Caso de Estudio: *"Procedimiento de Fiscalización y Trámite Sancionatorio por Obras Clandestinas"*
* **Código:** `PRC-OBR-001`
* **Unidad Organizativa:** `Dirección de Obras Privadas / Tribunal Municipal de Faltas`
* **Autor:** `Ing. Carlos Mendoza (Auditor de Procesos ISO 9001)`

En este tutorial implementaremos **todos los componentes del sistema**, incluyendo la creación y navegación de subprocesos:

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

---

### PASO 1: Creación del Proyecto
1. En el Dashboard principal, haga clic en el botón **`Nuevo Proyecto`**.
2. Ingrese los siguientes datos:
   * **Título:** `Procedimiento Sancionatorio por Obras Clandestinas`
   * **Responsable / Autor:** `Ing. Carlos Mendoza (Auditor de Procesos)`
   * **Unidad Organizativa:** `Dirección de Obras Privadas / Tribunal de Faltas`
3. Haga clic en **`Crear Proyecto`**. El sistema lo dirigirá automáticamente al Lienzo BPMN.

---

### PASO 2: Modelado de Nodos y Configuración de Propiedades

#### 1. Evento de Inicio (`INI-01`)
* Arrastre un **Evento de Inicio** (verde) al primer carril (*Mesa de Entradas / Inspectoría*).
* En el panel derecho configure:
  * **ID Estándar:** `INI-01`
  * **Título:** `Acta de Infracción por Obra Clandestina`
  * **Descripción:** `Ingreso formal del acta labrada en operativo de fiscalización en vía pública.`

#### 2. Tarea de Usuario (`ACT-01`) y Control QC (`QC-01`)
* Arrastre una **Tarea de Usuario** (azul) y conéctela desde `INI-01`.
  * **ID:** `ACT-01` | **Título:** `Cotejo Catastral y Verificación de Planos` | **Sistema:** `SAM / Catastro Web`
* Arrastre un **Punto de Control QC** (rombo verde) y conéctelo desde `ACT-01`.
  * **ID:** `QC-01` | **Criterio:** `Auditoría de firma de inspector y plano catastral aprobado`.

#### 3. Notificación (`ACT-02`) y Timer (`TMR-01`)
* Arrastre una **Tarea de Usuario** al carril de notificaciones:
  * **ID:** `ACT-02` | **Título:** `Cédula de Emplazamiento Legal` | **Plazo:** `5 Días Hábiles (Perentorio)`.
* Arrastre un **Evento de Temporización** (`TMR-01`) asociado a los 5 días.

#### 4. Compuerta de Decisión (`DEC-01`)
* Arrastre una **Compuerta Exclusiva** (`DEC-01`: *Evaluación de Presentación de Descargo*).

#### 5. Creación y Desglose del Subproceso (`SUB-01`)
* Arrastre un **Subproceso** (azul) al carril administrativo y conéctelo desde `DEC-01`.
* En la flecha conectora escriba: `Admite trámite / Presenta plano de subsanación`.
* En el nodo `SUB-01`:
  * **ID:** `SUB-01` | **Título:** `Trámite de Subsanación y Pago Voluntario`.
* Haga clic en el botón **`Ampliar`** en el nodo o en el menú derecho.
* En el modal de detalle, agregue las etapas internas del subproceso:
  1. `Paso 1: Presentación de Plano Conforme a Obra` (Rol: Profesional Matriculado, Sistema: Obras Web).
  2. `Paso 2: Liquidación de Derechos de Construcción y Multa Voluntaria` (Rol: Liquidador, Sistema: SAM).
  3. `Paso 3: Pago en Caja y Emisión de Libre Deuda Contravencional` (Rol: Cajero, Sistema: Tesorería).
* Cierre el modal. El nodo ahora muestra `3 etapas internas`.
* Conecte la salida de `SUB-01` hacia un **Evento de Fin** (`FIN-01`: *Expediente Regularizado y Archivado*).

#### 6. Rama Sancionatoria (`ACT-03`), Riesgo (`RSK-01`) y Fin 2 (`FIN-02`)
* Conecte la otra rama de `DEC-01` a `ACT-03` (*Emisión de Sentencia Condenatoria y Clausura*).
* Registre el riesgo operativo `RSK-01` (*Ruptura indebida de faja de clausura*) con su control mitigante.
* Conecte a `FIN-02` (*Clausura Efectiva y Liquidación de Multa*).

---

### PASO 3: Uso del Navegador Jerárquico
1. En el panel derecho, haga clic en la pestaña **`Navegador`** (o presione el botón `Navegador` en el Header).
2. Observe la jerarquía:
   * **Macroproceso:** Haga clic para centrar la vista global del diagrama.
   * **Subprocesos:** Haga clic sobre `SUB-01: Trámite de Subsanación`. Notará que el sistema hace **smooth zoom** y centra la cámara sobre el subproceso.
   * Haga clic en **`Ampliar`** para revisar sus etapas internas.
   * Utilice los filtros rápidos (`Tareas`, `Decisiones`, `Calidad QC`) para navegar a cualquier nodo del flujo al instante.

---

### PASO 4: Guardado y Generación de Ficha Técnica Oficial
1. Presione **`Ctrl + S`** para guardar el proyecto.
2. Vaya a **`Matriz SIPOC`** para verificar la tabla cruzada de insumos y salidas.
3. Vaya a **`Ficha Técnica ISO 9001`** para revisar el informe estructurado por ordenamiento topológico y haga clic en **`Imprimir / Guardar en PDF`** para obtener el documento formal de auditoría.

---

## 5. MANTENIMIENTO, COPIAS DE SEGURIDAD Y PREGUNTAS FRECUENTES

### ¿Dónde se almacenan mis proyectos?
* En la aplicación de escritorio portable (`ProcesosStudio.exe`), se guardan físicamente en la carpeta:
  ```text
  MiAppProcesos_USB/Proyectos/
  ```
* En la versión web (`http://localhost:5173/`), se guardan en el `localStorage` del navegador y pueden descargarse individualmente con el botón **`JSON`**.

### ¿Cómo hacer un backup completo?
Simplemente copie la carpeta `Proyectos/` a otro dispositivo, disco externo o almacenamiento en la nube. Al restaurarla en cualquier otra copia de ProcesosStudio, todos los diagramas y fichas técnicas se cargarán de forma instantánea.

---
*ProcesosStudio Portable &bull; Conforme a las normas ISO/IEC 19510:2013 y Sistemas de Gestión de la Calidad ISO 9001:2015.*
