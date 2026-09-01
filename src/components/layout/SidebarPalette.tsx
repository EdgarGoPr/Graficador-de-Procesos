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
        colorClass: 'text-[#10B981] border-[#10B981]/40',
        bgClass: 'bg-[#10B981]/10 hover:bg-[#10B981]/20'
      },
      {
        type: BPMN_NODE_TYPES.END_EVENT,
        title: 'End Event',
        subtitle: 'Fin / Archivo formal',
        icon: Square,
        colorClass: 'text-[#EF4444] border-[#EF4444]/40',
        bgClass: 'bg-[#EF4444]/10 hover:bg-[#EF4444]/20'
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
        colorClass: 'text-[#3B82F6] border-[#3B82F6]/40',
        bgClass: 'bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20'
      },
      {
        type: BPMN_NODE_TYPES.SERVICE_TASK,
        title: 'Service Task',
        subtitle: 'Servicio / Sistema TI',
        icon: Cpu,
        colorClass: 'text-[#3B82F6] border-[#3B82F6]/40',
        bgClass: 'bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20'
      },
      {
        type: BPMN_NODE_TYPES.MANUAL_TASK,
        title: 'Manual Task',
        subtitle: 'Acción física / Inspección',
        icon: Wrench,
        colorClass: 'text-[#F59E0B] border-[#F59E0B]/40',
        bgClass: 'bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20'
      },
      {
        type: BPMN_NODE_TYPES.SUB_PROCESS,
        title: 'SubProcess',
        subtitle: 'Subproceso anidado',
        icon: Layers,
        colorClass: 'text-[#3B82F6] border-[#3B82F6]/40',
        bgClass: 'bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20'
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
        colorClass: 'text-[#10B981] border-[#10B981]/40',
        bgClass: 'bg-[#10B981]/10 hover:bg-[#10B981]/20'
      },
      {
        type: BPMN_NODE_TYPES.TIMER_BOUNDARY_EVENT,
        title: 'Timer / Plazo SLA',
        subtitle: 'Cómputo perentorio ISO 8601',
        icon: Clock,
        colorClass: 'text-[#F59E0B] border-[#F59E0B]/40',
        bgClass: 'bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20'
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
        colorClass: 'text-[#F59E0B] border-[#F59E0B]/40',
        bgClass: 'bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20'
      },
      {
        type: BPMN_NODE_TYPES.PARALLEL_GATEWAY,
        title: 'Parallel Gateway (AND)',
        subtitle: 'Bifurcación concurrente',
        icon: Plus,
        colorClass: 'text-[#F59E0B] border-[#F59E0B]/40',
        bgClass: 'bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20'
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
    <aside className="w-64 h-full bg-theme-surface border-r border-theme-border flex flex-col shrink-0 select-none overflow-y-auto transition-colors">
      {/* Header */}
      <div className="p-3 border-b border-theme-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-theme-accent animate-ping" />
          <span className="text-xs font-bold text-theme-text uppercase tracking-wider">
            Paleta de Modelado
          </span>
        </div>
        <span className="text-[10px] text-theme-accent font-mono bg-theme-surface-subtle px-1.5 py-0.5 rounded border border-theme-border">
          BPMN 2.0
        </span>
      </div>

      {/* Instruction */}
      <div className="px-3 py-2 bg-theme-surface-subtle border-b border-theme-border text-[11px] text-theme-text-muted flex items-center">
        <HelpCircle className="w-3.5 h-3.5 text-theme-text-muted mr-1.5 shrink-0" />
        <span>Arrastrá los elementos al lienzo o hacé clic para agregar.</span>
      </div>

      {/* Groups */}
      <div className="p-3 space-y-4 flex-1">
        {PALETTE_GROUPS.map((group) => (
          <div key={group.groupName}>
            <h5 className="text-[10px] font-bold font-mono uppercase text-theme-text-muted tracking-wider mb-2">
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
                    <div className="p-1.5 rounded-md bg-theme-surface mr-2.5 shrink-0 shadow-sm border border-theme-border/50">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-theme-text truncate">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-theme-text-muted truncate">
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
        <div className="pt-2 border-t border-theme-border">
          <button
            onClick={handleAddLaneClick}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-theme-surface-subtle hover:bg-theme-surface text-theme-accent text-xs font-medium border border-theme-border transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agregar Carril (Swimlane)</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

