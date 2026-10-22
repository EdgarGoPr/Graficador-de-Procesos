# Plan de Acción: Asistente de IA para Recomendaciones y Continuación de Procesos (ProcesStudio Web)

Este documento establece la arquitectura integral, especificaciones funcionales, diseño de interfaz y hoja de ruta técnica para incorporar un **Motor de Inteligencia Artificial Contextual y Jerárquico** en **ProcesStudio**, consolidando su evolución como una **Plataforma 100% Web**, de **acceso abierto** y con **salvaguardas preventivas anti-desvío**.

El sistema asiste al usuario durante el modelado de procesos recomendando de manera inteligente cuál es el próximo paso operativo a seguir, qué tipo de elemento BPMN corresponde, qué rol debe intervenir y cuál es la justificación normativa/operativa, evitando desvíos y alucinaciones gracias a un modelo de consulta por capas jerárquicas estrictas.

---

## 1. Visión y Principios Rectores

1. **Arquitectura 100% Web Nativa:**
   - ProcesStudio opera exclusivamente como una **Single Page Application (SPA) Web moderna** (React, TypeScript, Vite, Tailwind CSS), accesible directamente desde cualquier navegador web moderno sin dependencias de entornos de escritorio portables ni empaquetados pesados.
   - Aprovecha las APIs nativas del navegador (`MediaDevices`, `MediaRecorder`, `AudioContext`, `IndexedDB`) para grabación de audio y persistencia ágil.

2. **Acceso Abierto y Sin Barreras (Sin Sistema de Usuarios):**
   - El sistema no requiere login, perfiles de usuario, roles de acceso ni registros previos.
   - Cualquier persona puede ingresar directamente a la URL de la aplicación web, comenzar a diagramar, cargar documentación y consultar recomendaciones al instante.
   - Los proyectos y sus contextos documentales se guardan y exportan directamente como archivos `.json` estándar o se sincronizan en almacenamiento web/cloud.

3. **Recomendación Contextual Inteligente:**
   - Facilita el diseño de flujos BPMN 2.0 mediante predicciones fundamentadas del próximo nodo a partir de la documentación del proceso y el estado actual del lienzo.

4. **Jerarquía Estricta de Verdad (Cero Alucinaciones):**
   - Toda recomendación se sustenta de forma prioritaria en los documentos y audios específicos provistos para el proceso antes de recurrir a conocimiento externo.

5. **Principio de Abstención Preventiva ("No hay sugerencias"):**
   - **Falla de API o Conectividad:** Si el servicio de IA externo está caído, sin cuota o sufre un timeout, el sistema no colapsa ni muestra errores crípticos: arroja limpiamente el mensaje amigable **"No hay sugerencias"** (con opción de reintento).
   - **Filtro de Desvío / Falta de Certeza:** Si la IA detecta que la consulta requerida no tiene fundamento claro en la documentación cargada, no puede deducirse coherentemente del grafo actual y buscar en internet forzaría un desvío de la realidad de la organización, la IA **debe abstenerse de inventar** y responder honestamente: **"No hay sugerencias"**, invitando al usuario a definir el paso manualmente o enriquecer la documentación del proceso.

---

## 2. Modelo de Decisión Jerárquico (Pirámide de Verdad y Circuit Breaker)

Para garantizar recomendaciones fiables y evitar la dispersión de información, el motor de IA evalúa las sugerencias aplicando el siguiente orden de prelación irrompible:

```
           ▲
          / \     NIVEL 3: Búsqueda en Internet / Buenas Prácticas Generales
         /   \    (Solo en caso de lagunas, estrictamente condicionado por N1 y N2)
        /-----\
       /       \    NIVEL 2: Grafo BPMN Actual y Metadatos del Proyecto
      /         \   (Nodos previos, actores, carriles, metas ISO 9001, orden temporal)
     /-----------\
    /             \   NIVEL 1: Documentación del Proceso (Máxima Autoridad)
   /_______________\  (Textos cargados, leyes, resoluciones y audios transcriptos)
```

### Detalle de Niveles de Prioridad:

