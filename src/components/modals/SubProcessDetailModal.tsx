import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useUiStore } from '../../store/useUiStore';
import { SubProcessStep } from '../../types/process';
import {
  X,
  Layers,
  Plus,
  Trash2,
  Focus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Server,
  UserCheck,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  FolderOpen
} from 'lucide-react';

interface SubProcessDetailModalProps {
  nodeId: string | null;
  onClose: () => void;
  onFocusNode?: (nodeId: string) => void;
}

export const SubProcessDetailModal: React.FC<SubProcessDetailModalProps> = ({
  nodeId,
  onClose,
  onFocusNode
}) => {
  const { currentProject } = useProjectStore();
  const { updateNodeData, decompressSubProcess } = useCanvasStore();
  const { showNotification } = useUiStore();

  const subProcessNode = currentProject?.nodes.find((n) => n.id === nodeId);

  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepRole, setNewStepRole] = useState(subProcessNode?.data.roleName || '');
  const [newStepSystem, setNewStepSystem] = useState(subProcessNode?.data.itSystem || '');
  const [newStepDuration, setNewStepDuration] = useState('1 Día Hábil');

  if (!nodeId || !subProcessNode) return null;

  const steps: SubProcessStep[] = subProcessNode.data.subProcessSteps || [];

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;

    const newStep: SubProcessStep = {
      id: `step-${Date.now()}`,
      stepNumber: steps.length + 1,
      title: newStepTitle.trim(),
      role: newStepRole || subProcessNode.data.roleName || 'Operador',
      system: newStepSystem || subProcessNode.data.itSystem || 'Sistema TI',
      duration: newStepDuration || '1 Día Hábil',
      inputs: [],
      outputs: []
    };

    const nextSteps = [...steps, newStep];
    updateNodeData(nodeId, { subProcessSteps: nextSteps });
    setNewStepTitle('');
    showNotification(`Etapa interna "${newStep.title}" agregada al subproceso`, 'success');
  };

  const handleDeleteStep = (stepId: string) => {
    const nextSteps = steps
      .filter((s) => s.id !== stepId)
      .map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    updateNodeData(nodeId, { subProcessSteps: nextSteps });
    showNotification('Etapa interna eliminada', 'info');
  };

  const handleFocus = () => {
    if (onFocusNode) {
      onFocusNode(nodeId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-gradient-to-r from-theme-surface-subtle to-theme-surface">
          <div>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-theme-text-muted mb-1">
              <span className="text-theme-accent font-semibold">{currentProject?.documentControl.documentCode || 'MACRO'}</span>
              <span>&gt;</span>
              <span className="text-[#3B82F6] font-bold">Subproceso: {subProcessNode.data.standardId}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-theme-text flex items-center space-x-2">
                  <span>{subProcessNode.data.title}</span>
                  <span className="text-xs font-mono font-normal bg-[#3B82F6]/20 text-[#3B82F6] px-2 py-0.5 rounded-md border border-[#3B82F6]/30">
                    {subProcessNode.data.standardId}
                  </span>
                </h2>
                <p className="text-xs text-theme-text-muted mt-0.5 line-clamp-1">
                  {subProcessNode.data.description || 'Detalle procedimental expandido'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleFocus}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-surface-subtle hover:bg-theme-surface text-theme-accent border border-theme-border text-xs font-semibold transition-colors"
              title="Centrar y enfocar en el lienzo BPMN"
            >
              <Focus className="w-3.5 h-3.5" />
              <span>Enfocar en Lienzo</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-theme-surface-subtle hover:bg-theme-surface-hover text-theme-text-muted hover:text-theme-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-theme-surface-subtle p-4 rounded-xl border border-theme-border text-xs">
            <div>
              <span className="text-[10px] text-theme-text-muted font-mono block">CARRILE / UNIDAD</span>
              <span className="font-bold text-theme-text truncate block mt-0.5">
                {subProcessNode.data.laneName || 'No asignado'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-theme-text-muted font-mono block">ROL RESPONSABLE</span>
              <span className="font-bold text-theme-text truncate block mt-0.5">
                {subProcessNode.data.roleName || 'Operador'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-theme-text-muted font-mono block">SISTEMA TI</span>
              <span className="font-bold text-theme-accent truncate block mt-0.5 font-mono">
                {subProcessNode.data.itSystem || 'Gestión'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-theme-text-muted font-mono block">MARCO LEGAL</span>
              <span className="font-bold text-theme-text truncate block mt-0.5">
                {subProcessNode.data.legalFramework || 'Norma general'}
              </span>
            </div>
          </div>

          {/* Detailed Internal Steps Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-theme-text flex items-center space-x-2">
                <span>Flujo de Tareas Internas del Subproceso</span>
                <span className="text-xs font-mono font-semibold bg-theme-surface-subtle px-2 py-0.5 rounded text-[#3B82F6] border border-theme-border">
                  {steps.length} etapas
                </span>
              </h3>
            </div>

            {steps.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-theme-border bg-theme-surface-subtle/30 text-theme-text-muted text-xs space-y-2">
                <p>Este subproceso aún no tiene etapas internas desglosadas.</p>
                <p className="text-[11px]">Utilice el formulario inferior para agregar el paso a paso detallado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border hover:border-[#3B82F6]/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                        {step.stepNumber}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="font-bold text-xs text-theme-text flex items-center space-x-2">
                          <span>{step.title}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-theme-text-muted font-mono">
                          <span className="flex items-center">
                            <UserCheck className="w-3 h-3 mr-1 text-theme-text-muted" />
                            {step.role}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center text-theme-accent">
                            <Server className="w-3 h-3 mr-1" />
                            {step.system}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center text-[#F59E0B]">
                            <Clock className="w-3 h-3 mr-1" />
                            {step.duration}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      className="p-1.5 rounded-lg text-theme-text-muted hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors self-end md:self-center"
                      title="Eliminar esta etapa interna"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form to Add New Internal Step */}
          <form
            onSubmit={handleAddStep}
            className="p-4 rounded-xl bg-theme-surface border border-theme-border shadow-md space-y-3"
          >
            <h4 className="text-xs font-bold text-theme-text flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Agregar Nueva Etapa Interna al Subproceso</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="text-[10px] font-mono text-theme-text-muted block mb-1">
                  Nombre de la Tarea / Acción
                </label>
                <input
                  type="text"
                  placeholder="ej: Validar comprobante de pago en caja..."
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-theme-surface-subtle border border-theme-border rounded-lg text-xs text-theme-text placeholder-theme-text-muted outline-none focus:border-theme-accent"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-theme-text-muted block mb-1">
                  Rol Ejecutor
                </label>
                <input
                  type="text"
                  placeholder="ej: Cajero / Inspector"
                  value={newStepRole}
                  onChange={(e) => setNewStepRole(e.target.value)}
                  className="w-full px-3 py-1.5 bg-theme-surface-subtle border border-theme-border rounded-lg text-xs text-theme-text placeholder-theme-text-muted outline-none focus:border-theme-accent"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-theme-text-muted block mb-1">
                  Plazo / Duración
                </label>
                <input
                  type="text"
                  placeholder="ej: 1 Día Hábil / 4h"
                  value={newStepDuration}
                  onChange={(e) => setNewStepDuration(e.target.value)}
                  className="w-full px-3 py-1.5 bg-theme-surface-subtle border border-theme-border rounded-lg text-xs text-theme-text placeholder-theme-text-muted outline-none focus:border-theme-accent"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md transition-all hover:scale-[1.02]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Etapa</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-theme-border bg-theme-surface-subtle flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            {steps.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Desea descomprimir "${subProcessNode.data.title}" y desplegar sus ${steps.length} etapas individuales en el lienzo?`)) {
                    const result = decompressSubProcess(nodeId);
                    if (result.success) {
                      showNotification('Subproceso descomprimido en el lienzo', 'success');
                      onClose();
                    } else {
                      showNotification(result.error || 'Error al descomprimir', 'error');
                    }
                  }
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all"
                title="Descomprimir y desplegar actividades en el lienzo"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Descomprimir en el Lienzo</span>
              </button>
            )}
            <span className="text-[11px] text-theme-text-muted font-mono hidden sm:inline">
              Subproceso BPMN 2.0 (ISO 19510)
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-theme-surface hover:bg-theme-surface-hover text-theme-text border border-theme-border rounded-lg font-semibold transition-colors"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
