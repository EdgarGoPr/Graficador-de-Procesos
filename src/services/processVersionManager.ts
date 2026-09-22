import { ProjectSummary, ProcessGroupSummary, ProcessProjectFile } from '../types/project';

/**
 * Normalizes a document title or code into a clean canonical grouping key
 */
export function normalizeProcessKey(documentCode: string, documentTitle: string): string {
  // If code is standardized (e.g. PRC-1511 or PRC-DGSTI-01), use it after stripping copy prefixes
  const cleanCode = (documentCode || '')
    .trim()
    .toUpperCase()
    .replace(/-CPY$/i, '')
    .replace(/_COPIA_LOCAL$/i, '');

  if (cleanCode && cleanCode !== 'PRC-0000' && cleanCode !== 'PRC-PROCESO') {
    return cleanCode;
  }

  // Fallback: normalize title by removing version tags, copy tags, dates and extra symbols
  return (documentTitle || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\(copia\)/gi, '')
    .replace(/_copia_local/gi, '')
    .replace(/v\d+(\.\d+)?/gi, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40) || 'proceso-general';
}

/**
 * Parses semantic version string (e.g. "1.0", "v1.2.3") into a comparable tuple [major, minor, patch]
 */
export function parseSemver(versionStr: string): [number, number, number] {
  const clean = (versionStr || '').replace(/^v/i, '').trim();
  const parts = clean.split('.').map(p => parseInt(p, 10) || 0);
  return [parts[0] || 1, parts[1] || 0, parts[2] || 0];
}

/**
 * Compares two versions: returns positive if a > b, negative if a < b, 0 if equal
 */
export function compareVersions(aVersion: string, bVersion: string): number {
  const [aMaj, aMin, aPat] = parseSemver(aVersion);
  const [bMaj, bMin, bPat] = parseSemver(bVersion);

  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPat - bPat;
}

/**
 * Bumps a version string according to semver standard
 */
export function bumpVersion(currentVersion: string, bumpType: 'patch' | 'minor' | 'major' = 'minor'): string {
  const [maj, min, pat] = parseSemver(currentVersion);
  if (bumpType === 'major') {
    return `${maj + 1}.0`;
  }
  if (bumpType === 'patch') {
    return `${maj}.${min}.${pat + 1}`;
  }
  // Default 'minor'
  return `${maj}.${min + 1}`;
}

/**
 * Generates an immutable, POSIX-safe, timestamped filename for multi-device sync
 * e.g.: 2026-09-22_1715_proc-labrado-de-actas-v1.1.json
 */
export function generateRevisionFilename(
  title: string,
  version: string,
  customTag?: string
): string {
  const now = new Date();
  const dateStr = now.toISOString().substring(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  const cleanTitle = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40);

  const cleanVer = (version || '1.0').toLowerCase().replace(/^v/, '');
  const suffix = customTag ? `_${customTag.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : '';

  return `${dateStr}_${timeStr}_proc-${cleanTitle || 'proceso'}-v${cleanVer}${suffix}.json`;
}

/**
 * Groups a flat list of project summaries into distinct Process Groups,
 * sorting versions within each group chronologically (latest first).
 */
export function groupProjectsByProcess(projectList: ProjectSummary[]): ProcessGroupSummary[] {
  const map = new Map<string, ProjectSummary[]>();

  for (const proj of projectList) {
    const key = normalizeProcessKey(proj.documentCode, proj.documentTitle);
    const list = map.get(key) || [];
    list.push(proj);
    map.set(key, list);
  }

  const groups: ProcessGroupSummary[] = [];

  for (const [groupKey, versions] of map.entries()) {
    // Sort versions by updatedAt descending, with fallback to semver
    versions.sort((a, b) => {
      const timeDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (!isNaN(timeDiff) && timeDiff !== 0) {
        return timeDiff;
      }
      return compareVersions(b.version, a.version);
    });

    const latest = versions[0];

    groups.push({
      groupKey,
      documentTitle: latest.documentTitle,
      documentCode: latest.documentCode,
      organizationUnit: latest.organizationUnit,
      authorName: latest.authorName,
      latestVersion: latest,
      versions,
      versionCount: versions.length
    });
  }

  // Sort groups by latest update descending
  groups.sort((a, b) => {
    return new Date(b.latestVersion.updatedAt).getTime() - new Date(a.latestVersion.updatedAt).getTime();
  });

  return groups;
}

/**
 * Checks if a newer version of the currently loaded project exists in the project list
 */
export function detectNewerVersionAvailable(
  currentProject: ProcessProjectFile | null,
  projectList: ProjectSummary[]
): ProjectSummary | null {
  if (!currentProject) return null;

  const currentKey = normalizeProcessKey(
    currentProject.documentControl.documentCode,
    currentProject.documentControl.documentTitle
  );

  const currentTimestamp = new Date(currentProject.documentControl.updatedAt).getTime();
  const currentFileName = currentProject.fileName || '';

  // Find all summaries for the same process
  const matching = projectList.filter(p => {
    const key = normalizeProcessKey(p.documentCode, p.documentTitle);
    return key === currentKey;
  });

  for (const candidate of matching) {
    if (candidate.fileName === currentFileName) continue;
    const candidateTimestamp = new Date(candidate.updatedAt).getTime();
    if (!isNaN(candidateTimestamp) && candidateTimestamp > currentTimestamp + 1000) {
      return candidate;
    }
  }

  return null;
}
