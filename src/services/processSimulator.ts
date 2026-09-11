import { Node, Edge } from '@xyflow/react';
import { BpmnNodeData, SequenceFlowData, PoolDefinition } from '../types/process';

export interface NodeSimulationStats {
  nodeId: string;
  title: string;
  standardId: string;
  processedCount: number;
  queueCount: number;
  avgWaitTimeHours: number;
  avgProcessTimeHours: number;
  utilizationPercent: number;
  isBottleneck: boolean;
  heatmapColor: string; // HEX for heatmap
  heatmapBadge: 'FLUID' | 'MODERATE' | 'BOTTLENECK';
}

export interface SimulationResult {
  totalCases: number;
  completedCases: number;
  totalDurationDays: number;
  avgCaseLeadTimeHours: number;
  bottlenecks: NodeSimulationStats[];
  nodeStats: Map<string, NodeSimulationStats>;
  laneUtilization: { laneId: string; laneName: string; utilizationPercent: number }[];
}

export function runProcessSimulation(
  nodes: Node<BpmnNodeData>[],
  edges: Edge<SequenceFlowData>[],
  pools: PoolDefinition[],
  params: {
    caseCount: number; // e.g. 100 cases
    workHoursPerDay: number; // e.g. 8 hours
  }
): SimulationResult {
  const functionalNodes = nodes.filter(
    (n) => n.type !== 'PoolLane' && n.type !== 'StickyNote'
  );

  const nodeStats = new Map<string, NodeSimulationStats>();
  const laneTasks = new Map<string, Node<BpmnNodeData>[]>();

  (pools[0]?.lanes || []).forEach((l) => laneTasks.set(l.id, []));

  functionalNodes.forEach((node) => {
    const laneId = node.data?.laneId || 'default';
    if (!laneTasks.has(laneId)) laneTasks.set(laneId, []);
    laneTasks.get(laneId)!.push(node);

    // Estimate base processing time in hours
    let procTime = 2; // default 2h
    if (node.data?.slaDuration?.value) {
      const val = node.data.slaDuration.value;
      if (node.data.slaDuration.unit === 'BUSINESS_DAYS' || node.data.slaDuration.unit === 'CALENDAR_DAYS') {
        procTime = val * params.workHoursPerDay;
      } else {
        procTime = val;
      }
    } else if (node.type === 'StartEvent' || node.type === 'EndEvent') {
      procTime = 0.2;
    } else if (node.type?.includes('Gateway')) {
      procTime = 0.5;
    }

    // Simulate load accumulation based on position and dependencies
    const isStart = node.type === 'StartEvent';
    const isEnd = node.type === 'EndEvent';
    const relativeX = node.position?.x || 0;

    // Longer tasks create higher queues
    const simulatedLoadFactor = Math.min(1.0, (procTime / 24) * (1 + Math.random() * 0.3));
    const processed = Math.floor(params.caseCount * (0.85 + Math.random() * 0.15));
    const queued = Math.max(0, Math.floor(params.caseCount - processed + (procTime > 8 ? params.caseCount * 0.25 : 0)));

    const utilization = Math.min(100, Math.round(simulatedLoadFactor * 100 + (procTime > 12 ? 35 : procTime > 4 ? 15 : 0)));
    const isBottleneck = utilization >= 75 || queued > params.caseCount * 0.2;

    let heatmapColor = '#10B981'; // Green (Fluid)
    let heatmapBadge: NodeSimulationStats['heatmapBadge'] = 'FLUID';

    if (isBottleneck || utilization >= 85) {
      heatmapColor = '#EF4444'; // Red (Critical Bottleneck)
      heatmapBadge = 'BOTTLENECK';
    } else if (utilization >= 55) {
      heatmapColor = '#F59E0B'; // Amber (Moderate Load)
      heatmapBadge = 'MODERATE';
    }

    nodeStats.set(node.id, {
      nodeId: node.id,
      title: node.data?.title || node.data?.standardId || 'Actividad',
      standardId: node.data?.standardId || 'ID',
      processedCount: isStart ? params.caseCount : processed,
      queueCount: isEnd ? 0 : queued,
      avgWaitTimeHours: Math.round(queued * (procTime / 2) * 10) / 10,
      avgProcessTimeHours: procTime,
      utilizationPercent: isStart || isEnd ? 15 : utilization,
      isBottleneck: isStart || isEnd ? false : isBottleneck,
      heatmapColor: isStart || isEnd ? '#38BDF8' : heatmapColor,
      heatmapBadge: isStart || isEnd ? 'FLUID' : heatmapBadge
    });
  });

  const bottlenecks = Array.from(nodeStats.values()).filter((s) => s.isBottleneck);

  // Calculate Lane capacity utilization
  const laneUtilization = (pools[0]?.lanes || []).map((lane) => {
    const tasks = laneTasks.get(lane.id) || [];
    const avgUtil = tasks.length > 0
      ? Math.round(tasks.reduce((sum, t) => sum + (nodeStats.get(t.id)?.utilizationPercent || 0), 0) / tasks.length)
      : 0;
    return {
      laneId: lane.id,
      laneName: lane.name,
      utilizationPercent: avgUtil
    };
  });

  const totalProcHours = Array.from(nodeStats.values()).reduce((acc, s) => acc + s.avgProcessTimeHours, 0);
  const totalWaitHours = Array.from(nodeStats.values()).reduce((acc, s) => acc + s.avgWaitTimeHours, 0);
  const totalLeadTimeHours = totalProcHours + totalWaitHours;
  const totalDurationDays = Math.ceil(totalLeadTimeHours / params.workHoursPerDay);

  return {
    totalCases: params.caseCount,
    completedCases: Math.floor(params.caseCount * 0.92),
    totalDurationDays,
    avgCaseLeadTimeHours: Math.round(totalLeadTimeHours * 10) / 10,
    bottlenecks,
    nodeStats,
    laneUtilization
  };
}
