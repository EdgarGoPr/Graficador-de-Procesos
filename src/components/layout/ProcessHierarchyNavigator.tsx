import React, { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useProjectStore } from '../../store/useProjectStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useUiStore } from '../../store/useUiStore';
import {
  Globe,
  Layers,
  Search,
  Focus,
  Maximize2,
  ChevronRight,
  ShieldCheck,
  Clock,
  GitFork,
  PlayCircle,
  StopCircle,
  FileCheck2,
  Filter
} from 'lucide-react';
import { BPMN_NODE_TYPES } from '../../types/process';

export const ProcessHierarchyNavigator: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { selectedNodeId, selectNode } = useCanvasStore();
  const { setPropertiesPanelOpen, openSubProcessDetail } = useUiStore();
  const { setCenter, fitView } = useReactFlow();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!currentProject) {
    return (
      <div className="p-4 text-xs text-theme-text-muted text-center">
        No hay proyecto cargado.
      </div>
    );
  }

  // Find all SubProcess nodes
  const subProcessNodes = currentProject.nodes.filter(
    (n) => n.data.nodeType === BPMN_NODE_TYPES.SUB_PROCESS
  );

  // Filtered nodes
  const filteredNodes = currentProject.nodes.filter((node) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      node.data.title.toLowerCase().includes(term) ||
      node.data.standardId.toLowerCase().includes(term) ||
      (node.data.roleName && node.data.roleName.toLowerCase().includes(term));

    if (!matchSearch) return false;

    if (filterType === 'ALL') return true;
    if (filterType === 'SUB') return node.data.nodeType === BPMN_NODE_TYPES.SUB_PROCESS;
    if (filterType === 'TASK')
      return (
        node.data.nodeType === BPMN_NODE_TYPES.USER_TASK ||
        node.data.nodeType === BPMN_NODE_TYPES.SERVICE_TASK ||
        node.data.nodeType === BPMN_NODE_TYPES.MANUAL_TASK
      );
    if (filterType === 'GATEWAY') return node.data.nodeType.includes('Gateway');
    if (filterType === 'QC') return node.data.nodeType === BPMN_NODE_TYPES.QUALITY_CHECKPOINT_EVENT;
    if (filterType === 'EVENTS')
      return (
        node.data.nodeType === BPMN_NODE_TYPES.START_EVENT ||
        node.data.nodeType === BPMN_NODE_TYPES.END_EVENT
      );

    return true;
  });

  // Focus whole Macroprocess overview
  const handleFocusMacroProcess = () => {
    fitView({ duration: 800, padding: 0.2 });
  };

  // Focus specific node
  const handleFocusNode = (nodeId: string) => {
    const targetNode = currentProject.nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    selectNode(nodeId);
    setPropertiesPanelOpen(true);

    // Zoom and center directly onto this node
    setCenter(targetNode.position.x + 100, targetNode.position.y + 40, {
      zoom: 1.3,
      duration: 800,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-theme-surface text-theme-text select-none text-xs">
      {/* Header */}
      <div className="p-4 border-b border-theme-border bg-theme-surface-subtle/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-[#0284C7] to-[#3B82F6] text-white">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-theme-text text-sm">Navegador de Procesos</h3>
            <p className="text-[10px] text-theme-text-muted font-mono">
              Jerarquía Macro &bull; Subprocesos
            </p>
          </div>
        </div>

        <button
          onClick={handleFocusMacroProcess}
          className="flex items-center space-x-1 px-2.5 py-1 bg-theme-surface hover:bg-theme-surface-hover text-theme-accent border border-theme-border rounded-lg text-[11px] font-semibold transition-colors shadow-sm"
          title="Ver todo el Macroproceso (Fit View)"
        >
          <Focus className="w-3.5 h-3.5" />
          <span>Macroproceso</span>
        </button>
      </div>

      {/* Macroproceso Card Banner */}
      <div className="p-4 border-b border-theme-border bg-theme-surface/40">
        <div
          onClick={handleFocusMacroProcess}
          className="p-3 rounded-xl bg-gradient-to-br from-theme-surface-subtle to-theme-surface border border-theme-border hover:border-theme-accent/70 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono font-bold text-theme-accent bg-theme-accent/10 px-2 py-0.5 rounded border border-theme-accent/30">
              {currentProject.documentControl.documentCode || 'MACRO-01'} &bull; v{currentProject.documentControl.version}
            </span>
            <span className="text-[9px] font-semibold text-theme-text-muted group-hover:text-theme-accent flex items-center">
              <span>Centrar vista</span>
              <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>

          <h4 className="font-bold text-xs text-theme-text leading-snug group-hover:text-theme-accent transition-colors line-clamp-2 mt-1">
            {currentProject.documentControl.documentTitle}
          </h4>

          <div className="flex items-center space-x-3 mt-2 text-[10px] text-theme-text-muted font-mono pt-2 border-t border-theme-border/60">
            <span>{currentProject.nodes.length} Nodos</span>
            <span>&bull;</span>
            <span className="text-[#3B82F6] font-semibold">{subProcessNodes.length} Subprocesos</span>
            <span>&bull;</span>
            <span>{currentProject.pools[0]?.lanes?.length || 1} Carriles</span>
          </div>
        </div>
      </div>

      {/* Subprocess Quick Section */}
      <div className="p-4 border-b border-theme-border bg-theme-surface-subtle/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 font-bold text-[11px] text-theme-text">
            <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Subprocesos ({subProcessNodes.length})</span>
          </div>
        </div>

        {subProcessNodes.length === 0 ? (
          <div className="p-3 text-center rounded-lg border border-dashed border-theme-border text-theme-text-muted text-[11px]">
            No hay subprocesos modelados aún. Arrastre un <strong>Subproceso</strong> desde la paleta.
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {subProcessNodes.map((subNode) => {
              const isSelected = selectedNodeId === subNode.id;
              const stepsCount = subNode.data.subProcessSteps?.length || 0;

              return (
                <div
                  key={subNode.id}
                  className={`p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#3B82F6]/15 border-[#3B82F6] shadow-md'
                      : 'bg-theme-surface border-theme-border hover:border-[#3B82F6]/60'
                  }`}
                >
                  <div
                    onClick={() => handleFocusNode(subNode.id)}
                    className="flex-1 cursor-pointer truncate mr-2"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-[10px] text-[#3B82F6]">
                        {subNode.data.standardId}
                      </span>
                      <span className="text-[10px] text-theme-text-muted truncate">
                        {subNode.data.laneName || 'Carril'}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-theme-text truncate hover:text-[#3B82F6] transition-colors">
                      {subNode.data.title}
                    </div>
                    <div className="text-[10px] text-theme-text-muted mt-0.5">
                      {stepsCount > 0 ? `${stepsCount} etapas internas` : 'Detalle configurable'}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleFocusNode(subNode.id)}
                      className="p-1.5 rounded-md hover:bg-theme-surface-hover text-theme-text-muted hover:text-theme-accent transition-colors"
                      title="Acercar y centrar en el lienzo"
                    >
                      <Focus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openSubProcessDetail(subNode.id)}
                      className="flex items-center space-x-1 px-2 py-1 rounded-md bg-[#3B82F6]/15 hover:bg-[#3B82F6] text-[#3B82F6] hover:text-white border border-[#3B82F6]/30 text-[10px] font-bold transition-all shadow-sm"
                      title="Ampliar y ver etapas detalladas"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Ampliar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Search and Category Filters */}
      <div className="p-3 border-b border-theme-border space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-text-muted" />
          <input
            type="text"
            placeholder="Buscar nodo, tarea o responsable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-theme-surface-subtle border border-theme-border rounded-lg text-xs text-theme-text placeholder-theme-text-muted outline-none focus:border-theme-accent"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[10px]">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'SUB', label: 'Subprocesos' },
            { id: 'TASK', label: 'Tareas' },
            { id: 'GATEWAY', label: 'Decisiones' },
            { id: 'QC', label: 'Calidad QC' },
            { id: 'EVENTS', label: 'Inicios/Fin' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                filterType === f.id
                  ? 'bg-theme-accent text-white font-bold'
                  : 'bg-theme-surface-subtle text-theme-text-muted hover:text-theme-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* All Nodes Hierarchy List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {filteredNodes.length === 0 ? (
          <div className="p-6 text-center text-theme-text-muted text-xs">
            No se encontraron elementos con los filtros aplicados.
          </div>
        ) : (
          filteredNodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const nodeType = node.data.nodeType;

            return (
              <div
                key={node.id}
                onClick={() => handleFocusNode(node.id)}
                className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'bg-theme-accent/15 border-theme-accent shadow-sm'
                    : 'bg-theme-surface border-theme-border hover:border-theme-accent/50 hover:bg-theme-surface-hover/50'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  {/* Type Icon Badge */}
                  <div className="shrink-0">
                    {nodeType === BPMN_NODE_TYPES.START_EVENT && (
                      <PlayCircle className="w-3.5 h-3.5 text-[#10B981]" />
                    )}
                    {nodeType === BPMN_NODE_TYPES.END_EVENT && (
                      <StopCircle className="w-3.5 h-3.5 text-[#EF4444]" />
                    )}
                    {(nodeType === BPMN_NODE_TYPES.USER_TASK ||
                      nodeType === BPMN_NODE_TYPES.SERVICE_TASK ||
                      nodeType === BPMN_NODE_TYPES.MANUAL_TASK) && (
                      <FileCheck2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                    )}
                    {nodeType.includes('Gateway') && (
                      <GitFork className="w-3.5 h-3.5 text-[#F59E0B]" />
                    )}
                    {nodeType === BPMN_NODE_TYPES.QUALITY_CHECKPOINT_EVENT && (
                      <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                    )}
                    {nodeType === BPMN_NODE_TYPES.TIMER_BOUNDARY_EVENT && (
                      <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                    )}
                    {nodeType === BPMN_NODE_TYPES.SUB_PROCESS && (
                      <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
                    )}
                  </div>

                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-[10px] text-theme-accent">
                        {node.data.standardId}
                      </span>
                      <span className="text-[10px] text-theme-text-muted truncate max-w-[120px]">
                        {node.data.laneName}
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-theme-text truncate group-hover:text-theme-accent transition-colors">
                      {node.data.title}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Focus className="w-3.5 h-3.5 text-theme-text-muted hover:text-theme-accent" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
