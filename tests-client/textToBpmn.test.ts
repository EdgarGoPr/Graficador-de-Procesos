import { describe, expect, it } from 'vitest';
import { buildDiagramFromText } from '../src/services/textToBpmn';
import { runQualityAudit } from '../src/services/qualityLinter';
import { autoLayoutProcessCanvas, findOverlaps, NODE_MARGIN } from '../src/utils/layoutGeometry';
import type { ProcessProjectFile } from '../src/types/project';

function wrapInProject(built: NonNullable<ReturnType<typeof buildDiagramFromText>>): ProcessProjectFile {
  const now = '2026-11-16T00:00:00.000Z';
  return {
    schemaVersion: '1.0.0',
    documentControl: {
      documentTitle: 'Tramitación de Expediente',
      documentCode: 'PRC-0001',
      version: 'v1.0',
      authorName: 'Analista',
      organizationUnit: 'Dirección General',
      processObjective: 'Objetivo de prueba',
      createdAt: now,
      updatedAt: now,
      status: 'DRAFT',
      legalNormativeBasis: [],
      revisionHistory: []
    },
    pools: [
      {
        id: 'pool_1',
        name: 'Tramitación de Expediente',
        organization: 'Dirección General',
        lanes: built.lanes
      }
    ],
    nodes: built.nodes,
    edges: built.edges
  };
}

describe('Generador Texto a BPMN (PST-112)', () => {
  const ACCEPTANCE_TEXT = [
    '1. Mesa de Entradas recibe la solicitud y valida los requisitos en el sistema.',
    '2. Mesa de Entradas verifica si cumple con la documentación obligatoria.',
    '3. Si cumple, Asuntos Jurídicos emite el dictamen legal vinculante en 3 días hábiles.',
    '4. Si no cumple, Mesa de Entradas rechaza la solicitud.',
    '5. Dirección General firma la resolución aprobatoria en 48 horas.'
  ].join('\n');

  it('caso de aceptación: genera ramas, plazos y carriles correctos sin riesgos inventados', () => {
    const built = buildDiagramFromText(ACCEPTANCE_TEXT);
    expect(built).not.toBeNull();
    const res = built!;

    expect(res.lanes.map((l) => l.name)).toEqual([
      'Mesa de Entradas',
      'Asuntos Jurídicos',
      'Dirección General'
    ]);

    const gateways = res.nodes.filter((n) => n.type === 'ExclusiveGateway');
    expect(gateways).toHaveLength(1);
    const gtw = gateways[0];
    expect(gtw.data.title).toContain('Cumple con la documentación obligatoria');

    const gtwOutgoing = res.edges.filter((e) => e.source === gtw.id);
    expect(gtwOutgoing).toHaveLength(2);
    expect(gtwOutgoing.map((e) => e.data?.conditionText)).toEqual(['Cumple', 'No cumple']);

    const dictamenTask = res.nodes.find((n) => n.data.title.toLowerCase().includes('dictamen'));
    expect(dictamenTask).toBeDefined();
    expect(dictamenTask!.data.laneName).toBe('Asuntos Jurídicos');
    expect(dictamenTask!.data.slaDuration?.value).toBe(3);
    expect(dictamenTask!.data.slaDuration?.unit).toBe('BUSINESS_DAYS');
    expect(dictamenTask!.data.title).not.toMatch(/3 d[ií]as/i);

    const firmaTask = res.nodes.find((n) => n.data.title.toLowerCase().includes('firma'));
    expect(firmaTask).toBeDefined();
    expect(firmaTask!.data.laneName).toBe('Dirección General');
    expect(firmaTask!.data.slaDuration?.value).toBe(48);
    expect(firmaTask!.data.slaDuration?.unit).toBe('HOURS');
    expect(firmaTask!.data.title).not.toMatch(/48 horas/i);

    // Sin riesgos inventados ni entradas genéricas
    res.nodes.forEach((n) => {
      expect(n.data.operationalRisks).toEqual([]);
      expect(n.data.inputs).toEqual([]);
      expect(n.data.standardId).toMatch(/^[A-Z]{3}-\d{2}$/);
    });
  });

  it('caso de aceptación: da 0 errores y 0 advertencias en runQualityAudit y 0 superposiciones tras autoLayoutProcessCanvas', () => {
    const built = buildDiagramFromText(ACCEPTANCE_TEXT)!;
    const laidOut = autoLayoutProcessCanvas(wrapInProject(built));

    const audit = runQualityAudit(laidOut.nodes, laidOut.edges, laidOut.pools);
    expect(audit.criticalCount).toBe(0);
    expect(audit.warningCount).toBe(0);

    const workNodes = laidOut.nodes.filter((n) => n.type !== 'PoolLane' && n.type !== 'StickyNote');
    expect(findOverlaps(workNodes, NODE_MARGIN)).toEqual([]);
  });

  it('interpreta "Si cumple Asuntos Jurídicos emite el dictamen" sin coma como rama y no como compuerta', () => {
    const text = [
      'Mesa de Entradas verifica si cumple con los requisitos.',
      'Si cumple Asuntos Jurídicos emite el dictamen en 2 días.',
      'En caso contrario, Mesa de Entradas archiva el expediente.'
    ].join('\n');

    const built = buildDiagramFromText(text)!;
    const gateways = built.nodes.filter((n) => n.type === 'ExclusiveGateway');
    expect(gateways).toHaveLength(1);
    expect(built.nodes.some((n) => n.data.title.includes('Emite el dictamen'))).toBe(true);

    const laidOut = autoLayoutProcessCanvas(wrapInProject(built));
    const audit = runQualityAudit(laidOut.nodes, laidOut.edges, laidOut.pools);
    expect(audit.criticalCount).toBe(0);
    expect(audit.warningCount).toBe(0);
  });

  it('decisión sin ramas explícitas genera salidas Sí y No sin errores ni advertencias', () => {
    const text = [
      'Mesa de Entradas recibe el pedido.',
      'Mesa de Entradas evalúa si corresponde dar curso.',
      'Dirección General aprueba la gestión.'
    ].join('\n');

    const built = buildDiagramFromText(text)!;
    const gtw = built.nodes.find((n) => n.type === 'ExclusiveGateway')!;
    const out = built.edges.filter((e) => e.source === gtw.id);
    expect(out.map((e) => e.data?.conditionText).sort()).toEqual(['No', 'Sí']);

    const laidOut = autoLayoutProcessCanvas(wrapInProject(built));
    const audit = runQualityAudit(laidOut.nodes, laidOut.edges, laidOut.pools);
    expect(audit.criticalCount).toBe(0);
    expect(audit.warningCount).toBe(0);

    const workNodes = laidOut.nodes.filter((n) => n.type !== 'PoolLane' && n.type !== 'StickyNote');
    expect(findOverlaps(workNodes, NODE_MARGIN)).toEqual([]);
  });
});
