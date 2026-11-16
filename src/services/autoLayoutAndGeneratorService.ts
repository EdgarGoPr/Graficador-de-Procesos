import { ProcessProjectFile } from '../types/project';
import { MasterCatalogsService } from './masterCatalogsService';
import { autoLayoutProcessCanvas } from '../utils/layoutGeometry';
import { buildDiagramFromText } from './textToBpmn';

export { autoLayoutProcessCanvas };

/**
 * 2. GENERADOR DE DIAGRAMA BPMN DESDE TEXTO NATURAL (PST-083, PST-112)
 *    Las reglas viven en textToBpmn.ts (módulo puro y testeado); aquí se integra con el proyecto
 *    y se ordena el resultado sin superposiciones.
 */
export function generateDiagramFromNaturalText(
  project: ProcessProjectFile,
  rawText: string,
  newTitle?: string
): ProcessProjectFile {
  const catalogs = MasterCatalogsService.getCatalogsSync();
  const built = buildDiagramFromText(rawText, catalogs.roles);
  if (!built) return project;

  const title = newTitle?.trim() || project.documentControl.documentTitle;
  const updatedProject: ProcessProjectFile = {
    ...project,
    documentControl: {
      ...project.documentControl,
      documentTitle: title,
      processObjective: `Ejecutar de manera controlada y auditable el procedimiento "${title}" cumpliendo los plazos establecidos.`,
      updatedAt: new Date().toISOString()
    },
    pools: [
      {
        id: project.pools[0]?.id || 'pool_1',
        name: title,
        organization: project.documentControl.organizationUnit,
        lanes: built.lanes
      }
    ],
    nodes: built.nodes,
    edges: built.edges
  };

  return autoLayoutProcessCanvas(updatedProject);
}

/**
 * 3. MEDIDOR DE SALUD Y COMPLETITUD DOCUMENTAL DEL PROCESO ("Process Readiness Score" - PST-087)
 */
export interface ProcessReadinessEvaluation {
  scorePercentage: number;
  passedChecks: number;
  totalChecks: number;
  missingTips: string[];
}

export function calculateProcessReadinessScore(project: ProcessProjectFile | null): ProcessReadinessEvaluation {
  if (!project) {
    return { scorePercentage: 0, passedChecks: 0, totalChecks: 6, missingTips: [] };
  }

  const workNodes = project.nodes.filter((n) => n.type !== 'PoolLane' && n.type !== 'StickyNote');
  const hasStart = workNodes.some((n) => n.type === 'StartEvent');
  const hasEnd = workNodes.some((n) => n.type === 'EndEvent');
  const hasTasks = workNodes.filter((n) => n.type !== 'StartEvent' && n.type !== 'EndEvent').length >= 2;
  const hasLanes = (project.pools[0]?.lanes?.length || 0) >= 1;
  const hasConnections = project.edges.length >= Math.max(1, workNodes.length - 1);
  const hasDescriptions = workNodes.some((n) => (n.data?.description || '').trim().length > 5);

  const checks = [
    { ok: hasStart, tip: 'Agrega un Evento de Inicio' },
    { ok: hasEnd, tip: 'Agrega un Evento de Fin' },
    { ok: hasTasks, tip: 'Incorpora al menos 2 tareas operativas' },
    { ok: hasLanes, tip: 'Define al menos 1 Carril / Área responsable' },
    { ok: hasConnections, tip: 'Conecta todas las figuras del flujo' },
    { ok: hasDescriptions, tip: 'Completa la descripción en las tareas clave' }
  ];

  const passedChecks = checks.filter((c) => c.ok).length;
  const scorePercentage = Math.round((passedChecks / checks.length) * 100);
  const missingTips = checks.filter((c) => !c.ok).map((c) => c.tip);

  return {
    scorePercentage,
    passedChecks,
    totalChecks: checks.length,
    missingTips
  };
}

