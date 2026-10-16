import React, { memo, useState, useRef, useCallback } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, useNodes, useReactFlow } from '@xyflow/react';
import { getSmartEdgePath } from '../../../utils/smartRouting';
import { useCanvasStore } from '../../../store/useCanvasStore';
import { useProjectStore } from '../../../store/useProjectStore';

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
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  const customCp = data?.controlPoint as { x: number; y: number } | undefined;

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
    controlPoint: customCp,
  });

  const conditionText = data?.conditionText;
  const customStroke = data?.strokeColor;
  const customWidth = data?.strokeWidth || (selected ? 2.5 : 1.5);
  const isAnimated = data?.isAnimated;

  const defaultStroke = selected ? 'var(--theme-accent)' : (customStroke || 'var(--theme-edge-color, var(--theme-border))');

  const handleX = customCp ? customCp.x : labelX;
  const handleY = customCp ? customCp.y : labelY;

  // Pointer drag events for the control point handle
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    isDraggingRef.current = true;
    useProjectStore.getState().pushSnapshot('Ajustar curvatura de línea');
    selectEdge(id);
  }, [id, selectEdge]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();

    const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    let newX = Math.round(flowPos.x);
    let newY = Math.round(flowPos.y);

    // Magnetic Snapping in X:
    // Attract to control points of other edges within 10px so all inflections align effortlessly
    const allEdges = getEdges();
    const SNAP_DIST = 10;
    for (const otherEdge of allEdges) {
      if (otherEdge.id === id) continue;
      const otherCp = (otherEdge.data as any)?.controlPoint;
      if (otherCp && Math.abs(otherCp.x - newX) <= SNAP_DIST) {
        newX = otherCp.x;
        break;
      }
    }

    updateEdgeData(id, { controlPoint: { x: newX, y: newY } }, false);
  }, [id, screenToFlowPosition, getEdges, updateEdgeData]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      setIsDragging(false);
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    updateEdgeData(id, { controlPoint: undefined }, true);
  }, [id, updateEdgeData]);

  const showHandle = selected || isHovered || isDragging || !!customCp;

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
          if (!isDraggingRef.current) setIsHovered(false);
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
          transition: isDragging ? 'none' : 'stroke 0.15s, stroke-width 0.15s',
        }}
      />

      {/* Interactive Contracurva Control Point Handle */}
      {showHandle && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${handleX}px,${handleY}px)`,
              pointerEvents: 'all',
              zIndex: selected || isDragging ? 50 : 35,
            }}
            className="nodrag nopan"
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => {
              if (!isDraggingRef.current) setIsHovered(false);
            }}
          >
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDoubleClick={handleDoubleClick}
              title="Punto de contracurva: arrastra para alinear o esquivar tarjetas. Doble clic para restablecer."
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-transform duration-100 flex items-center justify-center ${
                isDragging
                  ? 'bg-amber-400 border-slate-900 shadow-[0_0_10px_rgba(245,158,11,0.9)] scale-150'
                  : selected
                  ? 'bg-theme-accent border-slate-900 shadow-[0_0_8px_rgba(56,189,248,0.7)] scale-125 hover:scale-150'
                  : customCp
                  ? 'bg-amber-500/90 border-slate-900 shadow-sm hover:scale-125'
                  : 'bg-theme-surface border-theme-accent/80 opacity-70 hover:opacity-100 hover:scale-125 shadow-sm'
              }`}
            >
              <div className="w-1 h-1 rounded-full bg-slate-900/60" />
            </div>
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Condition / Label Text */}
      {conditionText && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: showHandle
                ? `translate(-50%, -130%) translate(${handleX}px,${handleY}px)`
                : `translate(-50%, -50%) translate(${handleX}px,${handleY}px)`,
              pointerEvents: 'all',
              zIndex: 30,
            }}
            className="nodrag nopan px-2 py-0.5 rounded bg-theme-surface/95 border border-theme-border text-[9px] font-mono text-theme-accent shadow-sm backdrop-blur-sm pointer-events-none select-none"
          >
            {conditionText}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

SequenceFlowEdge.displayName = 'SequenceFlowEdge';

