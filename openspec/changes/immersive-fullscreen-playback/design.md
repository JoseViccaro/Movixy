# Technical Design: Immersive Fullscreen Playback

## 1. Overview & Architecture Goals

This technical design defines the implementation for `immersive-fullscreen-playback` in Movixy.
The primary goals are:
1. **Edge-to-Edge Distraction-Free Playback**: Ensure that when a video starts playing, status bars and navigation bars disappear completely, screen orientation locks to landscape, and HTML5 Fullscreen is triggered smoothly.
2. **Deterministic UI Restoration**: Guarantee that when playback finishes, is cancelled, or errors out, the status bar and navigation bar are restored, screen orientation is unlocked, and Fullscreen / Wake Lock resources are freed.
3. **Clean Architecture Separation**: Isolate platform-specific Capacitor and DOM APIs behind a pure `@domain` interface (`ISystemUIController`), wrapped in `@application` service & hook layer (`ImmersiveModeService`, `useImmersivePlayer`), and consumed effortlessly by `@presentation` components (`PlayerPage.tsx`, `VideoPlayer.tsx`).
4. **Strict TDD & Robust Fallbacks**: Ensure zero uncaught exceptions in mixed environments (Android native, iOS, Mobile Safari, Desktop Chrome, Electron/PWA).

---

## 2. Clean Architecture Layer Breakdown

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           @presentation Layer                           │
│  - PlayerPage.tsx (uses useImmersivePlayer for lifecycle entry/exit)    │
│  - VideoPlayer.tsx (integrates with useFullscreen & wake lock sync)    │
├─────────────────────────────────────────────────────────────────────────┤
│                           @application Layer                            │
│  - ImmersiveModeService.ts (Coordinates enter, exit, restore, wake lock)│
│  - useImmersivePlayer.ts (React lifecycle hook for player views)        │
├─────────────────────────────────────────────────────────────────────────┤
│                              @domain Layer                              │
│  - Models: SystemUIConfig, SystemUIState, OrientationLockType           │
│  - Contracts:                                                           │
│      * ISystemUIController                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                               @data Layer                               │
│  - CapacitorSystemUIControllerImpl.ts                                   │
│    (Wraps @capacitor/status-bar, @capacitor/navigation-bar,             │
│     @capacitor/screen-orientation, Fullscreen API, WakeLock API)        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Interface Contracts & Domain Definitions

### 3.1 `@domain/models/system-ui.model.ts`
```typescript
export type OrientationLockType = 'landscape' | 'portrait' | 'landscape-primary' | 'landscape-secondary' | 'any';

export interface SystemUIConfig {
  hideStatusBar?: boolean;
  hideNavigationBar?: boolean;
  lockOrientation?: OrientationLockType | boolean;
  requestWakeLock?: boolean;
  requestFullscreen?: boolean;
  overlayWebView?: boolean;
}

export interface SystemUIState {
  isStatusBarHidden: boolean;
  isNavigationBarHidden: boolean;
  isOrientationLocked: boolean;
  isFullscreen: boolean;
  isWakeLocked: boolean;
}

export interface ISystemUIController {
  // System bars
  hideStatusBar(): Promise<void>;
  showStatusBar(): Promise<void>;
  hideNavigationBar(): Promise<void>;
  showNavigationBar(): Promise<void>;
  setOverlaysWebView(overlay: boolean): Promise<void>;

  // Orientation
  lockOrientation(orientation: OrientationLockType): Promise<void>;
  unlockOrientation(): Promise<void>;

  // Fullscreen (Web / DOM)
  enterFullscreen(element?: HTMLElement): Promise<void>;
  exitFullscreen(): Promise<void>;
  isFullscreen(): boolean;

  // Wake Lock
  requestWakeLock(): Promise<boolean>;
  releaseWakeLock(): Promise<void>;
  isWakeLocked(): boolean;
}
```

---

## 4. Implementation Details by Layer

### 4.1 `@data/repositories/CapacitorSystemUIControllerImpl.ts`
- **Dynamic / Safe Plugin Calls**:
  - Dynamically imports or uses `@capacitor/status-bar`, `@capacitor/navigation-bar`, `@capacitor/screen-orientation` with guards for `Capacitor.isPluginAvailable(...)` and platform capability checking.
  - Safe fallbacks to `screen.orientation?.lock?.('landscape')` or `screen.lockOrientation?.('landscape')` where available.
- **HTML5 Fullscreen API Integration**:
  - Encapsulates standard `requestFullscreen`, `webkitRequestFullscreen`, `exitFullscreen`, and `webkitExitFullscreen`.
- **Wake Lock Management**:
  - Uses `navigator.wakeLock.request('screen')`, handles `release` event, and provides synchronous tracking flags.

