import React, { useMemo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { generateTechnicalReport } from '../../services/topologicalSort';
import {
  Printer,
  FileCheck,
  Shield,
  Clock,
  Scale,
  Layers,
  AlertTriangle,
  GitBranch
} from 'lucide-react';

export const TechnicalReportView: React.FC = () => {
  const { currentProject } = useProjectStore();

  const report = useMemo(() => {
    if (!currentProject) return null;
    return generateTechnicalReport(
      currentProject.documentControl,
      currentProject.nodes,
      currentProject.edges,
      currentProject.pools
    );
  }, [currentProject]);

  const handlePrint = () => {
    window.print();
  };

  if (!currentProject || !report) {
    return (
      <div className="flex-1 flex items-center justify-center bg-theme-bg text-theme-text-muted">
        No hay proyecto seleccionado para generar la Ficha Técnica.
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-theme-bg p-4 md:p-8 select-text transition-colors">
      {/* Top Action Bar (hidden when printing) */}
      <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-2 text-xs font-mono text-theme-text-muted">
          <FileCheck className="w-4 h-4 text-theme-accent" />
          <span>Ficha Técnica Procesal Generada por Ordenamiento Topológico</span>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-transform active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / Guardar en PDF</span>
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-5xl mx-auto bg-theme-surface text-theme-text rounded-2xl border border-theme-border p-8 md:p-12 shadow-2xl space-y-8 print:bg-white print:text-black print:p-0 print:border-none print:shadow-none transition-colors">
        
        {/* 1. Header & Document Control */}
        <div className="border-b-2 border-theme-accent/60 pb-6 print:border-slate-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-theme-accent font-mono text-xs font-bold uppercase tracking-wider print:text-slate-800">
                <Shield className="w-4 h-4" />
                <span>Documento Técnico Formal &bull; ISO 9001:2015 / ISO 19510</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-theme-text mt-1 print:text-black">
                {report.projectTitle}
              </h1>
              <p className="text-xs text-theme-text-muted mt-1 print:text-slate-700">
                {report.organizationUnit}
              </p>
            </div>

            <div className="bg-theme-surface-subtle p-4 rounded-xl border border-theme-border text-right space-y-1 print:bg-slate-100 print:border-slate-300 print:text-black">
              <div className="text-xs font-mono font-bold text-theme-accent print:text-slate-900">
                CÓDIGO: {report.documentCode}
              </div>
              <div className="text-xs font-mono text-[#F59E0B] font-semibold print:text-slate-800">
                VERSIÓN: {report.version}
              </div>
              <div className="text-[11px] font-mono text-theme-text-muted print:text-slate-600">
                FECHA: {new Date(report.timestampUtc).toISOString().substring(0, 10)} (UTC)
              </div>
            </div>
          </div>

          {/* Objective */}
          <div className="mt-4 p-4 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs text-theme-text leading-relaxed print:bg-slate-50 print:border-slate-300 print:text-slate-900">
            <span className="font-bold text-theme-text print:text-black uppercase text-[11px] font-mono block mb-1">
              Objetivo Declarativo del Proceso:
            </span>
            {report.objective}
          </div>

          {/* Legal Framework List */}
          {report.normativeFramework && report.normativeFramework.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono text-[11px] text-[#F59E0B] font-bold print:text-slate-800 flex items-center">
                <Scale className="w-3.5 h-3.5 mr-1" />
                Marco Normativo Consolidado:
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border text-center print:bg-slate-50 print:border-slate-300">
            <div className="text-[11px] font-mono uppercase text-theme-text-muted print:text-slate-600">
              Tiempo de Ciclo Directo
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
              Plazo Máximo de Prescripción
            </div>
            <div className="text-xl font-bold text-[#F59E0B] mt-1 font-mono print:text-slate-900">
              {report.maxLegalPrescriptionDays} Días Corridos
            </div>
            <div className="text-[10px] text-theme-text-muted mt-0.5 font-mono print:text-slate-600">
              (Límite Legal Extintivo de Acción)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border text-center print:bg-slate-50 print:border-slate-300">
            <div className="text-[11px] font-mono uppercase text-theme-text-muted print:text-slate-600">
              Puntos de Control & Riesgos
            </div>
            <div className="text-xl font-bold text-[#10B981] mt-1 font-mono print:text-slate-900">
              {report.riskMatrix.length} Riesgos / {report.chronologicalSteps.filter(s => s.qualityCheck).length} QC
            </div>
            <div className="text-[10px] text-theme-text-muted mt-0.5 font-mono print:text-slate-600">
              (Controles Mitigantes ISO 9001)
            </div>
          </div>
        </div>

        {/* 3. Systems and Role Responsibilities Mapping */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-theme-accent mb-3 font-mono print:text-slate-900 flex items-center">
            <Layers className="w-4 h-4 mr-1.5" />
            1. Matriz de Responsabilidades y Sistemas de Soporte (TI)
          </h3>
          <div className="overflow-x-auto rounded-xl border border-theme-border print:border-slate-300">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-theme-surface-subtle border-b border-theme-border text-theme-text-muted font-mono text-[11px] print:bg-slate-200 print:text-black">
                  <th className="p-2.5">Carril (Swimlane)</th>
                  <th className="p-2.5">Rol / Responsable</th>
                  <th className="p-2.5">Sistemas TI Intervinientes</th>
                  <th className="p-2.5 text-center">Tareas Asignadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border print:divide-slate-300">
                {report.systemsAndRoles.map((sr, idx) => (
                  <tr key={idx} className="hover:bg-theme-surface-hover/40 print:hover:bg-transparent text-theme-text print:text-black">
                    <td className="p-2.5 font-bold text-theme-text print:text-black">{sr.laneName}</td>
                    <td className="p-2.5 font-medium text-theme-accent print:text-slate-800">{sr.role}</td>
                    <td className="p-2.5 font-mono text-[11px] text-theme-text-muted print:text-slate-700">
                      {sr.itSystems.join(', ')}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-theme-text print:text-black">
                      {sr.assignedTaskCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Chronological Step-by-Step Table (Topological Sort Order) */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-theme-accent mb-3 font-mono print:text-slate-900 flex items-center">
            <Clock className="w-4 h-4 mr-1.5" />
            2. Secuencia Operativa Cronológica Paso a Paso (Orden Topológico)
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
                  <th className="p-2.5">Marco Legal</th>
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
                    <td className="p-2.5 font-mono text-[10px] text-theme-text-muted print:text-slate-600">{step.legalArticle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. ISO 9001 Operational Risk & Quality Control Matrix */}
        {report.riskMatrix.length > 0 && (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#EF4444] mb-3 font-mono print:text-slate-900 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              3. Matriz de Riesgos Operativos y Controles Mitigantes (ISO 9001:2015 Cláusula 6.1)
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
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#F59E0B] mb-3 font-mono print:text-slate-900 flex items-center">
              <GitBranch className="w-4 h-4 mr-1.5" />
              4. Matriz de Puntos de Decisión y Lógica de Bifurcación
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
        <div className="pt-6 border-t-2 border-theme-border print:border-slate-900 space-y-6">
          <div>
            <h4 className="text-xs font-mono font-bold uppercase text-theme-text-muted print:text-slate-800 mb-2">
              Historial Formal de Revisiones (ISO 9001 Control de Cambios)
            </h4>
            <div className="overflow-x-auto rounded-lg border border-theme-border print:border-slate-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-theme-surface-subtle border-b border-theme-border text-theme-text-muted font-mono text-[10px] uppercase print:bg-slate-200 print:text-black">
                    <th className="p-2">Fecha (UTC)</th>
                    <th className="p-2">Versión</th>
                    <th className="p-2">Responsable del Modelado</th>
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
  );
};

