# Proposal: Player Thumbnails and Intro/Credits Skip

## Intent
Deliver a top-tier media playback experience by implementing interactive timeline thumbnail scrubbing (Trickplay/BIF/Jellyfin storyboard API with canvas fallback) and automatic intro/credits chapter marker detection with one-tap skip action.

## Scope

### In Scope
- **Trickplay & Scrubbing**: Fetch Jellyfin storyboard/BIF trickplay spritesheets or client-side video canvas frame extractor with time-synced preview tooltip card.
- **Marker Detection & Skipping**: Parse Jellyfin chapter markers and intro/credit timestamps; trigger dynamic, auto-hiding "Skip Intro" and "Skip Credits" action overlays.
- **Clean Architecture & TDD**: Layered separation across `@domain`, `@data`, `@application`, and `@presentation` with 100% unit/integration test coverage.

### Out of Scope
- Server-side automated audio fingerprinting for intro detection.
- Edits to Jellyfin server database metadata.

## Capabilities

### New Capabilities
- `player-thumbnail-scrubbing`: Storyboard and BIF thumbnail parsing, caching, and time-synchronized floating preview card rendering.
- `player-marker-skip`: Chapter and intro/credit marker detection, playback position tracking, and one-tap skip execution.

### Modified Capabilities
- `video-player`: Integrate thumbnail scrub preview tooltip into the timeline seeker and embed skip marker overlay triggers.

## Clean Architecture Breakdown

- **`@domain`**:
  - Models: `ChapterMarker`, `MarkerType` (`intro`, `credits`, `chapter`), `TrickplayManifest`, `ThumbnailFrame`.
  - Interfaces: `IChapterRepository`, `ITrickplayRepository`.
- **`@data`**:
  - `JellyfinChapterRepository`: Fetches item chapters and intro/outro markers from Jellyfin API.
  - `JellyfinTrickplayRepository`: Downloads/parses BIF files and storyboard spritesheets with LRU frame caching.
  - `CanvasThumbnailFallbackDataSource`: Generates video frame snapshot previews when trickplay tiles are unavailable.
- **`@application`**:
  - `ThumbnailScrubService`: Resolves thumbnail frame image and dimensions for a given scrub timestamp.
  - `ChapterMarkerService`: Tracks playback time against active markers and emits skip eligibility events.
- **`@presentation`**:
  - `ThumbnailTooltip`: Floating card showing preview frame and timecode on hover/touch scrub.
  - `SkipMarkerButton`: Floating, animated "Skip Intro" / "Skip Credits" button with auto-dismiss timer.

## Verification & TDD Strategy
- **Unit Tests**: Domain entities, repository parsers (BIF/spritesheets), `ThumbnailScrubService`, and `ChapterMarkerService` time boundaries.
- **Component Tests**: Seeker scrub tooltip rendering and `SkipMarkerButton` visibility & click handlers via Vitest + Testing Library.
