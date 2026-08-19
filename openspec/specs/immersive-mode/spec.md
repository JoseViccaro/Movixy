# Specification: immersive-mode

## Scope & Purpose
Defines the functional and technical requirements for the immersive fullscreen playback experience in Movixy across native mobile platforms (Android/Capacitor) and Web/PWA platforms. When the player enters playback, the system hides all non-essential OS UI elements (status bar, navigation bar), locks screen orientation to landscape, requests HTML5 fullscreen where applicable, and maintains an active screen wake lock to prevent display sleeping during movie or episode consumption. When the player unmounts or exits playback, all original OS UI chrome and orientation states are reliably restored.

---

## Requirements

### Requirement 1: Enter Immersive Fullscreen on Mount
The system SHALL enter an immersive fullscreen mode upon player mount/initialization.

#### Scenario 1.1: Native Mobile System Bars Hiding
- **Given** the application is running on a Capacitor-supported device (Android/iOS)
- **When** the video player is initialized/mounted
- **Then** the status bar SHALL be hidden (`StatusBar.hide()`)
- **And** the native navigation bar SHALL be hidden (`NavigationBar.hide()`)
- **And** the status bar overlays webview flag SHALL be enabled if supported to enable edge-to-edge drawing.

#### Scenario 1.2: Landscape Orientation Lock
- **Given** any supported runtime (native device or Web browser supporting Screen Orientation API)
- **When** the video player is initialized/mounted
- **Then** the screen orientation SHALL be locked to `'landscape'`
- **And** if the orientation lock fails or is unsupported (e.g. standard desktop browser window), the player SHALL gracefully continue playback without throwing unhandled exceptions.

#### Scenario 1.3: Web Fullscreen Request
- **Given** the application is running in a Web / PWA browser environment
- **When** immersive mode is entered and explicit fullscreen is requested or user initiates fullscreen
- **Then** the HTML5 Fullscreen API (`requestFullscreen` or vendor prefixed equivalent) SHALL be invoked on the player container or document root.

---

### Requirement 2: Exit Immersive Fullscreen on Unmount / Close
The system SHALL reliably restore previous system UI and orientation states when the player is closed or unmounted.

#### Scenario 2.1: Native Mobile System Bars Restoration
- **Given** the application entered immersive mode and hid the status and navigation bars
- **When** the user closes the player, navigates back, or the player component unmounts
- **Then** the status bar SHALL be shown again (`StatusBar.show()`)
- **And** the native navigation bar SHALL be shown again (`NavigationBar.show()`).

#### Scenario 2.2: Orientation Unlock
- **Given** the screen orientation was locked to landscape during playback
- **When** the player component unmounts or playback terminates
- **Then** the screen orientation SHALL be unlocked (`ScreenOrientation.unlock()`) returning control to auto-rotation or user system defaults.

#### Scenario 2.3: Web Fullscreen Exit
- **Given** the player was in HTML5 fullscreen mode
- **When** the player exits or unmounts
- **Then** the HTML5 Fullscreen API (`exitFullscreen`) SHALL be invoked if a fullscreen element is currently active.

---

### Requirement 3: Screen Wake Lock Preservation
The system SHALL keep the device display awake during active playback and manage wake lock lifecycle across visibility changes.

#### Scenario 3.1: Acquire Wake Lock on Playback Start
- **Given** a browser or platform supporting `navigator.wakeLock`
- **When** the player is mounted and media playback begins
- **Then** a `'screen'` wake lock sentinel SHALL be requested and held active.

#### Scenario 3.2: Wake Lock Re-acquisition on Page Visibility Change
- **Given** an active wake lock was released due to the app moving to the background or tab switching
- **When** the document visibility state changes back to `'visible'` while the player remains active
- **Then** the system SHALL automatically re-request and acquire the `'screen'` wake lock.

#### Scenario 3.3: Release Wake Lock on Player Teardown
- **Given** an active wake lock sentinel is held
- **When** the player unmounts or exits playback
- **Then** the wake lock sentinel SHALL be cleanly released and references nulled to prevent battery drain.

---

### Requirement 4: Robust Fault Tolerance and Platform Fallbacks
The system SHALL operate safely across varied host environments without runtime crashes.

#### Scenario 4.1: Graceful Degradation on Unsupported Platforms
- **Given** a platform where `StatusBar`, `NavigationBar`, `ScreenOrientation`, or `wakeLock` are partially or wholly unavailable (e.g. desktop web browsers, iOS webkit quirks)
- **When** immersive mode methods are called
- **Then** unavailable APIs SHALL fail silently or log debug warnings without breaking playback or UI rendering.
