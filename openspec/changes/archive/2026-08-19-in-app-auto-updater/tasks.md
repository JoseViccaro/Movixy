# Tasks: In-App Auto-Updater

Comprehensive task breakdown for implementing the autonomous in-app auto-updater in Movixy across Web and Android / Android TV platforms, structured under Clean Architecture with Strict TDD.

---

## Review Workload Forecast

| Phase | Files Touched / Created | Unit / RTL Tests | Estimated Complexity | Review Weight |
|:---|:---|:---:|:---:|:---:|
| **Phase 1: Domain Entities & Policies** | 3 | 6+ test cases | Low | 15% |
| **Phase 2: Data Repository & GitHub Source** | 2 | 8+ test cases | Medium | 25% |
| **Phase 3: Application Services & Hooks** | 4 | 12+ test cases | Medium-High | 30% |
| **Phase 4: Presentation Components & TV Nav** | 4 | 10+ test cases | Medium | 20% |
| **Phase 5: Verification Suite & CI Integration** | Multiple (full suite) | 100% pass | Low | 10% |

---

## Phase 1: Domain Entities & Policies

- [x] **Task 1.1: Create Domain Models & Repository Contract**
  - Path: `src/domain/models/app-update.model.ts`
  - Path: `src/domain/repositories/IAppUpdateRepository.ts`
  - Define `UpdateStatus` enum (`IDLE`, `CHECKING`, `UP_TO_DATE`, `UPDATE_AVAILABLE`, `DOWNLOADING`, `READY_TO_INSTALL`, `ERROR`).
  - Define `ReleaseAsset`, `ReleaseInfo`, `UpdateCheckResult`, and `UpdateProgress` interfaces.
  - Define `IAppUpdateRepository` contract with `fetchLatestRelease()`, `downloadAndInstall()`, and `getCurrentVersion()`.

- [x] **Task 1.2: Strict TDD - Semver Comparator Policy**
  - **[RED]**: Write unit tests in `src/domain/policies/SemverComparator.test.ts` covering:
    - Major/minor/patch upgrades (`2.0.0 > 1.9.9`, `1.3.0 > 1.2.9`, `1.2.1 > 1.2.0`).
    - Version tag normalization (stripping leading `v`/`V`, whitespace).
    - Pre-release tag comparison (`1.0.0 > 1.0.0-rc.1`, `1.0.0-beta.2 > 1.0.0-beta.1`).
    - Identical and older version evaluations (`isNewer("1.0.0", "1.0.0") === false`, `isNewer("1.0.0", "1.1.0") === false`).
  - **[GREEN]**: Implement `SemverComparator` in `src/domain/policies/SemverComparator.ts` with `normalize()`, `compare()`, and `isNewer()` static methods.
  - **[REFACTOR]**: Clean up regex parsing and ensure zero external dependency footprint in the domain layer.

---

## Phase 2: Data Repository & GitHub Releases Source with TDD

- [x] **Task 2.1: Strict TDD - GitHub Releases & Platform Update Repository**
  - **[RED]**: Write unit and mock tests in `src/data/repositories/AppUpdateRepositoryImpl.test.ts` verifying:
    - `fetchLatestRelease()` HTTP fetch against GitHub API (`/repos/{owner}/{repo}/releases/latest`).
    - Correct mapping of GitHub release JSON payload to `ReleaseInfo` entity (tag name, release notes body, date, asset parsing).
    - Extraction of `.apk` asset download URL or fallback to release `html_url`.
    - Handling of HTTP 404 (returns `null`) and non-200 responses (descriptive error thrown).
    - `getCurrentVersion()` reading platform info from `@capacitor/app` on native or `VITE_APP_VERSION` on web.
    - `downloadAndInstall()` launching `window.open` on Web platform.
    - `downloadAndInstall()` emitting progress events during native download stream.
  - **[GREEN]**: Implement `AppUpdateRepositoryImpl` in `src/data/repositories/AppUpdateRepositoryImpl.ts` implementing `IAppUpdateRepository`.
  - **[REFACTOR]**: Modularize network error handling and configuration defaults (`AppUpdateConfig`).

---

## Phase 3: Application Services & Hooks with TDD

- [x] **Task 3.1: Strict TDD - Application Update Service**
  - **[RED]**: Write unit tests in `src/application/services/AppUpdateService.test.ts` verifying:
    - `checkForUpdate()` queries `IAppUpdateRepository.getCurrentVersion()` and `fetchLatestRelease()`.
    - Returns `hasUpdate: true` with `latestRelease` when remote version is newer per `SemverComparator`.
    - Returns `hasUpdate: false` when remote release is null or up to date.
    - `performUpdate()` delegates to repository `downloadAndInstall()` forwarding progress callbacks.
  - **[GREEN]**: Implement `AppUpdateService` in `src/application/services/AppUpdateService.ts`.
  - **[REFACTOR]**: Ensure complete decoupling from React or platform-specific globals.

- [x] **Task 3.2: Strict TDD - React `useAppUpdate` Hook**
  - **[RED]**: Write React Hook tests in `src/application/hooks/useAppUpdate.test.ts` using `@testing-library/react-hooks` or `renderHook`:
    - Initial state is `IDLE` with `isModalOpen: false`.
    - Configurable startup check with timer delay triggering `CHECKING` -> `UPDATE_AVAILABLE`.
    - Modal opens automatically when update is detected.
    - `dismissModal()` closes modal and flags session to prevent duplicate auto-prompts.
    - `startUpdate()` executes `performUpdate()`, updates `progress` percentage state, and tracks errors.
    - Manual check invocation resets error states.
  - **[GREEN]**: Implement `useAppUpdate` in `src/application/hooks/useAppUpdate.ts`.
  - **[REFACTOR]**: Optimize hook state re-renders and clean up timeout listeners on unmount.

---

## Phase 4: Presentation Components & TV Navigation

- [x] **Task 4.1: Strict TDD - Update Available Modal Component**
  - **[RED]**: Write component tests in `src/presentation/components/UpdateAvailableModal/UpdateAvailableModal.test.tsx` verifying:
    - Renders current version, new version, and release changelog.
    - "Actualizar ahora" button triggers `startUpdate` prop.
    - "Más tarde" button triggers `dismissModal` prop.
    - Renders progress bar with percentage indicator during `DOWNLOADING` status.
    - Renders error message and "Reintentar" button on error state.
    - TV accessibility: Autofocuses primary button on open; handles `Escape` key to dismiss.
  - **[GREEN]**: Implement `UpdateAvailableModal.tsx` and glassmorphic styling in `UpdateAvailableModal.module.css` with full `data-focusable` TV navigation support.
  - **[REFACTOR]**: Polish visual hierarchy, animations, focus ring states, and responsive styling for 10ft TV displays and mobile screens.

- [x] **Task 4.2: App Startup Layout Integration**
  - Path: `src/presentation/layouts/AppLayout.tsx` (or root `App.tsx`)
  - Integrate `useAppUpdate` hook and render `<UpdateAvailableModal />`.
  - Provide fallback repository configuration using repository environment variables (`VITE_GITHUB_REPO_OWNER`, `VITE_GITHUB_REPO_NAME`).

---

## Phase 5: Verification Suite & Final Review

- [x] **Task 5.1: Type Checking & Static Analysis**
  - Run `npx tsc --noEmit` to verify type safety across domain, data, application, and presentation layers.
  - Verify zero ESLint warnings on newly created and modified files.

- [x] **Task 5.2: Automated Test Suite Execution**
  - Run full test suite via `npm run test` / `vitest run` verifying 100% test pass rate across all unit and component specs.
