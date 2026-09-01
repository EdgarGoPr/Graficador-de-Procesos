import React from 'react';
import { PoolDefinition } from '../../types/process';
import { Layers, Server, UserCheck } from 'lucide-react';

interface SwimlaneBackgroundProps {
  pools: PoolDefinition[];
  laneHeight?: number;
  totalWidth?: number;
}

export const SwimlaneBackground: React.FC<SwimlaneBackgroundProps> = ({
  pools,
  laneHeight = 140,
  totalWidth = 2600
}) => {
  if (!pools || pools.length === 0) return null;

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none select-none z-0 transition-colors"
      style={{ width: `${totalWidth}px` }}
    >
      {pools.map((pool) => {
        let currentYOffset = 20;

        return (
          <div key={pool.id} className="relative mb-8">
            {/* Pool Header Bar */}
            <div className="flex items-center px-4 py-2 bg-theme-surface border-b border-theme-border text-theme-text shadow-md">
              <Layers className="w-4 h-4 text-theme-accent mr-2" />
              <span className="font-bold text-sm tracking-wide text-theme-accent">
                {pool.name}
              </span>
              <span className="ml-3 text-xs text-theme-text-muted font-mono">
                [{pool.organization}]
              </span>
            </div>

            {/* Swimlanes */}
            {pool.lanes.map((lane, idx) => {
              currentYOffset += laneHeight;
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={lane.id}
                  style={{
                    height: `${laneHeight}px`,
                    width: '100%',
                    backgroundColor: isEven ? 'transparent' : 'rgba(128, 128, 128, 0.05)'
                  }}
                  className="relative flex border-b border-r border-theme-border/60 transition-colors"
                >
                  {/* Lane Header Banner (Left Side) */}
                  <div
                    className="w-60 shrink-0 border-r border-theme-border/80 p-3 flex flex-col justify-between bg-theme-surface/90 backdrop-blur-md transition-colors shadow-sm"
                    style={{
                      borderLeft: `4px solid ${lane.colorHex || '#3B82F6'}`
                    }}
                  >
                    <div>
                      <div className="text-xs font-bold text-theme-text line-clamp-1">
                        {lane.name}
                      </div>
                      <div className="flex items-center text-[10px] text-theme-text-muted mt-1">
                        <UserCheck className="w-3 h-3 mr-1 text-theme-text-muted shrink-0" />
                        <span className="truncate">{lane.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center text-[9px] font-mono text-theme-accent bg-theme-surface-subtle px-1.5 py-0.5 rounded border border-theme-border">
                      <Server className="w-2.5 h-2.5 mr-1 shrink-0" />
                      <span className="truncate">{lane.system}</span>
                    </div>
                  </div>

                  {/* Lane Body Grid area */}
                  <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--theme-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--theme-border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-15" />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
