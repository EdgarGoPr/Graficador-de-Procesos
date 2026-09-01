# MANUAL DE USO Y GUÍA TÉCNICA INTEGRAL
## ProcesosStudio Portable — BPMN 2.0 (ISO 19510) & ISO 9001:2015
**Versión del Manual:** 2.7 &bull; **Fecha de Emisión:** 2026-09-01 &bull; **Entorno:** Portable Windows Desktop (`.EXE`) / Web

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL SISTEMA

**ProcesosStudio Portable** es una plataforma profesional concebida para el modelado, análisis, optimización, personalización cromática y documentación formal de procedimientos administrativos y flujos operativos institucionales. Integra de manera nativa:

1. **Notación BPMN 2.0 (ISO/IEC 19510:2013)**: Diagramación formal de procesos, compresión y descompresión bidireccional de Subprocesos y Macroprocesos, redimensionamiento libre y proporcional de tarjetas.
2. **Compresión y Descompresión con Geometría Relativa**:
   * **Compresión (Encapsular):** Captura un snapshot de las distancias espaciales relativas y conexiones internas de los nodos seleccionados.
   * **Descompresión en Posición Actual:** Si mueve el nodo del Subproceso y lo descomprime, **las tarjetas reaparecen conservando exactamente la misma disposición original**, posicionadas en el nuevo lugar del Subproceso.
   * **Movimiento en Bloque Sincronizado:** Tras descomprimir, **todas las tarjetas se mantienen seleccionadas como un solo bloque**, permitiendo moverlas juntas hasta hacer clic fuera de la selección en el lienzo.
3. **Portapapeles Integral de Procesos (`Ctrl + C` / `Ctrl + V`)**: Copiado y pegado de tarjetas individuales, selecciones múltiples y Subprocesos completos con todas sus tareas internas.
4. **Persistencia Total y Autoguardado en Segundo Plano**: Disposiciones espaciales `(X, Y)`, dimensiones, colores de tarjetas y conexiones guardados en tiempo real en los archivos JSON de `../Proyectos/`.
5. **Personalización Cromática Integral y Herencia de Temáticas**: Fondos de pizarra personalizables sin bloqueos blancos y catálogo de temáticas Antigravity IDE.

### 💾 Arquitectura Portable USB (Zero-AppData & Zero-Registry)
* **Ejecutable Directo (`ProcesosStudio.exe`)**: Inicia la aplicación con un solo clic.
* **Persistencia Abierta en JSON**: Cada proyecto se guarda como un archivo de texto estructurado en la subcarpeta `../Proyectos/`.
* **Portabilidad Total**: Funciona en cualquier pendrive o PC con Windows 10/11 sin instalaciones ni permisos de administrador.

---

## 2. COMPRESIÓN, DESCOMPRESIÓN Y DISPOSICIÓN RELATIVA

### 2.1. Compresión de Actividades en un Subproceso (Agrupar)
1. **Selección Múltiple:** Arrastre un recuadro de selección sobre las tarjetas deseadas o mantenga presionado `Shift` y haga clic en cada nodo.
2. **Barra de Acciones Flotante:** Aparecerá el botón **`📦 Comprimir en Subproceso`**.
3. **Validación BPMN 2.0 (Entrada y Salida Única):** El sistema verificará que el conjunto seleccionado tenga una sola flecha entrante desde el exterior y una sola flecha saliente hacia el exterior.
4. **Snapshot Geométrico:** El sistema guarda la posición relativa de cada tarjeta con respecto al centro del bloque.

---

### 2.2. Descompresión con Disposición Relativa y Movimiento en Bloque
* **Descompresión en el Lienzo (`📂 Descomprimir`):** Al hacer clic en el botón de descompresión:
  1. El sistema recupera la **geometría espacial relativa exacta** de las tarjetas originales.
  2. Despliega todas las tarjetas en la **posición actual donde se encuentra el Subproceso**.
  3. Reconstruye las conexiones internas y reconecta las flechas exteriores de entrada y salida.
  4. **Selección Activa en Bloque:** Todas las tarjetas quedan seleccionadas simultáneamente. Al arrastrar cualquiera de ellas, **todo el bloque se desplaza de forma sincronizada**, manteniéndose agrupado hasta que haga clic en un espacio vacío del lienzo.

---

### 2.3. Copiar y Pegar Nodos y Subprocesos (`Ctrl + C` / `Ctrl + V`)
* **Atajos de Teclado:** Seleccione uno o varios nodos y presione `Ctrl + C` para copiar y `Ctrl + V` para pegar.
* **Preservación Integral:** Al copiar un Subproceso, se duplican todas sus etapas internas, roles y sistemas informáticos asociados, asignando nuevos identificadores correlativos.

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
| 🔵 | **Subproceso (Sub-Process)** | `#3B82F6` | **Actividad compuesta que encapsula un procedimiento secundario.** Permite compresión y descompresión bidireccional con geometría relativa. |
| 🟡 | **Evento de Temporización (Timer Event)** | `#F59E0B` | Límite temporal reglamentario que fija plazos perentorios (ISO 8601). |
| 🟢 | **Punto de Control de Calidad (Quality Checkpoint QC)** | `#10B981` | Hito de verificación formal bajo norma ISO 9001 con evidencia obligatoria. |
| 🔴 | **Evento de Fin (End Event)** | `#EF4444` | Culminación o estado terminal del flujo (ej: *Expediente Archivado*). |
| ➖ | **Flujo de Secuencia (Sequence Flow)** | Configurable | Flecha direccional con soporte para etiquetas, colores, grosores y animación. |
| 🏊 | **Carriles (Swimlanes) y Pools** | Adaptable | Bandas horizontales que representan unidades funcionales y sistemas TI. |

---

## 4. TUTORIAL PRÁCTICO: COMPRESIÓN, TRASLADO Y DESCOMPRESIÓN

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

### PASO 1: Selección y Compresión
1. Dibuje las 3 tareas de regularización (*Plano*, *Liquidación*, *Pago*).
2. Selecciónelas arrastrando el ratón y presione **`📦 Comprimir en Subproceso`**. El sistema guardará la distribución geométrica relativa y creará el nodo `SUB-01`.

### PASO 2: Traslado y Descompresión en Bloque
1. Mueva la tarjeta del Subproceso `SUB-01` a cualquier otro sector del lienzo.
2. Haga clic en **`Descomprimir`**: las 3 tarjetas reaparecerán en la nueva ubicación conservando exactamente la misma disposición espacial original.
3. Todas las tarjetas estarán seleccionadas para que pueda moverlas en bloque hasta hacer clic fuera del conjunto.

---

## 5. MANTENIMIENTO, COPIAS DE SEGURIDAD Y RESPALDOS USB

* Todos los proyectos residen en:
  ```text
  MiAppProcesos_USB/Proyectos/
  ```
* Para respaldar su trabajo, copie la carpeta `Proyectos/` a cualquier unidad externa.

---
*ProcesosStudio Portable &bull; Conforme a las normas ISO/IEC 19510:2013 y Sistemas de Gestión de la Calidad ISO 9001:2015.*
