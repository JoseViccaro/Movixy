# Proposal: In-App Auto-Updater

## Problem & Context
Users on Android Mobile and Android TV currently lack a native mechanism to discover, download, and install application updates directly within Movixy without manual APK downloads from external sources.

## Proposed Changes

### 1. Domain Layer (`@domain`)
- **Entities / Value Objects**:
  - `AppReleaseInfo`: Represents release metadata (`version`, `releaseNotes`, `downloadUrl`, `publishedAt`, `mandatory`).
  - `UpdateCheckResult`: Outcome entity containing status (`UP_TO_DATE`, `UPDATE_AVAILABLE`), current version, and latest release.
- **Contract**:
  - `IUpdateRepository`: Interface exposing `checkForUpdate(currentVersion: string): Promise<UpdateCheckResult>` and `downloadAndInstall(url: string, onProgress: (percent: number) => void): Promise<void>`.

### 2. Data Layer (`@data`)
- **Repository Implementation**:
  - `GitHubReleaseUpdateRepository`: Implements `IUpdateRepository` fetching latest release metadata from GitHub Releases API (or custom JSON endpoint) and handling APK download and Android package installer intent invocation via Capacitor File/Opener plugins.

### 3. Application Layer (`@application`)
- **Use Cases & Hooks**:
  - `AppUpdateService`: Orchestrates update check logic, semver comparisons, and download orchestration.
  - `useAppUpdate`: Custom React hook exposing update status, download progress, changelog, and trigger actions (`updateNow()`, `dismiss()`).

### 4. Presentation Layer (`@presentation`)
- **Components & Integration**:
  - `UpdateAvailableModal.tsx`: Dual-layout modal optimized for Touch & D-Pad navigation (Android TV spatial focus), rendering release notes, download progress bar, and action buttons.
  - `App.tsx`: Startup lifecycle hook integration invoking non-blocking update checks on app boot.

## Implementation Plan & Strict TDD
1. **Domain Tests**: Unit tests for Semver comparison and `UpdateCheckResult` invariants.
2. **Data Tests**: Mocked HTTP & Capacitor plugin tests for `GitHubReleaseUpdateRepository`.
3. **Application Tests**: Unit tests for `AppUpdateService` and `useAppUpdate` state machine transitions.
4. **Presentation Tests**: React Testing Library tests for `UpdateAvailableModal` focus handling and user events.
