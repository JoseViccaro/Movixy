# Technical Design: In-App Auto-Updater

## 1. Overview & Architectural Goals

The **In-App Auto-Updater** feature provides Movixy with an autonomous update detection and delivery pipeline. It supports both mobile touch screens and 10-foot Android TV / Fire TV interfaces, ensuring seamless upgrade distribution directly from GitHub Releases or compatible static release endpoints.

Key Objectives:
1. **Clean Architecture Adherence**: Domain layer completely decoupled from platform SDKs (Capacitor / Browser) and UI frameworks.
2. **Robust Semver Comparison**: Support semver parsing, comparison logic, pre-releases, and tag normalization (`vX.Y.Z` vs `X.Y.Z`).
3. **Non-Blocking Startup Flow**: Background check triggered on app boot without freezing the splash screen, auth flow, or main UI thread.
4. **Android Native & Web Adaptation**: Native APK download and package installer execution on Android, graceful fallback on Web.
5. **10-Foot Accessibility (TV Remote & Keyboard)**: Full D-pad spatial navigation, focus trapping, default focus autofocus, and remote audio feedback.
6. **Strict TDD**: 100% unit and component test coverage using Vitest and React Testing Library across all architectural tiers.

---

## 2. Clean Architecture Layer Breakdown

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           @presentation Layer                             │
│  - UpdateAvailableModal.tsx, UpdateAvailableModal.module.css              │
│  - AppLayout.tsx / main.tsx integration                                   │
├───────────────────────────────────────────────────────────────────────────┤
│                           @application Layer                              │
│  - AppUpdateService.ts (Update orchestration & state machine)             │
│  - useAppUpdate.ts (React hook for UI state & trigger actions)            │
├───────────────────────────────────────────────────────────────────────────┤
│                               @data Layer                                 │
│  - AppUpdateRepositoryImpl.ts (HTTP release fetcher & download handler)   │
├───────────────────────────────────────────────────────────────────────────┤
│                              @domain Layer                                │
│  - Models: ReleaseInfo, UpdateCheckResult, UpdateStatus, UpdateProgress   │
│  - Policies: SemverComparator                                             │
│  - Contracts: IAppUpdateRepository                                        │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Domain Layer (`@domain`)

### 3.1 Domain Models (`src/domain/models/app-update.model.ts`)
```typescript
export type UpdateStatus =
  | 'IDLE'
  | 'CHECKING'
  | 'UP_TO_DATE'
  | 'UPDATE_AVAILABLE'
  | 'DOWNLOADING'
  | 'READY_TO_INSTALL'
  | 'ERROR';

export interface ReleaseAsset {
  name: string;
  downloadUrl: string;
  sizeBytes: number;
  contentType: string;
}

export interface ReleaseInfo {
  version: string;
  releaseNotes: string;
  publishedAt: string;
  downloadUrl: string;
  isMandatory?: boolean;
  assets?: ReleaseAsset[];
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestRelease?: ReleaseInfo;
}

export interface UpdateProgress {
  bytesReceived: number;
  totalBytes: number;
  percentage: number; // 0 to 100
}
```

### 3.2 Domain Policy: Semver Comparator (`src/domain/policies/SemverComparator.ts`)
```typescript
export class SemverComparator {
  /**
   * Normalizes version strings (e.g., "v1.2.3-beta" -> "1.2.3-beta")
   */
  static normalize(version: string): string {
    return version.trim().replace(/^v/i, '');
  }

  /**
   * Compares two semantic version strings.
   * Returns:
   *  1 if v1 > v2 (v1 is newer)
   * -1 if v1 < v2 (v1 is older)
   *  0 if v1 === v2 (equal)
   */
  static compare(v1: string, v2: string): number {
    const clean1 = this.normalize(v1);
    const clean2 = this.normalize(v2);

    const [core1, pre1] = clean1.split('-');
    const [core2, pre2] = clean2.split('-');

    const parts1 = core1.split('.').map(Number);
    const parts2 = core2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }

    // Pre-release evaluation: "1.0.0" is newer than "1.0.0-beta"
    if (!pre1 && pre2) return 1;
    if (pre1 && !pre2) return -1;
    if (pre1 && pre2) {
      return pre1.localeCompare(pre2);
    }

    return 0;
  }

  static isNewer(latest: string, current: string): boolean {
    return this.compare(latest, current) > 0;
  }
}
```

### 3.3 Domain Repository Contract (`src/domain/repositories/IAppUpdateRepository.ts`)
```typescript
import type { ReleaseInfo, UpdateProgress } from '../models/app-update.model';

export interface IAppUpdateRepository {
  fetchLatestRelease(): Promise<ReleaseInfo | null>;
  downloadAndInstall(
    downloadUrl: string,
    onProgress: (progress: UpdateProgress) => void
  ): Promise<void>;
  getCurrentVersion(): Promise<string>;
}
```

