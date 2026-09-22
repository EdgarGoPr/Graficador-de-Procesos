import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, useNodes } from '@xyflow/react';
import { getSmartEdgePath } from '../../../utils/smartRouting';

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
    padding: 24
  });

  const conditionText = data?.conditionText;
  const customStroke = data?.strokeColor;
  const customWidth = data?.strokeWidth || (selected ? 2.5 : 1.5);
  const isAnimated = data?.isAnimated;

  const defaultStroke = selected ? 'var(--theme-accent)' : (customStroke || 'var(--theme-edge-color, var(--theme-border))');

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
          transition: 'stroke 0.15s, stroke-width 0.15s',
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
            className="nodrag nopan px-2 py-0.5 rounded bg-theme-surface/95 border border-theme-border text-[9px] font-mono text-theme-accent shadow-sm backdrop-blur-sm"
          >
            {conditionText}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

SequenceFlowEdge.displayName = 'SequenceFlowEdge';

