const { neon } = require('@neondatabase/serverless');

const connectionString = process.env.VITE_NEON_DATABASE_URL;

if (!connectionString) {
  console.error(
    '❌ Falta la variable de entorno VITE_NEON_DATABASE_URL.\n' +
    '   Definila en tu archivo .env (ver .env.example) y ejecutá:\n' +
    '   node --env-file=.env scripts/setup-neon-db.cjs'
  );
  process.exit(1);
}

async function runSetup() {
  console.log('⚡ Conectando a Neon Serverless...');
  const sql = neon(connectionString);

  const statements = [
    {
      name: 'Extensión uuid-ossp',
      query: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    },
    {
      name: 'Extensión pg_trgm',
      query: `CREATE EXTENSION IF NOT EXISTS "pg_trgm";`
    },
    {
      name: 'Tabla process_projects',
      query: `
        CREATE TABLE IF NOT EXISTS process_projects (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          file_name VARCHAR(120) NOT NULL UNIQUE,
          document_code VARCHAR(50) NOT NULL,
          document_title VARCHAR(200) NOT NULL,
          version VARCHAR(25) NOT NULL DEFAULT '1.0',
          status VARCHAR(25) NOT NULL DEFAULT 'DRAFT',
          author_name VARCHAR(150) NOT NULL,
          organization_unit VARCHAR(160) NOT NULL,
          process_objective TEXT,
          node_count SMALLINT NOT NULL DEFAULT 0,
          total_lead_time_minutes INTEGER NOT NULL DEFAULT 0,
          risk_count SMALLINT NOT NULL DEFAULT 0,
          checkpoint_count SMALLINT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          graph_data JSONB NOT NULL,
          search_vector tsvector GENERATED ALWAYS AS (
            setweight(to_tsvector('spanish', coalesce(document_title, '')), 'A') ||
            setweight(to_tsvector('spanish', coalesce(document_code, '')), 'A') ||
            setweight(to_tsvector('spanish', coalesce(author_name, '')), 'B') ||
            setweight(to_tsvector('spanish', coalesce(organization_unit, '')), 'C') ||
            setweight(to_tsvector('spanish', coalesce(process_objective, '')), 'D')
          ) STORED
        );
      `
    },
    {
      name: 'Índice idx_projects_updated_at',
      query: `CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON process_projects(updated_at DESC);`
    },
    {
      name: 'Índice idx_projects_doc_code',
      query: `CREATE INDEX IF NOT EXISTS idx_projects_doc_code ON process_projects(document_code);`
    },
    {
      name: 'Índice idx_projects_status',
      query: `CREATE INDEX IF NOT EXISTS idx_projects_status ON process_projects(status);`
    },
    {
      name: 'Índice GIN Full-Text search_vector',
      query: `CREATE INDEX IF NOT EXISTS idx_projects_search_vector ON process_projects USING GIN(search_vector);`
    },
    {
      name: 'Índice Trigram title_trgm',
      query: `CREATE INDEX IF NOT EXISTS idx_projects_title_trgm ON process_projects USING GIN(document_title gin_trgm_ops);`
    },
    {
      name: 'Función disparadora updated_at',
      query: `
        CREATE OR REPLACE FUNCTION update_process_projects_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'Eliminar trigger previo si existe',
      query: `DROP TRIGGER IF EXISTS trg_process_projects_updated_at ON process_projects;`
    },
    {
      name: 'Crear trigger trg_process_projects_updated_at',
      query: `
        CREATE TRIGGER trg_process_projects_updated_at
        BEFORE UPDATE ON process_projects
        FOR EACH ROW
        EXECUTE FUNCTION update_process_projects_timestamp();
      `
    },
    {
      name: 'Habilitar RLS en process_projects',
      query: `ALTER TABLE process_projects ENABLE ROW LEVEL SECURITY;`
    },
    {
      name: 'Eliminar política previa si existe',
      query: `DROP POLICY IF EXISTS "Allow full access to process_projects" ON process_projects;`
    },
    {
      name: 'Crear política permisiva RLS',
      query: `
        CREATE POLICY "Allow full access to process_projects"
        ON process_projects
        FOR ALL
        USING (true)
        WITH CHECK (true);
      `
    }
  ];

  for (const st of statements) {
    process.stdout.write(`  ⏳ Ejecutando: ${st.name}... `);
    try {
      await sql.query(st.query);
      console.log('✓ OK');
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  }

  // Verificación final
  const tables = await sql.query(`SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name = 'process_projects' LIMIT 5;`);
  console.log(`\n🎉 Base de datos en Neon configurada con éxito. Columnas verificadas: ${tables.length}`);
}

runSetup().catch(err => {
  console.error('Error fatal al configurar Neon:', err);
  process.exit(1);
});
