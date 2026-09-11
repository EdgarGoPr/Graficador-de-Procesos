import React, { useMemo } from 'react';
import { ProcessProjectFile } from '../../types/project';
import {
  Play,
  Square,
  User,
  Server,
  Wrench,
  GitBranch,
  Split,
  ShieldCheck,
  Clock,
  Layers,
  ArrowDown
} from 'lucide-react';

interface FlowchartPrintDocumentProps {
  project: ProcessProjectFile;
}

export const FlowchartPrintDocument: React.FC<FlowchartPrintDocumentProps> = ({ project }) => {
  // Filter out swimlanes and extract functional process nodes and connections
  const { layers, nodeMap, outgoingEdgesMap } = useMemo(() => {
    const processNodes = project.nodes.filter((n) => n.type !== 'PoolLane');
    const validNodeIds = new Set(processNodes.map((n) => n.id));
    const processEdges = project.edges.filter(
      (e) => validNodeIds.has(e.source) && validNodeIds.has(e.target)
    );

    const nodeMap = new Map(processNodes.map((n) => [n.id, n]));
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const outgoingEdgesMap = new Map<string, typeof processEdges>();

    processNodes.forEach((n) => {
      adj.set(n.id, []);
      inDegree.set(n.id, 0);
      outgoingEdgesMap.set(n.id, []);
    });

    processEdges.forEach((e) => {
      adj.get(e.source)?.push(e.target);
      outgoingEdgesMap.get(e.source)?.push(e);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    });

    // Layer assignment (Longest path from roots)
    const nodeRank = new Map<string, number>();
    const queue: { id: string; rank: number }[] = [];

    processNodes.forEach((n) => {
      if ((inDegree.get(n.id) || 0) === 0 || n.type === 'StartEvent') {
        nodeRank.set(n.id, 0);
        queue.push({ id: n.id, rank: 0 });
      }
    });

    if (queue.length === 0 && processNodes.length > 0) {
      nodeRank.set(processNodes[0].id, 0);
      queue.push({ id: processNodes[0].id, rank: 0 });
    }

    const visitedCount = new Map<string, number>();
    const MAX_VISITS = processNodes.length + 5;

    while (queue.length > 0) {
      const { id, rank } = queue.shift()!;
      const visits = (visitedCount.get(id) || 0) + 1;
      visitedCount.set(id, visits);
      if (visits > MAX_VISITS) continue;

      const currentRank = nodeRank.get(id) ?? rank;
      const neighbors = adj.get(id) || [];

      for (const neighbor of neighbors) {
        const existingRank = nodeRank.get(neighbor) ?? -1;
        const newRank = currentRank + 1;
        if (newRank > existingRank) {
          nodeRank.set(neighbor, newRank);
          queue.push({ id: neighbor, rank: newRank });
        }
      }
    }

    processNodes.forEach((n) => {
      if (!nodeRank.has(n.id)) {
        nodeRank.set(n.id, 0);
      }
    });

    const layersMap = new Map<number, string[]>();
    nodeRank.forEach((rank, id) => {
      if (!layersMap.has(rank)) {
        layersMap.set(rank, []);
      }
      layersMap.get(rank)!.push(id);
    });

    const sortedRanks = Array.from(layersMap.keys()).sort((a, b) => a - b);
    const layers = sortedRanks.map((r) => layersMap.get(r)!);

    return { layers, nodeMap, outgoingEdgesMap };
  }, [project]);

  // Helper to render icon for BPMN node type
  const renderIcon = (type?: string) => {
    switch (type) {
      case 'StartEvent':
        return <Play className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />;
      case 'EndEvent':
        return <Square className="w-4 h-4 text-rose-600 fill-rose-600/20" />;
      case 'ExclusiveGateway':
        return <GitBranch className="w-4 h-4 text-amber-600" />;
      case 'ParallelGateway':
        return <Split className="w-4 h-4 text-amber-600" />;
      case 'QualityCheckpointEvent':
        return <ShieldCheck className="w-4 h-4 text-teal-600" />;
      case 'TimerBoundaryEvent':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'ServiceTask':
        return <Server className="w-4 h-4 text-cyan-600" />;
      case 'ManualTask':
        return <Wrench className="w-4 h-4 text-amber-600" />;
      case 'SubProcess':
        return <Layers className="w-4 h-4 text-purple-600" />;
      default:
        return <User className="w-4 h-4 text-sky-600" />;
    }
  };

  return (
    <div className="flowchart-print-document w-full max-w-4xl mx-auto py-8 px-6 print:py-0 print:px-0 text-slate-900 bg-white print:bg-white select-text">
      {/* 1. Formal Document Header (Prints on top of Page 1) */}
      <div className="border-b-2 border-slate-900 pb-5 mb-8 page-break-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
              Flujograma de Proceso &bull; ISO 9001:2015 / BPMN 2.0
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-black mt-1 leading-tight">
              {project.documentControl.documentTitle}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {project.documentControl.organizationUnit} &bull; Responsable: {project.documentControl.authorName}
            </p>
          </div>

          <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-300 text-right space-y-0.5 shrink-0 text-xs font-mono">
            <div className="font-bold text-slate-900">CÓDIGO: {project.documentControl.documentCode}</div>
            <div className="font-semibold text-amber-700">VERSIÓN: {project.documentControl.version}</div>
            <div className="text-[11px] text-slate-500">FECHA: {project.documentControl.updatedAt.substring(0, 10)}</div>
          </div>
        </div>

        {project.documentControl.processObjective && (
          <div className="mt-3.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <strong className="text-black font-semibold">Objetivo: </strong>
            {project.documentControl.processObjective}
          </div>
        )}
      </div>

      {/* 2. Structured Top-to-Bottom Flow Container (Natural block flow for multi-page breaking) */}
      <div className="flowchart-layers-container w-full block">
        {layers.map((layerNodeIds, layerIdx) => (
          <div key={layerIdx} className="flowchart-level-block w-full page-break-avoid mb-6">
            {/* Nodes in this Layer */}
            <div
              className={`w-full flex flex-wrap items-center justify-center gap-4 mx-auto ${
                layerNodeIds.length > 2 ? 'sm:grid sm:grid-cols-3 max-w-4xl' : layerNodeIds.length === 2 ? 'sm:grid sm:grid-cols-2 max-w-2xl' : 'max-w-md'
              }`}
            >
              {layerNodeIds.map((nodeId) => {
                const node = nodeMap.get(nodeId);
                if (!node) return null;
                const data = node.data;
                const isStart = node.type === 'StartEvent';
                const isEnd = node.type === 'EndEvent';
                const isGateway = node.type?.includes('Gateway');

                let shapeClasses = 'rounded-xl border-slate-400 bg-white shadow-sm';
                if (isStart) shapeClasses = 'rounded-full border-emerald-500 bg-emerald-50/50';
                else if (isEnd) shapeClasses = 'rounded-full border-rose-500 bg-rose-50/50';
                else if (isGateway) shapeClasses = 'rounded-2xl border-amber-500 bg-amber-50/40';

                return (
                  <div
                    key={node.id}
                    className={`relative p-3.5 border-2 ${shapeClasses} flex items-center space-x-3 transition-all min-h-[68px] w-full`}
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-300 shrink-0">
                      {renderIcon(node.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5 mb-0.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 border border-slate-300">
                          {data.standardId || 'ID'}
                        </span>
                        {data.roleName && (
                          <span className="text-[10px] font-mono text-slate-500 truncate max-w-[130px]">
                            {data.roleName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-black leading-tight line-clamp-2" title={data.title}>
                        {data.title || 'Sin Título'}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Connector Arrows to Next Layer */}
            {layerIdx < layers.length - 1 && (
              <div className="flex flex-col items-center justify-center my-3 page-break-avoid">
                {/* Find conditions if any node in this layer is a gateway or has labeled outgoing edges */}
                {layerNodeIds.flatMap((id) => outgoingEdgesMap.get(id) || []).some((e) => e.data?.conditionText) ? (
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mb-1">
                    {layerNodeIds
                      .flatMap((id) => outgoingEdgesMap.get(id) || [])
                      .filter((e) => e.data?.conditionText)
                      .map((edge, eIdx) => (
                        <span
                          key={eIdx}
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                        >
                          {edge.data?.conditionText}
                        </span>
                      ))}
                  </div>
                ) : null}

                {/* Clean SVG Connecting Arrow */}
                <div className="flex items-center justify-center text-slate-400">
                  <svg width="24" height="28" viewBox="0 0 24 28" fill="none" className="stroke-slate-500">
                    <line x1="12" y1="0" x2="12" y2="20" strokeWidth="2.5" strokeLinecap="round" />
                    <polyline points="7,15 12,22 17,15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 3. Formal Sign-off Footer (Appears on last page) */}
      <div className="mt-12 pt-6 border-t-2 border-slate-300 page-break-avoid">
        <div className="grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
          <div className="border-t border-slate-400 pt-2">
            <div className="font-bold text-black">{project.documentControl.authorName}</div>
            <div className="text-[11px] text-slate-500">Modelador de Procesos & Calidad</div>
          </div>
          <div className="border-t border-slate-400 pt-2">
            <div className="font-bold text-black">{project.documentControl.organizationUnit}</div>
            <div className="text-[11px] text-slate-500">Aprobación y Validación Institucional</div>
          </div>
        </div>
      </div>
    </div>
  );
};
