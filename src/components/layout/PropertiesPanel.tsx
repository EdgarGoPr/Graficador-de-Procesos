import React, { useState } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import {
  X,
  Trash2,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Server,
  Scale,
  GitBranch,
  Layers,
  FileText,
  Maximize2,
  Compass,
  Palette,
  RotateCcw,
  Sparkles,
  Activity,
  FolderOpen,
  Type,
  Eye,
  Layout
} from 'lucide-react';
import {
  BpmnNodeData,
  GATEWAY_RESOLUTION_TYPES,
  TIME_UNIT_TYPES,
  TimeUnitType,
  GatewayResolutionType
} from '../../types/process';
import { CARD_THEME_PRESETS, hexToRgba } from '../../types/theme';
import { buildIsoDurationString } from '../../services/leadTimeCalculator';

const CARD_BG_SWATCHES = [
  { label: 'Original', color: '' },
  { label: 'Carbón', color: '#18181B' },
  { label: 'Pizarra', color: '#1E293B' },
  { label: 'Azul Noche', color: '#1E3A8A' },
  { label: 'Verde Salvia', color: '#162522' },
  { label: 'Ámbar Cálido', color: '#231B15' },
  { label: 'Púrpura', color: '#1A162D' },
  { label: 'Gris Perla', color: '#F1F5F9' },
  { label: 'Blanco', color: '#FFFFFF' }
];

const EDGE_COLOR_SWATCHES = [
  { label: 'Cian Acento', color: '#38BDF8' },
  { label: 'Azul Eléctrico', color: '#3B82F6' },
  { label: 'Verde Esmeralda', color: '#10B981' },
  { label: 'Ámbar Alerta', color: '#F59E0B' },
  { label: 'Rojo Peligro', color: '#EF4444' },
  { label: 'Púrpura Neón', color: '#A855F7' },
  { label: 'Gris Pizarra', color: '#64748B' },
  { label: 'Blanco Nítido', color: '#FFFFFF' }
];

