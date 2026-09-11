import React, { useState, useMemo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useUiStore } from '../../store/useUiStore';
import { runQualityAudit, IssueSeverity, QualityIssue } from '../../services/qualityLinter';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

interface QualityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QualityAuditModal: React.FC<QualityAuditModalProps> = ({ isOpen, onClose }) => {
  const { currentProject } = useProjectStore();
  const { selectNode } = useCanvasStore();
  const { setActiveView, setPropertiesPanelOpen, showNotification } = useUiStore();
  const [severityFilter, setSeverityFilter] = useState<'ALL' | IssueSeverity>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const report = useMemo(() => {
    if (!currentProject) return null;
    return runQualityAudit(currentProject.nodes, currentProject.edges, currentProject.pools);
  }, [currentProject]);

  if (!isOpen || !currentProject || !report) return null;

  const filteredIssues = report.issues.filter((issue) => {
    if (severityFilter !== 'ALL' && issue.severity !== severityFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.description.toLowerCase().includes(q) ||
        issue.code.toLowerCase().includes(q) ||
        (issue.nodeTitle && issue.nodeTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleFocusNode = (nodeId?: string) => {
    if (!nodeId) return;
    selectNode(nodeId);
    setActiveView('CANVAS');
    setPropertiesPanelOpen(true);
    onClose();
    showNotification(`Elemento seleccionado en el lienzo para corrección`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className="p-2.5 rounded-xl border flex items-center justify-center"
              style={{
                backgroundColor: `${report.gradeColor}15`,
                borderColor: `${report.gradeColor}40`,
                color: report.gradeColor
              }}
            >
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-theme-text">Auditor de Calidad & Normativa BPMN 2.0</h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold"
                  style={{
                    backgroundColor: `${report.gradeColor}20`,
                    color: report.gradeColor
                  }}
                >
                  Score: {report.healthScore}%
                </span>
              </div>
              <p className="text-xs text-theme-text-muted">
                {report.gradeLabel} &bull; {currentProject.documentControl.documentTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score & Summary Metrics Bar */}
        <div className="px-6 py-4 bg-theme-surface border-b border-theme-border grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border text-center">
            <div className="text-[10px] font-mono uppercase text-theme-text-muted">Puntaje Global</div>
            <div className="text-2xl font-black mt-0.5 font-mono" style={{ color: report.gradeColor }}>
              {report.healthScore}/100
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
            <div className="text-[10px] font-mono uppercase text-rose-400 font-bold">Errores Críticos</div>
            <div className="text-2xl font-black text-rose-400 mt-0.5 font-mono">
              {report.criticalCount}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">Advertencias</div>
            <div className="text-2xl font-black text-amber-400 mt-0.5 font-mono">
              {report.warningCount}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Sugerencias ISO</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5 font-mono">
              {report.suggestionCount}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-6 py-3 bg-theme-surface-subtle/50 border-b border-theme-border flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <button
              onClick={() => setSeverityFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                severityFilter === 'ALL'
                  ? 'bg-theme-surface text-theme-accent shadow-xs border border-theme-border'
                  : 'text-theme-text-muted hover:text-theme-text'
              }`}
            >
              Todos ({report.issues.length})
            </button>
            <button
              onClick={() => setSeverityFilter('CRITICAL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                severityFilter === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-400 shadow-xs border border-rose-500/40'
                  : 'text-theme-text-muted hover:text-rose-400'
              }`}
            >
              Críticos ({report.criticalCount})
            </button>
            <button
              onClick={() => setSeverityFilter('WARNING')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                severityFilter === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-400 shadow-xs border border-amber-500/40'
                  : 'text-theme-text-muted hover:text-amber-400'
              }`}
            >
              Advertencias ({report.warningCount})
            </button>
            <button
              onClick={() => setSeverityFilter('SUGGESTION')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                severityFilter === 'SUGGESTION'
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-xs border border-emerald-500/40'
                  : 'text-theme-text-muted hover:text-emerald-400'
              }`}
            >
              Sugerencias ({report.suggestionCount})
            </button>
          </div>

          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-theme-text-muted" />
            <input
              type="text"
              placeholder="Buscar hallazgo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg bg-theme-surface border border-theme-border text-theme-text focus:outline-none focus:border-theme-accent"
            />
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredIssues.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#10B981]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-theme-text">¡Sin Hallazgos en esta Categoría!</h3>
              <p className="text-xs text-theme-text-muted max-w-md">
                El diagrama cumple satisfactoriamente con los criterios de validación evaluados.
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const isCrit = issue.severity === 'CRITICAL';
              const isWarn = issue.severity === 'WARNING';

              const badgeBg = isCrit ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : isWarn ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
              const borderAccent = isCrit ? 'border-l-rose-500' : isWarn ? 'border-l-amber-500' : 'border-l-emerald-500';

              return (
                <div
                  key={issue.id}
                  className={`p-4 rounded-xl bg-theme-surface-subtle border border-theme-border border-l-4 ${borderAccent} flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-theme-surface-hover/50 transition-colors`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeBg}`}>
                        {issue.code}
                      </span>
                      <span className="text-xs font-bold text-theme-text">{issue.title}</span>
                    </div>
                    <p className="text-xs text-theme-text-muted leading-relaxed">{issue.description}</p>
                    <div className="flex items-center space-x-1 text-[11px] text-[#10B981] font-medium pt-1">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>Sugerencia: {issue.suggestion}</span>
                    </div>
                  </div>

                  {issue.nodeId && (
                    <button
                      onClick={() => handleFocusNode(issue.nodeId)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-surface hover:bg-theme-accent hover:text-white border border-theme-border text-xs font-semibold text-theme-text transition-all shrink-0 self-end sm:self-center"
                      title="Enfocar y seleccionar tarjeta en el lienzo"
                    >
                      <span>Corregir</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-theme-border bg-theme-surface-subtle flex items-center justify-between shrink-0">
          <span className="text-xs font-mono text-theme-text-muted">
            Total {report.stats.totalNodes} nodos evaluados &bull; {report.stats.totalCheckpoints} checkpoints de calidad
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-theme-surface hover:bg-theme-surface-hover text-theme-text rounded-lg text-xs font-semibold border border-theme-border transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
