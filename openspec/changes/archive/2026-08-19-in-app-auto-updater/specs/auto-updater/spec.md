# Specification: in-app-auto-updater

## Scope & Purpose
Defines the functional and technical requirements for the In-App Auto-Updater in Movixy across Web, Android Mobile, and Android TV platforms. The updater automatically performs non-blocking checks against remote releases, compares semantic versions, notifies users of new updates with changelogs, downloads APK assets, initiates native package installation on Android platforms, and provides full accessibility for TV remotes (D-pad) and desktop keyboards.

---

## Requirements

### Requirement 1: Semantic Version Comparison & Update Eligibility
The system SHALL evaluate the current application version against the latest remote release to determine if a newer version is available.

#### Scenario 1.1: Newer version available (Major / Minor / Patch)
- **Given** current app version is `"1.2.0"`
- **When** the remote release returns version `"1.3.0"` or `"1.2.1"` or `"2.0.0"`
- **Then** the check SHALL result in `hasUpdate = true`
- **And** the status SHALL be set to `UPDATE_AVAILABLE`
- **And** `latestRelease` SHALL contain the version, release notes (changelog), publication date, and download URL.

#### Scenario 1.2: App is up to date or newer (Dev / Pre-release)
- **Given** current app version is `"1.2.0"`
- **When** the remote release returns version `"1.2.0"` or `"1.1.9"`
- **Then** the check SHALL result in `hasUpdate = false`
- **And** the status SHALL be set to `UP_TO_DATE`.

#### Scenario 1.3: Semver formats with prefixes or pre-release tags
- **Given** current app version is `"1.2.0"`
- **When** remote version tags are formatted with `"v1.2.1"` or `"1.2.1-beta.1"`
- **Then** the version parser SHALL normalize the tags (stripping leading `"v"`) and perform clean semver precedence comparison.

---

### Requirement 2: Non-Blocking Startup & Background Update Check
The system SHALL perform update checks asynchronously on application startup without blocking UI rendering or delaying user interaction.

#### Scenario 2.1: Startup background check
- **Given** the user launches Movixy
- **When** the app layout initializes
- **Then** the update check SHALL execute in the background with a configurable delay (default: 2 seconds)
- **And** the app UI and splash transitions SHALL proceed without waiting for network response.

#### Scenario 2.2: Offline or network failure during check
- **Given** the device is offline or the release server is unreachable
- **When** the update check runs
- **Then** the error SHALL be captured silently without crashing the app or showing intrusive error dialogues
- **And** status SHALL be set to `IDLE` or `ERROR` with debug logging only.

#### Scenario 2.3: Dismissed update session memory
- **Given** a user has already dismissed an update prompt for version `"1.3.0"` in the current session
- **When** the user navigates between pages
- **Then** the update modal SHALL NOT re-prompt automatically unless manually triggered or a newer version is published.

---

### Requirement 3: User Notification & Changelog Modal
The system SHALL present an accessible, glassmorphic modal (`UpdateAvailableModal`) when an eligible update is detected.

#### Scenario 3.1: Changelog and metadata display
- **Given** an available update with version `"1.3.0"` and release notes `"### What's New\n- Added intro skipping\n- TV UI fixes"`
- **When** `UpdateAvailableModal` renders
- **Then** it SHALL display the current version, the target version, publication date, formatted changelog markdown/text, and primary action buttons.

#### Scenario 3.2: User dismisses optional update
- **Given** `UpdateAvailableModal` is open for an optional update
- **When** the user clicks "Más tarde" / "Dismiss" or presses `Escape` / Remote `Back`
- **Then** the modal SHALL close and update status SHALL transition to `IDLE`.

---

### Requirement 4: APK Download & Package Installer Execution
The system SHALL handle asset downloading with progress tracking and hand off APK installation to the Android OS.

#### Scenario 4.1: Android native download & install flow
- **Given** the app is running on Android (`Capacitor.getPlatform() === 'android'`)
- **When** the user clicks "Actualizar ahora"
- **Then** the system SHALL transition status to `DOWNLOADING`
- **And** download the APK file while emitting progress percentages `(0 - 100%)`
- **And** once download completes, invoke the native package installer intent to open the APK file
- **And** transition status to `INSTALLING` or `READY_TO_INSTALL`.

#### Scenario 4.2: Web/Desktop fallback
- **Given** the app is running in a standard web browser (`Capacitor.getPlatform() === 'web'`)
- **When** the user clicks "Actualizar ahora"
- **Then** the system SHALL open the release page or APK download URL in a new browser tab (`window.open(downloadUrl, '_blank')`).

#### Scenario 4.3: Download failure handling
- **Given** the download process is interrupted by network loss or write errors
- **When** an error occurs during download
- **Then** status SHALL transition to `ERROR`
- **And** display a user-friendly error message with a "Reintentar" (Retry) action.

---

### Requirement 5: TV D-Pad & Keyboard Accessibility
The update modal and actions SHALL be fully controllable via remote D-pad controls and keyboard shortcuts.

#### Scenario 5.1: Default focus and spatial navigation
- **Given** `UpdateAvailableModal` opens
- **When** the modal renders on screen
- **Then** the primary action button ("Actualizar ahora") SHALL receive immediate visual and DOM focus (`data-focusable="true"`, `data-focused="true"`)
- **And** pressing `ArrowDown` or `ArrowRight` SHALL navigate focus to the secondary button ("Más tarde") with TV focus sound.

#### Scenario 5.2: Remote Back / Escape cancellation
- **Given** `UpdateAvailableModal` is visible and not actively installing
- **When** the user presses TV Remote `Back` (keyCode 4 / GoBack) or keyboard `Escape`
- **Then** the modal SHALL dismiss cleanly.
