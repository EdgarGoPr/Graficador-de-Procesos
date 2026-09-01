import { Node, Edge } from '@xyflow/react';
import { BpmnNodeData, PoolDefinition, SequenceFlowData } from '../types/process';
import { SipocEntry } from '../types/quality';

/**
 * ISO 9001:2015 SIPOC Auto-Generation Engine
 * Automatically extracts Suppliers, Inputs, Process Steps, Outputs, and Customers
 * from the React Flow graph topology and node metadata.
 */
export function generateSipocMatrix(
  nodes: Node<BpmnNodeData>[],
  edges: Edge<SequenceFlowData>[],
  pools: PoolDefinition[]
): SipocEntry[] {
  // Build lane lookup
  const laneMap = new Map<string, { laneName: string; roleName: string }>();
  pools.forEach(pool => {
    pool.lanes.forEach(lane => {
      laneMap.set(lane.id, { laneName: lane.name, roleName: lane.role });
    });
  });

  // Map of incoming & outgoing nodes
  const incomingMap = new Map<string, Node<BpmnNodeData>[]>();
  const outgoingMap = new Map<string, Node<BpmnNodeData>[]>();

  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (sourceNode && targetNode) {
      if (!incomingMap.has(targetNode.id)) incomingMap.set(targetNode.id, []);
      incomingMap.get(targetNode.id)!.push(sourceNode);

      if (!outgoingMap.has(sourceNode.id)) outgoingMap.set(sourceNode.id, []);
      outgoingMap.get(sourceNode.id)!.push(targetNode);
    }
  });

  const entries: SipocEntry[] = [];

  // Filter for substantive process steps (Tasks, Checkpoints, SubProcesses, Events)
  nodes.forEach(node => {
    const data = node.data;
    if (!data) return;

    const laneInfo = laneMap.get(data.laneId) || {
      laneName: data.laneName || 'General',
      roleName: data.roleName || 'Operador',
    };

    // Calculate Supplier (preceding step roles or initial initiator)
    const incomingNodes = incomingMap.get(node.id) || [];
    let supplierText = '';
    if (incomingNodes.length > 0) {
      const suppliers = incomingNodes.map(inNode => {
        const inLane = laneMap.get(inNode.data.laneId);
        return inLane ? inLane.roleName : inNode.data.title;
      });
      supplierText = Array.from(new Set(suppliers)).join(' / ');
    } else {
      supplierText = laneInfo.roleName || 'Iniciador del Trámite';
    }

    // Calculate Customer (subsequent step roles or final beneficiary)
    const outgoingNodes = outgoingMap.get(node.id) || [];
    let customerText = '';
    if (outgoingNodes.length > 0) {
      const customers = outgoingNodes.map(outNode => {
        const outLane = laneMap.get(outNode.data.laneId);
        return outLane ? outLane.roleName : outNode.data.title;
      });
      customerText = Array.from(new Set(customers)).join(' / ');
    } else {
      customerText = 'Archivo / Destinatario Final';
    }

    // Inputs text
    const inputText = (data.inputs && data.inputs.length > 0)
      ? data.inputs.join('; ')
      : 'Requisitos y antecedentes de etapa previa';

    // Outputs text
    const outputText = (data.outputs && data.outputs.length > 0)
      ? data.outputs.join('; ')
      : 'Acto administrativo / Registro en sistema';

    entries.push({
      id: `sipoc-${node.id}`,
      nodeId: node.id,
      standardId: data.standardId || 'TSK',
      laneName: laneInfo.laneName,
      supplier: supplierText,
      input: inputText,
      processStage: data.title,
      output: outputText,
      customer: customerText,
      qualityCheckpointCode: data.qualityCheckpoint?.checkpointCode,
      itSystem: data.itSystem || 'Sistema Interno',
      legalBasis: data.legalFramework || 'N/A'
    });
  });

  return entries;
}
