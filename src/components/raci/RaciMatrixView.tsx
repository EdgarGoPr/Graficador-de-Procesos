import React, { useMemo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { computeRaciMatrix, exportRaciMatrixToExcel } from '../../services/raciCalculator';
import { RaciRoleType } from '../../types/raci';
import {
  Table,
  Download,
  Printer,
  Info,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

const RACI_BADGES: Record<string, { label: string; full: string; bg: string; text: string; border: string }> = {
  'A/R': { label: 'A/R', full: 'Accountable & Responsible', bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/40' },
  R: { label: 'R', full: 'Responsible', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  A: { label: 'A', full: 'Accountable', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
  C: { label: 'C', full: 'Consulted', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  I: { label: 'I', full: 'Informed', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
};

export const RaciMatrixView: React.FC = () => {
  const { currentProject, setProjectData, pushSnapshot } = useProjectStore();
  const { currentCanvasPermission } = useAuthStore();
  const { showNotification } = useUiStore();

  const matrixData = useMemo(() => {
    if (!currentProject) return null;
    return computeRaciMatrix(
      currentProject.nodes,
      currentProject.edges,
      currentProject.pools,
      currentProject.raciOverrides
    );
  }, [currentProject]);

  if (!currentProject || !matrixData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-theme-bg text-theme-text-muted">
        No hay proyecto seleccionado para generar la matriz RACI.
      </div>
    );
  }

  const canEdit = currentCanvasPermission !== 'READ_ONLY' && currentCanvasPermission !== 'COMMENTS';
  const hasOverrides = Boolean(currentProject.raciOverrides && Object.keys(currentProject.raciOverrides).length > 0);

  const handleCellClick = (taskIdx: number, roleId: string) => {
    if (!canEdit) {
      showNotification('No tienes permisos de edición para modificar la matriz RACI.', 'warning');
      return;
    }

    const cycle: RaciRoleType[] = ['A/R', 'R', 'A', 'C', 'I', ''];
    const row = matrixData.rows[taskIdx];
    const current = row.assignments[roleId] || '';
    const currentIdx = cycle.indexOf(current);
    const nextVal = cycle[(currentIdx + 1) % cycle.length];

    pushSnapshot('Editar asignación RACI');
    const prevOverrides = currentProject.raciOverrides || {};
    const prevTaskOverrides = prevOverrides[row.taskId] || {};

    setProjectData({
      ...currentProject,
      raciOverrides: {
        ...prevOverrides,
        [row.taskId]: {
          ...prevTaskOverrides,
          [roleId]: nextVal
        }
      }
    });
  };

  const handleResetOverrides = () => {
    if (!canEdit || !hasOverrides) return;
    pushSnapshot('Restaurar matriz RACI por defecto');
    const nextProject = { ...currentProject };
    delete nextProject.raciOverrides;
    setProjectData(nextProject);
    showNotification('Matriz RACI restaurada a los valores por defecto.', 'info');
  };

  const handleExportExcel = () => {
    exportRaciMatrixToExcel(
      matrixData,
      currentProject.documentControl.documentTitle,
      currentProject.documentControl.documentCode
    );
    showNotification('Matriz RACI exportada exitosamente a Excel (.xlsx)', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-theme-bg select-text transition-colors overflow-hidden">
      {/* Action Bar */}
      <div className="h-14 bg-theme-surface border-b border-theme-border px-6 flex items-center justify-between shrink-0 print:hidden z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-theme-text">
            <span className="flex items-center text-theme-accent font-bold">
              <Table className="w-4 h-4 mr-1.5" />
              Matriz RACI Organizacional
            </span>
            <span className="text-theme-text-muted">&bull;</span>
            <span className="text-[11px] text-theme-text-muted">
              {matrixData.totalTasks} Actividades &bull; {matrixData.roles.length} Roles
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasOverrides && canEdit && (
            <button
              onClick={handleResetOverrides}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-theme-surface-subtle hover:bg-theme-surface-hover text-theme-text-muted hover:text-theme-text border border-theme-border rounded-xl text-xs font-medium transition-all"
              title="Restaurar asignaciones RACI por defecto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar RACI</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/30 rounded-xl text-xs font-bold transition-all"
            title="Descargar matriz en Excel .xlsx"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            title="Imprimir o guardar en PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir en PDF</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {/* Printable Card */}
        <div className="max-w-7xl mx-auto bg-theme-surface border border-theme-border rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="border-b-2 border-theme-border pb-5 page-break-avoid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-theme-accent print:text-slate-800">
                  Responsabilidad y Rendición de Cuentas Operativa
                </div>
                <h1 className="text-2xl font-extrabold text-theme-text mt-1 print:text-black">
                  Matriz RACI: {currentProject.documentControl.documentTitle}
                </h1>
                <p className="text-xs text-theme-text-muted mt-0.5 print:text-slate-600">
                  {currentProject.documentControl.organizationUnit} &bull; Código: {currentProject.documentControl.documentCode} &bull; Versión: {currentProject.documentControl.version}
                </p>
              </div>

              {/* RACI Legend */}
              <div className="flex flex-wrap items-center gap-2 bg-theme-surface-subtle p-2.5 rounded-xl border border-theme-border print:bg-slate-100 print:border-slate-300">
                {Object.entries(RACI_BADGES).map(([key, item]) => (
                  <div key={key} className="flex items-center space-x-1 text-[11px] font-mono">
                    <span className={`min-w-6 px-1 h-5 rounded flex items-center justify-center font-bold border ${item.bg} ${item.text} ${item.border}`}>
                      {item.label}
                    </span>
                    <span className="text-theme-text-muted print:text-slate-700 text-[10px]">{item.full}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {matrixData.accountableWarnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5 print:hidden">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-amber-400">
                  Regla de gobernanza RACI: cada actividad debe tener exactamente un responsable que rinde cuentas (&quot;A&quot; o &quot;A/R&quot;).
                </div>
                <ul className="list-disc list-inside text-[11px] text-amber-200/90 space-y-0.5">
                  {matrixData.accountableWarnings.map((w) => (
                    <li key={w.taskId}>
                      <span className="font-mono font-bold">{w.standardId}</span> ({w.title}):{' '}
                      {w.accountableCount === 0
                        ? 'sin ningún "A" asignado.'
                        : `${w.accountableCount} roles con "A" (debe haber uno solo).`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* RACI Grid Table */}
          <div className="overflow-x-auto rounded-xl border border-theme-border">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-theme-surface-subtle border-b border-theme-border text-[11px] font-mono uppercase text-theme-text-muted print:bg-slate-200 print:text-slate-900">
                  <th className="p-3 w-20 font-bold">ID</th>
                  <th className="p-3 min-w-[220px] font-bold">Actividad / Tarea</th>
                  <th className="p-3 min-w-[150px] font-bold">Carril Operativo</th>
                  {matrixData.roles.map((role) => (
                    <th key={role.id} className="p-3 text-center min-w-[120px] font-bold border-l border-theme-border">
                      <div className="truncate max-w-[130px]" title={role.name}>
                        {role.name}
                      </div>
                      <div className="text-[9px] font-normal text-theme-text-muted/70 truncate">
                        {role.laneName}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {matrixData.rows.map((row, rIdx) => (
                  <tr
                    key={row.taskId}
                    className="hover:bg-theme-surface-subtle/50 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-theme-accent print:text-slate-900">
                      {row.standardId}
                    </td>
                    <td className="p-3 font-medium text-theme-text print:text-black">
                      {row.title}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-theme-text-muted print:text-slate-600">
                      {row.laneName}
                    </td>
                    {matrixData.roles.map((role) => {
                      const val = row.assignments[role.id];
                      const badge = val ? RACI_BADGES[val] : null;

                      return (
                        <td
                          key={role.id}
                          onClick={() => handleCellClick(rIdx, role.id)}
                          className="p-2.5 text-center border-l border-theme-border cursor-pointer hover:bg-theme-accent/10 transition-colors"
                          title="Haz clic para alternar: A/R -> R -> A -> C -> I -> Vacío"
                        >
                          {badge ? (
                            <span
                              className={`inline-flex items-center justify-center min-w-8 px-1.5 h-7 rounded-lg font-mono font-black text-xs border shadow-xs ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {badge.label}
                            </span>
                          ) : (
                            <span className="text-theme-text-muted/30 font-mono text-[11px]">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border text-[11px] text-theme-text-muted flex items-center justify-between print:hidden">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-theme-accent" />
              Haz clic en cualquier celda para alternar el rol asignado (<strong>A/R</strong>, <strong>R</strong>, <strong>A</strong>, <strong>C</strong>, <strong>I</strong> o vacío).
            </span>
            <span className="font-mono font-semibold text-theme-accent">
              {hasOverrides ? 'Cambios guardados en el proyecto' : 'Valores por defecto'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
