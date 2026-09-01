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
  Compass
} from 'lucide-react';
import {
  BpmnNodeData,
  GATEWAY_RESOLUTION_TYPES,
  TIME_UNIT_TYPES,
  TimeUnitType,
  GatewayResolutionType
} from '../../types/process';
import { buildIsoDurationString } from '../../services/leadTimeCalculator';

export const PropertiesPanel: React.FC = () => {
  const { selectedNodeId, selectedEdgeId, updateNodeData, updateEdgeData, deleteSelected } = useCanvasStore();
  const { currentProject } = useProjectStore();
  const { setPropertiesPanelOpen, setActiveRightTab, openSubProcessDetail } = useUiStore();

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
          <div className="p-3.5 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-xl space-y-2">
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
              Desglose el flujo interno con tareas detalladas, roles, duraciones y sistemas subordinados.
            </p>
            <button
              onClick={() => openSubProcessDetail(node.id)}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.01]"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Ampliar y Editar Detalle Interno</span>
            </button>
          </div>
        )}
        {/* Identificación */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted font-mono">
            Identificación y Taxonomía
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="text-[10px] text-theme-text-muted">ID Estándar</label>
              <input
                type="text"
                value={data.standardId || ''}
                onChange={(e) => handleUpdate({ standardId: e.target.value })}
                className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1.5 font-mono text-theme-accent focus:border-theme-accent outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-theme-text-muted">Tipo de Nodo</label>
              <div className="bg-theme-surface-subtle border border-theme-border rounded px-2 py-1.5 text-theme-text font-mono text-[10px] truncate">
                {data.nodeType}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-theme-text-muted">Título / Nombre Operativo</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1.5 text-theme-text font-medium focus:border-[#3B82F6] outline-none mt-0.5"
            />
          </div>

          <div>
            <label className="text-[10px] text-theme-text-muted">Descripción Procedimental</label>
            <textarea
              rows={2}
              value={data.description || ''}
              onChange={(e) => handleUpdate({ description: e.target.value })}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded p-2 text-theme-text text-xs focus:border-[#3B82F6] outline-none mt-0.5"
            />
          </div>
        </div>

        {/* Carril y Responsable */}
        <div className="space-y-2 pt-3 border-t border-theme-border">
          <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-theme-text-muted font-mono">
            <Layers className="w-3.5 h-3.5 mr-1 text-[#3B82F6]" />
            Carril (Swimlane) y Rol
          </label>
          <select
            value={data.laneId || ''}
            onChange={(e) => {
              const selectedLane = lanes.find((l) => l.id === e.target.value);
              handleUpdate({
                laneId: e.target.value,
                laneName: selectedLane?.name,
                roleName: selectedLane?.role,
                itSystem: data.itSystem || selectedLane?.system
              });
            }}
            className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1.5 text-theme-text outline-none focus:border-[#3B82F6]"
          >
            {lanes.map((lane) => (
              <option key={lane.id} value={lane.id}>
                {lane.name} ({lane.role})
              </option>
            ))}
          </select>
        </div>

        {/* Sistema TI y Normativa */}
        <div className="space-y-2 pt-3 border-t border-theme-border">
          <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-theme-text-muted font-mono">
            <Server className="w-3.5 h-3.5 mr-1 text-theme-accent" />
            Sistema Informático y Marco Legal
          </label>
          <div>
            <label className="text-[10px] text-theme-text-muted">Sistema Informático / TI</label>
            <input
              type="text"
              placeholder="ej: SAM, VUPRA, Expediente Electrónico"
              value={data.itSystem || ''}
              onChange={(e) => handleUpdate({ itSystem: e.target.value })}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1.5 text-theme-accent font-mono text-xs focus:border-theme-accent outline-none mt-0.5"
            />
          </div>
          <div>
            <label className="flex items-center text-[10px] text-theme-text-muted">
              <Scale className="w-3 h-3 mr-1 text-[#F59E0B]" />
              Marco Normativo / Articulado
            </label>
            <input
              type="text"
              placeholder="ej: Ord. 12.850 Art. 24 / Ley 24.449"
              value={data.legalFramework || ''}
              onChange={(e) => handleUpdate({ legalFramework: e.target.value })}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1.5 text-[#F59E0B] text-xs focus:border-[#F59E0B] outline-none mt-0.5"
            />
          </div>
        </div>

        {/* Plazos y SLA (ISO 8601) */}
        <div className="space-y-2 pt-3 border-t border-theme-border">
          <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-theme-text-muted font-mono">
            <Clock className="w-3.5 h-3.5 mr-1 text-[#F59E0B]" />
            Plazos y SLA (ISO 8601)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-theme-text-muted">Duración</label>
              <input
                type="number"
                min="0"
                value={data.slaDuration?.value ?? 0}
                onChange={(e) =>
                  handleSlaChange(
                    parseFloat(e.target.value) || 0,
                    data.slaDuration?.unit || TIME_UNIT_TYPES.BUSINESS_DAYS,
                    data.slaDuration?.isPeremptory || false
                  )
                }
                className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1.5 text-theme-text outline-none focus:border-[#F59E0B]"
              />
            </div>
            <div>
              <label className="text-[10px] text-theme-text-muted">Unidad</label>
              <select
                value={data.slaDuration?.unit || TIME_UNIT_TYPES.BUSINESS_DAYS}
                onChange={(e) =>
                  handleSlaChange(
                    data.slaDuration?.value || 0,
                    e.target.value as TimeUnitType,
                    data.slaDuration?.isPeremptory || false
                  )
                }
                className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1.5 text-theme-text outline-none focus:border-[#F59E0B]"
              >
                <option value={TIME_UNIT_TYPES.HOURS}>Horas (PT)</option>
                <option value={TIME_UNIT_TYPES.BUSINESS_DAYS}>Días Hábiles (P)</option>
                <option value={TIME_UNIT_TYPES.CALENDAR_DAYS}>Días Corridos (P)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="chk-peremptory"
              checked={data.slaDuration?.isPeremptory || false}
              onChange={(e) =>
                handleSlaChange(
                  data.slaDuration?.value || 0,
                  data.slaDuration?.unit || TIME_UNIT_TYPES.BUSINESS_DAYS,
                  e.target.checked
                )
              }
              className="rounded bg-theme-surface-subtle border-theme-border text-[#F59E0B] focus:ring-0"
            />
            <label htmlFor="chk-peremptory" className="text-xs text-[#F59E0B] font-semibold cursor-pointer">
              Plazo Perentorio / Fatal
            </label>
          </div>
        </div>

        {/* Tipificación de Compuertas (Gateways) */}
        {isGateway && (
          <div className="space-y-2 pt-3 border-t border-theme-border">
            <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-[#F59E0B] font-mono">
              <GitBranch className="w-3.5 h-3.5 mr-1" />
              Tipología de Resolución
            </label>
            <select
              value={data.gatewayResolutionType || GATEWAY_RESOLUTION_TYPES.CUSTOM}
              onChange={(e) => handleUpdate({ gatewayResolutionType: e.target.value as GatewayResolutionType })}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded px-2 py-1.5 text-[#F59E0B] outline-none focus:border-[#F59E0B]"
            >
              <option value={GATEWAY_RESOLUTION_TYPES.SENTENCE_FINE}>Sentencia / Multa Condenatoria</option>
              <option value={GATEWAY_RESOLUTION_TYPES.VOLUNTARY_PAYMENT}>Pago Voluntario</option>
              <option value={GATEWAY_RESOLUTION_TYPES.PROBATION}>Probation / Trabajo Comunitario</option>
              <option value={GATEWAY_RESOLUTION_TYPES.DISMISSAL_ARCHIVE}>Sobreseimiento / Archivo</option>
              <option value={GATEWAY_RESOLUTION_TYPES.CUSTOM}>Bifurcación General</option>
            </select>
          </div>
        )}

        {/* ISO 9001 - Insumos (Inputs) y Entregables (Outputs) */}
        <div className="space-y-3 pt-3 border-t border-theme-border">
          <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-[#10B981] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Gestión de Calidad (ISO 9001 - Insumos y Salidas)
          </label>

          {/* Insumos */}
          <div>
            <label className="text-[10px] text-theme-text-muted">Insumos / Requisitos Previos</label>
            <div className="space-y-1 my-1">
              {(data.inputs || []).map((inp, idx) => (
                <div key={idx} className="flex items-center justify-between bg-theme-surface-subtle px-2 py-1 rounded border border-theme-border text-[11px] text-theme-text">
                  <span className="truncate">{inp}</span>
                  <button onClick={() => handleRemoveInput(idx)} className="text-theme-text-muted hover:text-[#EF4444] ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-1 mt-1">
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
                className="px-2 py-1 bg-theme-surface hover:bg-theme-surface-hover border border-theme-border rounded text-theme-text"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Salidas / Entregables */}
          <div>
            <label className="text-[10px] text-theme-text-muted">Salidas / Entregables Formales</label>
            <div className="space-y-1 my-1">
              {(data.outputs || []).map((out, idx) => (
                <div key={idx} className="flex items-center justify-between bg-theme-surface-subtle px-2 py-1 rounded border border-theme-border text-[11px] text-theme-text">
                  <span className="truncate">{out}</span>
                  <button onClick={() => handleRemoveOutput(idx)} className="text-theme-text-muted hover:text-[#EF4444] ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-1 mt-1">
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
                className="px-2 py-1 bg-theme-surface hover:bg-theme-surface-hover border border-theme-border rounded text-theme-text"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Punto de Control de Calidad (QC) */}
        {isCheckpoint && (
          <div className="space-y-2 pt-3 border-t border-theme-border bg-[#10B981]/10 p-2.5 rounded-lg border border-[#10B981]/30">
            <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-[#10B981] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Punto de Inspección ISO 9001
            </label>
            <div>
              <label className="text-[10px] text-theme-text-muted">Criterio de Inspección</label>
              <textarea
                rows={2}
                value={data.qualityCheckpoint?.inspectionCriteria || ''}
                onChange={(e) =>
                  handleUpdate({
                    qualityCheckpoint: {
                      checkpointCode: data.qualityCheckpoint?.checkpointCode || 'QC-01',
                      inspectionCriteria: e.target.value,
                      severity: data.qualityCheckpoint?.severity || 'CRITICAL',
                      sampleRatePercentage: data.qualityCheckpoint?.sampleRatePercentage ?? 100,
                      responsibleRole: data.roleName || 'Inspector',
                      evidenceRequired: data.qualityCheckpoint?.evidenceRequired || 'Acta formal'
                    }
                  })
                }
                className="w-full bg-theme-surface border border-theme-border rounded p-2 text-theme-text text-xs focus:border-[#10B981] outline-none mt-0.5"
              />
            </div>
          </div>
        )}

        {/* Riesgos Operativos y Controles Mitigantes */}
        <div className="space-y-3 pt-3 border-t border-theme-border">
          <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-[#EF4444] font-mono">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Matriz de Riesgos y Mitigaciones
          </label>

          <div className="space-y-2">
            {(data.operationalRisks || []).map((rsk, idx) => (
              <div key={idx} className="p-2 rounded bg-[#EF4444]/10 border border-[#EF4444]/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-[#EF4444]">{rsk.riskId}</span>
                  <button onClick={() => handleRemoveRisk(idx)} className="text-theme-text-muted hover:text-[#EF4444]">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-theme-text font-medium leading-snug">{rsk.description}</p>
                <div className="text-[10px] text-[#10B981] bg-theme-surface-subtle p-1.5 rounded border border-theme-border">
                  <span className="font-semibold text-[#10B981]">Control: </span>
                  {rsk.mitigatingControl}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-theme-border">
            <input
              type="text"
              placeholder="Riesgo operativo identificado..."
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

