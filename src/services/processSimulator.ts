import { Node, Edge } from '@xyflow/react';
import { BpmnNodeData, SequenceFlowData, PoolDefinition } from '../types/process';

export interface NodeSimulationStats {
  nodeId: string;
  title: string;
  standardId: string;
  passProbability: number;
  expectedCases: number;
  processedCount: number;
  queueCount: number;
  avgWaitTimeHours: number;
  avgProcessTimeHours: number;
  utilizationPercent: number;
  isBottleneck: boolean;
  heatmapColor: string; // HEX for heatmap
  heatmapBadge: 'FLUID' | 'MODERATE' | 'BOTTLENECK';
}

export interface LaneSimulationSummary {
  laneId: string;
  laneName: string;
  people: number;
  loadHours: number;
  capacityHours: number;
  utilizationPercent: number;
}

export interface SimulationResult {
  totalCases: number;
  completedCases: number;
  effectivenessPercent: number;
  periodDays: number;
  peoplePerLane: number;
  totalDurationDays: number;
  avgCaseLeadTimeHours: number;
  avgLaneUtilizationPercent: number;
  bottlenecks: NodeSimulationStats[];
  nodeStats: Map<string, NodeSimulationStats>;
  laneUtilization: LaneSimulationSummary[];
}

export interface SimulationParams {
  caseCount: number; // e.g. 50 cases
  workHoursPerDay: number; // e.g. 8 hours
  peoplePerLane?: number | Record<string, number>; // default 1
  periodDays?: number; // default 20 días hábiles
}

/**
 * Calcula la probabilidad determinista de paso por cada nodo según la topología:
 * - Las compuertas XOR (y genéricas) reparten el flujo en partes iguales entre sus salidas.
 * - Las compuertas paralelas (AND) envían el 100 % de los casos por cada rama.
 * - Ignora ciclos de retorno para evitar bucles infinitos.
 */
function computePassProbabilities(
  functionalNodes: Node<BpmnNodeData>[],
  edges: Edge<SequenceFlowData>[]
): Map<string, number> {
  const prob = new Map<string, number>();
  if (functionalNodes.length === 0) return prob;

  const nodeMap = new Map(functionalNodes.map((n) => [n.id, n]));
  const adj = new Map<string, string[]>();
  functionalNodes.forEach((n) => adj.set(n.id, []));

  edges.forEach((e) => {
    if (nodeMap.has(e.source) && nodeMap.has(e.target) && e.source !== e.target) {
      adj.get(e.source)!.push(e.target);
    }
  });

  // Orden topológico por DFS descartando aristas de retorno
  const state = new Map<string, 0 | 1 | 2>();
  const forward = new Map<string, string[]>();
  const incomingCount = new Map<string, number>();
  functionalNodes.forEach((n) => incomingCount.set(n.id, 0));

  const order: string[] = [];
  const visit = (id: string) => {
    state.set(id, 1);
    const kept: string[] = [];
    for (const next of adj.get(id) || []) {
      const s = state.get(next) || 0;
      if (s === 1) continue;
      kept.push(next);
      incomingCount.set(next, (incomingCount.get(next) || 0) + 1);
      if (s === 0) visit(next);
    }
    forward.set(id, kept);
    state.set(id, 2);
    order.push(id);
  };

  const startNodes = functionalNodes.filter((n) => n.type === 'StartEvent');
  [...startNodes.map((n) => n.id), ...functionalNodes.map((n) => n.id)].forEach((id) => {
    if (!state.get(id)) visit(id);
  });
  order.reverse();

  const roots = startNodes.length > 0
    ? startNodes.map((n) => n.id)
    : functionalNodes.filter((n) => (incomingCount.get(n.id) || 0) === 0).map((n) => n.id);

  const rootPool = roots.length > 0 ? roots : [functionalNodes[0].id];
  const initialProb = 1 / rootPool.length;
  rootPool.forEach((id) => prob.set(id, initialProb));

  for (const id of order) {
    const p = prob.get(id) || 0;
    if (p <= 0) continue;
    const outs = forward.get(id) || [];
    if (outs.length === 0) continue;

    const node = nodeMap.get(id)!;
    const isParallel = node.type === 'ParallelGateway';
    const isXor = !isParallel && Boolean(node.type?.includes('Gateway'));
    const share = isXor ? p / outs.length : p;

    for (const next of outs) {
      prob.set(next, Math.min(1, (prob.get(next) || 0) + share));
    }
  }

  return prob;
}

function getNodeProcessHours(node: Node<BpmnNodeData>, workHoursPerDay: number): number {
  if (node.data?.slaDuration?.value && node.data.slaDuration.value > 0) {
    const val = node.data.slaDuration.value;
    if (node.data.slaDuration.unit === 'BUSINESS_DAYS' || node.data.slaDuration.unit === 'CALENDAR_DAYS') {
      return val * workHoursPerDay;
    }
    return val;
  }
  if (node.type === 'StartEvent' || node.type === 'EndEvent') return 0;
  if (node.type?.includes('Gateway')) return 0.5;
  return 2;
}

function estimateWaitHours(procTime: number, utilizationRatio: number): number {
  if (procTime <= 0 || utilizationRatio <= 0.5) return 0;
  const raw = utilizationRatio >= 0.9
    ? procTime * utilizationRatio * 2
    : procTime * ((utilizationRatio - 0.5) / (1 - utilizationRatio)) * 0.5;
  return Math.round(raw * 10) / 10;
}

