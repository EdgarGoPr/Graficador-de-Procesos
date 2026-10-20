import { ProcessProjectFile } from '../types/project';
import actasProjectData from '../data/defaultProjects/gestion-de-actas.json';
import wisecxProjectData from '../data/defaultProjects/wisecx-soporte.json';

/**
 * Proyectos oficiales predeterminados del sistema:
 * 1. Proceso de Gestión de Actas (Tribunal de Faltas)
 * 2. Procedimiento de Atención, Soporte y Gestión de Incidencias Técnicas - WiseCX (DGSTI)
 */
export const sampleProjects: ProcessProjectFile[] = [
  actasProjectData as unknown as ProcessProjectFile,
  wisecxProjectData as unknown as ProcessProjectFile
];
