import React, { memo, useState, useRef, useCallback } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, useNodes, useReactFlow } from '@xyflow/react';
import { getSmartEdgePath, getPointOnSvgPath, getClosestRatioOnSvgPath } from '../../../utils/smartRouting';
import { useCanvasStore } from '../../../store/useCanvasStore';
import { useProjectStore } from '../../../store/useProjectStore';
import { GripVertical } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SequenceFlowEdge = memo(({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected
}: EdgeProps<any>) => {
  const nodes = useNodes();
  const { screenToFlowPosition, getEdges } = useReactFlow();
  const updateEdgeData = useCanvasStore((state) => state.updateEdgeData);
  const selectEdge = useCanvasStore((state) => state.selectEdge);

  const [isHovered, setIsHovered] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const draggingIndexRef = useRef<number | null>(null);

  const pointsCount = Math.max(
    1,
    Math.min(
      4,
      data?.controlPointsCount ||
        (Array.isArray(data?.controlPoints) ? data.controlPoints.length : 1)
    )
  );

  let existingPoints: Array<{ x: number; y: number }> = [];
  if (Array.isArray(data?.controlPoints) && data.controlPoints.length > 0) {
    existingPoints = data.controlPoints.slice(0, pointsCount);
  } else if (data?.controlPoint) {
    existingPoints = [data.controlPoint];
  }

  const [edgePath, labelX, labelY] = getSmartEdgePath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    nodes,
    sourceNodeId: source,
    targetNodeId: target,
    padding: 24,
    controlPoints: existingPoints.length > 0 ? existingPoints : undefined,
  });

  const conditionText = data?.conditionText;
  const customStroke = data?.strokeColor;
  const customWidth = data?.strokeWidth || (selected ? 2.5 : 1.5);
  const isAnimated = data?.isAnimated;

  const defaultStroke = selected ? 'var(--theme-accent)' : (customStroke || 'var(--theme-edge-color, var(--theme-border))');

  const getDefaultPointPos = useCallback((idx: number, total: number) => {
    if (total === 1) return { x: labelX, y: labelY };
    const t = (idx + 1) / (total + 1);
    if (t <= 0.5) {
      const u = t / 0.5;
      return {
        x: Math.round(sourceX + (labelX - sourceX) * u),
        y: Math.round(sourceY + (labelY - sourceY) * u),
      };
    } else {
      const u = (t - 0.5) / 0.5;
      return {
        x: Math.round(labelX + (targetX - labelX) * u),
        y: Math.round(labelY + (targetY - labelY) * u),
      };
    }
  }, [labelX, labelY, sourceX, sourceY, targetX, targetY]);

  const handles = [];
  for (let i = 0; i < pointsCount; i++) {
    const hasCustom = !!existingPoints[i];
    const pos = hasCustom ? existingPoints[i] : getDefaultPointPos(i, pointsCount);
    handles.push({
      index: i,
      x: pos.x,
      y: pos.y,
      isCustom: hasCustom,
    });
  }

  const handlePointerDown = useCallback((index: number) => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setDraggingIndex(index);
    draggingIndexRef.current = index;
    useProjectStore.getState().pushSnapshot('Ajustar punto de conexión');
    selectEdge(id);
  }, [id, selectEdge]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const idx = draggingIndexRef.current;
    if (idx === null) return;
    e.stopPropagation();

    const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    let newX = Math.round(flowPos.x);
    let newY = Math.round(flowPos.y);

    // Magnetic Snapping in X:
    const allEdges = getEdges();
    const SNAP_DIST = 10;
    for (const otherEdge of allEdges) {
      if (otherEdge.id === id) continue;
      const otherCps = (otherEdge.data as any)?.controlPoints;
      if (Array.isArray(otherCps)) {
        for (const cp of otherCps) {
          if (cp && Math.abs(cp.x - newX) <= SNAP_DIST) {
            newX = cp.x;
            break;
          }
        }
      } else {
        const otherCp = (otherEdge.data as any)?.controlPoint;
        if (otherCp && Math.abs(otherCp.x - newX) <= SNAP_DIST) {
          newX = otherCp.x;
          break;
        }
      }
    }

    const updatedPoints: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < pointsCount; i++) {
      if (i === idx) {
        updatedPoints.push({ x: newX, y: newY });
      } else if (existingPoints[i]) {
        updatedPoints.push({ ...existingPoints[i] });
      } else {
        updatedPoints.push(getDefaultPointPos(i, pointsCount));
      }
    }

    updateEdgeData(id, {
      controlPoints: updatedPoints,
      controlPoint: updatedPoints[0],
      controlPointsCount: pointsCount,
    }, false);
  }, [id, screenToFlowPosition, getEdges, updateEdgeData, pointsCount, existingPoints, getDefaultPointPos]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (draggingIndexRef.current !== null) {
      setDraggingIndex(null);
      draggingIndexRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    updateEdgeData(id, { controlPoints: undefined, controlPoint: undefined }, true);
  }, [id, updateEdgeData]);

  // Label drag & drop along the edge path
  const [isDraggingLabel, setIsDraggingLabel] = useState(false);
  const isDraggingLabelRef = useRef(false);

  const labelPosRatio = data?.labelPosition;
  let finalLabelX = labelX;
  let finalLabelY = labelY;

  if (typeof labelPosRatio === 'number') {
    const ptOnPath = getPointOnSvgPath(edgePath, labelPosRatio);
    if (ptOnPath) {
      finalLabelX = ptOnPath.x;
      finalLabelY = ptOnPath.y;
    }
  }

  const handleLabelPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setIsDraggingLabel(true);
    isDraggingLabelRef.current = true;
    useProjectStore.getState().pushSnapshot('Mover etiqueta de conexión');
    selectEdge(id);
  }, [id, selectEdge]);

  const handleLabelPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingLabelRef.current) return;
    e.stopPropagation();
    const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const ratio = getClosestRatioOnSvgPath(edgePath, flowPos);
    updateEdgeData(id, { labelPosition: ratio }, false);
  }, [id, edgePath, screenToFlowPosition, updateEdgeData]);

  const handleLabelPointerUp = useCallback((e: React.PointerEvent) => {
    if (isDraggingLabelRef.current) {
      setIsDraggingLabel(false);
      isDraggingLabelRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  }, []);

  const handleLabelDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    updateEdgeData(id, { labelPosition: undefined }, true);
  }, [id, updateEdgeData]);

  const selectedEdgeId = useCanvasStore((state) => state.selectedEdgeId);
  const isEdgeSelected = Boolean(selected || selectedEdgeId === id);
  const showHandles = isEdgeSelected || draggingIndex !== null;

  return (
    <>
      {/* Invisible wider hit-area for effortless hover and selection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="cursor-pointer"
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => {
          if (draggingIndexRef.current === null && !isDraggingLabelRef.current) setIsHovered(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          selectEdge(id);
        }}
      />

      {/* Visible Edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: customWidth,
          stroke: defaultStroke,
          strokeDasharray: isAnimated ? '5,5' : style.strokeDasharray,
          animation: isAnimated ? 'flowAnimation 1s linear infinite' : undefined,
          transition: draggingIndex !== null || isDraggingLabel ? 'none' : 'stroke 0.15s, stroke-width 0.15s',
        }}
      />

      {/* Interactive Control Point Handles (1 to 4 points) */}
      {showHandles && (
        <EdgeLabelRenderer>
          {handles.map((h) => {
            const isThisDragging = draggingIndex === h.index;
            return (
              <div
                key={h.index}
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${h.x}px,${h.y}px)`,
                  pointerEvents: 'all',
                  zIndex: isThisDragging ? 60 : (selected ? 50 : 35),
                }}
                className="nodrag nopan"
                onPointerEnter={() => setIsHovered(true)}
                onPointerLeave={() => {
                  if (draggingIndexRef.current === null && !isDraggingLabelRef.current) setIsHovered(false);
                }}
              >
                <div
                  onPointerDown={handlePointerDown(h.index)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onDoubleClick={handleDoubleClick}
                  title={`Punto ${h.index + 1} (${pointsCount} punto${pointsCount > 1 ? 's' : ''}): arrastra para moldear la conexión. Doble clic para restablecer.`}
                  style={{ cursor: isThisDragging ? 'grabbing' : 'grab' }}
                  className={`w-4 h-4 rounded-full border-2 transition-transform duration-100 flex items-center justify-center font-mono text-[9px] font-bold select-none ${
                    isThisDragging
                      ? 'bg-amber-400 border-slate-900 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.9)] scale-150'
                      : selected
                      ? 'bg-theme-accent border-slate-900 text-slate-950 shadow-[0_0_8px_rgba(56,189,248,0.7)] scale-125 hover:scale-150'
                      : h.isCustom
                      ? 'bg-amber-500/90 border-slate-900 text-slate-950 shadow-sm hover:scale-125'
                      : 'bg-theme-surface border-theme-accent/80 text-theme-accent opacity-75 hover:opacity-100 hover:scale-125 shadow-sm'
                  }`}
                >
                  {pointsCount > 1 ? (h.index + 1) : <div className="w-1.5 h-1.5 rounded-full bg-slate-900/60" />}
                </div>
              </div>
            );
          })}
        </EdgeLabelRenderer>
      )}

      {/* Condition / Label Text - Interactive & Draggable along the line */}
      {conditionText && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${finalLabelX}px,${finalLabelY}px)`,
              pointerEvents: 'all',
              zIndex: isDraggingLabel ? 70 : (isEdgeSelected ? 48 : 32),
              cursor: isDraggingLabel ? 'grabbing' : 'grab',
            }}
            onPointerDown={handleLabelPointerDown}
            onPointerMove={handleLabelPointerMove}
            onPointerUp={handleLabelPointerUp}
            onDoubleClick={handleLabelDoubleClick}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => {
              if (!isDraggingLabelRef.current && draggingIndexRef.current === null) {
                setIsHovered(false);
              }
            }}
            title="Arrastra para mover la etiqueta a lo largo de la línea. Doble clic para centrar."
            className={`nodrag nopan px-2 py-0.5 rounded border text-[9px] font-mono shadow-sm backdrop-blur-sm select-none transition-all duration-75 flex items-center space-x-1 ${
              isDraggingLabel
                ? 'bg-amber-400 border-slate-900 text-slate-950 ring-2 ring-amber-400/60 shadow-lg scale-110'
                : isEdgeSelected
                ? 'bg-theme-surface/95 border-theme-accent text-theme-accent hover:border-theme-accent hover:scale-105 shadow-md'
                : 'bg-theme-surface/95 border-theme-border text-theme-accent hover:border-theme-accent/60'
            }`}
          >
            <GripVertical className="w-2.5 h-2.5 opacity-40 shrink-0" />
            <span className="truncate max-w-[140px]">{conditionText}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

SequenceFlowEdge.displayName = 'SequenceFlowEdge';

