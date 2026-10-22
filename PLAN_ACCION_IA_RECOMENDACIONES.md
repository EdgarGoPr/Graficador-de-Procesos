# Plan de Acción: Asistente de IA para Recomendaciones y Sugerencias de Continuación de Procesos (ProcesStudio)

Este documento establece la arquitectura integral, especificaciones funcionales, diseño de interfaz y hoja de ruta técnica para incorporar un **Motor de Inteligencia Artificial Contextual y Jerárquico** en **ProcesStudio**.

El sistema asiste al usuario durante el modelado de procesos recomendando de manera inteligente cuál es el próximo paso operativo a seguir, qué tipo de elemento BPMN corresponde, qué rol debe intervenir y cuál es la justificación normativa/operativa, evitando desvíos y alucinaciones gracias a un modelo de consulta por capas jerárquicas estrictas.

---

## 1. Visión y Objetivos del Asistente

1. **Recomendación Contextual Inteligente:** Facilitar el diseño de flujos BPMN 2.0 mediante predicciones fundamentadas del próximo nodo a partir de la documentación del proceso y el estado actual del lienzo.
2. **Jerarquía Estricta de Verdad (Cero Alucinaciones):** Garantizar que cualquier sugerencia esté validada prioritariamente por los documentos y audios propios de la institución antes de recurrir a fuentes externas.
3. **Ingesta Multimodal Flexible (Texto y Audio):** Permitir a los usuarios cargar reglamentos, manuales de procedimiento, transcripciones o grabar notas de voz directamente desde la aplicación.
4. **Interacción Ergonómica e Intuitiva:** Integrar la sugerencia de IA directamente en la rueda radial de opciones al agregar un nodo (`RadialNodeMenu`), manteniendo la fluidez del diseño visual.

---

## 2. Modelo de Decisión Jerárquico (Pirámide de Verdad)

Para evitar desvíos normativos o invenciones de procesos inexistentes, el motor de IA evalúa las sugerencias aplicando el siguiente orden de prelación irrompible:

```
           ▲
          / \     NIVEL 3: Búsqueda en Internet / Buenas Prácticas Generales
         /   \    (Solo en caso de vacíos, acotado estrictamente por N1 y N2)
        /-----\
       /       \    NIVEL 2: Grafo BPMN Actual y Metadatos del Proyecto
      /         \   (Nodos previos, actores, carriles, metas ISO 9001, orden temporal)
     /-----------\
    /             \   NIVEL 1: Documentación del Proceso (Máxima Autoridad)
   /_______________\  (Textos cargados, leyes, resoluciones y audios transcriptos)
```

### Detalle de Niveles de Prioridad:

1. **NIVEL 1 - Documentación del Proceso (Autoridad Suprema):**
   - **Contenido:** Manuales de procedimiento, ordenanzas, decretos, reglamentos internos y transcripciones completas de audios aportados por los usuarios.
   - **Regla:** Si la documentación describe de forma explícita o implícita el paso subsiguiente del procedimiento (ej. *"Una vez recepcionada la solicitud, el inspector labra el acta en un plazo de 48 hs"*), la IA **debe adoptar obligatoriamente** dicha acción como su recomendación prioritaria.

2. **NIVEL 2 - Grafo BPMN y Estado Actual del Diagrama:**
   - **Contenido:** Nodos ya diagramados, secuencia del camino recorrido hasta el nodo activo, carriles (`lanes`) definidos, conexiones previas y metadatos ISO 9001 (objetivo del proceso, unidad administrativa).
   - **Regla:** La IA utiliza este contexto estructural para determinar el tipo de compuerta lógica (XOR, AND), asegurar que no se dupliquen actividades ya concluidas y sugerir el carril o actor más coherente dentro del flujo ya trazado.

