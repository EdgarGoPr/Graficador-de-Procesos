import type { Ctx } from './context.js';
import { badRequest, conflict } from './http.js';

/**
 * Identidad de proyecto (Fase 2): un proyecto (tabla projects) agrupa sus versiones
 * (filas de process_projects) por project_id. El código documental es único por proyecto.
 */

export interface ProjectRow {
  projectId: string;
  documentCode: string;
  ownerUserId: string | null;
}

const CODE_MAX = 50;

export function normalizeCode(code: unknown): string {
  return typeof code === 'string' ? code.trim() : '';
}

export function isUniqueViolation(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as any).code === '23505';
}

export async function getProjectById(ctx: Ctx, projectId: string): Promise<ProjectRow | null> {
  const rows = await ctx.db.query(
    `SELECT project_id::text AS project_id, document_code, owner_user_id::text AS owner_user_id
       FROM projects WHERE project_id::text = $1`,
    [projectId]
  );
  return rows[0] ? { projectId: rows[0].project_id, documentCode: rows[0].document_code, ownerUserId: rows[0].owner_user_id } : null;
}

/** Proyecto que ya usa ese código (sin distinguir mayúsculas), con el título de su última versión. */
export async function findProjectByCode(
  ctx: Ctx,
  code: string,
  excludeProjectId: string | null = null
): Promise<{ projectId: string; title: string } | null> {
  const rows = await ctx.db.query(
    `SELECT pr.project_id::text AS project_id,
            (SELECT pp.document_title FROM process_projects pp
              WHERE pp.project_id = pr.project_id ORDER BY pp.updated_at DESC LIMIT 1) AS title
       FROM projects pr
      WHERE upper(trim(pr.document_code)) = upper(trim($1))
        AND ($2::text IS NULL OR pr.project_id::text <> $2::text)
      LIMIT 1`,
    [code, excludeProjectId]
  );
  return rows[0] ? { projectId: rows[0].project_id, title: rows[0].title || 'sin título' } : null;
}

export function codeTakenMessage(code: string, title: string): string {
  return `El código ${code} ya pertenece al proyecto «${title}». Elegí otro código.`;
}

export function validateCode(code: string): void {
  if (!code) throw badRequest('El código documental no puede quedar vacío.');
  if (code.length > CODE_MAX) throw badRequest(`El código documental no puede superar ${CODE_MAX} caracteres.`);
}

/** Próximo código correlativo libre con formato PRC-0001. */
export async function nextFreeCode(ctx: Ctx): Promise<string> {
  const rows = await ctx.db.query<{ n: number }>(
    `SELECT coalesce(max((substring(document_code from '^[Pp][Rr][Cc]-(\\d+)$'))::int), 0) + 1 AS n
       FROM projects WHERE document_code ~* '^PRC-\\d+$'`
  );
  return `PRC-${String(Number(rows[0]?.n) || 1).padStart(4, '0')}`;
}

/**
 * Crea un proyecto. Si el código pedido está libre se usa; si está vacío o ya pertenece a otro
 * proyecto, se asigna el próximo libre (y se informa cuál era el pedido).
 */
export async function createProject(
  ctx: Ctx,
  requestedCode: string,
  ownerUserId: string | null
): Promise<ProjectRow & { codeReassignedFrom: string | null }> {
  let code = requestedCode && requestedCode.length <= CODE_MAX ? requestedCode : '';
  let reassignedFrom: string | null = null;
  if (code && (await findProjectByCode(ctx, code))) {
    reassignedFrom = code;
    code = '';
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    if (!code) code = await nextFreeCode(ctx);
    try {
      const rows = await ctx.db.query(
        `INSERT INTO projects (project_id, document_code, owner_user_id, created_at)
         VALUES (gen_random_uuid(), $1, $2::uuid, NOW())
         RETURNING project_id::text AS project_id`,
        [code, ownerUserId]
      );
      return { projectId: rows[0].project_id, documentCode: code, ownerUserId, codeReassignedFrom: reassignedFrom };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      // Otro alta tomó el mismo código al mismo tiempo: se prueba con el siguiente libre.
      if (!reassignedFrom && requestedCode) reassignedFrom = requestedCode;
      code = '';
    }
  }
  throw conflict('No se pudo asignar un código documental libre. Reintentá.');
}

/**
 * Cambia el código de un proyecto y lo propaga a todas sus versiones.
 * Rechaza (409) si el código ya pertenece a otro proyecto.
 */
export async function changeProjectCode(ctx: Ctx, projectId: string, newCode: string): Promise<void> {
  validateCode(newCode);
  const taken = await findProjectByCode(ctx, newCode, projectId);
  if (taken) throw conflict(codeTakenMessage(newCode, taken.title));
  try {
    await ctx.db.query(`UPDATE projects SET document_code = $2 WHERE project_id::text = $1`, [projectId, newCode]);
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict(`El código ${newCode} ya pertenece a otro proyecto. Elegí otro código.`);
    throw err;
  }
  // Solo cambia el código en las demás versiones; su fecha de última modificación se conserva.
  await ctx.db.query(
    `UPDATE process_projects
        SET document_code = $2::text,
            graph_data = jsonb_set(graph_data, '{documentControl,documentCode}', to_jsonb($2::text), true)
      WHERE project_id::text = $1`,
    [projectId, newCode]
  );
}
