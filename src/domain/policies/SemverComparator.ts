interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

export class SemverComparator {
  /**
   * Cleans and normalizes a version string by stripping leading 'v'/'V',
   * trimming whitespace, and ensuring a standard x.y.z format.
   */
  public static normalize(versionStr: string): string {
    if (!versionStr || typeof versionStr !== 'string') {
      return '0.0.0';
    }

    let cleaned = versionStr.trim();
    if (cleaned.startsWith('v') || cleaned.startsWith('V')) {
      cleaned = cleaned.substring(1).trim();
    }

    if (!cleaned) {
      return '0.0.0';
    }

    const [mainPart, ...preParts] = cleaned.split('-');
    const prerelease = preParts.join('-');

    const segments = mainPart.split('.').filter(Boolean);
    const major = segments[0] || '0';
    const minor = segments[1] || '0';
    const patch = segments[2] || '0';

    const normalizedMain = `${major}.${minor}.${patch}`;
    return prerelease ? `${normalizedMain}-${prerelease}` : normalizedMain;
  }

  private static parse(versionStr: string): ParsedVersion {
    const normalized = this.normalize(versionStr);
    const [mainPart, ...preParts] = normalized.split('-');
    const preStr = preParts.join('-');

    const [majorStr, minorStr, patchStr] = mainPart.split('.');
    const major = parseInt(majorStr, 10) || 0;
    const minor = parseInt(minorStr, 10) || 0;
    const patch = parseInt(patchStr, 10) || 0;

    const prerelease = preStr ? preStr.split('.') : [];

    return { major, minor, patch, prerelease };
  }

  /**
   * Compares two semver strings.
   * Returns:
   *  1 if a > b
   * -1 if a < b
   *  0 if a === b
   */
  public static compare(a: string, b: string): number {
    const parsedA = this.parse(a);
    const parsedB = this.parse(b);

    if (parsedA.major !== parsedB.major) {
      return parsedA.major > parsedB.major ? 1 : -1;
    }
    if (parsedA.minor !== parsedB.minor) {
      return parsedA.minor > parsedB.minor ? 1 : -1;
    }
    if (parsedA.patch !== parsedB.patch) {
      return parsedA.patch > parsedB.patch ? 1 : -1;
    }

    // Pre-release comparison
    // A version without pre-release has higher precedence than one with pre-release: 1.0.0 > 1.0.0-rc.1
    if (parsedA.prerelease.length === 0 && parsedB.prerelease.length > 0) {
      return 1;
    }
    if (parsedA.prerelease.length > 0 && parsedB.prerelease.length === 0) {
      return -1;
    }
    if (parsedA.prerelease.length === 0 && parsedB.prerelease.length === 0) {
      return 0;
    }

    const minLen = Math.min(parsedA.prerelease.length, parsedB.prerelease.length);
    for (let i = 0; i < minLen; i++) {
      const segA = parsedA.prerelease[i];
      const segB = parsedB.prerelease[i];

      const numA = Number(segA);
      const numB = Number(segB);

      const aIsNum = !isNaN(numA);
      const bIsNum = !isNaN(numB);

      if (aIsNum && bIsNum) {
        if (numA !== numB) {
          return numA > numB ? 1 : -1;
        }
      } else if (aIsNum && !bIsNum) {
        // Numeric identifiers have lower precedence than non-numeric
        return -1;
      } else if (!aIsNum && bIsNum) {
        return 1;
      } else {
        if (segA !== segB) {
          return segA.localeCompare(segB) > 0 ? 1 : -1;
        }
      }
    }

    if (parsedA.prerelease.length !== parsedB.prerelease.length) {
      return parsedA.prerelease.length > parsedB.prerelease.length ? 1 : -1;
    }

    return 0;
  }

  /**
   * Returns true if candidateVersion is strictly greater than currentVersion.
   */
  public static isNewer(currentVersion: string, candidateVersion: string): boolean {
    return this.compare(candidateVersion, currentVersion) === 1;
  }
}
