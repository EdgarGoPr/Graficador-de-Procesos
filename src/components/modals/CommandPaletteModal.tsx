import React, { useState, useEffect, useMemo } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useProjectStore } from '../../store/useProjectStore';
import { autoLayoutProcessCanvas } from '../../services/autoLayoutAndGeneratorService';
import { exportFullStandardizedManualPdf } from '../../services/pdfFullManualExportService';
import {
  Search,
  Database,
  Wand2,
  Sparkles,
  FileCheck,
  Table,
  Workflow,
  LayoutDashboard,
  GitGraph,
  GraduationCap,
  Download,
  X,
  ArrowRight
} from 'lucide-react';

export const CommandPaletteModal: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setActiveView,
    setMasterCatalogsModalOpen,
    setTextToDiagramModalOpen,
    setTutorialModalOpen,
    setInteractiveTourActive,
    setExportCenterModalOpen,
    showNotification
  } = useUiStore();

  const { currentProject, projectList, openProject, setProjectData, pushSnapshot } = useProjectStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) setQuery('');
  }, [isCommandPaletteOpen]);

  const actions = useMemo(() => {
    const baseActions = [
      {
        id: 'act_pdf_manual',
        title: 'Descargar Manual Oficial de Procedimientos en PDF (ISO 9001 Completo)',
        category: 'Documentación & Exportación',
        icon: Download,
        run: async () => {
          if (!currentProject) {
            showNotification('Abre primero un proyecto para descargar su Manual PDF', 'warning');
            return;
          }
          const fn = await exportFullStandardizedManualPdf(currentProject);
          showNotification(`Manual PDF descargado: ${fn}`, 'success');
        }
      },
      {
        id: 'act_text_to_diagram',
        title: 'Generar Diagrama BPMN desde Texto o Usar Plantilla Pre-Armada',
        category: 'Optimización del Lienzo',
        icon: Wand2,
        run: () => setTextToDiagramModalOpen(true)
      },
      {
        id: 'act_auto_layout',
        title: 'Auto-Ordenar y Alinear el Lienzo Actual (Magic Auto-Layout)',
        category: 'Optimización del Lienzo',
        icon: Sparkles,
        run: () => {
          if (!currentProject) {
            showNotification('Abre primero un proyecto en el lienzo', 'warning');
            return;
          }
          pushSnapshot('Antes de Auto-Ordenar Lienzo');
          const aligned = autoLayoutProcessCanvas(currentProject);
          setProjectData(aligned);
          setActiveView('CANVAS');
          showNotification('✨ Lienzo auto-ordenado y alineado por carril', 'success');
        }
      },
      {
        id: 'act_abm_catalogs',
        title: 'Abrir Centro Maestro de Catálogos y ABMs (Áreas, Roles, Leyes, Sistemas, Riesgos)',
        category: 'Catálogos & ABMs',
        icon: Database,
        run: () => setMasterCatalogsModalOpen(true)
      },
      {
        id: 'act_tutorial_tour',
        title: 'Iniciar Recorrido Guiado Interactivo (Tutorial Paso a Paso)',
        category: 'Ayuda & Capacitación',
        icon: GraduationCap,
        run: () => setInteractiveTourActive(true)
      },
      {
        id: 'act_tutorial_center',
        title: 'Abrir Manual de Uso y Diccionario Visual BPMN',
        category: 'Ayuda & Capacitación',
        icon: GraduationCap,
        run: () => setTutorialModalOpen(true)
      },
      {
        id: 'act_view_report',
        title: 'Ir a Documento del Proceso & Ficha Complementaria PDF',
        category: 'Navegación',
        icon: FileCheck,
        run: () => setActiveView('REPORT')
      },
      {
        id: 'act_view_sipoc',
        title: 'Ir a Matriz SIPOC (Proveedores, Entradas, Proceso, Salidas, Clientes)',
        category: 'Navegación',
        icon: Table,
        run: () => setActiveView('SIPOC')
      },
      {
        id: 'act_view_raci',
        title: 'Ir a Matriz de Responsabilidades RACI',
        category: 'Navegación',
        icon: Workflow,
        run: () => setActiveView('RACI')
      },
      {
        id: 'act_view_canvas',
        title: 'Ir al Lienzo de Trabajo BPMN 2.0',
        category: 'Navegación',
        icon: GitGraph,
        run: () => setActiveView('CANVAS')
      },
      {
        id: 'act_view_dashboard',
        title: 'Ir al Panel Principal de Proyectos (Dashboard)',
        category: 'Navegación',
        icon: LayoutDashboard,
        run: () => setActiveView('DASHBOARD')
      },
      {
        id: 'act_export_center',
        title: 'Abrir Centro de Exportación (PDF, Word, PNG, SVG, BPMN XML)',
        category: 'Documentación & Exportación',
        icon: Download,
        run: () => setExportCenterModalOpen(true)
      }
    ];

    const projectActions = projectList.slice(0, 12).map((p) => ({
      id: `proj_${p.fileName}`,
      title: `Abrir Proceso: ${p.documentTitle} (${p.documentCode} v${p.version})`,
      category: 'Proyectos Disponibles',
      icon: GitGraph,
      run: async () => {
        await openProject(p.fileName);
        setActiveView('CANVAS');
      }
    }));

    return [...baseActions, ...projectActions];
  }, [
    currentProject,
    projectList,
    openProject,
    pushSnapshot,
    setActiveView,
    setExportCenterModalOpen,
    setInteractiveTourActive,
    setMasterCatalogsModalOpen,
    setProjectData,
    setTextToDiagramModalOpen,
    setTutorialModalOpen,
    showNotification
  ]);

  if (!isCommandPaletteOpen) return null;

  const q = query.trim().toLowerCase();
  const filtered = actions.filter(
    (a) => !q || a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
  );

  return (
    <div
      onClick={() => setCommandPaletteOpen(false)}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-theme-surface border border-theme-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Search Input */}
        <div className="px-4 py-3.5 border-b border-theme-border flex items-center space-x-3 bg-theme-surface-subtle">
          <Search className="w-5 h-5 text-theme-accent shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca cualquier herramienta, catálogo ABM, exportación PDF o proyecto... (Ctrl+K)"
            className="flex-1 bg-transparent text-sm text-theme-text placeholder-theme-text-muted focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded-lg text-theme-text-muted hover:text-theme-text cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-theme-border/40">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-theme-text-muted">
              No se encontraron comandos ni proyectos que coincidan con &quot;{query}&quot;.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCommandPaletteOpen(false);
                    item.run();
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl hover:bg-theme-surface-subtle flex items-center justify-between text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 rounded-lg bg-theme-surface-subtle border border-theme-border text-theme-accent group-hover:bg-theme-accent group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-theme-text truncate">{item.title}</div>
                      <div className="text-[10px] font-mono text-theme-text-muted">{item.category}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-theme-text-muted group-hover:text-theme-accent shrink-0" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

