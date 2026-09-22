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
  FileText,
  Palette,
  Check,
  Grid,
  Square,
  CircleDot
} from 'lucide-react';

export interface PresentationBgConfig {
  bgColor: string;
  gridColor: string;
  gridVariant: 'dots' | 'lines' | 'cross' | 'none';
  isDark: boolean;
}

export const PRESENTATION_BG_PRESETS: {
  id: string;
  label: string;
  bgColor: string;
  gridColor: string;
  isDark: boolean;
}[] = [
  { id: 'oled', label: 'Negro Profundo OLED', bgColor: '#020617', gridColor: '#1e293b', isDark: true },
  { id: 'slate', label: 'Grafito Slate', bgColor: '#0f172a', gridColor: '#334155', isDark: true },
  { id: 'midnight', label: 'Azul Medianoche', bgColor: '#030712', gridColor: '#1e3a5f', isDark: true },
  { id: 'pure-white', label: 'Blanco Puro', bgColor: '#ffffff', gridColor: '#e2e8f0', isDark: false },
  { id: 'paper-gray', label: 'Gris Papel Minimal', bgColor: '#f8fafc', gridColor: '#cbd5e1', isDark: false },
  { id: 'warm-cream', label: 'Crema Cálido', bgColor: '#fdfbf7', gridColor: '#e7e5e4', isDark: false },
];

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
  bgConfig: PresentationBgConfig;
}> = ({ steps, currentStepIndex, onSelectStep, bgConfig }) => {
  const { currentProject } = useProjectStore();
  const { setCenter } = useReactFlow();

  const currentStep = steps[currentStepIndex];

  // Camera glide and dynamic zoom to active node
  useEffect(() => {
    if (!currentStep) return;

    const node = currentStep.node;
    const posX = node.position?.x ?? 0;
    const posY = node.position?.y ?? 0;

    let w = (node.measured?.width ?? node.width) as number;
    let h = (node.measured?.height ?? node.height) as number;

    if (!w || w <= 0) w = 200;
    if (!h || h <= 0) h = 120;

    const centerX = posX + w / 2;
    const centerY = posY + h / 2;

    const timer = setTimeout(() => {
      // Smooth Prezi zoom animation
      setCenter(centerX, centerY, { zoom: 1.25, duration: 800 });
    }, 60);

    return () => clearTimeout(timer);
  }, [currentStepIndex, currentStep, setCenter]);

  // Nodes with active spotlight styling and proper layering
  const presentationNodes = useMemo(() => {
    if (!currentProject) return [];

    const activeNodeId = currentStep?.node.id;

    const getHierarchyLevel = (type?: string) => {
      if (type === 'PoolLane') return 0; // Fondo (Swimlanes / Carriles)
      if (type === 'SubProcess') return 1; // Contenedores de subproceso
      if (type?.includes('Task')) return 2; // Tareas
      if (type?.includes('Gateway')) return 3; // Compuertas
      if (type?.includes('Event')) return 4; // Eventos
      return 2;
    };

    return [...currentProject.nodes]
      .map((n) => {
        const isCurrent = n.id === activeNodeId;
        const isSwimlane = n.type === 'PoolLane';
        const nodeZIndex = isCurrent ? 1000 : isSwimlane ? 0 : 10;

        return {
          ...n,
          selected: isCurrent,
          zIndex: nodeZIndex,
          style: {
            ...n.style,
            zIndex: nodeZIndex,
            transition: 'opacity 0.4s ease, filter 0.4s ease',
            opacity: isSwimlane ? 0.85 : isCurrent ? 1 : 0.6,
            filter: isCurrent
              ? 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.75))'
              : 'none'
          }
        };
      })
      .sort((a, b) => getHierarchyLevel(a.type) - getHierarchyLevel(b.type));
  }, [currentProject, currentStep]);

  // Edges highlighting incoming and outgoing connections of current step
  const presentationEdges = useMemo(() => {
    if (!currentProject?.edges) return [];
    const activeNodeId = currentStep?.node.id;

    return currentProject.edges.map((edge) => {
      const isConnected = edge.source === activeNodeId || edge.target === activeNodeId;
      return {
        ...edge,
        animated: isConnected || edge.data?.isAnimated,
        style: {
          ...edge.style,
          strokeWidth: isConnected ? 3.5 : (edge.data?.strokeWidth || 2),
          stroke: isConnected ? 'var(--theme-accent, #38bdf8)' : (edge.data?.strokeColor || '#94a3b8'),
          opacity: isConnected ? 1 : 0.35,
          transition: 'all 0.4s ease'
        }
      };
    });
  }, [currentProject?.edges, currentStep]);

  return (
    <div
      className="w-full h-full relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: bgConfig.bgColor }}
    >
      <ReactFlow
        nodes={presentationNodes as Node[]}
        edges={presentationEdges as Edge[]}
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
        {bgConfig.gridVariant !== 'none' && (
          <Background
            variant={
              bgConfig.gridVariant === 'lines'
                ? BackgroundVariant.Lines
                : bgConfig.gridVariant === 'cross'
                ? BackgroundVariant.Cross
                : BackgroundVariant.Dots
            }
            gap={24}
            size={1.5}
            color={bgConfig.gridColor}
          />
        )}
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

  // Background Customization State & Local Persistence
  const [bgConfig, setBgConfig] = useState<PresentationBgConfig>(() => {
    try {
      const saved = localStorage.getItem('procesos_presentation_bg_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      bgColor: '#020617',
      gridColor: '#1e293b',
      gridVariant: 'dots',
      isDark: true
    };
  });

  const [isBgPickerOpen, setIsBgPickerOpen] = useState(false);
  const bgPickerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateBgConfig = (updates: Partial<PresentationBgConfig>) => {
    setBgConfig((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('procesos_presentation_bg_config', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleCustomColorChange = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const isDark = lum < 0.5;
    const gridColor = isDark ? hexToRgba('#ffffff', 18) : hexToRgba('#000000', 15);

    updateBgConfig({
      bgColor: hex,
      gridColor,
      isDark
    });
  };

  // Close background menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bgPickerRef.current && !bgPickerRef.current.contains(e.target as unknown as HTMLElement)) {
        setIsBgPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          {/* Background & Grid Theme Selector Popover */}
          <div ref={bgPickerRef} className="relative">
            <button
              onClick={() => setIsBgPickerOpen((o) => !o)}
              className={`p-2 rounded-lg border transition-all flex items-center space-x-1 ${
                isBgPickerOpen
                  ? 'bg-theme-accent/20 border-theme-accent text-theme-accent shadow-sm'
                  : 'bg-theme-surface-subtle hover:bg-theme-surface border-theme-border text-theme-text hover:text-theme-accent'
              }`}
              title="Personalizar color de fondo y trama del lienzo"
            >
              <Palette className="w-4 h-4" />
            </button>

            {isBgPickerOpen && (
              <div className="absolute top-full mt-2 right-0 w-72 bg-theme-surface/98 backdrop-blur-2xl border border-theme-border rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-theme-text flex items-center justify-between mb-2.5">
                    <span>Fondo de Presentación</span>
                    <span className="text-[10px] font-mono text-theme-accent px-1.5 py-0.5 rounded bg-theme-surface border border-theme-border">
                      {bgConfig.bgColor}
                    </span>
                  </h4>

                  {/* Preset Background Swatches */}
                  <div className="grid grid-cols-3 gap-2">
                    {PRESENTATION_BG_PRESETS.map((preset) => {
                      const isSelected = bgConfig.bgColor === preset.bgColor;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            updateBgConfig({
                              bgColor: preset.bgColor,
                              gridColor: preset.gridColor,
                              isDark: preset.isDark
                            });
                          }}
                          className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            isSelected
                              ? 'border-theme-accent ring-2 ring-theme-accent/30 shadow-md'
                              : 'border-theme-border/80 hover:border-theme-border hover:shadow-sm'
                          }`}
                          style={{ backgroundColor: preset.bgColor }}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span
                              className={`w-3 h-3 rounded-full border ${
                                preset.isDark ? 'border-white/30' : 'border-black/20'
                              }`}
                              style={{ backgroundColor: preset.bgColor }}
                            />
                            {isSelected && (
                              <Check className={`w-3.5 h-3.5 ${preset.isDark ? 'text-sky-400' : 'text-blue-600'}`} />
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-medium leading-tight truncate ${
                              preset.isDark ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            {preset.label.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Picker Input */}
                <div className="pt-2 border-t border-theme-border">
                  <label className="text-[11px] font-semibold text-theme-text-muted mb-1.5 flex items-center justify-between">
                    <span>Color Personalizado (HEX):</span>
                    <input
                      type="color"
                      value={bgConfig.bgColor}
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-theme-border bg-transparent p-0"
                    />
                  </label>
                </div>

                {/* Grid Pattern Selector */}
                <div className="pt-2 border-t border-theme-border">
                  <label className="block text-[11px] font-semibold text-theme-text-muted mb-2">
                    Trama de Fondo (Cuadrícula):
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'dots', label: 'Puntos', icon: CircleDot },
                      { id: 'lines', label: 'Líneas', icon: Grid },
                      { id: 'cross', label: 'Cruz', icon: Square },
                      { id: 'none', label: 'Liso', icon: Square }
                    ].map((mode) => {
                      const isSelected = bgConfig.gridVariant === mode.id;
                      const Icon = mode.icon;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => updateBgConfig({ gridVariant: mode.id as any })}
                          className={`py-1.5 px-2 rounded-lg border text-[10px] font-semibold flex flex-col items-center justify-center space-y-1 transition-all ${
                            isSelected
                              ? 'border-theme-accent bg-theme-accent/15 text-theme-accent shadow-sm'
                              : 'border-theme-border text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
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
              bgConfig={bgConfig}
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
                className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border border-theme-border text-xs font-semibold transition-colors"
                title="Paso anterior (←)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              {/* Play / Pause toggle */}
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-theme-accent hover:bg-theme-accent-hover text-white'
                }`}
                title="Reproducir automáticamente (Espacio)"
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
                className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border border-theme-border text-xs font-semibold transition-colors"
                title="Paso siguiente (→)"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Structured Presentation Step Detail Sidebar */}
        <aside className="w-80 md:w-96 border-l border-theme-border/80 bg-theme-surface/95 backdrop-blur-xl flex flex-col justify-between z-10 shrink-0 shadow-2xl overflow-hidden transition-colors">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Step Badge & Standard ID */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span
                  className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg text-white shadow-sm"
                  style={{ backgroundColor: currentStep.laneColor || 'var(--theme-accent, #38bdf8)' }}
                >
                  {nodeData.standardId || `PASO-${currentStep.stepNumber}`}
                </span>
                <span className="text-xs font-mono text-theme-text-muted uppercase tracking-wider">
                  {nodeData.nodeType}
                </span>
              </div>

              {currentStep.slaText && (
                <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px]">
                  <Clock className="w-3 h-3" />
                  <span>{currentStep.slaText}</span>
                </div>
              )}
            </div>

            {/* Step Title & Responsible Role */}
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-theme-accent font-semibold">
                <User className="w-3.5 h-3.5" />
                <span>{currentStep.roleName}</span>
              </div>
              <h2 className="text-lg font-black text-theme-text leading-snug tracking-tight">
                {nodeData.title || 'Paso del Proceso'}
              </h2>
            </div>

            {/* Description */}
            <div className="space-y-1.5 bg-theme-surface-subtle p-3.5 rounded-xl border border-theme-border">
              <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-theme-accent uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                <span>Descripción del Paso</span>
              </div>
              <p className="text-xs text-theme-text leading-relaxed">
                {nodeData.description || 'Sin descripción detallada registrada para esta actividad.'}
              </p>
            </div>

            {/* IT System & Lead Time / SLA Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-theme-surface-subtle border border-theme-border space-y-1">
                <div className="flex items-center space-x-1 text-[10px] text-theme-text-muted font-mono uppercase">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Tiempo / SLA</span>
                </div>
                <div className="font-bold text-theme-text truncate">
                  {currentStep.slaText || 'No aplica'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-theme-surface-subtle border border-theme-border space-y-1">
                <div className="flex items-center space-x-1 text-[10px] text-theme-text-muted font-mono uppercase">
                  <Server className="w-3 h-3 text-cyan-400" />
                  <span>Sistema TI</span>
                </div>
                <div className="font-bold text-theme-text truncate">
                  {nodeData.itSystem || 'Manual / Físico'}
                </div>
              </div>
            </div>

            {/* Inputs & Outputs */}
            <div className="space-y-3">
              {/* Inputs */}
              {nodeData.inputs && nodeData.inputs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    <CheckSquare className="w-3 h-3" />
                    <span>Entradas Requeridas (Inputs)</span>
                  </div>
                  <div className="space-y-1">
                    {nodeData.inputs.map((inp, i) => (
                      <div
                        key={i}
                        className="flex items-start space-x-2 text-xs text-theme-text bg-emerald-500/5 border border-emerald-500/20 p-2 rounded-lg"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{inp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outputs */}
              {nodeData.outputs && nodeData.outputs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1 text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider">
                    <ArrowRight className="w-3 h-3" />
                    <span>Salidas / Entregables (Outputs)</span>
                  </div>
                  <div className="space-y-1">
                    {nodeData.outputs.map((out, i) => (
                      <div
                        key={i}
                        className="flex items-start space-x-2 text-xs text-theme-text bg-sky-500/5 border border-sky-500/20 p-2 rounded-lg"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                        <span>{out}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Legal Framework & Normatives */}
            {nodeData.legalFramework && (
              <div className="space-y-1.5 bg-purple-500/5 p-3 rounded-xl border border-purple-500/20">
                <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                  <Scale className="w-3 h-3" />
                  <span>Marco Legal & Normativa</span>
                </div>
                <div className="text-xs text-purple-200">
                  {nodeData.legalFramework}
                </div>
              </div>
            )}

            {/* Quality & Risks */}
            {nodeData.operationalRisks && nodeData.operationalRisks.length > 0 && (
              <div className="space-y-1.5 bg-red-500/5 p-3 rounded-xl border border-red-500/20">
                <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Riesgos Operacionales (ISO 9001)</span>
                </div>
                <div className="space-y-1">
                  {nodeData.operationalRisks.map((risk, i) => (
                    <div key={i} className="text-xs text-red-300">
                      &bull; {typeof risk === 'string' ? risk : (risk.description || (risk as any).title || 'Riesgo operacional')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Relations (Previous & Next) */}
            <div className="pt-2 border-t border-theme-border space-y-2">
              <div className="text-[10px] font-mono font-bold text-theme-text-muted uppercase tracking-wider flex items-center space-x-1">
                <GitBranch className="w-3 h-3" />
                <span>Navegación del Flujo</span>
              </div>

              {/* Next branch jump buttons */}
              {currentStep.nextSteps.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] text-theme-text-muted">Continúa hacia:</div>
                  {currentStep.nextSteps.map((next) => (
                    <button
                      key={next.id}
                      onClick={() => {
                        const idx = steps.findIndex((s) => s.node.id === next.id);
                        if (idx !== -1) {
                          setCurrentStepIndex(idx);
                          setTimeRemaining(autoplaySeconds);
                        }
                      }}
                      className="w-full text-left p-2 rounded-lg bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border text-xs flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <ArrowRight className="w-3.5 h-3.5 text-theme-accent shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        <span className="font-mono text-[10px] text-emerald-400">{next.standardId}</span>
                        <span className="truncate text-theme-text">{next.title}</span>
                      </div>
                      {next.conditionText && (
                        <span className="text-[9px] font-mono text-amber-400 px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 shrink-0 ml-1">
                          {next.conditionText}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
