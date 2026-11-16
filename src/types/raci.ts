export type RaciRoleType = 'R' | 'A' | 'A/R' | 'C' | 'I' | '';

export interface RaciAccountableWarning {
  taskId: string;
  standardId: string;
  title: string;
  accountableCount: number;
}

export interface RaciTaskRow {
  taskId: string;
  standardId: string;
  title: string;
  laneId: string;
  laneName: string;
  roleName: string;
  assignments: Record<string, RaciRoleType>; // roleId -> 'R' | 'A' | 'A/R' | 'C' | 'I' | ''
}

export interface RaciMatrixData {
  roles: { id: string; name: string; laneName: string; colorHex: string }[];
  rows: RaciTaskRow[];
  totalTasks: number;
  statsByRole: Record<string, { R: number; A: number; C: number; I: number }>;
  accountableWarnings: RaciAccountableWarning[];
}
