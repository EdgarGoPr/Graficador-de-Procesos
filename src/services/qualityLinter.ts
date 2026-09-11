import { Node, Edge } from '@xyflow/react';
import { BpmnNodeData, SequenceFlowData, PoolDefinition } from '../types/process';

export type IssueSeverity = 'CRITICAL' | 'WARNING' | 'SUGGESTION';
export type IssueCategory = 'TOPOLOGY' | 'BPMN_STANDARDS' | 'ISO_9001_QUALITY' | 'OPERATIONAL_RISK';

export interface QualityIssue {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  category: IssueCategory;
  nodeId?: string;
  nodeTitle?: string;
  suggestion: string;
}

export interface QualityAuditReport {
  healthScore: number;
  grade: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
  gradeLabel: string;
  gradeColor: string;
  issues: QualityIssue[];
  criticalCount: number;
  warningCount: number;
  suggestionCount: number;
  stats: {
    totalNodes: number;
    totalEdges: number;
    totalTasks: number;
    totalGateways: number;
    totalCheckpoints: number;
    totalRisks: number;
    unmitigatedRisks: number;
  };
}

export function runQualityAudit(
  nodes: Node<BpmnNodeData>[],
  edges: Edge<SequenceFlowData>[],
  pools: PoolDefinition[]
): QualityAuditReport {
  const issues: QualityIssue[] = [];

  // Exclude swimlanes and sticky notes for strict BPMN topological analysis
  const functionalNodes = nodes.filter(
    (n) => n.type !== 'PoolLane' && n.type !== 'StickyNote'
  );

  const incomingMap = new Map<string, Edge<SequenceFlowData>[]>();
  const outgoingMap = new Map<string, Edge<SequenceFlowData>[]>();

  functionalNodes.forEach((n) => {
    incomingMap.set(n.id, []);
    outgoingMap.set(n.id, []);
  });

  edges.forEach((e) => {
    if (incomingMap.has(e.target)) {
      incomingMap.get(e.target)!.push(e);
    }
    if (outgoingMap.has(e.source)) {
      outgoingMap.get(e.source)!.push(e);
    }
  });

  const startEvents = functionalNodes.filter((n) => n.type === 'StartEvent');
  const endEvents = functionalNodes.filter((n) => n.type === 'EndEvent');
  const tasks = functionalNodes.filter((n) => n.type?.includes('Task'));
  const gateways = functionalNodes.filter((n) => n.type?.includes('Gateway'));
  const checkpoints = functionalNodes.filter((n) => n.data?.qualityCheckpoint || n.type === 'QualityCheckpointEvent');

  let totalRisks = 0;
  let unmitigatedRisks = 0;
  functionalNodes.forEach((n) => {
    const risks = n.data?.operationalRisks || [];
    totalRisks += risks.length;
    risks.forEach((r) => {
      if (!r.mitigatingControl || r.mitigatingControl.trim() === '') {
        unmitigatedRisks++;
      }
    });
  });

  // 1. TOPOLOGY: Start Event Check
  if (functionalNodes.length > 0 && startEvents.length === 0) {
    issues.push({
      id: 'top-no-start',
      code: 'ERR-TOP-001',
      title: 'Falta Evento de Inicio',
      description: 'El proceso no posee ningún Evento de Inicio (Start Event) que marque el detonante de ejecución.',
      severity: 'CRITICAL',
      category: 'BPMN_STANDARDS',
      suggestion: 'Arrastra un Evento de Inicio (verde) desde la paleta para definir el punto de arranque.'
    });
  }

  // 2. TOPOLOGY: End Event Check
  if (functionalNodes.length > 0 && endEvents.length === 0) {
    issues.push({
      id: 'top-no-end',
      code: 'ERR-TOP-002',
      title: 'Falta Evento de Fin',
      description: 'El proceso no define un Evento de Fin (End Event) que determine la conclusión formal del trámite.',
      severity: 'CRITICAL',
      category: 'BPMN_STANDARDS',
      suggestion: 'Agrega un Evento de Fin (rojo) al final de cada flujo para delimitar el resultado formal.'
    });
  }

  // 3. NODE-LEVEL AUDIT
  functionalNodes.forEach((node) => {
    const data = node.data;
    const incoming = incomingMap.get(node.id) || [];
    const outgoing = outgoingMap.get(node.id) || [];
    const isStart = node.type === 'StartEvent';
    const isEnd = node.type === 'EndEvent';
    const isGateway = node.type?.includes('Gateway');
    const isTask = node.type?.includes('Task');

    // A. Orphan Nodes (no connections at all)
    if (functionalNodes.length > 1 && incoming.length === 0 && outgoing.length === 0) {
      issues.push({
        id: `orphan-${node.id}`,
        code: 'ERR-TOP-003',
        title: `Elemento Huérfano: ${data.title || data.standardId}`,
        description: 'La tarjeta se encuentra aislada sin conectores de entrada ni de salida.',
        severity: 'CRITICAL',
        category: 'TOPOLOGY',
        nodeId: node.id,
        nodeTitle: data.title,
        suggestion: 'Conecta este elemento al flujo secuencial o elimínalo si ya no es requerido.'
      });
      return;
    }

    // B. Dead Ends (Non-End node without outgoing connections)
    if (!isEnd && outgoing.length === 0 && functionalNodes.length > 1) {
      issues.push({
        id: `dead-end-${node.id}`,
        code: 'ERR-TOP-004',
        title: `Rama Muerta (Dead End): ${data.title || data.standardId}`,
        description: 'Esta actividad no tiene salida. Debe conectarse a un siguiente paso o a un Evento de Fin.',
        severity: 'CRITICAL',
        category: 'TOPOLOGY',
        nodeId: node.id,
        nodeTitle: data.title,
        suggestion: 'Crea una conexión desde este nodo hacia la siguiente tarea o hacia un Evento de Fin.'
      });
    }

    // C. Start Event with Incoming Edges
    if (isStart && incoming.length > 0) {
      issues.push({
        id: `start-incoming-${node.id}`,
        code: 'WARN-BPMN-001',
        title: `Evento de Inicio con Entrada: ${data.standardId}`,
        description: 'Un Evento de Inicio no debería recibir flujos de secuencia según la norma BPMN 2.0.',
        severity: 'WARNING',
        category: 'BPMN_STANDARDS',
        nodeId: node.id,
        nodeTitle: data.title,
        suggestion: 'Elimina las conexiones entrantes al Evento de Inicio.'
      });
    }

    // D. Gateways with only 1 outgoing branch
    if (isGateway && outgoing.length === 1) {
      issues.push({
        id: `gtw-single-${node.id}`,
        code: 'WARN-BPMN-002',
        title: `Compuerta con Única Salida: ${data.standardId}`,
        description: 'Una compuerta de decisión debe bifurcar en al menos 2 ramas alternativas o paralelas.',
        severity: 'WARNING',
        category: 'BPMN_STANDARDS',
        nodeId: node.id,
        nodeTitle: data.title,
        suggestion: 'Agrega las conexiones hacia los caminos alternativos (ej: Aprobado / Rechazado).'
      });
    }

    // E. Exclusive Gateway missing condition labels
    if (node.type === 'ExclusiveGateway' && outgoing.length > 1) {
      const missingLabels = outgoing.filter((e) => !e.data?.conditionText || e.data.conditionText.trim() === '');
      if (missingLabels.length > 0) {
        issues.push({
          id: `gtw-labels-${node.id}`,
          code: 'WARN-BPMN-003',
          title: `Compuerta XOR sin Etiquetas: ${data.standardId}`,
          description: `Hay ${missingLabels.length} conexión(es) saliente(s) sin texto de condición que aclare la regla de negocio.`,
          severity: 'WARNING',
          category: 'BPMN_STANDARDS',
          nodeId: node.id,
          nodeTitle: data.title,
          suggestion: 'Haz clic en las flechas salientes y define su condición (ej: "Si cumple requisitos", "Rechazado").'
        });
      }
    }

    // F. Task missing Role
    if (isTask && (!data.roleName || data.roleName.trim() === '' || data.roleName === 'Responsable de Área')) {
      issues.push({
        id: `task-no-role-${node.id}`,
        code: 'WARN-ISO-001',
        title: `Tarea sin Rol Específico: ${data.title || data.standardId}`,
        description: 'La actividad no tiene especificado el puesto o rol exacto que debe ejecutarla.',
        severity: 'WARNING',
        category: 'ISO_9001_QUALITY',
        nodeId: node.id,
        nodeTitle: data.title,
        suggestion: 'Edita la tarjeta y asigna el puesto exacto (ej: Inspector Técnico, Abogado Dictaminante).'
      });
    }

    // G. Task missing IT System
    if (isTask && (!data.itSystem || data.itSystem.trim() === '')) {
      issues.push({
        id: `task-no-sys-${node.id}`,
        code: 'SUGG-ISO-002',
        title: `Sin Sistema TI: ${data.title || data.standardId}`,
        description: 'No se definió qué sistema informático o método de registro se utiliza en este paso.',
        severity: 'SUGGESTION',
        category: 'ISO_9001_QUALITY',
        nodeId: node.id,
        nodeTitle: data.title,
        suggestion: 'Especifica la herramienta o sistema utilizado (ej: GDE, SAM, SAP, Excel).'
      });
    }

    // H. Task missing SLA / Estimated Duration
    if (isTask && (!data.slaDuration || data.slaDuration.value <= 0)) {
      issues.push({
        id: `task-no-sla-${node.id}`,
        code: 'SUGG-ISO-003',
        title: `Sin Tiempo de Ciclo (SLA): ${data.title || data.standardId}`,
        description: 'La tarea no tiene estimación de tiempo de ejecución para el cálculo de Lead Time.',
        severity: 'SUGGESTION',
        category: 'ISO_9001_QUALITY',
        nodeId: node.id,
        nodeTitle: data.title,
        suggestion: 'Indica el tiempo promedio estimado (horas o días hábiles) en el panel de propiedades.'
      });
    }

    // I. Operational Risks without mitigation
    if (data.operationalRisks && data.operationalRisks.length > 0) {
      data.operationalRisks.forEach((risk, rIdx) => {
        if (!risk.mitigatingControl || risk.mitigatingControl.trim() === '') {
          issues.push({
            id: `risk-unmitigated-${node.id}-${rIdx}`,
            code: 'WARN-RSK-001',
            title: `Riesgo sin Control Mitigante: ${data.standardId}`,
            description: `El riesgo "${risk.description || risk.riskId}" no tiene definido un control obligatorio (Cláusula 6.1 ISO 9001).`,
            severity: 'WARNING',
            category: 'OPERATIONAL_RISK',
            nodeId: node.id,
            nodeTitle: data.title,
            suggestion: 'Define el control preventivo o correctivo para mitigar el riesgo operativo.'
          });
        }
      });
    }
  });

  // Calculate Health Score (100 base, -15 critical, -5 warning, -2 suggestion)
  const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
  const warningCount = issues.filter((i) => i.severity === 'WARNING').length;
  const suggestionCount = issues.filter((i) => i.severity === 'SUGGESTION').length;

  let healthScore = 100 - criticalCount * 15 - warningCount * 5 - suggestionCount * 2;
  if (functionalNodes.length === 0) healthScore = 100;
  healthScore = Math.max(0, Math.min(100, healthScore));

  let grade: QualityAuditReport['grade'] = 'EXCELLENT';
  let gradeLabel = 'Excelente Calidad Normativa';
  let gradeColor = '#10B981';

  if (healthScore < 50 || criticalCount > 2) {
    grade = 'CRITICAL';
    gradeLabel = 'No Conforme para Auditoría';
    gradeColor = '#EF4444';
  } else if (healthScore < 75 || criticalCount > 0) {
    grade = 'NEEDS_IMPROVEMENT';
    gradeLabel = 'Requiere Correcciones';
    gradeColor = '#F59E0B';
  } else if (healthScore < 90) {
    grade = 'GOOD';
    gradeLabel = 'Buena Conformidad Operativa';
    gradeColor = '#3B82F6';
  }

  return {
    healthScore,
    grade,
    gradeLabel,
    gradeColor,
    issues,
    criticalCount,
    warningCount,
    suggestionCount,
    stats: {
      totalNodes: functionalNodes.length,
      totalEdges: edges.length,
      totalTasks: tasks.length,
      totalGateways: gateways.length,
      totalCheckpoints: checkpoints.length,
      totalRisks,
      unmitigatedRisks
    }
  };
}
