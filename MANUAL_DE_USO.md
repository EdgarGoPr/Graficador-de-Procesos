# MANUAL DE USO Y GUÍA TÉCNICA INTEGRAL
## ProcesosStudio Portable — BPMN 2.0 (ISO 19510) & ISO 9001:2015
**Versión del Manual:** 2.8 &bull; **Fecha de Emisión:** 2026-09-01 &bull; **Entorno:** Portable Windows Desktop (`.EXE`) / Web

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL SISTEMA

**ProcesosStudio Portable** es una plataforma profesional concebida para el modelado, análisis, optimización, personalización cromática y documentación formal de procedimientos administrativos y flujos operativos institucionales. Integra de manera nativa:

1. **Notación BPMN 2.0 (ISO/IEC 19510:2013)**: Diagramación formal de procesos, compresión y descompresión bidireccional de Subprocesos y Macroprocesos, redimensionamiento libre y proporcional de tarjetas.
2. **Conservación Total de Tipos de Nodos y Colores de Conectores**:
   * **Inmutabilidad de Tarjetas:** Todos los tipos de componentes (`StartEvent`, `EndEvent`, `ExclusiveGateway`, `ParallelGateway`, `QualityCheckpointEvent`, `TimerBoundaryEvent`, `UserTask`, `ServiceTask`, `ManualTask`) conservan íntegramente su tipo de nodo, íconos, formas y propiedades tras ser comprimidos y descomprimidos.
   * **Inmutabilidad de Conectores:** Los colores personalizados (`strokeColor`), grosores (`strokeWidth`) y animaciones (`isAnimated`) de todas las conexiones (externas e internas) se preservan inalterables.
   * **Descompresión en Posición Actual:** Las tarjetas reaparecen conservando su geometría relativa original en la nueva ubicación del Subproceso.
   * **Movimiento en Bloque Sincronizado:** Tras descomprimir, todas las tarjetas permanecen seleccionadas permitiendo moverlas en bloque hasta hacer clic fuera.
3. **Portapapeles Integral de Procesos (`Ctrl + C` / `Ctrl + V`)**: Copiado y pegado de tarjetas individuales, selecciones múltiples y Subprocesos completos con todas sus tareas internas.
4. **Persistencia Total y Autoguardado en Segundo Plano**: Disposiciones espaciales `(X, Y)`, dimensiones, colores de tarjetas y conexiones guardados en tiempo real en los archivos JSON de `../Proyectos/`.
5. **Personalización Cromática Integral y Herencia de Temáticas**: Fondos de pizarra personalizables sin bloqueos blancos y catálogo de temáticas Antigravity IDE.

### 💾 Arquitectura Portable USB (Zero-AppData & Zero-Registry)
* **Ejecutable Directo (`ProcesosStudio.exe`)**: Inicia la aplicación con un solo clic.
* **Persistencia Abierta en JSON**: Cada proyecto se guarda como un archivo de texto estructurado en la subcarpeta `../Proyectos/`.
* **Portabilidad Total**: Funciona en cualquier pendrive o PC con Windows 10/11 sin instalaciones ni permisos de administrador.

---

## 2. REGLAS DE COMPRESIÓN, DESCOMPRESIÓN Y CONECTORES

### 2.1. Conservación de Todos los Tipos de Nodos
Al comprimir una selección de elementos que incluya un **Evento de Inicio (Start Event)**, un **Evento de Fin (End Event)**, una **Compuerta de Decisión (Gateway)** o un **Punto de Control (QC)**:
* El sistema guarda el tipo exacto de cada componente en el snapshot espacial.
* Al presionar **`📂 Descomprimir`**, cada tarjeta se restaura con su tipo original:
  * 🟢 **Eventos de Inicio:** Círculo verde con ícono de Play y salida de flujo.
  * 🔴 **Eventos de Fin:** Círculo rojo con ícono de Stop y entrada de flujo.
  * 🟡 **Compuertas XOR / AND:** Rombos de decisión con etiquetas de condición.
  * 🟢 **Puntos de Control QC:** Escudo de verificación y datos ISO 9001.
  * 🔵 **Tareas de Usuario / Servicio:** Tarjetas operativas con roles y sistemas.

---

### 2.2. Inmutabilidad Cromática en Conectores
* Los colores asignados a las conexiones (*cian, azul eléctrico, esmeralda, ámbar, rojo, púrpura o tonos personalizados*), sus grosores de línea y estados de animación de flujo se mantienen **100% inalterables** antes, durante y después del proceso de compresión y descompresión.

---

### 2.3. Descompresión con Disposición Relativa y Movimiento en Bloque
* Las tarjetas reaparecen respetando la **distribución geométrica relativa original** en el lugar exacto donde se encuentra el Subproceso.
* Todas las tarjetas quedan seleccionadas de forma conjunta para **desplazarlas en bloque** por el lienzo hasta hacer clic en el fondo de la pizarra.

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
1. Seleccione las actividades deseadas (incluso si incluye Evento de Inicio o Fin) y presione **`📦 Comprimir en Subproceso`**. El sistema preservará todos los tipos de nodos y colores de flechas.

### PASO 2: Descompresión
1. Al hacer clic en **`Descomprimir`**, todos los tipos de nodos reaparecen con su aspecto, colores y conexiones originales en la ubicación actual del Subproceso.

---

## 5. MANTENIMIENTO, COPIAS DE SEGURIDAD Y RESPALDOS USB

* Todos los proyectos residen en:
  ```text
  MiAppProcesos_USB/Proyectos/
  ```
* Para respaldar su trabajo, copie la carpeta `Proyectos/` a cualquier unidad externa.

---
*ProcesosStudio Portable &bull; Conforme a las normas ISO/IEC 19510:2013 y Sistemas de Gestión de la Calidad ISO 9001:2015.*
