import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useReactFlow,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { extractProcessSequence, ProcessPresentationStep } from '../../utils/processSequenceExtractor';
import { PRESET_THEMES, hexToRgba } from '../../types/theme';

import { StartEventNode } from '../canvas/custom-nodes/StartEventNode';
import { EndEventNode } from '../canvas/custom-nodes/EndEventNode';
import { TaskNode } from '../canvas/custom-nodes/TaskNode';
import { GatewayNode } from '../canvas/custom-nodes/GatewayNode';
import { QualityCheckpointNode } from '../canvas/custom-nodes/QualityCheckpointNode';
import { TimerBoundaryNode } from '../canvas/custom-nodes/TimerBoundaryNode';
import { SubProcessNode } from '../canvas/custom-nodes/SubProcessNode';
import { SwimlaneNode } from '../canvas/custom-nodes/SwimlaneNode';
import { StickyNoteNode } from '../canvas/custom-nodes/StickyNoteNode';
import { SequenceFlowEdge } from '../canvas/custom-edges/SequenceFlowEdge';

import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Clock,
  Server,
  Scale,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  GitBranch,
  Layers,
  Sparkles,
  RotateCcw,
  CheckSquare,
  ShieldCheck,
  FileText
} from 'lucide-react';

// Node types mapping for presentation canvas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NODE_TYPES: any = {
  StartEvent: StartEventNode,
  EndEvent: EndEventNode,
  UserTask: TaskNode,
  ServiceTask: TaskNode,
  ManualTask: TaskNode,
  ExclusiveGateway: GatewayNode,
  ParallelGateway: GatewayNode,
  QualityCheckpointEvent: QualityCheckpointNode,
  TimerBoundaryEvent: TimerBoundaryNode,
  SubProcess: SubProcessNode,
  PoolLane: SwimlaneNode,
  StickyNote: StickyNoteNode,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EDGE_TYPES: any = {
  sequenceFlow: SequenceFlowEdge,
};

