import { ProcessProjectFile } from './project';

/**
 * ProcesStudio - Tipos del Centro Maestro de Catálogos y ABMs Corporativos (PST-086)
 */

export type CatalogCategory =
  | 'ORG_UNITS'
  | 'ROLES'
  | 'NORMATIVES'
  | 'SYSTEMS_DOCS'
  | 'RISKS_CONTROLS';

export interface OrganizationUnitCatalogItem {
  id: string;
  code: string; // ej. "UO-001"
  name: string; // ej. "Dirección General de Calidad y Procesos"
  parentUnit: string; // ej. "Secretaría General"
  headName: string; // Responsable o titular del área
  colorHex: string; // Color institucional para carriles y badges
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FunctionalRoleCatalogItem {
  id: string;
  code: string; // ej. "ROL-001"
  name: string; // ej. "Analista Técnico de Admisión"
  organizationUnit: string; // Unidad organizativa a la que pertenece
  defaultSystem: string; // Sistema principal que opera
  hourlyCost: number; // Costo hora estimado para simulaciones
  responsibilities: string;
  colorHex: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NormativeType =
  | 'LEY'
  | 'DECRETO'
  | 'ORDENANZA'
  | 'RESOLUCION'
  | 'NORMA_ISO'
  | 'POLITICA_INTERNA';

export interface NormativeCatalogItem {
  id: string;
  code: string; // ej. "ISO 9001:2015", "Ley 19.549"
  title: string; // ej. "Sistemas de Gestión de la Calidad - Requisitos"
  category: NormativeType;
  summary: string;
  effectiveDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SystemDocCategory =
  | 'SISTEMA_IT'
  | 'FORMULARIO'
  | 'EXPEDIENTE'
  | 'REGISTRO'
  | 'PLANILLA';

export type SupportMediumType = 'DIGITAL' | 'PAPEL' | 'MIXTO';

export interface SystemDocumentCatalogItem {
  id: string;
  code: string; // ej. "SIS-001", "FOR-002"
  name: string; // ej. "Sistema de Gestión Documental Electrónica (GDE)"
  category: SystemDocCategory;
  supportMedium: SupportMediumType;
  ownerUnit: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiskControlCatalogItem {
  id: string;
  code: string; // ej. "RSK-001"
  riskDescription: string; // ej. "Vencimiento de plazo legal por demora en pase"
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  mitigatingControl: string; // ej. "Alerta automática de SLA a las 48 hs"
  controlType: 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeletedProjectEntry {
  fileName: string;
  documentTitle: string;
  documentCode: string;
  version: string;
  organizationUnit: string;
  authorName: string;
  deletedAt: string;
  deletedByEmail: string;
  projectData: ProcessProjectFile;
}

export interface MasterCatalogsStateData {
  orgUnits: OrganizationUnitCatalogItem[];
  roles: FunctionalRoleCatalogItem[];
  normatives: NormativeCatalogItem[];
  systemsDocs: SystemDocumentCatalogItem[];
  risksControls: RiskControlCatalogItem[];
  deletedProjects: DeletedProjectEntry[];
}

