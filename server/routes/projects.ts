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
import { Router } from '../router.js';
import { CanvasPermission, DbUser, PERMISSION_LEVELS, findUserById } from '../users.js';

const MAX_PROJECT_BYTES = 4 * 1024 * 1024;

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

async function insertProjectRow(ctx: Ctx, fileName: string, project: any, ownerUserId: string | null): Promise<boolean> {
  const dc = project.documentControl;
  const m = computeMetrics(project);
  const rows = await ctx.db.query(
    `INSERT INTO process_projects (
       file_name, document_code, document_title, version, status, author_name, organization_unit, process_objective,
       node_count, total_lead_time_minutes, risk_count, checkpoint_count, graph_data, owner_user_id, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::uuid, NOW())
     ON CONFLICT (file_name) DO NOTHING
     RETURNING file_name`,
    [
      fileName,
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
      JSON.stringify(project),
      ownerUserId
    ]
  );
  return rows.length > 0;
}

async function updateProjectRow(ctx: Ctx, fileName: string, project: any): Promise<void> {
  const dc = project.documentControl;
  const m = computeMetrics(project);
  await ctx.db.query(
    `UPDATE process_projects SET
       document_code = $2, document_title = $3, version = $4, status = $5, author_name = $6, organization_unit = $7,
       process_objective = $8, node_count = $9, total_lead_time_minutes = $10, risk_count = $11, checkpoint_count = $12,
       graph_data = $13::jsonb, updated_at = NOW()
     WHERE file_name = $1`,
    [
      fileName,
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
    ]
  );
}

async function upsertPermission(ctx: Ctx, operator: DbUser, targetUserId: string, fileName: string, level: CanvasPermission) {
  await ctx.db.query(
    `INSERT INTO project_user_permissions (id, user_id, project_file_name, permission_level, assigned_by, assigned_at)
     VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4::uuid, NOW())
     ON CONFLICT (user_id, project_file_name) DO UPDATE SET
       permission_level = EXCLUDED.permission_level, assigned_by = EXCLUDED.assigned_by, assigned_at = NOW()`,
    [targetUserId, fileName, level, operator.id]
  );
}

