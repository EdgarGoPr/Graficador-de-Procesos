import React, { useState, useEffect } from 'react';
import { useUiStore, ActiveView } from '../../store/useUiStore';
import { useProjectStore } from '../../store/useProjectStore';
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Sparkles,
  LayoutDashboard,
  GitGraph,
  Wand2,
  FileCheck,
  Database,
  Users
} from 'lucide-react';

interface TourStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  description: string;
  tip: string;
  targetView?: ActiveView;
  positionClass: string;
  icon: React.FC<{ className?: string }>;
}

const TOUR_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    title: '1. Gestor de Proyectos y Permisos por Proceso',
    subtitle: 'Panel Principal (Dashboard)',
    description:
      'Aquí visualizas todos los procesos a los que tienes acceso. En cada tarjeta puedes editar su ficha, duplicar versiones o abrir el botón "Participantes" para otorgar permisos de Solo Lectura, Comentarios o Editor (por usuario o por Unidad Organizativa completa).',
    tip: 'Si eliminas un proyecto por error, puedes recuperarlo desde la Papelera en el botón Catálogos ABM.',
    targetView: 'DASHBOARD',
    positionClass: 'top-20 left-8',
    icon: LayoutDashboard
  },
  {
    stepNumber: 2,
    title: '2. Centro Maestro de Catálogos y ABMs',
    subtitle: 'Estandarización sin Tipeo Repetitivo',
    description:
      'Desde el botón "Catálogos ABM" en la barra superior administras las Altas, Bajas y Modificaciones de Unidades Organizativas, Cargos/Carriles, Leyes, Sistemas, Formularios y Riesgos. Todo lo cargado allí aparece en listas desplegables en toda la aplicación.',
    tip: 'Desde la pestaña "Cargos y Carriles" puedes enviar cualquier rol directamente como Carril al lienzo con 1 clic.',
    positionClass: 'top-20 right-8',
    icon: Database
  },
  {
    stepNumber: 3,
    title: '3. El Lienzo BPMN 2.0 y la Paleta de Elementos',
    subtitle: 'Espacio de Graficación Optimizada',
    description:
      'A la izquierda tienes la Paleta de Actividades (Inicio, Tareas, Compuertas de Decisión, Controles de Calidad y Notas). Arrástralos hacia los carriles del lienzo y únelos tirando desde los puntos de conexión.',
    tip: 'En modo "Comentarios", el sistema protege el diagrama y habilita únicamente el uso de Notas Adhesivas de revisión.',
    targetView: 'CANVAS',
    positionClass: 'bottom-10 left-8',
    icon: GitGraph
  },
  {
    stepNumber: 4,
    title: '4. Generador desde Texto/Plantillas y Auto-Ordenar',
    subtitle: 'Ahorra Días de Diagramación',
    description:
      'En el menú "Herramientas" de la barra superior cuentas con dos súper poderes: "Generar desde Texto / Plantillas" (que dibuja todo el diagrama automáticamente a partir de una descripción escrita) y "Auto-Ordenar Lienzo" (que alinea todas las figuras sin cruces en 1 segundo).',
    tip: 'También puedes presionar Ctrl + K en cualquier momento para buscar herramientas o saltar entre procesos.',
    targetView: 'CANVAS',
    positionClass: 'top-20 left-1/2 -translate-x-1/2',
    icon: Wand2
  },
  {
    stepNumber: 5,
    title: '5. Inspector de Propiedades y Bóveda IA',
    subtitle: 'Documentación en Segundos',
    description:
      'Al seleccionar cualquier actividad en el lienzo, el panel derecho te permite definir su Responsable, Sistema TI, Plazo SLA, Entradas/Salidas y Riesgos eligiendo directamente desde tus Catálogos ABM.',
    tip: 'En la Bóveda de Contexto IA puedes incluso grabar notas de voz o subir normas en PDF/Word para que el asistente te sugiera mejoras.',
    targetView: 'CANVAS',
    positionClass: 'bottom-10 right-8',
    icon: Users
  },
  {
    stepNumber: 6,
    title: '6. Manual Oficial en PDF Estandarizado (ISO 9001)',
    subtitle: 'Documentación 100% Automatizada',
    description:
      'En la vista "Documento & Manual PDF" puedes revisar el informe completo, completar o autogenerar con 1 clic los Datos Complementarios (Alcance, Políticas, KPIs, Glosario y Firmas) y descargar el Manual Oficial en PDF foliado con Mapa Gráfico, Paso a Paso, SIPOC y RACI.',
    tip: '¡Has completado el recorrido! Puedes volver a consultar el tutorial cuando quieras desde el icono 🎓 en la cabecera.',
    targetView: 'REPORT',
    positionClass: 'top-20 left-1/2 -translate-x-1/2',
    icon: FileCheck
  }
];

