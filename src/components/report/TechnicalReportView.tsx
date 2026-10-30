import React, { useMemo, useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { generateTechnicalReport } from '../../services/topologicalSort';
import { ProcessDiagramPrintView } from './ProcessDiagramPrintView';
import {
  autoGenerateManualMetadataFromGraph,
  exportFullStandardizedManualPdf
} from '../../services/pdfFullManualExportService';
import { ProcessGlossaryTerm, ProcessKpiDefinition } from '../../types/project';
import {
  Printer,
  Shield,
  Clock,
  Scale,
  Layers,
  AlertTriangle,
  GitBranch,
  FileText,
  MapPin,
  Building2,
  Sparkles,
  Download,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';

export const TechnicalReportView: React.FC = () => {
  const { currentProject, updateDocumentControl } = useProjectStore();
  const { showNotification } = useUiStore();
  const [activeTab, setActiveTab] = useState<'DOCUMENT' | 'ENRICHED_FORM' | 'DIAGRAM'>('DOCUMENT');
  const [isExportingManual, setIsExportingManual] = useState(false);

  const report = useMemo(() => {
    if (!currentProject) return null;
    return generateTechnicalReport(
      currentProject.documentControl,
      currentProject.nodes,
      currentProject.edges,
      currentProject.pools
    );
  }, [currentProject]);

  const enrichedMeta = useMemo(() => {
    if (!currentProject) return null;
    return autoGenerateManualMetadataFromGraph(currentProject);
  }, [currentProject]);

  // Group nodes hierarchically by Lane / Functional Area
  const hierarchicalLanes = useMemo(() => {
    if (!currentProject) return [];

    const defaultPool = currentProject.pools[0];
    if (!defaultPool) return [];

    return defaultPool.lanes.map((lane) => {
      const laneNodes = currentProject.nodes
        .filter((n) => n.type !== 'PoolLane' && (n.data?.laneId === lane.id || (!n.data?.laneId && lane.order === 0)))
        .sort((a, b) => (a.position?.x || 0) - (b.position?.x || 0));

      return {
        lane,
        nodes: laneNodes
      };
    });
  }, [currentProject]);

  if (!currentProject || !report || !enrichedMeta) {
    return (
      <div className="flex-1 flex items-center justify-center bg-theme-bg text-theme-text-muted">
        No hay proyecto seleccionado para generar el documento del proceso.
      </div>
    );
  }

  const handleDownloadFullManualPdf = async () => {
    try {
      setIsExportingManual(true);
      const fileName = await exportFullStandardizedManualPdf(currentProject);
      showNotification(`Manual Oficial PDF generado con éxito: ${fileName}`, 'success');
    } catch (err: any) {
      showNotification(`Error al generar Manual PDF: ${err?.message || 'Error desconocido'}`, 'error');
    } finally {
      setIsExportingManual(false);
    }
  };

  const handleAutoPopulateMetadata = () => {
    const generated = autoGenerateManualMetadataFromGraph({
      ...currentProject,
      documentControl: {
        ...currentProject.documentControl,
        manualMetadata: {} // Force fresh generation from current graph
      }
    });
    updateDocumentControl({ manualMetadata: generated });
    showNotification('✨ Ficha Complementaria autocompletada automáticamente a partir de lo graficado', 'success');
  };

  const updateMetaField = (patch: Partial<typeof enrichedMeta>) => {
    updateDocumentControl({
      manualMetadata: {
        ...enrichedMeta,
        ...patch
      }
    });
  };

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
        {/* Sub-Tabs */}
        <div className="flex items-center space-x-1 bg-theme-surface-subtle p-1 rounded-xl border border-theme-border">
          <button
            onClick={() => setActiveTab('DOCUMENT')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'DOCUMENT'
                ? 'bg-theme-surface text-theme-accent shadow-sm border border-theme-border font-bold'
                : 'text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Vista Previa del Manual</span>
          </button>

          <button
            onClick={() => setActiveTab('ENRICHED_FORM')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'ENRICHED_FORM'
                ? 'bg-theme-surface text-emerald-400 shadow-sm border border-emerald-500/30 font-bold'
                : 'text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Datos Complementarios & Firmas</span>
          </button>

          <button
            onClick={() => setActiveTab('DIAGRAM')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'DIAGRAM'
                ? 'bg-theme-surface text-theme-accent shadow-sm border border-theme-border font-bold'
                : 'text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Láminas Gráficas del Mapa</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          {activeTab === 'DOCUMENT' && (
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border text-theme-text rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-theme-text-muted" />
              <span>Imprimir Vista</span>
            </button>
          )}

          <button
            onClick={handleDownloadFullManualPdf}
            disabled={isExportingManual}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-transform active:scale-95 cursor-pointer disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            <span>
              {isExportingManual
                ? 'Compilando Manual PDF...'
                : 'Descargar Manual Estandarizado PDF (ISO 9001)'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'DIAGRAM' ? (
        <ProcessDiagramPrintView />
      ) : activeTab === 'ENRICHED_FORM' ? (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Banner de Automatización */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-500/15 via-emerald-500/10 to-theme-surface border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-sky-400 font-mono text-xs font-bold uppercase">
                  <Sparkles className="w-4 h-4" />
                  <span>Automatización Documental ISO 9001</span>
                </div>
                <h2 className="text-base font-extrabold text-theme-text mt-1">
                  Sección de Información Complementaria y Gobernanza del Manual PDF
                </h2>
                <p className="text-xs text-theme-text-muted mt-0.5">
                  Completa o ajusta aquí las políticas, alcance detallado, KPIs, glosario y firmas que se incluirán automáticamente junto con todo lo graficado al descargar el Manual en PDF.
                </p>
              </div>
              <button
                onClick={handleAutoPopulateMetadata}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>✨ Regenerar Automáticamente desde el Gráfico</span>
              </button>
            </div>

            {/* 1. Estado del Ciclo de Vida y Vigencia */}
            <div className="p-5 rounded-2xl bg-theme-surface border border-theme-border space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-theme-accent">
                1. Ciclo de Vida Documental y Cuadro de Firmas Oficiales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-theme-text-muted mb-1">ESTADO DE APROBACIÓN</label>
                  <select
                    value={currentProject.documentControl.status}
                    onChange={(e) =>
                      updateDocumentControl({
                        status: e.target.value as 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'EFFECTIVE'
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs font-bold text-theme-text"
                  >
                    <option value="DRAFT">📝 BORRADOR (DRAFT)</option>
                    <option value="IN_REVIEW">🔍 EN REVISIÓN TÉCNICA</option>
                    <option value="APPROVED">✅ APROBADO FORMALMENTE</option>
                    <option value="EFFECTIVE">🏛️ VIGENTE / PUBLICADO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-theme-text-muted mb-1">FECHA DE ENTRADA EN VIGENCIA</label>
                  <input
                    type="date"
                    value={enrichedMeta.effectiveDate || ''}
                    onChange={(e) => updateMetaField({ effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs font-mono text-theme-text"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-theme-text-muted mb-1">REVISÓ (NOMBRE Y CARGO)</label>
                  <input
                    type="text"
                    value={enrichedMeta.reviewedByName || ''}
                    onChange={(e) => updateMetaField({ reviewedByName: e.target.value })}
                    placeholder="Responsable de Revisión"
                    className="w-full px-3 py-2 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs text-theme-text"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-theme-text-muted mb-1">APROBÓ (AUTORIDAD COMPETENTE)</label>
                  <input
                    type="text"
                    value={enrichedMeta.approvedByName || ''}
                    onChange={(e) => updateMetaField({ approvedByName: e.target.value })}
                    placeholder="Director / Autoridad"
                    className="w-full px-3 py-2 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs text-theme-text"
                  />
                </div>
              </div>
            </div>

            {/* 2. Objetivo y Alcance Detallado */}
            <div className="p-5 rounded-2xl bg-theme-surface border border-theme-border space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-theme-accent">
                2. Objetivo General y Alcance Operativo Detallado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-theme-text-muted mb-1">OBJETIVO DEL PROCESO</label>
                  <textarea
                    rows={3}
                    value={currentProject.documentControl.processObjective}
                    onChange={(e) => updateDocumentControl({ processObjective: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs text-theme-text leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-theme-text-muted mb-1">ALCANCE OPERATIVO DETALLADO (INICIO, FIN Y ÁREAS)</label>
                  <textarea
                    rows={3}
                    value={enrichedMeta.detailedScope || ''}
                    onChange={(e) => updateMetaField({ detailedScope: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs text-theme-text leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* 3. Políticas de Operación y Reglas de Negocio */}
            <div className="p-5 rounded-2xl bg-theme-surface border border-theme-border space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-theme-accent">
                  3. Políticas de Operación y Reglas de Negocio (1 por línea)
                </h3>
              </div>
              <textarea
                rows={4}
                value={(enrichedMeta.operationalPolicies || []).join('\n')}
                onChange={(e) =>
                  updateMetaField({
                    operationalPolicies: e.target.value.split('\n').filter((line) => line.trim().length > 0)
                  })
                }
                placeholder="Escribe cada política o regla de negocio en una línea nueva..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs text-theme-text leading-relaxed"
              />
            </div>

            {/* 4. Indicadores Clave de Desempeño (KPIs) */}
            <div className="p-5 rounded-2xl bg-theme-surface border border-theme-border space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-theme-accent">
                  4. Indicadores de Desempeño del Proceso (KPIs)
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const nextKpis: ProcessKpiDefinition[] = [
                      ...(enrichedMeta.kpis || []),
                      {
                        id: `kpi_${Date.now()}`,
                        name: 'Nuevo Indicador Operativo',
                        formula: '(Casos cumplidos / Total de casos) x 100',
                        target: '>= 95%',
                        frequency: 'Mensual',
                        responsible: currentProject.documentControl.authorName
                      }
                    ];
                    updateMetaField({ kpis: nextKpis });
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-theme-accent/15 text-theme-accent text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar KPI</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {(enrichedMeta.kpis || []).map((kpi, idx) => (
                  <div
                    key={kpi.id || idx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-xl bg-theme-surface-subtle border border-theme-border items-center"
                  >
                    <input
                      type="text"
                      value={kpi.name}
                      onChange={(e) => {
                        const copy = [...(enrichedMeta.kpis || [])];
                        copy[idx] = { ...kpi, name: e.target.value };
                        updateMetaField({ kpis: copy });
                      }}
                      placeholder="Nombre del KPI"
                      className="md:col-span-3 px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-xs text-theme-text font-semibold"
                    />
                    <input
                      type="text"
                      value={kpi.formula}
                      onChange={(e) => {
                        const copy = [...(enrichedMeta.kpis || [])];
                        copy[idx] = { ...kpi, formula: e.target.value };
                        updateMetaField({ kpis: copy });
                      }}
                      placeholder="Fórmula de cálculo"
                      className="md:col-span-4 px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                    <input
                      type="text"
                      value={kpi.target}
                      onChange={(e) => {
                        const copy = [...(enrichedMeta.kpis || [])];
                        copy[idx] = { ...kpi, target: e.target.value };
                        updateMetaField({ kpis: copy });
                      }}
                      placeholder="Meta"
                      className="md:col-span-2 px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-xs text-emerald-400 font-mono"
                    />
                    <input
                      type="text"
                      value={kpi.frequency}
                      onChange={(e) => {
                        const copy = [...(enrichedMeta.kpis || [])];
                        copy[idx] = { ...kpi, frequency: e.target.value };
                        updateMetaField({ kpis: copy });
                      }}
                      placeholder="Frecuencia"
                      className="md:col-span-2 px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = (enrichedMeta.kpis || []).filter((_, i) => i !== idx);
                        updateMetaField({ kpis: copy });
                      }}
                      className="md:col-span-1 p-1.5 rounded-lg text-theme-text-muted hover:text-rose-400 flex justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Glosario de Términos */}
            <div className="p-5 rounded-2xl bg-theme-surface border border-theme-border space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-theme-accent">
                  5. Glosario de Términos y Siglas
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const nextGlossary: ProcessGlossaryTerm[] = [
                      ...(enrichedMeta.glossary || []),
                      {
                        id: `gl_${Date.now()}`,
                        term: 'NUEVA SIGLA',
                        definition: 'Definición operativa del término dentro del procedimiento.'
                      }
                    ];
                    updateMetaField({ glossary: nextGlossary });
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-theme-accent/15 text-theme-accent text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Término</span>
                </button>
              </div>

              <div className="space-y-2">
                {(enrichedMeta.glossary || []).map((g, idx) => (
                  <div
                    key={g.id || idx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2.5 rounded-xl bg-theme-surface-subtle border border-theme-border items-center"
                  >
                    <input
                      type="text"
                      value={g.term}
                      onChange={(e) => {
                        const copy = [...(enrichedMeta.glossary || [])];
                        copy[idx] = { ...g, term: e.target.value };
                        updateMetaField({ glossary: copy });
                      }}
                      className="md:col-span-3 px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-xs font-bold text-theme-accent font-mono"
                    />
                    <input
                      type="text"
                      value={g.definition}
                      onChange={(e) => {
                        const copy = [...(enrichedMeta.glossary || [])];
                        copy[idx] = { ...g, definition: e.target.value };
                        updateMetaField({ glossary: copy });
                      }}
                      className="md:col-span-8 px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = (enrichedMeta.glossary || []).filter((_, i) => i !== idx);
                        updateMetaField({ glossary: copy });
                      }}
                      className="md:col-span-1 p-1.5 rounded-lg text-theme-text-muted hover:text-rose-400 flex justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
                    <span>Manual de Procedimientos &bull; BPMN 2.0 &bull; ISO 9001:2015</span>
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
                    VERSIÓN: {report.version} ({currentProject.documentControl.status})
                  </div>
                  <div className="text-[11px] font-mono text-theme-text-muted print:text-slate-600">
                    VIGENCIA: {enrichedMeta.effectiveDate || new Date(report.timestampUtc).toISOString().substring(0, 10)}
                  </div>
                </div>
              </div>

              {/* Objective & Scope */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs text-theme-text leading-relaxed print:bg-slate-50 print:border-slate-300 print:text-slate-900">
                  <span className="font-bold text-theme-accent print:text-black uppercase text-[11px] font-mono block mb-1">
                    1.1. Objetivo del Proceso:
                  </span>
                  {report.objective}
                </div>
                <div className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs text-theme-text leading-relaxed print:bg-slate-50 print:border-slate-300 print:text-slate-900">
                  <span className="font-bold text-emerald-400 print:text-black uppercase text-[11px] font-mono block mb-1">
                    1.2. Alcance Operativo Detallado:
                  </span>
                  {enrichedMeta.detailedScope}
                </div>
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
                  (Controles Mitigantes)
                </div>
              </div>
            </div>

            {/* 2.5 Políticas de Operación e Indicadores KPIs */}
            {((enrichedMeta.operationalPolicies && enrichedMeta.operationalPolicies.length > 0) ||
              (enrichedMeta.kpis && enrichedMeta.kpis.length > 0)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 page-break-avoid">
                {enrichedMeta.operationalPolicies && enrichedMeta.operationalPolicies.length > 0 && (
                  <div className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase text-theme-accent flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Políticas de Operación y Reglas de Negocio</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-theme-text list-disc list-inside leading-relaxed">
                      {enrichedMeta.operationalPolicies.map((pol, idx) => (
                        <li key={idx}>{pol}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {enrichedMeta.kpis && enrichedMeta.kpis.length > 0 && (
                  <div className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Indicadores Clave de Desempeño (KPIs)</span>
                    </h4>
                    <div className="space-y-2">
                      {enrichedMeta.kpis.map((kpi, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-theme-surface border border-theme-border text-xs">
                          <div className="flex items-center justify-between font-bold text-theme-text">
                            <span>{kpi.name}</span>
                            <span className="text-emerald-400 font-mono">{kpi.target}</span>
                          </div>
                          <div className="text-[11px] text-theme-text-muted mt-0.5">
                            Fórmula: {kpi.formula} &bull; Frecuencia: {kpi.frequency}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
                      <span>Sistema: <strong className="text-theme-accent print:text-slate-900">{lane.system || 'GDE'}</strong></span>
                    </div>
                  </div>

                  {nodes.length === 0 ? (
                    <div className="text-xs italic text-theme-text-muted py-2 text-center">
                      No hay actividades asignadas a este carril actualmente.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {nodes.map((node, nodeIdx) => {
                        const data = node.data;
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

                            <p className="text-theme-text-muted print:text-slate-800 text-xs leading-relaxed">
                              {data?.description || 'Sin descripción detallada registrada.'}
                            </p>

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
                  4. Matriz de Riesgos Operativos y Controles Mitigantes
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
                  Historial Formal de Revisiones (Control de Cambios)
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

              {/* Technical Sign-Off Block (3 Signatures) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 text-center text-xs">
                <div className="border-t border-theme-border pt-2 print:border-black">
                  <div className="font-bold text-theme-text print:text-black">{report.author}</div>
                  <div className="text-[11px] text-theme-text-muted print:text-slate-700">{enrichedMeta.preparedByRole || 'Elaboró'}</div>
                  <div className="text-[10px] text-theme-accent font-mono mt-1">ELABORACIÓN TÉCNICA</div>
                </div>
                <div className="border-t border-theme-border pt-2 print:border-black">
                  <div className="font-bold text-theme-text print:text-black">{enrichedMeta.reviewedByName || 'Coordinación de Calidad'}</div>
                  <div className="text-[11px] text-theme-text-muted print:text-slate-700">{enrichedMeta.reviewedByRole || 'Revisó'}</div>
                  <div className="text-[10px] text-amber-400 font-mono mt-1">REVISIÓN DE CALIDAD ISO 9001</div>
                </div>
                <div className="border-t border-theme-border pt-2 print:border-black">
                  <div className="font-bold text-theme-text print:text-black">{enrichedMeta.approvedByName || 'Dirección General'}</div>
                  <div className="text-[11px] text-theme-text-muted print:text-slate-700">{enrichedMeta.approvedByRole || report.organizationUnit}</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-1">APROBACIÓN Y VIGENCIA</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
