const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const connectionString = process.env.VITE_NEON_DATABASE_URL || 
  'postgresql://neondb_owner:npg_aOoK7BDbi9Ns@ep-aged-cake-b7m9a8zi.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(connectionString);

function calculateLeadTimeMinutes(nodes) {
  let totalHours = 0;
  (nodes || []).forEach(node => {
    const sla = node.data?.slaDuration;
    if (sla) {
      switch (sla.unit) {
        case 'HOURS':
          totalHours += sla.value;
          break;
        case 'BUSINESS_DAYS':
          totalHours += sla.value * 8;
          break;
        case 'CALENDAR_DAYS':
          totalHours += sla.value * 24;
          break;
      }
    }
  });
  return Math.round(totalHours * 60);
}

async function syncAll() {
  console.log('🔄 Sincronizando proyectos de MiAppProcesos_USB/Proyectos/ a Neon...');
  const dirPath = path.resolve(__dirname, '../MiAppProcesos_USB/Proyectos');
  
  if (!fs.existsSync(dirPath)) {
    console.log('No existe la carpeta de proyectos.');
    return;
  }

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
  console.log(`📁 Encontrados ${files.length} archivos JSON:`);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    try {
      const raw = fs.readFileSync(fullPath, 'utf8');
      const proj = JSON.parse(raw);

      const doc = proj.documentControl || {};
      const nodes = proj.nodes || [];
      const totalLeadTimeMinutes = calculateLeadTimeMinutes(nodes);
      const nodeCount = nodes.length;
      const riskCount = nodes.reduce((acc, n) => acc + (n.data?.operationalRisks?.length || 0), 0);
      const checkpointCount = nodes.filter(
        n => n.data?.qualityCheckpoint || n.data?.nodeType === 'QualityCheckpointEvent'
      ).length;

      const fileName = proj.fileName || file;

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
          ${doc.documentTitle || file},
          ${doc.version || '1.0'},
          ${doc.status || 'DRAFT'},
          ${doc.authorName || 'Edgar Gonzalez de Prada'},
          ${doc.organizationUnit || 'General'},
          ${doc.processObjective || ''},
          ${nodeCount},
          ${totalLeadTimeMinutes},
          ${riskCount},
          ${checkpointCount},
          ${JSON.stringify(proj)},
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

      console.log(`  ✓ Subido a Neon: [${doc.documentCode || 'N/A'}] ${doc.documentTitle || file} (${nodeCount} nodos)`);
    } catch (err) {
      console.error(`  ❌ Error al procesar ${file}:`, err.message);
    }
  }

  // Verificar recuento en Neon
  const countRes = await sql`SELECT count(*)::int as total FROM process_projects;`;
  console.log(`\n🎉 Total de proyectos persistidos en Neon PostgreSQL: ${countRes[0].total}`);
}

syncAll().catch(console.error);
