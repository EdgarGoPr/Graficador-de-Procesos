import { Node, Edge } from '@xyflow/react';
import { BpmnNodeData, SequenceFlowData, SubProcessStep, BPMN_NODE_TYPES } from '../types/process';
import { ProcessProjectFile } from '../types/project';

export interface ValidationResult {
  isValid: boolean;
  incomingEdges: Edge<SequenceFlowData>[];
  outgoingEdges: Edge<SequenceFlowData>[];
  internalEdges: Edge<SequenceFlowData>[];
  error?: string;
}

/**
 * Validates whether a set of nodes meets BPMN 2.0 single-entry single-exit criteria for subprocess encapsulation
 */
export function validateSubProcessCompression(
  nodeIds: string[],
  allNodes: Node<BpmnNodeData>[],
  allEdges: Edge<SequenceFlowData>[]
): ValidationResult {
  if (!nodeIds || nodeIds.length < 2) {
    return {
      isValid: false,
      incomingEdges: [],
      outgoingEdges: [],
      internalEdges: [],
      error: 'Debe seleccionar al menos 2 elementos para comprimir en un subproceso.'
    };
  }

  const selectedSet = new Set(nodeIds);

  const incomingEdges = allEdges.filter(
    (e) => !selectedSet.has(e.source) && selectedSet.has(e.target)
  );

  const outgoingEdges = allEdges.filter(
    (e) => selectedSet.has(e.source) && !selectedSet.has(e.target)
  );

  const internalEdges = allEdges.filter(
    (e) => selectedSet.has(e.source) && selectedSet.has(e.target)
  );

  // BPMN 2.0 Single Entry Rule
  if (incomingEdges.length > 1) {
    return {
      isValid: false,
      incomingEdges,
      outgoingEdges,
      internalEdges,
      error: `La selección tiene ${incomingEdges.length} conexiones entrantes desde afuera. Para comprimir en un subproceso BPMN válido, debe existir una única entrada al bloque.`
    };
  }

  // BPMN 2.0 Single Exit Rule
  if (outgoingEdges.length > 1) {
    return {
      isValid: false,
      incomingEdges,
      outgoingEdges,
      internalEdges,
      error: `La selección tiene ${outgoingEdges.length} conexiones salientes hacia afuera. Para comprimir en un subproceso BPMN válido, debe existir una única salida del bloque.`
    };
  }

  return {
    isValid: true,
    incomingEdges,
    outgoingEdges,
    internalEdges
  };
}

/**
 * Compresses multiple nodes into a single encapsulated SubProcess node and rewires outer flows
 */
