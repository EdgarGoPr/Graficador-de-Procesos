import { ProcessProjectFile } from '../types/project';
import { BPMN_NODE_TYPES, GATEWAY_RESOLUTION_TYPES, TIME_UNIT_TYPES } from '../types/process';

export const sampleProjects: ProcessProjectFile[] = [
  {
    schemaVersion: '1.0.0',
    documentControl: {
      documentTitle: 'Procedimiento de Presentación y Resolución de Descargos de Tránsito',
      documentCode: 'PRC-TF-2026-002',
      version: '1.0',
      authorName: 'Dr. Alejandro Martínez (Analista Senior de Procesos)',
      organizationUnit: 'Tribunal Administrativo de Faltas - Juzgado N° 1',
      processObjective: 'Reglamentar el flujo secuencial de recepción, examen de admisibilidad, sustanciación probatoria y dictado de resolución de descargos por presuntas infracciones viales con estricto apego al debido proceso y control de plazos legales perentorios.',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:30:00Z',
      status: 'APPROVED',
      legalNormativeBasis: [
        'Código de Convivencia Ciudadana (Ley Prov. 10.326)',
        'Ley Nacional de Tránsito y Seguridad Vial N° 24.449',
        'Ordenanza Municipal de Procedimiento Administrativo Sancionatorio N° 12.850'
      ],
      revisionHistory: [
        {
          revisionDate: '2026-09-01T08:00:00Z',
          version: '1.0',
          author: 'Dr. Alejandro Martínez',
          changeDescription: 'Emisión inicial estandarizada bajo BPMN 2.0 e ISO 9001:2015'
        }
      ]
    },
    pools: [
      {
        id: 'pool-main',
        name: 'Tribunal de Faltas Municipal',
        organization: 'Dirección General de Justicia de Faltas',
        lanes: [
          {
            id: 'lane-ciudadano',
            name: 'Ciudadano / Presunto Infractor',
            role: 'Administrado o Apoderado Legal',
            system: 'Portal Web Vecino / Mesa de Entradas',
            colorHex: '#3b82f6',
            order: 0
          },
          {
            id: 'lane-mesa',
            name: 'Mesa de Entradas y Notificaciones',
            role: 'Agente Administrativo Receptor',
            system: 'SAM / Expediente Electrónico',
            colorHex: '#10b981',
            order: 1
          },
          {
            id: 'lane-juzgado',
            name: 'Secretaría Letrada y Juez de Faltas',
            role: 'Juez / Secretario de Faltas',
            system: 'VUPRA / Gestor Judicial de Actas',
            colorHex: '#8b5cf6',
            order: 2
          },
          {
            id: 'lane-tesoreria',
            name: 'Apremiante / Tesorería Municipal',
            role: 'Oficial de Cuentas y Recaudación',
            system: 'Sistema Tributario Municipal (STM)',
            colorHex: '#f59e0b',
            order: 3
          }
        ]
      }
    ],
    nodes: [
      {
        id: 'node-start',
        type: 'StartEvent',
        position: { x: 50, y: 80 },
        data: {
          standardId: 'EVT-01',
          title: 'Notificación de Acta de Infracción',
          description: 'El ciudadano recibe la cédula de notificación del acta de infracción vial o constata acta en el sistema.',
          nodeType: BPMN_NODE_TYPES.START_EVENT,
          laneId: 'lane-ciudadano',
          itSystem: 'Portal Web Vecino / Cédula Postal',
          legalFramework: 'Ord. 12.850 Art. 12',
          inputs: ['Acta de infracción labrada', 'Cédula de notificación fehaciente'],
          outputs: ['Plazo legal de descargo abierto'],
          operationalRisks: [
            {
              riskId: 'RSK-01',
              description: 'Nulidad de notificación por vicio de domicilio o falta de acuse',
              probability: 'MEDIUM',
              impact: 'HIGH',
              mitigatingControl: 'Validación cruzada de domicilio fiscal electrónico en RENAPER y Registro Automotor',
              controlType: 'PREVENTIVE'
            }
          ],
          tags: ['Inicio', 'Cédula']
        }
      },
      {
        id: 'node-task-presentacion',
        type: 'UserTask',
        position: { x: 260, y: 70 },
        data: {
          standardId: 'TSK-01',
          title: 'Presentación Formal de Descargo y Prueba',
          description: 'El presunto infractor o su letrado redacta el escrito de descargo, adjunta copia de DNI, cédula verde y ofrece pruebas documentales/periciales.',
          nodeType: BPMN_NODE_TYPES.USER_TASK,
          laneId: 'lane-ciudadano',
          itSystem: 'Portal Vecino Digital (VUPRA)',
          legalFramework: 'Ord. 12.850 Art. 24',
          slaDuration: {
            value: 10,
            unit: TIME_UNIT_TYPES.BUSINESS_DAYS,
            iso8601String: 'P10D',
            isPeremptory: true
          },
          inputs: ['Escrito de descargo firmado', 'Prueba documental digitalizada', 'Acreditación de personería'],
          outputs: ['Constancia digital de recepción con código hash y timestamp'],
          operationalRisks: [
            {
              riskId: 'RSK-02',
              description: 'Presentación extemporánea fuera de los 10 días hábiles',
              probability: 'HIGH',
              impact: 'HIGH',
              mitigatingControl: 'Timestamp criptográfico en servidor que bloquea automáticamente recepción tras vencimiento',
              controlType: 'PREVENTIVE'
            }
          ],
          tags: ['Ciudadano', 'Descargo']
        }
      },
      {
        id: 'node-qc-admisibilidad',
        type: 'QualityCheckpointEvent',
        position: { x: 500, y: 220 },
        data: {
          standardId: 'QC-01',
          title: 'Control de Admisibilidad y Plazo Legal',
          description: 'Mesa de Entradas verifica la legitimación activa, personería, cumplimiento del plazo de 10 días hábiles e integridad de la documentación.',
          nodeType: BPMN_NODE_TYPES.QUALITY_CHECKPOINT_EVENT,
          laneId: 'lane-mesa',
          itSystem: 'Expediente Electrónico (SAM)',
          legalFramework: 'Ord. 12.850 Art. 26',
          qualityCheckpoint: {
            checkpointCode: 'QC-01',
            inspectionCriteria: 'Verificación 100% de legitimación, firma digital/ológrafa válida y plazo perentorio.',
            severity: 'CRITICAL',
            sampleRatePercentage: 100,
            responsibleRole: 'Agente Receptor de Mesa de Entradas',
            evidenceRequired: 'Carátula electrónica con sello de admisibilidad formal'
          },
          inputs: ['Escrito de descargo presentado', 'Legajo de infracción digital'],
          outputs: ['Acta de admisibilidad aprobada o rechazo in límine'],
          operationalRisks: [],
          tags: ['Control Calidad', 'ISO 9001']
        }
      },
      {
        id: 'node-gtw-admisible',
        type: 'ExclusiveGateway',
        position: { x: 740, y: 230 },
        data: {
          standardId: 'GTW-01',
          title: '¿Descargo Admisible y en Plazo?',
          description: 'Bifurcación exclusiva según resultado del control formal de admisibilidad.',
          nodeType: BPMN_NODE_TYPES.EXCLUSIVE_GATEWAY,
          laneId: 'lane-mesa',
          itSystem: 'SAM',
          legalFramework: 'Ord. 12.850 Art. 27',
          inputs: ['Resultado de QC-01'],
          outputs: ['Ruta admitida a juzgado o rechazo'],
          operationalRisks: [],
          tags: ['Compuerta', 'Admisibilidad']
        }
      },
      {
        id: 'node-task-rechazo',
        type: 'ServiceTask',
        position: { x: 705, y: 80 },
        data: {
          standardId: 'TSK-02',
          title: 'Notificación de Inadmisibilidad',
          description: 'Emisión automática de decreto de rechazo in límine por extemporaneidad o falta de personería no subsanada.',
          nodeType: BPMN_NODE_TYPES.SERVICE_TASK,
          laneId: 'lane-mesa',
          itSystem: 'SAM / Cédula Electrónica',
          legalFramework: 'Ord. 12.850 Art. 28',
          slaDuration: {
            value: 48,
            unit: TIME_UNIT_TYPES.HOURS,
            iso8601String: 'PT48H',
            isPeremptory: false
          },
          inputs: ['Decreto de inadmisibilidad'],
          outputs: ['Cédula de rechazo remitida al infractor'],
          operationalRisks: [],
          tags: ['Rechazo', 'Notificación']
        }
      },
      {
        id: 'node-task-evaluacion',
        type: 'UserTask',
        position: { x: 960, y: 360 },
        data: {
          standardId: 'TSK-03',
          title: 'Sustanciación y Evaluación Jurídico-Probatoria',
          description: 'El Juez de Faltas analiza las pruebas aportadas, informes técnicos de cinemómetros/radares y antecedentes del infractor en el Registro de Infractores.',
          nodeType: BPMN_NODE_TYPES.USER_TASK,
          laneId: 'lane-juzgado',
          itSystem: 'VUPRA / Gestor Judicial',
          legalFramework: 'Ley 24.449 Art. 69; Ord. 12.850 Art. 35',
          slaDuration: {
            value: 15,
            unit: TIME_UNIT_TYPES.BUSINESS_DAYS,
            iso8601String: 'P15D',
            isPeremptory: true
          },
          inputs: ['Expediente admisibilizado', 'Informe de homologación INTI', 'Registro de Reincidencia'],
          outputs: ['Dictamen jurídico conclusivo'],
          operationalRisks: [
            {
              riskId: 'RSK-03',
              description: 'Prescripción de la acción contravencional por mora procesal (plazo máximo 1 año)',
              probability: 'LOW',
              impact: 'HIGH',
              mitigatingControl: 'Dashboard de alertas de semáforo de vencimiento por expediente en VUPRA',
              controlType: 'PREVENTIVE'
            }
          ],
          tags: ['Juez', 'Sustanciación']
        }
      },
      {
        id: 'node-gtw-resolucion',
        type: 'ExclusiveGateway',
        position: { x: 1220, y: 370 },
        data: {
          standardId: 'GTW-02',
          title: 'Tipología de Resolución Jurisdiccional',
          description: 'Determinación del sentido del fallo contravencional por parte del Magistrado.',
          nodeType: BPMN_NODE_TYPES.EXCLUSIVE_GATEWAY,
          laneId: 'lane-juzgado',
          itSystem: 'VUPRA',
          legalFramework: 'Ord. 12.850 Art. 48',
          gatewayResolutionType: GATEWAY_RESOLUTION_TYPES.SENTENCE_FINE,
          inputs: ['Dictamen probatorio'],
          outputs: ['Vía de resolución seleccionada'],
          operationalRisks: [],
          tags: ['Sentencia', 'Bifurcación']
        }
      },
      {
        id: 'node-task-sobreseimiento',
        type: 'UserTask',
        position: { x: 1400, y: 240 },
        data: {
          standardId: 'TSK-04',
          title: 'Dictado de Sentencia de Sobreseimiento / Archivo',
          description: 'Absolución por acreditación fehaciente de falta de autoría, defecto insubsanable del acta o caducidad del radar.',
          nodeType: BPMN_NODE_TYPES.USER_TASK,
          laneId: 'lane-juzgado',
          itSystem: 'VUPRA / Archivo Central',
          legalFramework: 'Ord. 12.850 Art. 52 Inc. A',
          slaDuration: {
            value: 5,
            unit: TIME_UNIT_TYPES.BUSINESS_DAYS,
            iso8601String: 'P5D',
            isPeremptory: false
          },
          inputs: ['Prueba eximente contundente'],
          outputs: ['Sentencia absolutoria', 'Oficio de baja de deuda registral'],
          operationalRisks: [],
          tags: ['Absolución', 'Archivo']
        }
      },
      {
        id: 'node-task-condena',
        type: 'UserTask',
        position: { x: 1400, y: 360 },
        data: {
          standardId: 'TSK-05',
          title: 'Dictado de Sentencia Condenatoria y Liquidación',
          description: 'Fijación de sanción pecuniaria en Unidades Fijas (UF), accesorias de inhabilitación para conducir e imposición de costas.',
          nodeType: BPMN_NODE_TYPES.USER_TASK,
          laneId: 'lane-juzgado',
          itSystem: 'VUPRA / SAM',
          legalFramework: 'Ord. 12.850 Art. 53',
          slaDuration: {
            value: 5,
            unit: TIME_UNIT_TYPES.BUSINESS_DAYS,
            iso8601String: 'P5D',
            isPeremptory: false
          },
          inputs: ['Configuración tipificada de la infracción'],
          outputs: ['Cédula de sentencia formal', 'Boleta de liquidación de multa judicial'],
          operationalRisks: [
            {
              riskId: 'RSK-04',
              description: 'Error en la cotización de Unidad Fija vigente al momento del hecho',
              probability: 'LOW',
              impact: 'MEDIUM',
              mitigatingControl: 'Cálculo algorítmico automatizado ligado a tabla oficial de combustibles ACA',
              controlType: 'PREVENTIVE'
            }
          ],
          tags: ['Condena', 'Multa']
        }
      },
      {
        id: 'node-task-probation',
        type: 'UserTask',
        position: { x: 1400, y: 480 },
        data: {
          standardId: 'TSK-06',
          title: 'Homologación de Trabajo Comunitario / Probation',
          description: 'Sustitución de multa por tareas comunitarias de seguridad vial o curso de reeducación vial para primeros infractores.',
          nodeType: BPMN_NODE_TYPES.USER_TASK,
          laneId: 'lane-juzgado',
          itSystem: 'VUPRA / Secretaría de Tránsito',
          legalFramework: 'Ord. 12.850 Art. 58',
          slaDuration: {
            value: 30,
            unit: TIME_UNIT_TYPES.CALENDAR_DAYS,
            iso8601String: 'P30D',
            isPeremptory: true
          },
          inputs: ['Solicitud de probation', 'Informe social favorable'],
          outputs: ['Convenio de tareas comunitarias firmado'],
          operationalRisks: [],
          tags: ['Probation', 'Educación']
        }
      },
      {
        id: 'node-task-cobro',
        type: 'ServiceTask',
        position: { x: 1680, y: 360 },
        data: {
          standardId: 'TSK-07',
          title: 'Emisión de Título Ejecutivo y Gestión de Cobro',
          description: 'Vencido el plazo de pago voluntario de la sentencia, se emite testimonio de deuda fiscal y se transfiere a procuración fiscal para juicio de apremio.',
          nodeType: BPMN_NODE_TYPES.SERVICE_TASK,
          laneId: 'lane-tesoreria',
          itSystem: 'Sistema Tributario Municipal (STM)',
          legalFramework: 'Ord. Fiscal Art. 112',
          slaDuration: {
            value: 10,
            unit: TIME_UNIT_TYPES.BUSINESS_DAYS,
            iso8601String: 'P10D',
            isPeremptory: false
          },
          inputs: ['Sentencia firme impaga'],
          outputs: ['Título ejecutivo de apremio judicial'],
          operationalRisks: [
            {
              riskId: 'RSK-05',
              description: 'Prescripción de la deuda tributaria contravencional (2 años)',
              probability: 'LOW',
              impact: 'HIGH',
              mitigatingControl: 'Pase automático a procuración letrada a los 60 días de ejecutoria',
              controlType: 'PREVENTIVE'
            }
          ],
          tags: ['Tributario', 'Apremio']
        }
      },
      {
        id: 'node-end',
        type: 'EndEvent',
        position: { x: 1950, y: 360 },
        data: {
          standardId: 'EVT-02',
          title: 'Conclusión y Archivo del Expediente Contravencional',
          description: 'Cancelación de la multa, cumplimiento del plan de probation o ejecución de sentencia con cancelación registral de antecedentes.',
          nodeType: BPMN_NODE_TYPES.END_EVENT,
          laneId: 'lane-juzgado',
          itSystem: 'VUPRA / Archivo Judicial',
          legalFramework: 'Ord. 12.850 Art. 65',
          inputs: ['Constancia de pago/cumplimiento homologado'],
          outputs: ['Legajo cerrado y archivado'],
          operationalRisks: [],
          tags: ['Fin', 'Archivo']
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'node-start',
        target: 'node-task-presentacion',
        type: 'sequenceFlow',
        data: { id: 'e1', source: 'node-start', target: 'node-task-presentacion', conditionText: 'Dentro de 10 días' }
      },
      {
        id: 'e2',
        source: 'node-task-presentacion',
        target: 'node-qc-admisibilidad',
        type: 'sequenceFlow',
        data: { id: 'e2', source: 'node-task-presentacion', target: 'node-qc-admisibilidad' }
      },
      {
        id: 'e3',
        source: 'node-qc-admisibilidad',
        target: 'node-gtw-admisible',
        type: 'sequenceFlow',
        data: { id: 'e3', source: 'node-qc-admisibilidad', target: 'node-gtw-admisible' }
      },
      {
        id: 'e4',
        source: 'node-gtw-admisible',
        target: 'node-task-rechazo',
        type: 'sequenceFlow',
        data: { id: 'e4', source: 'node-gtw-admisible', target: 'node-task-rechazo', conditionText: '[Inadmisible / Fuera de Plazo]' }
      },
      {
        id: 'e5',
        source: 'node-gtw-admisible',
        target: 'node-task-evaluacion',
        type: 'sequenceFlow',
        data: { id: 'e5', source: 'node-gtw-admisible', target: 'node-task-evaluacion', conditionText: '[Admisible]' }
      },
      {
        id: 'e6',
        source: 'node-task-evaluacion',
        target: 'node-gtw-resolucion',
        type: 'sequenceFlow',
        data: { id: 'e6', source: 'node-task-evaluacion', target: 'node-gtw-resolucion' }
      },
      {
        id: 'e7',
        source: 'node-gtw-resolucion',
        target: 'node-task-sobreseimiento',
        type: 'sequenceFlow',
        data: { id: 'e7', source: 'node-gtw-resolucion', target: 'node-task-sobreseimiento', conditionText: 'Sobreseimiento' }
      },
      {
        id: 'e8',
        source: 'node-gtw-resolucion',
        target: 'node-task-condena',
        type: 'sequenceFlow',
        data: { id: 'e8', source: 'node-gtw-resolucion', target: 'node-task-condena', conditionText: 'Sentencia Condenatoria' }
      },
      {
        id: 'e9',
        source: 'node-gtw-resolucion',
        target: 'node-task-probation',
        type: 'sequenceFlow',
        data: { id: 'e9', source: 'node-gtw-resolucion', target: 'node-task-probation', conditionText: 'Probation / Tareas' }
      },
      {
        id: 'e10',
        source: 'node-task-condena',
        target: 'node-task-cobro',
        type: 'sequenceFlow',
        data: { id: 'e10', source: 'node-task-condena', target: 'node-task-cobro', conditionText: 'Impago tras plazo' }
      },
      {
        id: 'e11',
        source: 'node-task-cobro',
        target: 'node-end',
        type: 'sequenceFlow',
        data: { id: 'e11', source: 'node-task-cobro', target: 'node-end' }
      },
      {
        id: 'e12',
        source: 'node-task-sobreseimiento',
        target: 'node-end',
        type: 'sequenceFlow',
        data: { id: 'e12', source: 'node-task-sobreseimiento', target: 'node-end' }
      },
      {
        id: 'e13',
        source: 'node-task-probation',
        target: 'node-end',
        type: 'sequenceFlow',
        data: { id: 'e13', source: 'node-task-probation', target: 'node-end', conditionText: 'Cumplimiento verificado' }
      },
      {
        id: 'e14',
        source: 'node-task-rechazo',
        target: 'node-end',
        type: 'sequenceFlow',
        data: { id: 'e14', source: 'node-task-rechazo', target: 'node-end' }
      }
    ]
  },
  {
    schemaVersion: '1.0.0',
    documentControl: {
      documentTitle: 'Procedimiento Sumario de Faltas y Clausuras Comerciales',
      documentCode: 'PRC-TF-2026-001',
      version: '1.0',
      authorName: 'Ing. Calidad Marcela Rossi (Auditor Líder ISO 9001)',
      organizationUnit: 'Dirección de Fiscalización y Control de Actividades Económicas',
      processObjective: 'Estandarizar el procedimiento de fiscalización inspectiva, labrado de actas de constatación de clausura preventiva y su posterior elevación al Tribunal de Faltas.',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:15:00Z',
      status: 'APPROVED',
      legalNormativeBasis: [
        'Código de Habilitaciones Comerciales e Industriales',
        'Reglamento de Procedimiento Preventivo de Clausura Inmediata'
      ],
      revisionHistory: [
        {
          revisionDate: '2026-09-01T08:00:00Z',
          version: '1.0',
          author: 'Ing. Marcela Rossi',
          changeDescription: 'Modelado inicial de proceso con puntos de control de calidad'
        }
      ]
    },
    pools: [
      {
        id: 'pool-clausuras',
        name: 'Inspección General y Tribunal',
        organization: 'Municipalidad',
        lanes: [
          {
            id: 'lane-inspector',
            name: 'Cuerpo de Inspectores de Comercio',
            role: 'Inspector Municipal Actuante',
            system: 'App Móvil Fiscalización / Tablet',
            colorHex: '#3b82f6',
            order: 0
          },
          {
            id: 'lane-coordinacion',
            name: 'Coordinación Operativa y Calidad',
            role: 'Supervisor de Turno',
            system: 'SAM Inspección',
            colorHex: '#ec4899',
            order: 1
          },
          {
            id: 'lane-juez',
            name: 'Juzgado de Faltas de Turno',
            role: 'Juez de Faltas',
            system: 'VUPRA',
            colorHex: '#8b5cf6',
            order: 2
          }
        ]
      }
    ],
    nodes: [
      {
        id: 'n-start-clausura',
        type: 'StartEvent',
        position: { x: 50, y: 80 },
        data: {
          standardId: 'EVT-01',
          title: 'Constatación de Infracción Grave o Riesgo Inminente',
          description: 'Detección in situ de actividad no autorizada, falta de medidas de seguridad contra incendios o adulteración de alimentos.',
          nodeType: BPMN_NODE_TYPES.START_EVENT,
          laneId: 'lane-inspector',
          itSystem: 'App Móvil Fiscalización',
          legalFramework: 'Art. 15 Cód. Habilitaciones',
          inputs: ['Orden de inspección o denuncia ciudadana'],
          outputs: ['Acta de constatación inicial'],
          operationalRisks: [],
          tags: ['Inspección', 'Inicio']
        }
      },
      {
        id: 'n-task-faja',
        type: 'ManualTask',
        position: { x: 260, y: 70 },
        data: {
          standardId: 'TSK-01',
          title: 'Colocación de Fajas de Clausura Preventiva',
          description: 'Fijación de precintos y fajas numeradas en accesos principales y toma de evidencia fotográfica geo-referenciada.',
          nodeType: BPMN_NODE_TYPES.MANUAL_TASK,
          laneId: 'lane-inspector',
          itSystem: 'Cámara Digital / App Móvil',
          legalFramework: 'Art. 18 Cód. Habilitaciones',
          slaDuration: {
            value: 2,
            unit: TIME_UNIT_TYPES.HOURS,
            iso8601String: 'PT2H',
            isPeremptory: true
          },
          inputs: ['Acta de clausura labrada', 'Fajas de seguridad oficiales'],
          outputs: ['Acta con firma de testigos o negativa', 'Set fotográfico con timestamp'],
          operationalRisks: [
            {
              riskId: 'RSK-01',
              description: 'Rotura o violación de fajas por el titular',
              probability: 'MEDIUM',
              impact: 'HIGH',
              mitigatingControl: 'Constancia de advertencia penal por violación de sellos (Art. 254 CP)',
              controlType: 'PREVENTIVE'
            }
          ],
          tags: ['Faja', 'Clausura']
        }
      },
      {
        id: 'n-qc-elevacion',
        type: 'QualityCheckpointEvent',
        position: { x: 520, y: 220 },
        data: {
          standardId: 'QC-01',
          title: 'Auditoría de Actuaciones y Cadena de Custodia',
          description: 'Supervisión de calidad para verificar legibilidad, congruencia de testimonios y correcta tipificación de artículos.',
          nodeType: BPMN_NODE_TYPES.QUALITY_CHECKPOINT_EVENT,
          laneId: 'lane-coordinacion',
          itSystem: 'SAM Inspección',
          legalFramework: 'Manual de Calidad ISO 9001 - MC-INS-04',
          qualityCheckpoint: {
            checkpointCode: 'QC-01',
            inspectionCriteria: '100% de actas revisadas antes de elevación al Juez de Turno.',
            severity: 'CRITICAL',
            sampleRatePercentage: 100,
            responsibleRole: 'Supervisor de Inspección',
            evidenceRequired: 'Visado electrónico de control de calidad'
          },
          inputs: ['Actas elevadas', 'Fotografías geolocalizadas'],
          outputs: ['Expediente visado y remitido a VUPRA'],
          operationalRisks: [],
          tags: ['ISO 9001', 'Calidad']
        }
      },
      {
        id: 'n-task-audiencia',
        type: 'UserTask',
        position: { x: 780, y: 350 },
        data: {
          standardId: 'TSK-02',
          title: 'Audiencia de Ratificación o Levantamiento Provisorio',
          description: 'El Juez de Faltas toma audiencia urgente al comerciante dentro de las 48 horas de la clausura preventiva.',
          nodeType: BPMN_NODE_TYPES.USER_TASK,
          laneId: 'lane-juez',
          itSystem: 'VUPRA',
          legalFramework: 'Art. 22 Ord. Procedimiento',
          slaDuration: {
            value: 48,
            unit: TIME_UNIT_TYPES.HOURS,
            iso8601String: 'PT48H',
            isPeremptory: true
          },
          inputs: ['Expediente visado', 'Acreditación de titularidad comercial'],
          outputs: ['Auto interlocutorio de levantamiento condicionado o mantenimiento de clausura'],
          operationalRisks: [],
          tags: ['Audiencia', 'Juzgado']
        }
      },
      {
        id: 'n-end-clausura',
        type: 'EndEvent',
        position: { x: 1040, y: 350 },
        data: {
          standardId: 'EVT-02',
          title: 'Resolución Definitiva de Habilitación / Sanción',
          description: 'Regularización de observaciones técnicas o clausura definitiva con revocación de licencia.',
          nodeType: BPMN_NODE_TYPES.END_EVENT,
          laneId: 'lane-juez',
          itSystem: 'VUPRA',
          legalFramework: 'Art. 30 Ord. Procedimiento',
          inputs: ['Informe de reinspección favorable'],
          outputs: ['Resolución final notificada'],
          operationalRisks: [],
          tags: ['Fin']
        }
      }
    ],
    edges: [
      {
        id: 'ec1',
        source: 'n-start-clausura',
        target: 'n-task-faja',
        type: 'sequenceFlow',
        data: { id: 'ec1', source: 'n-start-clausura', target: 'n-task-faja' }
      },
      {
        id: 'ec2',
        source: 'n-task-faja',
        target: 'n-qc-elevacion',
        type: 'sequenceFlow',
        data: { id: 'ec2', source: 'n-task-faja', target: 'n-qc-elevacion', conditionText: 'Dentro de 12 horas' }
      },
      {
        id: 'ec3',
        source: 'n-qc-elevacion',
        target: 'n-task-audiencia',
        type: 'sequenceFlow',
        data: { id: 'ec3', source: 'n-qc-elevacion', target: 'n-task-audiencia', conditionText: 'Visado OK' }
      },
      {
        id: 'ec4',
        source: 'n-task-audiencia',
        target: 'n-end-clausura',
        type: 'sequenceFlow',
        data: { id: 'ec4', source: 'n-task-audiencia', target: 'n-end-clausura' }
      }
    ]
  }
];
