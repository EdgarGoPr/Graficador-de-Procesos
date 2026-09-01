import React from 'react';

export interface AlignmentGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  coordinate: number;
  start: number;
  end: number;
}

interface AlignmentGuidesOverlayProps {
  guides: AlignmentGuide[];
}

export const AlignmentGuidesOverlay: React.FC<AlignmentGuidesOverlayProps> = ({ guides }) => {
  if (!guides || guides.length === 0) return null;

  return (
    <svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 overflow-visible"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {guides.map((guide) => {
        if (guide.type === 'vertical') {
          return (
            <g key={guide.id}>
              {/* Full-length Guide Line */}
              <line
                x1={guide.coordinate}
                y1={guide.start - 80}
                x2={guide.coordinate}
                y2={guide.end + 80}
                stroke="#38BDF8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                filter="url(#glow)"
                className="opacity-90 animate-pulse"
              />
              {/* Snapped Point Indicator Dots */}
              <circle
                cx={guide.coordinate}
                cy={guide.start}
                r={3}
                fill="#38BDF8"
                className="shadow-md"
              />
              <circle
                cx={guide.coordinate}
                cy={guide.end}
                r={3}
                fill="#38BDF8"
                className="shadow-md"
              />
            </g>
          );
        } else {
          return (
            <g key={guide.id}>
              {/* Full-length Guide Line */}
              <line
                x1={guide.start - 80}
                y1={guide.coordinate}
                x2={guide.end + 80}
                y2={guide.coordinate}
                stroke="#38BDF8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                filter="url(#glow)"
                className="opacity-90 animate-pulse"
              />
              {/* Snapped Point Indicator Dots */}
              <circle
                cx={guide.start}
                cy={guide.coordinate}
                r={3}
                fill="#38BDF8"
                className="shadow-md"
              />
              <circle
                cx={guide.end}
                cy={guide.coordinate}
                r={3}
                fill="#38BDF8"
                className="shadow-md"
              />
            </g>
          );
        }
      })}
    </svg>
  );
};