export function compressNodesToSubProcess(
  nodeIds: string[],
  title: string,
  standardId: string,
  description: string,
  project: ProcessProjectFile
): { project: ProcessProjectFile; newSubProcessId: string } | { error: string } {
  const validation = validateSubProcessCompression(nodeIds, project.nodes, project.edges);
  if (!validation.isValid) {
    return { error: validation.error || 'La selección no cumple los requisitos de compresión.' };
  }

  const selectedSet = new Set(nodeIds);
  const selectedNodes = project.nodes.filter((n) => selectedSet.has(n.id));

  // Sort nodes horizontally left to right for natural sequence
  const sortedNodes = [...selectedNodes].sort((a, b) => a.position.x - b.position.x);

  // Convert selected nodes into ordered subProcessSteps
  const subProcessSteps: SubProcessStep[] = sortedNodes.map((node, index) => {
    const data = node.data;
    return {
      id: `step_${Date.now()}_${index}`,
      stepNumber: index + 1,
      title: data.title || `Paso ${index + 1}`,
      description: data.description || '',
      role: data.roleName || 'Responsable',
      system: data.itSystem || 'Sistema Interno',
      duration: data.slaDuration?.iso8601String || 'P1D',
      inputs: data.inputs || [],
      outputs: data.outputs || [],
      qualityCheck: data.qualityCheckpoint?.inspectionCriteria,
      risk: data.operationalRisks?.[0]?.description
    };
  });

  // Calculate geometric center
  const avgX = Math.round(sortedNodes.reduce((acc, n) => acc + n.position.x, 0) / sortedNodes.length);
  const avgY = Math.round(sortedNodes.reduce((acc, n) => acc + n.position.y, 0) / sortedNodes.length);

  const primaryLaneId = sortedNodes[0]?.data?.laneId || project.pools[0]?.lanes[0]?.id || 'lane_1';
  const primaryLane = project.pools[0]?.lanes.find((l) => l.id === primaryLaneId);

  const newSubProcessId = `subproc_${Date.now()}`;

  const newSubProcessNode: Node<BpmnNodeData> = {
    id: newSubProcessId,
    type: 'SubProcess',
    position: { x: avgX, y: avgY },
    data: {
      standardId: standardId || `SUB-01`,
      title: title || 'Subproceso Integrado',
      description: description || `Subproceso integrado que encapsula ${subProcessSteps.length} etapas internas.`,
      nodeType: BPMN_NODE_TYPES.SUB_PROCESS,
      laneId: primaryLaneId,
      laneName: primaryLane?.name || sortedNodes[0]?.data?.laneName,
      roleName: primaryLane?.role || sortedNodes[0]?.data?.roleName,
      itSystem: sortedNodes[0]?.data?.itSystem || 'Sistema Integrado',
      legalFramework: sortedNodes[0]?.data?.legalFramework || 'Procedimiento Administrativo',
      inputs: sortedNodes[0]?.data?.inputs || [],
      outputs: sortedNodes[sortedNodes.length - 1]?.data?.outputs || [],
      operationalRisks: sortedNodes.flatMap((n) => n.data.operationalRisks || []),
      subProcessSteps: subProcessSteps,
      tags: ['Subproceso', 'Encapsulado']
    }
  };

  // Rewire connections
  const remainingEdges: Edge<SequenceFlowData>[] = [];

  for (const edge of project.edges) {
    const isSourceSelected = selectedSet.has(edge.source);
    const isTargetSelected = selectedSet.has(edge.target);

    if (isSourceSelected && isTargetSelected) {
      // Internal edge: remove from macro canvas (it lives inside subProcessSteps)
      continue;
    }

    if (!isSourceSelected && isTargetSelected) {
      // External incoming edge: point target to the new Subprocess node
      remainingEdges.push({
        ...edge,
        target: newSubProcessId,
        data: {
          id: edge.data?.id || edge.id,
          source: edge.data?.source || edge.source,
          conditionText: edge.data?.conditionText || '',
          ...edge.data,
          target: newSubProcessId
        }
      });
      continue;
    }

    if (isSourceSelected && !isTargetSelected) {
      // External outgoing edge: point source to the new Subprocess node
      remainingEdges.push({
        ...edge,
        source: newSubProcessId,
        data: {
          id: edge.data?.id || edge.id,
          target: edge.data?.target || edge.target,
          conditionText: edge.data?.conditionText || '',
          ...edge.data,
          source: newSubProcessId
        }
      });
      continue;
    }

    // Unrelated edge: keep unchanged
    remainingEdges.push(edge);
  }

  // Remove the old compressed nodes and append the new Subprocess node
  const remainingNodes = project.nodes.filter((n) => !selectedSet.has(n.id));
  remainingNodes.push(newSubProcessNode);

  return {
    project: {
      ...project,
      nodes: remainingNodes,
      edges: remainingEdges
    },
    newSubProcessId
  };
}

/**
 * Decompresses an existing SubProcess node back into individual canvas tasks with sequential sequence flows
 */
