import { ProcessProjectFile } from '../types/project';
import { ProjectDiffResult, NodeDiffItem, EdgeDiffItem, DiffChangeType } from '../types/diff';

export function compareProjects(
  baseProject: ProcessProjectFile,
  targetProject: ProcessProjectFile
): ProjectDiffResult {
  const baseNodes = (baseProject.nodes || []).filter((n) => n.type !== 'PoolLane');
  const targetNodes = (targetProject.nodes || []).filter((n) => n.type !== 'PoolLane');

  const baseNodeMap = new Map(baseNodes.map((n) => [n.id, n]));
  const targetNodeMap = new Map(targetNodes.map((n) => [n.id, n]));

  const nodeDiffs: NodeDiffItem[] = [];

  // Check target nodes against base
  targetNodes.forEach((tNode) => {
    const bNode = baseNodeMap.get(tNode.id);
    if (!bNode) {
      // Added in target
      nodeDiffs.push({
        nodeId: tNode.id,
        standardId: tNode.data?.standardId || 'ID',
        title: tNode.data?.title || 'Actividad',
        changeType: 'ADDED',
        changes: [{ field: 'Estado', oldValue: 'No existía', newValue: 'Elemento Nuevo' }],
        node: tNode
      });
    } else {
      // Check modifications
      const changes: { field: string; oldValue: string; newValue: string }[] = [];

      if (bNode.data?.title !== tNode.data?.title) {
        changes.push({ field: 'Título', oldValue: bNode.data?.title || '', newValue: tNode.data?.title || '' });
      }
      if (bNode.data?.roleName !== tNode.data?.roleName) {
        changes.push({ field: 'Rol', oldValue: bNode.data?.roleName || '', newValue: tNode.data?.roleName || '' });
      }
      if (bNode.data?.itSystem !== tNode.data?.itSystem) {
        changes.push({ field: 'Sistema TI', oldValue: bNode.data?.itSystem || '', newValue: tNode.data?.itSystem || '' });
      }
      if (bNode.data?.description !== tNode.data?.description) {
        changes.push({ field: 'Descripción', oldValue: bNode.data?.description || '', newValue: tNode.data?.description || '' });
      }
      if (bNode.data?.slaDuration?.value !== tNode.data?.slaDuration?.value) {
        changes.push({
          field: 'SLA',
          oldValue: `${bNode.data?.slaDuration?.value || 0} ${bNode.data?.slaDuration?.unit || ''}`,
          newValue: `${tNode.data?.slaDuration?.value || 0} ${tNode.data?.slaDuration?.unit || ''}`
        });
      }

      if (changes.length > 0) {
        nodeDiffs.push({
          nodeId: tNode.id,
          standardId: tNode.data?.standardId || 'ID',
          title: tNode.data?.title || 'Actividad',
          changeType: 'MODIFIED',
          changes,
          node: tNode
        });
      }
    }
  });

  // Check removed nodes
  baseNodes.forEach((bNode) => {
    if (!targetNodeMap.has(bNode.id)) {
      nodeDiffs.push({
        nodeId: bNode.id,
        standardId: bNode.data?.standardId || 'ID',
        title: bNode.data?.title || 'Actividad',
        changeType: 'REMOVED',
        changes: [{ field: 'Estado', oldValue: 'Existente en v1', newValue: 'Eliminado en v2' }],
        node: bNode
      });
    }
  });

  // Compare Edges
  const baseEdges = baseProject.edges || [];
  const targetEdges = targetProject.edges || [];
  const baseEdgeMap = new Map(baseEdges.map((e) => [e.id, e]));
  const targetEdgeMap = new Map(targetEdges.map((e) => [e.id, e]));

  const edgeDiffs: EdgeDiffItem[] = [];

  targetEdges.forEach((tEdge) => {
    if (!baseEdgeMap.has(tEdge.id)) {
      const sNode = targetNodeMap.get(tEdge.source) || baseNodeMap.get(tEdge.source);
      const tNode = targetNodeMap.get(tEdge.target) || baseNodeMap.get(tEdge.target);
      edgeDiffs.push({
        edgeId: tEdge.id,
        sourceTitle: sNode?.data?.title || tEdge.source,
        targetTitle: tNode?.data?.title || tEdge.target,
        changeType: 'ADDED'
      });
    }
  });

  baseEdges.forEach((bEdge) => {
    if (!targetEdgeMap.has(bEdge.id)) {
      const sNode = baseNodeMap.get(bEdge.source);
      const tNode = baseNodeMap.get(bEdge.target);
      edgeDiffs.push({
        edgeId: bEdge.id,
        sourceTitle: sNode?.data?.title || bEdge.source,
        targetTitle: tNode?.data?.title || bEdge.target,
        changeType: 'REMOVED'
      });
    }
  });

  const addedNodesCount = nodeDiffs.filter((n) => n.changeType === 'ADDED').length;
  const removedNodesCount = nodeDiffs.filter((n) => n.changeType === 'REMOVED').length;
  const modifiedNodesCount = nodeDiffs.filter((n) => n.changeType === 'MODIFIED').length;
  const addedEdgesCount = edgeDiffs.filter((e) => e.changeType === 'ADDED').length;
  const removedEdgesCount = edgeDiffs.filter((e) => e.changeType === 'REMOVED').length;

  return {
    baseTitle: baseProject.documentControl.documentTitle,
    baseVersion: baseProject.documentControl.version,
    targetTitle: targetProject.documentControl.documentTitle,
    targetVersion: targetProject.documentControl.version,
    nodeDiffs,
    edgeDiffs,
    summary: {
      addedNodesCount,
      removedNodesCount,
      modifiedNodesCount,
      addedEdgesCount,
      removedEdgesCount,
      hasChanges: addedNodesCount > 0 || removedNodesCount > 0 || modifiedNodesCount > 0 || addedEdgesCount > 0 || removedEdgesCount > 0
    }
  };
}
