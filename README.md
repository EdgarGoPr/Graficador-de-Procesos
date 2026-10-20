# ProcesStudio Portable (BPMN 2.0 & ISO 9001:2015)

Aplicación de escritorio **100% portable** para Windows (ejecutable desde pendrive USB mediante `ProcesStudio.exe` o `ProcesStudio.bat` sin instaladores ni privilegios de administrador ni escritura en `%APPDATA%` ni en el registro de Windows), diseñada para el modelado, diagnóstico, compresión jerárquica y documentación técnica de procesos administrativos, sancionatorios y legales complejos.

---

## 1. Matriz de Cumplimiento de Estándares Internacionales

| Estándar | Aplicación en la Arquitectura | Implementación Concreta |
| :--- | :--- | :--- |
| **ISO/IEC 11179** | Estructura de Metadatos y Nomenclatura | Código técnico en inglés con tipado estricto: `camelCase` para variables/JSON, `PascalCase` para componentes y tipos, `UPPER_SNAKE_CASE` para enums. |
| **ISO 8601** | Fechas, Tiempos y Duraciones SLA | Formato UTC extendido (`YYYY-MM-DDTHH:mm:ssZ`) y cómputo de plazos (`P10D`, `PT48H`), distinguiendo días hábiles administrativos de días corridos. |
| **ISO/IEC 19510 (BPMN 2.0)** | Taxonomía y Modelado de Procesos | Nodos estándar: `StartEvent`, `EndEvent`, `UserTask`, `ServiceTask`, `ManualTask`, `ExclusiveGateway` (XOR), `ParallelGateway` (AND), `TimerBoundaryEvent`, `SubProcess`, `Pool` y `Swimlane`. |
| **ISO 9001:2015** | Enfoque de Procesos y Gestión de Riesgos | Matriz SIPOC sincronizada en tiempo real (Cláusula 4.4), Puntos de Control/Inspección (`QualityCheckpointEvent`), Matriz de Riesgos Operativos y Mitigaciones (Cláusula 6.1). |
| **POSIX / Portable-Safe** | Nomenclatura de Archivos en Disco | Nombres en disco normalizados en minúsculas, sin acentos ni espacios: `YYYY-MM-DD_proc-[nombre]-v[version].json`. |

---

## 2. Estructura del Sistema de Archivos en el Pendrive USB

```text
MiAppProcesos_USB/
├── ProcesStudio.exe             <-- Lanzador portable directo para Windows (Isotipo PS)
├── ProcesStudio_Mac.command     <-- Lanzador nativo 1-clic para macOS
├── MANUAL_DE_USO.pdf            <-- Manual de uso y referencia técnica oficial
├── App/
│   ├── ProcesStudio.bat         <-- Script de respaldo para Windows
│   ├── main.cjs                 <-- Entrypoint Electron (Zero-AppData)
│   ├── preload.cjs              <-- Bridge IPC seguro con FS local relativo
│   └── dist/                    <-- Build estático optimizado de Vite
└── Proyectos/
    ├── 2026-09-01_proc-descargos-transito-v1.json  <-- Archivo JSON independiente
    └── 2026-09-01_proc-tribunal-faltas-v1.json
```

---

## 3. Módulos y Capacidades del Sistema

### A. Control Documental y Versiones (Sin Cuentas de Usuario)
- Control formal de versiones (`v1.0`, `v1.1`), autor/analista técnico, unidad organizativa y marco normativo consolidado.
- Historial formal de cambios y tabla de firmas técnicas de responsabilidad.

### B. Gestor de Múltiples Proyectos (Dashboard)
- Exploración y lectura directa de archivos `.json` ubicados en `../Proyectos/`.
- Vista de tarjetas con cálculo automático de **Lead Time** total, conteo de nodos, puntos de calidad ISO 9001 y riesgos operativos.
- Acciones: Crear nuevo proyecto, abrir, duplicar, eliminar y exportar a JSON.
- Guardado rápido mediante **`Ctrl+S`** con indicador visual de estado.