export function runProcessSimulation(
  nodes: Node<BpmnNodeData>[],
  edges: Edge<SequenceFlowData>[],
  pools: PoolDefinition[],
  params: SimulationParams
): SimulationResult {
  const caseCount = Math.max(0, params.caseCount);
  const workHoursPerDay = Math.max(1, params.workHoursPerDay);
  const periodDays = Math.max(1, params.periodDays ?? 20);
  const defaultPeople = typeof params.peoplePerLane === 'number' ? Math.max(1, params.peoplePerLane) : 1;

  const functionalNodes = nodes.filter(
    (n) => n.type !== 'PoolLane' && n.type !== 'StickyNote'
  );

  const passProb = computePassProbabilities(functionalNodes, edges);
  const procTimeByNode = new Map<string, number>();
  const laneTasks = new Map<string, Node<BpmnNodeData>[]>();

  (pools[0]?.lanes || []).forEach((l) => laneTasks.set(l.id, []));

  functionalNodes.forEach((node) => {
    const laneId = node.data?.laneId || 'default';
    if (!laneTasks.has(laneId)) laneTasks.set(laneId, []);
    laneTasks.get(laneId)!.push(node);
    procTimeByNode.set(node.id, getNodeProcessHours(node, workHoursPerDay));
  });

  // Carga y capacidad por carril
  const laneRatioMap = new Map<string, number>();
  const laneUtilization: LaneSimulationSummary[] = [];

  const configuredLanes = pools[0]?.lanes || [];
  const laneMeta = new Map(configuredLanes.map((l) => [l.id, l.name]));
  const laneIds = configuredLanes.length > 0
    ? configuredLanes.map((l) => l.id)
    : Array.from(laneTasks.keys());

  for (const laneId of laneIds) {
    const tasks = laneTasks.get(laneId) || [];
    const people = typeof params.peoplePerLane === 'number'
      ? Math.max(1, params.peoplePerLane)
      : Math.max(1, params.peoplePerLane?.[laneId] ?? 1);
    const capacityHours = people * workHoursPerDay * periodDays;
    const loadHours = tasks.reduce((sum, n) => {
      const p = passProb.get(n.id) || 0;
      const t = procTimeByNode.get(n.id) || 0;
      return sum + caseCount * p * t;
    }, 0);

    const ratio = capacityHours > 0 ? loadHours / capacityHours : 0;
    laneRatioMap.set(laneId, ratio);
    laneUtilization.push({
      laneId,
      laneName: laneMeta.get(laneId) || 'Área General',
      people,
      loadHours: Math.round(loadHours * 10) / 10,
      capacityHours,
      utilizationPercent: Math.round(ratio * 100)
    });
  }

  const maxLaneRatio = Math.max(1, ...Array.from(laneRatioMap.values()));
  const completionRatio = 1 / maxLaneRatio;
  const completedCases = Math.round(caseCount * completionRatio);
  const effectivenessPercent = caseCount > 0 ? Math.round((completedCases / caseCount) * 100) : 100;

  const nodeStats = new Map<string, NodeSimulationStats>();
  let expectedCycleHours = 0;

  functionalNodes.forEach((node) => {
    const isStart = node.type === 'StartEvent';
    const isEnd = node.type === 'EndEvent';
    const laneId = node.data?.laneId || 'default';
    const laneRatio = laneRatioMap.get(laneId) ?? 0;

    const p = passProb.get(node.id) || 0;
    const expectedCases = Math.round(caseCount * p * 10) / 10;
    const procTime = procTimeByNode.get(node.id) || 0;
    const processed = Math.round(expectedCases * (laneRatio > 1 ? 1 / laneRatio : 1));
    const queued = Math.max(0, Math.round(expectedCases - processed));
    const waitHours = isStart || isEnd ? 0 : estimateWaitHours(procTime, laneRatio);

    expectedCycleHours += p * (procTime + waitHours);

    const utilization = isStart || isEnd ? 0 : Math.round(laneRatio * 100);
    const isBottleneck = !isStart && !isEnd && expectedCases > 0 && procTime > 0 && (utilization >= 85 || queued > expectedCases * 0.2);

    let heatmapColor = '#10B981';
    let heatmapBadge: NodeSimulationStats['heatmapBadge'] = 'FLUID';
    if (isBottleneck) {
      heatmapColor = '#EF4444';
      heatmapBadge = 'BOTTLENECK';
    } else if (utilization >= 55) {
      heatmapColor = '#F59E0B';
      heatmapBadge = 'MODERATE';
    }

    nodeStats.set(node.id, {
      nodeId: node.id,
      title: node.data?.title || node.data?.standardId || 'Actividad',
      standardId: node.data?.standardId || 'ID',
      passProbability: Math.round(p * 1000) / 1000,
      expectedCases,
      processedCount: processed,
      queueCount: isEnd ? 0 : queued,
      avgWaitTimeHours: waitHours,
      avgProcessTimeHours: procTime,
      utilizationPercent: utilization,
      isBottleneck,
      heatmapColor: isStart || isEnd ? '#38BDF8' : heatmapColor,
      heatmapBadge: isStart || isEnd ? 'FLUID' : heatmapBadge
    });
  });

  const bottlenecks = Array.from(nodeStats.values()).filter((s) => s.isBottleneck);
  const avgCaseLeadTimeHours = Math.round(expectedCycleHours * 10) / 10;
  const totalDurationDays = avgCaseLeadTimeHours > 0 ? Math.ceil(avgCaseLeadTimeHours / workHoursPerDay) : 0;
  const avgLaneUtilizationPercent = laneUtilization.length > 0
    ? Math.round(laneUtilization.reduce((acc, l) => acc + l.utilizationPercent, 0) / laneUtilization.length)
    : 0;

  return {
    totalCases: caseCount,
    completedCases,
    effectivenessPercent,
    periodDays,
    peoplePerLane: defaultPeople,
    totalDurationDays,
    avgCaseLeadTimeHours,
    avgLaneUtilizationPercent,
    bottlenecks,
    nodeStats,
    laneUtilization
  };
}