export const PropertiesPanel: React.FC = () => {
  const {
    selectedNodeId,
    selectedEdgeId,
    updateNodeData,
    applyCardStyleToScope,
    updateEdgeData,
    bulkUpdateNodeColors,
    bulkUpdateEdgeColors,
    decompressSubProcess,
    deleteSelected
  } = useCanvasStore();

  const { currentProject } = useProjectStore();
  const { setPropertiesPanelOpen, setActiveRightTab, openSubProcessDetail, showNotification } = useUiStore();

  const [cardStyleScope, setCardStyleScope] = useState<'single' | 'same_type' | 'all'>('single');
  const [newInputText, setNewInputText] = useState('');
  const [newOutputText, setNewOutputText] = useState('');
  const [newRiskDesc, setNewRiskDesc] = useState('');
  const [newMitigation, setNewMitigation] = useState('');

  if (!currentProject) return null;

  // Render Empty State if nothing is selected
  if (!selectedNodeId && !selectedEdgeId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-theme-text-muted space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-theme-surface-subtle border border-theme-border flex items-center justify-center text-theme-text-muted shadow-sm">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-theme-text">Ningún elemento seleccionado</h4>
          <p className="text-[11px] text-theme-text-muted mt-1 max-w-[200px]">
            Haga clic sobre un nodo o flecha en el lienzo para ver y editar sus propiedades.
          </p>
        </div>
        <button
          onClick={() => setActiveRightTab('NAVIGATOR')}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-theme-surface-subtle hover:bg-theme-surface text-theme-accent border border-theme-border rounded-lg text-xs font-semibold transition-colors mt-2"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Ver Navegador de Procesos</span>
        </button>
      </div>
    );
  }

  // Render Edge Properties if an Edge is selected
  if (selectedEdgeId) {
    const edge = currentProject.edges.find((e) => e.id === selectedEdgeId);
    if (!edge) return null;

    const sourceNode = currentProject.nodes.find((n) => n.id === edge.source);
    const targetNode = currentProject.nodes.find((n) => n.id === edge.target);

    const currentStroke = edge.data?.strokeColor || '#38BDF8';
    const currentWidth = edge.data?.strokeWidth || 2;
    const isAnimated = edge.data?.isAnimated || false;

    return (
      <div className="flex-1 h-full bg-theme-surface flex flex-col select-none overflow-y-auto transition-colors">
        <div className="p-3 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-[#0284C7]/15 text-theme-accent">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-theme-text">Secuencia de Flujo</h4>
              <span className="text-[10px] font-mono text-theme-accent">Transición BPMN</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => deleteSelected()}
              title="Eliminar flujo"
              className="p-1.5 rounded hover:bg-[#EF4444]/15 text-[#EF4444] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 text-xs">
          {/* Conexión origen -> destino */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted font-mono">
              Nodos Conectados
            </label>
            <div className="p-2.5 rounded-lg bg-theme-surface-subtle border border-theme-border space-y-2 text-[11px]">
              <div>
                <span className="text-[10px] text-theme-text-muted block">Origen:</span>
                <span className="font-mono text-theme-accent font-semibold">
                  {sourceNode?.data?.standardId || 'Nodo'} - {sourceNode?.data?.title || 'Inicio'}
                </span>
              </div>
              <div className="pt-1.5 border-t border-theme-border">
                <span className="text-[10px] text-theme-text-muted block">Destino:</span>
                <span className="font-mono text-[#3B82F6] font-semibold">
                  {targetNode?.data?.standardId || 'Nodo'} - {targetNode?.data?.title || 'Destino'}
                </span>
              </div>
            </div>
          </div>

          {/* Condición de bifurcación / Etiqueta */}
          <div className="space-y-2 pt-3 border-t border-theme-border">
            <label className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted font-mono">
              Condición o Etiqueta del Flujo
            </label>
            <input
              type="text"
              placeholder="ej: Admite trámite / Pago voluntario / No subsanado"
              value={edge.data?.conditionText || ''}
              onChange={(e) => updateEdgeData(edge.id, { conditionText: e.target.value })}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1.5 text-theme-accent font-mono text-xs focus:border-theme-accent outline-none mt-0.5"
            />
            <p className="text-[10px] text-theme-text-muted leading-relaxed">
              Este texto se mostrará sobre la flecha en el lienzo BPMN y se exportará en la Ficha Técnica ISO 9001.
            </p>
          </div>

          {/* Personalización Cromática de la Conexión */}
          <div className="space-y-3 pt-3 border-t border-theme-border">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-theme-text font-mono flex items-center space-x-1">
                <Palette className="w-3.5 h-3.5 text-theme-accent mr-1" />
                <span>Color de la Conexión</span>
              </label>
              <button
                onClick={() => updateEdgeData(edge.id, { strokeColor: undefined, strokeWidth: 2, isAnimated: false })}
                className="text-[10px] text-theme-text-muted hover:text-theme-text flex items-center space-x-1"
                title="Restablecer color predeterminado"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Por Defecto</span>
              </button>
            </div>

            {/* Muestras rápidas de color */}
            <div className="grid grid-cols-4 gap-1.5">
              {EDGE_COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.color}
                  onClick={() => updateEdgeData(edge.id, { strokeColor: swatch.color })}
                  className={`flex items-center space-x-1 p-1.5 rounded-lg border text-[10px] transition-all ${
                    currentStroke.toLowerCase() === swatch.color.toLowerCase()
                      ? 'border-theme-accent bg-theme-surface-subtle font-bold shadow-sm'
                      : 'border-theme-border hover:border-theme-border/80 bg-theme-surface'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: swatch.color }}
                  />
                  <span className="truncate text-theme-text">{swatch.label}</span>
                </button>
              ))}
            </div>

            {/* Selector Hexadecimal de Color */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-theme-surface-subtle border border-theme-border">
              <span className="text-[11px] text-theme-text-muted">Color Libre:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={currentStroke}
                  onChange={(e) => updateEdgeData(edge.id, { strokeColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={currentStroke}
                  onChange={(e) => updateEdgeData(edge.id, { strokeColor: e.target.value })}
                  className="w-20 px-2 py-0.5 rounded bg-theme-surface border border-theme-border text-xs font-mono text-theme-text uppercase"
                />
              </div>
            </div>

            {/* Grosor de Línea y Animación */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-theme-text-muted block mb-1">Grosor:</span>
                <select
                  value={currentWidth}
                  onChange={(e) => updateEdgeData(edge.id, { strokeWidth: Number(e.target.value) })}
                  className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1 text-xs text-theme-text outline-none"
                >
                  <option value={1.5}>Fino (1.5px)</option>
                  <option value={2}>Normal (2px)</option>
                  <option value={3}>Grueso (3px)</option>
                  <option value={4}>Énfasis (4px)</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-theme-text-muted block mb-1">Flujo Animado:</span>
                <button
                  onClick={() => updateEdgeData(edge.id, { isAnimated: !isAnimated })}
                  className={`w-full py-1 px-2 rounded border text-xs font-semibold flex items-center justify-center space-x-1 transition-colors ${
                    isAnimated
                      ? 'bg-theme-accent/20 border-theme-accent text-theme-accent'
                      : 'bg-theme-surface-subtle border-theme-border text-theme-text-muted'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{isAnimated ? 'Animado' : 'Estático'}</span>
                </button>
              </div>
            </div>

            {/* Botón Masivo Grupal para Conexiones */}
            <button
              onClick={() => {
                bulkUpdateEdgeColors({
                  strokeColor: currentStroke,
                  strokeWidth: currentWidth,
                  isAnimated
                });
                showNotification('Color aplicado a todas las conexiones del proyecto', 'success');
              }}
              className="w-full py-1.5 px-2.5 rounded-lg bg-theme-surface-subtle hover:bg-theme-surface text-theme-accent border border-theme-border hover:border-theme-accent text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Aplicar a todas las conexiones</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const node = currentProject.nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const data = node.data as BpmnNodeData;
  const pool = currentProject.pools[0];
  const lanes = pool?.lanes || [];

  const handleUpdate = (updates: Partial<BpmnNodeData>) => {
    updateNodeData(node.id, updates);
  };

  const handleSlaChange = (value: number, unit: TimeUnitType, isPeremptory: boolean) => {
    const isoString = buildIsoDurationString(value, unit);
    handleUpdate({
      slaDuration: {
        value,
        unit,
        iso8601String: isoString,
        isPeremptory
      }
    });
  };

  const handleAddInput = () => {
    if (!newInputText.trim()) return;
    const current = data.inputs || [];
    handleUpdate({ inputs: [...current, newInputText.trim()] });
    setNewInputText('');
  };

  const handleRemoveInput = (idx: number) => {
    const current = [...(data.inputs || [])];
    current.splice(idx, 1);
    handleUpdate({ inputs: current });
  };

  const handleAddOutput = () => {
    if (!newOutputText.trim()) return;
    const current = data.outputs || [];
    handleUpdate({ outputs: [...current, newOutputText.trim()] });
    setNewOutputText('');
  };

  const handleRemoveOutput = (idx: number) => {
    const current = [...(data.outputs || [])];
    current.splice(idx, 1);
    handleUpdate({ outputs: current });
  };

  const handleAddRisk = () => {
    if (!newRiskDesc.trim() || !newMitigation.trim()) return;
    const currentRisks = data.operationalRisks || [];
    const newRisk = {
      riskId: `RSK-0${currentRisks.length + 1}`,
      description: newRiskDesc.trim(),
      probability: 'MEDIUM' as const,
      impact: 'HIGH' as const,
      mitigatingControl: newMitigation.trim(),
      controlType: 'PREVENTIVE' as const
    };
    handleUpdate({ operationalRisks: [...currentRisks, newRisk] });
    setNewRiskDesc('');
    setNewMitigation('');
  };

  const handleRemoveRisk = (idx: number) => {
    const currentRisks = [...(data.operationalRisks || [])];
    currentRisks.splice(idx, 1);
    handleUpdate({ operationalRisks: currentRisks });
  };

  const isGateway = data.nodeType.includes('Gateway');
  const isCheckpoint = data.nodeType === 'QualityCheckpointEvent' || !!data.qualityCheckpoint;
  const isSubProcess = data.nodeType === 'SubProcess';

  const customBg = data.customBgColor || '';
  const customBorder = data.customBorderColor || '';

  return (
    <div className="flex-1 h-full bg-theme-surface flex flex-col select-none overflow-y-auto transition-colors">
      {/* Header */}
      <div className="p-3 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-[#3B82F6]/15 text-[#3B82F6]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-theme-text">Propiedades del Nodo</h4>
            <span className="text-[10px] font-mono text-theme-accent">{data.standardId}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => deleteSelected()}
            title="Eliminar elemento"
            className="p-1.5 rounded hover:bg-[#EF4444]/15 text-[#EF4444] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-4 text-xs">
        {/* Subprocess Expansion Card if SubProcess */}
        {isSubProcess && (
          <div className="p-3.5 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B82F6] font-mono flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 mr-1" />
                <span>Subproceso Expandible</span>
              </span>
              <span className="text-[10px] text-theme-text-muted font-mono font-semibold">
                {data.subProcessSteps?.length || 0} etapas
              </span>
            </div>
            <p className="text-[11px] text-theme-text-muted leading-relaxed">
              Desglose de tareas internas y secuenciación detallada para este subproceso.
            </p>
            <div className="flex flex-col gap-1.5 pt-1">
              <button
                onClick={() => openSubProcessDetail(node.id)}
                className="w-full py-2 bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white rounded-lg font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 transition-all"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Ampliar y Editar Detalle</span>
              </button>

              {(data.subProcessSteps?.length || 0) > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm(`¿Desea descomprimir "${data.title}" y desplegar sus ${data.subProcessSteps?.length} etapas individuales en el lienzo?`)) {
                      const result = decompressSubProcess(node.id);
                      if (result.success) {
                        showNotification('Subproceso descomprimido en el lienzo', 'success');
                      } else {
                        showNotification(result.error || 'Error al descomprimir', 'error');
                      }
                    }
                  }}
                  className="w-full py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 rounded-lg font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Descomprimir en el Lienzo</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 🎨 SECCIÓN DE PERSONALIZACIÓN VISUAL Y TEMÁTICA DE LA TARJETA */}
        <div className="p-3.5 bg-theme-surface-subtle/70 border border-theme-border rounded-xl space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text font-mono flex items-center">
              <Palette className="w-3.5 h-3.5 text-theme-accent mr-1.5" />
              <span>Estilo y Temática de Tarjeta</span>
            </span>
            {(data.customBgColor || data.customBorderColor || data.customHeaderBgColor || data.customBgOpacity !== undefined) && (
              <button
                onClick={() => {
                  applyCardStyleToScope(node.id, cardStyleScope, {
                    customBgColor: undefined,
                    customBgOpacity: undefined,
                    customBorderColor: undefined,
                    customHeaderBgColor: undefined,
                    customHeaderTextColor: undefined,
                    customTextColor: undefined
                  });
                  showNotification('Estilo de tarjeta restablecido', 'info');
                }}
                className="text-[10px] text-theme-text-muted hover:text-theme-text flex items-center space-x-1"
                title="Restablecer estilos predeterminados"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer</span>
              </button>
            )}
          </div>

          {/* Selector de Orientación */}
          <div className="space-y-1 bg-theme-surface p-2 rounded-lg border border-theme-border/60">
            <span className="text-[9px] font-mono text-theme-text-muted font-bold block uppercase">
              📐 Orientación de la Tarjeta:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => applyCardStyleToScope(node.id, cardStyleScope, { orientation: 'horizontal' })}
                className={`py-1.5 px-2 rounded-md text-[10px] font-semibold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                  (data.orientation || 'horizontal') === 'horizontal'
                    ? 'bg-theme-accent text-white shadow-sm font-bold'
                    : 'bg-theme-surface-subtle text-theme-text-muted hover:text-theme-text'
                }`}
              >
                <span>↔️ Horizontal</span>
              </button>
              <button
                type="button"
                onClick={() => applyCardStyleToScope(node.id, cardStyleScope, { orientation: 'vertical' })}
                className={`py-1.5 px-2 rounded-md text-[10px] font-semibold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                  data.orientation === 'vertical'
                    ? 'bg-theme-accent text-white shadow-sm font-bold'
                    : 'bg-theme-surface-subtle text-theme-text-muted hover:text-theme-text'
                }`}
              >
                <span>↕️ Vertical</span>
              </button>
            </div>
          </div>

          {/* Selector de Ámbito / Alcance */}
          <div className="space-y-1 bg-theme-surface p-2 rounded-lg border border-theme-border/60">
            <span className="text-[9px] font-mono text-theme-text-muted font-bold block uppercase">
              Aplicar cambios en:
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setCardStyleScope('single')}
                className={`py-1 px-1 rounded-md text-[10px] font-semibold transition-all text-center truncate ${
                  cardStyleScope === 'single'
                    ? 'bg-theme-accent text-white shadow-sm'
                    : 'bg-theme-surface-subtle text-theme-text-muted hover:text-theme-text'
                }`}
                title="Afecta solo a la tarjeta seleccionada"
              >
                🎯 Esta tarjeta
              </button>
              <button
                onClick={() => setCardStyleScope('same_type')}
                className={`py-1 px-1 rounded-md text-[10px] font-semibold transition-all text-center truncate ${
                  cardStyleScope === 'same_type'
                    ? 'bg-theme-accent text-white shadow-sm'
                    : 'bg-theme-surface-subtle text-theme-text-muted hover:text-theme-text'
                }`}
                title={`Afecta a todas las tarjetas de tipo ${data.nodeType}`}
              >
                🏷️ Mismo tipo
              </button>
              <button
                onClick={() => setCardStyleScope('all')}
                className={`py-1 px-1 rounded-md text-[10px] font-semibold transition-all text-center truncate ${
                  cardStyleScope === 'all'
                    ? 'bg-theme-accent text-white shadow-sm'
                    : 'bg-theme-surface-subtle text-theme-text-muted hover:text-theme-text'
                }`}
                title="Afecta a todas las tarjetas del diagrama"
              >
                🌐 Todo el mapa
              </button>
            </div>
          </div>

          {/* Temáticas Predefinidas de Tarjeta */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-theme-text-muted font-semibold block">Temáticas de Tarjeta:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {CARD_THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    applyCardStyleToScope(node.id, cardStyleScope, {
                      customBgColor: preset.bgColor,
                      customBgOpacity: preset.bgOpacity,
                      customBorderColor: preset.borderColor,
                      customHeaderBgColor: preset.headerBgColor,
                      customHeaderTextColor: preset.headerTextColor
                    });
                    showNotification(`Temática "${preset.name}" aplicada`);
                  }}
                  className="p-1.5 rounded-lg border border-theme-border hover:border-theme-accent bg-theme-surface hover:bg-theme-surface-subtle text-left transition-all group shadow-sm"
                >
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <div
                      className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: preset.borderColor }}
                    />
                    <span className="text-[10px] font-bold text-theme-text truncate group-hover:text-theme-accent">
                      {preset.name}
                    </span>
                  </div>
                  <p className="text-[8.5px] text-theme-text-muted line-clamp-1">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Color de Fondo y Slider de Transparencia */}
          <div className="space-y-2.5 p-2.5 rounded-xl bg-theme-surface border border-theme-border">
            {/* Color de Fondo */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-theme-text-muted font-semibold">Color de Fondo:</span>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="color"
                    value={data.customBgColor || '#1E293B'}
                    onChange={(e) => applyCardStyleToScope(node.id, cardStyleScope, { customBgColor: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={data.customBgColor || ''}
                    placeholder="Predeterminado"
                    onChange={(e) => applyCardStyleToScope(node.id, cardStyleScope, { customBgColor: e.target.value })}
                    className="w-24 px-1.5 py-0.5 rounded bg-theme-surface-subtle border border-theme-border text-[10px] font-mono text-theme-text uppercase"
                  />
                </div>
              </div>

              {/* Muestras rápidas de fondo */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {CARD_BG_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.label}
                    onClick={() => applyCardStyleToScope(node.id, cardStyleScope, { customBgColor: swatch.color || undefined })}
                    className="p-0.5 rounded border border-theme-border hover:border-theme-accent text-[8px] text-center truncate bg-theme-surface-subtle transition-all"
                    style={{ backgroundColor: swatch.color || undefined }}
                  >
                    <span className="drop-shadow text-theme-text truncate block">{swatch.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Slider de Transparencia / Opacidad */}
            <div className="pt-2 border-t border-theme-border/60">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-theme-text-muted font-semibold">Opacidad / Transparencia:</span>
                <span className="font-mono font-bold text-theme-accent">{data.customBgOpacity ?? 95}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={data.customBgOpacity ?? 95}
                onChange={(e) => applyCardStyleToScope(node.id, cardStyleScope, { customBgOpacity: Number(e.target.value) })}
                className="w-full h-1.5 bg-theme-surface-subtle rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <div className="flex justify-between text-[8px] text-theme-text-muted font-mono mt-0.5">
                <span>Translúcido (10%)</span>
                <span>Sólido (100%)</span>
              </div>
            </div>

            {/* Color de Borde */}
            <div className="flex items-center justify-between pt-2 border-t border-theme-border/60">
              <span className="text-[10px] text-theme-text-muted font-semibold">Color de Borde:</span>
              <div className="flex items-center space-x-1.5">
                <input
                  type="color"
                  value={data.customBorderColor || '#38BDF8'}
                  onChange={(e) => applyCardStyleToScope(node.id, cardStyleScope, { customBorderColor: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={data.customBorderColor || ''}
                  placeholder="Predeterminado"
                  onChange={(e) => applyCardStyleToScope(node.id, cardStyleScope, { customBorderColor: e.target.value })}
                  className="w-24 px-1.5 py-0.5 rounded bg-theme-surface-subtle border border-theme-border text-[10px] font-mono text-theme-text uppercase"
                />
              </div>
            </div>

            {/* Recuadro del Título / Cabecera */}
            <div className="flex items-center justify-between pt-2 border-t border-theme-border/60">
              <span className="text-[10px] text-theme-text-muted font-semibold">Recuadro del Título:</span>
              <div className="flex items-center space-x-1.5">
                <input
                  type="color"
                  value={data.customHeaderBgColor || '#38BDF8'}
                  onChange={(e) => applyCardStyleToScope(node.id, cardStyleScope, { customHeaderBgColor: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={data.customHeaderBgColor || ''}
                  placeholder="Predeterminado"
                  onChange={(e) => applyCardStyleToScope(node.id, cardStyleScope, { customHeaderBgColor: e.target.value })}
                  className="w-24 px-1.5 py-0.5 rounded bg-theme-surface-subtle border border-theme-border text-[10px] font-mono text-theme-text uppercase"
                />
              </div>
            </div>
          </div>

          {/* Modo de Visualización (Solo Título vs Completo) */}
          <div className="space-y-1.5 p-2.5 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] text-theme-text font-semibold flex items-center">
              <Layout className="w-3.5 h-3.5 mr-1 text-theme-accent" />
              <span>Contenido Visible en Tarjeta:</span>
            </span>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                onClick={() => {
                  applyCardStyleToScope(node.id, cardStyleScope, { displayMode: 'full' });
                  showNotification('Modo detallado aplicado (Toda la información)');
                }}
                className={`py-1.5 px-2 rounded-lg border text-[10px] font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  (data.displayMode || 'full') === 'full'
                    ? 'bg-theme-accent/20 border-theme-accent text-theme-accent shadow-sm'
                    : 'bg-theme-surface-subtle border-theme-border text-theme-text-muted hover:text-theme-text'
                }`}
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>📋 Toda la info</span>
              </button>

              <button
                onClick={() => {
                  applyCardStyleToScope(node.id, cardStyleScope, { displayMode: 'title_only' });
                  showNotification('Modo compacto aplicado (Solo título)');
                }}
                className={`py-1.5 px-2 rounded-lg border text-[10px] font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  data.displayMode === 'title_only'
                    ? 'bg-theme-accent/20 border-theme-accent text-theme-accent shadow-sm'
                    : 'bg-theme-surface-subtle border-theme-border text-theme-text-muted hover:text-theme-text'
                }`}
              >
                <Type className="w-3.5 h-3.5 shrink-0" />
                <span>🏷️ Solo título</span>
              </button>
            </div>
          </div>

          {/* Tamaño de Letra / Tipografía */}
          <div className="space-y-2 p-2.5 rounded-xl bg-theme-surface border border-theme-border">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-theme-text font-semibold flex items-center">
                <Type className="w-3.5 h-3.5 mr-1 text-theme-accent" />
                <span>Tamaño de Letra:</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-theme-accent bg-theme-surface-subtle px-2 py-0.5 rounded border border-theme-border">
                {data.customFontSize ?? 12}px
              </span>
            </div>

            {/* Pastillas de tamaño rápido */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'Compacta', size: 10 },
                { label: 'Normal', size: 12 },
                { label: 'Mediana', size: 14 },
                { label: 'Grande', size: 16 }
              ].map((item) => (
                <button
                  key={item.size}
                  onClick={() => applyCardStyleToScope(node.id, cardStyleScope, { customFontSize: item.size })}
                  className={`py-1 px-1 rounded-md text-[9px] font-semibold transition-all text-center truncate border ${
                    (data.customFontSize ?? 12) === item.size
                      ? 'bg-theme-accent text-white border-theme-accent shadow-sm'
                      : 'bg-theme-surface-subtle border-theme-border text-theme-text-muted hover:text-theme-text'
                  }`}
                >
                  {item.label} ({item.size}px)
                </button>
              ))}
            </div>

            {/* Slider de ajuste fino */}
            <input
              type="range"
              min="9"
              max="20"
              step="1"
              value={data.customFontSize ?? 12}
              onChange={(e) => applyCardStyleToScope(node.id, cardStyleScope, { customFontSize: Number(e.target.value) })}
              className="w-full h-1.5 bg-theme-surface-subtle rounded-lg appearance-none cursor-pointer accent-sky-400 mt-1"
            />
            <div className="flex justify-between text-[8px] text-theme-text-muted font-mono">
              <span>9px (Mínimo)</span>
              <span>20px (Máximo)</span>
            </div>
          </div>
        </div>

        {/* Standard ID & Title */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted font-mono">
              ID Estándar
            </label>
            <input
              type="text"
              value={data.standardId || ''}
              onChange={(e) => handleUpdate({ standardId: e.target.value })}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1.5 text-theme-text font-mono text-xs focus:border-theme-accent outline-none mt-0.5"
            />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted font-mono">
              Título de la Actividad
            </label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1.5 text-theme-text text-xs focus:border-theme-accent outline-none mt-0.5 font-medium"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted font-mono">
            Descripción Detallada (ISO 9001)
          </label>
          <textarea
            rows={3}
            value={data.description || ''}
            onChange={(e) => handleUpdate({ description: e.target.value })}
            className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1.5 text-theme-text text-xs focus:border-theme-accent outline-none mt-0.5 resize-none leading-relaxed"
          />
        </div>

        {/* Carril / Swimlane Asignado */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted font-mono">
            Carril Organizativo (Swimlane)
          </label>
          <select
            value={data.laneId || ''}
            onChange={(e) => {
              const lane = lanes.find((l) => l.id === e.target.value);
              handleUpdate({
                laneId: e.target.value,
                laneName: lane?.name,
                roleName: lane?.role
              });
            }}
            className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1.5 text-theme-text text-xs focus:border-theme-accent outline-none mt-0.5"
          >
            <option value="">-- Sin Carril Asignado --</option>
            {lanes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.role})
              </option>
            ))}
          </select>
        </div>

        {/* IT System & Legal Framework */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted font-mono flex items-center space-x-1">
              <Server className="w-3 h-3 text-theme-accent mr-1" />
              <span>Sistema TI</span>
            </label>
            <input
              type="text"
              placeholder="ej: SAM, VUPRA, GDE"
              value={data.itSystem || ''}
              onChange={(e) => handleUpdate({ itSystem: e.target.value })}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1 text-theme-text text-xs focus:border-theme-accent outline-none mt-0.5 font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted font-mono flex items-center space-x-1">
              <Scale className="w-3 h-3 text-[#F59E0B] mr-1" />
              <span>Marco Legal</span>
            </label>
            <input
              type="text"
              placeholder="ej: Art. 45 Ord. 123"
              value={data.legalFramework || ''}
              onChange={(e) => handleUpdate({ legalFramework: e.target.value })}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1 text-theme-text text-xs focus:border-theme-accent outline-none mt-0.5"
            />
          </div>
        </div>

        {/* SLA Duration Configuration (ISO 8601) */}
        {!isGateway && (
          <div className="p-3 bg-theme-surface-subtle border border-theme-border rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-theme-text font-mono flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-[#F59E0B] mr-1" />
                <span>Tiempo de Ciclo / SLA (ISO 8601)</span>
              </label>
              {data.slaDuration?.iso8601String && (
                <span className="text-[10px] font-mono text-[#F59E0B] font-bold">
                  {data.slaDuration.iso8601String}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-theme-text-muted block mb-0.5">Plazo Numérico:</span>
                <input
                  type="number"
                  min="0"
                  value={data.slaDuration?.value ?? 0}
                  onChange={(e) =>
                    handleSlaChange(
                      Number(e.target.value),
                      data.slaDuration?.unit || 'BUSINESS_DAYS',
                      data.slaDuration?.isPeremptory || false
                    )
                  }
                  className="w-full bg-theme-surface border border-theme-border rounded px-2 py-1 text-xs text-theme-text font-mono outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-theme-text-muted block mb-0.5">Unidad de Cómputo:</span>
                <select
                  value={data.slaDuration?.unit || 'BUSINESS_DAYS'}
                  onChange={(e) =>
                    handleSlaChange(
                      data.slaDuration?.value ?? 0,
                      e.target.value as TimeUnitType,
                      data.slaDuration?.isPeremptory || false
                    )
                  }
                  className="w-full bg-theme-surface border border-theme-border rounded px-2 py-1 text-xs text-theme-text outline-none"
                >
                  <option value={TIME_UNIT_TYPES.BUSINESS_DAYS}>Días Hábiles</option>
                  <option value={TIME_UNIT_TYPES.CALENDAR_DAYS}>Días Corridos</option>
                  <option value={TIME_UNIT_TYPES.HOURS}>Horas Directas</option>
                </select>
              </div>
            </div>

            <label className="flex items-center space-x-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={data.slaDuration?.isPeremptory || false}
                onChange={(e) =>
                  handleSlaChange(
                    data.slaDuration?.value ?? 0,
                    data.slaDuration?.unit || 'BUSINESS_DAYS',
                    e.target.checked
                  )
                }
                className="rounded text-[#F59E0B] focus:ring-0 bg-theme-surface border-theme-border"
              />
              <span className="text-[11px] text-[#F59E0B] font-semibold">
                Plazo Perentorio / Fatal (Prescripción legal)
              </span>
            </label>
          </div>
        )}

        {/* Quality Checkpoint (ISO 9001) */}
        {isCheckpoint && (
          <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[#10B981]">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                <span>Punto de Control de Calidad (ISO 9001)</span>
              </span>
            </div>

            <div>
              <label className="text-[10px] text-theme-text-muted block">Criterio de Inspección:</label>
              <input
                type="text"
                placeholder="ej: Firma de auditor, sello de mesa de entradas..."
                value={data.qualityCheckpoint?.inspectionCriteria || ''}
                onChange={(e) =>
                  handleUpdate({
                    qualityCheckpoint: {
                      checkpointCode: data.qualityCheckpoint?.checkpointCode || data.standardId || 'QC-01',
                      inspectionCriteria: e.target.value,
                      evidenceRequired: data.qualityCheckpoint?.evidenceRequired || 'Acta / Constancia de Inspección',
                      responsibleRole: data.qualityCheckpoint?.responsibleRole || data.roleName || 'Auditor de Calidad',
                      severity: data.qualityCheckpoint?.severity || 'MAJOR',
                      sampleRatePercentage: data.qualityCheckpoint?.sampleRatePercentage ?? 100
                    }
                  })
                }
                className="w-full bg-theme-surface border border-theme-border rounded px-2 py-1 text-xs text-theme-text outline-none mt-0.5"
              />
            </div>
          </div>
        )}

        {/* Insumos & Entregables (SIPOC) */}
        <div className="space-y-3 pt-2 border-t border-theme-border">
          <label className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted font-mono block">
            Matriz SIPOC (Insumos y Entregables)
          </label>

          {/* Inputs */}
          <div>
            <span className="text-[11px] font-semibold text-theme-text block mb-1">Insumos Requeridos (Inputs):</span>
            <div className="space-y-1 mb-1.5">
              {(data.inputs || []).map((inp, idx) => (
                <div key={idx} className="flex items-center justify-between bg-theme-surface-subtle px-2 py-1 rounded text-[11px] border border-theme-border">
                  <span className="truncate">{inp}</span>
                  <button onClick={() => handleRemoveInput(idx)} className="text-red-400 hover:text-red-300 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-1">
              <input
                type="text"
                placeholder="Agregar insumo..."
                value={newInputText}
                onChange={(e) => setNewInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddInput()}
                className="flex-1 bg-theme-surface-subtle border border-theme-border rounded px-2 py-1 text-xs text-theme-text outline-none"
              />
              <button
                onClick={handleAddInput}
                className="px-2 bg-theme-surface-subtle hover:bg-theme-surface text-theme-accent border border-theme-border rounded text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Outputs */}
          <div>
            <span className="text-[11px] font-semibold text-theme-text block mb-1">Entregables Formales (Outputs):</span>
            <div className="space-y-1 mb-1.5">
              {(data.outputs || []).map((out, idx) => (
                <div key={idx} className="flex items-center justify-between bg-theme-surface-subtle px-2 py-1 rounded text-[11px] border border-theme-border">
                  <span className="truncate">{out}</span>
                  <button onClick={() => handleRemoveOutput(idx)} className="text-red-400 hover:text-red-300 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-1">
              <input
                type="text"
                placeholder="Agregar entregable..."
                value={newOutputText}
                onChange={(e) => setNewOutputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddOutput()}
                className="flex-1 bg-theme-surface-subtle border border-theme-border rounded px-2 py-1 text-xs text-theme-text outline-none"
              />
              <button
                onClick={handleAddOutput}
                className="px-2 bg-theme-surface-subtle hover:bg-theme-surface text-theme-accent border border-theme-border rounded text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Operational Risks (ISO 9001 Clause 6.1) */}
        <div className="space-y-2 pt-3 border-t border-theme-border">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#EF4444] font-mono flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            <span>Gestión de Riesgos Operativos (ISO 9001:2015)</span>
          </label>

          <div className="space-y-1.5 mb-2">
            {(data.operationalRisks || []).map((r, idx) => (
              <div key={idx} className="p-2 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#EF4444] font-bold">{r.riskId}</span>
                  <button onClick={() => handleRemoveRisk(idx)} className="text-red-400 hover:text-red-300">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-theme-text font-medium">{r.description}</div>
                <div className="text-[#10B981] text-[10px]">
                  <strong>Control:</strong> {r.mitigatingControl}
                </div>
              </div>
            ))}
          </div>

          {/* Add Risk Form */}
          <div className="space-y-1.5 p-2 bg-theme-surface-subtle border border-theme-border rounded-lg">
            <input
              type="text"
              placeholder="Descripción del riesgo operativo..."
              value={newRiskDesc}
              onChange={(e) => setNewRiskDesc(e.target.value)}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1 text-xs text-theme-text outline-none"
            />
            <input
              type="text"
              placeholder="Control mitigante asociado..."
              value={newMitigation}
              onChange={(e) => setNewMitigation(e.target.value)}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1 text-xs text-[#10B981] outline-none"
            />
            <button
              onClick={handleAddRisk}
              className="w-full py-1 bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] rounded border border-[#EF4444]/30 text-[11px] font-semibold flex items-center justify-center space-x-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Registrar Riesgo y Mitigación</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
