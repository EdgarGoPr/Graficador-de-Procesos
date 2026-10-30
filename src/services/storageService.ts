import { ProcessProjectFile, ProjectSummary } from '../types/project';
import { sampleProjects } from './defaultProjects';
import { NeonClient } from './neonClient';
import { PostgresStorageService } from './postgresStorageService';
import { calculateTotalLeadTime } from './leadTimeCalculator';
import { MasterCatalogsService } from './masterCatalogsService';

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

const LOCAL_STORAGE_KEY_PREFIX = 'procesos_studio_proj_';
const LOCAL_STORAGE_INDEX_KEY = 'procesos_studio_project_index';

/**
 * Universal Storage Service (Neon Cloud PostgreSQL + Browser LocalStorage)
 */
export class StorageService {
  public static isNeonConfigured(): boolean {
    return NeonClient.isConfigured();
  }

  /**
   * Initializes local sample projects if first launch
   */
  public static async initializeStorage(): Promise<void> {
    const rawIndex = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
    let fileNames: string[] = rawIndex ? JSON.parse(rawIndex) : [];

    // Clean up legacy mock projects if still cached in browser
    const legacyKeywords = ['descargos-transito', 'faltas-y-clausuras'];
    const cleanFileNames = fileNames.filter(fn => {
      const isLegacy = legacyKeywords.some(kw => fn.includes(kw));
      if (isLegacy) {
        localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + fn);
      }
      return !isLegacy;
    });

    // Ensure official default projects are present in local storage unless explicitly deleted to trash
    const deletedFiles = new Set(
      (MasterCatalogsService.getCatalogsSync().deletedProjects || []).map(p => p.fileName)
    );
    const updatedFiles = [...cleanFileNames];
    let indexChanged = !rawIndex || cleanFileNames.length !== fileNames.length;

    for (const sample of sampleProjects) {
      const filename = sanitizeFilename(
        sample.documentControl.documentTitle,
        sample.documentControl.version,
        sample.documentControl.createdAt
      );
      if (!updatedFiles.includes(filename) && !deletedFiles.has(filename)) {
        localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + filename, JSON.stringify({ ...sample, fileName: filename }));
        updatedFiles.push(filename);
        indexChanged = true;
      }
    }

    if (indexChanged) {
      localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(updatedFiles));
    }
  }

  /**
   * Lists project summaries:
   * - If Neon is configured, queries indexed columns directly (< 2ms)
   * - Otherwise, iterates local files and computes metrics
   */
  public static async listProjectSummaries(): Promise<ProjectSummary[]> {
    if (this.isNeonConfigured()) {
      try {
        const neonSummaries = await PostgresStorageService.listProjectSummaries();
        if (neonSummaries.length > 0) {
          return neonSummaries;
        }
      } catch (err) {
        console.warn('Neon query failed, falling back to local storage:', err);
      }
    }

    // Local fallback: load local projects and compute summaries
    const fileNames = await this.listLocalProjects();
    const summaries: ProjectSummary[] = [];

    for (const fileName of fileNames) {
      const proj = await this.loadLocalProject(fileName);
      if (proj) {
        const leadTime = calculateTotalLeadTime(proj.nodes || []);
        const riskCount = (proj.nodes || []).reduce((acc, n) => acc + (n.data?.operationalRisks?.length || 0), 0);
        const checkpointCount = (proj.nodes || []).filter(
          n => n.data?.qualityCheckpoint || n.data?.nodeType === 'QualityCheckpointEvent'
        ).length;

        summaries.push({
          fileName,
          documentTitle: proj.documentControl.documentTitle,
          documentCode: proj.documentControl.documentCode,
          version: proj.documentControl.version,
          authorName: proj.documentControl.authorName,
          createdByEmail: proj.documentControl.createdByEmail,
          createdByUserId: proj.documentControl.createdByUserId,
          organizationUnit: proj.documentControl.organizationUnit,
          updatedAt: proj.documentControl.updatedAt,
          nodeCount: proj.nodes?.length || 0,
          totalLeadTimeHours: leadTime.totalHours,
          totalLeadTimeBusinessDays: leadTime.businessDays,
          riskCount,
          checkpointCount
        });
      }
    }

    return summaries;
  }

  /**
   * List projects strictly from local storage (browser localStorage)
   */
  public static async listLocalProjects(): Promise<string[]> {
    const rawIndex = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
    return rawIndex ? JSON.parse(rawIndex) : [];
  }

  /**
   * Load project by fileName (Neon -> Fallback Local)
   */
  public static async loadProject(fileName: string): Promise<ProcessProjectFile | null> {
    if (this.isNeonConfigured()) {
      try {
        const cloudProj = await PostgresStorageService.loadProject(fileName);
        if (cloudProj) {
          return cloudProj;
        }
      } catch (err) {
        console.warn(`Could not load ${fileName} from Neon, trying local:`, err);
      }
    }
    return await this.loadLocalProject(fileName);
  }

  /**
   * Load project strictly from local storage
   */
  public static async loadLocalProject(fileName: string): Promise<ProcessProjectFile | null> {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + fileName);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error(`Error loading local project ${fileName}:`, err);
      return null;
    }
  }

  /**
   * Save / Overwrite a project
   * Persists both to local storage (for offline resilience) and to Neon (if configured)
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

    // 1. Always save to local storage for offline safety
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + fileName, JSON.stringify(updatedProject));
    const localFiles = await this.listLocalProjects();
    if (!localFiles.includes(fileName)) {
      localFiles.push(fileName);
      localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(localFiles));
    }

    // 2. If Neon is configured, persist to PostgreSQL
    if (this.isNeonConfigured()) {
      try {
        await PostgresStorageService.saveProject(updatedProject);
      } catch (err) {
        console.error('Failed to sync project to Neon:', err);
      }
    }

    return fileName;
  }

  /**
   * Delete a project file (Neon + Local)
   */
  public static async deleteProject(fileName: string): Promise<boolean> {
    let success = true;

    if (this.isNeonConfigured()) {
      try {
        await PostgresStorageService.deleteProject(fileName);
      } catch (err) {
        console.error(`Error deleting ${fileName} from Neon:`, err);
        success = false;
      }
    }

    localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + fileName);
    const fileNames = (await this.listLocalProjects()).filter(f => f !== fileName);
    localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(fileNames));

    return success;
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