1. **NIVEL 1 - Documentación del Proceso (Autoridad Suprema):**
   - **Contenido:** Manuales de procedimiento, ordenanzas, decretos, reglamentos internos y transcripciones completas de audios aportados por los usuarios en la sesión.
   - **Regla:** Si la documentación describe de forma explícita o implícita el paso subsiguiente del procedimiento (ej. *"Una vez recepcionada la solicitud, el inspector labra el acta en un plazo de 48 hs"*), la IA **debe adoptar obligatoriamente** dicha acción como su recomendación prioritaria.

2. **NIVEL 2 - Grafo BPMN y Estado Actual del Diagrama:**
   - **Contenido:** Nodos ya diagramados, secuencia del camino recorrido hasta el nodo activo, carriles (`lanes`) definidos, compuertas lógicas y metadatos ISO 9001.
   - **Regla:** La IA utiliza este contexto estructural para determinar el tipo de compuerta lógica (XOR, AND), asegurar que no se dupliquen actividades ya concluidas y sugerir el carril o actor más coherente dentro del flujo ya trazado.

3. **NIVEL 3 - Búsqueda en Internet y Mejores Prácticas (Último Recurso Condicionado):**
   - **Contenido:** Estándares BPMN 2.0 (ISO/IEC 19510), directrices ISO 9001:2015, y patrones de procesos administrativos.
   - **Regla:** Se recurre a este nivel **únicamente** cuando en el Nivel 1 exista una laguna u omisión operativa. Toda sugerencia proveniente del Nivel 3 debe estar **anclada y condicionada** por los términos y objetivos de los Niveles 1 y 2, prohibiendo la introducción de pasos que contradigan la normativa aportada.

### Mecanismo de Salvaguarda: Filtro de Desvío (*Circuit Breaker*)
Antes de entregar una respuesta al usuario, el motor ejecuta una validación de coherencia:
- Si el paso deducido no tiene respaldo directo en la documentación (N1) y para formularlo se requeriría una asunción riesgosa o especulativa de internet (N3), el motor activa el corte de seguridad:
  $$\text{Confianza} < \text{Umbral de Seguridad} \implies \textbf{"No hay sugerencias"}$$
- Esta salvaguarda protege al usuario de diseñar procesos basados en presunciones incorrectas.

---

## 3. Módulo de Ingesta Documental y Captura de Audio en Entorno Web

Para alimentar el Nivel 1 de la jerarquía, ProcesStudio Web incorpora la **Bóveda Documental del Proceso** (`ProcessDocumentationVault`):

### 3.1 Ingreso de Documentación Escrita
- **Editor Directo Web:** Área de texto enriquecido / Markdown donde pegar reglamentos, leyes o notas de campo.
- **Carga de Archivos:** Soporte de arrastrar y soltar (*drag & drop*) para archivos `.txt`, `.md`, `.json`, `.pdf` o `.docx` directamente en el navegador.

### 3.2 Ingreso mediante Audios (Notas de Voz Web)
- **Grabadora de Audio Web Nativa:**
  - Botón de grabación integrado utilizando la API estándar de navegadores `navigator.mediaDevices.getUserMedia()` y `MediaRecorder`.
  - Controles de inicio, pausa, detención y reproductor de escucha previa en HTML5.
  - No requiere plugins ni software adicional; funciona en Chrome, Edge, Firefox y Safari.
- **Importación de Archivos de Audio:** Carga directa de notas de voz en formatos `.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm`.
- **Transcripción Inteligente (Speech-to-Text):**
  - Procesamiento mediante el modelo multimodal (Google Gemini 2.0 Flash Audio / Whisper API).
  - Almacenamiento tanto del texto transcripto como del registro de la nota de voz.
  - Editor de corrección rápida para que el usuario ajuste términos técnicos o nombres propios antes de consolidar el contexto.

### 3.3 Persistencia de Proyectos en la Web
Toda la documentación y transcripciones se serializan dentro del archivo del proyecto `ProcessProjectFile` (`.json`), permitiendo al usuario descargar el archivo con un clic, almacenarlo en la nube o conservarlo en la caché local del navegador (`localStorage` / `IndexedDB`):

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

