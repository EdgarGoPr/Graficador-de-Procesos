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
  totalWidth = 2400
}) => {
  if (!pools || pools.length === 0) return null;

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none select-none z-0"
      style={{ width: `${totalWidth}px` }}
    >
      {pools.map((pool) => {
        let currentYOffset = 20;

        return (
          <div key={pool.id} className="relative mb-8">
            {/* Pool Header */}
            <div className="flex items-center px-4 py-2 bg-slate-900/90 border-b border-slate-700/60 text-slate-200 shadow-md">
              <Layers className="w-4 h-4 text-cyan-400 mr-2" />
              <span className="font-bold text-sm tracking-wide text-cyan-300">
                {pool.name}
              </span>
              <span className="ml-3 text-xs text-slate-400 font-mono">
                [{pool.organization}]
              </span>
            </div>

            {/* Swimlanes */}
            {pool.lanes.map((lane, idx) => {
              const y = currentYOffset;
              currentYOffset += laneHeight;
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={lane.id}
                  style={{
                    height: `${laneHeight}px`,
                    width: '100%'
                  }}
                  className={`relative flex border-b border-r border-slate-800/80 ${
                    isEven ? 'bg-slate-950/40' : 'bg-slate-900/30'
                  }`}
                >
                  {/* Lane Header Banner */}
                  <div
                    className="w-56 shrink-0 border-r border-slate-800/80 p-3 flex flex-col justify-between"
                    style={{
                      borderLeft: `4px solid ${lane.colorHex || '#3b82f6'}`
                    }}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-100 line-clamp-1">
                        {lane.name}
                      </div>
                      <div className="flex items-center text-[10px] text-slate-400 mt-1">
                        <UserCheck className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                        <span className="truncate">{lane.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center text-[9px] font-mono text-cyan-400/90 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800">
                      <Server className="w-2.5 h-2.5 mr-1 shrink-0" />
                      <span className="truncate">{lane.system}</span>
                    </div>
                  </div>

                  {/* Lane Body Grid area */}
                  <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:40px_40px]" />
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
