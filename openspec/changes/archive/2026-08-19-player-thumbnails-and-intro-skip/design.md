# Technical Design: Player Thumbnails and Intro/Credits Skip

## 1. Overview & Architecture Goals

This technical design defines the architectural plan for implementing rich trickplay thumbnail scrubbing and automated intro/credits skipping within the Movixy video player.

The primary objectives are:
1. **Interactive Timeline Scrub Preview**: Real-time thumbnail rendering over the timeline seek bar using Jellyfin storyboard / BIF trickplay tiles with canvas fallback, sub-16ms layout calculations, and timestamp formatting.
2. **Seamless Intro & Credits Skip**: Automated parsing of Jellyfin chapter metadata and plugin timestamps, real-time playback position tracking, and one-tap / remote D-pad accessible "Skip Intro" & "Skip Credits" action overlays.
3. **Clean Architecture & TDD Isolation**: Strict separation across `@domain`, `@data`, `@application`, and `@presentation` layers with comprehensive Vitest unit and React Testing Library component test suites.

---

## 2. Clean Architecture Layer Breakdown

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           @presentation Layer                           │
│  - ThumbnailPreviewTooltip.tsx, ThumbnailPreviewTooltip.module.css      │
│  - SkipMarkerButton.tsx, SkipMarkerButton.module.css                    │
│  - VideoPlayer.tsx (Integrated with scrub tooltip & skip overlay)       │
├─────────────────────────────────────────────────────────────────────────┤
│                           @application Layer                            │
│  - ThumbnailScrubService.ts (Frame resolution, timecode, LRU caching)   │
│  - ChapterMarkerService.ts (Active marker detection, skip target)       │
│  - useThumbnailScrub.ts (React hook for seeker hover/touch scrub)       │
│  - useChapterMarkers.ts (React hook for active skip markers)            │
├─────────────────────────────────────────────────────────────────────────┤
│                              @domain Layer                              │
│  - Models: TrickplayInfo, TrickplayManifest, TrickplayTile,             │
│            ChapterMarker, MarkerType, ScrubPreviewState                 │
│  - Repository Contracts:                                                │
│      * ITrickplayRepository                                             │
│      * IChapterRepository                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                               @data Layer                               │
│  - JellyfinTrickplayRepositoryImpl.ts (Storyboard/BIF parser & cache)   │
│  - JellyfinChapterRepositoryImpl.ts (Jellyfin chapters/intro parser)    │
│  - CanvasThumbnailFallback.ts (Client-side video frame capture fallback)│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Interface Contracts & Domain Definitions

### 3.1 `@domain/models/trickplay.model.ts`
```typescript
export interface TrickplayTile {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sheetWidth: number;
  sheetHeight: number;
}

export interface TrickplayManifest {
  itemId: string;
  intervalSeconds: number;
  tileWidth: number;
  tileHeight: number;
  tilesPerSheet: number;
  columns: number;
  rows: number;
  sheets: string[]; // URLs of spritesheets
  totalDurationSeconds: number;
}

export interface ScrubPreviewState {
  visible: boolean;
  timestamp: number;
  formattedTime: string;
  percent: number;
  pixelX: number;
  tile?: TrickplayTile;
}

export interface ITrickplayRepository {
  getTrickplayManifest(itemId: string, mediaSourceId?: string): Promise<TrickplayManifest | null>;
  getFrameForTime(manifest: TrickplayManifest, timeSeconds: number): TrickplayTile | null;
}
```

### 3.2 `@domain/models/chapter-marker.model.ts`
```typescript
export type MarkerType = 'intro' | 'credits' | 'recap' | 'chapter';

export interface ChapterMarker {
  id: string;
  name: string;
  type: MarkerType;
  startPositionSeconds: number;
  endPositionSeconds: number;
}

export interface ActiveSkipMarkerState {
  marker: ChapterMarker | null;
  isVisible: boolean;
  label: string; // e.g. "Skip Intro" | "Skip Credits" | "Skip Recap"
  targetTimeSeconds: number;
}

export interface IChapterRepository {
  getChapterMarkers(itemId: string): Promise<ChapterMarker[]>;
}
```

---

## 4. Implementation Details by Layer

### 4.1 `@data/repositories/JellyfinTrickplayRepositoryImpl.ts`
- **Jellyfin Trickplay Endpoint Resolution**:
  - Checks `/Items/{itemId}/Trickplay/{width}/manifest.mpd` or custom Jellyfin Storyboard API (`/Videos/{itemId}/Trickplay/...`).
  - If BIF binary stream is received, parses standard Roku BIF header (`0x89 0x42 0x49 0x46`), extracts index table, and generates data blob URLs.
- **Coordinate Calculation**:
  - Given time $t$, calculates `index = Math.floor(t / interval)`.
  - Computes `sheetIndex = Math.floor(index / (columns * rows))`.
  - Computes `col = index % columns`, `row = Math.floor((index % (columns * rows)) / columns)`.
  - Maps to background offset `x = -(col * width)`, `y = -(row * height)`.
- **LRU Cache**: Caches recent manifest and downloaded spritesheet images in browser memory.

### 4.2 `@data/repositories/JellyfinChapterRepositoryImpl.ts`
- Fetches item details from `/Items/{itemId}?Fields=Chapters`.
- Inspects `Chapters` array (`StartPositionTicks`, `Name`, `MarkerType` if available in Jellyfin 10.9+).
- Normalizes chapter names via regex matching:
  - Intro: `/intro|opening|op\b/i` -> `type = 'intro'`
  - Credits: `/credit|ending|outro|ed\b/i` -> `type = 'credits'`
  - Recap: `/recap|previously/i` -> `type = 'recap'`