### 4.2 `@application/services/immersive-mode.service.ts`
- **Orchestration**:
  - `enterImmersiveMode(config?: SystemUIConfig, targetElement?: HTMLElement): Promise<SystemUIState>`:
    1. If `hideStatusBar` is true (default true), calls `controller.setOverlaysWebView(true)` and `controller.hideStatusBar()`.
    2. If `hideNavigationBar` is true (default true), calls `controller.hideNavigationBar()`.
    3. If `lockOrientation` is specified (default `'landscape'`), calls `controller.lockOrientation('landscape')`.
    4. If `requestFullscreen` is true on web/desktop, calls `controller.enterFullscreen(targetElement)`.
    5. If `requestWakeLock` is true (default true), calls `controller.requestWakeLock()`.
    6. Returns updated `SystemUIState`.
  - `exitImmersiveMode(): Promise<SystemUIState>`:
    1. Calls `controller.showStatusBar()`.
    2. Calls `controller.showNavigationBar()`.
    3. Calls `controller.unlockOrientation()`.
    4. Calls `controller.releaseWakeLock()`.
    5. If in fullscreen, calls `controller.exitFullscreen()`.
  - **Visibility Handler**:
    - Listens for `visibilitychange` and re-acquires wake lock if the app returns from background while immersive mode is active.

### 4.3 `@application/hooks/useImmersivePlayer.ts`
- React hook encapsulating `ImmersiveModeService`:
  ```typescript
  export interface UseImmersivePlayerOptions {
    autoEnterOnMount?: boolean;
    config?: SystemUIConfig;
  }

  export function useImmersivePlayer(options: UseImmersivePlayerOptions = {}) {
    // Manages lifecycle mount -> enterImmersiveMode, unmount -> exitImmersiveMode
    // Provides state and explicit enter/exit/toggle methods
  }
  ```

### 4.4 `@presentation` Integration
- **`PlayerPage.tsx`**:
  - Replaces direct `ScreenOrientation.lock()` / `unlock()` with `useImmersivePlayer({ autoEnterOnMount: true })`.
  - On page back / exit, unmount cleanly runs `exitImmersiveMode()`.
- **`VideoPlayer.tsx`**:
  - Integrates fullscreen toggle button with the unified system controller and maintains clean wake lock synchronization.

---

## 5. File Changes Table

| File Path | Layer | Action | Description |
|-----------|-------|--------|-------------|
| `src/domain/models/system-ui.model.ts` | `@domain` | Create | Interfaces for `ISystemUIController`, `SystemUIConfig`, `SystemUIState`, `OrientationLockType` |
| `src/data/repositories/CapacitorSystemUIControllerImpl.ts` | `@data` | Create | Implements `ISystemUIController` with Capacitor plugins and Web API fallbacks |
| `src/application/services/immersive-mode.service.ts` | `@application` | Create | Orchestration service for immersive mode entry, exit, restore, and visibility wake lock |
| `src/application/hooks/useImmersivePlayer.ts` | `@application` | Create | React hook orchestrating player mount/unmount and immersive state |
| `src/presentation/pages/Player/PlayerPage.tsx` | `@presentation` | Modify | Use `useImmersivePlayer` to control immersive mode across player page lifecycle |
| `src/presentation/components/VideoPlayer/VideoPlayer.tsx` | `@presentation` | Modify | Align wake lock and fullscreen handling with unified controller |

---

## 6. Strict TDD Test Plan (Vitest)

All units will follow Strict Test-Driven Development (Red-Green-Refactor).

### 6.1 Data Layer Unit Tests
- `CapacitorSystemUIControllerImpl.test.ts`:
  - Verify `hideStatusBar` / `showStatusBar` calls StatusBar plugin methods safely.
  - Verify `hideNavigationBar` / `showNavigationBar` calls NavigationBar plugin safely.
  - Verify `lockOrientation('landscape')` / `unlockOrientation()` calls ScreenOrientation plugin and falls back gracefully when plugin is absent.
  - Verify `requestFullscreen` / `exitFullscreen` handles standard and webkit prefixed DOM APIs.
  - Verify `requestWakeLock` / `releaseWakeLock` manages sentinel and handles unsupported browsers without rejecting.

### 6.2 Application Layer Unit Tests
- `immersive-mode.service.test.ts`:
  - Verify `enterImmersiveMode` executes full sequence (status bar, nav bar, landscape lock, wake lock).
  - Verify `exitImmersiveMode` restores all bars, unlocks orientation, releases wake lock, and exits fullscreen.
  - Verify `visibilitychange` re-acquires wake lock when page returns to visible.
- `useImmersivePlayer.test.ts`:
  - Render hook: verify automatic entry on mount and automatic full exit/cleanup on unmount.
  - Test manual `enter()` and `exit()` triggers.

### 6.3 Presentation Component Integration Tests
- `PlayerPage.test.tsx`:
  - Verify entering `PlayerPage` activates immersive mode and unmounting triggers complete restoration.
