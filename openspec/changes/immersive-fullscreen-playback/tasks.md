# Tasks: Immersive Fullscreen Playback

This document defines the strict TDD task breakdown for implementing edge-to-edge immersive playback (status bar and navigation bar hiding, landscape orientation lock, HTML5 fullscreen, and screen wake lock management with reliable lifecycle restoration) in Movixy.

---

## Review Workload Forecast

| Metric | Estimate |
|---|---|
| **Total Tasks** | 11 |
| **New Domain Model & Contract Files** | 2 (`src/domain/models/system-ui.model.ts`, `src/domain/repositories/ISystemUIController.ts`) |
| **New Data Layer Files** | 1 (`src/data/repositories/CapacitorSystemUIControllerImpl.ts`) |
| **New Application Files** | 2 (`src/application/services/ImmersiveModeService.ts`, `src/application/hooks/useImmersivePlayer.ts`) |
| **Modified Presentation Files** | 2 (`src/presentation/pages/Player/PlayerPage.tsx`, `src/presentation/components/VideoPlayer/VideoPlayer.tsx`) |
| **New Unit & Integration Test Files** | 4 |
| **Estimated Review Time** | ~25 - 35 minutes |

---

## Phase 1: Domain Models & Contracts (`@domain`)

Focus: Define pure TypeScript domain models, interfaces, configuration structures, and abstract repository contracts for system UI control.

- [x] **Task 1.1: System UI Domain Models** `[P:High]` `[Owner:@domain]`
  - Define `OrientationLockType` (`'landscape' | 'portrait' | 'landscape-primary' | 'landscape-secondary' | 'any'`).
  - Define `SystemUIConfig` (`hideStatusBar`, `hideNavigationBar`, `lockOrientation`, `requestWakeLock`, `requestFullscreen`, `overlayWebView`).
  - Define `SystemUIState` (`isStatusBarHidden`, `isNavigationBarHidden`, `isOrientationLocked`, `isFullscreen`, `isWakeLocked`).
  - File: `src/domain/models/system-ui.model.ts`.
  - *Verification*: Pure type definitions; passes `npx tsc --noEmit`.

- [x] **Task 1.2: System UI Controller Contract** `[P:High]` `[Owner:@domain]`
  - Define `ISystemUIController` interface covering status bar, navigation bar, orientation lock/unlock, HTML5 fullscreen, and wake lock APIs.
  - File: `src/domain/repositories/ISystemUIController.ts`.
  - *Verification*: Pure interface contract; passes `npx tsc --noEmit`.

---

## Phase 2: Data Controller with TDD (`@data`)

Focus: Implement `CapacitorSystemUIControllerImpl` uniting Capacitor plugins (`@capacitor/status-bar`, `@capacitor/navigation-bar`, `@capacitor/screen-orientation`) with fallbacks to standard Web Fullscreen, Screen Orientation, and Screen Wake Lock APIs using Strict TDD (Red -> Green -> Refactor).

- [x] **Task 2.1: [TDD-Red] Write Unit Tests for CapacitorSystemUIControllerImpl** `[P:High]` `[Owner:@data]`
  - Create `src/data/repositories/CapacitorSystemUIControllerImpl.test.ts`.
  - Test status bar hiding/showing/overlaying with plugin guards.
  - Test navigation bar hiding/showing with plugin guards.
  - Test orientation locking/unlocking with Capacitor and Web Screen Orientation fallbacks.
  - Test HTML5 fullscreen enter/exit with standard and webkit prefix support.
  - Test Screen Wake Lock request/release lifecycle and silent degradation on unsupported browsers.
  - *Verification*: Tests fail as implementation does not exist yet (`npm test -- CapacitorSystemUIControllerImpl`).

- [x] **Task 2.2: [TDD-Green/Refactor] Implement CapacitorSystemUIControllerImpl** `[P:High]` `[Owner:@data]`
  - Implement `CapacitorSystemUIControllerImpl` in `src/data/repositories/CapacitorSystemUIControllerImpl.ts` implementing `ISystemUIController`.
  - Safely guard Capacitor plugin invocations (`Capacitor.isPluginAvailable`) and wrap web APIs with error suppression and debug logging.
  - Refactor and ensure all unit tests pass cleanly with zero uncaught exceptions.
  - *Verification*: `npm test -- CapacitorSystemUIControllerImpl` passes 100%.

