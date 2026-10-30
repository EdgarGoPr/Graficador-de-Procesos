import { Node, Edge } from '@xyflow/react';
import { ProcessProjectFile } from '../types/project';
import { BpmnNodeData, BpmnNodeType, LaneDefinition, SequenceFlowData } from '../types/process';
import { MasterCatalogsService } from './masterCatalogsService';

const LANE_COLORS = ['#0284C7', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];

/**
 * 1. MAGIC AUTO-LAYOUT: Ordena matemáticamente los carriles y nodos de izquierda a derecha sin superposiciones (PST-083)
 */
export function autoLayoutProcessCanvas(project: ProcessProjectFile): ProcessProjectFile {
  const pool = project.pools[0];
  const lanes = pool?.lanes || [];
  const laneHeight = 250;

  const workNodes = project.nodes.filter((n) => n.type !== 'PoolLane' && n.type !== 'StickyNote');
  const stickyNodes = project.nodes.filter((n) => n.type === 'StickyNote');
  const edges = project.edges || [];

  if (workNodes.length === 0) return project;

  // Calcular nivel topológico (columna X) mediante BFS desde StartEvent
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  workNodes.forEach((n) => {
    adj.set(n.id, []);
    inDegree.set(n.id, 0);
  });

  edges.forEach((e) => {
    if (adj.has(e.source) && inDegree.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  const levelMap = new Map<string, number>();
  const queue: string[] = [];

  workNodes.forEach((n) => {
    if (n.type === 'StartEvent' || (inDegree.get(n.id) || 0) === 0) {
      levelMap.set(n.id, 0);
      queue.push(n.id);
    }
  });

  if (queue.length === 0 && workNodes[0]) {
    levelMap.set(workNodes[0].id, 0);
    queue.push(workNodes[0].id);
  }

  const visited = new Set<string>(queue);
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currLevel = levelMap.get(curr) || 0;
    const neighbors = adj.get(curr) || [];
    for (const next of neighbors) {
      const nextLevel = Math.max(levelMap.get(next) || 0, currLevel + 1);
      levelMap.set(next, Math.min(nextLevel, workNodes.length));
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  // Nodos desconectados reciben columnas secuenciales
  let fallbackCol = 1;
  workNodes.forEach((n) => {
    if (!levelMap.has(n.id)) {
      levelMap.set(n.id, fallbackCol++);
    }
  });

  // Agrupar por (laneId, level) para evitar que dos nodos del mismo carril y mismo nivel se pisen
  const slotCounter = new Map<string, number>();
  let maxColumn = 0;

  const updatedWorkNodes: Node<BpmnNodeData>[] = workNodes.map((n) => {
    const col = levelMap.get(n.id) || 0;
    if (col > maxColumn) maxColumn = col;

    let laneIdx = lanes.findIndex((l) => l.id === n.data?.laneId);
    if (laneIdx < 0) laneIdx = 0;

    const slotKey = `${laneIdx}_${col}`;
    const slotOffset = slotCounter.get(slotKey) || 0;
    slotCounter.set(slotKey, slotOffset + 1);

    const newX = 110 + col * 300 + slotOffset * 40;
    const newY = laneIdx * laneHeight + 55 + slotOffset * 65;

    return {
      ...n,
      position: { x: newX, y: newY },
      data: {
        ...n.data,
        laneId: lanes[laneIdx]?.id || n.data.laneId,
        laneName: lanes[laneIdx]?.name || n.data.laneName,
        roleName: n.data.roleName || lanes[laneIdx]?.role || 'Responsable'
      }
    };
  });

  const requiredLaneWidth = Math.max(1600, (maxColumn + 2) * 320);

  // Reconstruir nodos de carril (PoolLane) perfectamente alineados
  const updatedLaneNodes: Node<BpmnNodeData>[] = lanes.map((lane, idx) => {
    const existingLaneNode = project.nodes.find((n) => n.type === 'PoolLane' && n.data?.laneId === lane.id);
    return {
      id: existingLaneNode?.id || `node_${lane.id}`,
      type: 'PoolLane',
      position: { x: 0, y: idx * laneHeight },
      style: { width: requiredLaneWidth, height: laneHeight, zIndex: -10 },
      draggable: false,
      selectable: true,
      data: {
        ...(existingLaneNode?.data || {}),
        standardId: existingLaneNode?.data?.standardId || `CAR-0${idx + 1}`,
        title: `${lane.name} — ${lane.role}`,
        description: existingLaneNode?.data?.description || '',
        nodeType: 'PoolLane',
        laneId: lane.id,
        laneName: lane.name,
        roleName: lane.role,
        itSystem: lane.system || 'GDE',
        legalFramework: '',
        inputs: [],
        outputs: [],
        operationalRisks: [],
        customBgColor: lane.colorHex,
        tags: ['Carril']
      }
    };
  });

  return {
    ...project,
    nodes: [...updatedLaneNodes, ...updatedWorkNodes, ...stickyNodes]
  };
}

/**
 * 2. GENERADOR DE DIAGRAMA BPMN DESDE TEXTO NATURAL O PLANTILLA (PST-083)
 */
export function generateDiagramFromNaturalText(
  project: ProcessProjectFile,
  rawText: string,
  newTitle?: string
): ProcessProjectFile {
  const catalogs = MasterCatalogsService.getCatalogsSync();
  const lines = rawText
    .split(/\n|(?:\.\s+)/)
    .map((s) => s.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((s) => s.length > 4);

  if (lines.length === 0) return project;

  // Identificar o crear carriles (Swimlanes) según roles mencionados o catálogo
  const detectedLanesMap = new Map<string, LaneDefinition>();

  const getOrAddLaneForSentence = (sentence: string): LaneDefinition => {
    const lower = sentence.toLowerCase();

    // Buscar coincidencia en el catálogo ABM de Roles
    const matchedRole = catalogs.roles.find(
      (r) =>
        lower.includes(r.name.toLowerCase()) ||
        lower.includes(r.organizationUnit.toLowerCase().split(' ')[0])
    );

    let areaName = matchedRole?.organizationUnit || 'Área Operativa de Gestión';
    let roleName = matchedRole?.name || 'Analista Responsable';
    let sysName = matchedRole?.defaultSystem || 'Sistema GDE';

    if (!matchedRole) {
      if (lower.includes('mesa de entrada') || lower.includes('recepción') || lower.includes('ciudadano') || lower.includes('admisión')) {
        areaName = 'Mesa General de Entradas y Atención';
        roleName = 'Operador de Recepción';
        sysName = 'Mesa Virtual / GDE';
      } else if (lower.includes('legal') || lower.includes('jurídic') || lower.includes('dictamen') || lower.includes('abogad')) {
        areaName = 'Dirección de Asuntos Jurídicos';
        roleName = 'Abogado Dictaminante';
        sysName = 'GDE / LexDoctor';
      } else if (lower.includes('compra') || lower.includes('contable') || lower.includes('pago') || lower.includes('presupuest') || lower.includes('finanz')) {
        areaName = 'Dirección de Administración y Finanzas';
        roleName = 'Analista Contable';
        sysName = 'ERP Financiero';
      } else if (lower.includes('dirección') || lower.includes('firma') || lower.includes('aprueba') || lower.includes('resolución') || lower.includes('supervisor')) {
        areaName = 'Dirección General / Autoridad';
        roleName = 'Autoridad de Aprobación';
        sysName = 'Portafirmas Digital';
      } else if (lower.includes('calidad') || lower.includes('control') || lower.includes('auditor')) {
        areaName = 'Coordinación de Calidad ISO 9001';
        roleName = 'Inspector de Calidad';
        sysName = 'ProcesStudio SGC';
      }
    }

    const key = `${areaName}__${roleName}`;
    if (!detectedLanesMap.has(key)) {
      const idx = detectedLanesMap.size;
      detectedLanesMap.set(key, {
        id: `lane_gen_${idx + 1}`,
        name: areaName,
        role: roleName,
        system: sysName,
        colorHex: matchedRole?.colorHex || LANE_COLORS[idx % LANE_COLORS.length],
        order: idx
      });
    }
    return detectedLanesMap.get(key)!;
  };

  // Pre-escanear frases para poblar carriles
  lines.forEach((line) => getOrAddLaneForSentence(line));
  const lanes = Array.from(detectedLanesMap.values());
  const firstLane = lanes[0];
  const lastLane = lanes[lanes.length - 1] || firstLane;

  const generatedNodes: Node<BpmnNodeData>[] = [];
  const generatedEdges: Edge<SequenceFlowData>[] = [];

  // 1. Nodo de Inicio
  const startId = 'node_gen_start';
  generatedNodes.push({
    id: startId,
    type: 'StartEvent',
    position: { x: 100, y: 60 },
    data: {
      standardId: 'INI-01',
      title: 'Inicio del Procedimiento',
      description: 'Disparador inicial del proceso operativo.',
      nodeType: 'StartEvent',
      laneId: firstLane.id,
      laneName: firstLane.name,
      roleName: firstLane.role,
      responsible: firstLane.role,
      itSystem: firstLane.system,
      legalFramework: 'ISO 9001:2015',
      inputs: ['Solicitud Inicial / Requerimiento'],
      outputs: ['Trámite Iniciado'],
      operationalRisks: [],
      tags: ['Inicio']
    }
  });

  let prevNodeId = startId;
  let taskCount = 1;
  let gwCount = 1;

  lines.forEach((sentence, idx) => {
    const lane = getOrAddLaneForSentence(sentence);
    const lower = sentence.toLowerCase();

    const isDecision =
      lower.includes('si cumple') ||
      lower.includes('verifica si') ||
      lower.includes('evalúa si') ||
      lower.includes('¿') ||
      lower.includes('decisión') ||
      lower.includes('aprueba o rechaza');

    const isAutomated =
      lower.includes('sistema') ||
      lower.includes('automátic') ||
      lower.includes('notifica por mail') ||
      lower.includes('calcula');

    let nodeType: BpmnNodeType = 'UserTask';
    let stdId = `TSK-0${taskCount++}`;

    if (isDecision) {
      nodeType = 'ExclusiveGateway';
      stdId = `DEC-0${gwCount++}`;
    } else if (isAutomated) {
      nodeType = 'ServiceTask';
    }

    const shortTitle =
      sentence.length > 52 ? sentence.substring(0, 50).trim() + '...' : sentence;

    const nodeId = `node_gen_${idx + 1}`;
    generatedNodes.push({
      id: nodeId,
      type: nodeType,
      position: { x: 350 + idx * 280, y: lane.order * 250 + 55 },
      data: {
        standardId: stdId,
        title: shortTitle,
        description: sentence,
        nodeType,
        laneId: lane.id,
        laneName: lane.name,
        roleName: lane.role,
        responsible: lane.role,
        itSystem: lane.system,
        legalFramework: 'Ley 19.549 / ISO 9001:2015',
        slaDuration: {
          value: isDecision ? 4 : 24,
          unit: 'HOURS',
          iso8601String: isDecision ? 'PT4H' : 'PT24H',
          isPeremptory: isDecision,
          enabled: true
        },
        inputs: idx === 0 ? ['Formulario de Solicitud'] : [`Actuación Etapa ${idx}`],
        outputs: [`Registro ${stdId}`],
        operationalRisks:
          idx === 1
            ? [
                {
                  riskId: 'RSK-01',
                  description: 'Demora o documentación incompleta en la revisión',
                  probability: 'MEDIUM',
                  impact: 'HIGH',
                  mitigatingControl: 'Control de requisitos obligatorios en sistema',
                  controlType: 'PREVENTIVE'
                }
              ]
            : [],
        tags: [lane.role]
      }
    });

    const edgeId = `edge_gen_${prevNodeId}_${nodeId}`;
    generatedEdges.push({
      id: edgeId,
      source: prevNodeId,
      target: nodeId,
      type: 'smartStep',
      data: {
        id: edgeId,
        source: prevNodeId,
        target: nodeId,
        conditionText: '',
        strokeColor: '#38BDF8',
        strokeWidth: 2
      }
    });

    prevNodeId = nodeId;
  });

  // Nodo de Fin
  const endId = 'node_gen_end';
  generatedNodes.push({
    id: endId,
    type: 'EndEvent',
    position: { x: 350 + lines.length * 280, y: lastLane.order * 250 + 60 },
    data: {
      standardId: 'FIN-01',
      title: 'Fin del Procedimiento',
      description: 'Cierre formal, notificación y archivo de las actuaciones.',
      nodeType: 'EndEvent',
      laneId: lastLane.id,
      laneName: lastLane.name,
      roleName: lastLane.role,
      responsible: lastLane.role,
      itSystem: lastLane.system,
      legalFramework: 'ISO 9001:2015',
      inputs: ['Actuación Finalizada'],
      outputs: ['Expediente Archivado y Notificado'],
      operationalRisks: [],
      tags: ['Fin']
    }
  });

  const finalEdgeId = `edge_gen_${prevNodeId}_${endId}`;
  generatedEdges.push({
    id: finalEdgeId,
    source: prevNodeId,
    target: endId,
    type: 'smartStep',
    data: {
      id: finalEdgeId,
      source: prevNodeId,
      target: endId,
      conditionText: '',
      strokeColor: '#10B981',
      strokeWidth: 2
    }
  });

  const updatedProject: ProcessProjectFile = {
    ...project,
    documentControl: {
      ...project.documentControl,
      documentTitle: newTitle?.trim() || project.documentControl.documentTitle,
      processObjective: `Ejecutar de manera controlada y auditable el procedimiento "${newTitle?.trim() || project.documentControl.documentTitle}" cumpliendo los SLAs establecidos.`,
      updatedAt: new Date().toISOString()
    },
    pools: [
      {
        id: project.pools[0]?.id || 'pool_1',
        name: newTitle?.trim() || project.documentControl.documentTitle,
        organization: project.documentControl.organizationUnit,
        lanes
      }
    ],
    nodes: generatedNodes,
    edges: generatedEdges
  };

  return autoLayoutProcessCanvas(updatedProject);
}

/**
 * 3. MEDIDOR DE SALUD Y COMPLETITUD DOCUMENTAL DEL PROCESO ("Process Readiness Score" - PST-087)
 */
export interface ProcessReadinessEvaluation {
  scorePercentage: number;
  passedChecks: number;
  totalChecks: number;
  missingTips: string[];
}

export function calculateProcessReadinessScore(project: ProcessProjectFile | null): ProcessReadinessEvaluation {
  if (!project) {
    return { scorePercentage: 0, passedChecks: 0, totalChecks: 6, missingTips: [] };
  }

  const workNodes = project.nodes.filter((n) => n.type !== 'PoolLane' && n.type !== 'StickyNote');
  const hasStart = workNodes.some((n) => n.type === 'StartEvent');
  const hasEnd = workNodes.some((n) => n.type === 'EndEvent');
  const hasTasks = workNodes.filter((n) => n.type !== 'StartEvent' && n.type !== 'EndEvent').length >= 2;
  const hasLanes = (project.pools[0]?.lanes?.length || 0) >= 1;
  const hasConnections = project.edges.length >= Math.max(1, workNodes.length - 1);
  const hasDescriptions = workNodes.some((n) => (n.data?.description || '').trim().length > 5);

  const checks = [
    { ok: hasStart, tip: 'Agrega un Evento de Inicio' },
    { ok: hasEnd, tip: 'Agrega un Evento de Fin' },
    { ok: hasTasks, tip: 'Incorpora al menos 2 tareas operativas' },
    { ok: hasLanes, tip: 'Define al menos 1 Carril / Área responsable' },
    { ok: hasConnections, tip: 'Conecta todas las figuras del flujo' },
    { ok: hasDescriptions, tip: 'Completa la descripción en las tareas clave' }
  ];

  const passedChecks = checks.filter((c) => c.ok).length;
  const scorePercentage = Math.round((passedChecks / checks.length) * 100);
  const missingTips = checks.filter((c) => !c.ok).map((c) => c.tip);

  return {
    scorePercentage,
    passedChecks,
    totalChecks: checks.length,
    missingTips
  };
}

