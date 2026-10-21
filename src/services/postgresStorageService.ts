import { ProcessProjectFile, ProjectSummary } from '../types/project';
import { NeonClient } from './neonClient';
import { calculateTotalLeadTime } from './leadTimeCalculator';
import { sanitizeFilename } from './storageService';

export class PostgresStorageService {
  /**
   * Checks if Neon is configured and accessible
   */
  public static async isAvailable(): Promise<boolean> {
    if (!NeonClient.isConfigured()) return false;
    const test = await NeonClient.testConnection();
    return test.ok;
  }

  /**
   * List project summaries directly from indexed columns (< 2ms)
   */
  public static async listProjectSummaries(): Promise<ProjectSummary[]> {
    const sql = NeonClient.getSql();
    if (!sql) return [];

    try {
      const rows = (await sql`
        SELECT 
          file_name,
          document_code,
          document_title,
          version,
          author_name,
          organization_unit,
          node_count,
          total_lead_time_minutes,
          risk_count,
          checkpoint_count,
          updated_at
        FROM process_projects
        ORDER BY updated_at DESC;
      `) as any[];

      return rows.map((r: any) => ({
        fileName: r.file_name,
        documentTitle: r.document_title,
        documentCode: r.document_code,
        version: r.version,
        authorName: r.author_name,
        organizationUnit: r.organization_unit,
        updatedAt: typeof r.updated_at === 'string' ? r.updated_at : new Date(r.updated_at).toISOString(),
        nodeCount: Number(r.node_count) || 0,
        totalLeadTimeHours: Math.round(((Number(r.total_lead_time_minutes) || 0) / 60) * 10) / 10,
        totalLeadTimeBusinessDays: Math.round(((Number(r.total_lead_time_minutes) || 0) / (60 * 8)) * 10) / 10,
        riskCount: Number(r.risk_count) || 0,
        checkpointCount: Number(r.checkpoint_count) || 0
      }));
    } catch (err) {
      console.error('Error fetching project summaries from PostgreSQL/Neon:', err);
      return [];
    }
  }

  /**
   * List all project file names
   */
  public static async listProjects(): Promise<string[]> {
    const sql = NeonClient.getSql();
    if (!sql) return [];

    try {
      const rows = (await sql`SELECT file_name FROM process_projects ORDER BY updated_at DESC;`) as any[];
      return rows.map((r: any) => r.file_name);
    } catch (err) {
      console.error('Error listing project filenames from Neon:', err);
      return [];
    }
  }

  /**
   * Load a full project with graph_data
   */
  public static async loadProject(fileName: string): Promise<ProcessProjectFile | null> {
    const sql = NeonClient.getSql();
    if (!sql) return null;

    try {
      const rows = (await sql`
        SELECT graph_data, file_name, document_code, document_title, version, status, author_name, organization_unit, updated_at
        FROM process_projects
        WHERE file_name = ${fileName}
        LIMIT 1;
      `) as any[];

      if (!rows || rows.length === 0) return null;
      const row = rows[0] as any;
      const graphData = (typeof row.graph_data === 'string' ? JSON.parse(row.graph_data) : row.graph_data) as ProcessProjectFile;

      return {
        ...graphData,
        fileName: row.file_name,
        documentControl: {
          ...graphData.documentControl,
          documentTitle: row.document_title || graphData.documentControl?.documentTitle,
          documentCode: row.document_code || graphData.documentControl?.documentCode,
          version: row.version || graphData.documentControl?.version,
          updatedAt: typeof row.updated_at === 'string' ? row.updated_at : new Date(row.updated_at).toISOString()
        }
      };
    } catch (err) {
      console.error(`Error loading project ${fileName} from Neon:`, err);
      return null;
    }
  }