---

## 4. Data Layer (`@data`)

### 4.1 Data Repository Implementation (`src/data/repositories/AppUpdateRepositoryImpl.ts`)
- **API Target**: GitHub Releases API (`https://api.github.com/repos/{owner}/{repo}/releases/latest`) with fallback to custom static update endpoint.
- **Platform Handling**:
  - Web: `downloadAndInstall` opens `downloadUrl` via `window.open(downloadUrl, '_blank')`.
  - Android: Utilizes Capacitor Filesystem / Native HTTP or direct download intent to fetch APK to cache/downloads and trigger the Android Package Installer intent (`application/vnd.android.package-archive`).
- **Current Version Source**: Reads from runtime package metadata or `@capacitor/app` (`App.getInfo().then(info => info.version)`).

```typescript
export interface AppUpdateConfig {
  repoOwner: string;
  repoName: string;
  fallbackEndpoint?: string;
  appVersionOverride?: string;
}

export class AppUpdateRepositoryImpl implements IAppUpdateRepository {
  constructor(private readonly config: AppUpdateConfig) {}

  async getCurrentVersion(): Promise<string> {
    if (this.config.appVersionOverride) {
      return this.config.appVersionOverride;
    }
    try {
      if (Capacitor.isNativePlatform()) {
        const info = await App.getInfo();
        return info.version;
      }
    } catch {
      // Ignore native check failures on web
    }
    return import.meta.env.VITE_APP_VERSION || '1.0.0';
  }

  async fetchLatestRelease(): Promise<ReleaseInfo | null> {
    const url = `https://api.github.com/repos/${this.config.repoOwner}/${this.config.repoName}/releases/latest`;
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch release: ${res.statusText}`);
    }
    const data = await res.json();
    
    // Find apk asset if available
    const apkAsset = data.assets?.find((a: any) => a.name.endsWith('.apk'));
    const downloadUrl = apkAsset ? apkAsset.browser_download_url : data.html_url;

    return {
      version: data.tag_name,
      releaseNotes: data.body || '',
      publishedAt: data.published_at,
      downloadUrl,
      assets: data.assets?.map((a: any) => ({
        name: a.name,
        downloadUrl: a.browser_download_url,
        sizeBytes: a.size,
        contentType: a.content_type,
      })),
    };
  }

  async downloadAndInstall(
    downloadUrl: string,
    onProgress: (progress: UpdateProgress) => void
  ): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      window.open(downloadUrl, '_blank');
      return;
    }
    // Android native download & open file intent
    // Implementation uses fetch + blob / capacitor filesystem with progress emission
  }
}
```

---

## 5. Application Layer (`@application`)

### 5.1 Application Service (`src/application/services/AppUpdateService.ts`)
```typescript
export class AppUpdateService {
  constructor(private readonly repository: IAppUpdateRepository) {}

  async checkForUpdate(): Promise<UpdateCheckResult> {
    const currentVersion = await this.repository.getCurrentVersion();
    const latestRelease = await this.repository.fetchLatestRelease();

    if (!latestRelease) {
      return { hasUpdate: false, currentVersion };
    }

    const hasUpdate = SemverComparator.isNewer(latestRelease.version, currentVersion);
    return {
      hasUpdate,
      currentVersion,
      latestRelease: hasUpdate ? latestRelease : undefined,
    };
  }

  async performUpdate(
    downloadUrl: string,
    onProgress: (progress: UpdateProgress) => void
  ): Promise<void> {
    await this.repository.downloadAndInstall(downloadUrl, onProgress);
  }
}
```

### 5.2 Custom Hook (`src/application/hooks/useAppUpdate.ts`)
```typescript
export interface UseAppUpdateReturn {
  status: UpdateStatus;
  currentVersion: string;
  latestRelease: ReleaseInfo | null;
  progress: UpdateProgress;
  errorMessage: string | null;
  isModalOpen: boolean;
  checkForUpdates: (manual?: boolean) => Promise<void>;
  startUpdate: () => Promise<void>;
  dismissModal: () => void;
}

export function useAppUpdate(
  service: AppUpdateService,
  options: { autoCheckOnMount?: boolean; startupDelayMs?: number } = {}
): UseAppUpdateReturn {
  // Manages state machine: IDLE -> CHECKING -> (UPDATE_AVAILABLE | UP_TO_DATE) -> DOWNLOADING -> READY_TO_INSTALL
}
```

---

## 6. Presentation Layer (`@presentation`)

