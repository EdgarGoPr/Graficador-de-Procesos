import { create } from 'zustand';
import { ProcessProjectFile, ProjectSummary } from '../types/project';
import { ProcessDocumentationItem } from '../types/ai';
import { StorageService } from '../services/storageService';
import { CanvasSnapshot, createSnapshot, pushToHistory } from '../services/historyManager';
import {
  bumpVersion,
  generateRevisionFilename
} from '../services/processVersionManager';
import { useAuthStore } from './useAuthStore';
import { PermissionService } from '../services/permissionService';
import { MasterCatalogsService } from '../services/masterCatalogsService';
import { AuditLoggerService } from '../services/auditLoggerService';

interface SaveRevisionOptions {
  bumpType?: 'patch' | 'minor' | 'major';
  customTag?: string;
  changeDescription?: string;
}

interface ProjectStoreState {
  currentProject: ProcessProjectFile | null;
  projectList: ProjectSummary[];
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  hasUnsavedChanges: boolean;

  // History (Undo / Redo)
  past: CanvasSnapshot[];
  future: CanvasSnapshot[];
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  initialize: () => Promise<void>;
  refreshProjectList: () => Promise<void>;
  openProject: (fileName: string) => Promise<boolean>;
  createNewProject: (title: string, authorName: string, orgUnit: string) => Promise<string>;
  saveCurrentProject: () => Promise<boolean>;
  saveProjectAsNewRevision: (options?: SaveRevisionOptions) => Promise<string | null>;
  duplicateProject: (fileName: string) => Promise<string | null>;
  deleteProject: (fileName: string) => Promise<boolean>;
  restoreProjectFromTrash: (fileName: string) => Promise<boolean>;
  importProjectFromFile: (file: File) => Promise<{ success: boolean; fileName?: string; error?: string }>;
  setProjectData: (project: ProcessProjectFile) => void;
  updateDocumentControl: (updates: Partial<ProcessProjectFile['documentControl']>) => void;
  markUnsavedChanges: () => void;

  // Process Documentation Vault Actions
  addDocumentationItem: (item: Omit<ProcessDocumentationItem, 'id' | 'createdAt'>) => string;
  updateDocumentationItem: (id: string, updates: Partial<ProcessDocumentationItem>) => void;
  removeDocumentationItem: (id: string) => void;
  updateDocumentationGlobalNotes: (notes: string) => void;

  // Undo / Redo Actions
  pushSnapshot: (description?: string) => void;
  undo: () => boolean;
  redo: () => boolean;
  clearHistory: () => void;
}

