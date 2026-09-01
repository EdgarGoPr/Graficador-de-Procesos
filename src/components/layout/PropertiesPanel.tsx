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
  FileText
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
  const { setPropertiesPanelOpen } = useUiStore();

  const [newInputText, setNewInputText] = useState('');
  const [newOutputText, setNewOutputText] = useState('');
  const [newRiskDesc, setNewRiskDesc] = useState('');
  const [newMitigation, setNewMitigation] = useState('');

  if (!currentProject) return null;

  // Render Edge Properties if an Edge is selected
  if (selectedEdgeId) {
    const edge = currentProject.edges.find((e) => e.id === selectedEdgeId);
    if (!edge) return null;

    const sourceNode = currentProject.nodes.find((n) => n.id === edge.source);
    const targetNode = currentProject.nodes.find((n) => n.id === edge.target);

    return (
      <aside className="w-80 h-full bg-slate-900/95 border-l border-slate-800 flex flex-col shrink-0 select-none overflow-y-auto">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-cyan-500/20 text-cyan-400">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100">Secuencia de Flujo</h4>
              <span className="text-[10px] font-mono text-cyan-400">Transición BPMN</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => deleteSelected()}
              title="Eliminar flujo"
              className="p-1.5 rounded hover:bg-rose-950/60 text-rose-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPropertiesPanelOpen(false)}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 text-xs">
          {/* Conexión origen -> destino */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Nodos Conectados
            </label>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-400 block">Origen:</span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {sourceNode?.data?.standardId || 'Nodo'} - {sourceNode?.data?.title || 'Inicio'}
                </span>
              </div>
              <div className="pt-1.5 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Destino:</span>
                <span className="font-mono text-blue-300 font-semibold">
                  {targetNode?.data?.standardId || 'Nodo'} - {targetNode?.data?.title || 'Destino'}
                </span>
              </div>
            </div>
          </div>

          {/* Condición de bifurcación / Etiqueta */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Condición o Etiqueta del Flujo
            </label>
            <input
              type="text"
              placeholder="ej: Admite trámite / Pago voluntario / No subsanado"
              value={edge.data?.conditionText || ''}
              onChange={(e) => updateEdgeData(edge.id, { conditionText: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-cyan-300 font-mono text-xs focus:border-cyan-500 outline-none mt-0.5"
            />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Este texto se mostrará sobre la flecha en el lienzo BPMN y se exportará en la Ficha Técnica ISO 9001.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  if (!selectedNodeId) return null;

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

  return (
    <aside className="w-80 h-full bg-slate-900/95 border-l border-slate-800 flex flex-col shrink-0 select-none overflow-y-auto">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-blue-500/20 text-blue-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100">Propiedades del Nodo</h4>
            <span className="text-[10px] font-mono text-cyan-400">{data.standardId}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => deleteSelected()}
            title="Eliminar elemento"
            className="p-1.5 rounded hover:bg-rose-950/60 text-rose-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPropertiesPanelOpen(false)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-4 text-xs">
        {/* Identificación */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Identificación y Taxonomía
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="text-[10px] text-slate-400">ID Estándar</label>
              <input
                type="text"
                value={data.standardId || ''}
                onChange={(e) => handleUpdate({ standardId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 font-mono text-cyan-300 focus:border-cyan-500 outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-slate-400">Tipo de Nodo</label>
              <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-300 font-mono text-[10px] truncate">
                {data.nodeType}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400">Título / Nombre Operativo</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-medium focus:border-blue-500 outline-none mt-0.5"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400">Descripción Procedimental</label>
            <textarea
              rows={2}
              value={data.description || ''}
              onChange={(e) => handleUpdate({ description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-blue-500 outline-none mt-0.5"
            />
          </div>
        </div>

        {/* Carril y Responsable */}
        <div className="space-y-2 pt-3 border-t border-slate-800">
          <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            <Layers className="w-3.5 h-3.5 mr-1 text-blue-400" />
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
            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200 outline-none focus:border-blue-500"
          >
            {lanes.map((lane) => (
              <option key={lane.id} value={lane.id}>
                {lane.name} ({lane.role})
              </option>
            ))}
          </select>
        </div>

        {/* Sistema TI y Normativa */}
        <div className="space-y-2 pt-3 border-t border-slate-800">
          <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            <Server className="w-3.5 h-3.5 mr-1 text-cyan-400" />
            Sistema Informático y Marco Legal
          </label>
          <div>
            <label className="text-[10px] text-slate-400">Sistema Informático / TI</label>
            <input
              type="text"
              placeholder="ej: SAM, VUPRA, Expediente Electrónico"
              value={data.itSystem || ''}
              onChange={(e) => handleUpdate({ itSystem: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-cyan-300 font-mono text-xs focus:border-cyan-500 outline-none mt-0.5"
            />
          </div>
          <div>
            <label className="flex items-center text-[10px] text-slate-400">
              <Scale className="w-3 h-3 mr-1 text-amber-400" />
              Marco Normativo / Articulado
            </label>
            <input
              type="text"
              placeholder="ej: Ord. 12.850 Art. 24 / Ley 24.449"
              value={data.legalFramework || ''}
              onChange={(e) => handleUpdate({ legalFramework: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-amber-300/90 text-xs focus:border-amber-500 outline-none mt-0.5"
            />
          </div>
        </div>

        {/* Plazos y SLA (ISO 8601) */}
        <div className="space-y-2 pt-3 border-t border-slate-800">
          <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
            Plazos y SLA (ISO 8601)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400">Duración</label>
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
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Unidad</label>
              <select
                value={data.slaDuration?.unit || TIME_UNIT_TYPES.BUSINESS_DAYS}
                onChange={(e) =>
                  handleSlaChange(
                    data.slaDuration?.value || 0,
                    e.target.value as TimeUnitType,
                    data.slaDuration?.isPeremptory || false
                  )
                }
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200 outline-none focus:border-amber-500"
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
              className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
            />
            <label htmlFor="chk-peremptory" className="text-xs text-amber-300 font-semibold cursor-pointer">
              Plazo Perentorio / Fatal
            </label>
          </div>
        </div>

        {/* Tipificación de Compuertas (Gateways) */}
        {isGateway && (
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
              <GitBranch className="w-3.5 h-3.5 mr-1" />
              Tipología de Resolución
            </label>
            <select
              value={data.gatewayResolutionType || GATEWAY_RESOLUTION_TYPES.CUSTOM}
              onChange={(e) => handleUpdate({ gatewayResolutionType: e.target.value as GatewayResolutionType })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-amber-300 outline-none focus:border-amber-500"
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
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-pink-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Gestión de Calidad (ISO 9001 - Insumos y Salidas)
          </label>

          {/* Insumos */}
          <div>
            <label className="text-[10px] text-slate-400">Insumos / Requisitos Previos</label>
            <div className="space-y-1 my-1">
              {(data.inputs || []).map((inp, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[11px] text-slate-300">
                  <span className="truncate">{inp}</span>
                  <button onClick={() => handleRemoveInput(idx)} className="text-slate-400 hover:text-rose-400 ml-1">
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
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none"
              />
              <button
                onClick={handleAddInput}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Salidas / Entregables */}
          <div>
            <label className="text-[10px] text-slate-400">Salidas / Entregables Formales</label>
            <div className="space-y-1 my-1">
              {(data.outputs || []).map((out, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[11px] text-slate-300">
                  <span className="truncate">{out}</span>
                  <button onClick={() => handleRemoveOutput(idx)} className="text-slate-400 hover:text-rose-400 ml-1">
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
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none"
              />
              <button
                onClick={handleAddOutput}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Punto de Control de Calidad (QC) */}
        {isCheckpoint && (
          <div className="space-y-2 pt-3 border-t border-slate-800 bg-pink-950/20 p-2.5 rounded-lg border border-pink-900/40">
            <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-pink-300 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Punto de Inspección ISO 9001
            </label>
            <div>
              <label className="text-[10px] text-slate-400">Criterio de Inspección</label>
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
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-pink-200 text-xs focus:border-pink-500 outline-none mt-0.5"
              />
            </div>
          </div>
        )}

        {/* Riesgos Operativos y Controles Mitigantes */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Matriz de Riesgos y Mitigaciones
          </label>

          <div className="space-y-2">
            {(data.operationalRisks || []).map((rsk, idx) => (
              <div key={idx} className="p-2 rounded bg-rose-950/20 border border-rose-900/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-rose-400">{rsk.riskId}</span>
                  <button onClick={() => handleRemoveRisk(idx)} className="text-slate-400 hover:text-rose-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-rose-200/90 font-medium leading-snug">{rsk.description}</p>
                <div className="text-[10px] text-emerald-400/90 bg-slate-950/80 p-1.5 rounded border border-emerald-900/30">
                  <span className="font-semibold text-emerald-300">Control: </span>
                  {rsk.mitigatingControl}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
            <input
              type="text"
              placeholder="Riesgo operativo identificado..."
              value={newRiskDesc}
              onChange={(e) => setNewRiskDesc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none"
            />
            <input
              type="text"
              placeholder="Control mitigante asociado..."
              value={newMitigation}
              onChange={(e) => setNewMitigation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-emerald-300 outline-none"
            />
            <button
              onClick={handleAddRisk}
              className="w-full py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded border border-rose-800/40 text-[11px] font-semibold flex items-center justify-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Registrar Riesgo y Mitigación</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