- Sorts markers by `startPositionSeconds` and computes `endPositionSeconds` from the subsequent chapter start or item runtime.

### 4.3 `@application/services/ChapterMarkerService.ts` & `ThumbnailScrubService.ts`
- **`ChapterMarkerService`**:
  - Evaluates `findActiveMarker(markers, currentTime)`.
  - Returns `ActiveSkipMarkerState` with target seek position (`marker.endPositionSeconds`).
- **`ThumbnailScrubService`**:
  - Resolves current tile from manifest.
  - Formats timestamp string (`m:ss` or `h:mm:ss`).
  - Clamps pixel offsets between left margin and container bounds.

### 4.4 `@presentation/components/VideoPlayer/`
- **`ThumbnailPreviewTooltip.tsx`**:
  - Floating card displayed above seek bar when `hoverTime` or active scrub is active.
  - Displays thumbnail tile with CSS `background-position` or `<img>` crop and styled timecode pill.
- **`SkipMarkerButton.tsx`**:
  - High-visibility glassmorphism button rendered on the bottom-right of the player canvas.
  - Features icon (`FastForward`), dynamic label ("Skip Intro"), keyboard/TV focus handling, and auto-dismiss timer.
- **`VideoPlayer.tsx` Integration**:
  - Subscribes to `useChapterMarkers` and `useThumbnailScrub`.
  - Renders `ThumbnailPreviewTooltip` on seeker hover/drag.
  - Renders `SkipMarkerButton` when active marker is detected.

---

## 5. File Changes Table

| File Path | Layer | Action | Description |
|-----------|-------|--------|-------------|
| `src/domain/models/trickplay.model.ts` | `@domain` | Create | Interfaces for trickplay manifest, tile coordinates, and repository contract |
| `src/domain/models/chapter-marker.model.ts` | `@domain` | Create | Interfaces for chapter markers, marker types, skip state, and repository contract |
| `src/data/repositories/JellyfinTrickplayRepositoryImpl.ts` | `@data` | Create | Jellyfin storyboard / BIF trickplay parsing and tile coordinate resolver |
| `src/data/repositories/JellyfinChapterRepositoryImpl.ts` | `@data` | Create | Jellyfin chapter and intro/credits marker extractor |
| `src/data/sources/CanvasThumbnailFallback.ts` | `@data` | Create | Client-side fallback frame extractor when server trickplay is missing |
| `src/application/services/ThumbnailScrubService.ts` | `@application` | Create | Timestamp formatting, tile mapping, and scrub state builder |
| `src/application/services/ChapterMarkerService.ts` | `@application` | Create | Playback position marker matcher and skip target resolver |
| `src/application/hooks/useThumbnailScrub.ts` | `@application` | Create | React hook managing seeker hover, touch scrub, and preview tooltip state |
| `src/application/hooks/useChapterMarkers.ts` | `@application` | Create | React hook monitoring playback time against intro/credits markers |
| `src/presentation/components/VideoPlayer/ThumbnailPreviewTooltip.tsx` | `@presentation` | Create | Floating preview card showing trickplay thumbnail and timestamp |
| `src/presentation/components/VideoPlayer/ThumbnailPreviewTooltip.module.css` | `@presentation` | Create | Styling for tooltip card, border glow, and timestamp badge |
| `src/presentation/components/VideoPlayer/SkipMarkerButton.tsx` | `@presentation` | Create | Animated "Skip Intro" / "Skip Credits" action button with TV focus support |
| `src/presentation/components/VideoPlayer/SkipMarkerButton.module.css` | `@presentation` | Create | Glassmorphism styling and focus animations for skip action |
| `src/presentation/components/VideoPlayer/VideoPlayer.tsx` | `@presentation` | Modify | Integrate `useThumbnailScrub`, `useChapterMarkers`, `ThumbnailPreviewTooltip`, and `SkipMarkerButton` |

---

## 6. Strict TDD Testing Strategy

All implementation modules must follow Strict TDD with **Vitest** and **@testing-library/react**.

### 6.1 Domain & Data Unit Tests
- `JellyfinTrickplayRepositoryImpl.test.ts`:
  - Verify calculation of column, row, and background offsets for various timestamps and intervals.
  - Verify out-of-range timestamp clamping (negative and beyond duration).
  - Verify BIF binary parsing when BIF buffer is provided.
- `JellyfinChapterRepositoryImpl.test.ts`:
  - Verify categorization of "Intro", "Opening", "Credits", "Ending" chapters into `MarkerType`.
  - Verify start and end boundary calculation across sequential chapters.

### 6.2 Application Layer Tests
- `ThumbnailScrubService.test.ts`:
  - Verify time formatting (`01:23` vs `01:05:30`).
  - Verify preview state generation with valid tile coordinates and tooltip pixel bounds.
- `ChapterMarkerService.test.ts`:
  - Verify `findActiveMarker` returns `intro` marker when playback time is within intro window.
  - Verify `findActiveMarker` returns `null` when playback time is outside any marker window.
  - Verify skip target time matches `endPositionSeconds`.

### 6.3 Presentation & Hook Component Tests
- `ThumbnailPreviewTooltip.test.tsx`:
  - Render tooltip with tile background coordinates and verify formatted time badge.
  - Verify boundary clamping when near left or right screen edge.
- `SkipMarkerButton.test.tsx`:
  - Render with "Skip Intro" label and verify click handler is triggered.
  - Verify keyboard navigation: pressing `Enter` or `Space` executes skip callback.
  - Verify dismiss animation and unmount when `isVisible` becomes false.
