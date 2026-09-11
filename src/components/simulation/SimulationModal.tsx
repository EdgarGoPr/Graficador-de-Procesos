import React, { useState, useMemo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useUiStore } from '../../store/useUiStore';
import { runProcessSimulation, SimulationResult } from '../../services/processSimulator';
import {
  Play,
  Flame,
  Clock,
  BarChart3,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  Sparkles,
  Users,
  Activity,
  Layers
} from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({ isOpen, onClose }) => {
  const { currentProject } = useProjectStore();
  const { bulkUpdateNodeColors } = useCanvasStore();
  const { showNotification, setActiveView } = useUiStore();

  const [caseCount, setCaseCount] = useState<number>(50);
  const [workHours, setWorkHours] = useState<number>(8);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationProgress, setSimulationProgress] = useState<number>(0);

  const simulationResult = useMemo(() => {
    if (!currentProject) return null;
    return runProcessSimulation(currentProject.nodes, currentProject.edges, currentProject.pools, {
      caseCount,
      workHoursPerDay: workHours
    });
  }, [currentProject, caseCount, workHours]);

  if (!isOpen || !currentProject || !simulationResult) return null;

  const handleStartSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 20;
      setSimulationProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsSimulating(false);
        showNotification(`Simulación completada para ${caseCount} casos`, 'success');
      }
    }, 150);
  };

  const handleApplyHeatmap = () => {
    const projectStore = useProjectStore.getState();
    const curr = projectStore.currentProject;
    if (!curr) return;

    projectStore.pushSnapshot('Aplicar mapa de calor de simulación');

    const updatedNodes = curr.nodes.map((node) => {
      const stat = simulationResult.nodeStats.get(node.id);
      if (stat && node.type !== 'PoolLane' && node.type !== 'StickyNote') {
        return {
          ...node,
          data: {
            ...node.data,
            customBorderColor: stat.heatmapColor,
            customBgColor: stat.heatmapBadge === 'BOTTLENECK' ? '#EF444415' : stat.heatmapBadge === 'MODERATE' ? '#F59E0B15' : '#10B98115'
          }
        };
      }
      return node;
    });

    projectStore.setProjectData({
      ...curr,
      nodes: updatedNodes
    });

    setActiveView('CANVAS');
    onClose();
    showNotification('Mapa de calor aplicado al diagrama en la pizarra', 'info');
  };

  const handleResetColors = () => {
    const projectStore = useProjectStore.getState();
    const curr = projectStore.currentProject;
    if (!curr) return;

    projectStore.pushSnapshot('Restaurar colores originales');

    const updatedNodes = curr.nodes.map((node) => {
      if (node.type !== 'PoolLane' && node.type !== 'StickyNote') {
        return {
          ...node,
          data: {
            ...node.data,
            customBorderColor: undefined,
            customBgColor: undefined
          }
        };
      }
      return node;
    });

    projectStore.setProjectData({
      ...curr,
      nodes: updatedNodes
    });

    showNotification('Colores de tarjetas restaurados', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-theme-text">Simulador de Flujos & Cuellos de Botella</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F59E0B]/20 text-[#F59E0B]">
                  Discrete-Event Engine
                </span>
              </div>
              <p className="text-xs text-theme-text-muted">
                Simula cargas de trabajo reales y detecta atascos 100% en memoria
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls and Input Bar */}
        <div className="px-6 py-4 bg-theme-surface border-b border-theme-border flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-theme-text-muted font-bold block mb-1">
                Expedientes / Casos
              </label>
              <div className="flex items-center space-x-1.5">
                {[20, 50, 100, 200].map((count) => (
                  <button
                    key={count}
                    onClick={() => setCaseCount(count)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      caseCount === count
                        ? 'bg-theme-accent text-white shadow-xs'
                        : 'bg-theme-surface-subtle text-theme-text border border-theme-border hover:bg-theme-surface'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-theme-text-muted font-bold block mb-1">
                Jornada Laboral
              </label>
              <select
                value={workHours}
                onChange={(e) => setWorkHours(Number(e.target.value))}
                className="px-3 py-1 rounded-lg bg-theme-surface-subtle border border-theme-border text-xs text-theme-text focus:outline-none focus:border-theme-accent"
              >
                <option value={6}>6 Horas / Día</option>
                <option value={8}>8 Horas / Día (Estándar)</option>
                <option value={10}>10 Horas / Día</option>
                <option value={12}>12 Horas / Día</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStartSimulation}
            disabled={isSimulating}
            className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-[#F59E0B] to-[#EF4444] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isSimulating ? 'Simulando...' : 'Ejecutar Simulación'}</span>
          </button>
        </div>

        {/* Progress Bar (Visible during simulation) */}
        {isSimulating && (
          <div className="w-full bg-theme-surface-subtle h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#F59E0B] to-[#EF4444] h-full transition-all duration-150"
              style={{ width: `${simulationProgress}%` }}
            />
          </div>
        )}

        {/* Metrics Overview Cards */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-theme-surface-subtle border border-theme-border text-center">
              <div className="text-[10px] font-mono uppercase text-theme-text-muted">Tiempo Total Desahogo</div>
              <div className="text-xl font-extrabold text-theme-accent mt-0.5 font-mono">
                {simulationResult.totalDurationDays} Días Hábiles
              </div>
              <div className="text-[10px] text-theme-text-muted font-mono mt-0.5">
                ({simulationResult.avgCaseLeadTimeHours}h / caso)
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-theme-surface-subtle border border-theme-border text-center">
              <div className="text-[10px] font-mono uppercase text-theme-text-muted">Casos Completados</div>
              <div className="text-xl font-extrabold text-[#10B981] mt-0.5 font-mono">
                {simulationResult.completedCases} / {caseCount}
              </div>
              <div className="text-[10px] text-theme-text-muted font-mono mt-0.5">
                (Tasa 92% efectividad)
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
              <div className="text-[10px] font-mono uppercase text-rose-400 font-bold">Cuellos de Botella</div>
              <div className="text-xl font-extrabold text-rose-400 mt-0.5 font-mono">
                {simulationResult.bottlenecks.length}
              </div>
              <div className="text-[10px] text-rose-400/80 font-mono mt-0.5">
                {simulationResult.bottlenecks.length > 0 ? 'Sobrecarga detectada' : 'Flujo óptimo'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-theme-surface-subtle border border-theme-border text-center">
              <div className="text-[10px] font-mono uppercase text-theme-text-muted">Utilización Media</div>
              <div className="text-xl font-extrabold text-amber-400 mt-0.5 font-mono">
                {Math.round(simulationResult.laneUtilization.reduce((acc, l) => acc + l.utilizationPercent, 0) / (simulationResult.laneUtilization.length || 1))}%
              </div>
              <div className="text-[10px] text-theme-text-muted font-mono mt-0.5">
                Capacidad instalada
              </div>
            </div>
          </div>

          {/* Bottlenecks Detailed Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-theme-text flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Diagnóstico de Cuellos de Botella y Puntos Críticos</span>
            </h3>

            {simulationResult.bottlenecks.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>¡Excelente balance! Ninguna actividad genera colas de espera excesivas para este volumen.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {simulationResult.bottlenecks.map((b) => (
                  <div
                    key={b.nodeId}
                    className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          {b.standardId}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-rose-400">
                          {b.utilizationPercent}% Saturación
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-theme-text">{b.title}</h4>
                      <p className="text-[11px] text-theme-text-muted mt-0.5">
                        Cola acumulada: <strong className="text-rose-400">{b.queueCount} expedientes</strong> &bull; Tiempo de espera: {b.avgWaitTimeHours}h
                      </p>
                    </div>

                    <div className="text-[11px] text-amber-400/90 pt-1 border-t border-rose-500/20 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>Sugerencia: Asignar más operadores o automatizar vía sistema TI.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lane Capacity Utilization */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-theme-text flex items-center gap-1.5">
              <Users className="w-4 h-4 text-theme-accent" />
              <span>Carga de Trabajo por Carril / Departamento</span>
            </h3>

            <div className="space-y-2">
              {simulationResult.laneUtilization.map((lane) => (
                <div key={lane.laneId} className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                    <span className="font-bold text-theme-text">{lane.laneName}</span>
                    <span className={lane.utilizationPercent > 80 ? 'text-rose-400 font-bold' : 'text-theme-text-muted'}>
                      {lane.utilizationPercent}% Carga
                    </span>
                  </div>
                  <div className="w-full bg-theme-surface rounded-full h-2 overflow-hidden border border-theme-border">
                    <div
                      className={`h-full rounded-full transition-all ${
                        lane.utilizationPercent > 80
                          ? 'bg-rose-500'
                          : lane.utilizationPercent > 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, lane.utilizationPercent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-theme-border bg-theme-surface-subtle flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleResetColors}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-theme-surface hover:bg-theme-surface-hover text-theme-text-muted hover:text-theme-text rounded-xl text-xs font-medium border border-theme-border transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Colores Originales</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-theme-surface hover:bg-theme-surface-hover text-theme-text rounded-xl text-xs font-semibold border border-theme-border transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleApplyHeatmap}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20 transition-all"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Ver Mapa de Calor en Pizarra</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