---

## Phase 3: Application Services & Hooks with TDD (`@application`)

Focus: Implement `ImmersiveModeService` for coordinated UI hiding, restoration, and visibility wake lock management, plus `useImmersivePlayer` hook for React player lifecycle binding.

- [x] **Task 3.1: [TDD-Red] Write Unit Tests for ImmersiveModeService** `[P:High]` `[Owner:@application]`
  - Create `src/application/services/ImmersiveModeService.test.ts`.
  - Test sequence execution on `enterImmersiveMode` (hide bars, lock orientation, enter fullscreen, acquire wake lock).
  - Test complete restoration on `exitImmersiveMode` (show bars, unlock orientation, release wake lock, exit fullscreen).
  - Test document `visibilitychange` handling: re-acquiring wake lock when returning to visible while immersive mode is active.
  - *Verification*: Tests fail (`npm test -- ImmersiveModeService`).

- [x] **Task 3.2: [TDD-Green/Refactor] Implement ImmersiveModeService** `[P:High]` `[Owner:@application]`
  - Implement `ImmersiveModeService` in `src/application/services/ImmersiveModeService.ts`.
  - Coordinate system UI transitions, preserve previous state for teardown, and manage visibility event listeners.
  - *Verification*: `npm test -- ImmersiveModeService` passes 100%.

- [ ] **Task 3.3: [TDD-Red] Write Unit Tests for useImmersivePlayer Hook** `[P:High]` `[Owner:@application]`
  - Create `src/application/hooks/useImmersivePlayer.test.ts` using `@testing-library/react`.
  - Test automatic entry on mount when `autoEnterOnMount: true`.
  - Test automatic teardown and full restoration on unmount.
  - Test manual `enter()` and `exit()` controls and reactive `state` updates.
  - *Verification*: Tests fail (`npm test -- useImmersivePlayer`).

- [ ] **Task 3.4: [TDD-Green/Refactor] Implement useImmersivePlayer Hook** `[P:High]` `[Owner:@application]`
  - Implement `useImmersivePlayer` in `src/application/hooks/useImmersivePlayer.ts`.
  - Provide declarative React lifecycle integration with `ImmersiveModeService`.
  - *Verification*: `npm test -- useImmersivePlayer` passes 100%.

---

## Phase 4: Presentation Lifecycle Integration (`@presentation`)

Focus: Wire `useImmersivePlayer` into `PlayerPage.tsx` and align `VideoPlayer.tsx` controls and wake lock synchronization.

- [ ] **Task 4.1: Integrate Immersive Mode in PlayerPage** `[P:High]` `[Owner:@presentation]`
  - Update `src/presentation/pages/Player/PlayerPage.tsx` to use `useImmersivePlayer({ autoEnterOnMount: true })`.
  - Remove redundant direct `ScreenOrientation.lock()` / `unlock()` calls.
  - Ensure unmount cleanly triggers immersive exit and system UI restoration.
  - *Verification*: Component mounts without layout shifts and cleans up on navigate-back.

- [ ] **Task 4.2: Integrate VideoPlayer Fullscreen & Wake Lock Synchronization** `[P:Medium]` `[Owner:@presentation]`
  - Update `src/presentation/components/VideoPlayer/VideoPlayer.tsx` to coordinate with `ISystemUIController` / `ImmersiveModeService` for unified fullscreen toggling and wake lock management.
  - *Verification*: Fullscreen button toggles HTML5 fullscreen and keeps screen wake lock synchronized.

---

## Phase 5: Verification Suite (`@all`)

Focus: Comprehensive end-to-end quality check, TypeScript audit, and regression testing.

- [ ] **Task 5.1: Test Suite & Static Analysis Audit** `[P:High]` `[Owner:@all]`
  - Run full test suite:
    ```bash
    npm test
    ```
  - Run TypeScript compiler check:
    ```bash
    npx tsc --noEmit
    ```
  - Run linter:
    ```bash
    npm run lint
    ```
  - Verify zero TypeScript compiler errors, zero lint warnings, and 100% passing tests across all layers.
