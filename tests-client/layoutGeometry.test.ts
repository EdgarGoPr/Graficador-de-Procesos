import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import {
  autoLayoutProcessCanvas,
  boxesOverlap,
  detectLaneIdAtY,
  estimateNodeSize,
  findFreePosition,
  findOverlaps,
  NODE_MARGIN,
  placeNodeWithoutOverlap
} from '../src/utils/layoutGeometry';
import type { BpmnNodeData, SequenceFlowData } from '../src/types/process';
import type { ProcessProjectFile } from '../src/types/project';

function makeNode(
  id: string,
  type: Node<BpmnNodeData>['type'],
  laneId: string,
  x = 0,
  y = 0
): Node<BpmnNodeData> {
  return {
    id,
    type,
    position: { x, y },
    data: {
      standardId: id,
      title: id,
      description: '',
      nodeType: type as BpmnNodeData['nodeType'],
      laneId,
      laneName: laneId,
      roleName: 'Analista',
      itSystem: 'GDE',
      legalFramework: '',
      inputs: [],
      outputs: [],
      operationalRisks: []
    }
  };
}

function makeEdge(source: string, target: string): Edge<SequenceFlowData> {
  const id = `e_${source}_${target}`;
  return {
    id,
    source,
    target,
    type: 'smartStep',
    data: { id, source, target, conditionText: '' }
  };
}

describe('Geometría y Auto-Ordenar del lienzo (PST-114)', () => {
  it('detecta superposiciones y encuentra una posición libre dentro de los límites del carril', () => {
    const size = estimateNodeSize({ type: 'UserTask' });
    const obstacle = { x: 300, y: 80, ...size };
    expect(boxesOverlap(obstacle, { x: 320, y: 100, ...size }, NODE_MARGIN)).toBe(true);

    const free = findFreePosition({ x: 300, y: 80 }, size, [obstacle], { minY: 20, maxY: 300 });
    expect(free.y).toBeGreaterThanOrEqual(20);
    expect(free.y + size.height).toBeLessThanOrEqual(300);
    expect(boxesOverlap({ ...free, ...size }, obstacle, NODE_MARGIN)).toBe(false);
  });

  it('apila nodos de una misma columna y carril sin superposiciones y expande el alto del carril', () => {
    const project: ProcessProjectFile = {
      schemaVersion: '1.0.0',
      documentControl: {
        documentTitle: 'Test Layout',
        documentCode: 'PRC-0002',
        version: 'v1.0',
        authorName: 'Analista',
        organizationUnit: 'Operaciones',
        processObjective: 'Test',
        createdAt: '2026-11-16T00:00:00.000Z',
        updatedAt: '2026-11-16T00:00:00.000Z',
        status: 'DRAFT',
        legalNormativeBasis: [],
        revisionHistory: []
      },
      pools: [
        {
          id: 'pool_1',
          name: 'Test',
          organization: 'Operaciones',
          lanes: [
            { id: 'lane_1', name: 'Área 1', role: 'Rol 1', system: 'GDE', colorHex: '#0284C7', order: 0 },
            { id: 'lane_2', name: 'Área 2', role: 'Rol 2', system: 'GDE', colorHex: '#10B981', order: 1 }
          ]
        }
      ],
      nodes: [
        makeNode('ini', 'StartEvent', 'lane_1'),
        makeNode('gtw', 'ExclusiveGateway', 'lane_1'),
        makeNode('t1', 'UserTask', 'lane_1'),
        makeNode('t2', 'UserTask', 'lane_1'),
        makeNode('t3', 'UserTask', 'lane_1'),
        makeNode('t4', 'SubProcess', 'lane_2'),
        makeNode('fin', 'EndEvent', 'lane_1'),
        makeNode('note', 'StickyNote', 'lane_1', 200, 100)
      ],
      edges: [
        makeEdge('ini', 'gtw'),
        makeEdge('gtw', 't1'),
        makeEdge('gtw', 't2'),
        makeEdge('gtw', 't3'),
        makeEdge('gtw', 't4'),
        makeEdge('t1', 'fin'),
        makeEdge('t2', 'fin'),
        makeEdge('t3', 'fin'),
        makeEdge('t4', 'fin')
      ]
    };

    const laidOut = autoLayoutProcessCanvas(project);
    const nonLaneNodes = laidOut.nodes.filter((n) => n.type !== 'PoolLane');
    expect(findOverlaps(nonLaneNodes, NODE_MARGIN)).toEqual([]);

    const lane1 = laidOut.nodes.find((n) => n.type === 'PoolLane' && n.data.laneId === 'lane_1')!;
    const lane2 = laidOut.nodes.find((n) => n.type === 'PoolLane' && n.data.laneId === 'lane_2')!;
    // 3 tareas apiladas en lane_1 requieren más de los 250 px fijos anteriores
    expect(Number(lane1.style?.height)).toBeGreaterThan(250);
    // lane_2 arranca exactamente donde termina lane_1
    expect(lane2.position.y).toBe(Number(lane1.style?.height));
  });

  it('placeNodeWithoutOverlap evita superposiciones al agregar o conectar dentro del carril', () => {
    const laneNode: Node<BpmnNodeData> = {
      ...makeNode('lane_node_1', 'PoolLane', 'lane_1', 0, 0),
      style: { width: 1800, height: 280 }
    };
    const existingTask = makeNode('tsk_1', 'UserTask', 'lane_1', 300, 60);
    const nodes = [laneNode, existingTask];

    expect(detectLaneIdAtY(nodes, 120)).toBe('lane_1');

    const placed = placeNodeWithoutOverlap({ x: 300, y: 60 }, 'UserTask', nodes, 'lane_1');
    const newNode = makeNode('tsk_2', 'UserTask', 'lane_1', placed.x, placed.y);
    expect(placed.y).toBeGreaterThanOrEqual(12);
    expect(placed.y + estimateNodeSize(newNode).height).toBeLessThanOrEqual(268);
    expect(findOverlaps([existingTask, newNode], NODE_MARGIN)).toEqual([]);
  });
});
