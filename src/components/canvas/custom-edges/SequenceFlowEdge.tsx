import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';

export const SequenceFlowEdge = memo(({
  id,
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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const conditionText = data?.conditionText;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? 'var(--theme-accent)' : 'var(--theme-border)',
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />
      {conditionText && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan px-2 py-0.5 rounded-md bg-theme-surface border border-theme-border text-[10px] font-mono text-theme-accent shadow-md backdrop-blur-sm"
          >
            {conditionText}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

SequenceFlowEdge.displayName = 'SequenceFlowEdge';