3. **NIVEL 3 - Búsqueda en Internet y Mejores Prácticas Generales (Último Recurso Condicionado):**
   - **Contenido:** Estándares BPMN 2.0 (ISO/IEC 19510), directrices ISO 9001:2015, y búsqueda web de patrones de procesos administrativos.
   - **Regla:** Se recurre a este nivel **únicamente** cuando en el Nivel 1 exista una laguna u omisión operativa. Toda sugerencia proveniente del Nivel 3 debe estar **anclada y condicionada** por los términos y objetivos de los Niveles 1 y 2, prohibiendo la introducción de pasos que contradigan la normativa aportada.

---

## 3. Módulo de Ingesta Documental y Captura de Audio

Para alimentar el Nivel 1 de la jerarquía, ProcesStudio incorporará un panel dedicado de **Bóveda Documental del Proceso** (`ProcessDocumentationVault`):

### 3.1 Ingreso de Documentación Escrita
- **Entrada Directa de Texto:** Editor con soporte de texto plano y Markdown para pegar extractos de normativas, manuales o notas de campo.
- **Carga de Archivos de Texto:** Importación de archivos `.txt`, `.md`, `.json`, `.pdf` o `.docx`.

### 3.2 Ingreso mediante Audios (Notas de Voz)
- **Grabadora de Audio Integrada:**
  - Botón de grabación directo en ProcesStudio utilizando la API nativa `MediaRecorder`.
  - Controles de inicio, pausa, detención y escucha previa del audio grabado.
- **Importación de Audios Externos:** Soporte para subir archivos `.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm`.
- **Transcripción Inteligente (Speech-to-Text):**
  - Procesamiento mediante el modelo multimodal (Google Gemini 2.0 Flash Audio / Whisper API).
  - Almacenamiento tanto del texto transcripto como del registro de la nota de voz.
  - Capacidad de revisar y editar la transcripción generada antes de consolidarla en el contexto del proceso.

### 3.3 Persistencia en el Proyecto Portable
La documentación y transcripciones se serializan dentro del archivo del proyecto `ProcessProjectFile` (`.json`), garantizando la portabilidad USB:

```typescript
export interface ProcessDocumentationItem {
  id: string;
  type: 'TEXT' | 'AUDIO_TRANSCRIPTION';
  title: string;
  content: string; // Texto o transcripción
  audioFileName?: string;
  createdAt: string;
  sourceReference?: string; // Ej: "Decreto 142/2025 Art. 12"
}

export interface ProcessDocumentationVault {
  items: ProcessDocumentationItem[];
  globalNotes?: string;
}
```

---

## 4. Experiencia de Usuario (UI/UX) e Integración en la Rueda Radial

### 4.1 Rueda de Nodos Radial (`RadialNodeMenu` y `QuickAddNodeToolbar`)
En la actualidad, al seleccionar un nodo, el botón `+` despliega una rueda con 7 sectores de nodos BPMN estándar (Tarea, Servicio, Decisión XOR, Paralelo AND, Control Calidad, Subproceso, Fin).

Se incorpora una nueva opción prominente:
- **Sector de Sugerencia IA:**
  - **Identidad Visual:** Gradiente distintivo violeta/índigo (`from-violet-500 to-indigo-600`), icono de destellos `Sparkles` o `Bot` de Lucide.
  - **Título:** *"Sugerencia IA"*
  - **Descripción emergente:** *"Analizar documentación y predecir el siguiente paso del proceso"*
  - **Acción:** Al soltar o hacer clic en este sector, se dispara la consulta jerárquica para el nodo activo.

```
       [Tarea de Usuario]        [Tarea de Servicio]
               \                     /
   [Fin Event]  \                   /   [Decisión XOR]
         |       \                 /          |
         |        +---------------+          |
         +--------| SUGERENCIA IA |----------+
         |        +---------------+          |
   [Subproceso]  /                 \    [Paralelo AND]
                /                   \
        [Control Calidad]       [Otros...]
```

