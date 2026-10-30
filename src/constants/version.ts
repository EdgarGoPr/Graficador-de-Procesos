/**
 * Fuente única de verdad para el versionado semántico de ProcesStudio
 * Formato SemVer: Mayor.Menor.Parche (ej. 1.5.1)
 * Formato Canónico visual: V xx.xx.xx (ej. V 01.05.01)
 */

export const APP_VERSION = '2.4.0';

/**
 * Retorna la versión formateada con padding de dos dígitos por segmento (V xx.xx.xx)
 */
export function getFormattedAppVersion(version: string = APP_VERSION): string {
  const parts = version.split('.');
  const major = (parts[0] || '0').padStart(2, '0');
  const minor = (parts[1] || '0').padStart(2, '0');
  const patch = (parts[2] || '0').padStart(2, '0');
  return `V ${major}.${minor}.${patch}`;
}
