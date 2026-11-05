import {
  AiNodeRecommendation,
  AiRecommendationRequest,
  ProcessDocumentationVault
} from '../types/ai';
import { BpmnNodeType, BPMN_NODE_TYPES } from '../types/process';

import { api, ApiError } from './apiClient';

let aiProxyAvailable = false;

/** El servidor informa (en /auth/me) si tiene configurada la clave de Gemini de la organización. */
export function setAiProxyAvailable(value: boolean): void {
  aiProxyAvailable = value;
}

/** La IA está disponible si el servidor tiene la clave configurada. La clave nunca llega al navegador. */
export function hasGeminiAccess(): boolean {
  return aiProxyAvailable;
}

/**
 * Llama a Gemini a través del servidor (/api/ai/generate).
 * Devuelve el JSON de respuesta de Gemini. Lanza Error con un mensaje legible si falla.
 */
export async function callGemini(payload: Record<string, unknown>, signal?: AbortSignal): Promise<any> {
  if (!aiProxyAvailable) {
    throw new Error('El servicio de IA no está configurado. Pedile al Administrador que cargue la clave de Gemini en el servidor.');
  }
  return api('POST', '/ai/generate', { body: payload, signal });
}

/**
 * Límite de salida. Los modelos que razonan antes de responder consumen parte de este límite,
 * por eso debe ser holgado: con 1024 la respuesta llegaba cortada.
 */
export const GEMINI_MAX_OUTPUT_TOKENS = 8192;

/** Une el texto de todas las partes de la respuesta (sin las partes de razonamiento interno). */
export function extractGeminiText(data: any): { text: string; truncated: boolean } {
  const candidate = data?.candidates?.[0];
  const parts: any[] = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
  const text = parts
    .filter((p) => typeof p?.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('');
  return { text, truncated: candidate?.finishReason === 'MAX_TOKENS' };
}

/** Toma el objeto JSON de la respuesta aunque venga envuelto en ``` o con texto alrededor. */
export function parseJsonObject<T>(raw: string): T {
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const candidate = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(candidate) as T;
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
    if (!hasGeminiAccess()) {
      throw new Error(
        'El servicio de IA no está configurado: pedile al Administrador que cargue la clave de Gemini en el servidor.'
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
        maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS
      }
    };

    let data: any;
    try {
      data = await callGemini(payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(`Fallo en transcripción de audio: ${msg}`);
    }

    const candidateText = extractGeminiText(data).text;
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
    if (!hasGeminiAccess()) {
      return {
        hasSuggestion: false,
        fallbackReason: 'NO_API_KEY',
        fallbackMessage:
          'No hay sugerencias: el servicio de IA no está configurado en el servidor. Contactá al Administrador.'
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
          maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS
        }
      };

      const controller = new AbortController();
      // 25 s: el servidor puede reintentar una vez si Gemini está saturado.
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      let data: any;
      try {
        data = await callGemini(payload, controller.signal);
      } catch (callErr) {
        console.warn('Fallo en llamada a Gemini API:', callErr);
        // Los errores del servidor ya vienen con un mensaje claro (p. ej. servicio saturado).
        const serverMessage = callErr instanceof ApiError && callErr.status > 0 ? callErr.message : null;
        return {
          hasSuggestion: false,
          fallbackReason: 'API_ERROR',
          fallbackMessage:
            serverMessage || 'No hay sugerencias disponibles en este momento. Verificá tu conexión e intentá de nuevo.'
        };
      } finally {
        clearTimeout(timeoutId);
      }

      const { text: rawText, truncated } = extractGeminiText(data);

      if (!rawText) {
        return {
          hasSuggestion: false,
          fallbackReason: 'API_ERROR',
          fallbackMessage: 'No hay sugerencias: El servicio no devolvió una respuesta válida.'
        };
      }

      let parsed: AiNodeRecommendation;
      try {
        parsed = parseJsonObject<AiNodeRecommendation>(rawText);
      } catch (parseErr) {
        console.warn('Respuesta de IA no interpretable:', { truncated, length: rawText.length }, parseErr);
        return {
          hasSuggestion: false,
          fallbackReason: 'API_ERROR',
          fallbackMessage: truncated
            ? 'No hay sugerencias: la respuesta de la IA llegó incompleta. Intentá de nuevo.'
            : 'No hay sugerencias: la IA devolvió una respuesta con formato inválido. Intentá de nuevo.'
        };
      }

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
