import { actorOf, writeAudit } from '../audit.js';
import { canManageProject, getProjectAccess, requireAdmin, requireProjectPermission, requireUser } from '../authz.js';
import type { Ctx } from '../context.js';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  oneOf,
  requireFileName,
  requireString,
  requireUuid,
  toIso
} from '../http.js';
import { changeProjectCode, createProject, getProjectById, normalizeCode } from '../projectModel.js';
import { Router } from '../router.js';
import { CanvasPermission, DbUser, PERMISSION_LEVELS, findUserById } from '../users.js';

const MAX_PROJECT_BYTES = 4 * 1024 * 1024;
const RANK: Record<CanvasPermission, number> = { READ_ONLY: 1, COMMENTS: 2, EDITOR: 3 };

// ---------------------------------------------------------------------------
// Utilidades de grafo
// ---------------------------------------------------------------------------

interface ProjectMetrics {
  nodeCount: number;
  totalLeadTimeMinutes: number;
  riskCount: number;
  checkpointCount: number;
}

export function computeMetrics(project: any): ProjectMetrics {
  const nodes: any[] = Array.isArray(project?.nodes) ? project.nodes : [];
  let totalHours = 0;
  for (const n of nodes) {
    const sla = n?.data?.slaDuration;
    const value = Number(sla?.value) || 0;
    if (sla?.unit === 'HOURS') totalHours += value;
    else if (sla?.unit === 'BUSINESS_DAYS') totalHours += value * 8;
    else if (sla?.unit === 'CALENDAR_DAYS') totalHours += value * 24;
  }
  return {
    nodeCount: nodes.length,
    totalLeadTimeMinutes: Math.round(totalHours * 60),
    riskCount: nodes.reduce((acc, n) => acc + (Array.isArray(n?.data?.operationalRisks) ? n.data.operationalRisks.length : 0), 0),
    checkpointCount: nodes.filter((n) => n?.data?.qualityCheckpoint || n?.data?.nodeType === 'QualityCheckpointEvent').length
  };
}

function validateProjectPayload(project: any): void {
  if (!project || typeof project !== 'object' || Array.isArray(project)) throw badRequest('Proyecto inválido.');
  const dc = project.documentControl;
  if (!dc || typeof dc !== 'object') throw badRequest('El proyecto no contiene la ficha de control documental.');
  requireString(dc.documentTitle, 'título', 200);
  if (!Array.isArray(project.nodes) || !Array.isArray(project.edges)) {
    throw badRequest('El proyecto no contiene una estructura válida de nodos y conexiones.');
  }
  if (JSON.stringify(project).length > MAX_PROJECT_BYTES) throw badRequest('El proyecto supera el tamaño máximo permitido (4 MB).');
}

const isSticky = (n: any) => n && n.type === 'StickyNote';

/**
 * Permiso "Comentarios": del grafo enviado solo se aceptan las notas adhesivas (y sus conexiones).
 * Todo lo demás se conserva tal como está guardado.
 */
export function mergeCommentsOnly(stored: any, incoming: any): any {
  const storedNodes: any[] = Array.isArray(stored.nodes) ? stored.nodes : [];
  const storedEdges: any[] = Array.isArray(stored.edges) ? stored.edges : [];
  const keptNodes = storedNodes.filter((n) => !isSticky(n));
  const keptIds = new Set(keptNodes.map((n) => n.id));
  const storedStickyIds = new Set(storedNodes.filter(isSticky).map((n) => n.id));

  const incomingSticky = (incoming.nodes as any[]).filter((n) => isSticky(n) && !keptIds.has(n.id));
  const stickyIds = new Set(incomingSticky.map((n) => n.id));
  const allIds = new Set([...keptIds, ...stickyIds]);

  const keptEdges = storedEdges.filter((e) => !storedStickyIds.has(e.source) && !storedStickyIds.has(e.target));
  const stickyEdges = (incoming.edges as any[]).filter(
    (e) => e && (stickyIds.has(e.source) || stickyIds.has(e.target)) && allIds.has(e.source) && allIds.has(e.target)
  );

  return {
    ...stored,
    nodes: [...keptNodes, ...incomingSticky],
    edges: [...keptEdges, ...stickyEdges]
  };
}

