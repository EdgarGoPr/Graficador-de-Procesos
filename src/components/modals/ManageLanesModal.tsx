import React, { useState } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useUiStore } from '../../store/useUiStore';
import { useProjectStore } from '../../store/useProjectStore';
import { LaneDefinition } from '../../types/process';
import {
  Layers,
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  ChevronUp,
  ChevronDown,
  Wrench,
  UserCheck
} from 'lucide-react';

const PRESET_COLORS = [
  { label: 'Azul Acero', hex: '#38bdf8' },
  { label: 'Índigo Real', hex: '#818cf8' },
  { label: 'Salvia Forestal', hex: '#34d399' },
  { label: 'Ámbar Cálido', hex: '#f59e0b' },
  { label: 'Rosa Coral', hex: '#ec4899' },
  { label: 'Cian Moderno', hex: '#06b6d4' },
  { label: 'Lavanda Nebula', hex: '#a855f7' },
  { label: 'Pizarra Slate', hex: '#64748b' }
];

export const ManageLanesModal: React.FC = () => {
  const { isManageLanesModalOpen, setManageLanesModalOpen, showNotification } = useUiStore();
  const { currentProject } = useProjectStore();
  const { updateLane, moveLane, deleteLane } = useCanvasStore();

  const [isAddingLane, setIsAddingLane] = useState(false);
  const [editingLaneId, setEditingLaneId] = useState<string | null>(null);

  // New Lane form
  const [newName, setNewName] = useState('');
  const [, setNewRole] = useState('');
  const [, setNewSystem] = useState('');
  const [newColor, setNewColor] = useState('#38bdf8');

  // Edit Lane form
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSystem, setEditSystem] = useState('');
  const [editColor, setEditColor] = useState('#38bdf8');

  if (!isManageLanesModalOpen || !currentProject) return null;

  const pool = currentProject.pools[0];
  const lanes = pool?.lanes || [];

  const handleStartAdd = () => {
    setNewName('');
    setNewRole('');
    setNewSystem('');
    setNewColor(PRESET_COLORS[lanes.length % PRESET_COLORS.length].hex);
    setIsAddingLane(true);
    setEditingLaneId(null);
  };

  const handleConfirmAdd = () => {
    if (!newName.trim()) {
      showNotification('Por favor ingrese un nombre para el carril', 'error');
      return;
    }
    showNotification(`Carril "${newName}" creado correctamente`, 'success');
    setIsAddingLane(false);
    setNewName('');
    setNewRole('');
    setNewSystem('');
  };

  const handleStartEdit = (lane: LaneDefinition) => {
    setEditingLaneId(lane.id);
    setEditName(lane.name);
    setEditRole(lane.role);
    setEditSystem(lane.system || '');
    setEditColor(lane.colorHex || '#38bdf8');
    setIsAddingLane(false);
  };

  const handleConfirmEdit = (laneId: string) => {
    if (!editName.trim()) {
      showNotification('El nombre del carril no puede estar vacío', 'error');
      return;
    }
    updateLane(laneId, {
      name: editName.trim(),
      role: editRole.trim(),
      system: editSystem.trim(),
      colorHex: editColor
    });
    showNotification(`Carril actualizado exitosamente`, 'success');
    setEditingLaneId(null);
  };

  const handleDelete = (lane: LaneDefinition) => {
    if (window.confirm(`¿Desea eliminar el carril "${lane.name}"? Las actividades asociadas se reasignarán a otro carril automáticamente.`)) {
      deleteLane(lane.id);
      showNotification(`Carril "${lane.name}" eliminado`, 'info');
      if (editingLaneId === lane.id) setEditingLaneId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-theme-surface border border-theme-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-theme-accent/15 text-theme-accent border border-theme-accent/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-theme-text flex items-center gap-2">
                <span>Gestión de Carriles Organizativos (Swimlanes)</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-theme-surface border border-theme-border text-theme-accent">
                  {lanes.length} activos
                </span>
              </h3>
              <p className="text-[11px] text-theme-text-muted">
                Personalice las opciones de carriles, roles responsables y sincronización con SIPOC/RACI
              </p>
            </div>
          </div>
          <button
            onClick={() => setManageLanesModalOpen(false)}
            className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-surface border border-transparent hover:border-theme-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick Add Button or New Lane Form */}
          {!isAddingLane ? (
            <button
              onClick={handleStartAdd}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-theme-accent/40 hover:border-theme-accent bg-theme-accent/5 hover:bg-theme-accent/10 text-theme-accent text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Carril Organizativo (Swimlane)</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl border border-theme-accent/40 bg-theme-surface-subtle space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-theme-accent flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Carril Organizativo</span>
                </span>
                <button
                  onClick={() => setIsAddingLane(false)}
                  className="text-theme-text-muted hover:text-theme-text p-1 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted font-mono block mb-1">
                    Título del Carril / Área *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Título del carril u organización"
                    className="w-full bg-theme-surface border border-theme-border rounded-lg px-2.5 py-1.5 text-theme-text text-xs focus:border-theme-accent outline-none font-medium"
                    autoFocus
                  />
                </div>
              </div>

              {/* Color Swatches */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted font-mono block mb-1.5">
                  Color Identificador
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewColor(c.hex)}
                      title={c.label}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        newColor === c.hex ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  <div className="flex items-center gap-1.5 ml-2 border border-theme-border rounded-lg px-2 py-1 bg-theme-surface">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-4 h-4 bg-transparent border-0 cursor-pointer rounded"
                    />
                    <span className="text-[10px] font-mono text-theme-text-muted uppercase">
                      {newColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-theme-border">
                <button
                  type="button"
                  onClick={() => setIsAddingLane(false)}
                  className="px-3 py-1.5 text-xs text-theme-text-muted hover:text-theme-text transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdd}
                  className="px-4 py-1.5 bg-theme-accent hover:brightness-110 text-slate-900 rounded-lg text-xs font-bold shadow transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Carril</span>
                </button>
              </div>
            </div>
          )}

          {/* Existing Lanes List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-theme-text-muted uppercase tracking-wider px-1">
              <span>Carriles Configurados en el Proyecto</span>
              <span>Orden y Acciones</span>
            </div>

            {lanes.map((lane, index) => {
              const isEditing = editingLaneId === lane.id;
              const laneColor = lane.colorHex || '#38bdf8';

              if (isEditing) {
                return (
                  <div
                    key={lane.id}
                    className="p-3.5 rounded-xl border border-theme-accent bg-theme-surface-subtle space-y-3 animate-fadeIn shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-theme-accent flex items-center gap-2">
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editando: {lane.name}</span>
                      </span>
                      <button
                        onClick={() => setEditingLaneId(null)}
                        className="text-theme-text-muted hover:text-theme-text p-1 text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-wider text-theme-text-muted font-mono block mb-1">
                          Título del Carril
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Título del carril u organización"
                          className="w-full bg-theme-surface border border-theme-border rounded px-2 py-1 text-theme-text text-xs focus:border-theme-accent outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-wider text-theme-text-muted font-mono block mb-1">
                          Rol Responsable
                        </label>
                        <input
                          type="text"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          placeholder="Rol o puesto responsable"
                          className="w-full bg-theme-surface border border-theme-border rounded px-2 py-1 text-theme-text text-xs focus:border-theme-accent outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-wider text-theme-text-muted font-mono block mb-1">
                          Herramienta
                        </label>
                        <input
                          type="text"
                          value={editSystem}
                          onChange={(e) => setEditSystem(e.target.value)}
                          placeholder="Herramienta de software o soporte"
                          className="w-full bg-theme-surface border border-theme-border rounded px-2 py-1 text-theme-text text-xs focus:border-theme-accent outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Color Swatches for edit */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-theme-text-muted font-mono">
                        Color:
                      </span>
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setEditColor(c.hex)}
                          title={c.label}
                          className={`w-5 h-5 rounded-full border-2 transition-transform ${
                            editColor === c.hex ? 'scale-125 border-white shadow' : 'border-transparent hover:scale-110'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-4 h-4 bg-transparent border-0 cursor-pointer rounded"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-theme-border">
                      <button
                        onClick={() => setEditingLaneId(null)}
                        className="px-2.5 py-1 text-xs text-theme-text-muted hover:text-theme-text"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleConfirmEdit(lane.id)}
                        className="px-3.5 py-1 bg-theme-accent hover:brightness-110 text-slate-900 rounded-md text-xs font-bold shadow flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aplicar Cambios</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={lane.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-theme-surface-subtle border border-theme-border hover:border-theme-border/80 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    {/* Color Bar / Indicator */}
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: laneColor }}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-theme-text">
                          {lane.name}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-theme-surface border border-theme-border text-theme-text-muted">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-theme-text-muted mt-0.5">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-theme-accent" />
                          <span>{lane.role}</span>
                        </span>
                        {lane.system && (
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <Wrench className="w-3 h-3 text-theme-text-muted" />
                            <span>{lane.system}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    {/* Move Up */}
                    <button
                      onClick={() => moveLane(lane.id, 'up')}
                      disabled={index === 0}
                      title="Mover carril arriba"
                      className="p-1 rounded text-theme-text-muted hover:text-theme-text hover:bg-theme-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    {/* Move Down */}
                    <button
                      onClick={() => moveLane(lane.id, 'down')}
                      disabled={index === lanes.length - 1}
                      title="Mover carril abajo"
                      className="p-1 rounded text-theme-text-muted hover:text-theme-text hover:bg-theme-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {/* Edit */}
                    <button
                      onClick={() => handleStartEdit(lane)}
                      title="Editar propiedades del carril"
                      className="p-1 rounded text-theme-text-muted hover:text-theme-accent hover:bg-theme-surface transition-colors ml-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(lane)}
                      disabled={lanes.length <= 1}
                      title={lanes.length <= 1 ? 'No se puede eliminar el único carril' : 'Eliminar carril'}
                      className="p-1 rounded text-theme-text-muted hover:text-[#EF4444] hover:bg-[#EF4444]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-theme-border flex items-center justify-between bg-theme-surface-subtle">
          <div className="text-[11px] text-theme-text-muted flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Los cambios se sincronizan en vivo con todas las actividades, SIPOC y RACI.</span>
          </div>
          <button
            onClick={() => setManageLanesModalOpen(false)}
            className="px-5 py-2 bg-theme-accent hover:brightness-110 text-slate-900 rounded-xl text-xs font-bold shadow transition-all"
          >
            Cerrar y Volver
          </button>
        </div>
      </div>
    </div>
  );
};