### 6.1 `UpdateAvailableModal.tsx` & CSS Module
- **Design & Layout**:
  - Glassmorphic modal overlay (`UpdateAvailableModal.module.css`).
  - Dual action buttons: "Actualizar ahora" (`data-focusable="true"`, primary focus), "Más tarde" (`data-focusable="true"`).
  - Version comparison pill (`v1.2.0` ➔ `v1.3.0`).
  - Changelog scrollable container with markdown render styling.
  - Progress bar indicator with percentage label during `DOWNLOADING` status.
  - Error state with "Reintentar" action.
- **TV Remote Integration**:
  - Integrated with `useDpadNavigation` hook.
  - Spatial up/down/left/right navigation between buttons.
  - Automatic focus sound tick playback.
  - Remote `Back` key (keyCode 4 / Escape) for dismissal.

### 6.2 App Startup Integration (`AppLayout.tsx`)
- AppLayout mounts `UpdateAvailableModal`.
- On startup, non-blocking check runs after 2s delay. If update exists, modal opens automatically.

---

## 7. Comprehensive File Plan

| File Path | Layer | Purpose |
|-----------|-------|---------|
| `src/domain/models/app-update.model.ts` | `@domain` | Domain types, enums, and release interfaces |
| `src/domain/policies/SemverComparator.ts` | `@domain` | Semver parsing and version precedence policy |
| `src/domain/policies/SemverComparator.test.ts` | `@domain` | Unit tests for semver comparison and edge cases |
| `src/domain/repositories/IAppUpdateRepository.ts` | `@domain` | Interface contract for update repository |
| `src/data/repositories/AppUpdateRepositoryImpl.ts` | `@data` | GitHub releases API and platform download repository |
| `src/data/repositories/AppUpdateRepositoryImpl.test.ts` | `@data` | Data repository integration & mock HTTP tests |
| `src/application/services/AppUpdateService.ts` | `@application` | Application service coordinating checks and updates |
| `src/application/services/AppUpdateService.test.ts` | `@application` | Unit tests for update service logic |
| `src/application/hooks/useAppUpdate.ts` | `@application` | React hook managing update state and user triggers |
| `src/application/hooks/useAppUpdate.test.ts` | `@application` | Unit tests for hook lifecycle and state transitions |
| `src/presentation/components/UpdateAvailableModal/UpdateAvailableModal.tsx` | `@presentation` | Accessible modal component for updates |
| `src/presentation/components/UpdateAvailableModal/UpdateAvailableModal.module.css` | `@presentation` | Styling, glassmorphism, progress bar & focus styles |
| `src/presentation/components/UpdateAvailableModal/UpdateAvailableModal.test.tsx` | `@presentation` | React Testing Library component tests |
| `src/presentation/layouts/AppLayout.tsx` | `@presentation` | Integration into main app layout |

---

## 8. Strict TDD Test Suite Plan (Vitest + RTL)

1. **Domain Tests (`SemverComparator.test.ts`)**:
   - Compares major versions (`2.0.0` > `1.9.9`).
   - Compares minor versions (`1.3.0` > `1.2.9`).
   - Compares patch versions (`1.2.1` > `1.2.0`).
   - Handles `v` prefix prefix stripping (`v1.4.0` vs `1.3.0`).
   - Handles pre-release tags (`1.0.0` > `1.0.0-rc.1`).
   - Returns 0 for equal versions (`1.0.0` === `v1.0.0`).

2. **Data Tests (`AppUpdateRepositoryImpl.test.ts`)**:
   - `fetchLatestRelease` parses GitHub release json correctly and identifies APK asset.
   - Handles 404 or empty releases gracefully.
   - Throws descriptive errors on server 500 response.
   - `downloadAndInstall` invokes web `window.open` when on web platform.

3. **Application Tests (`AppUpdateService.test.ts` & `useAppUpdate.test.ts`)**:
   - `AppUpdateService.checkForUpdate` returns `hasUpdate: true` when latest > current.
   - `AppUpdateService.checkForUpdate` returns `hasUpdate: false` when latest <= current.
   - `useAppUpdate` initializes in `IDLE` state.
   - `useAppUpdate` auto-triggers background check if configured and transitions to `UPDATE_AVAILABLE`.
   - `startUpdate` tracks progress and completes installation step.
   - `dismissModal` sets `isModalOpen` to false and prevents duplicate auto-prompts.

4. **Presentation Tests (`UpdateAvailableModal.test.tsx`)**:
   - Modal renders target version and release notes.
   - "Actualizar ahora" triggers `startUpdate` callback.
   - "Más tarde" triggers `dismissModal` callback.
   - Renders download progress bar when status is `DOWNLOADING`.
   - Pressing `Escape` invokes dismiss callback.
   - Sets focus to "Actualizar ahora" on initial mount.
