import type { Edge, Node } from '@xyflow/react';
import type { FunctionalRoleCatalogItem } from '../types/catalogs';
import type { BpmnNodeData, BpmnNodeType, IsoDuration, LaneDefinition, SequenceFlowData } from '../types/process';

/**
 * Generador "Texto a BPMN" (PST-112). Módulo puro, sin stores, para poder testearlo.
 *
 * Reglas:
 * - Frase común → tarea.
 * - "verifica / evalúa / controla / analiza / revisa / determina / decide si …" o "¿…?" → compuerta XOR.
 * - "Si cumple, …", "Si no cumple, …", "Si <condición>, …", "En caso contrario, …" → tarea dentro de una rama
 *   de la última compuerta; la condición es la etiqueta del flujo. Todas las ramas salen de la misma compuerta.
 * - Rama negativa (no, rechaza, deniega, en caso contrario…) → termina en su propio evento de fin.
 *   Las ramas positivas continúan con la frase siguiente.
 * - "en 3 días", "en 2 días hábiles", "en 48 horas" → plazo (SLA) de la tarea.
 * - Identificadores correlativos por tipo y sin saltos: INI-01, TSK-01…, SRV-01…, GTW-01…, FIN-01…
 */

export type RoleCatalogEntry = Pick<FunctionalRoleCatalogItem, 'name' | 'organizationUnit' | 'defaultSystem' | 'colorHex'> & {
  isActive?: boolean;
};

export interface TextToBpmnResult {
  lanes: LaneDefinition[];
  nodes: Node<BpmnNodeData>[];
  edges: Edge<SequenceFlowData>[];
}

const LANE_COLORS = ['#0284C7', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];

const CONNECTORS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'para', 'a']);
const NON_SUBJECT_STARTS = new Set([
  'se', 'luego', 'después', 'despues', 'finalmente', 'posteriormente', 'entonces', 'primero', 'cuando', 'una', 'un'
]);
const ARTICLES = new Set(['el', 'la', 'los', 'las']);

const NUMBER_WORDS: Record<string, number> = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  quince: 15, veinte: 20, treinta: 30
};

// ---------------------------------------------------------------------------
// Análisis de frases
// ---------------------------------------------------------------------------

export function splitSentences(rawText: string): string[] {
  return rawText
    .split(/\r?\n|(?<=[.;])\s+/)
    .map((s) =>
      s
        .replace(/^\s*(?:[-*•]|\d+\s*[.)-])\s*/, '')
        .replace(/[.;]\s*$/, '')
        .trim()
    )
    .filter((s) => s.length > 3);
}

/** Extrae el plazo ("en 3 días hábiles") y devuelve la frase sin él. */
export function extractDuration(sentence: string): { text: string; sla?: IsoDuration } {
  const re =
    /\s*,?\s*(?:en|dentro de|en un plazo de|en el plazo de|en un máximo de|en un maximo de)\s+(\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|quince|veinte|treinta)\s+(d[ií]as?\s+h[aá]biles|d[ií]as?\s+corridos|d[ií]as?|horas?|hs\.?|semanas?)\b/i;
  const m = re.exec(sentence);
  if (!m) return { text: sentence };
  const raw = m[1].toLowerCase();
  let value = /^\d+$/.test(raw) ? parseInt(raw, 10) : NUMBER_WORDS[raw] || 1;
  const unitText = m[2].toLowerCase();
  let unit: IsoDuration['unit'] = 'BUSINESS_DAYS';
  if (/^hora|^hs/.test(unitText)) unit = 'HOURS';
  else if (/corridos/.test(unitText)) unit = 'CALENDAR_DAYS';
  else if (/^semana/.test(unitText)) value *= 5;
  const iso = unit === 'HOURS' ? `PT${value}H` : `P${value}D`;
  const text = (sentence.slice(0, m.index) + sentence.slice(m.index + m[0].length)).replace(/\s{2,}/g, ' ').trim();
  return { text, sla: { value, unit, iso8601String: iso, isPeremptory: false, enabled: true } };
}

