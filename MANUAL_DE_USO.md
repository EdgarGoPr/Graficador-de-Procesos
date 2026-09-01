# MANUAL DE USO Y GUÍA TÉCNICA INTEGRAL
## ProcesosStudio Portable — BPMN 2.0 (ISO 19510) & ISO 9001:2015
**Versión del Manual:** 2.0 &bull; **Fecha de Emisión:** 2026-09-01 &bull; **Entorno:** Portable Windows Desktop (`.EXE`) / Web

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL SISTEMA

**ProcesosStudio Portable** es una plataforma profesional concebida para el modelado, análisis, optimización y documentación formal de procedimientos administrativos y flujos operativos institucionales. Integra de manera nativa:

1. **Notación BPMN 2.0 (ISO/IEC 19510:2013)**: Estándar internacional para diagramación de flujos de procesos de negocio.
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
| 🔵 | **Tarea de Servicio (Service Task)** | `#3B82F6` | Proceso automatizado ejecutado íntegramente por un sistema TI (ej: *Cálculo automático de multas*, *Generación de código QR*). |
| 🟡 | **Tarea Manual (Manual Task)** | `#F59E0B` | Actividad física o de inspección en campo sin intervención de software en tiempo real (ej: *Inspección ocular de obra*, *Fijación de faja de clausura*). |
| 🟡 | **Compuerta Exclusiva (Exclusive Gateway - XOR)** | `#F59E0B` | Punto de decisión donde el flujo toma una única rama según la condición (ej: *¿Admite el trámite? Sí / No*). |
| 🟡 | **Compuerta Paralela (Parallel Gateway - AND)** | `#F59E0B` | Bifurcación simultánea donde se inician múltiples tareas concurrentes que luego deben converger. |
| 🔵 | **Subproceso Embebido (Sub-Process)** | `#3B82F6` | Conjunto agrupado de actividades subordinadas que forman un procedimiento secundario autónomo. |
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
  * 📁 **`Ver Carpeta`**: Abre la carpeta `Proyectos/` directamente en el Explorador de Windows (o descarga el archivo en modo Web).
  * ☀️/🌙 **`Modo Claro / Oscuro`**: Conmuta el tema visual de la interfaz. En modo oscuro, el lienzo adopta un fondo gris carbón (`#18181B`) de alto contraste.
  * ➕ **`Nuevo`**: Abre el asistente de creación de nuevos procedimientos.
  * ⬇️ **`JSON`**: Descarga el archivo de datos del proyecto a su disco.
  * 💾 **`Guardar (Ctrl+S)`**: Guarda los cambios físicos en el archivo JSON.

---

### 3.2. Gestor de Proyectos (Dashboard USB)
* **Buscador en Tiempo Real**: Filtrado dinámico por título, código formal, autor o nombre de archivo.
* **Métricas en Tarjetas**:
  * Número de nodos BPMN.
  * **Lead Time** total estimado (en color ámbar `#F59E0B`).
  * Conteo de **Checkpoints de Calidad (QC)** (verde `#10B981`) y **Riesgos Mitigados** (rojo `#EF4444`).
* **Acciones Rápidas**: Abrir, Duplicar como nueva versión, Eliminar con confirmación y Revelar archivo en el Explorador de Windows.

---

### 3.3. Lienzo de Modelado BPMN 2.0 (Canvas)
* **Paleta Lateral**: Permite arrastrar (**Drag & Drop**) cualquier elemento al carril correspondiente.
* **Detección Automática de Carril**: Al soltar un nodo, se le asigna automáticamente la dependencia, rol y sistema TI del carril donde fue posicionado.
* **Conexión de Flujos**: Al hacer clic y arrastrar desde el tirador circular de un nodo hacia otro, se traza la flecha de secuencia.
* **MiniMapa & Zoom**: Navegación ágil para diagramas extensos con controles de ajuste de pantalla.
* **Atajos de Teclado**:
  * `Ctrl + S`: Guardar proyecto.
  * `Delete` / `Backspace`: Eliminar el nodo o flecha seleccionada.

---

