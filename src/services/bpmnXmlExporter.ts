import { ProcessProjectFile } from '../types/project';

/**
 * Generates ISO/IEC 19510 OMG Standard BPMN 2.0 XML with full diagram interchange (BPMNDI)
 */
export function exportToBpmnXml(project: ProcessProjectFile): string {
  const sanitize = (str: string) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const processId = `Process_${project.documentControl.documentCode.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  const now = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  id="Definitions_ProcesStudio_${Date.now()}"
                  targetNamespace="http://processtudio.io/bpmn"
                  exporter="ProcesStudio Portable"
                  exporterVersion="1.0.0">

  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="${sanitize(project.documentControl.documentTitle)}" processRef="${processId}" />
  </bpmn:collaboration>

  <bpmn:process id="${processId}" name="${sanitize(project.documentControl.documentTitle)}" isExecutable="false">
    <bpmn:documentation>${sanitize(project.documentControl.processObjective || '')}</bpmn:documentation>
`;

  // Lane sets
  const defaultPool = project.pools[0];
  if (defaultPool && defaultPool.lanes.length > 0) {
    xml += `    <bpmn:laneSet id="LaneSet_1">\n`;
    defaultPool.lanes.forEach((lane) => {
      xml += `      <bpmn:lane id="${sanitize(lane.id)}" name="${sanitize(lane.name)}">\n`;
      project.nodes
        .filter((n) => n.type !== 'PoolLane' && n.data?.laneId === lane.id)
        .forEach((n) => {
          xml += `        <bpmn:flowNodeRef>${sanitize(n.id)}</bpmn:flowNodeRef>\n`;
        });
      xml += `      </bpmn:lane>\n`;
    });
    xml += `    </bpmn:laneSet>\n`;
  }

  // Nodes
  project.nodes
    .filter((n) => n.type !== 'PoolLane' && n.type !== 'StickyNote')
    .forEach((node) => {
      const id = sanitize(node.id);
      const name = sanitize(node.data?.title || node.data?.standardId || '');
      const type = node.type;

      if (type === 'StartEvent') {
        xml += `    <bpmn:startEvent id="${id}" name="${name}" />\n`;
      } else if (type === 'EndEvent') {
        xml += `    <bpmn:endEvent id="${id}" name="${name}" />\n`;
      } else if (type === 'ExclusiveGateway') {
        xml += `    <bpmn:exclusiveGateway id="${id}" name="${name}" />\n`;
      } else if (type === 'ParallelGateway') {
        xml += `    <bpmn:parallelGateway id="${id}" name="${name}" />\n`;
      } else if (type === 'ServiceTask') {
        xml += `    <bpmn:serviceTask id="${id}" name="${name}" />\n`;
      } else if (type === 'ManualTask') {
        xml += `    <bpmn:manualTask id="${id}" name="${name}" />\n`;
      } else if (type === 'SubProcess') {
        xml += `    <bpmn:subProcess id="${id}" name="${name}" />\n`;
      } else {
        xml += `    <bpmn:userTask id="${id}" name="${name}" />\n`;
      }
    });

  // Sequence Flows
  project.edges.forEach((edge) => {
    const id = sanitize(edge.id);
    const source = sanitize(edge.source);
    const target = sanitize(edge.target);
    const name = sanitize(edge.data?.conditionText || '');
    xml += `    <bpmn:sequenceFlow id="${id}" name="${name}" sourceRef="${source}" targetRef="${target}" />\n`;
  });

  xml += `  </bpmn:process>\n\n`;

  // BPMN DI (Visual coordinates)
  xml += `  <bpmndi:BPMNDiagram id="BPMNDiagram_1">\n`;
  xml += `    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">\n`;

  // Lanes DI
  project.nodes
    .filter((n) => n.type === 'PoolLane')
    .forEach((laneNode) => {
      const width = (laneNode.style?.width as number) || 2200;
      const height = (laneNode.style?.height as number) || 160;
      xml += `      <bpmndi:BPMNShape id="${sanitize(laneNode.id)}_di" bpmnElement="${sanitize(laneNode.data?.laneId || laneNode.id)}">\n`;
      xml += `        <dc:Bounds x="${laneNode.position.x}" y="${laneNode.position.y}" width="${width}" height="${height}" />\n`;
      xml += `      </bpmndi:BPMNShape>\n`;
    });

  // Activity Nodes DI
  project.nodes
    .filter((n) => n.type !== 'PoolLane' && n.type !== 'StickyNote')
    .forEach((node) => {
      const width = (node.measured?.width || node.width || 210) as number;
      const height = (node.measured?.height || node.height || 120) as number;
      xml += `      <bpmndi:BPMNShape id="${sanitize(node.id)}_di" bpmnElement="${sanitize(node.id)}">\n`;
      xml += `        <dc:Bounds x="${node.position.x}" y="${node.position.y}" width="${width}" height="${height}" />\n`;
      xml += `      </bpmndi:BPMNShape>\n`;
    });

  xml += `    </bpmndi:BPMNPlane>\n`;
  xml += `  </bpmndi:BPMNDiagram>\n`;
  xml += `</bpmn:definitions>`;

  return xml;
}

export function downloadBpmnXmlFile(project: ProcessProjectFile) {
  const xml = exportToBpmnXml(project);
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.documentControl.documentCode}_${project.documentControl.documentTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.bpmn`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
