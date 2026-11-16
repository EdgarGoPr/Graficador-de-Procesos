import { Node, Edge } from '@xyflow/react';
import { BpmnNodeData, SequenceFlowData, PoolDefinition } from '../types/process';
import { RaciAccountableWarning, RaciMatrixData, RaciTaskRow, RaciRoleType } from '../types/raci';
import * as XLSX from 'xlsx';

const EXCLUDED_RACI_TYPES = new Set(['PoolLane', 'StickyNote', 'StartEvent', 'EndEvent']);

export function computeRaciMatrix(
  nodes: Node<BpmnNodeData>[],
  _edges: Edge<SequenceFlowData>[],
  pools: PoolDefinition[],
  raciOverrides?: Record<string, Record<string, RaciRoleType>>
): RaciMatrixData {
  const lanes = pools[0]?.lanes || [];

  // Distinct functional roles from lanes
  const roles = lanes.map((lane) => ({
    id: lane.id,
    name: lane.role || lane.name,
    laneName: lane.name,
    colorHex: lane.colorHex || '#3B82F6'
  }));

  // Solo actividades (tareas, subprocesos, controles de calidad y decisiones): se excluyen carriles, notas e inicio/fin.
  const taskNodes = nodes
    .filter((n) => !EXCLUDED_RACI_TYPES.has(n.type || n.data?.nodeType || ''))
    .sort((a, b) => (a.position?.x || 0) - (b.position?.x || 0));

  const statsByRole: Record<string, { R: number; A: number; C: number; I: number }> = {};
  roles.forEach((r) => {
    statsByRole[r.id] = { R: 0, A: 0, C: 0, I: 0 };
  });

  const accountableWarnings: RaciAccountableWarning[] = [];

  const rows: RaciTaskRow[] = taskNodes.map((taskNode, idx) => {
    const data = taskNode.data;
    const taskLaneId = data?.laneId || roles[0]?.id || 'lane-default';
    const taskLane = lanes.find((l) => l.id === taskLaneId) || lanes[0];
    const nodeOverrides = raciOverrides?.[taskNode.id];

    const assignments: Record<string, RaciRoleType> = {};
    let accountableCount = 0;

    roles.forEach((role) => {
      let value: RaciRoleType;
      if (nodeOverrides && Object.prototype.hasOwnProperty.call(nodeOverrides, role.id)) {
        value = nodeOverrides[role.id];
      } else if (role.id === taskLane?.id) {
        // El carril responsable ejecuta y rinde cuentas por defecto (A/R)
        value = 'A/R';
      } else if (data?.nodeType === 'ServiceTask' || data?.inputs?.length) {
        value = 'C';
      } else {
        value = 'I';
      }

      assignments[role.id] = value;

      if (value === 'A/R') {
        accountableCount++;
        if (statsByRole[role.id]) {
          statsByRole[role.id].A++;
          statsByRole[role.id].R++;
        }
      } else if (value === 'A') {
        accountableCount++;
        if (statsByRole[role.id]) statsByRole[role.id].A++;
      } else if (value === 'R') {
        if (statsByRole[role.id]) statsByRole[role.id].R++;
      } else if (value === 'C') {
        if (statsByRole[role.id]) statsByRole[role.id].C++;
      } else if (value === 'I') {
        if (statsByRole[role.id]) statsByRole[role.id].I++;
      }
    });

    const standardId = data?.standardId || `TSK-${idx + 1}`;
    const title = data?.title || 'Actividad sin título';

    if (roles.length > 0 && accountableCount !== 1) {
      accountableWarnings.push({
        taskId: taskNode.id,
        standardId,
        title,
        accountableCount
      });
    }

    return {
      taskId: taskNode.id,
      standardId,
      title,
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
    statsByRole,
    accountableWarnings
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
    ['A/R = Accountable & Responsible (Ejecuta y rinde cuentas) | R = Responsible (Ejecuta) | A = Accountable (Aprueba/Responde) | C = Consulted (Consulta técnica) | I = Informed (Informado)'],
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