### 3.4. Panel de Propiedades (Drawer)
Al seleccionar cualquier elemento del lienzo, se despliega el formulario lateral para configurar:
1. **Identificación**: Código estándar (ej: `ACT-01`), nombre operativo y descripción procedimental detallada.
2. **Carril y Rol**: Reasignación de carril y responsable funcional.
3. **Sistemas TI & Marco Legal**: Software informático interviniente y articulado normativo aplicable.
4. **Plazos SLA**: Valor numérico, unidad (Horas, Días Hábiles, Días Corridos) y casilla de *Plazo Perentorio*.
5. **Tipificación de Compuertas**: Selección de lógica de resolución (Sentencia, Pago voluntario, Archivo, etc.).
6. **Insumos y Salidas ISO 9001**: Gestión dinámica de requisitos y entregables formales.
7. **Punto de Control QC**: Criterio de inspección y evidencia obligatoria requerida.
8. **Matriz de Riesgos**: Alta de riesgos identificados y controles mitigantes obligatorios.

---

### 3.5. Matriz SIPOC Sincronizada
* Cruce automático en tiempo real de todos los nodos del lienzo.
* Identifica Proveedores (S), Insumos (I), Etapa del Proceso (P), Entregables (O), Clientes (C), Sistemas TI y Controles.
* Botón **`Exportar CSV`**: Genera un archivo `.csv` compatible con Excel para reportes gerenciales.

---

### 3.6. Ficha Técnica Formal ISO 9001
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

## 4. TUTORIAL PRÁCTICO: MODELADO INTEGRAL DE UN PROCESO COMPLETO

### 🏢 Caso de Estudio: *"Procedimiento de Fiscalización y Trámite Sancionatorio por Obras Clandestinas"*
* **Código:** `PRC-OBR-001`
* **Unidad Organizativa:** `Dirección de Obras Privadas / Tribunal Municipal de Faltas`
* **Autor:** `Ing. Carlos Mendoza (Auditor de Procesos ISO 9001)`

En este tutorial implementaremos **todos los componentes del sistema** paso a paso:

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
  * **Insumo:** `Acta física con duplicado y fotografías de la infracción.`
  * **Salida:** `Expediente digital caratulado.`

#### 2. Tarea de Usuario (`ACT-01`)
* Arrastre una **Tarea de Usuario** (azul) a la derecha del inicio y conecte `INI-01` con la tarea.
* Configure en el panel derecho:
  * **ID Estándar:** `ACT-01`
  * **Título:** `Cotejo Catastral y Verificación de Planos`
  * **Sistema TI:** `SAM / Catastro Web`
  * **Marco Legal:** `Ord. 12.850 Art. 8 / Código de Edificación`
  * **Duración:** `2 Días Hábiles` (Plazo Perentorio: No)
  * **Insumo:** `Expediente digital caratulado`
  * **Salida:** `Informe técnico de estado de obra`

#### 3. Punto de Inspección de Calidad ISO 9001 (`QC-01`)
* Arrastre un **Punto de Control QC** (rombo verde) y conéctelo desde `ACT-01`.
* Configure en el panel derecho:
  * **ID Estándar:** `QC-01`
  * **Título:** `Auditoría de Requisitos Formales del Acta`
  * **Criterio de Inspección:** `Verificar validez de firma del inspector matriculado, fecha cierta y empadronamiento catastral correcto.`
  * **Evidencia Requerida:** `Acta rubricada con código QR de trazabilidad.`

#### 4. Tarea de Notificación Legal (`ACT-02`) y Timer (`TMR-01`)
* Arrastre una **Tarea de Usuario** al carril de *Asesoría Legal / Notificaciones* y conéctela desde `QC-01`.
  * **ID Estándar:** `ACT-02`
  * **Título:** `Cédula de Emplazamiento y Notificación Legal`
  * **Sistema TI:** `VUPRA / Expediente Digital`
  * **Marco Legal:** `Ord. 12.850 Art. 24 (Plazo Improrrogable)`
  * **Duración:** `5 Días Hábiles` (Marcar casilla: **Plazo Perentorio / Fatal**)
  * **Salida:** `Cédula notificada con constancia de entrega.`
