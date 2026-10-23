import {
  AiNodeRecommendation,
  AiRecommendationRequest,
  ProcessDocumentationVault
} from '../types/ai';
import { BpmnNodeType, BPMN_NODE_TYPES } from '../types/process';

const GEMINI_LOCALSTORAGE_KEY = 'procesos_gemini_api_key';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

/**
 * Obtiene la API Key activa (prioridad: localStorage > .env)
 */
export function getGeminiApiKey(): string {
  const localKey = localStorage.getItem(GEMINI_LOCALSTORAGE_KEY);
  if (localKey && localKey.trim().length > 0) {
    return localKey.trim();
  }
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return '';
}

/**
 * Guarda o actualiza la API Key en localStorage
 */
export function setGeminiApiKey(key: string): void {
  if (!key || key.trim() === '') {
    localStorage.removeItem(GEMINI_LOCALSTORAGE_KEY);
  } else {
    localStorage.setItem(GEMINI_LOCALSTORAGE_KEY, key.trim());
  }
}

/**
 * Servicio de Inteligencia Artificial para ProcesStudio
 */
export class AiRecommendationService {
  /**
   * Transcribe un audio grabado a texto utilizando Gemini Multimodal Audio
   */
  public static async transcribeAudio(
    base64Audio: string,
    mimeType: string = 'audio/webm'
  ): Promise<string> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error(
        'Se requiere una API Key de Gemini para transcribir audios. Configúrala en la Bóveda Documental.'
      );
    }

    const payload = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Audio
              }
            },
            {
              text: 'Transcribe fielmente el audio en español. Corresponde a una explicación de un procedimiento o normativa de trabajo. Devuelve exclusivamente la transcripción textual limpia, sin encabezados, sin notas del transcriptor ni comillas.'
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048
      }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const msg = errorJson?.error?.message || `Error HTTP ${response.status}`;
      throw new Error(`Fallo en transcripción de audio: ${msg}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('La IA no devolvió ninguna transcripción para el audio aportado.');
    }

    return candidateText.trim();
  }

  /**
   * Genera la recomendación del próximo nodo aplicando la Jerarquía Estricta (N1 -> N2 -> N3)
   * y la salvaguarda "No hay sugerencias" ante desvíos o fallos.
   */
  public static async recommendNextNode(
    request: AiRecommendationRequest
  ): Promise<AiNodeRecommendation> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return {
        hasSuggestion: false,
        fallbackReason: 'NO_API_KEY',
        fallbackMessage:
          'No hay sugerencias: Debes configurar tu clave de Gemini API en la Bóveda Documental o en el archivo .env.'
      };
    }

    const systemPrompt = `Eres el Asistente Experto en Modelado de Procesos BPMN 2.0 e ISO 9001 de ProcesStudio Web.
Tu tarea es recomendar exactamente el PRÓXIMO nodo que debe conectarse a continuación del nodo seleccionado.

DEBES RESPETAR ESTRICTAMENTE ESTA JERARQUÍA DE VERDAD PARA EVITAR ALUCINACIONES O DESVÍOS:
1. NIVEL 1 - Documentación del Proceso (MÁXIMA PRIORIDAD):
   Examina todos los manuales, normativas y notas de voz transcriptas aportadas. Si la documentación indica de forma explícita o implícita el paso siguiente, DEBES usarlo obligatoriamente y citar el fragmento en "sourceCitation".
2. NIVEL 2 - Grafo BPMN Actual:
   Respeta los carriles existentes, los actores, el objetivo del proceso y el tipo de nodo actual (si es compuerta XOR, si es tarea de usuario, etc.). Asegura la coherencia de flujo.
3. NIVEL 3 - Búsqueda y Mejores Prácticas Generales (ÚLTIMO RECURSO):
   Úsalo solo si hay una laguna en el Nivel 1. NUNCA introduzcas un paso que contradiga la documentación.

REGLA DE SALVAGUARDA ESTRICTA (CIRCUIT BREAKER ANTI-DESVÍO):
- Si la documentación y el grafo no proporcionan suficiente claridad para predecir el próximo paso con alta certidumbre, o si inventar un paso requeriría especular y desviarse del proceso real, DEBES responder con "hasSuggestion": false y explicar el motivo en "fallbackMessage".
- Es preferible responder "hasSuggestion": false antes que recomendar un paso inexacto o alucinado.

FORMATO DE SALIDA OBLIGATORIO:
Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura (sin bloques markdown de código envolventes ni explicaciones adicionales):
{
  "hasSuggestion": true o false,
  "fallbackReason": "LOW_CONFIDENCE" o "CONTEXT_DRIFT" (solo si hasSuggestion es false),
  "fallbackMessage": "Explicación clara de por qué no hay sugerencias seguras" (solo si hasSuggestion es false),
  "nodeType": "UserTask" | "ServiceTask" | "ExclusiveGateway" | "ParallelGateway" | "QualityCheckpointEvent" | "SubProcess" | "EndEvent",
  "title": "Título sintético y profesional del paso (ej: Verificación de Antecedentes)",
  "description": "Descripción clara de la tarea o acción a ejecutar",
  "suggestedLaneName": "Nombre del carril o área responsable propuesta",
  "rationale": "Justificación concisa de por qué este es el siguiente paso lógico",
  "sourceLevel": "DOCUMENTATION" | "GRAPH_CONTEXT" | "GENERAL_BEST_PRACTICE",
  "sourceCitation": "Cita textual del documento o audio donde se fundamenta",
  "potentialRisksOrControls": ["Control o riesgo sugerido opcional"]
}`;

    const documentationContext = this.formatDocumentationContext(request.documentationVault);

    const userPrompt = `CONTEXTO DEL PROCESO ACTUAL:
- Título del Proceso: "${request.processTitle || 'Proceso sin título'}"
- Objetivo del Proceso: "${request.processObjective || 'No definido'}"
- Carriles / Roles Activos: ${request.existingLanes.length > 0 ? request.existingLanes.join(', ') : 'No definidos aún'}
- Flujo Previo Recorrido: ${request.previousNodesSummary.length > 0 ? request.previousNodesSummary.join(' -> ') : 'Nodo inicial'}
- Nodo Actualmente Seleccionado:
  * ID: ${request.selectedNodeId}
  * Tipo: ${request.selectedNodeType}
  * Título: "${request.selectedNodeTitle}"
  * Carril / Rol Actual: "${request.selectedNodeLane || 'Sin asignar'}"

DOCUMENTACIÓN Y AUDIOS DEL PROCESO (NIVEL 1 - MÁXIMA PRIORIDAD):
${documentationContext}

Determina el próximo nodo a conectar aplicando la jerarquía estricta. Si no hay suficiente información certera, responde con "hasSuggestion": false.`;

    try {
      const payload = {
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.2, // Baja temperatura para precisión analítica
          responseMimeType: 'application/json',
          maxOutputTokens: 1024
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('Fallo en llamada a Gemini API:', response.status);
        return {
          hasSuggestion: false,
          fallbackReason: 'API_ERROR',
          fallbackMessage:
            'No hay sugerencias disponibles en este momento. Verifica tu conexión o cuota de API de Gemini.'
        };
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        return {
          hasSuggestion: false,
          fallbackReason: 'API_ERROR',
          fallbackMessage: 'No hay sugerencias: El servicio no devolvió una respuesta válida.'
        };
      }

      // Limpiar delimitadores markdown si el modelo los incluyó
      const cleanedJson = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      const parsed = JSON.parse(cleanedJson) as AiNodeRecommendation;

      // Normalizar tipo de nodo
      if (parsed.hasSuggestion && parsed.nodeType) {
        parsed.nodeType = this.normalizeNodeType(parsed.nodeType);
      }

      return parsed;
    } catch (err: any) {
      console.warn('Excepción al consultar recomendación IA:', err);
      return {
        hasSuggestion: false,
        fallbackReason: 'API_ERROR',
        fallbackMessage:
          err.name === 'AbortError'
            ? 'No hay sugerencias: Tiempo de espera agotado al consultar la IA.'
            : 'No hay sugerencias: No se pudo contactar con la API de IA.'
      };
    }
  }

  private static formatDocumentationContext(vault?: ProcessDocumentationVault): string {
    if (!vault || (!vault.items?.length && !vault.globalNotes)) {
      return '(No se ha cargado documentación escrita ni notas de voz en la Bóveda Documental)';
    }

    const lines: string[] = [];

    if (vault.globalNotes && vault.globalNotes.trim().length > 0) {
      lines.push(`[NOTAS GENERALES DEL PROCESO]:\n${vault.globalNotes.trim()}\n`);
    }

    if (vault.items && vault.items.length > 0) {
      vault.items.forEach((item, index) => {
        const typeLabel = item.type === 'AUDIO_TRANSCRIPTION' ? 'TRANSCRIPCIÓN DE AUDIO' : 'DOCUMENTO ESCRITO';
        const source = item.sourceReference ? ` (Fuente: ${item.sourceReference})` : '';
        lines.push(
          `--- Item #${index + 1}: [${typeLabel}] "${item.title}"${source} ---\n${item.content.trim()}\n`
        );
      });
    }

    return lines.join('\n');
  }

  private static normalizeNodeType(type: string): BpmnNodeType {
    const validTypes = Object.values(BPMN_NODE_TYPES) as string[];
    if (validTypes.includes(type)) {
      return type as BpmnNodeType;
    }

    const lower = type.toLowerCase();
    if (lower.includes('service') || lower.includes('servicio')) return BPMN_NODE_TYPES.SERVICE_TASK;
    if (lower.includes('decision') || lower.includes('exclusive') || lower.includes('xor')) return BPMN_NODE_TYPES.EXCLUSIVE_GATEWAY;
    if (lower.includes('parallel') || lower.includes('and') || lower.includes('paralelo')) return BPMN_NODE_TYPES.PARALLEL_GATEWAY;
    if (lower.includes('quality') || lower.includes('checkpoint') || lower.includes('control')) return BPMN_NODE_TYPES.QUALITY_CHECKPOINT_EVENT;
    if (lower.includes('sub') || lower.includes('subprocess')) return BPMN_NODE_TYPES.SUB_PROCESS;
    if (lower.includes('end') || lower.includes('fin')) return BPMN_NODE_TYPES.END_EVENT;
    return BPMN_NODE_TYPES.USER_TASK;
  }
}
