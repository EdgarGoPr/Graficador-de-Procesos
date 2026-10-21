import React, { useMemo } from 'react';
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

export interface RadialSectorItem {
  type: BpmnNodeType;
  title: string;
  fullName: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  badgeBg: string;
  description: string;
}

interface RadialNodeMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (nodeType: BpmnNodeType) => void;
  hoveredType: BpmnNodeType | null;
  onHoverTypeChange: (type: BpmnNodeType | null) => void;
}

const SECTOR_ITEMS: RadialSectorItem[] = [
  {
    type: BPMN_NODE_TYPES.USER_TASK,
    title: 'Tarea',
    fullName: 'Tarea de Usuario',
    icon: User,
    color: '#38BDF8',
    badgeBg: 'rgba(56, 189, 248, 0.25)',
    description: 'Actividad ejecutada por un rol o usuario'
  },
  {
    type: BPMN_NODE_TYPES.SERVICE_TASK,
    title: 'Servicio',
    fullName: 'Tarea de Servicio / TI',
    icon: Cpu,
    color: '#06B6D4',
    badgeBg: 'rgba(6, 182, 212, 0.25)',
    description: 'Automatización o invocación de sistema'
  },
  {
    type: BPMN_NODE_TYPES.EXCLUSIVE_GATEWAY,
    title: 'Decisión',
    fullName: 'Decisión Exclusiva (XOR)',
    icon: GitBranch,
    color: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.25)',
    description: 'Bifurcación condicional por regla'
  },
  {
    type: BPMN_NODE_TYPES.PARALLEL_GATEWAY,
    title: 'Paralelo',
    fullName: 'Bifurcación Paralela (AND)',
    icon: PlusSquare,
    color: '#D97706',
    badgeBg: 'rgba(217, 119, 6, 0.25)',
    description: 'Ramas concurrentes simultáneas'
  },
  {
    type: BPMN_NODE_TYPES.QUALITY_CHECKPOINT_EVENT,
    title: 'Control',
    fullName: 'Punto de Calidad ISO',
    icon: ShieldCheck,
    color: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.25)',
    description: 'Control de calidad o verificación legal'
  },
  {
    type: BPMN_NODE_TYPES.SUB_PROCESS,
    title: 'Subproc',
    fullName: 'Subproceso Procedimental',
    icon: Box,
    color: '#A855F7',
    badgeBg: 'rgba(168, 85, 247, 0.25)',
    description: 'Bloque con flujo operativo interno'
  },
  {
    type: BPMN_NODE_TYPES.END_EVENT,
    title: 'Fin',
    fullName: 'Evento de Fin',
    icon: CircleDot,
    color: '#EF4444',
    badgeBg: 'rgba(239, 68, 68, 0.25)',
    description: 'Culminación y cierre del proceso'
  }
];

// Helper to calculate exact annular SVG sector path
function createSectorPath(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  startAngleDeg: number,
  endAngleDeg: number,
  offsetOut = 0
): string {
  const midDeg = (startAngleDeg + endAngleDeg) / 2;
  const midRad = (midDeg * Math.PI) / 180;
  const ox = offsetOut * Math.cos(midRad);
  const oy = offsetOut * Math.sin(midRad);

  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = (endAngleDeg * Math.PI) / 180;

  const x1 = cx + ox + rIn * Math.cos(startRad);
  const y1 = cy + oy + rIn * Math.sin(startRad);
  const x2 = cx + ox + rOut * Math.cos(startRad);
  const y2 = cy + oy + rOut * Math.sin(startRad);
  const x3 = cx + ox + rOut * Math.cos(endRad);
  const y3 = cy + oy + rOut * Math.sin(endRad);
  const x4 = cx + ox + rIn * Math.cos(endRad);
  const y4 = cy + oy + rIn * Math.sin(endRad);

  const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;

  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x3.toFixed(2)} ${y3.toFixed(2)} L ${x4.toFixed(2)} ${y4.toFixed(2)} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

