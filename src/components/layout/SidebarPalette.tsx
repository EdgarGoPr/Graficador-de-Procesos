import React from 'react';
import { BPMN_NODE_TYPES, BpmnNodeType } from '../../types/process';
import {
  Play,
  Square,
  User,
  Cpu,
  Wrench,
  X,
  Plus,
  ShieldCheck,
  Clock,
  Layers,
  HelpCircle,
  PlusCircle
} from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useProjectStore } from '../../store/useProjectStore';

interface PaletteItem {
  type: BpmnNodeType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
}

const PALETTE_GROUPS: { groupName: string; items: PaletteItem[] }[] = [
  {
    groupName: 'Eventos (ISO 19510)',
    items: [
      {
        type: BPMN_NODE_TYPES.START_EVENT,
        title: 'Start Event',
        subtitle: 'Inicio / Notificación',
        icon: Play,
        colorClass: 'text-emerald-400 border-emerald-500/40',
        bgClass: 'bg-emerald-950/30 hover:bg-emerald-900/40'
      },
      {
        type: BPMN_NODE_TYPES.END_EVENT,
        title: 'End Event',
        subtitle: 'Fin / Archivo formal',
        icon: Square,
        colorClass: 'text-rose-400 border-rose-500/40',
        bgClass: 'bg-rose-950/30 hover:bg-rose-900/40'
      }
    ]
  },
  {
    groupName: 'Tareas y Actividades',
    items: [
      {
        type: BPMN_NODE_TYPES.USER_TASK,
        title: 'User Task',
        subtitle: 'Intervención de operador',
        icon: User,
        colorClass: 'text-blue-400 border-blue-500/40',
        bgClass: 'bg-blue-950/30 hover:bg-blue-900/40'
      },
      {
        type: BPMN_NODE_TYPES.SERVICE_TASK,
        title: 'Service Task',
        subtitle: 'Servicio / Sistema TI',
        icon: Cpu,
        colorClass: 'text-purple-400 border-purple-500/40',
        bgClass: 'bg-purple-950/30 hover:bg-purple-900/40'
      },
      {
        type: BPMN_NODE_TYPES.MANUAL_TASK,
        title: 'Manual Task',
        subtitle: 'Acción física / Inspección',
        icon: Wrench,
        colorClass: 'text-amber-400 border-amber-500/40',
        bgClass: 'bg-amber-950/30 hover:bg-amber-900/40'
      },
      {
        type: BPMN_NODE_TYPES.SUB_PROCESS,
        title: 'SubProcess',
        subtitle: 'Subproceso anidado',
        icon: Layers,
        colorClass: 'text-indigo-400 border-indigo-500/40',
        bgClass: 'bg-indigo-950/30 hover:bg-indigo-900/40'
      }
    ]
  },
  {
    groupName: 'Calidad y Plazos (ISO 9001 / 8601)',
    items: [
      {
        type: BPMN_NODE_TYPES.QUALITY_CHECKPOINT_EVENT,
        title: 'Quality Checkpoint',
        subtitle: 'Punto de inspección ISO 9001',
        icon: ShieldCheck,
        colorClass: 'text-pink-400 border-pink-500/40',
        bgClass: 'bg-pink-950/30 hover:bg-pink-900/40'
      },
      {
        type: BPMN_NODE_TYPES.TIMER_BOUNDARY_EVENT,
        title: 'Timer / Plazo SLA',
        subtitle: 'Cómputo perentorio ISO 8601',
        icon: Clock,
        colorClass: 'text-cyan-400 border-cyan-500/40',
        bgClass: 'bg-cyan-950/30 hover:bg-cyan-900/40'
      }
    ]
  },
  {
    groupName: 'Compuertas de Decisión',
    items: [
      {
        type: BPMN_NODE_TYPES.EXCLUSIVE_GATEWAY,
        title: 'Exclusive Gateway (XOR)',
        subtitle: 'Decisión excluyente',
        icon: X,
        colorClass: 'text-amber-400 border-amber-500/40',
        bgClass: 'bg-amber-950/30 hover:bg-amber-900/40'
      },
      {
        type: BPMN_NODE_TYPES.PARALLEL_GATEWAY,
        title: 'Parallel Gateway (AND)',
        subtitle: 'Bifurcación concurrente',
        icon: Plus,
        colorClass: 'text-indigo-400 border-indigo-500/40',
        bgClass: 'bg-indigo-950/30 hover:bg-indigo-900/40'
      }
    ]
  }
];

export const SidebarPalette: React.FC = () => {
  const { addNode, addLane } = useCanvasStore();
  const { currentProject } = useProjectStore();

  const handleDragStart = (e: React.DragEvent, nodeType: BpmnNodeType) => {
    e.dataTransfer.setData('application/reactflow-nodetype', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleAddLaneClick = () => {
    const pool = currentProject?.pools[0];
    if (pool) {
      addLane(
        pool.id,
        `Nuevo Carril ${pool.lanes.length + 1}`,
        'Rol Responsable',
        'Sistema SAM / VUPRA'
      );
    }
  };

  return (
    <aside className="w-64 h-full bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0 select-none overflow-y-auto">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Paleta de Modelado
          </span>
        </div>
        <span className="text-[10px] text-cyan-400/80 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
          BPMN 2.0
        </span>
      </div>

      {/* Instruction */}
      <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/60 text-[11px] text-slate-400 flex items-center">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
        <span>Arrastrá los elementos al lienzo o hacé clic para agregar.</span>
      </div>

      {/* Groups */}
      <div className="p-3 space-y-4 flex-1">
        {PALETTE_GROUPS.map((group) => (
          <div key={group.groupName}>
            <h5 className="text-[10px] font-bold font-mono uppercase text-slate-400 tracking-wider mb-2">
              {group.groupName}
            </h5>
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.type)}
                    onClick={() => addNode(item.type, { x: 300 + Math.random() * 50, y: 150 + Math.random() * 50 })}
                    className={`flex items-center p-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${item.bgClass} ${item.colorClass}`}
                  >
                    <div className="p-1.5 rounded-md bg-slate-900/80 mr-2.5 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Add Swimlane Button */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={handleAddLaneClick}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-medium border border-cyan-500/20 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agregar Carril (Swimlane)</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