Se incorpora una nueva opción destacada:
- **Sector de Sugerencia IA:**
  - **Identidad Visual:** Gradiente distintivo violeta/índigo (`from-violet-500 to-indigo-600`), icono de destellos `Sparkles` de Lucide.
  - **Título:** *"Sugerencia IA"*
  - **Descripción emergente:** *"Analizar documentación y predecir el siguiente paso del proceso"*
  - **Interacción:** Compatible con arrastre (*drag*) o clic directo sobre el sector.

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

### 4.2 Indicador de Procesamiento (Feedback Visual Inmediato)
- Animación sutil con resplandor (*glow effect*) y spinner en el nodo seleccionado mientras el motor web procesa el contexto.
- Tiempo de respuesta optimizado: < 1.5 segundos con Gemini 2.0 Flash.

### 4.3 Manejo de Resultados: Caso Exitoso vs. Fallback

#### Caso A: Recomendación Exitosa (`AiSuggestionCard`)
Se despliega una tarjeta contextual flotante anclada al nodo:
- **Encabezado:** Badge con el tipo de nodo BPMN recomendado (con su color e icono oficial).
- **Título Sugerido:** Ej: *"Verificación y Valuación Fiscal del Inmueble"*.
- **Descripción Operativa:** Síntesis clara de la tarea a realizar y criterios requeridos.
- **Carril / Rol Sugerido:** Sugerencia del área responsable (ej. *"Dirección de Rentas"*).
- **Insignia de Fuente Jerárquica:**
  - 🟢 *Nivel 1:* *"Fundamentado en Decreto N° 450/24, Art. 8"* o *"Basado en Audio N° 2"*
  - 🟡 *Nivel 2:* *"Deducido por secuencia de compuerta XOR y actor del carril actual"*
  - 🔵 *Nivel 3:* *"Sugerido por estándar ISO 9001 (Verificación de salidas no conformes)"*
- **Justificación:** Breve explicación de por qué este paso es el sucesor natural del flujo.
- **Botón de Acción Principal:** `[Conectar Nodo Sugerido]`: Inserta automáticamente el nodo en el lienzo, establece la conexión (`edge`), aplica el título, descripción y rol en sus propiedades, y actualiza el grafo con un solo clic.

#### Caso B: Mensaje de Salvaguarda ("No hay sugerencias")
Si la API falla, hay pérdida de conexión o el motor considera que la inferencia se desvía demasiado:
- Se muestra una tarjeta minimalista o notificación elegante:
  > **ℹ️ No hay sugerencias**  
  > *No encontramos una sugerencia con suficiente respaldo en la documentación o el grafo para este paso. Puedes definir el próximo elemento manualmente desde la rueda o cargar más información en la Bóveda Documental.*
- **Opciones disponibles:**
  - `[Reintentar]`: Vuelve a disparar la consulta por si se trató de un microcorte de red.
  - `[Cargar Documentación]`: Abre directamente el modal de textos y audios para alimentar la base de conocimiento.
  - `[Cerrar]`: Retorna de inmediato al lienzo sin alterar nada.

---

## 5. Diseño del Motor de Inferencia y Prompt Engineering

### 5.1 Estructura del Prompt con Salvaguarda Integrada

```json
{
  "system_instruction": "Eres el Asistente Experto en BPMN 2.0 e ISO 9001 de ProcesStudio Web. Tu objetivo es analizar el proceso actual y recomendar exactamente el PRÓXIMO nodo a conectar a partir del nodo seleccionado. DEBES aplicar estrictamente la siguiente jerarquía: 1) Si la documentación o audios aportados indican el siguiente paso, úsalo obligatoriamente. 2) Si no está explícito pero se deduce con alta certeza del grafo actual y carriles, sugiérelo. 3) Si la información es insuficiente, ambigua o formular un paso requeriría especular o desvirtuar el proceso real, DEBES responder con 'hasSuggestion': false y justificar por qué no hay sugerencia segura. Jamás inventes pasos que contradigan la documentación.",
  "context": {
    "hierarchy_level_1_documentation": [
      {
        "title": "Manual de Procedimiento de Tránsito v2",
        "content": "Luego de redactada el acta de infracción por el inspector, el expediente pasa obligatoriamente a la Asesoría Legal para verificación de personería..."
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
  hasSuggestion: boolean; // false si hay desvío o falta de certeza
  fallbackReason?: 'API_ERROR' | 'LOW_CONFIDENCE' | 'CONTEXT_DRIFT';
  fallbackMessage?: string; // "No hay sugerencias para este paso..."
  nodeType?: 'UserTask' | 'ServiceTask' | 'ExclusiveGateway' | 'ParallelGateway' | 'QualityCheckpointEvent' | 'SubProcess' | 'EndEvent';
  title?: string;
  description?: string;
  suggestedLaneName?: string;
  rationale?: string;
  sourceLevel?: 'DOCUMENTATION' | 'GRAPH_CONTEXT' | 'GENERAL_BEST_PRACTICE';
  sourceCitation?: string;
  potentialRisksOrControls?: string[];
}
```

