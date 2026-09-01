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
  const customStroke = data?.strokeColor;
  const customWidth = data?.strokeWidth || (selected ? 3 : 2);
  const isAnimated = data?.isAnimated;

  const defaultStroke = selected ? 'var(--theme-accent)' : (customStroke || 'var(--theme-border)');

  return (
    <>
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
            className="nodrag nopan px-2.5 py-1 rounded-md bg-theme-surface border border-theme-border text-[10px] font-mono text-theme-accent shadow-md backdrop-blur-sm"
          >
            {conditionText}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

SequenceFlowEdge.displayName = 'SequenceFlowEdge';