* Arrastre un **Evento de Temporización** (`TMR-01`) y conéctelo desde `ACT-02`:
  * **Título:** `Vencimiento Fatal de 5 Días para Descargo`

#### 5. Compuerta de Decisión Exclusiva (`DEC-01`)
* Arrastre una **Compuerta Exclusiva** (rombo ámbar) y conéctela desde `TMR-01`.
* Configure en el panel derecho:
  * **ID Estándar:** `DEC-01`
  * **Título:** `Evaluación de Presentación de Descargo`
  * **Tipología:** `Sentencia / Multa Condenatoria`

#### 6. Rama A: Subproceso de Regularización (`SUB-01`) y Fin 1 (`FIN-01`)
* Arrastre un **Subproceso Embebido** (azul) al carril administrativo y conéctelo desde `DEC-01`.
* Haga clic sobre la flecha conectora y en el panel derecho escriba la condición: `Admite trámite / Presenta plano de subsanación`.
* Propiedades del Subproceso:
  * **ID Estándar:** `SUB-01`
  * **Título:** `Trámite de Subsanación y Pago Voluntario`
  * **Duración:** `10 Días Hábiles`
* Arrastre un **Evento de Fin** (`FIN-01`) y conéctelo desde `SUB-01`:
  * **Título:** `Expediente Regularizado y Archivado`

#### 7. Rama B: Tarea Resolutiva (`ACT-03`), Matriz de Riesgos y Fin 2 (`FIN-02`)
* Arrastre una **Tarea de Usuario** (`ACT-03`) al carril del *Juzgado de Faltas* y conéctela desde `DEC-01`.
* En la flecha conectora configure la condición: `No subsanado / Vencimiento sin descargo`.
* Propiedades de `ACT-03`:
  * **ID Estándar:** `ACT-03`
  * **Título:** `Emisión de Sentencia Condenatoria y Faja de Clausura`
  * **Marco Legal:** `Ord. 12.850 Art. 45 / Código de Faltas`
  * **Duración:** `3 Días Hábiles`
* **Alta de Riesgo Operativo (ISO 9001 Cláusula 6.1)**:
  * En el panel derecho de `ACT-03`, vaya a la sección *Matriz de Riesgos y Mitigaciones*.
  * Ingrese:
    * **Riesgo:** `Ruptura indebida de fajas de clausura y continuidad de obra clandestina.`
    * **Control Mitigante:** `Inspección de constatación a las 48 horas e inicio inmediato de denuncia penal por desobediencia.`
  * Haga clic en **`Registrar Riesgo y Mitigación`**.
* Arrastre un **Evento de Fin** (`FIN-02`) y conéctelo desde `ACT-03`:
  * **Título:** `Clausura Efectiva y Liquidación de Multa`

---

### PASO 3: Guardado y Persistencia
1. Presione la combinación de teclas **`Ctrl + S`** o haga clic en el botón verde **`Guardar`** de la barra superior.
2. El sistema confirmará el guardado en el archivo:
   ```text
   ../Proyectos/2026-09-01_proc-procedimiento-sancionatorio-por-obras-clandestinas-v1.0.json
   ```

---

### PASO 4: Auditoría en la Matriz SIPOC
1. En la barra superior, haga clic en la pestaña **`Matriz SIPOC`**.
2. Verifique la tabla consolidada:
   * Cada fila refleja con precisión el Proveedor (S), Insumo (I), Etapa (P), Salida (O), Cliente (C) y Sistema TI.
3. Haga clic en **`Exportar CSV`** para descargar la planilla y verificar su compatibilidad con Excel.

---

### PASO 5: Generación y Descarga de la Ficha Técnica ISO 9001 en PDF
1. Haga clic en la pestaña **`Ficha Técnica ISO 9001`**.
2. El sistema ejecutará el ordenamiento topológico automático presentando la secuencia paso a paso (Pasos 1 al 8), el Lead Time consolidado y la matriz de riesgos mitigados.
3. Haga clic en el botón **`Imprimir / Guardar en PDF`** en la esquina superior derecha.
4. En el diálogo de impresión de Windows, seleccione **"Guardar como PDF"** para obtener el documento oficial vectorizado de calidad profesional.

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
