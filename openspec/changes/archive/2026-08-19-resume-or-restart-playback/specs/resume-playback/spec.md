# Specification: resume-or-restart-playback

## Scope & Purpose
Defines the functional and technical requirements for prompting users to resume or restart playback when launching media in Movixy (`MediaModal` and direct navigation in `PlayerPage`). When media has previously saved progress within the resumption window (between 2% and 95% completion or equivalent ticks), the user is presented with options to resume from the saved position or restart from the beginning, fully navigable via TV D-pad and standard keyboard controls (`Enter`, `Esc`).

---

## Requirements

### Requirement 1: Playback Resume Eligibility Detection
The system SHALL evaluate media playback progress against threshold boundaries to determine if the resume prompt is required.

#### Scenario 1.1: Media within valid resume threshold (2% to 95%)
- **Given** a media item with `playbackPositionTicks` representing 25% of total runtime (between 2% and 95%)
- **When** playback evaluation occurs for the media item
- **Then** `isResumable` SHALL evaluate to `true`
- **And** `savedPositionSeconds` SHALL equal the converted position in seconds (`playbackPositionTicks / 10,000,000`)
- **And** `formattedTime` SHALL return a human-readable timestamp (e.g. `12:45` or `1:02:15`).

#### Scenario 1.2: Media below minimum threshold (<= 2%)
- **Given** a media item with `playbackPositionTicks` representing 1% of total runtime or `<= 10 seconds`
- **When** playback evaluation occurs
- **Then** `isResumable` SHALL evaluate to `false`
- **And** playback SHALL default to starting at `0` seconds without displaying a choice prompt.

#### Scenario 1.3: Media above maximum threshold (>= 95%)
- **Given** a media item with `playbackPositionTicks` representing 96% of total runtime (completed/credits stage)
- **When** playback evaluation occurs
- **Then** `isResumable` SHALL evaluate to `false`
- **And** playback SHALL start from `0` seconds (restart) without prompting.

#### Scenario 1.4: Media with no playback history
- **Given** a media item where `playbackPositionTicks` is `0`, `undefined`, or `null`
- **When** playback evaluation occurs
- **Then** `isResumable` SHALL evaluate to `false`
- **And** playback SHALL launch directly at `0` seconds.

---

### Requirement 2: User Action Handling (Resume vs Restart)
The system SHALL present a clear modal dialog (`ResumeChoiceDialog`) when media is resumable, allowing the user to select their desired starting point.

#### Scenario 2.1: User selects "Reanudar"
- **Given** an open `ResumeChoiceDialog` displaying saved position `15:30` (930 seconds)
- **When** the user clicks/presses the "Reanudar" button
- **Then** the dialog SHALL dismiss
- **And** the player SHALL launch or seek with `startPositionSeconds = 930`.

#### Scenario 2.2: User selects "Empezar desde el principio"
- **Given** an open `ResumeChoiceDialog`
- **When** the user clicks/presses "Empezar desde el principio"
- **Then** the dialog SHALL dismiss
- **And** the player SHALL launch with `startPositionSeconds = 0`.

#### Scenario 2.3: User dismisses modal without selection
- **Given** an open `ResumeChoiceDialog`
- **When** the user clicks outside the modal or clicks the cancel/close button
- **Then** the dialog SHALL close without launching playback or altering existing view state.

---

### Requirement 3: D-Pad Navigation & Keyboard Shortcuts
The resume dialog and integration components SHALL adhere to Android TV / Apple TV / Fire TV remote D-pad standards and desktop keyboard conventions.

#### Scenario 3.1: Default focus assignment
- **Given** `ResumeChoiceDialog` opens for an eligible media item
- **When** the modal renders on screen
- **Then** the primary action "Reanudar" SHALL automatically receive visual and keyboard focus (`data-focused="true"`).

#### Scenario 3.2: Spatial D-Pad movement
- **Given** focus is currently on the "Reanudar" button
- **When** the user presses `ArrowDown` or `ArrowRight` on the remote/keyboard
- **Then** focus SHALL navigate to "Empezar desde el principio"
- **And** trigger the TV focus audio feedback tick.

#### Scenario 3.3: Keyboard shortcut confirmations (`Enter` / `Space`)
- **Given** any action button is focused in `ResumeChoiceDialog`
- **When** the user presses `Enter` or `Space`
- **Then** the focused action SHALL immediately execute.

#### Scenario 3.4: Cancellation via `Esc` / TV Back button
- **Given** `ResumeChoiceDialog` is visible
- **When** the user presses `Escape` or the TV Remote Back key (keyCode `4` / `Backspace` / `GoBack`)
- **Then** the modal SHALL close and cancel the playback transition.

---

### Requirement 4: Integration in Presentation Layer (`MediaModal` & `PlayerPage`)
The resume flow SHALL be seamlessly integrated into both the media details modal and direct URL player routes.

#### Scenario 4.1: Launching playback from MediaModal
- **Given** a user opens `MediaModal` for a movie or episode with 40% progress
- **When** the user clicks the "Reproducir" button or selects an episode row
- **Then** `MediaModal` SHALL present `ResumeChoiceDialog` before redirecting to `PlayerPage`.

#### Scenario 4.2: Direct link navigation to PlayerPage
- **Given** a user navigates directly to `/player/:mediaId` (e.g. via deep link or browser refresh)
- **When** media metadata loads with eligible resume progress
- **Then** `PlayerPage` SHALL display `ResumeChoiceDialog` prior to starting video stream playback.
