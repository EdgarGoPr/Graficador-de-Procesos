import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BpmnNodeType, BPMN_NODE_TYPES } from '../../types/process';
import {
  User,
  Cpu,
  GitBranch,
  PlusSquare,
  ShieldCheck,
  Box,
  CircleDot,
  X
} from 'lucide-react';

export interface RadialNodeOption {
  type: BpmnNodeType;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  angleDeg: number; // Angle in degrees relative to center (0 = right, 90 = bottom, -90 = top)
}

interface RadialNodeMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (nodeType: BpmnNodeType) => void;
  isDraggingMode?: boolean;
}

export const RadialNodeMenu: React.FC<RadialNodeMenuProps> = ({
  isOpen,
  onClose,
  onSelectOption,
  isDraggingMode = false
}) => {
  const [hoveredType, setHoveredType] = useState<BpmnNodeType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 7 BPMN options ergonomically distributed in a forward circular arc facing right
  const options: RadialNodeOption[] = useMemo(() => [
    {
      type: BPMN_NODE_TYPES.USER_TASK,
      label: 'Tarea de Usuario',
      shortLabel: 'Usuario',
      icon: User,
      color: '#38BDF8',
      bgColor: 'rgba(56, 189, 248, 0.15)',
      borderColor: 'rgba(56, 189, 248, 0.45)',
      description: 'Actividad ejecutada por una persona en un sistema',
      angleDeg: 0 // Centro a la derecha (opción más frecuente)
    },
    {
      type: BPMN_NODE_TYPES.SERVICE_TASK,
      label: 'Tarea de Servicio / TI',
      shortLabel: 'Servicio',
      icon: Cpu,
      color: '#06B6D4',
      bgColor: 'rgba(6, 182, 212, 0.15)',
      borderColor: 'rgba(6, 182, 212, 0.45)',
      description: 'Servicio automatizado o integración de sistema',
      angleDeg: -35
    },
    {
      type: BPMN_NODE_TYPES.SUB_PROCESS,
      label: 'Subproceso Procedimental',
      shortLabel: 'Subproceso',
      icon: Box,
      color: '#A855F7',
      bgColor: 'rgba(168, 85, 247, 0.15)',
      borderColor: 'rgba(168, 85, 247, 0.45)',
      description: 'Bloque jerárquico que encapsula un flujo interno',
      angleDeg: -70
    },
    {
      type: BPMN_NODE_TYPES.END_EVENT,
      label: 'Evento de Fin',
      shortLabel: 'Fin',
      icon: CircleDot,
      color: '#EF4444',
      bgColor: 'rgba(239, 68, 68, 0.15)',
      borderColor: 'rgba(239, 68, 68, 0.45)',
      description: 'Culminación y resultado final del proceso',
      angleDeg: -105
    },
    {
      type: BPMN_NODE_TYPES.EXCLUSIVE_GATEWAY,
      label: 'Decisión Exclusiva (XOR)',
      shortLabel: 'XOR',
      icon: GitBranch,
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.45)',
      description: 'Bifurcación condicional basada en una regla',
      angleDeg: 35
    },
    {
      type: BPMN_NODE_TYPES.PARALLEL_GATEWAY,
      label: 'Bifurcación Paralela (AND)',
      shortLabel: 'AND',
      icon: PlusSquare,
      color: '#D97706',
      bgColor: 'rgba(217, 119, 6, 0.15)',
      borderColor: 'rgba(217, 119, 6, 0.45)',
      description: 'División simultánea en ramas concurrentes',
      angleDeg: 70
    },
    {
      type: BPMN_NODE_TYPES.QUALITY_CHECKPOINT_EVENT,
      label: 'Punto de Calidad ISO',
      shortLabel: 'Control',
      icon: ShieldCheck,
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.45)',
      description: 'Punto de control normativo y verificación ISO 9001',
      angleDeg: 105
    }
  ], []);

  const RADIUS = 88; // Radio en píxeles de la rueda circular

  // Global mouse/pointer move and up handlers to support drag-to-select
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const mouseDist = Math.hypot(dx, dy);

      // If user is dragging near the radius ring
      if (mouseDist >= 40 && mouseDist <= RADIUS + 50) {
        let closestOpt: RadialNodeOption | null = null;
        let minDiff = Infinity;

        for (const opt of options) {
          const rad = (opt.angleDeg * Math.PI) / 180;
          const optX = Math.cos(rad) * RADIUS;
          const optY = Math.sin(rad) * RADIUS;
          const distToButton = Math.hypot(dx - optX, dy - optY);

          if (distToButton < minDiff) {
            minDiff = distToButton;
            closestOpt = opt;
          }
        }

        if (closestOpt && minDiff < 40) {
          setHoveredType((closestOpt as RadialNodeOption).type);
        } else {
          setHoveredType(null);
        }
      } else {
        setHoveredType(null);
      }
    };

    const handlePointerUp = () => {
      if (hoveredType) {
        onSelectOption(hoveredType);
      } else if (isDraggingMode) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, hoveredType, isDraggingMode, onClose, onSelectOption, options]);

  if (!isOpen) return null;

  const activeOption = options.find((o) => o.type === hoveredType);

  return (
    <div
      ref={containerRef}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-50 select-none animate-scaleIn"
      style={{ width: `${RADIUS * 2 + 80}px`, height: `${RADIUS * 2 + 80}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Background circular guide ring with glowing aura */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40 transition-opacity"
        viewBox={`0 0 ${RADIUS * 2 + 80} ${RADIUS * 2 + 80}`}
      >
        <circle
          cx={RADIUS + 40}
          cy={RADIUS + 40}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="text-theme-border"
        />
      </svg>

      {/* Central Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-theme-surface/90 hover:bg-theme-surface-subtle border border-theme-border text-theme-text-muted hover:text-theme-text flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 z-20 cursor-pointer"
        title="Cerrar rueda"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Dynamic Tooltip Header when hovering an option */}
      {activeOption && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-11 px-3 py-1.5 rounded-xl bg-theme-surface/95 backdrop-blur-md border shadow-2xl flex items-center space-x-2 pointer-events-none z-30 animate-fadeIn"
          style={{ borderColor: activeOption.borderColor }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: activeOption.color }}
          />
          <span className="text-xs font-bold text-theme-text whitespace-nowrap">
            {activeOption.label}
          </span>
          <span className="text-[10px] text-theme-text-muted hidden sm:inline">
            &bull; {activeOption.description}
          </span>
        </div>
      )}

      {/* Radial Options Nodes */}
      {options.map((opt) => {
        const rad = (opt.angleDeg * Math.PI) / 180;
        const x = Math.round(Math.cos(rad) * RADIUS);
        const y = Math.round(Math.sin(rad) * RADIUS);
        const isHovered = hoveredType === opt.type;
        const Icon = opt.icon;

        return (
          <div
            key={opt.type}
            style={{
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
            }}
            className="absolute left-1/2 top-1/2 transition-transform duration-150 ease-out z-20"
          >
            <button
              type="button"
              onMouseEnter={() => setHoveredType(opt.type)}
              onMouseLeave={() => setHoveredType(null)}
              onClick={() => onSelectOption(opt.type)}
              className={`relative flex items-center justify-center rounded-2xl p-2.5 backdrop-blur-md transition-all duration-150 shadow-xl cursor-pointer ${
                isHovered
                  ? 'scale-125 ring-2 shadow-2xl z-30'
                  : 'scale-100 hover:scale-115 opacity-90 hover:opacity-100'
              }`}
              style={{
                backgroundColor: isHovered ? opt.bgColor : 'var(--color-theme-surface, #1e293b)',
                borderColor: opt.borderColor,
                borderWidth: '1.5px',
                color: opt.color,
                boxShadow: isHovered ? `0 0 16px ${opt.color}40` : undefined,
              }}
              title={`${opt.label}: ${opt.description}`}
            >
              <Icon className="w-5 h-5 transition-transform duration-150" />

              {/* Mini Pill Label */}
              <span
                className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border whitespace-nowrap transition-opacity shadow-sm ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  backgroundColor: 'var(--color-theme-surface, #0f172a)',
                  borderColor: opt.borderColor,
                  color: opt.color,
                }}
              >
                {opt.shortLabel}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
