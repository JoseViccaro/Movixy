# Specification: trickplay-thumbnails

## Scope & Purpose
Defines the functional and technical requirements for timeline hover and touch scrub preview in the Movixy video player. The system extracts and displays thumbnail preview frames from Jellyfin trickplay spritesheets / BIF streams, formats timecodes dynamically, positions floating tooltip cards relative to seeker progress, and falls back to client-side canvas snapshot extraction when server trickplay data is unavailable.

---

## Requirements

### Requirement 1: Trickplay Manifest and Tile Coordinate Resolution
The system SHALL parse Jellyfin trickplay metadata (or BIF files) to map any arbitrary playback timestamp $t$ to the corresponding spritesheet tile coordinates $(x, y, w, h)$.

#### Scenario 1.1: Resolving frame coordinates from multi-tile spritesheet
- **Given** a video asset with trickplay tile interval of 10 seconds, tile dimensions 320x180, 10 columns, and 10 rows per spritesheet
- **When** the user scrubs to timestamp `00:03:45` (225 seconds)
- **Then** the trickplay service SHALL compute the tile index `Math.floor(225 / 10) = 22`
- **And** compute sheet index `0`, row `2`, and column `2`
- **And** return the spritesheet URL with CSS background position `x: -640px, y: -360px` and dimensions `320x180`.

#### Scenario 1.2: Boundary clamping for seek times beyond duration
- **Given** a video of duration 600 seconds with trickplay manifest
- **When** scrub timestamp is queried at `-5s` or `620s`
- **Then** the service SHALL clamp timestamp to `0s` and `600s` respectively and return valid edge frame coordinates.

---

### Requirement 2: Floating Thumbnail Preview Tooltip Rendering
The system SHALL render a floating preview tooltip above the seek bar on hover (mouse pointer) and active drag (touch/mouse scrub).

#### Scenario 2.1: Tooltip positioning on timeline hover
- **Given** video player controls are visible on desktop
- **When** the user hovers over the progress bar at 45% of total width
- **Then** the `ThumbnailPreviewTooltip` SHALL position itself centered horizontally at 45% of the seeker width
- **And** clamp its horizontal position within the player boundaries so it never overflows off-screen edges (left margin $\ge 12\text{px}$, right margin $\ge 12\text{px}$).

#### Scenario 2.2: Timestamp formatting within preview card
- **Given** the user hovers over timestamp 75 seconds (video total duration 500 seconds)
- **When** the tooltip renders
- **Then** the timestamp badge SHALL format the time as `01:15`
- **And** when total video duration exceeds 1 hour (e.g. 3675 seconds), format as `01:01:15`.

#### Scenario 2.3: Touch scrub preview display
- **Given** a user is scrubbing the timeline on a touch device
- **When** touch drag moves along the seeker track
- **Then** the thumbnail tooltip SHALL follow the active touch point with smooth animation and display instantaneous preview frames at 60fps.

---

### Requirement 3: Client-Side Canvas Fallback
The system SHALL provide client-side video frame capture when the Jellyfin server does not have pre-generated trickplay spritesheets or BIF assets.

#### Scenario 3.1: Fallback initialization when trickplay 404s
- **Given** a media item without server trickplay metadata
- **When** the player initializes thumbnail service
- **Then** the repository SHALL gracefully switch to `CanvasThumbnailFallback`
- **And** generate low-resolution preview snapshots using an off-screen HTML video element or memoized frame cache.

---

### Requirement 4: Memory Optimization and Prefetching
The system SHALL manage spritesheet memory usage and prefetch adjacent tiles without degrading playback framerate or overloading network bandwidth.

#### Scenario 4.1: Spritesheet image caching with LRU eviction
- **Given** a user frequently scrubs across a 2-hour movie
- **When** multiple spritesheet image assets are downloaded
- **Then** the repository SHALL retain up to 5 concurrent spritesheet images in an LRU memory cache
- **And** automatically dispose older sheets to prevent memory leaks on low-end mobile devices.
