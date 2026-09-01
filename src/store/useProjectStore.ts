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

    // Auto-open first project if available
    const list = get().projectList;
    if (list.length > 0) {
      await get().openProject(list[0].fileName);
    }
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
          id: 'pool-1',
          name: 'Proceso Principal',
          organization: orgUnit || 'Organización',
          lanes: [
            {
              id: 'lane-1',
              name: 'Mesa de Entrada / Solicitante',
              role: 'Receptor / Administrado',
              system: 'Portal Web / Mesa de Entrada',
              colorHex: '#3b82f6',
              order: 0
            },
            {
              id: 'lane-2',
              name: 'Área Técnica / Despacho',
              role: 'Responsable Operativo',
              system: 'Expediente Electrónico',
              colorHex: '#10b981',
              order: 1
            },
            {
              id: 'lane-3',
              name: 'Autoridad Resolutoria',
              role: 'Director / Juez',
              system: 'Sistema Judicial / Resolutivo',
              colorHex: '#8b5cf6',
              order: 2
            }
          ]
        }
      ],
      nodes: [
        {
          id: 'start-1',
          type: 'StartEvent',
          position: { x: 50, y: 80 },
          data: {
            standardId: 'EVT-01',
            title: 'Inicio del Trámite',
            description: 'Ingreso formal de solicitud o notificación.',
            nodeType: 'StartEvent',
            laneId: 'lane-1',
            itSystem: 'Mesa de Entrada',
            legalFramework: 'Art. 1 Ley de Procedimientos',
            inputs: ['Formulario de solicitud'],
            outputs: ['Número de expediente asignado'],
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

  setProjectData: (project: ProcessProjectFile) => {
    set({ currentProject: project, hasUnsavedChanges: true });
  },

  updateDocumentControl: (updates: Partial<ProcessProjectFile['documentControl']>) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedDocControl = {
      ...currentProject.documentControl,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    set({
      currentProject: {
        ...currentProject,
        documentControl: updatedDocControl
      },
      hasUnsavedChanges: true
    });
  },

  markUnsavedChanges: () => {
    set({ hasUnsavedChanges: true });
  }
}));
