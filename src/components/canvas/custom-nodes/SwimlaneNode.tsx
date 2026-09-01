import React, { memo, useState } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { hexToRgba } from '../../../types/theme';
import { useCanvasStore } from '../../../store/useCanvasStore';
import { Layers, Server, UserCheck, Edit2, Check, Palette, X } from 'lucide-react';

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

export const SwimlaneNode = memo(({ id, data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;
  const { updateNodeData } = useCanvasStore();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: nodeData.title || 'Carril Operativo / Funcional',
    roleName: nodeData.roleName || 'Responsable de Área',
    itSystem: nodeData.itSystem || 'Sistema Informático',
    colorHex: nodeData.customBorderColor || '#38bdf8'
  });

  const opacity = nodeData.customBgOpacity ?? 15;
  const customBg = nodeData.customBgColor
    ? hexToRgba(nodeData.customBgColor, opacity)
    : 'rgba(128, 128, 128, 0.04)';

  const accentColor = nodeData.customBorderColor || formData.colorHex || '#38bdf8';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateNodeData(id, {
      title: formData.title.trim() || 'Carril Funcional',
      roleName: formData.roleName.trim() || 'Responsable de Área',
      itSystem: formData.itSystem.trim() || 'Sistema Informático',
      customBorderColor: formData.colorHex
    });
    setIsEditing(false);
  };

  return (
    <div
      style={{
        backgroundColor: customBg,
        borderColor: accentColor
      }}
      className={`group relative w-full h-full min-w-[500px] min-h-[120px] rounded-xl border-2 transition-all duration-150 shadow-sm flex ${
        selected ? '!ring-4 !ring-sky-400/40 !border-sky-400 shadow-xl' : 'hover:border-sky-400/60'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={450}
        minHeight={100}
        handleClassName="!w-3.5 !h-3.5 !bg-sky-400 !border-2 !border-slate-900 !rounded-full shadow-lg hover:scale-125 transition-transform z-50 cursor-nwse-resize"
        lineClassName="!border-2 !border-sky-400 !border-dashed"
      />

      {/* Left Banner Header */}
      <div
        className="w-64 shrink-0 border-r border-theme-border/80 p-3.5 flex flex-col justify-between bg-theme-surface/95 backdrop-blur-md rounded-l-lg transition-colors shadow-sm relative z-10"
        style={{
          borderLeft: `6px solid ${accentColor}`
        }}
      >
        {/* Top: Order & Edit Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded text-white shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              {nodeData.standardId || 'LANE'}
            </span>
            <span className="text-[10px] text-theme-text-muted font-mono uppercase tracking-wider">
              Carril
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFormData({
                title: nodeData.title || 'Carril Operativo',
                roleName: nodeData.roleName || 'Responsable de Área',
                itSystem: nodeData.itSystem || 'Sistema Informático',
                colorHex: accentColor
              });
              setIsEditing(true);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="nodrag nopan p-1 rounded text-theme-text-muted hover:text-sky-400 hover:bg-theme-surface transition-colors cursor-pointer"
            title="Editar atributos del carril"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Middle: Lane Title */}
        <div className="my-1.5">
          <h3
            className="text-xs font-bold text-theme-text line-clamp-2 leading-tight cursor-pointer hover:text-theme-accent transition-colors"
            onClick={() => setIsEditing(true)}
            title="Clic para editar"
          >
            {nodeData.title || 'Carril Operativo / Funcional'}
          </h3>
          <div className="flex items-center text-[10px] text-theme-text-muted mt-1 truncate">
            <UserCheck className="w-3 h-3 mr-1 text-theme-text-muted shrink-0" />
            <span className="truncate">{nodeData.roleName || 'Responsable de Área'}</span>
          </div>
        </div>

        {/* Bottom: IT System tag */}
        <div className="flex items-center text-[9px] font-mono text-theme-accent bg-theme-surface-subtle px-2 py-0.5 rounded border border-theme-border truncate">
          <Server className="w-2.5 h-2.5 mr-1 shrink-0" />
          <span className="truncate">{nodeData.itSystem || 'Sistema Informático'}</span>
        </div>
      </div>

      {/* Right Area: Grid Background that auto-scales with node size */}
      <div className="flex-1 relative overflow-hidden rounded-r-lg pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--theme-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--theme-border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      </div>

      {/* Edit Lane Modal Overlay */}
      {isEditing && (
        <div
          className="nodrag nopan pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setIsEditing(false)}
        >
          <div
            className="w-full max-w-md bg-theme-surface border border-theme-border rounded-xl shadow-2xl p-5 text-theme-text animate-in fade-in zoom-in duration-150 relative z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme-border">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-theme-text">Editar Carril Funcional (Swimlane)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-md text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle cursor-pointer"
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
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
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
                  value={formData.itSystem}
                  onChange={(e) => setFormData({ ...formData, itSystem: e.target.value })}
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
                      className={`flex items-center space-x-1.5 p-1.5 rounded-lg border text-[11px] transition-all cursor-pointer ${
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
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg border border-theme-border text-xs font-medium text-theme-text-muted hover:bg-theme-surface-subtle transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

SwimlaneNode.displayName = 'SwimlaneNode';
