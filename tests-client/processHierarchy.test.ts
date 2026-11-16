import { describe, expect, it } from 'vitest';
import type { Node } from '@xyflow/react';
import { formatHierarchicalStandardId } from '../src/services/processHierarchyService';
import type { BpmnNodeData } from '../src/types/process';

function nodeWithId(standardId: string, type = 'UserTask'): Node<BpmnNodeData> {
  return {
    id: `n_${standardId}`,
    type,
    position: { x: 0, y: 0 },
    data: {
      standardId,
      title: standardId,
      description: '',
      nodeType: type as BpmnNodeData['nodeType'],
      laneId: 'lane_1',
      itSystem: 'GDE',
      legalFramework: '',
      inputs: [],
      outputs: [],
      operationalRisks: []
    }
  };
}

describe('Identificadores correlativos unificados (PST-113)', () => {
  it('usa formato PREFIJO-NN en el proceso principal, igual que el generador', () => {
    expect(formatHierarchicalStandardId('P01', 'N00', 'StartEvent', [])).toBe('INI-01');
    expect(formatHierarchicalStandardId('P01', 'N00', 'UserTask', [])).toBe('TSK-01');
    expect(formatHierarchicalStandardId('P01', 'N00', 'ServiceTask', [])).toBe('SRV-01');
    expect(formatHierarchicalStandardId('P01', 'N00', 'ManualTask', [])).toBe('MNL-01');
    expect(formatHierarchicalStandardId('P01', 'N00', 'ExclusiveGateway', [])).toBe('GTW-01');
    expect(formatHierarchicalStandardId('P01', 'N00', 'ParallelGateway', [])).toBe('PAR-01');
    expect(formatHierarchicalStandardId('P01', 'N00', 'QualityCheckpointEvent', [])).toBe('QCP-01');
    expect(formatHierarchicalStandardId('P01', 'N00', 'SubProcess', [])).toBe('SUB-01');
    expect(formatHierarchicalStandardId('P01', 'N00', 'EndEvent', [])).toBe('FIN-01');
  });

  it('toma el mayor existente + 1 para no repetir IDs tras borrar', () => {
    const nodes = [nodeWithId('TSK-01'), nodeWithId('TSK-03')];
    expect(formatHierarchicalStandardId('P01', 'N00', 'UserTask', nodes)).toBe('TSK-04');
  });

  it('supera el salto TSK-09 -> TSK-10 y tolera IDs legados P01-N00-TSK-010', () => {
    const nodes = [nodeWithId('TSK-09'), nodeWithId('P01-N00-TSK-010')];
    expect(formatHierarchicalStandardId('P01', 'N00', 'UserTask', nodes)).toBe('TSK-11');
  });

  it('mantiene el prefijo jerárquico dentro de un subproceso', () => {
    const nodes = [nodeWithId('P02-N01-TSK-01'), nodeWithId('P02-N01-TSK-02')];
    expect(formatHierarchicalStandardId('P02', 'N01', 'UserTask', nodes)).toBe('P02-N01-TSK-03');
    expect(formatHierarchicalStandardId('P02', 'N01', 'ExclusiveGateway', nodes)).toBe('P02-N01-GTW-01');
  });
});