---

## 6. Hoja de Ruta de Implementación por Fases

### Fase 1: Estructura de Datos y Modelo de Documentación Web
- Extender `src/types/project.ts` con `ProcessDocumentationVault` y `ProcessDocumentationItem`.
- Garantizar retrocompatibilidad en la carga de archivos `.json` existentes.

### Fase 2: Módulo UI de Documentación y Grabación de Audio en Navegador
- Crear componente modal `ProcessDocumentationModal.tsx` integrado en la barra de navegación web.
- Implementar servicio de grabación web nativo (`src/services/webAudioRecorder.ts`) usando `MediaRecorder`.
- Interfaz para reproducir audios, revisar transcripciones y gestionar documentos escritos.

### Fase 3: Servicio de Inferencia IA y Salvaguarda
- Implementar `src/services/aiRecommendationService.ts` utilizando la API de Google Gemini (Flash / Pro).
- Implementar el Circuit Breaker y manejo de fallos para devolver de forma limpia el estado *"No hay sugerencias"*.
- Integrar transcripción automática de audio multimodal.

### Fase 4: Integración en la Rueda Radial de Nodos
- Modificar `src/components/canvas/RadialNodeMenu.tsx`:
  - Incorporar el sector de IA con icono `Sparkles` y gradiente índigo/violeta.
- Modificar `src/components/canvas/QuickAddNodeToolbar.tsx` para orquestar la consulta y los estados de carga.

### Fase 5: Componente de Presentación (`AiSuggestionCard`) y Manejo de Fallback
- Desarrollar `AiSuggestionCard.tsx` soportando:
  - Vista de sugerencia exitosa con botón `[Conectar Nodo Sugerido]`.
  - Vista limpia de mensaje *"No hay sugerencias"* con opciones de reintento y carga documental.

### Fase 6: Pruebas Web, Build y Registro de Historias de Usuario
- Validar funcionamiento en navegadores estándar (permisos de micrófono, persistencia y fluidez del lienzo).
- Registro de historias de usuario correlativas en `HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx`.
- Ejecución del build web y push automático al repositorio Git.

---

## 7. Criterios de Aceptación

1. **Acceso Abierto Web:** Cualquier usuario puede abrir la aplicación en el navegador sin autenticación y utilizar de inmediato todas las herramientas de modelado y recomendación.
2. **Jerarquía Verificable:** Si un texto o audio cargado en el Nivel 1 menciona expresamente la acción a seguir, la sugerencia de la IA debe reflejar exactamente dicho paso y citar el fragmento correspondiente.
3. **Manejo Seguro "No hay sugerencias":** Si la API no responde o si la IA detecta que la inferencia se desvía de los documentos y el grafo, el sistema muestra el mensaje *"No hay sugerencias"* de forma elegante, sin interrumpir la sesión ni alterar el lienzo.
4. **Ergonomía en Lienzo:** La opción de sugerencia se activa con un solo clic o arrastre desde la rueda radial de cualquier nodo válido.
5. **Inserción Inmediata:** Al pulsar `[Conectar Nodo Sugerido]`, el nuevo nodo se agrega y conecta automáticamente a la derecha del seleccionado, con su tipo BPMN, nombre, descripción y rol precargados.
6. **Grabación de Audio Nativa:** El usuario puede grabar notas de voz utilizando el micrófono del navegador o subir archivos de audio, obteniendo transcripciones que alimentan el contexto del proceso.
