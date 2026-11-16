import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import { computeRaciMatrix } from '../src/services/raciCalculator';
import { generateSipocMatrix } from '../src/services/sipocEngine';
import { runQualityAudit } from '../src/services/qualityLinter';
import type { BpmnNodeData, PoolDefinition, SequenceFlowData } from '../src/types/process';

const pools: PoolDefinition[] = [
  {
    id: 'pool_1',
    name: 'Proceso',
    organization: 'Org',
    lanes: [
      { id: 'lane_1', name: 'Mesa de Entradas', role: 'Operador', system: 'GDE', colorHex: '#0284C7', order: 0 },
      { id: 'lane_2', name: 'Asuntos Jurídicos', role: 'Abogado', system: 'Lex', colorHex: '#10B981', order: 1 }
    ]
  }
];

function makeNode(
  id: string,
  type: Node<BpmnNodeData>['type'],
  laneId: string,
  title: string,
  standardId = id
): Node<BpmnNodeData> {
  return {
    id,
    type,
    position: { x: 100, y: 50 },
    data: {
      standardId,
      title,
      description: '',
      nodeType: type as BpmnNodeData['nodeType'],
      laneId,
      laneName: laneId === 'lane_1' ? 'Mesa de Entradas' : 'Asuntos Jurídicos',
      roleName: laneId === 'lane_1' ? 'Operador' : 'Abogado',
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
  return { id, source, target, type: 'sequenceFlow', data: { id, source, target } };
}

describe('RACI, SIPOC y Auditor WARN-QUAL-002 (PST-115)', () => {
  const nodes: Node<BpmnNodeData>[] = [
    makeNode('car_1', 'PoolLane', 'lane_1', 'Mesa de Entradas', 'CAR-01'),
    makeNode('note_1', 'StickyNote', 'lane_1', 'Nota interna', 'NOT-01'),
    makeNode('ini_1', 'StartEvent', 'lane_1', 'Inicio', 'INI-01'),
    makeNode('tsk_1', 'UserTask', 'lane_1', 'Recibir solicitud', 'TSK-01'),
    makeNode('tsk_2', 'UserTask', 'lane_2', 'Emitir dictamen', 'TSK-02'),
    makeNode('gtw_1', 'ExclusiveGateway', 'lane_2', '¿Aprobado?', 'GTW-01'),
    makeNode('fin_1', 'EndEvent', 'lane_2', 'Fin', 'FIN-01')
  ];

  const edges: Edge<SequenceFlowData>[] = [
    makeEdge('ini_1', 'tsk_1'),
    makeEdge('tsk_1', 'tsk_2'),
    makeEdge('tsk_2', 'gtw_1'),
    makeEdge('gtw_1', 'fin_1')
  ];

  it('RACI excluye carriles, notas e inicio/fin y asigna "A/R" al carril responsable', () => {
    const raci = computeRaciMatrix(nodes, edges, pools);
    expect(raci.rows.map((r) => r.standardId)).toEqual(['TSK-01', 'TSK-02', 'GTW-01']);

    expect(raci.rows[0].assignments['lane_1']).toBe('A/R');
    expect(raci.rows[0].assignments['lane_2']).toBe('I');
    expect(raci.rows[1].assignments['lane_2']).toBe('A/R');
    expect(raci.rows[1].assignments['lane_1']).toBe('I');
    expect(raci.accountableWarnings).toEqual([]);
  });

  it('RACI aplica raciOverrides y detecta actividades con 0 o más de un "A"', () => {
    const raci = computeRaciMatrix(nodes, edges, pools, {
      tsk_1: { lane_1: 'R' }, // 0 "A"
      tsk_2: { lane_1: 'A', lane_2: 'A/R' } // 2 "A"
    });

    expect(raci.rows[0].assignments['lane_1']).toBe('R');
    expect(raci.rows[1].assignments['lane_1']).toBe('A');
    expect(raci.rows[1].assignments['lane_2']).toBe('A/R');
    expect(raci.accountableWarnings).toEqual([
      { taskId: 'tsk_1', standardId: 'TSK-01', title: 'Recibir solicitud', accountableCount: 0 },
      { taskId: 'tsk_2', standardId: 'TSK-02', title: 'Emitir dictamen', accountableCount: 2 }
    ]);
  });

  it('SIPOC excluye carriles (CAR-xx), notas e inicio/fin de las filas', () => {
    const sipoc = generateSipocMatrix(nodes, edges, pools);
    expect(sipoc.map((s) => s.standardId)).toEqual(['TSK-01', 'TSK-02', 'GTW-01']);
    expect(sipoc.some((s) => s.standardId.startsWith('CAR-'))).toBe(false);
  });

  it('Auditor emite WARN-QUAL-002 para tareas sin título o con texto por defecto', () => {
    const untitledNodes = [
      makeNode('ini_1', 'StartEvent', 'lane_1', 'Inicio', 'INI-01'),
      makeNode('tsk_empty', 'UserTask', 'lane_1', '', 'TSK-01'),
      makeNode('tsk_default', 'UserTask', 'lane_1', 'Nueva Tarea de Usuario', 'TSK-02'),
      makeNode('tsk_ok', 'UserTask', 'lane_1', 'Validar requisitos', 'TSK-03'),
      makeNode('fin_1', 'EndEvent', 'lane_1', 'Fin', 'FIN-01')
    ];
    const untitledEdges = [
      makeEdge('ini_1', 'tsk_empty'),
      makeEdge('tsk_empty', 'tsk_default'),
      makeEdge('tsk_default', 'tsk_ok'),
      makeEdge('tsk_ok', 'fin_1')
    ];

    const audit = runQualityAudit(untitledNodes, untitledEdges, pools);
    const titleWarnings = audit.issues.filter((i) => i.code === 'WARN-QUAL-002');
    expect(titleWarnings.map((i) => i.nodeId)).toEqual(['tsk_empty', 'tsk_default']);
  });
});

