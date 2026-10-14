import React, { memo } from 'react';
import { useNodesData, type MiniMapNodeProps } from '@xyflow/react';

const CustomMiniMapNodeComponent: React.FC<MiniMapNodeProps> = ({
  id,
  x,
  y,
  width,
  height,
  style,
  color,
  strokeColor,
  strokeWidth = 1.5,
  className,
  borderRadius = 4,
  shapeRendering = 'geometricPrecision',
  selected,
  onClick,
}) => {
  const nodeData = useNodesData(id);
  const nodeType = nodeData?.type;

  const fill: string =
    typeof color === 'string'
      ? color
      : typeof style?.backgroundColor === 'string'
        ? style.backgroundColor
        : typeof style?.background === 'string'
          ? style.background
          : '#3B82F6';
  const effectiveStrokeColor = selected ? '#38BDF8' : (strokeColor || 'transparent');
  const effectiveStrokeWidth = selected ? Math.max(strokeWidth + 1.5, 2.5) : strokeWidth;

  const handleClick = onClick ? (event: React.MouseEvent<SVGElement>) => onClick(event as any, id) : undefined;

  // 1. Eventos Circulares (Inicio, Fin, Calidad, Temporizador)
  if (
    nodeType === 'StartEvent' ||
    nodeType === 'EndEvent' ||
    nodeType === 'QualityCheckpointEvent' ||
    nodeType === 'TimerBoundaryEvent'
  ) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const r = Math.max(Math.min(width, height) / 2, 4);

    return (
      <g
        className={`react-flow__minimap-node ${selected ? 'selected' : ''} ${className || ''}`}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          style={{
            fill,
            stroke: effectiveStrokeColor,
            strokeWidth: nodeType === 'EndEvent' ? effectiveStrokeWidth * 1.5 : effectiveStrokeWidth,
            filter: selected ? 'drop-shadow(0 0 4px #38BDF8)' : undefined,
          }}
          shapeRendering={shapeRendering}
        />
        {/* En eventos finales, trazo concéntrico interior distintivo BPMN */}
        {nodeType === 'EndEvent' && r > 6 && (
          <circle
            cx={cx}
            cy={cy}
            r={r - 3}
            style={{
              fill: 'none',
              stroke: effectiveStrokeColor,
              strokeWidth: 1,
            }}
          />
        )}
      </g>
    );
  }

  // 2. Compuertas BPMN (Rombos / Diamantes)
  if (nodeType === 'ExclusiveGateway' || nodeType === 'ParallelGateway') {
    const midX = x + width / 2;
    const midY = y + height / 2;
    const points = `${midX},${y} ${x + width},${midY} ${midX},${y + height} ${x},${midY}`;

    return (
      <polygon
        points={points}
        className={`react-flow__minimap-node ${selected ? 'selected' : ''} ${className || ''}`}
        style={{
          fill,
          stroke: effectiveStrokeColor,
          strokeWidth: effectiveStrokeWidth,
          cursor: 'pointer',
          filter: selected ? 'drop-shadow(0 0 4px #38BDF8)' : undefined,
        }}
        shapeRendering={shapeRendering}
        onClick={handleClick}
      />
    );
  }

  // 3. Carriles (Swimlanes / PoolLane)
  if (nodeType === 'PoolLane') {
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={borderRadius}
        ry={borderRadius}
        className={`react-flow__minimap-node opacity-40 ${selected ? 'selected' : ''} ${className || ''}`}
        style={{
          fill,
          stroke: effectiveStrokeColor,
          strokeWidth: effectiveStrokeWidth,
          strokeDasharray: '4 4',
          cursor: 'pointer',
        }}
        shapeRendering={shapeRendering}
        onClick={handleClick}
      />
    );
  }

  // 4. Notas Adhesivas (StickyNote)
  if (nodeType === 'StickyNote') {
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={2}
        ry={2}
        className={`react-flow__minimap-node ${selected ? 'selected' : ''} ${className || ''}`}
        style={{
          fill,
          stroke: effectiveStrokeColor,
          strokeWidth: effectiveStrokeWidth,
          cursor: 'pointer',
          filter: selected ? 'drop-shadow(0 0 4px #38BDF8)' : undefined,
        }}
        shapeRendering={shapeRendering}
        onClick={handleClick}
      />
    );
  }

  // 5. Tareas y Subprocesos BPMN (Rectángulos Redondeados)
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={8}
      ry={8}
      className={`react-flow__minimap-node ${selected ? 'selected' : ''} ${className || ''}`}
      style={{
        fill,
        stroke: effectiveStrokeColor,
        strokeWidth: effectiveStrokeWidth,
        cursor: 'pointer',
        filter: selected ? 'drop-shadow(0 0 4px #38BDF8)' : undefined,
      }}
      shapeRendering={shapeRendering}
      onClick={handleClick}
    />
  );
};

export const CustomMiniMapNode = memo(CustomMiniMapNodeComponent);
