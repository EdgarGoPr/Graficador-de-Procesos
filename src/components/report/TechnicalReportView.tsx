import React, { useMemo, useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { generateTechnicalReport } from '../../services/topologicalSort';
import { ProcessDiagramPrintView } from './ProcessDiagramPrintView';
import {
  Printer,
  FileCheck,
  Shield,
  Clock,
  Scale,
  Layers,
  AlertTriangle,
  GitBranch,
  FileText,
  MapPin,
  CheckCircle2,
  Calendar,
  User,
  Building2,
  HelpCircle
} from 'lucide-react';

export const TechnicalReportView: React.FC = () => {
  const { currentProject } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'DOCUMENT' | 'DIAGRAM'>('DOCUMENT');

  const report = useMemo(() => {
    if (!currentProject) return null;
    return generateTechnicalReport(
      currentProject.documentControl,
      currentProject.nodes,
      currentProject.edges,
      currentProject.pools
    );
  }, [currentProject]);

  const handlePrintDocument = () => {
    window.print();
  };

  // Group nodes hierarchically by Lane / Functional Area
  const hierarchicalLanes = useMemo(() => {
    if (!currentProject) return [];

    const defaultPool = currentProject.pools[0];
    if (!defaultPool) return [];

    return defaultPool.lanes.map((lane) => {
      // Find all nodes in this lane (excluding PoolLane itself)
      const laneNodes = currentProject.nodes
        .filter((n) => n.type !== 'PoolLane' && (n.data?.laneId === lane.id || (!n.data?.laneId && lane.order === 0)))
        .sort((a, b) => (a.position?.x || 0) - (b.position?.x || 0));

      return {
        lane,
        nodes: laneNodes
      };
    });
  }, [currentProject]);

  if (!currentProject || !report) {
    return (
      <div className="flex-1 flex items-center justify-center bg-theme-bg text-theme-text-muted">
        No hay proyecto seleccionado para generar el documento del proceso.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-theme-bg select-text transition-colors overflow-hidden">
      {/* Dynamic Portrait print style for text document */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.2cm;
          }
        }
      `}</style>

      {/* Top Action & View Selector Bar (hidden when printing) */}
      <div className="h-14 bg-theme-surface border-b border-theme-border px-6 flex items-center justify-between shrink-0 print:hidden z-10">
        {/* Sub-Tabs: Document vs Diagram */}
        <div className="flex items-center space-x-1 bg-theme-surface-subtle p-1 rounded-xl border border-theme-border">
          <button
            onClick={() => setActiveTab('DOCUMENT')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'DOCUMENT'
                ? 'bg-theme-surface text-theme-accent shadow-sm border border-theme-border font-bold'
                : 'text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Documento Estructurado (Texto & Jerarquía)</span>
          </button>

          <button
            onClick={() => setActiveTab('DIAGRAM')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'DIAGRAM'
                ? 'bg-theme-surface text-theme-accent shadow-sm border border-theme-border font-bold'
                : 'text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Diagrama del Proceso (Mapa Gráfico)</span>
          </button>
        </div>

        {/* Print Button */}
        {activeTab === 'DOCUMENT' && (
          <button
            onClick={handlePrintDocument}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Documento en PDF</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'DIAGRAM' ? (
        <ProcessDiagramPrintView />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Printable Sheet */}
          <div className="max-w-5xl mx-auto bg-theme-surface text-theme-text rounded-2xl border border-theme-border p-8 md:p-12 shadow-2xl space-y-10 print:bg-white print:text-black print:p-0 print:border-none print:shadow-none transition-colors">
            
            {/* 1. Header & Document Control */}
            <div className="border-b-2 border-theme-accent/60 pb-6 print:border-slate-900 page-break-avoid">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-theme-accent font-mono text-xs font-bold uppercase tracking-wider print:text-slate-800">
                    <Shield className="w-4 h-4" />
                    <span>Manual de Procedimientos &bull; ISO 9001:2015 / BPMN 2.0</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-theme-text mt-1 print:text-black">
                    {report.projectTitle}
                  </h1>
                  <p className="text-xs text-theme-text-muted mt-1 print:text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-theme-accent inline" />
                    {report.organizationUnit} &bull; Responsable: {report.author}
                  </p>
                </div>

                <div className="bg-theme-surface-subtle p-4 rounded-xl border border-theme-border text-right space-y-1 print:bg-slate-100 print:border-slate-300 print:text-black shrink-0">
                  <div className="text-xs font-mono font-bold text-theme-accent print:text-slate-900">
                    CÓDIGO: {report.documentCode}
                  </div>
                  <div className="text-xs font-mono text-[#F59E0B] font-semibold print:text-slate-800">
                    VERSIÓN: {report.version}
                  </div>
                  <div className="text-[11px] font-mono text-theme-text-muted print:text-slate-600">
                    FECHA: {new Date(report.timestampUtc).toISOString().substring(0, 10)}
                  </div>
                </div>
              </div>

              {/* Objective */}
              <div className="mt-4 p-4 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs text-theme-text leading-relaxed print:bg-slate-50 print:border-slate-300 print:text-slate-900">
                <span className="font-bold text-theme-text print:text-black uppercase text-[11px] font-mono block mb-1">
                  1. Objetivo y Alcance Operativo:
                </span>
                {report.objective}
              </div>

              {/* Legal Framework List */}
              {report.normativeFramework && report.normativeFramework.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono text-[11px] text-[#F59E0B] font-bold print:text-slate-800 flex items-center">
                    <Scale className="w-3.5 h-3.5 mr-1" />
                    Marco Normativo Aplicable:
                  </span>
                  {report.normativeFramework.map((norm, idx) => (
                    <span
                      key={idx}
                      className="bg-theme-surface-subtle text-theme-text px-2 py-0.5 rounded border border-theme-border font-mono text-[11px] print:bg-slate-200 print:text-slate-800"
                    >
                      {norm}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Executive SLA & Cycle Time Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 page-break-avoid">
              <div className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border text-center print:bg-slate-50 print:border-slate-300">
                <div className="text-[11px] font-mono uppercase text-theme-text-muted print:text-slate-600">
                  Tiempo de Ciclo Estimado
                </div>
                <div className="text-xl font-bold text-theme-accent mt-1 font-mono print:text-slate-900">
                  {report.totalDirectCycleTimeDays > 0 ? `${report.totalDirectCycleTimeDays} Días Hábiles` : `${report.totalDirectCycleTimeHours} Horas`}
                </div>
                <div className="text-[10px] text-theme-text-muted mt-0.5 font-mono print:text-slate-600">
                  ({report.totalDirectCycleTimeHours} Horas Administrativas)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border text-center print:bg-slate-50 print:border-slate-300">
                <div className="text-[11px] font-mono uppercase text-theme-text-muted print:text-slate-600">
                  Plazo Máximo / Prescripción
                </div>
                <div className="text-xl font-bold text-[#F59E0B] mt-1 font-mono print:text-slate-900">
                  {report.maxLegalPrescriptionDays} Días Corridos
                </div>
                <div className="text-[10px] text-theme-text-muted mt-0.5 font-mono print:text-slate-600">
                  (Límite de Acción Administrativa)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border text-center print:bg-slate-50 print:border-slate-300">
                <div className="text-[11px] font-mono uppercase text-theme-text-muted print:text-slate-600">
                  Control de Calidad & Riesgos
                </div>
                <div className="text-xl font-bold text-[#10B981] mt-1 font-mono print:text-slate-900">
                  {report.riskMatrix.length} Riesgos / {report.chronologicalSteps.filter(s => s.qualityCheck).length} QC
                </div>
                <div className="text-[10px] text-theme-text-muted mt-0.5 font-mono print:text-slate-600">
                  (Controles Mitigantes ISO 9001)
                </div>
              </div>
            </div>

            {/* 3. DESGLOSE JERÁRQUICO COMPLETO (POR CARRILES Y FICHAS DE ITEMS) */}
            <div className="space-y-6">
              <div className="border-b border-theme-border pb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-theme-accent font-mono print:text-slate-900 flex items-center">
                  <Layers className="w-4 h-4 mr-1.5" />
                  2. Estructura Jerárquica del Proceso y Fichas Operativas
                </h3>
                <span className="text-xs font-mono text-theme-text-muted print:text-slate-600">
                  {hierarchicalLanes.reduce((acc, l) => acc + l.nodes.length, 0)} Elementos en {hierarchicalLanes.length} Carriles
                </span>
              </div>

              {hierarchicalLanes.map(({ lane, nodes }, laneIdx) => (
                <div
                  key={lane.id}
                  className="rounded-2xl border border-theme-border bg-theme-surface-subtle/50 p-5 space-y-4 page-break-avoid print:bg-white print:border-slate-400 print:p-4"
                >
                  {/* Lane Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-theme-border gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: lane.colorHex || '#38BDF8' }}
                      />
                      <h4 className="text-base font-bold text-theme-text print:text-black">
                        {laneIdx + 1}. {lane.name}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-3 text-xs font-mono text-theme-text-muted print:text-slate-700">
                      <span>Rol: <strong className="text-theme-text print:text-black">{lane.role || 'Responsable'}</strong></span>
                      <span>&bull;</span>
                      <span>Sistema: <strong className="text-theme-accent print:text-slate-900">{lane.system || 'SAM/VUPRA'}</strong></span>
                    </div>
                  </div>

                  {/* Nodes List within this lane */}
                  {nodes.length === 0 ? (
                    <div className="text-xs italic text-theme-text-muted py-2 text-center">
                      No hay actividades asignadas a este carril actualmente.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {nodes.map((node, nodeIdx) => {
                        const data = node.data;
                        const isGateway = node.type?.includes('Gateway');
                        const isQC = node.type === 'QualityCheckpointEvent' || data?.qualityCheckpoint;
                        const isSubProcess = node.type === 'SubProcess';

                        // Format NodeType Badge Label
                        const typeLabel = {
                          StartEvent: 'Evento de Inicio',
                          EndEvent: 'Evento de Fin',
                          UserTask: 'Tarea de Usuario',
                          ServiceTask: 'Tarea de Servicio TI',
                          ManualTask: 'Tarea Manual',
                          ExclusiveGateway: 'Decisión Exclusiva (XOR)',
                          ParallelGateway: 'Bifurcación Paralela (AND)',
                          QualityCheckpointEvent: 'Control de Calidad (QC)',
                          TimerBoundaryEvent: 'Plazo Legal / Temporizador',
                          SubProcess: 'Subproceso',
                        }[node.type || ''] || node.type;

                        return (
                          <div
                            key={node.id}
                            className="p-4 rounded-xl bg-theme-surface border border-theme-border text-xs space-y-2.5 page-break-avoid print:bg-slate-50 print:border-slate-300 shadow-sm"
                          >
                            {/* Card Header: ID Nomenclatura, Tipo, Título */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-theme-accent/15 text-theme-accent border border-theme-accent/30 print:bg-slate-200 print:text-black print:border-slate-400">
                                  {data?.standardId || `ID-${laneIdx + 1}.${nodeIdx + 1}`}
                                </span>
                                <span className="font-bold text-sm text-theme-text print:text-black">
                                  {data?.title || 'Sin Título'}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-theme-surface-subtle text-theme-text-muted border border-theme-border print:bg-slate-200 print:text-slate-800">
                                {typeLabel}
                              </span>
                            </div>

                            {/* Descripción Operativa */}
                            <p className="text-theme-text-muted print:text-slate-800 text-xs leading-relaxed">
                              {data?.description || 'Sin descripción detallada registrada.'}
                            </p>

                            {/* Attributes Grid (Responsable, Sistema, Plazo, Marco Legal) */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-theme-text-muted print:text-slate-700 border-t border-theme-border/60">
                              <div>
                                <span className="block text-[9px] uppercase text-theme-text-muted/70 print:text-slate-500">Responsable</span>
                                <span className="text-theme-text print:text-black font-sans">{data?.roleName || lane.role || '-'}</span>
                              </div>
                              <div>
                                <span className="block text-[9px] uppercase text-theme-text-muted/70 print:text-slate-500">Sistema TI</span>
                                <span className="text-theme-accent print:text-slate-900">{data?.itSystem || lane.system || '-'}</span>
                              </div>
                              <div>
                                <span className="block text-[9px] uppercase text-theme-text-muted/70 print:text-slate-500">Plazo / SLA</span>
                                <span className="text-[#F59E0B] print:text-slate-800">
                                  {data?.slaDuration ? `${data.slaDuration.value} ${data.slaDuration.unit}` : 'Inmediato'}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[9px] uppercase text-theme-text-muted/70 print:text-slate-500">Marco Legal</span>
                                <span className="truncate block">{data?.legalFramework || '-'}</span>
                              </div>
                            </div>

                            {/* Inputs & Outputs (Entradas y Salidas) */}
                            {((data?.inputs && data.inputs.length > 0) || (data?.outputs && data.outputs.length > 0)) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] border-t border-theme-border/60">
                                {data?.inputs && data.inputs.length > 0 && (
                                  <div>
                                    <span className="font-bold text-theme-text-muted print:text-slate-600 block text-[10px]">
                                      📥 Entradas (Inputs):
                                    </span>
                                    <span className="text-theme-text print:text-black">{data.inputs.join(', ')}</span>
                                  </div>
                                )}
                                {data?.outputs && data.outputs.length > 0 && (
                                  <div>
                                    <span className="font-bold text-theme-text-muted print:text-slate-600 block text-[10px]">
                                      📤 Salidas / Entregables:
                                    </span>
                                    <span className="text-theme-text print:text-black">{data.outputs.join(', ')}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Punto de Control de Calidad (QC) */}
                            {data?.qualityCheckpoint && (
                              <div className="p-2 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] print:bg-emerald-50 print:border-emerald-300 print:text-emerald-900 text-[11px]">
                                <strong>Control de Calidad ({data.qualityCheckpoint.checkpointCode}):</strong> {data.qualityCheckpoint.inspectionCriteria}
                              </div>
                            )}

                            {/* Riesgos Operativos Asociados */}
                            {data?.operationalRisks && data.operationalRisks.length > 0 && (
                              <div className="space-y-1 pt-1">
                                {data.operationalRisks.map((r, rIdx) => (
                                  <div
                                    key={rIdx}
                                    className="p-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[11px] space-y-0.5 print:bg-red-50 print:border-red-300"
                                  >
                                    <div className="flex items-center justify-between text-[#EF4444] print:text-red-800 font-bold">
                                      <span>⚠️ Riesgo ({r.riskId}): {r.description}</span>
                                      <span className="text-[10px] font-mono">Impacto: {r.impact} &bull; Prob: {r.probability}</span>
                                    </div>
                                    <div className="text-theme-text-muted print:text-slate-800">
                                      <strong>Control Mitigante:</strong> {r.mitigatingControl}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 4. Matriz Cronológica Resumida (Paso a Paso) */}
            <div className="page-break-avoid">
              <h3 className="text-sm font-bold uppercase tracking-wider text-theme-accent mb-3 font-mono print:text-slate-900 flex items-center">
                <Clock className="w-4 h-4 mr-1.5" />
                3. Secuencia Operativa Cronológica Paso a Paso
              </h3>
              <div className="overflow-x-auto rounded-xl border border-theme-border print:border-slate-300">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-theme-surface-subtle border-b border-theme-border text-theme-text-muted font-mono text-[10px] uppercase print:bg-slate-200 print:text-black">
                      <th className="p-2.5 w-12 text-center">N°</th>
                      <th className="p-2.5 w-20">ID</th>
                      <th className="p-2.5">Tarea / Hito Operativo</th>
                      <th className="p-2.5">Responsable</th>
                      <th className="p-2.5">Sistema TI</th>
                      <th className="p-2.5">Plazo SLA</th>
                      <th className="p-2.5">Entregable / Salida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border print:divide-slate-300">
                    {report.chronologicalSteps.map((step) => (
                      <tr
                        key={step.standardId + step.stepNumber}
                        className="hover:bg-theme-surface-hover/40 print:hover:bg-transparent text-theme-text print:text-black"
                      >
                        <td className="p-2.5 text-center font-mono text-theme-text-muted print:text-slate-700">
                          {step.stepNumber}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-theme-accent print:text-slate-900">
                          {step.standardId}
                        </td>
                        <td className="p-2.5 font-semibold text-theme-text print:text-black">
                          <div>{step.title}</div>
                          {step.qualityCheck && (
                            <div className="text-[10px] text-[#10B981] font-normal mt-0.5 print:text-emerald-700">
                              {step.qualityCheck}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-theme-text-muted print:text-slate-700">{step.role}</td>
                        <td className="p-2.5 font-mono text-[10px] text-theme-accent print:text-slate-800">{step.itSystem}</td>
                        <td className="p-2.5 font-mono text-[10px] text-[#F59E0B] font-semibold print:text-slate-800">
                          {step.sla}
                        </td>
                        <td className="p-2.5 text-theme-text-muted print:text-slate-700 leading-snug">{step.deliverables}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. ISO 9001 Operational Risk Matrix */}
            {report.riskMatrix.length > 0 && (
              <div className="page-break-avoid">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#EF4444] mb-3 font-mono print:text-slate-900 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5" />
                  4. Matriz de Riesgos Operativos y Controles Mitigantes (ISO 9001:2015 Cláusula 6.1)
                </h3>
                <div className="overflow-x-auto rounded-xl border border-theme-border print:border-slate-300">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-theme-surface-subtle border-b border-theme-border text-theme-text-muted font-mono text-[10px] uppercase print:bg-slate-200 print:text-black">
                        <th className="p-2.5 w-16">ID Rsk</th>
                        <th className="p-2.5">Nodo / Etapa</th>
                        <th className="p-2.5">Riesgo Operativo Identificado</th>
                        <th className="p-2.5">Severidad</th>
                        <th className="p-2.5 text-[#10B981] print:text-slate-900">Control Mitigante Obligatorio</th>
                        <th className="p-2.5">Sistema TI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border print:divide-slate-300">
                      {report.riskMatrix.map((rsk, idx) => (
                        <tr key={idx} className="hover:bg-theme-surface-hover/40 print:hover:bg-transparent text-theme-text print:text-black">
                          <td className="p-2.5 font-mono font-bold text-[#EF4444] print:text-red-700">{rsk.riskId}</td>
                          <td className="p-2.5 font-semibold text-theme-text print:text-black">
                            {rsk.nodeStandardId} - {rsk.nodeTitle}
                          </td>
                          <td className="p-2.5 text-theme-text-muted print:text-slate-800 leading-snug">{rsk.riskDescription}</td>
                          <td className="p-2.5 font-mono text-[10px] text-[#F59E0B] font-semibold print:text-slate-700">{rsk.impact}</td>
                          <td className="p-2.5 font-medium text-[#10B981] print:text-emerald-800 leading-snug">
                            {rsk.mitigatingControl}
                          </td>
                          <td className="p-2.5 font-mono text-[10px] text-theme-text-muted print:text-slate-600">{rsk.itSystem}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. Decision Gateways Matrix */}
            {report.decisionGateways.length > 0 && (
              <div className="page-break-avoid">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#F59E0B] mb-3 font-mono print:text-slate-900 flex items-center">
                  <GitBranch className="w-4 h-4 mr-1.5" />
                  5. Matriz de Decisiones y Lógica de Bifurcación
                </h3>
                <div className="space-y-3">
                  {report.decisionGateways.map((gw, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border print:bg-slate-50 print:border-slate-300">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-[#F59E0B] text-xs print:text-slate-900">
                          {gw.standardId} &bull; {gw.gatewayTitle}
                        </span>
                        <span className="text-[11px] text-theme-text-muted font-mono print:text-slate-700">
                          Evaluador: {gw.evaluatingRole}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {gw.resolutionOptions.map((opt, optIdx) => (
                          <div key={optIdx} className="p-2 rounded bg-theme-surface border border-theme-border text-xs print:bg-white print:border-slate-300">
                            <div className="font-mono text-[11px] text-theme-accent print:text-slate-800">
                              Condición: {opt.condition}
                            </div>
                            <div className="text-theme-text-muted print:text-slate-700 text-[11px] mt-0.5">
                              Destino: {opt.targetStep}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Document Revision History & Signatures */}
            <div className="pt-6 border-t-2 border-theme-border print:border-slate-900 space-y-6 page-break-avoid">
              <div>
                <h4 className="text-xs font-mono font-bold uppercase text-theme-text-muted print:text-slate-800 mb-2">
                  Historial Formal de Revisiones (Control de Cambios ISO 9001)
                </h4>
                <div className="overflow-x-auto rounded-lg border border-theme-border print:border-slate-300">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-theme-surface-subtle border-b border-theme-border text-theme-text-muted font-mono text-[10px] uppercase print:bg-slate-200 print:text-black">
                        <th className="p-2">Fecha (UTC)</th>
                        <th className="p-2">Versión</th>
                        <th className="p-2">Responsable</th>
                        <th className="p-2">Descripción del Cambio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border print:divide-slate-300 text-theme-text print:text-black">
                      {currentProject.documentControl.revisionHistory.map((rev, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono text-[11px]">{rev.revisionDate.substring(0, 10)}</td>
                          <td className="p-2 font-mono font-bold text-[#F59E0B] print:text-black">{rev.version}</td>
                          <td className="p-2">{rev.author}</td>
                          <td className="p-2 leading-relaxed text-theme-text-muted">{rev.changeDescription}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Technical Sign-Off Block */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div className="border-t border-theme-border pt-2 print:border-black">
                  <div className="font-bold text-theme-text print:text-black">{report.author}</div>
                  <div className="text-[11px] text-theme-text-muted print:text-slate-700">Responsable de Modelado y Calidad</div>
                  <div className="text-[10px] text-theme-text-muted font-mono mt-1">Firma Técnica Digital / Certificada</div>
                </div>
                <div className="border-t border-theme-border pt-2 print:border-black">
                  <div className="font-bold text-theme-text print:text-black">Dirección / Jefatura de Unidad</div>
                  <div className="text-[11px] text-theme-text-muted print:text-slate-700">{report.organizationUnit}</div>
                  <div className="text-[10px] text-theme-text-muted font-mono mt-1">Aprobación y Puesta en Efectividad</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
