import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import { runProcessSimulation } from '../src/services/processSimulator';
import type { BpmnNodeData, PoolDefinition, SequenceFlowData } from '../src/types/process';

const pools: PoolDefinition[] = [
  {
    id: 'pool_1',
    name: 'Simulación',
    organization: 'Org',
    lanes: [
      { id: 'lane_1', name: 'Recepción', role: 'Operador', system: 'GDE', colorHex: '#0284C7', order: 0 },
      { id: 'lane_2', name: 'Análisis', role: 'Analista', system: 'GDE', colorHex: '#10B981', order: 1 }
    ]
  }
];

function taskNode(id: string, laneId: string, hours: number): Node<BpmnNodeData> {
  return {
    id,
    type: 'UserTask',
    position: { x: 0, y: 0 },
    data: {
      standardId: id.toUpperCase(),
      title: id,
      description: '',
      nodeType: 'UserTask',
      laneId,
      itSystem: 'GDE',
      legalFramework: '',
      slaDuration: { value: hours, unit: 'HOURS', iso8601String: `PT${hours}H`, isPeremptory: false, enabled: true },
      inputs: [],
      outputs: [],
      operationalRisks: []
    }
  };
}

function simpleNode(id: string, type: Node<BpmnNodeData>['type'], laneId: string): Node<BpmnNodeData> {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: {
      standardId: id.toUpperCase(),
      title: id,
      description: '',
      nodeType: type as BpmnNodeData['nodeType'],
      laneId,
      itSystem: 'GDE',
      legalFramework: '',
      inputs: [],
      outputs: [],
      operationalRisks: []
    }
  };
}

function edge(source: string, target: string): Edge<SequenceFlowData> {
  const id = `e_${source}_${target}`;
  return { id, source, target, type: 'sequenceFlow', data: { id, source, target } };
}

describe('Simulador determinista (PST-116)', () => {
  it('reparte ramas XOR en partes iguales, envía 100 % a ramas paralelas y es determinista', () => {
    const nodes: Node<BpmnNodeData>[] = [
      simpleNode('ini', 'StartEvent', 'lane_1'),
      simpleNode('xor', 'ExclusiveGateway', 'lane_1'),
      taskNode('t_a', 'lane_1', 8),
      taskNode('t_b', 'lane_1', 2),
      simpleNode('and', 'ParallelGateway', 'lane_2'),
      taskNode('p_1', 'lane_2', 4),
      taskNode('p_2', 'lane_2', 4),
      simpleNode('fin', 'EndEvent', 'lane_2')
    ];
    const edges: Edge<SequenceFlowData>[] = [
      edge('ini', 'xor'),
      edge('xor', 't_a'),
      edge('xor', 't_b'),
      edge('t_a', 'and'),
      edge('t_b', 'and'),
      edge('and', 'p_1'),
      edge('and', 'p_2'),
      edge('p_1', 'fin'),
      edge('p_2', 'fin')
    ];

    const r1 = runProcessSimulation(nodes, edges, pools, {
      caseCount: 8,
      workHoursPerDay: 8,
      peoplePerLane: 1,
      periodDays: 20
    });
    const r2 = runProcessSimulation(nodes, edges, pools, {
      caseCount: 8,
      workHoursPerDay: 8,
      peoplePerLane: 1,
      periodDays: 20
    });

    expect(r1).toEqual(r2);
    expect(r1.nodeStats.get('t_a')!.passProbability).toBe(0.5);
    expect(r1.nodeStats.get('t_b')!.passProbability).toBe(0.5);
    expect(r1.nodeStats.get('and')!.passProbability).toBe(1);
    expect(r1.nodeStats.get('p_1')!.passProbability).toBe(1);
    expect(r1.nodeStats.get('p_2')!.passProbability).toBe(1);
    // Tiempo esperado por caso con baja utilización (<= 50 %, espera 0): xor(0.5) + 0.5*8 + 0.5*2 + and(0.5) + 4 + 4 = 14h
    expect(r1.avgCaseLeadTimeHours).toBe(14);
    expect(r1.completedCases).toBe(8);
    expect(r1.effectivenessPercent).toBe(100);

    // Con 10 casos la carga en lane_2 supera el 50 % (85h/160h = 53 %) y suma tiempo de espera
    const higherLoad = runProcessSimulation(nodes, edges, pools, {
      caseCount: 10,
      workHoursPerDay: 8,
      peoplePerLane: 1,
      periodDays: 20
    });
    expect(higherLoad.avgCaseLeadTimeHours).toBeGreaterThan(14);
  });

  it('limita la efectividad si un carril se satura y responde a personas por carril y días del período', () => {
    const nodes: Node<BpmnNodeData>[] = [
      simpleNode('ini', 'StartEvent', 'lane_1'),
      taskNode('heavy', 'lane_1', 16), // 100 casos * 16h = 1600h de carga
      simpleNode('fin', 'EndEvent', 'lane_1')
    ];
    const edges = [edge('ini', 'heavy'), edge('heavy', 'fin')];

    // 1 persona * 8h * 20 días = 160h de capacidad -> 1000 % de utilización -> solo 10 % completado
    const saturated = runProcessSimulation(nodes, edges, [pools[0]], {
      caseCount: 100,
      workHoursPerDay: 8,
      peoplePerLane: 1,
      periodDays: 20
    });

    expect(saturated.laneUtilization[0].utilizationPercent).toBe(1000);
    expect(saturated.completedCases).toBe(10);
    expect(saturated.effectivenessPercent).toBe(10);
    expect(saturated.bottlenecks.length).toBe(1);

    // Con 10 personas y 20 días (1600h capacidad) cubre exactamente la demanda -> 100 % completado
    const balanced = runProcessSimulation(nodes, edges, [pools[0]], {
      caseCount: 100,
      workHoursPerDay: 8,
      peoplePerLane: 10,
      periodDays: 20
    });
    expect(balanced.laneUtilization[0].utilizationPercent).toBe(100);
    expect(balanced.completedCases).toBe(100);
    expect(balanced.effectivenessPercent).toBe(100);
  });
});