### 4.2 Indicador de Procesamiento (Feedback Inmediato)
- Animación sutil con resplandor (*glow effect*) y spinner en el nodo seleccionado mientras la IA evalúa la documentación y el grafo.
- Tiempo de respuesta estimado: < 1.5 segundos con Gemini 2.0 Flash.

### 4.3 Tarjeta Flotante de Sugerencia (`AiSuggestionCard`)
Al finalizar el análisis, se despliega una tarjeta contextual flotante anclada al nodo:

- **Encabezado:** Badge con el tipo de nodo BPMN recomendado (con su icono y color oficial).
- **Título Sugerido:** Ej: *"Verificación y Valuación Fiscal del Inmueble"*.
- **Descripción Operativa:** Síntesis clara de la tarea a realizar y criterios requeridos.
- **Carril / Rol Sugerido:** Sugerencia del área responsable (ej. *"Dirección de Rentas"*).
- **Insignia de Fuente Jerárquica:**
  - 🟢 *Nivel 1:* *"Fundamentado en Decreto N° 450/24, Art. 8"* o *"Basado en Audio N° 2"*
  - 🟡 *Nivel 2:* *"Deducido por secuencia de compuerta XOR y actor del carril actual"*
  - 🔵 *Nivel 3:* *"Sugerido por estándar ISO 9001 (Verificación de salidas no conformes)"*
- **Justificación:** Breve explicación de por qué este paso es el sucesor natural del flujo.
- **Acciones Disponibles:**
  - **Botón `[Conectar Nodo Sugerido]`:** Inserta automáticamente el nodo en el lienzo, establece la secuencia (`edge`), aplica el nombre, la descripción y el rol en sus propiedades, y actualiza el autoguardado.
  - **Botón `[Alternativa]`:** Pide a la IA otra posibilidad o bifurcación alternativa.
  - **Botón `[Cancelar]`:** Descarta la sugerencia sin alterar el diagrama.

---

## 5. Diseño del Motor de Inferencia y Prompt Engineering

### 5.1 Estructura del Prompt Jerárquico al LLM

```json
{
  "system_instruction": "Eres el Asistente Experto en BPMN 2.0 e ISO 9001 de ProcesStudio. Tu tarea es analizar el proceso actual y recomendar exactamente el PRÓXIMO nodo a conectar a partir del nodo seleccionado. DEBES aplicar estrictamente la siguiente jerarquía de verdad: 1) Si la documentación o audios aportados indican el siguiente paso, úsalo obligatoriamente. 2) Respeta los roles, carriles y lógica del grafo actual. 3) Si hay vacíos en la documentación, recurre a buenas prácticas BPMN pero sin contradecir los documentos aportados.",
  "context": {
    "hierarchy_level_1_documentation": [
      {
        "title": "Manual de Procedimiento de Tránsito v2",
        "content": "Luego de redactada el acta de infracción por el inspector, el expediente pasa obligatoriamente a la Asesoría Legal para verificación de personería..."
      },
      {
        "title": "Nota de Voz del Director (Transcripción)",
        "content": "Queremos que antes de emitir la resolución final haya siempre un punto de control de calidad para verificar antecedentes..."
      }
    ],
    "hierarchy_level_2_current_graph": {
      "processTitle": "Gestión de Infracciones de Tránsito",
      "selectedNode": {
        "id": "node_4",
        "title": "Redacción de Acta de Infracción",
        "type": "UserTask",
        "lane": "Cuerpo de Inspectores"
      },
      "previousNodes": ["node_1 (Inicio)", "node_2 (Recepción de Denuncia)"],
      "existingLanes": ["Mesa de Entrada", "Cuerpo de Inspectores", "Asesoría Legal", "Juzgado de Faltas"]
    }
  }
}
```

### 5.2 Esquema de Salida JSON Estricto

