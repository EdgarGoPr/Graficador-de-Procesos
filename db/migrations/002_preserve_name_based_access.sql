-- ============================================================================
-- ProcesStudio · Migración 002 · Conservar accesos otorgados por coincidencia de nombre
-- Antes, un usuario cuyo nombre coincidía con el autor del proyecto era editor implícito.
-- El servidor ya no usa esa regla (era falsificable), así que se vuelve explícita.
-- Requiere la migración 001. Idempotente.
-- ============================================================================
BEGIN;

-- 1. Proyectos sin propietario: si exactamente un usuario coincide con el nombre del autor, pasa a ser el propietario.
WITH candidates AS (
  SELECT p.file_name, (array_agg(u.id))[1] AS user_id, count(*) AS n
    FROM process_projects p
    JOIN app_users u ON lower(trim(u.full_name)) = lower(trim(p.author_name))
   WHERE p.owner_user_id IS NULL
   GROUP BY p.file_name
)
UPDATE process_projects p
   SET owner_user_id = c.user_id
  FROM candidates c
 WHERE p.file_name = c.file_name AND c.n = 1;

-- 2. El resto de las coincidencias por nombre recibe un permiso EDITOR explícito.
INSERT INTO project_user_permissions (id, user_id, project_file_name, permission_level, assigned_by, assigned_at)
SELECT gen_random_uuid(), u.id, p.file_name, 'EDITOR', NULL, NOW()
  FROM process_projects p
  JOIN app_users u ON lower(trim(u.full_name)) = lower(trim(p.author_name))
 WHERE u.role = 'USER'
   AND (p.owner_user_id IS NULL OR p.owner_user_id <> u.id)
ON CONFLICT (user_id, project_file_name) DO UPDATE SET permission_level = 'EDITOR';

COMMIT;