export const RadialNodeMenu: React.FC<RadialNodeMenuProps> = ({
  isOpen,
  onClose,
  onSelectOption,
  hoveredType,
  onHoverTypeChange
}) => {
  if (!isOpen) return null;

  const SIZE = 260;
  const CENTER = SIZE / 2;
  const R_IN = 46;
  const R_OUT = 118;
  const GAP_DEG = 3;
  const count = SECTOR_ITEMS.length;
  const sliceDeg = 360 / count;

  const activeItem = useMemo(
    () => SECTOR_ITEMS.find((s) => s.type === hoveredType) || null,
    [hoveredType]
  );

  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 nodrag nopan nowheel pointer-events-auto z-50 select-none animate-scaleIn"
      style={{ width: `${SIZE}px`, height: `${SIZE}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Dynamic Header pill floating above the wheel */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-10 px-3.5 py-1 rounded-xl bg-theme-surface/95 backdrop-blur-md border border-theme-border shadow-2xl flex items-center space-x-2 pointer-events-none whitespace-nowrap z-50">
        <span
          className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
          style={{ backgroundColor: activeItem ? activeItem.color : '#38BDF8' }}
        />
        <span className="text-xs font-bold text-theme-text font-mono">
          {activeItem ? activeItem.fullName : 'Selecciona o arrastra al elemento'}
        </span>
      </div>

      {/* SVG Donut / Pie Wheel */}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-full drop-shadow-2xl overflow-visible"
      >
        <defs>
          <filter id="sectorGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer subtle guide boundary */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={R_OUT + 1}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1.5"
          className="pointer-events-none"
        />

        {/* Donut Sectors (Wedges) */}
        {SECTOR_ITEMS.map((item, index) => {
          const isHovered = hoveredType === item.type;
          const startAngle = -90 + index * sliceDeg + GAP_DEG / 2;
          const endAngle = -90 + (index + 1) * sliceDeg - GAP_DEG / 2;
          const midAngle = (startAngle + endAngle) / 2;
          const midRad = (midAngle * Math.PI) / 180;

          // Annular sector path with optional slight pop-out on hover
          const pathD = createSectorPath(
            CENTER,
            CENTER,
            R_IN,
            R_OUT,
            startAngle,
            endAngle,
            isHovered ? 4 : 0
          );

          // Position of icon and text inside the sector
          const rLabel = (R_IN + R_OUT) / 2 + (isHovered ? 2 : 0);
          const iconX = CENTER + rLabel * Math.cos(midRad);
          const iconY = CENTER + rLabel * Math.sin(midRad);

          const IconComponent = item.icon;

          return (
            <g
              key={item.type}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => onHoverTypeChange(item.type)}
              onMouseLeave={() => {
                if (hoveredType === item.type) onHoverTypeChange(null);
              }}
              onClick={() => onSelectOption(item.type)}
            >
              {/* Sector slice path */}
              <path
                d={pathD}
                fill={
                  isHovered
                    ? item.color
                    : 'rgba(30, 41, 59, 0.94)'
                }
                stroke={isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.18)'}
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all duration-150"
                style={{
                  filter: isHovered ? 'url(#sectorGlow)' : undefined,
                  transition: 'fill 0.15s ease, stroke 0.15s ease, transform 0.15s ease'
                }}
              />

              {/* Icon and label in sector */}
              <g
                transform={`translate(${iconX.toFixed(1)}, ${iconY.toFixed(1)})`}
                className="pointer-events-none"
              >
                {/* HTML Icon embedded via foreignObject or SVG translation */}
                <foreignObject
                  x="-18"
                  y="-20"
                  width="36"
                  height="40"
                  className="overflow-visible"
                >
                  <div className="flex flex-col items-center justify-center w-full h-full select-none text-center">
                    <div
                      className={`transition-colors duration-150 ${
                        isHovered ? 'text-slate-950 font-bold' : ''
                      }`}
                      style={{ color: isHovered ? '#0f172a' : item.color }}
                    >
                      <IconComponent className="w-4 h-4 mx-auto" />
                    </div>
                    <span
                      className={`text-[9px] font-mono leading-tight tracking-tight uppercase mt-0.5 whitespace-nowrap transition-colors duration-150 ${
                        isHovered ? 'text-slate-950 font-black' : 'text-slate-200 font-semibold'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                </foreignObject>
              </g>
            </g>
          );
        })}

        {/* Center Hole Inner Circle (Hub) */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={R_IN - 2}
          fill="rgba(15, 23, 42, 0.97)"
          stroke={activeItem ? activeItem.color : 'rgba(255, 255, 255, 0.2)'}
          strokeWidth="2"
          className="transition-colors duration-150"
        />

        {/* Center Hub Content: 100% Vectorial Centered inside SVG */}
        <foreignObject
          x={CENTER - 40}
          y={CENTER - 40}
          width={80}
          height={80}
          className="overflow-visible pointer-events-none"
        >
          <div className="w-full h-full flex flex-col items-center justify-center text-center select-none">
            {activeItem ? (
              <div
                key={activeItem.type}
                className="flex flex-col items-center justify-center animate-hubPop text-center pointer-events-none"
              >
                {React.createElement(activeItem.icon, {
                  className: 'w-5 h-5 shrink-0 transition-transform',
                  style: { color: activeItem.color }
                })}
                <span
                  className="text-[9px] font-mono font-bold leading-tight mt-1 uppercase tracking-tight"
                  style={{ color: activeItem.color }}
                >
                  {activeItem.title}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 pointer-events-auto cursor-pointer"
                title="Cerrar rueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </foreignObject>
      </svg>
    </div>
  );
};
