# Specification: player-gesture-engine

## Scope & Purpose
Defines the functional and technical requirements for the touch and pointer gesture recognition engine integrated into the Movixy video player. It enables mobile/tablet gesture interactions comparable to VLC and Infuse: vertical swipe for brightness (left screen half) and volume (right screen half), double-tap to seek (left: -10s, right: +10s), and horizontal scrub to fast-forward/rewind with head-up display (HUD) feedback at 60fps.

---

## Requirements

### Requirement 1: Vertical Touch Swipe for Brightness & Volume
The system SHALL interpret vertical drag gestures on touch devices to adjust screen brightness and audio volume depending on the screen zone.

#### Scenario 1.1: Left-half vertical drag adjusts brightness
- **Given** a user is watching video in fullscreen on a touch-enabled device
- **When** the user drags a finger vertically on the left 40% horizontal zone of the video player viewport
- **Then** the gesture engine SHALL compute the vertical delta relative to screen height
- **And** adjust player display brightness between `0.1` and `1.0` (using CSS overlay filter or native brightness plugin where available)
- **And** display a brightness HUD badge with icon and percentage indicator on the left side of the screen.

#### Scenario 1.2: Right-half vertical drag adjusts volume
- **Given** a user is watching video on a touch-enabled device
- **When** the user drags a finger vertically on the right 40% horizontal zone of the video player viewport
- **Then** the gesture engine SHALL compute the vertical delta
- **And** adjust HTML video element volume between `0.0` and `1.0`
- **And** display a volume HUD badge with icon (muted, low, high) and percentage indicator on the right side of the screen.

---

### Requirement 2: Double-Tap to Seek
The system SHALL recognize rapid successive taps on the player to seek backward or forward in time increments.

#### Scenario 2.1: Double-tap on left half seeks backward 10 seconds
- **Given** video is playing or paused
- **When** two consecutive taps occur on the left half of the player canvas within 300ms
- **Then** the video playback timestamp SHALL decrease by 10 seconds (clamped to 0)
- **And** display a circular flash seek overlay indicating `-10s` (or cumulative `-20s`, `-30s` on chained rapid taps) with smooth fade-out.

#### Scenario 2.2: Double-tap on right half seeks forward 10 seconds
- **Given** video is playing or paused
- **When** two consecutive taps occur on the right half of the player canvas within 300ms
- **Then** the video playback timestamp SHALL increase by 10 seconds (clamped to duration)
- **And** display a circular flash seek overlay indicating `+10s` (or cumulative `+20s`, `+30s` on chained rapid taps).

#### Scenario 2.3: Center tap toggles control visibility without triggering seek
- **Given** video is playing
- **When** a single tap occurs in the center zone of the screen
- **Then** the player controls visibility SHALL toggle (show/hide) without changing playback time or volume.

---

### Requirement 3: Horizontal Drag to Scrub
The system SHALL interpret horizontal drag gestures across the player canvas as rapid time scrubbing.

#### Scenario 3.1: Horizontal swipe initiates scrub preview
- **Given** video is active
- **When** a pointer/finger drags horizontally with a delta exceeding 15 pixels
- **Then** the gesture engine SHALL lock gesture state to `scrub`
- **And** display a centered Scrub HUD showing target time, time delta (e.g. `+01:45`), and current video duration
- **And** update the target seek position proportionally to drag distance.

#### Scenario 3.2: Releasing horizontal drag commits seek
- **Given** an ongoing horizontal scrub gesture
- **When** the user releases pointer / touch contact (`pointerup` / `touchend`)
- **Then** the video player SHALL immediately seek to the accumulated target timestamp
- **And** dismiss the Scrub HUD with a fade transition.

---

### Requirement 4: Smooth 60fps HUD Feedback and Non-Interference
The system SHALL render HUD feedback smoothly without inducing React re-render thrashing or conflicting with standard UI click buttons.

#### Scenario 4.1: Gesture HUD rendering performance
- **Given** continuous swipe motion on touch screen
- **When** gesture HUD values update
- **Then** value updates SHALL use direct DOM node refs or fast lightweight state to prevent frame drops (<16ms frame budget).

#### Scenario 4.2: Event bubbling isolation
- **Given** interactive buttons (Close, Settings, Audio/Subtitle menus, Progress bar) are visible on the player OSD
- **When** user taps or drags on those specific button controls
- **Then** the gesture engine SHALL ignore the interaction and allow standard click handlers to fire without triggering brightness/volume/seek gestures.
