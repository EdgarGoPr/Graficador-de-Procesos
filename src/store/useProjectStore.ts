import { create } from 'zustand';
import { ProcessProjectFile, ProjectSummary } from '../types/project';
import { StorageService } from '../services/storageService';
import { calculateTotalLeadTime } from '../services/leadTimeCalculator';

interface ProjectStoreState {
  currentProject: ProcessProjectFile | null;
  projectList: ProjectSummary[];
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  hasUnsavedChanges: boolean;
  projectsDirectoryPath: string;

  // Actions
  initialize: () => Promise<void>;
  refreshProjectList: () => Promise<void>;
  openProject: (fileName: string) => Promise<boolean>;
  createNewProject: (title: string, authorName: string, orgUnit: string) => Promise<string>;
  saveCurrentProject: () => Promise<boolean>;
  duplicateProject: (fileName: string) => Promise<string | null>;
  deleteProject: (fileName: string) => Promise<boolean>;
  setProjectData: (project: ProcessProjectFile) => void;
  updateDocumentControl: (updates: Partial<ProcessProjectFile['documentControl']>) => void;
  markUnsavedChanges: () => void;
}

let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  currentProject: null,
  projectList: [],
  isLoading: false,
  isSaving: false,
  lastSavedAt: null,
  hasUnsavedChanges: false,
  projectsDirectoryPath: '../Proyectos/',

  initialize: async () => {
    set({ isLoading: true });
    await StorageService.initializeStorage();
    await get().refreshProjectList();
    // Do NOT automatically force open any project; user lands cleanly on the Dashboard
    set({ isLoading: false });
  },

  refreshProjectList: async () => {
    const fileNames = await StorageService.listProjects();
    const summaries: ProjectSummary[] = [];

    for (const fileName of fileNames) {
      const proj = await StorageService.loadProject(fileName);
      if (proj) {
        const leadTime = calculateTotalLeadTime(proj.nodes);
        const riskCount = proj.nodes.reduce((acc, n) => acc + (n.data?.operationalRisks?.length || 0), 0);
        const checkpointCount = proj.nodes.filter(n => n.data?.qualityCheckpoint || n.data?.nodeType === 'QualityCheckpointEvent').length;

        summaries.push({
          fileName,
          documentTitle: proj.documentControl.documentTitle,
          documentCode: proj.documentControl.documentCode,
          version: proj.documentControl.version,
          authorName: proj.documentControl.authorName,
          organizationUnit: proj.documentControl.organizationUnit,
          updatedAt: proj.documentControl.updatedAt,
          nodeCount: proj.nodes.length,
          totalLeadTimeHours: leadTime.totalHours,
          totalLeadTimeBusinessDays: leadTime.businessDays,
          riskCount,
          checkpointCount
        });
      }
    }

    set({ projectList: summaries });
  },

  openProject: async (fileName: string) => {
    set({ isLoading: true });
    const project = await StorageService.loadProject(fileName);
    if (project) {
      set({
        currentProject: project,
        lastSavedAt: project.documentControl.updatedAt,
        hasUnsavedChanges: false,
        isLoading: false
      });
      return true;
    }
    set({ isLoading: false });
    return false;
  },

  createNewProject: async (title: string, authorName: string, orgUnit: string) => {
    const now = new Date().toISOString();
    const newProject: ProcessProjectFile = {
      schemaVersion: '1.0.0',
      documentControl: {
        documentTitle: title,
        documentCode: `PRC-${Math.floor(1000 + Math.random() * 9000)}`,
        version: '1.0',
        authorName: authorName || 'Analista de Procesos',
        organizationUnit: orgUnit || 'Unidad Organizativa',
        processObjective: 'Definir el objetivo y alcance operativo del proceso.',
        createdAt: now,
        updatedAt: now,
        status: 'DRAFT',
        legalNormativeBasis: ['Normativa aplicable general'],
        revisionHistory: [
          {
            revisionDate: now,
            version: '1.0',
            author: authorName || 'Analista de Procesos',
            changeDescription: 'Creación inicial del proyecto'
          }
        ]
      },
      pools: [
        {
          id: 'pool_1',
          name: title,
          organization: orgUnit || 'Unidad Organizativa',
          lanes: [
            {
              id: 'lane_1',
              name: 'Mesa de Entradas / Inspectoría',
              role: 'Inspector / Operador',
              system: 'SAM / VUPRA',
              colorHex: '#10B981',
              order: 0
            },
            {
              id: 'lane_2',
              name: 'Área Legal / Notificaciones',
              role: 'Oficial Notificador / Asesor',
              system: 'GDE / Notificaciones',
              colorHex: '#3B82F6',
              order: 1
            },
            {
              id: 'lane_3',
              name: 'Juzgado / Resolución Final',
              role: 'Juez de Faltas / Resolutor',
              system: 'Sistema de Sentencias',
              colorHex: '#8B5CF6',
              order: 2
            }
          ]
        }
      ],
      nodes: [
        {
          id: 'node_start',
          type: 'StartEvent',
          position: { x: 320, y: 50 },
          data: {
            standardId: 'INI-01',
            title: 'Inicio del Proceso',
            description: 'Disparador formal de ingreso del trámite o expediente.',
            nodeType: 'StartEvent',
            laneId: 'lane_1',
            laneName: 'Mesa de Entradas / Inspectoría',
            roleName: 'Inspector / Operador',
            itSystem: 'SAM / VUPRA',
            legalFramework: 'Reglamento General',
            inputs: ['Formulario de Solicitud / Acta'],
            outputs: ['Expediente Iniciado'],
            operationalRisks: [],
            tags: ['Inicio']
          }
        }
      ],
      edges: []
    };

    const fileName = await StorageService.saveProject(newProject);
    newProject.fileName = fileName;
    set({ currentProject: newProject, hasUnsavedChanges: false });
    await get().refreshProjectList();
    return fileName;
  },

  saveCurrentProject: async () => {
    const { currentProject } = get();
    if (!currentProject) return false;

    set({ isSaving: true });
    const savedFileName = await StorageService.saveProject(currentProject);
    set({
      currentProject: { ...currentProject, fileName: savedFileName },
      lastSavedAt: new Date().toISOString(),
      hasUnsavedChanges: false,
      isSaving: false
    });
    await get().refreshProjectList();
    return true;
  },

  duplicateProject: async (fileName: string) => {
    const newName = await StorageService.duplicateProject(fileName);
    if (newName) {
      await get().refreshProjectList();
    }
    return newName;
  },

  deleteProject: async (fileName: string) => {
    const success = await StorageService.deleteProject(fileName);
    if (success) {
      const { currentProject } = get();
      if (currentProject?.fileName === fileName) {
        set({ currentProject: null });
      }
      await get().refreshProjectList();
    }
    return success;
  },

  /**
   * Updates in-memory project data and automatically triggers a debounced save to disk
   */
  setProjectData: (project: ProcessProjectFile) => {
    set({ currentProject: project, hasUnsavedChanges: true });

    // Debounced automatic background persistence (800ms)
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    autoSaveTimeout = setTimeout(async () => {
      const current = get().currentProject;
      if (current && current.fileName) {
        await StorageService.saveProject(current);
        set({ lastSavedAt: new Date().toISOString(), hasUnsavedChanges: false });
      }
    }, 800);
  },

  updateDocumentControl: (updates: Partial<ProcessProjectFile['documentControl']>) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedDocControl = {
      ...currentProject.documentControl,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updatedProject = {
      ...currentProject,
      documentControl: updatedDocControl
    };

    get().setProjectData(updatedProject);
  },

  markUnsavedChanges: () => {
    set({ hasUnsavedChanges: true });
  }
}));
