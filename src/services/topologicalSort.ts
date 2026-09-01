import { Node, Edge } from '@xyflow/react';
import { BpmnNodeData, SequenceFlowData, PoolDefinition } from '../types/process';
import { ChronologicalStep, DecisionGatewayReport, RiskControlRow, SystemRoleMapping, TechnicalReportSummary } from '../types/quality';
import { generateSipocMatrix } from './sipocEngine';
import { calculateTotalLeadTime } from './leadTimeCalculator';
import { ProjectDocumentControl } from '../types/project';

/**
 * Topological Sort & Technical Specification Generator (ISO 19510 + ISO 9001)
 */
export function generateTechnicalReport(
  documentControl: ProjectDocumentControl,
  nodes: Node<BpmnNodeData>[],
  edges: Edge<SequenceFlowData>[],
  pools: PoolDefinition[]
): TechnicalReportSummary {
  // 1. Lane & Role Map
  const laneMap = new Map<string, { laneName: string; roleName: string; system: string }>();
  pools.forEach(p => {
    p.lanes.forEach(l => {
      laneMap.set(l.id, { laneName: l.name, roleName: l.role, system: l.system });
    });
  });

  // 2. Build In-Degree & Adjacency List for Kahn's Algorithm
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  const incomingEdgesMap = new Map<string, Edge<SequenceFlowData>[]>();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
    incomingEdgesMap.set(n.id, []);
  });

  edges.forEach(e => {
    if (adj.has(e.source) && inDegree.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      incomingEdgesMap.get(e.target)!.push(e);
    }
  });

  // 3. Kahn's Topological Order traversal
  const queue: string[] = [];
  nodes.forEach(n => {
    if ((inDegree.get(n.id) || 0) === 0) {
      queue.push(n.id);
    }
  });

  // Sort queue by x-coordinate to maintain natural left-to-right flow for parallel starts
  queue.sort((a, b) => {
    const nodeA = nodes.find(n => n.id === a);
    const nodeB = nodes.find(n => n.id === b);
    return (nodeA?.position.x || 0) - (nodeB?.position.x || 0);
  });

  const sortedNodeIds: string[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currId = queue.shift()!;
    if (visited.has(currId)) continue;
    visited.add(currId);
    sortedNodeIds.push(currId);

    const neighbors = adj.get(currId) || [];
    for (const neighbor of neighbors) {
      const currentInDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, currentInDegree);
      if (currentInDegree <= 0 && !visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  // Add any unvisited nodes (e.g. disconnected components or cyclic loops)
  nodes.forEach(n => {
    if (!visited.has(n.id)) {
      sortedNodeIds.push(n.id);
    }
  });

  // 4. Chronological Step generation
  const chronologicalSteps: ChronologicalStep[] = [];
  let stepIndex = 1;

  sortedNodeIds.forEach(id => {
    const node = nodes.find(n => n.id === id);
    if (!node || !node.data) return;

    const data = node.data;
    const laneInfo = laneMap.get(data.laneId) || {
      laneName: data.laneName || 'Carril General',
      roleName: data.roleName || 'Operador Responsable',
      system: data.itSystem || 'Sistema Interno'
    };

    // Preceding conditions
    const incoming = incomingEdgesMap.get(node.id) || [];
    let precedingConditions = '';
    if (incoming.length > 0) {
      precedingConditions = incoming.map(e => {
        const srcNode = nodes.find(sn => sn.id === e.source);
        const cond = e.data?.conditionText ? ` (${e.data.conditionText})` : '';
        return `${srcNode?.data?.standardId || 'Nodo'} - ${srcNode?.data?.title || ''}${cond}`;
      }).join('; ');
    } else {
      precedingConditions = 'Recepción inicial / Trámite de inicio';
    }

    let slaFormatted = 'Inmediato / Sin plazo perentorio';
    if (data.slaDuration) {
      const unitLabel = data.slaDuration.unit === 'BUSINESS_DAYS' ? 'días hábiles'
        : data.slaDuration.unit === 'CALENDAR_DAYS' ? 'días corridos' : 'horas';
      slaFormatted = `${data.slaDuration.value} ${unitLabel} (${data.slaDuration.iso8601String})`;
    }

    chronologicalSteps.push({
      stepNumber: stepIndex++,
      standardId: data.standardId || `STP-${stepIndex}`,
      nodeType: data.nodeType,
      title: data.title,
      role: laneInfo.roleName,
      lane: laneInfo.laneName,
      itSystem: data.itSystem || laneInfo.system,
      sla: slaFormatted,
      isPeremptory: data.slaDuration?.isPeremptory || false,
      precedingConditions,
      deliverables: (data.outputs && data.outputs.length > 0) ? data.outputs.join(', ') : 'Pase a siguiente etapa',
      legalArticle: data.legalFramework || 'Conforme normativa general',
      qualityCheck: data.qualityCheckpoint ? `${data.qualityCheckpoint.checkpointCode}: ${data.qualityCheckpoint.inspectionCriteria}` : undefined
    });
  });

  // 5. Risk Matrix Extraction
  const riskMatrix: RiskControlRow[] = [];
  nodes.forEach(n => {
    if (n.data?.operationalRisks) {
      const laneInfo = laneMap.get(n.data.laneId);
      n.data.operationalRisks.forEach(r => {
        riskMatrix.push({
          nodeStandardId: n.data.standardId,
          nodeTitle: n.data.title,
          laneName: laneInfo ? laneInfo.laneName : 'General',
          riskId: r.riskId,
          riskDescription: r.description,
          probability: r.probability,
          impact: r.impact,
          mitigatingControl: r.mitigatingControl,
          controlType: r.controlType,
          itSystem: n.data.itSystem || 'Sistema de Gestión'
        });
      });
    }
  });

  // 6. Decision Gateways Matrix
  const decisionGateways: DecisionGatewayReport[] = [];
  nodes.filter(n => n.data?.nodeType.includes('Gateway')).forEach(gw => {
    const laneInfo = laneMap.get(gw.data.laneId);
    const outgoing = edges.filter(e => e.source === gw.id);
    const resolutionOptions = outgoing.map(e => {
      const targetNode = nodes.find(tn => tn.id === e.target);
      return {
        targetStep: `${targetNode?.data?.standardId || 'TSK'} - ${targetNode?.data?.title || 'Destino'}`,
        condition: e.data?.conditionText || 'Por defecto / Sin condición explícita',
        outcomeType: targetNode?.data?.gatewayResolutionType || 'Resolución procesal'
      };
    });

    decisionGateways.push({
      standardId: gw.data.standardId || 'GTW',
      gatewayTitle: gw.data.title,
      gatewayType: gw.data.nodeType,
      evaluatingRole: laneInfo?.roleName || 'Autoridad Competente',
      resolutionOptions
    });
  });

  // 7. Systems and Roles Mapping
  const systemsAndRoles: SystemRoleMapping[] = [];
  pools.forEach(p => {
    p.lanes.forEach(l => {
      const laneNodes = nodes.filter(n => n.data?.laneId === l.id);
      const systems = Array.from(new Set(laneNodes.map(n => n.data.itSystem || l.system).filter(Boolean)));
      systemsAndRoles.push({
        laneName: l.name,
        role: l.role,
        itSystems: systems.length > 0 ? systems : [l.system],
        assignedTaskCount: laneNodes.length
      });
    });
  });

  // 8. Lead Times
  const leadTimes = calculateTotalLeadTime(nodes);
  const sipocEntries = generateSipocMatrix(nodes, edges, pools);

  return {
    projectTitle: documentControl.documentTitle,
    documentCode: documentControl.documentCode,
    version: documentControl.version,
    author: documentControl.authorName,
    organizationUnit: documentControl.organizationUnit,
    timestampUtc: new Date().toISOString(),
    objective: documentControl.processObjective,
    normativeFramework: documentControl.legalNormativeBasis,
    totalDirectCycleTimeHours: leadTimes.totalHours,
    totalDirectCycleTimeDays: leadTimes.businessDays,
    maxLegalPrescriptionDays: 365, // Plazo de prescripción de ley
    sipocEntries,
    chronologicalSteps,
    riskMatrix,
    decisionGateways,
    systemsAndRoles
  };
}
