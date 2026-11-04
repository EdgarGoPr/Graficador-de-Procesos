import { ProcessProjectFile, ProjectSummary } from '../types/project';
import { NeonClient } from './neonClient';
import { PostgresStorageService } from './postgresStorageService';

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

/**
 * Cloud Storage Service (Neon Cloud PostgreSQL exclusively)
 */
export class StorageService {
  public static isNeonConfigured(): boolean {
    return NeonClient.isConfigured();
  }

  /**
   * Cloud-exclusive storage initialization
   */
  public static async initializeStorage(): Promise<void> {
    // Cloud-exclusive storage: no local mock injection needed
  }

  /**
   * Lists project summaries exclusively from PostgreSQL (Neon Cloud Database)
   */
  public static async listProjectSummaries(): Promise<ProjectSummary[]> {
    if (this.isNeonConfigured()) {
      try {
        return await PostgresStorageService.listProjectSummaries();
      } catch (err) {
        console.error('Error fetching project summaries from Neon:', err);
        return [];
      }
    }
    console.warn('Neon database connection is not configured.');
    return [];
  }

  /**
   * Load project exclusively from PostgreSQL (Neon Cloud Database)
   */
  public static async loadProject(fileName: string): Promise<ProcessProjectFile | null> {
    if (this.isNeonConfigured()) {
      try {
        return await PostgresStorageService.loadProject(fileName);
      } catch (err) {
        console.error(`Error loading project ${fileName} from Neon:`, err);
        return null;
      }
    }
    return null;
  }

  /**
   * Save / Overwrite a project exclusively to PostgreSQL (Neon Cloud Database)
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

    if (this.isNeonConfigured()) {
      await PostgresStorageService.saveProject(updatedProject);
    } else {
      console.warn('Neon is not configured. Project was not persisted to cloud.');
    }

    return fileName;
  }

  /**
   * Delete a project file exclusively from PostgreSQL (Neon Cloud Database)
   */
  public static async deleteProject(fileName: string): Promise<boolean> {
    if (this.isNeonConfigured()) {
      try {
        await PostgresStorageService.deleteProject(fileName);
        return true;
      } catch (err) {
        console.error(`Error deleting ${fileName} from Neon:`, err);
        return false;
      }
    }
    return false;
  }

  /**
   * Duplicate an existing project in PostgreSQL
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

  /**
   * Import project from a JSON file (drag-and-drop or file selector)
   */
  public static async importProjectFromJsonFile(file: File): Promise<{ success: boolean; fileName?: string; error?: string }> {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as ProcessProjectFile;

      if (!parsed.documentControl || !parsed.documentControl.documentTitle) {
        return { success: false, error: 'El archivo JSON no contiene los metadatos obligatorios de control documental (documentControl).' };
      }

      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        return { success: false, error: 'El archivo JSON no contiene la estructura válida de nodos y conexiones BPMN.' };
      }

      const fileName = parsed.fileName || sanitizeFilename(
        parsed.documentControl.documentTitle,
        parsed.documentControl.version || '1.0',
        parsed.documentControl.createdAt
      );

      parsed.fileName = fileName;
      await this.saveProject(parsed);
      return { success: true, fileName };
    } catch (err: unknown) {
      console.error('Error importing project JSON:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido al procesar el archivo JSON.' };
    }
  }
}
