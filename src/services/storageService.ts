import { ProcessProjectFile, ProjectSummary } from '../types/project';
import { api } from './apiClient';
import { PermissionService } from './permissionService';

const enc = encodeURIComponent;

/**
 * Portable POSIX-safe File Name Sanitizer
 * Generates filenames like: 2026-09-01_proc-descargos-transito-v1.json
 */
export function sanitizeFilename(title: string, version: string, dateStr?: string): string {
  const date = dateStr ? dateStr.substring(0, 10) : new Date().toISOString().substring(0, 10);

  // Normalize, remove accents, keep only lowercase alphanumeric and dashes
  const cleanTitle = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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

export interface SaveProjectOptions {
  /** Archivo de origen cuando se guarda una nueva versión: el servidor exige permiso de editor sobre él. */
  sourceFileName?: string;
}

/**
 * Almacenamiento de proyectos a través del backend (/api/projects).
 * El servidor valida sesión y permiso por proyecto en cada operación.
 */
export class StorageService {
  public static async initializeStorage(): Promise<void> {
    // Sin inicialización local: todo vive en el servidor.
  }

  public static async listProjectSummaries(): Promise<ProjectSummary[]> {
    try {
      const res = await api<{ projects: ProjectSummary[] }>('GET', '/projects');
      const projects = res.projects || [];
      for (const p of projects) PermissionService.rememberProjectPermission(p.fileName, p.myPermission);
      return projects;
    } catch (err) {
      console.error('Error al obtener el listado de proyectos:', err);
      return [];
    }
  }

  public static async loadProject(fileName: string): Promise<ProcessProjectFile | null> {
    try {
      const res = await api<{ project: ProcessProjectFile }>('GET', `/projects/${enc(fileName)}`);
      return res.project || null;
    } catch (err) {
      console.error(`Error al cargar el proyecto ${fileName}:`, err);
      return null;
    }
  }

  /** Guarda o crea un proyecto. Lanza error si el servidor lo rechaza. */
  public static async saveProject(project: ProcessProjectFile, options: SaveProjectOptions = {}): Promise<string> {
    const updatedProject: ProcessProjectFile = {
      ...project,
      documentControl: {
        ...project.documentControl,
        updatedAt: new Date().toISOString()
      }
    };

    const fileName =
      project.fileName ||
      sanitizeFilename(
        updatedProject.documentControl.documentTitle,
        updatedProject.documentControl.version,
        updatedProject.documentControl.createdAt
      );
    updatedProject.fileName = fileName;

    await api('PUT', `/projects/${enc(fileName)}`, {
      body: { project: updatedProject, sourceFileName: options.sourceFileName }
    });
    return fileName;
  }

  /** Envía el proyecto a la papelera del servidor (solo propietario o Administrador). */
  public static async deleteProject(fileName: string): Promise<boolean> {
    try {
      await api('DELETE', `/projects/${enc(fileName)}`, { body: {} });
      return true;
    } catch (err) {
      console.error(`Error al eliminar ${fileName}:`, err);
      throw err;
    }
  }

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
        updatedAt: new Date().toISOString()
      },
      fileName: newFileName
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