function rowToSummary(r: any, user: DbUser) {
  const minutes = Number(r.total_lead_time_minutes) || 0;
  const isOwner = !!r.owner_user_id && r.owner_user_id === user.id;
  const myPermission: CanvasPermission | null =
    user.role === 'ADMIN' || isOwner ? 'EDITOR' : (r.permission_level as CanvasPermission | null) || null;
  return {
    fileName: r.file_name,
    projectId: r.project_id,
    documentTitle: r.document_title,
    documentCode: r.document_code,
    version: r.version,
    authorName: r.author_name,
    organizationUnit: r.organization_unit,
    createdByUserId: r.owner_user_id || undefined,
    ownerUserId: r.owner_user_id || null,
    myPermission,
    updatedAt: toIso(r.updated_at),
    nodeCount: Number(r.node_count) || 0,
    totalLeadTimeHours: Math.round((minutes / 60) * 10) / 10,
    totalLeadTimeBusinessDays: Math.round((minutes / (60 * 8)) * 10) / 10,
    riskCount: Number(r.risk_count) || 0,
    checkpointCount: Number(r.checkpoint_count) || 0
  };
}

function parseJson(value: unknown): any {
  return typeof value === 'string' ? JSON.parse(value) : value;
}

async function loadStoredProject(ctx: Ctx, fileName: string): Promise<any | null> {
  const rows = await ctx.db.query(`SELECT graph_data FROM process_projects WHERE file_name = $1 LIMIT 1`, [fileName]);
  return rows[0] ? parseJson(rows[0].graph_data) : null;
}

function rowValues(project: any) {
  const dc = project.documentControl;
  const m = computeMetrics(project);
  return [
    String(dc.documentCode || 'PRC-000').slice(0, 50),
    String(dc.documentTitle || 'Sin Título').slice(0, 200),
    String(dc.version || '1.0').slice(0, 25),
    String(dc.status || 'DRAFT').slice(0, 25),
    String(dc.authorName || 'Usuario').slice(0, 150),
    String(dc.organizationUnit || 'General').slice(0, 160),
    String(dc.processObjective || ''),
    m.nodeCount,
    m.totalLeadTimeMinutes,
    m.riskCount,
    m.checkpointCount,
    JSON.stringify(project)
  ];
}

async function insertProjectRow(
  ctx: Ctx,
  fileName: string,
  project: any,
  projectId: string,
  ownerUserId: string | null
): Promise<boolean> {
  const rows = await ctx.db.query(
    `INSERT INTO process_projects (
       file_name, document_code, document_title, version, status, author_name, organization_unit, process_objective,
       node_count, total_lead_time_minutes, risk_count, checkpoint_count, graph_data, project_id, owner_user_id, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::uuid, $15::uuid, NOW())
     ON CONFLICT (file_name) DO NOTHING
     RETURNING file_name`,
    [fileName, ...rowValues(project), projectId, ownerUserId]
  );
  return rows.length > 0;
}

async function updateProjectRow(ctx: Ctx, fileName: string, project: any): Promise<void> {
  await ctx.db.query(
    `UPDATE process_projects SET
       document_code = $2, document_title = $3, version = $4, status = $5, author_name = $6, organization_unit = $7,
       process_objective = $8, node_count = $9, total_lead_time_minutes = $10, risk_count = $11, checkpoint_count = $12,
       graph_data = $13::jsonb, updated_at = NOW()
     WHERE file_name = $1`,
    [fileName, ...rowValues(project)]
  );
}

async function upsertMember(ctx: Ctx, operator: DbUser, targetUserId: string, projectId: string, level: CanvasPermission) {
  await ctx.db.query(
    `INSERT INTO project_members (project_id, user_id, permission_level, assigned_by, assigned_at)
     VALUES ($1::uuid, $2::uuid, $3, $4::uuid, NOW())
     ON CONFLICT (project_id, user_id) DO UPDATE SET
       permission_level = EXCLUDED.permission_level, assigned_by = EXCLUDED.assigned_by, assigned_at = NOW()`,
    [projectId, targetUserId, level, operator.id]
  );
}

/**
 * Un proyecto sin propietario debe conservar al menos un editor.
 * Lanza error si quitar o bajar de nivel a targetUserId lo dejaría sin ninguno.
 */