const PresentationCanvasController: React.FC<{
  steps: ProcessPresentationStep[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  activeColors: any;
}> = ({ steps, currentStepIndex, onSelectStep, activeColors }) => {
  const { currentProject } = useProjectStore();
  const { setCenter, getZoom } = useReactFlow();

  const currentStep = steps[currentStepIndex];

  // Camera glide and dynamic zoom to active node
  useEffect(() => {
    if (!currentStep) return;

    const node = currentStep.node;
    const posX = node.position?.x ?? 0;
    const posY = node.position?.y ?? 0;

    let w = (node.measured?.width ?? node.width) as number;
    let h = (node.measured?.height ?? node.height) as number;

    if (!w || w <= 0) w = 220;
    if (!h || h <= 0) h = 140;

    const centerX = posX + w / 2;
    const centerY = posY + h / 2;

    // Smooth Prezi zoom animation
    setCenter(centerX, centerY, { zoom: 1.35, duration: 850 });
  }, [currentStepIndex, currentStep, setCenter]);

  // Nodes with active spotlight styling
  const presentationNodes = useMemo(() => {
    if (!currentProject) return [];

    const activeNodeId = currentStep?.node.id;

    return currentProject.nodes.map((n) => {
      const isCurrent = n.id === activeNodeId;
      const isSwimlane = n.type === 'PoolLane';

      return {
        ...n,
        selected: isCurrent,
        style: {
          ...n.style,
          transition: 'all 0.5s ease',
          opacity: isSwimlane ? 0.9 : isCurrent ? 1 : 0.45,
          filter: isCurrent ? 'drop-shadow(0 0 16px var(--theme-accent))' : 'none',
          transform: isCurrent ? 'scale(1.03)' : 'scale(1)'
        }
      };
    });
  }, [currentProject, currentStep]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-theme-canvas-bg">
      <ReactFlow
        nodes={presentationNodes as Node[]}
        edges={currentProject?.edges as Edge[] || []}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        onNodeClick={(_, node) => {
          const foundIdx = steps.findIndex((s) => s.node.id === node.id);
          if (foundIdx !== -1) onSelectStep(foundIdx);
        }}
        minZoom={0.2}
        maxZoom={2.5}
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color={hexToRgba(activeColors.border, 0.4)}
        />
      </ReactFlow>
    </div>
  );
};

export const ProcessPresentationModal: React.FC = () => {
  const { currentProject } = useProjectStore();
  const {
    isPresentationModalOpen,
    setPresentationModalOpen,
    currentThemeId,
    customThemeColors
  } = useUiStore();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoplaySeconds, setAutoplaySeconds] = useState(6);
  const [timeRemaining, setTimeRemaining] = useState(autoplaySeconds);

  const containerRef = useRef<HTMLDivElement>(null);

  const activeColors = currentThemeId === 'custom'
    ? customThemeColors
    : (PRESET_THEMES[currentThemeId]?.colors || PRESET_THEMES['antigravity-dark'].colors);

  // Extract topological steps
  const steps = useMemo(() => {
    if (!currentProject) return [];
    return extractProcessSequence(
      currentProject.nodes,
      currentProject.edges,
      currentProject.pools
    );
  }, [currentProject]);

  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;

  const handleNext = useCallback(() => {
    setCurrentStepIndex((prev) => (prev < totalSteps - 1 ? prev + 1 : 0));
    setTimeRemaining(autoplaySeconds);
  }, [totalSteps, autoplaySeconds]);

  const handlePrev = useCallback(() => {
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : totalSteps - 1));
    setTimeRemaining(autoplaySeconds);
  }, [totalSteps, autoplaySeconds]);

  // Autoplay timer effect
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleNext();
          return autoplaySeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, autoplaySeconds, handleNext]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isPresentationModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentStepIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentStepIndex(totalSteps - 1);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        setPresentationModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentationModalOpen, handleNext, handlePrev, totalSteps, setPresentationModalOpen]);

  if (!isPresentationModalOpen || !currentProject || steps.length === 0) {
    return null;
  }

  const nodeData = currentStep.node.data;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-theme-bg text-theme-text select-none animate-fadeIn backdrop-blur-xl"
    >
      {/* Top Presentation Header Bar */}
      <header className="h-14 px-6 border-b border-theme-border/80 bg-theme-surface/90 backdrop-blur-md flex items-center justify-between z-20 shrink-0 shadow-sm">
        <div className="flex items-center space-x-4 truncate">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-theme-accent/15 border border-theme-accent/40 flex items-center justify-center text-theme-accent">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono font-bold text-theme-accent uppercase tracking-wider">
                  MODO PRESENTACIÓN PREZI
                </span>
                <span className="text-xs text-theme-text-muted">&bull;</span>
                <span className="text-xs font-bold text-theme-text truncate max-w-sm md:max-w-md">
                  {currentProject.documentControl.documentTitle}
                </span>
              </div>
              <div className="text-[10px] text-theme-text-muted font-mono flex items-center space-x-2">
                <span>{currentProject.documentControl.documentCode}</span>
                <span>v{currentProject.documentControl.version}</span>
                <span>&bull;</span>
                <span>{currentProject.documentControl.authorName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step Progress & Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-theme-surface-subtle border border-theme-border rounded-full font-mono text-xs font-bold text-theme-accent">
            <span>PASO {currentStepIndex + 1}</span>
            <span className="text-theme-text-muted">/</span>
            <span className="text-theme-text-muted">{totalSteps}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border text-theme-text hover:text-theme-accent transition-colors"
            title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setPresentationModalOpen(false)}
            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
            title="Cerrar presentación (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area: Left Canvas (Prezi Zoom) + Right Detail Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center Interactive Zoom Canvas */}
        <div className="flex-1 h-full relative overflow-hidden">
          <ReactFlowProvider>
            <PresentationCanvasController
              steps={steps}
              currentStepIndex={currentStepIndex}
              onSelectStep={setCurrentStepIndex}
              activeColors={activeColors}
            />
          </ReactFlowProvider>

          {/* Floating Bottom Playback & Timeline Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
            {/* Scrubber dots */}
            <div className="flex items-center space-x-1.5 mb-3 px-3 py-1.5 bg-theme-surface/90 backdrop-blur-md rounded-full border border-theme-border/80 shadow-lg max-w-lg overflow-x-auto">
              {steps.map((s, idx) => (
                <button
                  key={s.node.id}
                  onClick={() => {
                    setCurrentStepIndex(idx);
                    setTimeRemaining(autoplaySeconds);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? 'w-6 bg-theme-accent shadow-sm'
                      : 'w-2 bg-theme-border hover:bg-theme-text-muted'
                  }`}
                  title={`${s.stepNumber}. ${s.node.data.title}`}
                />
              ))}
            </div>

            {/* Playback Button Group */}
            <div className="flex items-center space-x-2 bg-theme-surface/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-theme-border/90 shadow-2xl">
              <button
                onClick={() => {
                  setCurrentStepIndex(0);
                  setTimeRemaining(autoplaySeconds);
                }}
                className="p-2 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border border-theme-border transition-colors"
                title="Ir al inicio (Home)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrev}
                className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border border-theme-border text-xs font-semibold transition-all hover:scale-105"
                title="Paso anterior (←)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              {/* Play / Pause Toggle */}
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                  isPlaying
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-theme-accent text-slate-950 hover:opacity-90'
                }`}
                title="Reproducción automática (Espacio)"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pausar ({timeRemaining}s)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Auto-Play</span>
                  </>
                )}
              </button>

              <button
                onClick={handleNext}
                className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border border-theme-border text-xs font-semibold transition-all hover:scale-105"
                title="Paso siguiente (→)"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Structured Step Detail Panel */}
        <aside className="w-[420px] max-w-full h-full bg-theme-surface/95 backdrop-blur-md border-l border-theme-border flex flex-col z-20 shrink-0 shadow-2xl overflow-y-auto">
          {/* Header Card */}
          <div className="p-6 border-b border-theme-border/80 bg-theme-surface-subtle/50">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-theme-accent/15 text-theme-accent border border-theme-accent/30">
                PASO {currentStepIndex + 1} DE {totalSteps}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-theme-surface border border-theme-border text-theme-text-muted">
                {nodeData.standardId || 'ID-BPMN'}
              </span>
            </div>

            {/* Role & Functional Lane */}
            <div className="flex items-center space-x-2 mt-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: currentStep.laneColor }}
              />
              <span className="text-xs font-bold text-theme-text flex items-center space-x-1 truncate">
                <User className="w-3.5 h-3.5 text-theme-accent shrink-0" />
                <span className="truncate">{currentStep.roleName}</span>
              </span>
            </div>

            {/* Title */}
            <h2 className="text-base font-bold text-theme-text mt-3 leading-snug">
              {nodeData.title || 'Sin Título'}
            </h2>
          </div>

          {/* Structured Detail Body */}
          <div className="p-6 space-y-5 text-xs">
            {/* Description */}
            <div>
              <h3 className="text-[10px] font-mono font-bold text-theme-text-muted uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <FileText className="w-3 h-3 text-theme-accent" />
                <span>Descripción del Paso</span>
              </h3>
              <p className="text-theme-text text-xs leading-relaxed bg-theme-surface-subtle/70 p-3 rounded-lg border border-theme-border">
                {nodeData.description || 'Sin descripción detallada registrada para esta actividad.'}
              </p>
            </div>

            {/* Quick Metrics: SLA & IT System */}
            <div className="grid grid-cols-2 gap-3">
              {/* SLA Metric */}
              <div className="p-3 rounded-lg bg-theme-surface-subtle/60 border border-theme-border flex flex-col justify-between">
                <span className="text-[10px] font-mono font-bold text-theme-text-muted flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>TIEMPO / SLA</span>
                </span>
                <span className="text-xs font-bold text-theme-text mt-1">
                  {currentStep.slaText || 'No aplica'}
                </span>
              </div>

              {/* IT System */}
              <div className="p-3 rounded-lg bg-theme-surface-subtle/60 border border-theme-border flex flex-col justify-between">
                <span className="text-[10px] font-mono font-bold text-theme-text-muted flex items-center space-x-1">
                  <Server className="w-3 h-3 text-blue-400" />
                  <span>SISTEMA TI</span>
                </span>
                <span className="text-xs font-bold text-theme-text mt-1 truncate">
                  {nodeData.itSystem || 'Manual / Físico'}
                </span>
              </div>
            </div>

            {/* Inputs & Outputs */}
            <div className="space-y-3">
              {/* Inputs */}
              <div>
                <h3 className="text-[10px] font-mono font-bold text-theme-text-muted uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <CheckSquare className="w-3 h-3 text-emerald-400" />
                  <span>Entradas Requeridas (Inputs)</span>
                </h3>
                {nodeData.inputs && nodeData.inputs.length > 0 ? (
                  <ul className="space-y-1">
                    {nodeData.inputs.map((inp, i) => (
                      <li
                        key={i}
                        className="flex items-start space-x-2 text-theme-text bg-emerald-500/5 border border-emerald-500/20 px-2.5 py-1.5 rounded-md"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{inp}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-theme-text-muted italic bg-theme-surface-subtle/40 px-2.5 py-1.5 rounded">
                    No especifica entradas formales.
                  </p>
                )}
              </div>

              {/* Outputs */}
              <div>
                <h3 className="text-[10px] font-mono font-bold text-theme-text-muted uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <ArrowRight className="w-3 h-3 text-sky-400" />
                  <span>Salidas / Entregables (Outputs)</span>
                </h3>
                {nodeData.outputs && nodeData.outputs.length > 0 ? (
                  <ul className="space-y-1">
                    {nodeData.outputs.map((out, i) => (
                      <li
                        key={i}
                        className="flex items-start space-x-2 text-theme-text bg-sky-500/5 border border-sky-500/20 px-2.5 py-1.5 rounded-md"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{out}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-theme-text-muted italic bg-theme-surface-subtle/40 px-2.5 py-1.5 rounded">
                    No especifica entregables formales.
                  </p>
                )}
              </div>
            </div>

            {/* Legal Framework */}
            {nodeData.legalFramework && (
              <div>
                <h3 className="text-[10px] font-mono font-bold text-theme-text-muted uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <Scale className="w-3 h-3 text-purple-400" />
                  <span>Marco Legal & Normativa</span>
                </h3>
                <div className="bg-purple-500/5 border border-purple-500/20 p-2.5 rounded-lg text-theme-text">
                  <span className="font-semibold text-purple-400">{String(nodeData.legalFramework)}</span>
                </div>
              </div>
            )}

            {/* Quality Checkpoint (QC) */}
            {nodeData.qualityCheckpoint && (
              <div>
                <h3 className="text-[10px] font-mono font-bold text-theme-text-muted uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Punto de Control de Calidad ({nodeData.qualityCheckpoint.checkpointCode})</span>
                </h3>
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg text-theme-text space-y-1">
                  <span className="font-semibold text-emerald-400 block">{nodeData.qualityCheckpoint.inspectionCriteria}</span>
                  <span className="text-[10px] text-theme-text-muted font-mono block">
                    Severidad: {nodeData.qualityCheckpoint.severity} &bull; Muestreo: {nodeData.qualityCheckpoint.sampleRatePercentage}%
                  </span>
                </div>
              </div>
            )}

            {/* Operational Risks */}
            {nodeData.operationalRisks && nodeData.operationalRisks.length > 0 && (
              <div>
                <h3 className="text-[10px] font-mono font-bold text-theme-text-muted uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Riesgos Operativos</span>
                </h3>
                <ul className="space-y-1.5">
                  {nodeData.operationalRisks.map((risk, i) => (
                    <li
                      key={i}
                      className="bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-lg text-theme-text"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-400">{risk.description}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          {risk.impact}
                        </span>
                      </div>
                      {risk.mitigatingControl && (
                        <span className="text-[11px] text-theme-text-muted block mt-1">
                          Control Mitigante: {risk.mitigatingControl}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Previous & Next Steps Navigation */}
            <div className="pt-4 border-t border-theme-border/80 space-y-3">
              <h3 className="text-[10px] font-mono font-bold text-theme-text-muted uppercase tracking-wider flex items-center space-x-1.5">
                <GitBranch className="w-3 h-3 text-theme-accent" />
                <span>Navegación del Flujo</span>
              </h3>

              <div className="space-y-2">
                {/* Previous Steps */}
                {currentStep.previousSteps.length > 0 && (
                  <div>
                    <span className="text-[10px] text-theme-text-muted block mb-1">Viene de:</span>
                    <div className="space-y-1">
                      {currentStep.previousSteps.map((ps) => {
                        const targetIdx = steps.findIndex((s) => s.node.id === ps.id);
                        return (
                          <button
                            key={ps.id}
                            onClick={() => targetIdx !== -1 && setCurrentStepIndex(targetIdx)}
                            className="w-full flex items-center justify-between text-left p-2 rounded bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border transition-colors group"
                          >
                            <span className="flex items-center space-x-1.5 truncate">
                              <ArrowLeft className="w-3 h-3 text-theme-accent shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                              <span className="font-mono text-[10px] text-theme-accent">{ps.standardId || 'ID'}</span>
                              <span className="truncate text-[11px]">{ps.title}</span>
                            </span>
                            {ps.conditionText && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 shrink-0">
                                {ps.conditionText}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                {currentStep.nextSteps.length > 0 && (
                  <div>
                    <span className="text-[10px] text-theme-text-muted block mb-1">Continúa hacia:</span>
                    <div className="space-y-1">
                      {currentStep.nextSteps.map((ns) => {
                        const targetIdx = steps.findIndex((s) => s.node.id === ns.id);
                        return (
                          <button
                            key={ns.id}
                            onClick={() => targetIdx !== -1 && setCurrentStepIndex(targetIdx)}
                            className="w-full flex items-center justify-between text-left p-2 rounded bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border transition-colors group"
                          >
                            <span className="flex items-center space-x-1.5 truncate">
                              <ArrowRight className="w-3 h-3 text-theme-accent shrink-0 group-hover:translate-x-0.5 transition-transform" />
                              <span className="font-mono text-[10px] text-theme-accent">{ns.standardId || 'ID'}</span>
                              <span className="truncate text-[11px]">{ns.title}</span>
                            </span>
                            {ns.conditionText && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 shrink-0">
                                {ns.conditionText}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
