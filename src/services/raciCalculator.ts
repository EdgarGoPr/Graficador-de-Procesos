import { Node, Edge } from '@xyflow/react';
import { BpmnNodeData, SequenceFlowData, PoolDefinition } from '../types/process';
import { RaciMatrixData, RaciTaskRow, RaciRoleType } from '../types/raci';
import * as XLSX from 'xlsx';

export function computeRaciMatrix(
  nodes: Node<BpmnNodeData>[],
  edges: Edge<SequenceFlowData>[],
  pools: PoolDefinition[]
): RaciMatrixData {
  const lanes = pools[0]?.lanes || [];
  
  // Distinct functional roles from lanes
  const roles = lanes.map((lane) => ({
    id: lane.id,
    name: lane.role || lane.name,
    laneName: lane.name,
    colorHex: lane.colorHex || '#3B82F6'
  }));

  // Tasks and functional steps (exclude swimlanes, sticky notes, start/end)
  const taskNodes = nodes
    .filter((n) => n.type !== 'PoolLane' && n.type !== 'StickyNote')
    .sort((a, b) => (a.position?.x || 0) - (b.position?.x || 0));

  const statsByRole: Record<string, { R: number; A: number; C: number; I: number }> = {};
  roles.forEach((r) => {
    statsByRole[r.id] = { R: 0, A: 0, C: 0, I: 0 };
  });

  const rows: RaciTaskRow[] = taskNodes.map((taskNode, idx) => {
    const data = taskNode.data;
    const taskLaneId = data?.laneId || roles[0]?.id || 'lane-default';
    const taskLane = lanes.find((l) => l.id === taskLaneId) || lanes[0];

    const assignments: Record<string, RaciRoleType> = {};

    roles.forEach((role, rIdx) => {
      if (role.id === taskLane?.id) {
        // Direct executor in this lane is Responsible (R)
        assignments[role.id] = 'R';
        if (statsByRole[role.id]) statsByRole[role.id].R++;
      } else if (rIdx === 0 && taskLane?.id !== role.id) {
        // First lane (typically Inspectoría / Mesa de entrada / Jefatura) is Accountable (A)
        assignments[role.id] = 'A';
        if (statsByRole[role.id]) statsByRole[role.id].A++;
      } else if (data?.nodeType === 'ServiceTask' || data?.inputs?.length) {
        // Service or complex dependency is Consulted (C)
        assignments[role.id] = 'C';
        if (statsByRole[role.id]) statsByRole[role.id].C++;
      } else {
        // Other stakeholders are Informed (I)
        assignments[role.id] = 'I';
        if (statsByRole[role.id]) statsByRole[role.id].I++;
      }
    });

    return {
      taskId: taskNode.id,
      standardId: data?.standardId || `TSK-${idx + 1}`,
      title: data?.title || 'Actividad sin título',
      laneId: taskLane?.id || '',
      laneName: taskLane?.name || 'Área General',
      roleName: data?.roleName || taskLane?.role || 'Responsable de Área',
      assignments
    };
  });

  return {
    roles,
    rows,
    totalTasks: rows.length,
    statsByRole
  };
}

export function exportRaciMatrixToExcel(
  raciData: RaciMatrixData,
  projectTitle: string,
  projectCode: string
) {
  const headers = ['ID', 'Actividad / Tarea', 'Carril / Área', 'Puesto Responsable'];
  raciData.roles.forEach((role) => {
    headers.push(`${role.name} (${role.laneName})`);
  });

  const rows = raciData.rows.map((row) => {
    const rowValues = [
      row.standardId,
      row.title,
      row.laneName,
      row.roleName
    ];
    raciData.roles.forEach((role) => {
      rowValues.push(row.assignments[role.id] || '');
    });
    return rowValues;
  });

  const worksheetData = [
    [`MATRIZ RACI DE RESPONSABILIDADES - ${projectTitle} (${projectCode})`],
    ['R = Responsible (Ejecuta) | A = Accountable (Aprueba/Responde) | C = Consulted (Consulta técnica) | I = Informed (Informado)'],
    [],
    headers,
    ...rows
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 40 },
    { wch: 28 },
    { wch: 28 },
    ...raciData.roles.map(() => ({ wch: 24 }))
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Matriz RACI');

  const fileName = `RACI_${projectCode}_${projectTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
