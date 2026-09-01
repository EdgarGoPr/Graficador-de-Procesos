import React, { useState } from 'react';
import { PoolDefinition, LaneDefinition } from '../../types/process';
import { useCanvasStore } from '../../store/useCanvasStore';
import {
  Layers,
  Server,
  UserCheck,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  Plus,
  X,
  Check,
  Palette
} from 'lucide-react';

interface SwimlaneBackgroundProps {
  pools: PoolDefinition[];
  laneHeight?: number;
  totalWidth?: number;
}

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

export const SwimlaneBackground: React.FC<SwimlaneBackgroundProps> = ({
  pools,
  laneHeight = 140,
  totalWidth = 2600
}) => {
  const { addLane, updateLane, moveLane, deleteLane } = useCanvasStore();

  const [editingLane, setEditingLane] = useState<LaneDefinition | null>(null);
  const [isCreatingLane, setIsCreatingLane] = useState(false);
  const [activePoolId, setActivePoolId] = useState<string>('');

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    system: '',
    colorHex: '#38bdf8'
  });

  const handleOpenEdit = (lane: LaneDefinition) => {
    setEditingLane(lane);
    setIsCreatingLane(false);
    setFormData({
      name: lane.name,
      role: lane.role,
      system: lane.system,
      colorHex: lane.colorHex || '#38bdf8'
    });
  };

  const handleOpenCreate = (poolId: string) => {
    setActivePoolId(poolId);
    setEditingLane(null);
    setIsCreatingLane(true);
    setFormData({
      name: '',
      role: '',
      system: '',
      colorHex: '#38bdf8'
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLane) {
      updateLane(editingLane.id, {
        name: formData.name.trim() || editingLane.name,
        role: formData.role.trim() || editingLane.role,
        system: formData.system.trim() || editingLane.system,
        colorHex: formData.colorHex
      });
      setEditingLane(null);
    } else if (isCreatingLane && activePoolId) {
      addLane(
        activePoolId,
        formData.name.trim() || 'Nuevo Carril',
        formData.role.trim() || 'Responsable de Área',
        formData.system.trim() || 'Sistema Informático',
        formData.colorHex
      );
      setIsCreatingLane(false);
    }
  };

  const handleDelete = (lane: LaneDefinition, totalLanes: number) => {
    if (totalLanes <= 1) {
      alert('El proceso debe conservar al menos un carril operativo.');
      return;
    }
    if (window.confirm(`¿Desea eliminar el carril "${lane.name}"? Los nodos que contenga serán reasignados al carril adyacente.`)) {
      deleteLane(lane.id);
    }
  };

  if (!pools || pools.length === 0) return null;

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none select-none z-0 transition-colors"
      style={{ width: `${totalWidth}px` }}
    >
      {pools.map((pool) => {
        return (
          <div key={pool.id} className="relative mb-8">
            {/* Pool Header Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-theme-surface border-b border-theme-border text-theme-text shadow-md pointer-events-auto">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-theme-accent shrink-0" />
                <span className="font-bold text-sm tracking-wide text-theme-accent">
                  {pool.name}
                </span>
                <span className="text-xs text-theme-text-muted font-mono">
                  [{pool.organization}]
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-theme-surface-subtle text-theme-text-muted border border-theme-border">
                  {pool.lanes.length} {pool.lanes.length === 1 ? 'Carril' : 'Carriles'}
                </span>
              </div>

              {/* Add Lane Button on Pool Header */}
              <button
                onClick={() => handleOpenCreate(pool.id)}
                className="flex items-center space-x-1 px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-md text-xs font-semibold transition-all shadow-sm hover:scale-[1.02] active:scale-95"
                title="Agregar nuevo carril funcional"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Carril</span>
              </button>
            </div>

            {/* Swimlanes */}
            {pool.lanes.map((lane, idx) => {
              const isEven = idx % 2 === 0;
              const isFirst = idx === 0;
              const isLast = idx === pool.lanes.length - 1;

              return (
                <div
                  key={lane.id}
                  style={{
                    height: `${laneHeight}px`,
                    width: '100%',
                    backgroundColor: isEven ? 'transparent' : 'rgba(128, 128, 128, 0.04)'
                  }}
                  className="relative flex border-b border-r border-theme-border/60 transition-colors"
                >
                  {/* Lane Header Banner (Left Side) */}
                  <div
                    className="w-64 shrink-0 border-r border-theme-border/80 p-2.5 flex flex-col justify-between bg-theme-surface/95 backdrop-blur-md transition-colors shadow-sm pointer-events-auto z-10"
                    style={{
                      borderLeft: `5px solid ${lane.colorHex || '#38bdf8'}`
                    }}
                  >
                    {/* Top Row: Order Badge & Action Toolbar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-white shadow-sm"
                          style={{ backgroundColor: lane.colorHex || '#38bdf8' }}
                        >
                          #{idx + 1}
                        </span>
                        <span className="text-[10px] text-theme-text-muted font-mono uppercase truncate max-w-[90px]">
                          Carril
                        </span>
                      </div>

                      {/* Lane Actions: Up, Down, Edit, Delete */}
                      <div className="flex items-center space-x-1 bg-theme-surface-subtle p-0.5 rounded border border-theme-border">
                        <button
                          onClick={() => moveLane(lane.id, 'up')}
                          disabled={isFirst}
                          className={`p-1 rounded transition-colors ${
                            isFirst ? 'text-theme-text-muted/30 cursor-not-allowed' : 'text-theme-text-muted hover:text-sky-400 hover:bg-theme-surface'
                          }`}
                          title="Mover carril hacia arriba"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveLane(lane.id, 'down')}
                          disabled={isLast}
                          className={`p-1 rounded transition-colors ${
                            isLast ? 'text-theme-text-muted/30 cursor-not-allowed' : 'text-theme-text-muted hover:text-sky-400 hover:bg-theme-surface'
                          }`}
                          title="Mover carril hacia abajo"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(lane)}
                          className="p-1 rounded text-theme-text-muted hover:text-amber-400 hover:bg-theme-surface transition-colors"
                          title="Editar nombre, rol o sistema del carril"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(lane, pool.lanes.length)}
                          disabled={pool.lanes.length <= 1}
                          className={`p-1 rounded transition-colors ${
                            pool.lanes.length <= 1 ? 'text-theme-text-muted/30 cursor-not-allowed' : 'text-theme-text-muted hover:text-rose-400 hover:bg-theme-surface'
                          }`}
                          title="Eliminar carril"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Lane Title */}
                    <div>
                      <div
                        className="text-xs font-bold text-theme-text line-clamp-2 leading-tight cursor-pointer hover:text-theme-accent transition-colors"
                        onClick={() => handleOpenEdit(lane)}
                        title="Clic para editar carril"
                      >
                        {lane.name}
                      </div>
                      <div className="flex items-center text-[10px] text-theme-text-muted mt-1 truncate">
                        <UserCheck className="w-3 h-3 mr-1 text-theme-text-muted shrink-0" />
                        <span className="truncate">{lane.role}</span>
                      </div>
                    </div>

                    {/* Bottom: IT System tag */}
                    <div className="flex items-center text-[9px] font-mono text-theme-accent bg-theme-surface-subtle px-1.5 py-0.5 rounded border border-theme-border truncate">
                      <Server className="w-2.5 h-2.5 mr-1 shrink-0" />
                      <span className="truncate">{lane.system}</span>
                    </div>
                  </div>

                  {/* Lane Body Grid area */}
                  <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--theme-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--theme-border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-15" />
                  </div>
                </div>
              );
            })}

            {/* Bottom Add Lane Bar */}
            <div className="w-64 p-2 bg-theme-surface/70 border-r border-b border-theme-border/60 pointer-events-auto">
              <button
                onClick={() => handleOpenCreate(pool.id)}
                className="w-full py-1.5 flex items-center justify-center space-x-1.5 rounded-lg border border-dashed border-theme-border hover:border-sky-400 hover:bg-sky-500/10 text-theme-text-muted hover:text-sky-400 text-xs font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Carril</span>
              </button>
            </div>
          </div>
        );
      })}

      {/* Edit / Create Lane Modal */}
      {(editingLane || isCreatingLane) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-md bg-theme-surface border border-theme-border rounded-xl shadow-2xl p-5 text-theme-text animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-theme-text">
                  {editingLane ? 'Editar Carril (Swimlane)' : 'Nuevo Carril Operativo'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingLane(null);
                  setIsCreatingLane(false);
                }}
                className="p-1 rounded-md text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                  Nombre del Carril / Unidad Funcional:
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Mesa de Entradas / Inspectoría"
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-theme-canvas border border-theme-border text-sm text-theme-text focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                  Rol o Cargo Responsable:
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Ej: Inspector / Oficial Notificador"
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-theme-canvas border border-theme-border text-sm text-theme-text focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                  Sistema Informático TI Asociado:
                </label>
                <input
                  type="text"
                  value={formData.system}
                  onChange={(e) => setFormData({ ...formData, system: e.target.value })}
                  placeholder="Ej: SAM / VUPRA / GDE / SIGEF"
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-theme-canvas border border-theme-border text-sm text-theme-text focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-text-muted mb-1.5 flex items-center space-x-1">
                  <Palette className="w-3 h-3 text-sky-400 mr-1" />
                  <span>Color de Acento del Carril:</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, colorHex: color.hex })}
                      className={`flex items-center space-x-1.5 p-1.5 rounded-lg border text-[11px] transition-all ${
                        formData.colorHex === color.hex
                          ? 'border-sky-400 bg-theme-surface-subtle font-bold text-sky-400 ring-1 ring-sky-400'
                          : 'border-theme-border hover:border-theme-text-muted/60 text-theme-text-muted'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="truncate">{color.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-theme-border mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingLane(null);
                    setIsCreatingLane(false);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-theme-border text-xs font-medium text-theme-text-muted hover:bg-theme-surface-subtle transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingLane ? 'Guardar Cambios' : 'Crear Carril'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
