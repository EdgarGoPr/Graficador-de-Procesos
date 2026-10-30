import React, { useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import {
  GraduationCap,
  Rocket,
  GitGraph,
  FileCheck,
  Database,
  Keyboard,
  Play,
  X,
  CheckCircle2,
  Sparkles,
  Users,
  Wand2,
  Layers
} from 'lucide-react';

type TutorialTab = 'QUICK_START' | 'CANVAS_GUIDE' | 'PDF_MANUAL' | 'ABM_PERMS' | 'SHORTCUTS';

export const TutorialCenterModal: React.FC = () => {
  const {
    isTutorialModalOpen,
    setTutorialModalOpen,
    setInteractiveTourActive
  } = useUiStore();

  const [activeTab, setActiveTab] = useState<TutorialTab>('QUICK_START');

  if (!isTutorialModalOpen) return null;

  const handleStartInteractiveTour = () => {
    setTutorialModalOpen(false);
    setInteractiveTourActive(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-5xl h-[86vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border bg-theme-surface-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-theme-text">
                  Centro de Aprendizaje & Tutorial de Uso de ProcesStudio
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  Guía Práctica Paso a Paso
                </span>
              </div>
              <p className="text-xs text-theme-text-muted mt-0.5">
                Aprende en pocos minutos cómo graficar procesos optimizados y obtener el Manual PDF estandarizado automáticamente.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleStartInteractiveTour}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Iniciar Tour Guiado en Pantalla</span>
            </button>

            <button
              onClick={() => setTutorialModalOpen(false)}
              className="p-2 rounded-xl text-theme-text-muted hover:text-theme-text hover:bg-theme-surface cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-theme-surface border-b border-theme-border flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('QUICK_START')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'QUICK_START'
                ? 'bg-theme-accent text-white shadow-md shadow-sky-500/20'
                : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>1. Inicio Rápido (5 Pasos)</span>
          </button>

          <button
            onClick={() => setActiveTab('CANVAS_GUIDE')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'CANVAS_GUIDE'
                ? 'bg-theme-accent text-white shadow-md shadow-sky-500/20'
                : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle'
            }`}
          >
            <GitGraph className="w-3.5 h-3.5" />
            <span>2. Cómo Graficar en el Lienzo</span>
          </button>

          <button
            onClick={() => setActiveTab('PDF_MANUAL')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'PDF_MANUAL'
                ? 'bg-theme-accent text-white shadow-md shadow-sky-500/20'
                : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>3. Manual PDF Automatizado</span>
          </button>

          <button
            onClick={() => setActiveTab('ABM_PERMS')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ABM_PERMS'
                ? 'bg-theme-accent text-white shadow-md shadow-sky-500/20'
                : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>4. Catálogos ABM y Permisos</span>
          </button>

          <button
            onClick={() => setActiveTab('SHORTCUTS')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'SHORTCUTS'
                ? 'bg-theme-accent text-white shadow-md shadow-sky-500/20'
                : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>5. Atajos y Productividad</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: QUICK START */}
          {activeTab === 'QUICK_START' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-500/15 to-emerald-500/10 border border-sky-500/30">
                <h3 className="text-sm font-extrabold text-theme-text flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>¿Cómo funciona ProcesStudio? De Cero al Manual PDF en 5 Pasos</span>
                </h3>
                <p className="text-xs text-theme-text-muted mt-1 leading-relaxed">
                  El sistema fue diseñado para que no tengas que dibujar cajas manualmente durante días ni redactar extensos manuales en Word. Todo lo que graficas en el lienzo genera automáticamente las matrices de calidad y el documento PDF oficial.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                {[
                  {
                    step: 'PASO 1',
                    title: 'Carga tus Catálogos ABM',
                    desc: 'En el botón "Catálogos ABM" registra una sola vez las Unidades Organizativas, Cargos/Roles, Sistemas y Leyes de tu institución.',
                    color: 'text-sky-400 border-sky-500/30 bg-sky-500/10'
                  },
                  {
                    step: 'PASO 2',
                    title: 'Crea o Genera el Proceso',
                    desc: 'Haz clic en "+ Nuevo Proceso". Puedes usar el "Generador IA desde Texto/Plantillas" para que el sistema dibuje todo el flujo inicial por ti.',
                    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  },
                  {
                    step: 'PASO 3',
                    title: 'Modela y Auto-Ordena',
                    desc: 'Arrastra tareas, decisiones o notas desde la paleta izquierda. Presiona "✨ Auto-Ordenar" para alinear todo el diagrama en 1 clic.',
                    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10'
                  },
                  {
                    step: 'PASO 4',
                    title: 'Enriquece con 1 Clic',
                    desc: 'Haz clic en cada actividad para elegir su Responsable, Tiempo SLA, Entradas/Salidas y Riesgos desde los desplegables del panel derecho.',
                    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                  },
                  {
                    step: 'PASO 5',
                    title: 'Descarga el Manual PDF',
                    desc: 'Ve a "Vistas ➔ Documento PDF" o "Exportar" y descarga el Manual Oficial ISO 9001 con Portada, Mapa, Paso a Paso, SIPOC, RACI y Firmas.',
                    color: 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                  }
                ].map((item) => (
                  <div
                    key={item.step}
                    className="p-4 rounded-2xl bg-theme-surface-subtle border border-theme-border flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <span className={`inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${item.color}`}>
                        {item.step}
                      </span>
                      <h4 className="text-sm font-bold text-theme-text mt-2.5">{item.title}</h4>
                      <p className="text-xs text-theme-text-muted mt-1.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CANVAS GUIDE */}
          {activeTab === 'CANVAS_GUIDE' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider font-mono text-theme-accent">
                Diccionario Visual de Herramientas del Lienzo BPMN 2.0
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: '🟢 Evento de Inicio y 🔴 Evento de Fin',
                    body: 'Todo proceso comienza con un Evento de Inicio (ej. ingreso de solicitud) y concluye en uno o más Eventos de Fin (ej. expediente resuelto y archivado).'
                  },
                  {
                    title: '🟦 Tareas de Usuario, Servicio TI y Manuales',
                    body: 'Representan las actividades concretas. Al hacerles clic, se abre el Inspector Derecho donde defines qué rol la ejecuta, en qué sistema, cuánto tiempo demora (SLA) y qué documentos entran o salen.'
                  },
                  {
                    title: '🔶 Compuertas de Decisión (Exclusiva XOR y Paralela AND)',
                    body: 'Úsalas cuando el camino se bifurca (ej. "¿Cumple requisitos?"). Conecta una flecha hacia el camino del "SÍ" y otra hacia el "NO". Doble clic sobre cualquier flecha te permite escribir la condición.'
                  },
                  {
                    title: '🏊 Carriles Funcionales (Swimlanes por Área / Rol)',
                    body: 'Bandas horizontales que representan a cada Unidad Organizativa o Cargo. Cuando colocas una tarea dentro de un carril, hereda automáticamente ese responsable y sistema.'
                  },
                  {
                    title: '✨ Botón "Texto a Diagrama" y "Auto-Ordenar Lienzo"',
                    body: 'En el menú Herramientas tienes el Generador Automático (que crea todo el gráfico a partir de un párrafo escrito) y el botón Auto-Ordenar que prolija todas las cajas y flechas instantáneamente.'
                  },
                  {
                    title: '🟨 Notas Adhesivas (Modo Comentarios y Revisión)',
                    body: 'Permiten dejar observaciones de auditoría sobre el lienzo y vincularlas con línea punteada a cualquier actividad, sin alterar el flujo del proceso.'
                  }
                ].map((card, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-theme-surface-subtle border border-theme-border space-y-1.5">
                    <h4 className="text-xs font-bold text-theme-text">{card.title}</h4>
                    <p className="text-xs text-theme-text-muted leading-relaxed">{card.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PDF MANUAL */}
          {activeTab === 'PDF_MANUAL' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-theme-surface-subtle border border-theme-border space-y-3">
                <h3 className="text-sm font-bold text-theme-accent flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  <span>Cómo obtener el Manual de Procedimientos Estandarizado en PDF</span>
                </h3>
                <p className="text-xs text-theme-text-muted leading-relaxed">
                  Al abrir la vista <strong>&quot;Vistas &amp; Matrices ➔ Documento &amp; Manual PDF&quot;</strong> encontrarás tres pestañas:
                </p>
                <ul className="space-y-2 text-xs text-theme-text list-disc list-inside leading-relaxed">
                  <li>
                    <strong>1. Vista Previa del Manual:</strong> Muestra el documento normativo estructurado en vivo.
                  </li>
                  <li>
                    <strong>2. Datos Complementarios &amp; Firmas:</strong> Te permite agregar o editar el <em>Alcance Detallado, Políticas de Operación, Indicadores KPIs, Glosario y nombres de quienes Elaboran, Revisan y Aprueban</em>. Cuenta con el botón <strong>&quot;✨ Regenerar Automáticamente desde el Gráfico&quot;</strong> para redactar todo por ti.
                  </li>
                  <li>
                    <strong>3. Botón &quot;Descargar Manual Estandarizado PDF (ISO 9001)&quot;:</strong> Compila en segundos un archivo PDF oficial foliado (<em>Página X de Y</em>) que incluye Portada, Control Documental, Mapa Gráfico BPMN incrustado, Paso a Paso por Rol, Matriz SIPOC, Matriz RACI, Riesgos, Historial de Versiones, Firmas y Sello Criptográfico SHA-256.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: ABM & PERMISSIONS */}
          {activeTab === 'ABM_PERMS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-theme-surface-subtle border border-theme-border space-y-2.5">
                <div className="flex items-center space-x-2 text-theme-accent font-bold text-xs uppercase font-mono">
                  <Database className="w-4 h-4" />
                  <span>Centro Maestro de Catálogos (ABMs)</span>
                </div>
                <p className="text-xs text-theme-text-muted leading-relaxed">
                  Desde el botón <strong>Catálogos ABM</strong> en la barra superior puedes dar de Alta, Baja y Modificar:
                </p>
                <ul className="space-y-1.5 text-xs text-theme-text list-disc list-inside">
                  <li><strong>Unidades Organizativas:</strong> Secretarías, Direcciones y Departamentos.</li>
                  <li><strong>Cargos y Carriles:</strong> Roles funcionales con envío en 1 clic al lienzo.</li>
                  <li><strong>Marco Normativo:</strong> Leyes, Decretos, Resoluciones e ISO.</li>
                  <li><strong>Sistemas y Formularios:</strong> Software, expedientes y planillas.</li>
                  <li><strong>Riesgos y Controles:</strong> Catálogo preventivo/detectivo reutilizable.</li>
                  <li><strong>Papelera de Proyectos:</strong> Restauración inmediata de procesos eliminados.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-theme-surface-subtle border border-theme-border space-y-2.5">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase font-mono">
                  <Users className="w-4 h-4" />
                  <span>Gestión de Usuarios y Permisos por Lienzo</span>
                </div>
                <p className="text-xs text-theme-text-muted leading-relaxed">
                  Cada proceso cuenta con el botón <strong>Participantes</strong> (disponible para el Creador y Administradores):
                </p>
                <ul className="space-y-1.5 text-xs text-theme-text list-disc list-inside">
                  <li><strong>👁️ Solo Lectura:</strong> Permite consultar el proceso y descargar el PDF sin alterar nada.</li>
                  <li><strong>💬 Comentarios:</strong> Habilita colocar únicamente Notas Adhesivas de revisión.</li>
                  <li><strong>✏️ Editor:</strong> Autoriza modelar el diagrama y guardar versiones.</li>
                  <li><strong>🏢 Permisos por Área:</strong> Permite habilitar a toda una Unidad Organizativa completa en 1 clic.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: SHORTCUTS */}
          {activeTab === 'SHORTCUTS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { keys: 'Ctrl + K', label: 'Abrir Buscador Global y Paleta de Comandos Rápida' },
                { keys: 'Ctrl + S', label: 'Guardar cambios del proyecto actual inmediatamente' },
                { keys: 'Ctrl + Z', label: 'Deshacer última acción en el lienzo (Undo)' },
                { keys: 'Ctrl + Y', label: 'Rehacer acción en el lienzo (Redo)' },
                { keys: 'F5', label: 'Iniciar Modo Presentación Cinematográfica (Estilo Prezi)' },
                { keys: 'Doble Clic', label: 'En un Subproceso abre su lienzo interno; en una flecha edita su condición' }
              ].map((sc) => (
                <div key={sc.keys} className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border flex flex-col justify-between">
                  <kbd className="self-start px-2.5 py-1 rounded-lg bg-theme-surface border border-theme-accent/40 text-theme-accent font-mono text-xs font-bold">
                    {sc.keys}
                  </kbd>
                  <p className="text-xs text-theme-text mt-2.5 leading-relaxed">{sc.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-theme-surface-subtle border-t border-theme-border flex items-center justify-between shrink-0">
          <span className="text-xs text-theme-text-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Puedes abrir este centro de ayuda en cualquier momento desde el icono de birrete 🎓 en la barra superior.
          </span>
          <button
            onClick={() => setTutorialModalOpen(false)}
            className="px-4 py-1.5 rounded-xl bg-theme-surface hover:bg-theme-surface-hover border border-theme-border text-xs font-bold text-theme-text cursor-pointer"
          >
            Entendido, Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