let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  currentProject: null,
  projectList: [],
  isLoading: false,
  isSaving: false,
  lastSavedAt: null,
  hasUnsavedChanges: false,

  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  initialize: async () => {
    set({ isLoading: true });
    await StorageService.initializeStorage();
    await MasterCatalogsService.initialize();
    await get().refreshProjectList();
    set({ isLoading: false });
  },

  refreshProjectList: async () => {
    const summaries = await StorageService.listProjectSummaries();
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
        past: [],
        future: [],
        canUndo: false,
        canRedo: false,
        isLoading: false
      });
      return true;
    }
    set({ isLoading: false });
    return false;
  },

  createNewProject: async (title: string, authorName: string, orgUnit: string) => {
    const currentUser = useAuthStore.getState().currentUser;
    const now = new Date().toISOString();
    const effectiveAuthor = authorName || currentUser?.fullName || 'Analista de Procesos';
    const effectiveOrgUnit = orgUnit || currentUser?.organizationUnit || 'Unidad Organizativa';

    const newProject: ProcessProjectFile = {
      schemaVersion: '1.0.0',
      documentControl: {
        documentTitle: title,
        documentCode: `PRC-${Math.floor(1000 + Math.random() * 9000)}`,
        version: '1.0',
        authorName: effectiveAuthor,
        organizationUnit: effectiveOrgUnit,
        processObjective: 'Definir el objetivo y alcance operativo del proceso.',
        createdAt: now,
        updatedAt: now,
        status: 'DRAFT',
        createdByEmail: currentUser?.email,
        createdByUserId: currentUser?.id,
        legalNormativeBasis: ['ISO 9001:2015', 'ISO/IEC 19510 (BPMN 2.0)'],
        revisionHistory: [
          {
            revisionDate: now,
            version: '1.0',
            author: effectiveAuthor,
            changeDescription: 'Creación inicial del proyecto'
          }
        ]
      },
      pools: [
        {
          id: 'pool_1',
          name: title,
          organization: effectiveOrgUnit,
          lanes: []
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
            description: '',
            nodeType: 'StartEvent',
            laneId: '',
            laneName: '',
            roleName: '',
            responsible: '',
            itSystem: '',
            legalFramework: '',
            inputs: [],
            outputs: [],
            operationalRisks: [],
            tags: ['Inicio']
          }
        }
      ],
      edges: []
    };

    const fileName = await StorageService.saveProject(newProject);
    newProject.fileName = fileName;

    // Si hay un usuario activo, auto-asignarle permiso de EDITOR sobre su proyecto
    if (currentUser?.id) {
      try {
        await PermissionService.assignPermission(
          currentUser,
          currentUser.id,
          fileName,
          'EDITOR',
          newProject.documentControl
        );
      } catch (err) {
        console.warn('Auto-asignación de permiso para creador:', err);
      }
    }

    set({
      currentProject: newProject,
      hasUnsavedChanges: false,
      past: [],
      future: [],
      canUndo: false,
      canRedo: false
    });
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

  saveProjectAsNewRevision: async (options?: SaveRevisionOptions) => {
    const { currentProject } = get();
    if (!currentProject) return null;

    set({ isSaving: true });
    const now = new Date().toISOString();
    const bumpType = options?.bumpType || 'minor';
    const newVersion = bumpVersion(currentProject.documentControl.version || '1.0', bumpType);
    const changeDesc = options?.changeDescription || `Revisión guardada el ${new Date().toLocaleDateString('es-AR')}`;

    const updatedRevisions = [
      ...(currentProject.documentControl.revisionHistory || []),
      {
        revisionDate: now,
        version: newVersion,
        author: currentProject.documentControl.authorName || 'Analista de Procesos',
        changeDescription: changeDesc
      }
    ];

    const newFileName = generateRevisionFilename(
      currentProject.documentControl.documentTitle,
      newVersion,
      options?.customTag
    );

    const updatedProject: ProcessProjectFile = {
      ...currentProject,
      documentControl: {
        ...currentProject.documentControl,
        version: newVersion,
        updatedAt: now,
        revisionHistory: updatedRevisions
      },
      fileName: newFileName
    };

    await StorageService.saveProject(updatedProject);

    set({
      currentProject: updatedProject,
      lastSavedAt: now,
      hasUnsavedChanges: false,
      isSaving: false
    });

    await get().refreshProjectList();
    return newFileName;
  },

  duplicateProject: async (fileName: string) => {
    const newName = await StorageService.duplicateProject(fileName);
    if (newName) {
      await get().refreshProjectList();
    }
    return newName;
  },

  deleteProject: async (fileName: string) => {
    const currentUser = useAuthStore.getState().currentUser;
    try {
      const existing = await StorageService.loadProject(fileName);
      if (existing) {
        await MasterCatalogsService.moveProjectToTrash(existing, currentUser?.email || 'sistema@processtudio.com');
      }
    } catch {}

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

  restoreProjectFromTrash: async (fileName: string) => {
    const entry = await MasterCatalogsService.removeProjectFromTrash(fileName);
    if (!entry || !entry.projectData) return false;

    const restoredFileName = await StorageService.saveProject({
      ...entry.projectData,
      fileName: entry.fileName
    });

    const currentUser = useAuthStore.getState().currentUser;
    if (currentUser) {
      AuditLoggerService.log(
        'PROJECT_RESTORED_FROM_TRASH',
        currentUser,
        restoredFileName,
        { title: entry.documentTitle, code: entry.documentCode }
      );
    }

    await get().refreshProjectList();
    return true;
  },

  importProjectFromFile: async (file: File) => {
    set({ isLoading: true });
    const result = await StorageService.importProjectFromJsonFile(file);
    if (result.success && result.fileName) {
      await get().refreshProjectList();
    }
    set({ isLoading: false });
    return result;
  },

  setProjectData: (project: ProcessProjectFile) => {
    set({ currentProject: project, hasUnsavedChanges: true });

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
  },

  addDocumentationItem: (item) => {
    const { currentProject } = get();
    if (!currentProject) return '';

    const newId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newItem: ProcessDocumentationItem = {
      ...item,
      id: newId,
      createdAt: new Date().toISOString()
    };

    const currentVault = currentProject.documentationVault || { items: [] };
    const updatedVault = {
      ...currentVault,
      items: [newItem, ...currentVault.items]
    };

    const updatedProject: ProcessProjectFile = {
      ...currentProject,
      documentationVault: updatedVault,
      documentControl: {
        ...currentProject.documentControl,
        updatedAt: new Date().toISOString()
      }
    };

    get().setProjectData(updatedProject);
    return newId;
  },

  updateDocumentationItem: (id, updates) => {
    const { currentProject } = get();
    if (!currentProject || !currentProject.documentationVault) return;

    const currentVault = currentProject.documentationVault;
    const updatedItems = currentVault.items.map((it) =>
      it.id === id ? { ...it, ...updates, updatedAt: new Date().toISOString() } : it
    );

    const updatedProject: ProcessProjectFile = {
      ...currentProject,
      documentationVault: {
        ...currentVault,
        items: updatedItems
      },
      documentControl: {
        ...currentProject.documentControl,
        updatedAt: new Date().toISOString()
      }
    };

    get().setProjectData(updatedProject);
  },

  removeDocumentationItem: (id) => {
    const { currentProject } = get();
    if (!currentProject || !currentProject.documentationVault) return;

    const currentVault = currentProject.documentationVault;
    const updatedItems = currentVault.items.filter((it) => it.id !== id);

    const updatedProject: ProcessProjectFile = {
      ...currentProject,
      documentationVault: {
        ...currentVault,
        items: updatedItems
      },
      documentControl: {
        ...currentProject.documentControl,
        updatedAt: new Date().toISOString()
      }
    };

    get().setProjectData(updatedProject);
  },

  updateDocumentationGlobalNotes: (notes) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const currentVault = currentProject.documentationVault || { items: [] };
    const updatedProject: ProcessProjectFile = {
      ...currentProject,
      documentationVault: {
        ...currentVault,
        globalNotes: notes
      },
      documentControl: {
        ...currentProject.documentControl,
        updatedAt: new Date().toISOString()
      }
    };

    get().setProjectData(updatedProject);
  },

  pushSnapshot: (description?: string) => {
    const { currentProject, past } = get();
    if (!currentProject) return;

    const snap = createSnapshot(
      currentProject.nodes,
      currentProject.edges,
      currentProject.pools,
      description
    );
    const nextPast = pushToHistory(past, snap);

    set({
      past: nextPast,
      future: [],
      canUndo: true,
      canRedo: false
    });
  },

  undo: () => {
    const { currentProject, past, future } = get();
    if (!currentProject || past.length === 0) return false;

    const currentSnap = createSnapshot(
      currentProject.nodes,
      currentProject.edges,
      currentProject.pools,
      'Estado previo a deshacer'
    );
    const newFuture = [currentSnap, ...future];

    const targetSnapshot = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    const updatedProject: ProcessProjectFile = {
      ...currentProject,
      nodes: JSON.parse(JSON.stringify(targetSnapshot.nodes)),
      edges: JSON.parse(JSON.stringify(targetSnapshot.edges)),
      pools: JSON.parse(JSON.stringify(targetSnapshot.pools)),
      documentControl: {
        ...currentProject.documentControl,
        updatedAt: new Date().toISOString()
      }
    };

    set({
      currentProject: updatedProject,
      past: newPast,
      future: newFuture,
      canUndo: newPast.length > 0,
      canRedo: true,
      hasUnsavedChanges: true
    });

    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(async () => {
      if (updatedProject.fileName) {
        await StorageService.saveProject(updatedProject);
        set({ lastSavedAt: new Date().toISOString(), hasUnsavedChanges: false });
      }
    }, 800);

    return true;
  },

  redo: () => {
    const { currentProject, past, future } = get();
    if (!currentProject || future.length === 0) return false;

    const currentSnap = createSnapshot(
      currentProject.nodes,
      currentProject.edges,
      currentProject.pools,
      'Estado previo a rehacer'
    );
    const newPast = pushToHistory(past, currentSnap);

    const targetSnapshot = future[0];
    const newFuture = future.slice(1);

    const updatedProject: ProcessProjectFile = {
      ...currentProject,
      nodes: JSON.parse(JSON.stringify(targetSnapshot.nodes)),
      edges: JSON.parse(JSON.stringify(targetSnapshot.edges)),
      pools: JSON.parse(JSON.stringify(targetSnapshot.pools)),
      documentControl: {
        ...currentProject.documentControl,
        updatedAt: new Date().toISOString()
      }
    };

    set({
      currentProject: updatedProject,
      past: newPast,
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
      hasUnsavedChanges: true
    });

    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(async () => {
      if (updatedProject.fileName) {
        await StorageService.saveProject(updatedProject);
        set({ lastSavedAt: new Date().toISOString(), hasUnsavedChanges: false });
      }
    }, 800);

    return true;
  },

  clearHistory: () => {
    set({
      past: [],
      future: [],
      canUndo: false,
      canRedo: false
    });
  }
}));