async function assertKeepsAnEditor(ctx: Ctx, projectId: string, ownerUserId: string | null, targetUserId: string) {
  if (ownerUserId) return; // el propietario siempre es editor
  const rows = await ctx.db.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM project_members
      WHERE project_id::text = $1 AND permission_level = 'EDITOR' AND user_id::text <> $2`,
    [projectId, targetUserId]
  );
  const current = await ctx.db.query(
    `SELECT permission_level FROM project_members WHERE project_id::text = $1 AND user_id::text = $2`,
    [projectId, targetUserId]
  );
  if (current[0]?.permission_level === 'EDITOR' && Number(rows[0]?.n) === 0) {
    throw badRequest('El proyecto debe conservar al menos un editor. Asigná otro editor antes de quitar o cambiar a este.');
  }
}

const OWNER_FIXED_MESSAGE =
  'El propietario del proyecto siempre tiene acceso de editor: no se puede quitar ni cambiar su nivel.';

function trashRowToEntry(r: any) {
  return {
    fileName: r.file_name,
    projectId: r.project_id || null,
    documentTitle: r.document_title,
    documentCode: r.document_code,
    version: r.version,
    organizationUnit: r.organization_unit,
    authorName: r.author_name,
    deletedAt: toIso(r.deleted_at),
    deletedByEmail: r.deleted_by_email,
    ownerUserId: r.owner_user_id || null
  };
}

export async function listTrashFor(ctx: Ctx, user: DbUser) {
  const rows = await ctx.db.query(
    `SELECT file_name, project_id::text AS project_id, document_title, document_code, version, organization_unit,
            author_name, deleted_at, deleted_by_email, owner_user_id::text AS owner_user_id
       FROM process_project_trash
      WHERE $1 OR owner_user_id::text = $2
      ORDER BY deleted_at DESC
      LIMIT 200`,
    [user.role === 'ADMIN', user.id]
  );
  return rows.map(trashRowToEntry);
}

async function requireTrashEntry(ctx: Ctx, user: DbUser, fileName: string) {
  const rows = await ctx.db.query(
    `SELECT file_name, project_id::text AS project_id, owner_user_id::text AS owner_user_id, project_data
       FROM process_project_trash WHERE file_name = $1`,
    [fileName]
  );
  const row = rows[0];
  if (!row) throw notFound('El proyecto no está en la papelera.');
  if (user.role !== 'ADMIN' && row.owner_user_id !== user.id) throw notFound('El proyecto no está en la papelera.');
  return row;
}

async function resolveProjectForFile(ctx: Ctx, user: DbUser, fileName: string) {
  const access = await requireProjectPermission(ctx, user, fileName, 'READ_ONLY');
  return { access, projectId: access.projectId as string };
}

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

export function registerProjectRoutes(router: Router): void {
  router.add('GET', '/projects', async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db.query(
      `SELECT p.file_name, p.project_id::text AS project_id, p.document_code, p.document_title, p.version, p.author_name,
              p.organization_unit, p.node_count, p.total_lead_time_minutes, p.risk_count, p.checkpoint_count, p.updated_at,
              pr.owner_user_id::text AS owner_user_id, m.permission_level
         FROM process_projects p
         JOIN projects pr ON pr.project_id = p.project_id
         LEFT JOIN project_members m ON m.project_id = p.project_id AND m.user_id::text = $2
        WHERE $1 OR pr.owner_user_id::text = $2 OR m.permission_level IS NOT NULL
        ORDER BY p.updated_at DESC`,
      [user.role === 'ADMIN', user.id]
    );
    return { ok: true, projects: rows.map((r) => rowToSummary(r, user)) };
  });

  router.add('GET', '/projects/:fileName', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const access = await requireProjectPermission(ctx, user, fileName, 'READ_ONLY');
    const rows = await ctx.db.query(
      `SELECT graph_data, document_code, document_title, version, updated_at FROM process_projects WHERE file_name = $1`,
      [fileName]
    );
    const row = rows[0];
    const graph = parseJson(row.graph_data) || {};
    const project = {
      ...graph,
      fileName,
      projectId: access.projectId,
      documentControl: {
        ...(graph.documentControl || {}),
        documentTitle: row.document_title || graph.documentControl?.documentTitle,
        documentCode: row.document_code || graph.documentControl?.documentCode,
        version: row.version || graph.documentControl?.version,
        updatedAt: toIso(row.updated_at)
      }
    };
    return { ok: true, project, access: { permission: access.permission, isOwner: access.isOwner } };
  });

  router.add('GET', '/projects/:fileName/access', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const access = await getProjectAccess(ctx, user, fileName);
    if (!access.exists || !access.permission) throw notFound('Proyecto no encontrado.');
    return {
      ok: true,
      projectId: access.projectId,
      permission: access.permission,
      isOwner: access.isOwner,
      ownerUserId: access.ownerUserId
    };
  });

  router.add('PUT', '/projects/:fileName', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const incoming = ctx.req.body?.project;
    validateProjectPayload(incoming);
    const now = new Date(ctx.now()).toISOString();

    const access = await getProjectAccess(ctx, user, fileName);

    // --- Guardar una versión existente ---
    if (access.exists) {
      if (!access.permission) throw notFound('Proyecto no encontrado.');
      if (access.permission === 'READ_ONLY') throw forbidden('Tenés acceso de solo lectura sobre este proyecto.');
      const projectId = access.projectId as string;
      const projectRow = (await getProjectById(ctx, projectId))!;
      const stored = (await loadStoredProject(ctx, fileName)) || {};
      let next = access.permission === 'COMMENTS' ? mergeCommentsOnly(stored, incoming) : { ...incoming };

      // Cambio de código documental: único entre proyectos y aplicado a todas las versiones.
      const requestedCode = access.permission === 'EDITOR' ? normalizeCode(next.documentControl?.documentCode) : '';
      let codeChangedFrom: string | null = null;
      if (requestedCode && requestedCode.toUpperCase() !== projectRow.documentCode.trim().toUpperCase()) {
        await changeProjectCode(ctx, projectId, requestedCode);
        codeChangedFrom = projectRow.documentCode;
      }
      const effectiveCode = codeChangedFrom ? requestedCode : projectRow.documentCode;

      // La autoría registrada no se puede reescribir desde el cliente.
      next = {
        ...next,
        fileName,
        projectId,
        documentControl: {
          ...(next.documentControl || {}),
          documentCode: effectiveCode,
          createdByUserId: stored.documentControl?.createdByUserId ?? access.ownerUserId ?? undefined,
          createdByEmail: stored.documentControl?.createdByEmail,
          updatedAt: now
        }
      };
      await updateProjectRow(ctx, fileName, next);
      if (access.permission === 'COMMENTS') {
        await writeAudit(ctx, actorOf(user), 'CANVAS_COMMENT_UPDATED', fileName);
      }
      if (codeChangedFrom) {
        await writeAudit(ctx, actorOf(user), 'PROJECT_METADATA_UPDATED', fileName, {
          codeChangedFrom,
          codeChangedTo: effectiveCode,
          projectId
        });
      }
      return { ok: true, fileName, projectId, documentCode: effectiveCode, updatedAt: now, created: false };
    }

    // --- Nueva versión de un proyecto existente ---
    const sourceFileName = ctx.req.body?.sourceFileName ? requireFileName(ctx.req.body.sourceFileName) : null;
    if (sourceFileName) {
      const sourceAccess = await requireProjectPermission(ctx, user, sourceFileName, 'EDITOR');
      const projectId = sourceAccess.projectId as string;
      const projectRow = (await getProjectById(ctx, projectId))!;
      const source = (await loadStoredProject(ctx, sourceFileName)) || {};
      const project = {
        ...incoming,
        fileName,
        projectId,
        documentControl: {
          ...incoming.documentControl,
          documentCode: projectRow.documentCode,
          createdByUserId: source.documentControl?.createdByUserId ?? projectRow.ownerUserId ?? undefined,
          createdByEmail: source.documentControl?.createdByEmail,
          updatedAt: now
        }
      };
      const inserted = await insertProjectRow(ctx, fileName, project, projectId, projectRow.ownerUserId);
      if (!inserted) throw conflict('Ya existe un proyecto con ese nombre de archivo. Reintentá.');
      await writeAudit(ctx, actorOf(user), 'CANVAS_PROJECT_SAVED', fileName, {
        created: true,
        newVersionOf: sourceFileName,
        projectId,
        version: project.documentControl.version
      });
      return { ok: true, fileName, projectId, documentCode: projectRow.documentCode, updatedAt: now, created: true };
    }

    // --- Proyecto nuevo (alta, importación o copia): identidad y código propios ---
    const requestedCode = normalizeCode(incoming.documentControl?.documentCode);
    const created = await createProject(ctx, requestedCode, user.id);
    const project = {
      ...incoming,
      fileName,
      projectId: created.projectId,
      documentControl: {
        ...incoming.documentControl,
        documentCode: created.documentCode,
        createdByUserId: user.id,
        createdByEmail: user.email,
        updatedAt: now
      }
    };
    const inserted = await insertProjectRow(ctx, fileName, project, created.projectId, user.id);
    if (!inserted) {
      await ctx.db.query(`DELETE FROM projects WHERE project_id::text = $1 AND NOT EXISTS (
        SELECT 1 FROM process_projects WHERE project_id::text = $1)`, [created.projectId]);
      throw conflict('Ya existe un proyecto con ese nombre de archivo. Reintentá.');
    }
    await writeAudit(ctx, actorOf(user), 'CANVAS_PROJECT_SAVED', fileName, {
      created: true,
      projectId: created.projectId,
      documentCode: created.documentCode,
      codeReassignedFrom: created.codeReassignedFrom,
      title: project.documentControl.documentTitle
    });
    return {
      ok: true,
      fileName,
      projectId: created.projectId,
      documentCode: created.documentCode,
      codeReassignedFrom: created.codeReassignedFrom,
      updatedAt: now,
      created: true
    };
  });

  router.add('DELETE', '/projects/:fileName', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const access = await requireProjectPermission(ctx, user, fileName, 'READ_ONLY');
    if (!canManageProject(user, access)) {
      throw forbidden('Solo el propietario del proyecto o un Administrador pueden eliminarlo.');
    }
    // La versión pasa a la papelera (se puede restaurar). El proyecto y su código se conservan.
    const moved = await ctx.db.query(
      `WITH moved AS (
         DELETE FROM process_projects WHERE file_name = $1
         RETURNING file_name, project_id, owner_user_id, document_code, document_title, version, organization_unit,
                   author_name, graph_data
       )
       INSERT INTO process_project_trash (
         file_name, project_id, owner_user_id, document_code, document_title, version, organization_unit, author_name,
         deleted_by_email, deleted_at, project_data
       )
       SELECT file_name, project_id, owner_user_id, document_code, document_title, version, organization_unit, author_name,
              $2, NOW(), graph_data
         FROM moved
       ON CONFLICT (file_name) DO UPDATE SET
         project_id = EXCLUDED.project_id, owner_user_id = EXCLUDED.owner_user_id, document_code = EXCLUDED.document_code,
         document_title = EXCLUDED.document_title, version = EXCLUDED.version,
         organization_unit = EXCLUDED.organization_unit, author_name = EXCLUDED.author_name,
         deleted_by_email = EXCLUDED.deleted_by_email, deleted_at = EXCLUDED.deleted_at, project_data = EXCLUDED.project_data
       RETURNING file_name`,
      [fileName, user.email]
    );
    if (moved.length === 0) throw notFound('Proyecto no encontrado.');
    await ctx.db.query(`DELETE FROM canvas_active_locks WHERE project_file_name = $1`, [fileName]);
    await writeAudit(ctx, actorOf(user), 'PROJECT_MOVED_TO_TRASH', fileName, { projectId: access.projectId });
    return { ok: true };
  });

  // --- Papelera ---
  router.add('GET', '/trash', async (ctx) => {
    const user = await requireUser(ctx);
    return { ok: true, entries: await listTrashFor(ctx, user) };
  });

  router.add('POST', '/trash/:fileName/restore', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const entry = await requireTrashEntry(ctx, user, fileName);
    const exists = await ctx.db.query(`SELECT 1 FROM process_projects WHERE file_name = $1`, [fileName]);
    if (exists.length > 0) throw conflict('Ya existe un proyecto activo con ese nombre de archivo.');

    const data = parseJson(entry.project_data) || {};
    // Vuelve a su proyecto si todavía existe; si no, se recrea con su código (o uno libre si ya se usa).
    let projectRow = entry.project_id ? await getProjectById(ctx, entry.project_id) : null;
    let codeReassignedFrom: string | null = null;
    if (!projectRow) {
      const created = await createProject(ctx, normalizeCode(data.documentControl?.documentCode), entry.owner_user_id);
      projectRow = created;
      codeReassignedFrom = created.codeReassignedFrom;
    }
    const project = {
      ...data,
      fileName,
      projectId: projectRow.projectId,
      documentControl: { ...(data.documentControl || {}), documentCode: projectRow.documentCode }
    };
    const restored = await ctx.db.query(
      `WITH r AS (DELETE FROM process_project_trash WHERE file_name = $1 RETURNING file_name)
       INSERT INTO process_projects (
         file_name, document_code, document_title, version, status, author_name, organization_unit, process_objective,
         node_count, total_lead_time_minutes, risk_count, checkpoint_count, graph_data, project_id, owner_user_id, updated_at
       )
       SELECT file_name, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::uuid, $15::uuid, NOW() FROM r
       RETURNING file_name`,
      [fileName, ...rowValues(project), projectRow.projectId, projectRow.ownerUserId]
    );
    if (restored.length === 0) throw notFound('El proyecto no está en la papelera.');
    // Recupera los permisos que la versión tenía antes de la Fase 2 (tabla anterior, por archivo).
    await ctx.db.query(
      `INSERT INTO project_members (project_id, user_id, permission_level, assigned_by, assigned_at)
       SELECT $2::uuid, perm.user_id, perm.permission_level, perm.assigned_by, perm.assigned_at
         FROM project_user_permissions perm
         JOIN app_users u ON u.id = perm.user_id
        WHERE perm.project_file_name = $1
          AND perm.permission_level IN ('READ_ONLY', 'COMMENTS', 'EDITOR')
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      [fileName, projectRow.projectId]
    );
    await writeAudit(ctx, actorOf(user), 'PROJECT_RESTORED_FROM_TRASH', fileName, {
      title: project.documentControl.documentTitle,
      code: projectRow.documentCode,
      codeReassignedFrom
    });
    return { ok: true, fileName, codeReassignedFrom };
  });

  router.add('DELETE', '/trash/:fileName', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const entry = await requireTrashEntry(ctx, user, fileName);
    await ctx.db.query(`DELETE FROM process_project_trash WHERE file_name = $1`, [fileName]);
    // Si era lo último que quedaba del proyecto, se libera su código y sus participantes.
    if (entry.project_id) {
      const left = await ctx.db.query(
        `SELECT (SELECT count(*) FROM process_projects WHERE project_id::text = $1)
              + (SELECT count(*) FROM process_project_trash WHERE project_id::text = $1) AS n`,
        [entry.project_id]
      );
      if (Number(left[0]?.n) === 0) {
        await ctx.db.query(`DELETE FROM project_members WHERE project_id::text = $1`, [entry.project_id]);
        await ctx.db.query(`DELETE FROM projects WHERE project_id::text = $1`, [entry.project_id]);
      }
    }
    await writeAudit(ctx, actorOf(user), 'PROJECT_PURGED', fileName, { projectId: entry.project_id });
    return { ok: true };
  });

  // --- Participantes (por proyecto: valen para todas sus versiones) ---
  router.add('GET', '/projects/:fileName/participants', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const { access, projectId } = await resolveProjectForFile(ctx, user, fileName);
    const rows = await ctx.db.query(
      `SELECT m.user_id::text AS user_id, m.permission_level, m.assigned_at, u.full_name, u.email, u.organization_unit
         FROM project_members m
         JOIN app_users u ON u.id = m.user_id
        WHERE m.project_id::text = $1`,
      [projectId]
    );
    const participants = rows.map((r) => ({
      id: `${projectId}:${r.user_id}`,
      userId: r.user_id,
      fullName: r.full_name || 'Usuario',
      email: r.email,
      organizationUnit: r.organization_unit || '',
      permissionLevel: r.user_id === access.ownerUserId ? 'EDITOR' : r.permission_level,
      assignedAt: toIso(r.assigned_at),
      isOwner: r.user_id === access.ownerUserId
    }));
    if (access.ownerUserId && !participants.some((x) => x.isOwner)) {
      const owner = await findUserById(ctx.db, access.ownerUserId);
      if (owner) {
        participants.unshift({
          id: `${projectId}:${owner.id}`,
          userId: owner.id,
          fullName: owner.full_name,
          email: owner.email,
          organizationUnit: owner.organization_unit || '',
          permissionLevel: 'EDITOR',
          assignedAt: toIso(owner.created_at),
          isOwner: true
        });
      }
    }
    return { ok: true, projectId, ownerUserId: access.ownerUserId, participants };
  });

  router.add('PUT', '/projects/:fileName/participants/:userId', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const targetUserId = requireUuid(p.userId, 'userId');
    const level = oneOf(ctx.req.body?.permissionLevel, PERMISSION_LEVELS, 'permissionLevel');
    const { access, projectId } = await resolveProjectForFile(ctx, user, fileName);
    if (!canManageProject(user, access)) {
      throw forbidden('Solo los administradores o el propietario del proyecto pueden asignar participantes.');
    }
    if (targetUserId === access.ownerUserId) throw badRequest(OWNER_FIXED_MESSAGE);
    const target = await findUserById(ctx.db, targetUserId);
    if (!target) throw notFound('Usuario no encontrado.');
    if (RANK[level] < RANK.EDITOR) await assertKeepsAnEditor(ctx, projectId, access.ownerUserId, targetUserId);
    await upsertMember(ctx, user, targetUserId, projectId, level);
    await writeAudit(ctx, actorOf(user), 'CANVAS_PERMISSION_ASSIGNED', fileName, {
      projectId,
      targetUserId,
      permissionLevel: level,
      operatorRole: user.role
    });
    return { ok: true };
  });

  router.add('DELETE', '/projects/:fileName/participants/:userId', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const targetUserId = requireUuid(p.userId, 'userId');
    const { access, projectId } = await resolveProjectForFile(ctx, user, fileName);
    if (!canManageProject(user, access)) {
      throw forbidden('Solo los administradores o el propietario del proyecto pueden revocar permisos.');
    }
    if (targetUserId === access.ownerUserId) throw badRequest(OWNER_FIXED_MESSAGE);
    await assertKeepsAnEditor(ctx, projectId, access.ownerUserId, targetUserId);
    await ctx.db.query(`DELETE FROM project_members WHERE project_id::text = $1 AND user_id::text = $2`, [
      projectId,
      targetUserId
    ]);
    await writeAudit(ctx, actorOf(user), 'CANVAS_PERMISSION_REMOVED', fileName, {
      projectId,
      targetUserId,
      operatorRole: user.role
    });
    return { ok: true };
  });

  router.add('POST', '/projects/:fileName/participants/by-unit', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const unit = requireString(ctx.req.body?.organizationUnit, 'unidad organizativa', 160);
    const level = oneOf(ctx.req.body?.permissionLevel, PERMISSION_LEVELS, 'permissionLevel');
    const { access, projectId } = await resolveProjectForFile(ctx, user, fileName);
    if (!canManageProject(user, access)) {
      throw forbidden('Solo los administradores o el propietario pueden asignar permisos por área.');
    }
    const targets = await ctx.db.query<{ id: string }>(
      `SELECT id::text AS id FROM app_users WHERE status = 'ACTIVE' AND lower(trim(organization_unit)) = lower(trim($1))`,
      [unit]
    );
    const eligible = targets.filter((t) => t.id !== access.ownerUserId);
    if (eligible.length === 0) throw badRequest(`No hay usuarios activos registrados bajo el área "${unit}".`);
    let count = 0;
    for (const t of eligible) {
      if (RANK[level] < RANK.EDITOR) {
        try {
          await assertKeepsAnEditor(ctx, projectId, access.ownerUserId, t.id);
        } catch {
          continue; // no se baja al último editor
        }
      }
      await upsertMember(ctx, user, t.id, projectId, level);
      count++;
    }
    await writeAudit(ctx, actorOf(user), 'CANVAS_PERMISSION_ASSIGNED', fileName, {
      projectId,
      organizationUnit: unit,
      permissionLevel: level,
      count
    });
    return { ok: true, count };
  });

  /** Solo ADMIN: matriz de permisos expresada por archivo de versión (para la consola de administración). */
  router.add('GET', '/permissions', async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query(
      `SELECT m.project_id::text || ':' || m.user_id::text || ':' || pp.file_name AS id,
              m.user_id::text AS user_id, pp.file_name AS project_file_name, m.permission_level,
              m.assigned_by::text AS assigned_by, m.assigned_at
         FROM project_members m
         JOIN process_projects pp ON pp.project_id = m.project_id`
    );
    return {
      ok: true,
      permissions: rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        projectFileName: r.project_file_name,
        permissionLevel: r.permission_level,
        assignedBy: r.assigned_by,
        assignedAt: toIso(r.assigned_at)
      }))
    };
  });
}
