import {
  DeletedProjectEntry,
  FunctionalRoleCatalogItem,
  MasterCatalogsStateData,
  NormativeCatalogItem,
  OrganizationUnitCatalogItem,
  RiskControlCatalogItem,
  SystemDocumentCatalogItem
} from '../types/catalogs';
import { ProcessProjectFile } from '../types/project';
import { NeonClient } from './neonClient';
import { AuditLoggerService } from './auditLoggerService';
import { useAuthStore } from '../store/useAuthStore';

const LOCAL_STORAGE_CATALOGS_KEY = 'procesos_master_catalogs_v2';

const nowIso = () => new Date().toISOString();

const DEFAULT_SEED_CATALOGS: MasterCatalogsStateData = {
  orgUnits: [
    {
      id: 'uo_01',
      code: 'UO-001',
      name: 'Dirección General de Calidad y Procesos',
      parentUnit: 'Secretaría General',
      headName: 'Edgar González de Prada',
      colorHex: '#0284C7',
      description: 'Órgano rector de gobernanza, estandarización BPMN 2.0 y auditoría ISO 9001.',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'uo_02',
      code: 'UO-002',
      name: 'Mesa General de Entradas y Atención Ciudadana',
      parentUnit: 'Secretaría Administrativa',
      headName: 'Coordinación de Recepción',
      colorHex: '#10B981',
      description: 'Recepción, caratulacion, validación documental e inicio de trámites.',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'uo_03',
      code: 'UO-003',
      name: 'Dirección de Asuntos Jurídicos y Dictámenes',
      parentUnit: 'Subsecretaría Legal y Técnica',
      headName: 'Director Legal',
      colorHex: '#8B5CF6',
      description: 'Control de legalidad, emisión de dictámenes vinculantes y resoluciones.',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'uo_04',
      code: 'UO-004',
      name: 'Dirección de Administración, Compras y Finanzas',
      parentUnit: 'Secretaría de Hacienda',
      headName: 'Gerencia Administrativa',
      colorHex: '#F59E0B',
      description: 'Gestión presupuestaria, contrataciones, liquidación de pagos y tesorería.',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'uo_05',
      code: 'UO-005',
      name: 'Dirección de Sistemas y Transformación Digital',
      parentUnit: 'Secretaría de Innovación',
      headName: 'Jefe de Sistemas',
      colorHex: '#EC4899',
      description: 'Infraestructura tecnológica, sistemas transaccionales y firma digital.',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    }
  ],
  roles: [
    {
      id: 'rol_01',
      code: 'ROL-001',
      name: 'Operador de Mesa de Entradas',
      organizationUnit: 'Mesa General de Entradas y Atención Ciudadana',
      defaultSystem: 'GDE / Mesa Virtual',
      hourlyCost: 18,
      responsibilities: 'Verificar requisitos de admisibilidad, digitalizar documentación y caratular expediente.',
      colorHex: '#10B981',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'rol_02',
      code: 'ROL-002',
      name: 'Analista Técnico de Procesos',
      organizationUnit: 'Dirección General de Calidad y Procesos',
      defaultSystem: 'ProcesStudio / SGC',
      hourlyCost: 28,
      responsibilities: 'Relevamiento, modelado BPMN 2.0, control de SLAs y validación técnica.',
      colorHex: '#0284C7',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'rol_03',
      code: 'ROL-003',
      name: 'Abogado Dictaminante / Instructor',
      organizationUnit: 'Dirección de Asuntos Jurídicos y Dictámenes',
      defaultSystem: 'GDE / LexDoctor',
      hourlyCost: 35,
      responsibilities: 'Análisis normativo del expediente, elaboración de proyecto de dictamen o resolución.',
      colorHex: '#8B5CF6',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'rol_04',
      code: 'ROL-004',
      name: 'Supervisor / Autoridad de Aprobación',
      organizationUnit: 'Dirección General de Calidad y Procesos',
      defaultSystem: 'Portafirmas Digital',
      hourlyCost: 45,
      responsibilities: 'Revisión final de calidad, firma digital de acto administrativo y cierre.',
      colorHex: '#F59E0B',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'rol_05',
      code: 'ROL-005',
      name: 'Analista Contable y Presupuestario',
      organizationUnit: 'Dirección de Administración, Compras y Finanzas',
      defaultSystem: 'ERP Financiero / RAFAM',
      hourlyCost: 30,
      responsibilities: 'Imputación preventiva del gasto, control de facturas y emisión de orden de pago.',
      colorHex: '#06B6D4',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    }
  ],
  normatives: [
    {
      id: 'norm_01',
      code: 'ISO 9001:2015',
      title: 'Sistemas de Gestión de la Calidad - Requisitos (Cláusula 4.4 y 7.5)',
      category: 'NORMA_ISO',
      summary: 'Enfoque basado en procesos, información documentada, control de cambios y mejora continua.',
      effectiveDate: '2015-09-15',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'norm_02',
      code: 'ISO/IEC 19510',
      title: 'Estándar Internacional Business Process Model and Notation (BPMN 2.0)',
      category: 'NORMA_ISO',
      summary: 'Reglas sintácticas y semánticas para diagramación estandarizada de procesos.',
      effectiveDate: '2013-07-01',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'norm_03',
      code: 'Ley 19.549',
      title: 'Ley de Procedimientos Administrativos y Plazos Legales',
      category: 'LEY',
      summary: 'Regulación de plazos administrativos, requisitos esenciales del acto y debido proceso.',
      effectiveDate: '1972-04-27',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'norm_04',
      code: 'Ley 25.506',
      title: 'Ley de Firma Digital y Validez de Documentos Electrónicos',
      category: 'LEY',
      summary: 'Eficacia jurídica de la firma electrónica y firma digital en actuaciones administrativas.',
      effectiveDate: '2001-12-14',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'norm_05',
      code: 'POL-SGC-001',
      title: 'Política Corporativa de Control Documental y Niveles de Servicio (SLA)',
      category: 'POLITICA_INTERNA',
      summary: 'Lineamientos internos para codificación, revisión periódica y control de tiempos de respuesta.',
      effectiveDate: '2026-01-01',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    }
  ],
  systemsDocs: [
    {
      id: 'sys_01',
      code: 'SIS-GDE',
      name: 'Sistema de Gestión Documental Electrónica (GDE)',
      category: 'SISTEMA_IT',
      supportMedium: 'DIGITAL',
      ownerUnit: 'Dirección de Sistemas y Transformación Digital',
      description: 'Plataforma central de caratulacion, pases electrónicos y firma de expedientes.',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'sys_02',
      code: 'SIS-ERP',
      name: 'Sistema Integrado de Gestión Financiera y Compras (ERP)',
      category: 'SISTEMA_IT',
      supportMedium: 'DIGITAL',
      ownerUnit: 'Dirección de Administración, Compras y Finanzas',
      description: 'Módulo de solicitudes de compra, órdenes de compra, recepción y pagos.',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'sys_03',
      code: 'FOR-ADM-01',
      name: 'Formulario Único de Solicitud / Inicio de Trámite',
      category: 'FORMULARIO',
      supportMedium: 'DIGITAL',
      ownerUnit: 'Mesa General de Entradas y Atención Ciudadana',
      description: 'Formulario estructurado con datos del solicitante, objeto y documentación respaldatoria.',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'sys_04',
      code: 'EXP-DIG-01',
      name: 'Expediente Electrónico Caratulado',
      category: 'EXPEDIENTE',
      supportMedium: 'DIGITAL',
      ownerUnit: 'Mesa General de Entradas y Atención Ciudadana',
      description: 'Contenedor documental foliado electrónicamente que recorre las áreas intervinientes.',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'sys_05',
      code: 'REG-ACT-01',
      name: 'Resolución / Dictamen Firmado Digitalmente',
      category: 'REGISTRO',
      supportMedium: 'DIGITAL',
      ownerUnit: 'Dirección de Asuntos Jurídicos y Dictámenes',
      description: 'Acto resolutivo o dictamen técnico-legal protocolizado y notificado.',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    }
  ],
  risksControls: [
    {
      id: 'rsk_01',
      code: 'RSK-001',
      riskDescription: 'Admisión de trámite con documentación incompleta o ilegible',
      probability: 'MEDIUM',
      impact: 'HIGH',
      mitigatingControl: 'Checklist obligatorio de admisibilidad en Mesa de Entradas antes de caratular',
      controlType: 'PREVENTIVE',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'rsk_02',
      code: 'RSK-002',
      riskDescription: 'Vencimiento de plazo legal (SLA perentorio) por demora en bandeja de trabajo',
      probability: 'MEDIUM',
      impact: 'HIGH',
      mitigatingControl: 'Semáforo de alerta temprana al 75% del SLA y reasignación automática por jefatura',
      controlType: 'DETECTIVE',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'rsk_03',
      code: 'RSK-003',
      riskDescription: 'Observación legal o nulidad por falta de firma de autoridad competente',
      probability: 'LOW',
      impact: 'HIGH',
      mitigatingControl: 'Validación bloqueante de firma digital por rol autorizado antes de notificar',
      controlType: 'PREVENTIVE',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'rsk_04',
      code: 'RSK-004',
      riskDescription: 'Discrepancia entre montos solicitados y partida presupuestaria disponible',
      probability: 'MEDIUM',
      impact: 'MEDIUM',
      mitigatingControl: 'Conciliación y reserva presupuestaria preventiva en sistema ERP',
      controlType: 'PREVENTIVE',
      isActive: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    }
  ],
  deletedProjects: []
};