export function decompressSubProcessToCanvas(
  subProcessNodeId: string,
  project: ProcessProjectFile
): { project: ProcessProjectFile; unpackedNodeIds: string[] } | { error: string } {
  const subProcessNode = project.nodes.find((n) => n.id === subProcessNodeId);
  if (!subProcessNode) {
    return { error: 'No se encontró el nodo de subproceso a descomprimir.' };
  }

  const steps = subProcessNode.data?.subProcessSteps || [];
  if (steps.length === 0) {
    return { error: 'El subproceso seleccionado no contiene etapas internas para desplegar en el lienzo.' };
  }

  const startX = subProcessNode.position.x;
  const startY = subProcessNode.position.y;
  const laneId = subProcessNode.data.laneId;
  const laneName = subProcessNode.data.laneName;

  const unpackedNodes: Node<BpmnNodeData>[] = [];
  const internalEdges: Edge<SequenceFlowData>[] = [];

  // Generate individual nodes
  steps.forEach((step, idx) => {
    const nodeId = `node_step_${Date.now()}_${idx}`;
    const standardId = `TSK-${Math.floor(10 + Math.random() * 89)}`;

    const node: Node<BpmnNodeData> = {
      id: nodeId,
      type: 'UserTask',
      position: { x: startX + idx * 260, y: startY },
      data: {
        standardId,
        title: step.title,
        description: step.description || `Etapa ${step.stepNumber} del procedimiento.`,
        nodeType: BPMN_NODE_TYPES.USER_TASK,
        laneId: laneId,
        laneName: laneName,
        roleName: step.role || 'Operador',
        itSystem: step.system || 'SAM',
        legalFramework: subProcessNode.data.legalFramework || 'Normativa General',
        inputs: step.inputs || [],
        outputs: step.outputs || [],
        operationalRisks: step.risk
          ? [{
              riskId: `RSK-${idx + 1}`,
              description: step.risk,
              probability: 'MEDIUM',
              impact: 'HIGH',
              mitigatingControl: 'Control de supervisión',
              controlType: 'PREVENTIVE'
            }]
          : [],
        tags: ['Descomprimido']
      }
    };

    unpackedNodes.push(node);

    // Create sequential edge to next step
    if (idx > 0) {
      const prevNodeId = unpackedNodes[idx - 1].id;
      internalEdges.push({
        id: `e_${prevNodeId}_${nodeId}`,
        source: prevNodeId,
        target: nodeId,
        type: 'sequenceFlow',
        data: {
          id: `e_${prevNodeId}_${nodeId}`,
          source: prevNodeId,
          target: nodeId,
          conditionText: ''
        }
      });
    }
  });

  const firstUnpackedId = unpackedNodes[0].id;
  const lastUnpackedId = unpackedNodes[unpackedNodes.length - 1].id;

  // Rewire outer edges
  const updatedEdges: Edge<SequenceFlowData>[] = [];

  for (const edge of project.edges) {
    if (edge.target === subProcessNodeId) {
      // Incoming to subprocess -> connect to first step
      updatedEdges.push({
        ...edge,
        target: firstUnpackedId,
        data: {
          id: edge.data?.id || edge.id,
          source: edge.data?.source || edge.source,
          conditionText: edge.data?.conditionText || '',
          ...edge.data,
          target: firstUnpackedId
        }
      });
    } else if (edge.source === subProcessNodeId) {
      // Outgoing from subprocess -> connect from last step
      updatedEdges.push({
        ...edge,
        source: lastUnpackedId,
        data: {
          id: edge.data?.id || edge.id,
          target: edge.data?.target || edge.target,
          conditionText: edge.data?.conditionText || '',
          ...edge.data,
          source: lastUnpackedId
        }
      });
    } else {
      updatedEdges.push(edge);
    }
  }

  // Combine remaining nodes with unpacked nodes
  const updatedNodes = project.nodes.filter((n) => n.id !== subProcessNodeId).concat(unpackedNodes);
  const finalEdges = updatedEdges.concat(internalEdges);

  return {
    project: {
      ...project,
      nodes: updatedNodes,
      edges: finalEdges
    },
    unpackedNodeIds: unpackedNodes.map((n) => n.id)
  };
}

/**
 * Copies a selection of nodes and internal edges into a clipboard payload
 */
export function createClipboardPayload(
  nodeIds: string[],
  allNodes: Node<BpmnNodeData>[],
  allEdges: Edge<SequenceFlowData>[]
): { nodes: Node<BpmnNodeData>[]; edges: Edge<SequenceFlowData>[] } {
  const selectedSet = new Set(nodeIds);
  const selectedNodes = allNodes.filter((n) => selectedSet.has(n.id));
  const internalEdges = allEdges.filter(
    (e) => selectedSet.has(e.source) && selectedSet.has(e.target)
  );

  return {
    nodes: JSON.parse(JSON.stringify(selectedNodes)),
    edges: JSON.parse(JSON.stringify(internalEdges))
  };
}

/**
 * Pastes clipboard payload generating fresh unique IDs and a position offset
 */
export function pasteClipboardPayload(
  payload: { nodes: Node<BpmnNodeData>[]; edges: Edge<SequenceFlowData>[] },
  offset = { x: 40, y: 40 }
): { newNodes: Node<BpmnNodeData>[]; newEdges: Edge<SequenceFlowData>[] } {
  const idMap = new Map<string, string>();
  const newNodes: Node<BpmnNodeData>[] = [];
  const newEdges: Edge<SequenceFlowData>[] = [];

  const timestamp = Date.now();

  payload.nodes.forEach((oldNode, idx) => {
    const newId = `${oldNode.type?.toLowerCase() || 'node'}_${timestamp}_${idx}`;
    idMap.set(oldNode.id, newId);

    const clonedData = JSON.parse(JSON.stringify(oldNode.data)) as BpmnNodeData;
    clonedData.standardId = clonedData.standardId ? `${clonedData.standardId}-C` : 'TSK-COPY';

    newNodes.push({
      ...oldNode,
      id: newId,
      selected: true,
      position: {
        x: oldNode.position.x + offset.x,
        y: oldNode.position.y + offset.y
      },
      data: clonedData
    });
  });

  payload.edges.forEach((oldEdge) => {
    const newSource = idMap.get(oldEdge.source);
    const newTarget = idMap.get(oldEdge.target);

    if (newSource && newTarget) {
      const newEdgeId = `e_${newSource}_${newTarget}`;
      newEdges.push({
        ...oldEdge,
        id: newEdgeId,
        source: newSource,
        target: newTarget,
        selected: false,
        data: {
          ...oldEdge.data,
          id: newEdgeId,
          source: newSource,
          target: newTarget
        }
      });
    }
  });

  return { newNodes, newEdges };
}
