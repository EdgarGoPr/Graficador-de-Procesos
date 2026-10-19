import { Node } from '@xyflow/react';
import { BpmnNodeData, BPMN_NODE_TYPES } from '../types/process';
import type { ProcessProjectFile } from '../types/project';
import type { SubProcessPathItem } from '../store/useCanvasStore';

export interface ProcessHierarchyItem {
  id: string; // 'root' for parent process or node.id for subprocess
  title: string;
  code: string; // e.g. 'P01', 'P02', 'P03'
  processNumber: number; // 1, 2, 3...
  level: number; // 0 for parent, 1, 2...
  levelCode: string; // 'N00', 'N01', 'N02'
  sigla: string; // e.g. 'P01N00', 'P02N01'
  path: SubProcessPathItem[]; // breadcrumb path to reach this process
}

/**
 * Returns the short mnemonic prefix for each BPMN node type.
 * Specifically distinguishes ServiceTask ('SRV') from UserTask ('TSK').
 */
export function getNodeTypePrefix(nodeType: string): string {
  if (nodeType === BPMN_NODE_TYPES.START_EVENT) return 'INI';
  if (nodeType === BPMN_NODE_TYPES.END_EVENT) return 'FIN';
  if (nodeType === BPMN_NODE_TYPES.SERVICE_TASK) return 'SRV';
  if (nodeType === BPMN_NODE_TYPES.USER_TASK) return 'TSK';
  if (nodeType === BPMN_NODE_TYPES.MANUAL_TASK) return 'MNL';
  if (nodeType === BPMN_NODE_TYPES.EXCLUSIVE_GATEWAY) return 'GTW';
  if (nodeType === BPMN_NODE_TYPES.PARALLEL_GATEWAY) return 'PAR';
  if (nodeType.includes('Gateway')) return 'GTW';
  if (nodeType === BPMN_NODE_TYPES.QUALITY_CHECKPOINT_EVENT) return 'QCP';
  if (nodeType === BPMN_NODE_TYPES.TIMER_BOUNDARY_EVENT) return 'TMR';
  if (nodeType === BPMN_NODE_TYPES.SUB_PROCESS) return 'SUB';
  if (nodeType === BPMN_NODE_TYPES.POOL_LANE) return 'CAR';
  if (nodeType === BPMN_NODE_TYPES.STICKY_NOTE) return 'NOT';
  return 'TSK';
}

/**
 * Scans the entire project tree and returns all processes in hierarchical order:
 * Root Process (P01N00) and all nested SubProcesses (P02N01, P03N01, P04N02...).
 */
export function getAllProjectProcesses(project: ProcessProjectFile | null): ProcessHierarchyItem[] {
  if (!project) return [];

  const items: ProcessHierarchyItem[] = [];

  // Root process is always P01 at level 0 (N00)
  items.push({
    id: 'root',
    title: project.documentControl?.documentTitle || 'Proceso Principal',
    code: 'P01',
    processNumber: 1,
    level: 0,
    levelCode: 'N00',
    sigla: 'P01N00',
    path: [],
  });

  let counter = 1;

  function traverseNodes(
    nodes: Node<BpmnNodeData>[],
    currentLevel: number,
    parentPath: SubProcessPathItem[]
  ) {
    if (!nodes) return;

    for (const node of nodes) {
      if (node.data?.nodeType === BPMN_NODE_TYPES.SUB_PROCESS || node.type === 'SubProcess') {
        counter++;
        const processNumber = counter;
        const code = `P${processNumber < 10 ? '0' + processNumber : processNumber}`;
        const levelCode = `N${currentLevel < 10 ? '0' + currentLevel : currentLevel}`;
        const sigla = `${code}${levelCode}`;
        const title = node.data?.title || `Subproceso ${processNumber}`;

        const itemPath: SubProcessPathItem[] = [
          ...parentPath,
          {
            id: node.id,
            title,
            standardId: sigla,
          },
        ];

        items.push({
          id: node.id,
          title,
          code,
          processNumber,
          level: currentLevel,
          levelCode,
          sigla,
          path: itemPath,
        });

        // Traverse internal nodes if available
        const childNodes = node.data?.subProcessCanvas?.nodes;
        if (childNodes && childNodes.length > 0) {
          traverseNodes(childNodes, currentLevel + 1, itemPath);
        }
      }
    }
  }

  traverseNodes(project.nodes || [], 1, []);

  return items;
}

/**
 * Returns the ProcessHierarchyItem corresponding to the current active path.
 */
export function getCurrentProcessInfo(
  project: ProcessProjectFile | null,
  path: SubProcessPathItem[]
): ProcessHierarchyItem {
  const all = getAllProjectProcesses(project);

  if (!path || path.length === 0) {
    return (
      all[0] || {
        id: 'root',
        title: project?.documentControl?.documentTitle || 'Proceso Principal',
        code: 'P01',
        processNumber: 1,
        level: 0,
        levelCode: 'N00',
        sigla: 'P01N00',
        path: [],
      }
    );
  }

  const currentId = path[path.length - 1].id;
  const match = all.find((item) => item.id === currentId);

  if (match) {
    return match;
  }

  // Fallback if not found in cache
  const level = path.length;
  const levelCode = `N${level < 10 ? '0' + level : level}`;
  const code = `P${(level + 1) < 10 ? '0' + (level + 1) : level + 1}`;
  return {
    id: currentId,
    title: path[path.length - 1].title || 'Subproceso',
    code,
    processNumber: level + 1,
    level,
    levelCode,
    sigla: `${code}${levelCode}`,
    path,
  };
}

/**
 * Calculates the next unique process code for a new SubProcess in the project.
 */
export function getNextSubProcessCode(project: ProcessProjectFile | null): {
  code: string;
  processNumber: number;
} {
  const all = getAllProjectProcesses(project);
  const maxNumber = all.reduce((max, item) => Math.max(max, item.processNumber), 1);
  const nextNumber = maxNumber + 1;
  const code = `P${nextNumber < 10 ? '0' + nextNumber : nextNumber}`;
  return { code, processNumber: nextNumber };
}

/**
 * Builds the hierarchical standard ID for a new node:
 * e.g. "P01-N00-TSK-01" or "P02-N01-SRV-01"
 */
export function formatHierarchicalStandardId(
  processCode: string,
  levelCode: string,
  nodeType: string,
  activeNodes: Node<BpmnNodeData>[]
): string {
  const prefix = getNodeTypePrefix(nodeType);

  // Count existing nodes in this active diagram that share the prefix
  const matchingCount = activeNodes.filter((n) => {
    const existingPrefix = getNodeTypePrefix(n.data?.nodeType || (n.type as any) || '');
    return existingPrefix === prefix;
  }).length;

  const correlative = matchingCount + 1;
  const formattedCount = correlative < 10 ? `0${correlative}` : `${correlative}`;

  return `${processCode}-${levelCode}-${prefix}-${formattedCount}`;
}