  /**
   * Save or update a project (UPSERT)
   */
  public static async saveProject(project: ProcessProjectFile): Promise<string> {
    const sql = NeonClient.getSql();
    if (!sql) throw new Error('Cliente Neon no configurado o no disponible');

    const updatedProject: ProcessProjectFile = {
      ...project,
      documentControl: {
        ...project.documentControl,
        updatedAt: new Date().toISOString()
      }
    };

    const fileName = project.fileName || sanitizeFilename(
      updatedProject.documentControl.documentTitle,
      updatedProject.documentControl.version,
      updatedProject.documentControl.createdAt
    );
    updatedProject.fileName = fileName;

    // Calculate metrics for atomic indexed columns
    const leadTime = calculateTotalLeadTime(updatedProject.nodes || []);
    const totalLeadTimeMinutes = Math.round(leadTime.totalHours * 60);
    const nodeCount = updatedProject.nodes?.length || 0;
    const riskCount = (updatedProject.nodes || []).reduce((acc, n) => acc + (n.data?.operationalRisks?.length || 0), 0);
    const checkpointCount = (updatedProject.nodes || []).filter(
      n => n.data?.qualityCheckpoint || n.data?.nodeType === 'QualityCheckpointEvent'
    ).length;

    const doc = updatedProject.documentControl;

    await sql`
      INSERT INTO process_projects (
        file_name,
        document_code,
        document_title,
        version,
        status,
        author_name,
        organization_unit,
        process_objective,
        node_count,
        total_lead_time_minutes,
        risk_count,
        checkpoint_count,
        graph_data,
        updated_at
      ) VALUES (
        ${fileName},
        ${doc.documentCode || 'PRC-000'},
        ${doc.documentTitle || 'Sin Título'},
        ${doc.version || '1.0'},
        ${doc.status || 'DRAFT'},
        ${doc.authorName || 'Usuario'},
        ${doc.organizationUnit || 'General'},
        ${doc.processObjective || ''},
        ${nodeCount},
        ${totalLeadTimeMinutes},
        ${riskCount},
        ${checkpointCount},
        ${JSON.stringify(updatedProject)},
        NOW()
      )
      ON CONFLICT (file_name) DO UPDATE SET
        document_code = EXCLUDED.document_code,
        document_title = EXCLUDED.document_title,
        version = EXCLUDED.version,
        status = EXCLUDED.status,
        author_name = EXCLUDED.author_name,
        organization_unit = EXCLUDED.organization_unit,
        process_objective = EXCLUDED.process_objective,
        node_count = EXCLUDED.node_count,
        total_lead_time_minutes = EXCLUDED.total_lead_time_minutes,
        risk_count = EXCLUDED.risk_count,
        checkpoint_count = EXCLUDED.checkpoint_count,
        graph_data = EXCLUDED.graph_data,
        updated_at = NOW();
    `;

    return fileName;
  }

  /**
   * Delete a project from Neon
   */
  public static async deleteProject(fileName: string): Promise<boolean> {
    const sql = NeonClient.getSql();
    if (!sql) return false;

    try {
      await sql`DELETE FROM process_projects WHERE file_name = ${fileName};`;
      return true;
    } catch (err) {
      console.error(`Error deleting project ${fileName} from Neon:`, err);
      return false;
    }
  }

  /**
   * Duplicate a project in Neon
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
        updatedAt: new Date().toISOString()
      },
      fileName: newFileName
    };

    await this.saveProject(duplicated);
    return newFileName;
  }

  /**
   * Search projects using Full-Text search and Trigram fuzzy matching
   */
  public static async searchProjects(query: string): Promise<ProjectSummary[]> {
    const sql = NeonClient.getSql();
    if (!sql) return [];

    const clean = query.trim();
    if (!clean) return this.listProjectSummaries();

    try {
      const rows = (await sql`
        SELECT 
          file_name,
          document_code,
          document_title,
          version,
          author_name,
          organization_unit,
          node_count,
          total_lead_time_minutes,
          risk_count,
          checkpoint_count,
          updated_at
        FROM process_projects
        WHERE 
          search_vector @@ plainto_tsquery('spanish', ${clean})
          OR document_title ILIKE ${'%' + clean + '%'}
          OR document_code ILIKE ${'%' + clean + '%'}
          OR author_name ILIKE ${'%' + clean + '%'}
        ORDER BY 
          ts_rank(search_vector, plainto_tsquery('spanish', ${clean})) DESC,
          updated_at DESC;
      `) as any[];

      return rows.map((r: any) => ({
        fileName: r.file_name,
        documentTitle: r.document_title,
        documentCode: r.document_code,
        version: r.version,
        authorName: r.author_name,
        organizationUnit: r.organization_unit,
        updatedAt: typeof r.updated_at === 'string' ? r.updated_at : new Date(r.updated_at).toISOString(),
        nodeCount: Number(r.node_count) || 0,
        totalLeadTimeHours: Math.round(((Number(r.total_lead_time_minutes) || 0) / 60) * 10) / 10,
        totalLeadTimeBusinessDays: Math.round(((Number(r.total_lead_time_minutes) || 0) / (60 * 8)) * 10) / 10,
        riskCount: Number(r.risk_count) || 0,
        checkpointCount: Number(r.checkpoint_count) || 0
      }));
    } catch (err) {
      console.error('Error searching projects in Neon:', err);
      return [];
    }
  }

  /**
   * Bulk upload projects from local sources (USB / defaultProjects / localStorage) into Neon
   */
  public static async migrateProjects(projects: ProcessProjectFile[]): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0;
    let failed = 0;

    for (const proj of projects) {
      try {
        await this.saveProject(proj);
        succeeded++;
      } catch (err) {
        console.error(`Failed to migrate project ${proj.fileName || proj.documentControl?.documentTitle}:`, err);
        failed++;
      }
    }

    return { succeeded, failed };
  }
}
