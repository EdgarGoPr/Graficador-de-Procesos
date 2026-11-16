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

export interface SaveProjectResult {
  fileName: string;
  projectId?: string;
  /** Código documental efectivo (lo asigna o confirma el servidor). */
  documentCode?: string;
  /** Si el código pedido ya pertenecía a otro proyecto, el servidor asignó uno libre. */
  codeReassignedFrom?: string | null;
  created?: boolean;
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
    return (await this.saveProjectDetailed(project, options)).fileName;
  }

  /** Igual que saveProject, pero devuelve la identidad y el código que asignó el servidor. */
  public static async saveProjectDetailed(
    project: ProcessProjectFile,
    options: SaveProjectOptions = {}
  ): Promise<SaveProjectResult> {
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

    const res = await api<SaveProjectResult>('PUT', `/projects/${enc(fileName)}`, {
      body: { project: updatedProject, sourceFileName: options.sourceFileName }
    });
    return { ...res, fileName };
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

  /**
   * Duplica un proyecto como proyecto NUEVO e independiente: identidad y código propios
   * (los asigna el servidor), versión 1.0 e historial reiniciado. No arrastra participantes.
   */
  public static async duplicateProject(sourceFileName: string): Promise<SaveProjectResult | null> {
    const original = await this.loadProject(sourceFileName);
    if (!original) return null;

    const now = new Date().toISOString();
    const source = original.documentControl;
    const copyTitle = `${source.documentTitle} (Copia)`;
    const newFileName = sanitizeFilename(copyTitle, '1.0', now);

    const { projectId: _sourceProjectId, ...rest } = original;
    const duplicated: ProcessProjectFile = {
      ...rest,
      documentControl: {
        ...source,
        documentTitle: copyTitle,
        documentCode: '', // el servidor asigna el próximo código libre
        version: '1.0',
        status: 'DRAFT',
        createdAt: now,
        updatedAt: now,
        createdByEmail: undefined,
        createdByUserId: undefined,
        revisionHistory: [
          {
            revisionDate: now,
            version: '1.0',
            author: source.authorName || 'Analista de Procesos',
            changeDescription: `Creado como copia de ${source.documentCode} v${source.version}`
          }
        ]
      },
      fileName: newFileName
    };

    return this.saveProjectDetailed(duplicated);
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
  public static async importProjectFromJsonFile(
    file: File
  ): Promise<{ success: boolean; fileName?: string; error?: string; notice?: string }> {
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
      // Lo importado es siempre un proyecto nuevo (no se mezcla con uno existente).
      const { projectId: _importedProjectId, ...toImport } = parsed;
      const res = await this.saveProjectDetailed(toImport as ProcessProjectFile);
      const notice = res.codeReassignedFrom
        ? `El código ${res.codeReassignedFrom} ya pertenecía a otro proyecto: el proyecto importado quedó con el código ${res.documentCode}.`
        : undefined;
      return { success: true, fileName, notice };
    } catch (err: unknown) {
      console.error('Error importing project JSON:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido al procesar el archivo JSON.' };
    }
  }
}
