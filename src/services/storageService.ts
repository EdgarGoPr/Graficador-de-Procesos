import { ProcessProjectFile } from '../types/project';
import { sampleProjects } from './defaultProjects';

/**
 * Portable POSIX-safe File Name Sanitizer
 * Generates filenames like: 2026-09-01_proc-descargos-transito-v1.json
 */
export function sanitizeFilename(title: string, version: string, dateStr?: string): string {
  const date = dateStr ? dateStr.substring(0, 10) : new Date().toISOString().substring(0, 10);
  
  // Normalize, remove accents, keep only lowercase alphanumeric and dashes
  const cleanTitle = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 45);

  const cleanVersion = version
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '')
    .replace(/^v/, '');

  return `${date}_proc-${cleanTitle || 'proceso'}-v${cleanVersion || '1.0'}.json`;
}

// Interface for Electron Window IPC Bridge
declare global {
  interface Window {
    procesosStorage?: {
      listProjects: () => Promise<string[]>;
      readProject: (fileName: string) => Promise<ProcessProjectFile>;
      writeProject: (fileName: string, data: ProcessProjectFile) => Promise<boolean>;
      deleteProject: (fileName: string) => Promise<boolean>;
      getProjectsPath: () => Promise<string>;
      openProjectsFolder: () => Promise<boolean>;
      openProjectFile: (fileName: string) => Promise<boolean>;
    };
  }
}

const LOCAL_STORAGE_KEY_PREFIX = 'procesos_studio_proj_';
const LOCAL_STORAGE_INDEX_KEY = 'procesos_studio_project_index';

/**
 * Universal Storage Service (Electron Portable IPC + Fallback Browser LocalStore)
 */
export class StorageService {
  public static isElectron(): boolean {
    return typeof window !== 'undefined' && !!window.procesosStorage;
  }

  /**
   * Opens the projects folder in the operating system file explorer (Windows Explorer)
   */
  public static async openProjectsFolder(): Promise<boolean> {
    if (this.isElectron()) {
      return await window.procesosStorage!.openProjectsFolder();
    }
    return false;
  }

  /**
   * Reveals a specific project file in the operating system file explorer
   */
  public static async openProjectFile(fileName: string): Promise<boolean> {
    if (this.isElectron()) {
      return await window.procesosStorage!.openProjectFile(fileName);
    }
    return false;
  }

  /**
   * Gets absolute or relative path to the projects directory
   */
  public static async getProjectsPath(): Promise<string> {
    if (this.isElectron()) {
      return await window.procesosStorage!.getProjectsPath();
    }
    return 'Navegador Web (localStorage)';
  }

  /**
   * Initializes sample projects if first launch
   */
  public static async initializeStorage(): Promise<void> {

    if (this.isElectron()) {
      const existing = await window.procesosStorage!.listProjects();
      if (existing.length === 0) {
        for (const sample of sampleProjects) {
          const filename = sanitizeFilename(
            sample.documentControl.documentTitle,
            sample.documentControl.version,
            sample.documentControl.createdAt
          );
          await window.procesosStorage!.writeProject(filename, { ...sample, fileName: filename });
        }
      }
    } else {
      // Browser fallback
      const rawIndex = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
      if (!rawIndex) {
        const fileNames: string[] = [];
        for (const sample of sampleProjects) {
          const filename = sanitizeFilename(
            sample.documentControl.documentTitle,
            sample.documentControl.version,
            sample.documentControl.createdAt
          );
          localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + filename, JSON.stringify({ ...sample, fileName: filename }));
          fileNames.push(filename);
        }
        localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(fileNames));
      }
    }
  }

  /**
   * List all projects in ../Proyectos/
   */
  public static async listProjects(): Promise<string[]> {
    if (this.isElectron()) {
      return await window.procesosStorage!.listProjects();
    } else {
      const rawIndex = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
      return rawIndex ? JSON.parse(rawIndex) : [];
    }
  }

  /**
   * Load a project by filename
   */
  public static async loadProject(fileName: string): Promise<ProcessProjectFile | null> {
    try {
      if (this.isElectron()) {
        return await window.procesosStorage!.readProject(fileName);
      } else {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + fileName);
        return raw ? JSON.parse(raw) : null;
      }
    } catch (err) {
      console.error(`Error loading project ${fileName}:`, err);
      return null;
    }
  }

  /**
   * Save / Overwrite a project
   */
  public static async saveProject(project: ProcessProjectFile): Promise<string> {
    const updatedProject: ProcessProjectFile = {
      ...project,
      documentControl: {
        ...project.documentControl,
        updatedAt: new Date().toISOString(),
      }
    };

    const fileName = project.fileName || sanitizeFilename(
      updatedProject.documentControl.documentTitle,
      updatedProject.documentControl.version,
      updatedProject.documentControl.createdAt
    );

    updatedProject.fileName = fileName;

    if (this.isElectron()) {
      await window.procesosStorage!.writeProject(fileName, updatedProject);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + fileName, JSON.stringify(updatedProject));
      const fileNames = await this.listProjects();
      if (!fileNames.includes(fileName)) {
        fileNames.push(fileName);
        localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(fileNames));
      }
    }

    return fileName;
  }

  /**
   * Delete a project file
   */
  public static async deleteProject(fileName: string): Promise<boolean> {
    if (this.isElectron()) {
      return await window.procesosStorage!.deleteProject(fileName);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + fileName);
      const fileNames = (await this.listProjects()).filter(f => f !== fileName);
      localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(fileNames));
      return true;
    }
  }

  /**
   * Duplicate an existing project
   */
  public static async duplicateProject(sourceFileName: string): Promise<string | null> {
    const original = await this.loadProject(sourceFileName);
    if (!original) return null;

    const copyTitle = `${original.documentControl.documentTitle} (Copia)`;
    const newFileName = sanitizeFilename(copyTitle, original.documentControl.version);

    const duplicated: ProcessProjectFile = {
      ...original,
      documentControl: {
        ...original.documentControl,
        documentTitle: copyTitle,
        documentCode: `${original.documentControl.documentCode}-CPY`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      fileName: newFileName,
    };

    await this.saveProject(duplicated);
    return newFileName;
  }

  /**
   * Export project to JSON download (for browser safety or backup)
   */
  public static exportProjectToJsonFile(project: ProcessProjectFile): void {
    const fileName = project.fileName || sanitizeFilename(
      project.documentControl.documentTitle,
      project.documentControl.version
    );
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