function trashRowToEntry(r: any) {
  return {
    fileName: r.file_name,
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
    `SELECT file_name, document_title, document_code, version, organization_unit, author_name, deleted_at, deleted_by_email,
            owner_user_id::text AS owner_user_id
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
    `SELECT file_name, owner_user_id::text AS owner_user_id, project_data FROM process_project_trash WHERE file_name = $1`,
    [fileName]
  );
  const row = rows[0];
  if (!row) throw notFound('El proyecto no está en la papelera.');
  if (user.role !== 'ADMIN' && row.owner_user_id !== user.id) throw notFound('El proyecto no está en la papelera.');
  return row;
}

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

export function registerProjectRoutes(router: Router): void {
  router.add('GET', '/projects', async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db.query(
      `SELECT p.file_name, p.document_code, p.document_title, p.version, p.author_name, p.organization_unit,
              p.node_count, p.total_lead_time_minutes, p.risk_count, p.checkpoint_count, p.updated_at,
              p.owner_user_id::text AS owner_user_id, perm.permission_level
         FROM process_projects p
         LEFT JOIN project_user_permissions perm
           ON perm.project_file_name = p.file_name AND perm.user_id::text = $2
        WHERE $1 OR p.owner_user_id::text = $2 OR perm.permission_level IS NOT NULL
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
    return { ok: true, permission: access.permission, isOwner: access.isOwner, ownerUserId: access.ownerUserId };
  });

  router.add('PUT', '/projects/:fileName', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const incoming = ctx.req.body?.project;
    validateProjectPayload(incoming);
    const now = new Date(ctx.now()).toISOString();

    const access = await getProjectAccess(ctx, user, fileName);

    if (access.exists) {
      if (!access.permission) throw notFound('Proyecto no encontrado.');
      if (access.permission === 'READ_ONLY') throw forbidden('Tenés acceso de solo lectura sobre este proyecto.');
      const stored = (await loadStoredProject(ctx, fileName)) || {};
      let next = access.permission === 'COMMENTS' ? mergeCommentsOnly(stored, incoming) : { ...incoming };
      // La autoría registrada no se puede reescribir desde el cliente.
      next = {
        ...next,
        fileName,
        documentControl: {
          ...(next.documentControl || {}),
          createdByUserId: stored.documentControl?.createdByUserId ?? access.ownerUserId ?? undefined,
          createdByEmail: stored.documentControl?.createdByEmail,
          updatedAt: now
        }
      };
      await updateProjectRow(ctx, fileName, next);
      if (access.permission === 'COMMENTS') {
        await writeAudit(ctx, actorOf(user), 'CANVAS_COMMENT_UPDATED', fileName);
      }
      return { ok: true, fileName, updatedAt: now, created: false };
    }

    // Alta de un archivo nuevo: proyecto nuevo, importación, copia o nueva versión de otro.
    const sourceFileName = ctx.req.body?.sourceFileName ? requireFileName(ctx.req.body.sourceFileName) : null;
    let ownerUserId: string | null = user.id;
    let createdBy = { createdByUserId: user.id as string | undefined, createdByEmail: user.email as string | undefined };

    if (sourceFileName) {
      const sourceAccess = await requireProjectPermission(ctx, user, sourceFileName, 'EDITOR');
      const source = (await loadStoredProject(ctx, sourceFileName)) || {};
      ownerUserId = sourceAccess.ownerUserId;
      createdBy = {
        createdByUserId: source.documentControl?.createdByUserId ?? sourceAccess.ownerUserId ?? undefined,
        createdByEmail: source.documentControl?.createdByEmail
      };
    }

    const project = {
      ...incoming,
      fileName,
      documentControl: { ...incoming.documentControl, ...createdBy, updatedAt: now }
    };
    const inserted = await insertProjectRow(ctx, fileName, project, ownerUserId);
    if (!inserted) throw conflict('Ya existe un proyecto con ese nombre de archivo. Reintentá.');

    if (sourceFileName) {
      // Los participantes de la versión de origen conservan su acceso en la nueva versión.
      await ctx.db.query(
        `INSERT INTO project_user_permissions (id, user_id, project_file_name, permission_level, assigned_by, assigned_at)
         SELECT gen_random_uuid(), user_id, $2, permission_level, assigned_by, NOW()
           FROM project_user_permissions WHERE project_file_name = $1
         ON CONFLICT (user_id, project_file_name) DO NOTHING`,
        [sourceFileName, fileName]
      );
      if (ownerUserId !== user.id && user.role !== 'ADMIN') {
        await upsertPermission(ctx, user, user.id, fileName, 'EDITOR');
      }
    }

    await writeAudit(ctx, actorOf(user), 'CANVAS_PROJECT_SAVED', fileName, {
      created: true,
      sourceFileName,
      title: project.documentControl.documentTitle
    });
    return { ok: true, fileName, updatedAt: now, created: true };
  });

  router.add('DELETE', '/projects/:fileName', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const access = await requireProjectPermission(ctx, user, fileName, 'READ_ONLY');
    if (!canManageProject(user, access)) {
      throw forbidden('Solo el propietario del proyecto o un Administrador pueden eliminarlo.');
    }
    const moved = await ctx.db.query(
      `WITH moved AS (
         DELETE FROM process_projects WHERE file_name = $1
         RETURNING file_name, owner_user_id, document_code, document_title, version, organization_unit, author_name, graph_data
       )
       INSERT INTO process_project_trash (
         file_name, owner_user_id, document_code, document_title, version, organization_unit, author_name,
         deleted_by_email, deleted_at, project_data
       )
       SELECT file_name, owner_user_id, document_code, document_title, version, organization_unit, author_name, $2, NOW(), graph_data
         FROM moved
       ON CONFLICT (file_name) DO UPDATE SET
         owner_user_id = EXCLUDED.owner_user_id, document_code = EXCLUDED.document_code,
         document_title = EXCLUDED.document_title, version = EXCLUDED.version,
         organization_unit = EXCLUDED.organization_unit, author_name = EXCLUDED.author_name,
         deleted_by_email = EXCLUDED.deleted_by_email, deleted_at = EXCLUDED.deleted_at, project_data = EXCLUDED.project_data
       RETURNING file_name`,
      [fileName, user.email]
    );
    if (moved.length === 0) throw notFound('Proyecto no encontrado.');
    await ctx.db.query(`DELETE FROM canvas_active_locks WHERE project_file_name = $1`, [fileName]);
    await writeAudit(ctx, actorOf(user), 'PROJECT_MOVED_TO_TRASH', fileName);
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

    const project = { ...(parseJson(entry.project_data) || {}), fileName };
    const dc = project.documentControl || {};
    const m = computeMetrics(project);
    const restored = await ctx.db.query(
      `WITH r AS (DELETE FROM process_project_trash WHERE file_name = $1 RETURNING file_name)
       INSERT INTO process_projects (
         file_name, document_code, document_title, version, status, author_name, organization_unit, process_objective,
         node_count, total_lead_time_minutes, risk_count, checkpoint_count, graph_data, owner_user_id, updated_at
       )
       SELECT file_name, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::uuid, NOW() FROM r
       RETURNING file_name`,
      [
        fileName,
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
        JSON.stringify(project),
        entry.owner_user_id
      ]
    );
    if (restored.length === 0) throw notFound('El proyecto no está en la papelera.');
    await writeAudit(ctx, actorOf(user), 'PROJECT_RESTORED_FROM_TRASH', fileName, {
      title: dc.documentTitle,
      code: dc.documentCode
    });
    return { ok: true, fileName };
  });

  router.add('DELETE', '/trash/:fileName', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    await requireTrashEntry(ctx, user, fileName);
    await ctx.db.query(`DELETE FROM process_project_trash WHERE file_name = $1`, [fileName]);
    await ctx.db.query(
      `DELETE FROM project_user_permissions
        WHERE project_file_name = $1 AND NOT EXISTS (SELECT 1 FROM process_projects WHERE file_name = $1)`,
      [fileName]
    );
    await writeAudit(ctx, actorOf(user), 'PROJECT_PURGED', fileName);
    return { ok: true };
  });

  // --- Participantes y permisos ---
  router.add('GET', '/projects/:fileName/participants', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    await requireProjectPermission(ctx, user, fileName, 'READ_ONLY');
    const rows = await ctx.db.query(
      `SELECT perm.id, perm.user_id::text AS user_id, perm.permission_level, perm.assigned_at,
              u.full_name, u.email, u.organization_unit
         FROM project_user_permissions perm
         JOIN app_users u ON u.id = perm.user_id
        WHERE perm.project_file_name = $1`,
      [fileName]
    );
    return {
      ok: true,
      participants: rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        fullName: r.full_name || 'Usuario',
        email: r.email,
        organizationUnit: r.organization_unit || '',
        permissionLevel: r.permission_level,
        assignedAt: toIso(r.assigned_at)
      }))
    };
  });

  router.add('PUT', '/projects/:fileName/participants/:userId', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const targetUserId = requireUuid(p.userId, 'userId');
    const level = oneOf(ctx.req.body?.permissionLevel, PERMISSION_LEVELS, 'permissionLevel');
    const access = await requireProjectPermission(ctx, user, fileName, 'READ_ONLY');
    if (!canManageProject(user, access)) {
      throw forbidden('Solo los administradores o el propietario del proyecto pueden asignar participantes.');
    }
    const target = await findUserById(ctx.db, targetUserId);
    if (!target) throw notFound('Usuario no encontrado.');
    await upsertPermission(ctx, user, targetUserId, fileName, level);
    await writeAudit(ctx, actorOf(user), 'CANVAS_PERMISSION_ASSIGNED', fileName, {
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
    const access = await requireProjectPermission(ctx, user, fileName, 'READ_ONLY');
    if (!canManageProject(user, access)) {
      throw forbidden('Solo los administradores o el propietario del proyecto pueden revocar permisos.');
    }
    await ctx.db.query(
      `DELETE FROM project_user_permissions WHERE user_id::text = $1 AND project_file_name = $2`,
      [targetUserId, fileName]
    );
    await writeAudit(ctx, actorOf(user), 'CANVAS_PERMISSION_REMOVED', fileName, { targetUserId, operatorRole: user.role });
    return { ok: true };
  });

  router.add('POST', '/projects/:fileName/participants/by-unit', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const unit = requireString(ctx.req.body?.organizationUnit, 'unidad organizativa', 160);
    const level = oneOf(ctx.req.body?.permissionLevel, PERMISSION_LEVELS, 'permissionLevel');
    const access = await requireProjectPermission(ctx, user, fileName, 'READ_ONLY');
    if (!canManageProject(user, access)) {
      throw forbidden('Solo los administradores o el propietario pueden asignar permisos por área.');
    }
    const targets = await ctx.db.query<{ id: string }>(
      `SELECT id::text AS id FROM app_users WHERE status = 'ACTIVE' AND lower(trim(organization_unit)) = lower(trim($1))`,
      [unit]
    );
    if (targets.length === 0) throw badRequest(`No hay usuarios activos registrados bajo el área "${unit}".`);
    for (const t of targets) {
      await upsertPermission(ctx, user, t.id, fileName, level);
    }
    await writeAudit(ctx, actorOf(user), 'CANVAS_PERMISSION_ASSIGNED', fileName, {
      organizationUnit: unit,
      permissionLevel: level,
      count: targets.length
    });
    return { ok: true, count: targets.length };
  });

  router.add('GET', '/permissions', async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query(
      `SELECT id, user_id::text AS user_id, project_file_name, permission_level, assigned_by::text AS assigned_by, assigned_at
         FROM project_user_permissions`
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
