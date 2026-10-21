-- ============================================================================
-- PROCESSTUDIO - ESQUEMA DE BASE DE DATOS POSTGRESQL OPTIMIZADO (NEON.TECH)
-- ============================================================================
-- Este script crea la estructura de persistencia cloud ultraligera con:
-- 1. Métricas indexadas atómicas para el Dashboard (< 2ms de consulta).
-- 2. Columna JSONB comprimida (TOAST) para el grafo BPMN completo.
-- 3. Búsqueda Full-Text (tsvector en español) y coincidencias difusas (Trigram).
-- ============================================================================

-- 1. Habilitar extensiones requeridas en Neon
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Tabla Principal de Proyectos de Procesos
CREATE TABLE IF NOT EXISTS process_projects (
    -- Identificadores y Control de Versión
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(120) NOT NULL UNIQUE,
    document_code VARCHAR(50) NOT NULL,
    document_title VARCHAR(200) NOT NULL,
    version VARCHAR(25) NOT NULL DEFAULT '1.0',
    status VARCHAR(25) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'REVIEW', 'APPROVED'
    
    -- Metadatos Organizacionales y Autoría
    author_name VARCHAR(150) NOT NULL,
    organization_unit VARCHAR(160) NOT NULL,
    process_objective TEXT,
    
    -- Métricas Precalculadas (Permiten renderizar el Dashboard en 1 consulta < 1KB)
    node_count SMALLINT NOT NULL DEFAULT 0,
    total_lead_time_minutes INTEGER NOT NULL DEFAULT 0,
    risk_count SMALLINT NOT NULL DEFAULT 0,
    checkpoint_count SMALLINT NOT NULL DEFAULT 0,
    
    -- Marcas Temporales
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Grafo Completo del Proceso (Comprimido con TOAST PGLZ/LZ4 nativo)
    graph_data JSONB NOT NULL,
    
    -- Vector de Búsqueda Full-Text Search (Auto-generado y ponderado)
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', coalesce(document_title, '')), 'A') ||
        setweight(to_tsvector('spanish', coalesce(document_code, '')), 'A') ||
        setweight(to_tsvector('spanish', coalesce(author_name, '')), 'B') ||
        setweight(to_tsvector('spanish', coalesce(organization_unit, '')), 'C') ||
        setweight(to_tsvector('spanish', coalesce(process_objective, '')), 'D')
    ) STORED
);

-- 3. Índices de Alto Rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON process_projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_doc_code ON process_projects(document_code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON process_projects(status);

-- Índice GIN para Búsqueda Full-Text
CREATE INDEX IF NOT EXISTS idx_projects_search_vector ON process_projects USING GIN(search_vector);

-- Índice Trigram para autocompletado y coincidencia aproximada de títulos
CREATE INDEX IF NOT EXISTS idx_projects_title_trgm ON process_projects USING GIN(document_title gin_trgm_ops);

-- 4. Disparador para actualizar automáticamente 'updated_at'
CREATE OR REPLACE FUNCTION update_process_projects_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_process_projects_updated_at ON process_projects;
CREATE TRIGGER trg_process_projects_updated_at
BEFORE UPDATE ON process_projects
FOR EACH ROW
EXECUTE FUNCTION update_process_projects_timestamp();

-- 5. Seguridad a Nivel de Fila (RLS) Permisiva para ProcesStudio
ALTER TABLE process_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to process_projects" ON process_projects;
CREATE POLICY "Allow full access to process_projects"
ON process_projects
FOR ALL
USING (true)
WITH CHECK (true);

-- Verificación de estado de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'process_projects';
