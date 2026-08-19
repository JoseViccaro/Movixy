# Specification: intro-credits-skipping

## Scope & Purpose
Defines the functional and technical requirements for automated chapter marker parsing and one-tap intro/credits skipping in the Movixy video player. When video playback enters an intro or credits marker range, an animated, focusable "Skip Intro" or "Skip Credits" action button dynamically appears on screen, allows instantaneous jumping past the marker segment upon click/tap/remote keypress, and automatically dismisses itself upon marker completion or inactivity timeout.

---

## Requirements

### Requirement 1: Chapter and Intro/Credits Marker Parsing
The system SHALL fetch and parse Jellyfin item chapter metadata into typed domain markers (`intro`, `credits`, `recap`, `chapter`).

#### Scenario 1.1: Categorizing intro markers by name and marker type
- **Given** a Jellyfin media item response containing chapters:
  - Chapter 1: "Prologue", start: `00:00:00`, end: `00:01:30`
  - Chapter 2: "Intro" (or "Opening"), start: `00:01:30`, end: `00:03:00`
  - Chapter 3: "Episode Main", start: `00:03:00`, end: `00:22:00`
  - Chapter 4: "Credits" (or "Ending"), start: `00:22:00`, end: `00:23:45`
- **When** the chapter repository processes the payload
- **Then** Chapter 2 SHALL be classified with `markerType: 'intro'`
- **And** Chapter 4 SHALL be classified with `markerType: 'credits'`.

#### Scenario 1.2: Jellyfin 10.9+ IntroSkip / ChapterMarker plugin support
- **Given** item metadata includes explicit `IntroStart`, `IntroEnd`, `CreditsStart`, `CreditsEnd` tags
- **When** parsing occurs
- **Then** the repository SHALL prioritize exact plugin timestamps over heuristic string matching.

---

### Requirement 2: Playback Position Monitoring & Triggering Skip Overlay
The system SHALL continuously compare current playback time against active markers and display contextual skip buttons.

#### Scenario 2.1: Triggering "Skip Intro" when playback enters intro window
- **Given** an intro marker spanning from `00:01:30` (90s) to `00:03:00` (180s)
- **When** playback timestamp advances to `00:01:31` (91s)
- **Then** the `SkipMarkerButton` SHALL transition to visible with label "Skip Intro"
- **And** remain visible while current time is within `[90s, 180s]`.

#### Scenario 2.2: Triggering "Skip Credits" when playback enters credits window
- **Given** a credits marker spanning from `00:22:00` (1320s) to `00:23:45` (1425s)
- **When** playback timestamp enters `1320s`
- **Then** the `SkipMarkerButton` SHALL transition to visible with label "Skip Credits".

---

### Requirement 3: Skip Action Execution
The system SHALL seamlessly seek past the marker boundary when the skip action is triggered.

#### Scenario 3.1: Clicking "Skip Intro" button
- **Given** active "Skip Intro" button for marker ending at `180s`
- **When** the user clicks/taps the button or presses Enter on focused TV remote
- **Then** the player SHALL seek `currentTime` to `180s`
- **And** immediately hide the `SkipMarkerButton`.

#### Scenario 3.2: Re-enabling controls and playback continuity
- **Given** video was playing when skip action was invoked
- **When** seek completes
- **Then** video playback SHALL continue seamlessly without pausing or rebuffering freezes.

---

### Requirement 4: Auto-Dismiss and TV Accessibility
The system SHALL support auto-dismiss timers and Android TV / Apple TV D-pad keyboard focus.

#### Scenario 4.1: Auto-dismiss when exiting marker range naturally
- **Given** an active "Skip Intro" button
- **When** the user watches through the intro and playback time passes `180s` without clicking skip
- **Then** the `SkipMarkerButton` SHALL automatically fade out and unmount.

#### Scenario 4.2: D-pad / Keyboard focus navigation
- **Given** an active skip button on screen in TV mode
- **When** user presses directional arrow or Tab key
- **Then** the `SkipMarkerButton` SHALL receive visual focus ring and trigger skip upon Space/Enter keydown.