/** Separa el sujeto ("Mesa de Entradas") de la acción ("recibe la solicitud"). */
export function splitSubject(sentence: string): { subject: string | null; action: string } {
  const words = sentence.split(/\s+/);
  let i = 0;
  if (words[0] && ARTICLES.has(words[0].toLowerCase()) && words[1] && /^[A-ZÁÉÍÓÚÑ]/.test(words[1])) i = 1;
  if (!words[i] || !/^[A-ZÁÉÍÓÚÑ]/.test(words[i]) || NON_SUBJECT_STARTS.has(words[i].toLowerCase())) {
    return { subject: null, action: sentence };
  }
  const subjectWords: string[] = [];
  for (; i < words.length; i++) {
    const w = words[i];
    if (/^[A-ZÁÉÍÓÚÑ]/.test(w)) subjectWords.push(w);
    else if (CONNECTORS.has(w.toLowerCase()) && words[i + 1] && /^[A-ZÁÉÍÓÚÑ]/.test(words[i + 1])) subjectWords.push(w);
    else break;
  }
  const action = words.slice(i).join(' ').trim();
  // Una sola palabra al inicio de la frase puede ser un verbo ("Recibir la solicitud"): sin acción, no es sujeto.
  if (subjectWords.length === 0 || !action) return { subject: null, action: sentence };
  return { subject: subjectWords.join(' ').replace(/[,:]$/, ''), action };
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const BRANCH_RE =
  /^(si\s+no\s+[^,]+|si\s+[^,]+|en\s+caso\s+contrario|de\s+lo\s+contrario|caso\s+contrario|sino|en\s+caso\s+de\s+[^,]+)\s*,\s*(.*)$/i;
const DECISION_RE = /\b(verifica|verificar|eval[uú]a|controla|analiza|revisa|determina|decide|comprueba|constata)\s+si\s+(.+)$/i;
const NEGATIVE_RE = /\b(no|rechaz\w*|deneg\w*|denieg\w*|incumpl\w*|contrario|desaprueb\w*|observad\w*)\b/i;

export function isNegativeCondition(condition: string): boolean {
  return NEGATIVE_RE.test(condition);
}

/** "Si cumple" → "Cumple"; "Si no cumple" → "No cumple"; "En caso contrario" → "En caso contrario". */
export function conditionLabel(condition: string): string {
  const c = condition.trim().replace(/^si\s+/i, '');
  return capitalize(c);
}

function complementLabel(label: string): string {
  if (/^no\s+/i.test(label)) return capitalize(label.replace(/^no\s+/i, ''));
  if (/^sí$|^si$/i.test(label)) return 'No';
  return `No ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
}

type Classified =
  | { kind: 'task'; text: string }
  | { kind: 'decision'; actorText: string; question: string }
  | { kind: 'branch'; condition: string; body: string };

export function classifySentence(sentence: string): Classified {
  const branch = BRANCH_RE.exec(sentence);
  if (branch) return { kind: 'branch', condition: branch[1].trim(), body: branch[2].trim() };
  // "Si cumple Asuntos Jurídicos emite…" (sin coma): la condición llega hasta el primer sujeto en mayúscula.
  const noComma = /^([Ss]i\s+(?:no\s+)?[a-záéíóúñ]+)\s+([A-ZÁÉÍÓÚÑ].*)$/.exec(sentence);
  if (noComma) return { kind: 'branch', condition: noComma[1], body: noComma[2] };

  const decision = DECISION_RE.exec(sentence);
  if (decision) {
    const actorText = sentence.slice(0, decision.index).trim();
    const what = decision[2].replace(/[?¿]/g, '').trim();
    return { kind: 'decision', actorText, question: `¿${capitalize(what)}?` };
  }
  if (sentence.includes('¿')) {
    const q = sentence.slice(sentence.indexOf('¿')).replace(/\?*$/, '?');
    return { kind: 'decision', actorText: sentence.slice(0, sentence.indexOf('¿')).trim(), question: q };
  }
  return { kind: 'task', text: sentence };
}

// ---------------------------------------------------------------------------
// Carriles
// ---------------------------------------------------------------------------

interface LaneProfile {
  role: string;
  system: string;
  area?: string;
}

function keywordProfile(text: string): LaneProfile | null {
  const lower = text.toLowerCase();
  if (/mesa de entrada|recepci[oó]n|admisi[oó]n|ventanilla/.test(lower)) {
    return { area: 'Mesa de Entradas', role: 'Operador de Recepción', system: 'Mesa Virtual / GDE' };
  }
  if (/jur[ií]dic|legal|dictamen|abogad/.test(lower)) {
    return { area: 'Asuntos Jurídicos', role: 'Abogado Dictaminante', system: 'GDE / LexDoctor' };
  }
  if (/compra|contable|pago|presupuest|finanz|tesorer/.test(lower)) {
    return { area: 'Administración y Finanzas', role: 'Analista Contable', system: 'ERP Financiero' };
  }
  if (/direcci[oó]n|firma|resoluci[oó]n|autoridad|director|supervis/.test(lower)) {
    return { area: 'Dirección General', role: 'Autoridad de Aprobación', system: 'Portafirmas Digital' };
  }
  if (/calidad|auditor/.test(lower)) {
    return { area: 'Calidad', role: 'Inspector de Calidad', system: 'ProcesStudio SGC' };
  }
  return null;
}

class LaneRegistry {
  private lanes = new Map<string, LaneDefinition>();
  constructor(private roles: RoleCatalogEntry[]) {}

  /** Carril según el sujeto de la frase, el catálogo de roles o palabras clave. */
  resolve(subject: string | null, fullText: string, fallback?: LaneDefinition): LaneDefinition {
    const lowerSubject = (subject || '').toLowerCase();
    const lowerText = fullText.toLowerCase();
    const role = this.roles.find(
      (r) =>
        r.isActive !== false &&
        ((lowerSubject && (lowerSubject.includes(r.name.toLowerCase()) || lowerSubject.includes(r.organizationUnit.toLowerCase()))) ||
          lowerText.includes(r.name.toLowerCase()))
    );
    if (role) return this.get(role.organizationUnit, role.name, role.defaultSystem || 'GDE', role.colorHex);

    if (subject) {
      const profile = keywordProfile(subject);
      return this.get(subject, profile?.role || `Responsable de ${subject}`, profile?.system || 'GDE');
    }
    if (fallback) return fallback;
    const profile = keywordProfile(fullText);
    if (profile) return this.get(profile.area!, profile.role, profile.system);
    return this.get('Área Responsable', 'Analista Responsable', 'GDE');
  }

  private get(area: string, role: string, system: string, color?: string): LaneDefinition {
    const key = area.trim().toLowerCase();
    if (!this.lanes.has(key)) {
      const order = this.lanes.size;
      this.lanes.set(key, {
        id: `lane_gen_${order + 1}`,
        name: area.trim(),
        role,
        system,
        colorHex: color || LANE_COLORS[order % LANE_COLORS.length],
        order
      });
    }
    return this.lanes.get(key)!;
  }

  all(): LaneDefinition[] {
    return Array.from(this.lanes.values());
  }
}

// ---------------------------------------------------------------------------
// Construcción del grafo
// ---------------------------------------------------------------------------

interface Tail {
  nodeId: string;
  label?: string;
}

export function buildDiagramFromText(rawText: string, roles: RoleCatalogEntry[] = []): TextToBpmnResult | null {
  const sentences = splitSentences(rawText);
  if (sentences.length === 0) return null;

  const registry = new LaneRegistry(roles);
  const nodes: Node<BpmnNodeData>[] = [];
  const edges: Edge<SequenceFlowData>[] = [];
  const counters: Record<string, number> = {};
  const nextId = (prefix: string) => {
    counters[prefix] = (counters[prefix] || 0) + 1;
    return `${prefix}-${String(counters[prefix]).padStart(2, '0')}`;
  };

  const addNode = (
    type: BpmnNodeType,
    prefix: string,
    title: string,
    description: string,
    lane: LaneDefinition,
    sla?: IsoDuration
  ): string => {
    const standardId = nextId(prefix);
    const id = `node_gen_${standardId.toLowerCase().replace('-', '_')}`;
    nodes.push({
      id,
      type,
      position: { x: 0, y: 0 }, // las posiciones definitivas las calcula Auto-Ordenar
      data: {
        standardId,
        title,
        description,
        nodeType: type,
        laneId: lane.id,
        laneName: lane.name,
        roleName: lane.role,
        responsible: lane.role,
        itSystem: lane.system,
        legalFramework: '',
        ...(sla ? { slaDuration: sla } : {}),
        inputs: [],
        outputs: [],
        operationalRisks: [],
        tags: [lane.role]
      }
    });
    return id;
  };

  const connect = (from: Tail, to: string) => {
    const id = `edge_gen_${from.nodeId}_${to}`;
    edges.push({
      id,
      source: from.nodeId,
      target: to,
      type: 'smartStep',
      data: { id, source: from.nodeId, target: to, conditionText: from.label || '', strokeColor: '#38BDF8', strokeWidth: 2 }
    });
  };

  const makeTask = (text: string, laneHint?: LaneDefinition): { id: string; lane: LaneDefinition } => {
    const { text: withoutSla, sla } = extractDuration(text);
    const { subject, action } = splitSubject(withoutSla);
    const lane = registry.resolve(subject, withoutSla, subject ? undefined : laneHint);
    const automated = /\b(sistema|autom[aá]tic\w*|calcula)\b/i.test(withoutSla);
    const title = capitalize(action).slice(0, 120);
    const id = addNode(automated ? 'ServiceTask' : 'UserTask', automated ? 'SRV' : 'TSK', title, withoutSla, lane, sla);
    return { id, lane };
  };

  // Inicio en el carril de la primera frase.
  const first = classifySentence(sentences[0]);
  const firstText = first.kind === 'task' ? first.text : first.kind === 'decision' ? first.actorText : first.body;
  const firstLane = registry.resolve(splitSubject(extractDuration(firstText).text).subject, firstText);
  const startId = addNode('StartEvent', 'INI', 'Inicio del procedimiento', 'Disparador inicial del proceso.', firstLane);

  let pending: Tail[] = [{ nodeId: startId }];
  let lastLane = firstLane;
  let gateway: { id: string; lane: LaneDefinition; continuing: Tail[]; labels: string[]; hasNegative: boolean } | null = null;

  const openGateway = (question: string, lane: LaneDefinition, description: string) => {
    const id = addNode('ExclusiveGateway', 'GTW', question, description, lane);
    pending.forEach((t) => connect(t, id));
    pending = [];
    gateway = { id, lane, continuing: [], labels: [], hasNegative: false };
  };

  /** Cierra la compuerta abierta asegurando al menos dos salidas etiquetadas. */
  const closeGateway = () => {
    const g = gateway;
    if (!g) return;
    if (g.labels.length === 0) {
      // Decisión sin ramas escritas: "Sí" continúa, "No" termina el trámite.
      g.continuing.push({ nodeId: g.id, label: 'Sí' });
      const endId = addNode('EndEvent', 'FIN', 'Trámite no aprobado', 'Cierre por condición no cumplida.', g.lane);
      connect({ nodeId: g.id, label: 'No' }, endId);
    } else if (g.labels.length === 1) {
      const complement = complementLabel(g.labels[0]);
      if (g.hasNegative) {
        g.continuing.push({ nodeId: g.id, label: complement });
      } else {
        const endId = addNode('EndEvent', 'FIN', 'Trámite no aprobado', 'Cierre por condición no cumplida.', g.lane);
        connect({ nodeId: g.id, label: complement }, endId);
      }
    }
    pending = g.continuing;
    gateway = null;
  };

  sentences.forEach((sentence) => {
    const c = classifySentence(sentence);

    if (c.kind === 'branch') {
      if (!gateway) {
        // Rama sin decisión previa: se crea la compuerta a partir de la condición.
        openGateway(`¿${conditionLabel(c.condition).replace(/^No\s+/i, '')}?`, lastLane, c.condition);
      }
      const g = gateway!;
      const label = conditionLabel(c.condition);
      const negative = isNegativeCondition(c.condition);
      g.labels.push(label);
      if (negative) g.hasNegative = true;

      let tail: Tail = { nodeId: g.id, label };
      if (c.body) {
        const task = makeTask(c.body, g.lane);
        connect(tail, task.id);
        tail = { nodeId: task.id };
        lastLane = task.lane;
      }
      if (negative) {
        const endLane = c.body ? lastLane : g.lane;
        const endId = addNode('EndEvent', 'FIN', 'Trámite rechazado', `Cierre: ${label.toLowerCase()}.`, endLane);
        connect(tail, endId);
      } else {
        g.continuing.push(tail);
      }
      return;
    }

    closeGateway();

    if (c.kind === 'decision') {
      const { text: actor } = extractDuration(c.actorText);
      const subject = splitSubject(`${actor} decide`).subject;
      const lane = registry.resolve(subject, sentence, lastLane);
      openGateway(c.question, lane, sentence);
      lastLane = lane;
      return;
    }

    const task = makeTask(c.text, lastLane);
    pending.forEach((t) => connect(t, task.id));
    pending = [{ nodeId: task.id }];
    lastLane = task.lane;
  });

  closeGateway();

  if (pending.length > 0) {
    const endId = addNode('EndEvent', 'FIN', 'Fin del procedimiento', 'Cierre formal y archivo de las actuaciones.', lastLane);
    pending.forEach((t) => connect(t, endId));
  }

  return { lanes: registry.all(), nodes, edges };
}