export const InteractiveTourOverlay: React.FC = () => {
  const {
    isInteractiveTourActive,
    setInteractiveTourActive,
    setActiveView,
    setTutorialModalOpen
  } = useUiStore();
  const { currentProject, projectList, openProject } = useProjectStore();

  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  useEffect(() => {
    if (isInteractiveTourActive) {
      setCurrentStepIdx(0);
    }
  }, [isInteractiveTourActive]);

  useEffect(() => {
    if (!isInteractiveTourActive) return;
    const step = TOUR_STEPS[currentStepIdx];
    if (!step) return;

    // Si el paso requiere un proyecto abierto (CANVAS o REPORT) y no hay ninguno, abrir el primero disponible
    if ((step.targetView === 'CANVAS' || step.targetView === 'REPORT') && !currentProject && projectList.length > 0) {
      openProject(projectList[0].fileName).then(() => {
        if (step.targetView) setActiveView(step.targetView);
      });
    } else if (step.targetView) {
      setActiveView(step.targetView);
    }
  }, [isInteractiveTourActive, currentStepIdx]);

  if (!isInteractiveTourActive) return null;

  const step = TOUR_STEPS[currentStepIdx];
  const Icon = step.icon;
  const isLast = currentStepIdx === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none">
      {/* Subtle Spotlight Backdrop */}
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px] pointer-events-auto" />

      {/* Floating Tour Card */}
      <div
        className={`fixed ${step.positionClass} z-50 w-full max-w-md bg-theme-surface border-2 border-theme-accent rounded-2xl shadow-2xl p-5 pointer-events-auto transition-all duration-300 animate-fadeIn`}
      >
        {/* Top Badge & Close */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-theme-accent/15 text-theme-accent border border-theme-accent/30">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-theme-accent block">
                {step.subtitle}
              </span>
              <span className="text-[11px] font-mono text-theme-text-muted">
                Paso {step.stepNumber} de {TOUR_STEPS.length}
              </span>
            </div>
          </div>

          <button
            onClick={() => setInteractiveTourActive(false)}
            className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle cursor-pointer"
            title="Salir del recorrido"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-theme-surface-subtle rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#0284C7] to-[#10B981] transition-all duration-300"
            style={{ width: `${((currentStepIdx + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <h3 className="text-sm font-extrabold text-theme-text">{step.title}</h3>
        <p className="text-xs text-theme-text-muted mt-1.5 leading-relaxed">{step.description}</p>

        <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-300 leading-snug">{step.tip}</p>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between">
          <button
            disabled={currentStepIdx === 0}
            onClick={() => setCurrentStepIdx((i) => Math.max(0, i - 1))}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-theme-border text-xs font-semibold text-theme-text-muted hover:text-theme-text disabled:opacity-40 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setInteractiveTourActive(false);
                setTutorialModalOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-xl text-[11px] text-theme-text-muted hover:text-theme-accent cursor-pointer"
            >
              Ver Guía Completa
            </button>

            {isLast ? (
              <button
                onClick={() => setInteractiveTourActive(false)}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>¡Finalizar Tour!</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentStepIdx((i) => Math.min(TOUR_STEPS.length - 1, i + 1))}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-theme-accent hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-sky-500/25 cursor-pointer"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