export class MasterCatalogsService {
  private static isInitialized = false;
  private static listeners: Array<() => void> = [];

  public static subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {}
    });
  }

  /**
   * Inicializa la tabla de catálogos maestros en Neon PostgreSQL y sincroniza caché local
   */
  public static async initialize(): Promise<MasterCatalogsStateData> {
    const localData = this.getCatalogsSync();

    const sql = NeonClient.getSql();
    if (sql && !this.isInitialized) {
      this.isInitialized = true;
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS app_master_catalogs (
            catalog_key VARCHAR(60) PRIMARY KEY,
            payload JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `;

        const rows = (await sql`
          SELECT payload FROM app_master_catalogs WHERE catalog_key = 'GLOBAL_CATALOGS_V2';
        `) as any[];

        if (rows && rows.length > 0 && rows[0].payload) {
          const remoteData = rows[0].payload as MasterCatalogsStateData;
          const merged: MasterCatalogsStateData = {
            orgUnits: remoteData.orgUnits || localData.orgUnits,
            roles: remoteData.roles || localData.roles,
            normatives: remoteData.normatives || localData.normatives,
            systemsDocs: remoteData.systemsDocs || localData.systemsDocs,
            risksControls: remoteData.risksControls || localData.risksControls,
            deletedProjects: remoteData.deletedProjects || localData.deletedProjects || []
          };
          localStorage.setItem(LOCAL_STORAGE_CATALOGS_KEY, JSON.stringify(merged));
          this.notifyListeners();
          return merged;
        } else {
          // Subir semilla inicial a Neon
          await sql`
            INSERT INTO app_master_catalogs (catalog_key, payload, updated_at)
            VALUES ('GLOBAL_CATALOGS_V2', ${JSON.stringify(localData)}::jsonb, NOW())
            ON CONFLICT (catalog_key) DO NOTHING;
          `;
        }
      } catch (err) {
        console.warn('Info: Catálogos operando con caché local sincronizada:', err);
      }
    }

    return localData;
  }

  /**
   * Lectura sincrónica rápida desde caché local (con semilla garantizada)
   */
  public static getCatalogsSync(): MasterCatalogsStateData {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_CATALOGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<MasterCatalogsStateData>;
        return {
          orgUnits: Array.isArray(parsed.orgUnits) && parsed.orgUnits.length > 0 ? parsed.orgUnits : DEFAULT_SEED_CATALOGS.orgUnits,
          roles: Array.isArray(parsed.roles) && parsed.roles.length > 0 ? parsed.roles : DEFAULT_SEED_CATALOGS.roles,
          normatives: Array.isArray(parsed.normatives) && parsed.normatives.length > 0 ? parsed.normatives : DEFAULT_SEED_CATALOGS.normatives,
          systemsDocs: Array.isArray(parsed.systemsDocs) && parsed.systemsDocs.length > 0 ? parsed.systemsDocs : DEFAULT_SEED_CATALOGS.systemsDocs,
          risksControls: Array.isArray(parsed.risksControls) && parsed.risksControls.length > 0 ? parsed.risksControls : DEFAULT_SEED_CATALOGS.risksControls,
          deletedProjects: Array.isArray(parsed.deletedProjects) ? parsed.deletedProjects : []
        };
      }
    } catch {}

    localStorage.setItem(LOCAL_STORAGE_CATALOGS_KEY, JSON.stringify(DEFAULT_SEED_CATALOGS));
    return JSON.parse(JSON.stringify(DEFAULT_SEED_CATALOGS));
  }

  /**
   * Guarda el estado de catálogos en localStorage y en Neon PostgreSQL
   */
  public static async saveCatalogs(data: MasterCatalogsStateData): Promise<void> {
    localStorage.setItem(LOCAL_STORAGE_CATALOGS_KEY, JSON.stringify(data));
    this.notifyListeners();

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          INSERT INTO app_master_catalogs (catalog_key, payload, updated_at)
          VALUES ('GLOBAL_CATALOGS_V2', ${JSON.stringify(data)}::jsonb, NOW())
          ON CONFLICT (catalog_key) DO UPDATE SET
            payload = EXCLUDED.payload,
            updated_at = NOW();
        `;
      } catch (err) {
        console.warn('Error al sincronizar catálogos en Neon:', err);
      }
    }
  }

  private static logCatalogAudit(action: 'CATALOG_ITEM_CREATED' | 'CATALOG_ITEM_UPDATED' | 'CATALOG_ITEM_DELETED' | 'PROJECT_RESTORED_FROM_TRASH', resource: string, details: Record<string, any>) {
    const user = useAuthStore.getState().currentUser;
    if (user) {
      AuditLoggerService.log(action, user, resource, details);
    }
  }

  // ============================================================================
  // 1. ABM UNIDADES ORGANIZATIVAS
  // ============================================================================
  public static async saveOrgUnit(item: Omit<OrganizationUnitCatalogItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<OrganizationUnitCatalogItem> {
    const data = this.getCatalogsSync();
    const now = nowIso();
    let saved: OrganizationUnitCatalogItem;

    if (item.id) {
      const idx = data.orgUnits.findIndex((u) => u.id === item.id);
      if (idx >= 0) {
        saved = { ...data.orgUnits[idx], ...item, id: item.id, updatedAt: now };
        data.orgUnits[idx] = saved;
        this.logCatalogAudit('CATALOG_ITEM_UPDATED', `Unidad Organizativa: ${saved.name}`, { code: saved.code });
      } else {
        saved = { ...item, id: item.id, createdAt: now, updatedAt: now };
        data.orgUnits.unshift(saved);
      }
    } else {
      saved = {
        ...item,
        id: `uo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: now,
        updatedAt: now
      };
      data.orgUnits.unshift(saved);
      this.logCatalogAudit('CATALOG_ITEM_CREATED', `Unidad Organizativa: ${saved.name}`, { code: saved.code });
    }

    await this.saveCatalogs(data);
    return saved;
  }

  public static async deleteOrgUnit(id: string): Promise<void> {
    const data = this.getCatalogsSync();
    const target = data.orgUnits.find((u) => u.id === id);
    data.orgUnits = data.orgUnits.filter((u) => u.id !== id);
    await this.saveCatalogs(data);
    if (target) {
      this.logCatalogAudit('CATALOG_ITEM_DELETED', `Unidad Organizativa: ${target.name}`, { code: target.code });
    }
  }

  // ============================================================================
  // 2. ABM ROLES Y CARGOS FUNCIONALES (SWIMLANES)
  // ============================================================================
  public static async saveRole(item: Omit<FunctionalRoleCatalogItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<FunctionalRoleCatalogItem> {
    const data = this.getCatalogsSync();
    const now = nowIso();
    let saved: FunctionalRoleCatalogItem;

    if (item.id) {
      const idx = data.roles.findIndex((r) => r.id === item.id);
      if (idx >= 0) {
        saved = { ...data.roles[idx], ...item, id: item.id, updatedAt: now };
        data.roles[idx] = saved;
        this.logCatalogAudit('CATALOG_ITEM_UPDATED', `Rol Funcional: ${saved.name}`, { code: saved.code });
      } else {
        saved = { ...item, id: item.id, createdAt: now, updatedAt: now };
        data.roles.unshift(saved);
      }
    } else {
      saved = {
        ...item,
        id: `rol_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: now,
        updatedAt: now
      };
      data.roles.unshift(saved);
      this.logCatalogAudit('CATALOG_ITEM_CREATED', `Rol Funcional: ${saved.name}`, { code: saved.code });
    }

    await this.saveCatalogs(data);
    return saved;
  }

  public static async deleteRole(id: string): Promise<void> {
    const data = this.getCatalogsSync();
    const target = data.roles.find((r) => r.id === id);
    data.roles = data.roles.filter((r) => r.id !== id);
    await this.saveCatalogs(data);
    if (target) {
      this.logCatalogAudit('CATALOG_ITEM_DELETED', `Rol Funcional: ${target.name}`, { code: target.code });
    }
  }

  // ============================================================================
  // 3. ABM MARCO NORMATIVO Y LEYES
  // ============================================================================
  public static async saveNormative(item: Omit<NormativeCatalogItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<NormativeCatalogItem> {
    const data = this.getCatalogsSync();
    const now = nowIso();
    let saved: NormativeCatalogItem;

    if (item.id) {
      const idx = data.normatives.findIndex((n) => n.id === item.id);
      if (idx >= 0) {
        saved = { ...data.normatives[idx], ...item, id: item.id, updatedAt: now };
        data.normatives[idx] = saved;
        this.logCatalogAudit('CATALOG_ITEM_UPDATED', `Normativa: ${saved.code}`, { title: saved.title });
      } else {
        saved = { ...item, id: item.id, createdAt: now, updatedAt: now };
        data.normatives.unshift(saved);
      }
    } else {
      saved = {
        ...item,
        id: `norm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: now,
        updatedAt: now
      };
      data.normatives.unshift(saved);
      this.logCatalogAudit('CATALOG_ITEM_CREATED', `Normativa: ${saved.code}`, { title: saved.title });
    }

    await this.saveCatalogs(data);
    return saved;
  }

  public static async deleteNormative(id: string): Promise<void> {
    const data = this.getCatalogsSync();
    const target = data.normatives.find((n) => n.id === id);
    data.normatives = data.normatives.filter((n) => n.id !== id);
    await this.saveCatalogs(data);
    if (target) {
      this.logCatalogAudit('CATALOG_ITEM_DELETED', `Normativa: ${target.code}`, { title: target.title });
    }
  }

  // ============================================================================
  // 4. ABM SISTEMAS INFORMÁTICOS, FORMULARIOS Y DOCUMENTOS
  // ============================================================================
  public static async saveSystemDoc(item: Omit<SystemDocumentCatalogItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<SystemDocumentCatalogItem> {
    const data = this.getCatalogsSync();
    const now = nowIso();
    let saved: SystemDocumentCatalogItem;

    if (item.id) {
      const idx = data.systemsDocs.findIndex((s) => s.id === item.id);
      if (idx >= 0) {
        saved = { ...data.systemsDocs[idx], ...item, id: item.id, updatedAt: now };
        data.systemsDocs[idx] = saved;
        this.logCatalogAudit('CATALOG_ITEM_UPDATED', `Sistema/Doc: ${saved.name}`, { code: saved.code });
      } else {
        saved = { ...item, id: item.id, createdAt: now, updatedAt: now };
        data.systemsDocs.unshift(saved);
      }
    } else {
      saved = {
        ...item,
        id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: now,
        updatedAt: now
      };
      data.systemsDocs.unshift(saved);
      this.logCatalogAudit('CATALOG_ITEM_CREATED', `Sistema/Doc: ${saved.name}`, { code: saved.code });
    }

    await this.saveCatalogs(data);
    return saved;
  }

  public static async deleteSystemDoc(id: string): Promise<void> {
    const data = this.getCatalogsSync();
    const target = data.systemsDocs.find((s) => s.id === id);
    data.systemsDocs = data.systemsDocs.filter((s) => s.id !== id);
    await this.saveCatalogs(data);
    if (target) {
      this.logCatalogAudit('CATALOG_ITEM_DELETED', `Sistema/Doc: ${target.name}`, { code: target.code });
    }
  }

  // ============================================================================
  // 5. ABM RIESGOS Y CONTROLES ESTÁNDAR
  // ============================================================================
  public static async saveRiskControl(item: Omit<RiskControlCatalogItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<RiskControlCatalogItem> {
    const data = this.getCatalogsSync();
    const now = nowIso();
    let saved: RiskControlCatalogItem;

    if (item.id) {
      const idx = data.risksControls.findIndex((r) => r.id === item.id);
      if (idx >= 0) {
        saved = { ...data.risksControls[idx], ...item, id: item.id, updatedAt: now };
        data.risksControls[idx] = saved;
        this.logCatalogAudit('CATALOG_ITEM_UPDATED', `Riesgo: ${saved.code}`, { description: saved.riskDescription });
      } else {
        saved = { ...item, id: item.id, createdAt: now, updatedAt: now };
        data.risksControls.unshift(saved);
      }
    } else {
      saved = {
        ...item,
        id: `rsk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: now,
        updatedAt: now
      };
      data.risksControls.unshift(saved);
      this.logCatalogAudit('CATALOG_ITEM_CREATED', `Riesgo: ${saved.code}`, { description: saved.riskDescription });
    }

    await this.saveCatalogs(data);
    return saved;
  }

  public static async deleteRiskControl(id: string): Promise<void> {
    const data = this.getCatalogsSync();
    const target = data.risksControls.find((r) => r.id === id);
    data.risksControls = data.risksControls.filter((r) => r.id !== id);
    await this.saveCatalogs(data);
    if (target) {
      this.logCatalogAudit('CATALOG_ITEM_DELETED', `Riesgo: ${target.code}`, { description: target.riskDescription });
    }
  }

  // ============================================================================
  // 6. PAPELERA DE RECICLAJE DE PROYECTOS (SOFT-DELETE & RESTORE)
  // ============================================================================
  public static async moveProjectToTrash(project: ProcessProjectFile, deletedByEmail: string): Promise<void> {
    if (!project.fileName) return;
    const data = this.getCatalogsSync();
    const entry: DeletedProjectEntry = {
      fileName: project.fileName,
      documentTitle: project.documentControl.documentTitle,
      documentCode: project.documentControl.documentCode,
      version: project.documentControl.version,
      organizationUnit: project.documentControl.organizationUnit,
      authorName: project.documentControl.authorName,
      deletedAt: nowIso(),
      deletedByEmail: deletedByEmail || 'sistema@processtudio.com',
      projectData: project
    };
    data.deletedProjects = [entry, ...data.deletedProjects.filter((p) => p.fileName !== project.fileName)].slice(0, 50);
    await this.saveCatalogs(data);
  }

  public static async removeProjectFromTrash(fileName: string): Promise<DeletedProjectEntry | null> {
    const data = this.getCatalogsSync();
    const target = data.deletedProjects.find((p) => p.fileName === fileName) || null;
    data.deletedProjects = data.deletedProjects.filter((p) => p.fileName !== fileName);
    await this.saveCatalogs(data);
    return target;
  }
}
