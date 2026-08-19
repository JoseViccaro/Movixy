# Proposal: Immersive Fullscreen Playback

## Intent
Provide a truly distraction-free, cinematic, edge-to-edge playback experience across Android native builds and Web/PWA platforms by entering an immersive mode on player mount (hiding system status bar and navigation bar, locking orientation to landscape, acquiring Web Screen Wake Lock and Fullscreen API) and reliably restoring all system UI and orientation states upon exit.

## Scope

### In Scope
- **Domain Abstractions**: Interface contracts for `ISystemUIController`, configuration models `SystemUIConfig`, and runtime state `SystemUIState`.
- **Data Implementation**: `CapacitorSystemUIControllerImpl` uniting Capacitor plugins (`@capacitor/status-bar`, `@capacitor/navigation-bar`, `@capacitor/screen-orientation`) with fallback to standard HTML5 Fullscreen and Screen Orientation / Wake Lock Web APIs.
- **Application Services & Hooks**: `ImmersiveModeService` managing state transitions, system UI hiding/restoration, and lifecycle preservation; `useImmersivePlayer` hook orchestrating player mount/unmount and cleanup.
- **Presentation Integration**: Integration with `PlayerPage.tsx` and `VideoPlayer.tsx` ensuring edge-to-edge canvas without black status bar letterboxing or on-screen navigation bar intrusion.
- **Strict TDD & Clean Architecture**: Complete unit and hook test coverage via Vitest and Testing Library.

### Out of Scope
- Custom hardware physical notch cutout modifications beyond native Android window insets (`setOverlaysWebView` / immersive sticky flags).
- Picture-in-Picture window management (handled independently by existing PiP hook).

## Capabilities

### New Capabilities
- `immersive-mode`: System UI orchestration, status bar hiding, navigation bar hiding, landscape orientation lock, and screen wake lock management across native and web runtimes.

### Modified Capabilities
- `player-page`: Mounts and unmounts player lifecycle through `useImmersivePlayer` instead of ad-hoc uncoordinated orientation calls.
- `video-player`: Coordinates fullscreen toggling and wake lock management with `ISystemUIController`.

## Clean Architecture Breakdown

- **`@domain`**:
  - `ISystemUIController`: Abstract contract for hiding/showing status bar, navigation bar, locking/unlocking orientation, and entering/exiting fullscreen.
  - `SystemUIConfig`: Configuration options (e.g. `hideStatusBar`, `hideNavigationBar`, `lockLandscape`, `requestWakeLock`, `requestFullscreen`).
  - `SystemUIState`: Immutable snapshot of current UI state (`isFullscreen`, `isImmersive`, `isOrientationLocked`, `isWakeLocked`).
- **`@data`**:
  - `CapacitorSystemUIControllerImpl`: Implementation consuming `@capacitor/status-bar`, `@capacitor/navigation-bar`, `@capacitor/screen-orientation`, `document.documentElement.requestFullscreen`, and `navigator.wakeLock`.
- **`@application`**:
  - `ImmersiveModeService`: Encapsulates high-level enter/exit workflows, tracks previous UI state for seamless restoration on teardown, and handles page visibility / wake lock re-acquisition.
  - `useImmersivePlayer`: React lifecycle hook exposing enter/exit methods and automatic cleanup on unmount.
- **`@presentation`**:
  - Updates to `PlayerPage.tsx` and `VideoPlayer.tsx` for seamless immersive lifecycle handling and UI polish.

## Verification & TDD Strategy
- Strict Test-Driven Development (Red-Green-Refactor).
- Unit tests for domain models, `CapacitorSystemUIControllerImpl` (native vs web fallback branch tests), `ImmersiveModeService` (enter/exit/restore state tests), and `useImmersivePlayer` hook tests.