```typescript
export interface AiNodeRecommendation {
  nodeType: 'UserTask' | 'ServiceTask' | 'ExclusiveGateway' | 'ParallelGateway' | 'QualityCheckpointEvent' | 'SubProcess' | 'EndEvent';
  title: string;
  description: string;
  suggestedLaneName: string;
  rationale: string;
  sourceLevel: 'DOCUMENTATION' | 'GRAPH_CONTEXT' | 'GENERAL_BEST_PRACTICE';
  sourceCitation: string;
  potentialRisksOrControls?: string[];
  alternativeOption?: {
    nodeType: string;
    title: string;
    description: string;
  };
}
```

---

## 6. Hoja de Ruta de Implementación por Fases

### Fase 1: Estructura de Datos y Modelo de Documentación
- Actualizar interfaces en `src/types/project.ts` para incorporar `ProcessDocumentationVault` y `ProcessDocumentationItem`.
- Garantizar compatibilidad con versiones anteriores de archivos `.json` existentes.

### Fase 2: Módulo UI de Documentación y Grabación de Audio
- Crear componente modal/panel `ProcessDocumentationModal.tsx`.
- Implementar servicio de grabación y captura de audio con Web Audio API (`src/services/audioRecorderService.ts`).
- Diseñar interfaz para escuchar audios, visualizar transcripciones y gestionar documentos escritos.

### Fase 3: Integración del Proveedor de IA (Gemini API)
- Implementar servicio cliente `src/services/aiRecommendationService.ts` utilizando la API de Gemini (con fallback offline/modo simulado en caso de no contar con conexión).
- Configuración de transcripción automática de audio (Speech-to-Text).
- Implementación del pipeline jerárquico de prompts (*Jerarquía N1 -> N2 -> N3*).

### Fase 4: Integración en la Rueda Radial de Nodos
- Modificar `src/components/canvas/RadialNodeMenu.tsx`:
  - Incorporar el nuevo sector IA con cálculo trigonométrico ajustado para 8 sectores o botón central asistente.
  - Diseñar el icono, gradiente y efectos visuales modernos.
- Actualizar `src/components/canvas/QuickAddNodeToolbar.tsx` para coordinar el disparador de IA y el estado de carga.

### Fase 5: Componente de Presentación e Inserción de Nodo (`AiSuggestionCard`)
- Desarrollar `AiSuggestionCard.tsx` con soporte para:
  - Visualización del nodo propuesto, rol sugerido, citas documentales e insignias de nivel jerárquico.
  - Conexión e inserción con un solo clic invocando `addConnectedNode` y configurando automáticamente sus datos en `useCanvasStore`.

### Fase 6: Validación, Pruebas y Documentación de Historias de Usuario
- Pruebas operativas con procesos de ejemplo y documentos normativos reales.
- Registro de historias de usuario correlativas en `HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx`.
- Compilación del paquete portable y commit/push automático al repositorio.

---

## 7. Criterios de Aceptación

1. **Jerarquía Verificable:** Si un texto o audio cargado en el Nivel 1 menciona expresamente la acción a seguir, la sugerencia de la IA debe reflejar exactamente dicho paso y citar el fragmento correspondiente.
2. **Ergonomía en Lienzo:** La opción de sugerencia debe ser accesible directamente desde la rueda radial de cualquier nodo válido (excluyendo eventos de fin o notas adhesivas).
3. **Inserción Inmediata:** Al pulsar "Conectar Nodo Sugerido", el nodo debe agregarse automáticamente a la derecha del nodo seleccionado, con su conector, título, descripción y propiedades asignadas sin requerir tipeo manual.
4. **Soporte de Audio:** El usuario debe poder grabar una nota de voz con el micrófono o subir un archivo de audio, obteniendo la transcripción que pasa a formar parte de la memoria del proceso.
5. **Portabilidad y Respaldo:** Toda la documentación escrita y transcripciones deben persistirse dentro del archivo de proyecto `.json` guardado en `MiAppProcesos_USB/Proyectos/`.