### C. Lienzo BPMN 2.0 con Swimlanes y Drag & Drop
- Delimitación visual de carriles por rol o área (ej. *Mesa de Entradas*, *Juzgado de Faltas*, *Inspectores*, *Administrado*).
- Paleta lateral de nodos arrastrables categorizados.
- Conectores dirigidos con etiquetas condicionales visibles.
- Zoom, minimapa, rejilla inteligente y atajos (`Delete`/`Backspace`).

### D. Panel Contextual de Propiedades y Calidad
- Configuración de ID estándar (ej. `TSK-01`, `QC-01`, `GTW-01`, `TMR-01`).
- Asignación de rol, carril y sistema informático (SAM, VUPRA, Expediente Electrónico, etc.).
- Plazos perentorios y SLA bajo ISO 8601.
- Insumos requeridos (Inputs) y Entregables formalizados (Outputs).
- Registro de riesgos operativos con sus respectivos controles mitigantes obligatorios.

### E. Matriz SIPOC Sincronizada en Tiempo Real
- Extracción automática de Proveedores (S), Insumos (I), Procesos (P), Salidas (O) y Clientes (C) a partir del grafo.
- Exportación directa a CSV.

### F. Ficha Técnica Procesal (Cero Relleno)
- **Algoritmo de Ordenamiento Topológico** (Kahn's Algorithm) para computar la secuencia real de ejecución paso a paso.
- Tabla cronológica exhaustiva (ID, Tarea, Responsable, Sistema TI, Plazo SLA, Precondición, Entregable y Marco Legal).
- Matriz de Riesgos y Puntos de Control ISO 9001.
- Matriz de Puntos de Decisión y Bifurcación.
- Soporte nativo para **Impresión / Guardar en PDF** con diseño editorial de alta fidelidad.

---

## 4. Instrucciones de Instalación y Ejecución

### Prerrequisitos (Entorno de Desarrollo):
- Node.js LTS (v18+)
- npm

### Pasos para Desarrollo Local:
1. Abrir terminal en la carpeta del proyecto:
   ```bash
   cd C:\Users\egdep\.gemini\antigravity-ide\scratch\procesos-studio-portable
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```
4. Abrir en el navegador: `http://localhost:5173/`

### Pasos para Generar el Paquete Portable para Pendrive USB:
1. Compilar el paquete completo y sincronizar:
   ```bash
   npm run build
   ```
2. La carpeta `MiAppProcesos_USB/` ya queda 100% sincronizada y lista.
3. Copiar la carpeta `MiAppProcesos_USB` directamente al pendrive USB o disco externo.
4. En cualquier PC con Windows, hacer doble clic en `ProcesStudio.exe`.

---

## 5. Acceso Web Universal desde Cualquier Computador (GitHub Pages)

ProcesStudio cuenta con despliegue web automatizado en la nube mediante **GitHub Pages**, lo que permite utilizar el sistema desde cualquier computadora (en la oficina, en casa, notebook personal o tablet) sin requerir instalación y sin depender de la red local ni de que la PC municipal esté encendida.

- **URL de Acceso Web:** `https://edgargopr.github.io/Graficador-de-Procesos/`
- **Sincronización Multi-Equipo:**
  - **Importar:** En el Dashboard principal, haz clic en **"Importar JSON"** para cargar cualquier archivo `.json` proveniente de la PC municipal o un pendrive.
  - **Exportar:** En la tarjeta de cada proyecto o desde el lienzo, haz clic en **"Descargar JSON"** para guardar una copia y llevarla a la versión USB portable.
- **Configuración de GitHub Pages (Sólo la primera vez en GitHub):**
  1. En el repositorio de GitHub, ve a **Settings** > **Pages**.
  2. En **Build and deployment** > **Source**, selecciona **GitHub Actions**.
  3. Cada vez que se haga `git push` a `main`, el sistema se actualizará y publicará de forma automática en pocos segundos.

