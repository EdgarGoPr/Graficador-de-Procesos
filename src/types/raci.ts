export type RaciRoleType = 'R' | 'A' | 'C' | 'I' | '';

export interface RaciTaskRow {
  taskId: string;
  standardId: string;
  title: string;
  laneId: string;
  laneName: string;
  roleName: string;
  assignments: Record<string, RaciRoleType>; // roleId -> 'R' | 'A' | 'C' | 'I' | ''
}

export interface RaciMatrixData {
  roles: { id: string; name: string; laneName: string; colorHex: string }[];
  rows: RaciTaskRow[];
  totalTasks: number;
  statsByRole: Record<string, { R: number; A: number; C: number; I: number }>;
}
