# Tasks: Player Thumbnails and Intro/Credits Skip

This document defines the strict TDD task breakdown for implementing timeline thumbnail scrubbing (Trickplay/BIF with canvas fallback) and automated chapter/intro/credits marker detection with one-tap skipping in the Movixy video player.

---

## Review Workload Forecast

| Metric | Estimate |
|---|---|
| **Total Tasks** | 16 |
| **New Domain Model Files** | 2 |
| **New Data / Source Files** | 3 |
| **New Application Files** | 4 |
| **New Presentation Files** | 4 |
| **Modified Files** | 1 (`VideoPlayer.tsx`) |
| **New Unit & Component Test Files** | 7 |
| **Estimated Review Time** | ~45 - 60 minutes |

---

## Phase 1: Domain Entities & Repository Contracts (`@domain`)

Focus: Define pure TypeScript domain models, interfaces, coordinate structs, marker types, and abstract repository contracts.

- [x] **Task 1.1: Trickplay Domain Models & Repository Contract** `[P:High]` `[Owner:@domain]`
  - Define `TrickplayTile`, `TrickplayManifest`, and `ScrubPreviewState` in `src/domain/models/trickplay.model.ts`.
  - Define `ITrickplayRepository` interface (`getTrickplayManifest`, `getFrameForTime`).
  - *Verification*: Pure type definitions; passes `npm run type-check` (or `npx tsc --noEmit`).

- [x] **Task 1.2: Chapter & Marker Domain Models & Repository Contract** `[P:High]` `[Owner:@domain]`
  - Define `MarkerType` (`'intro' | 'credits' | 'recap' | 'chapter'`), `ChapterMarker`, and `ActiveSkipMarkerState` in `src/domain/models/chapter-marker.model.ts`.
  - Define `IChapterRepository` interface (`getChapterMarkers`).
  - *Verification*: Pure type definitions; passes `npm run type-check`.

---

## Phase 2: Data Repositories & Parsers with TDD (`@data`)

Focus: Implement Jellyfin storyboard / BIF trickplay parsing, coordinate math, chapter metadata normalization, and client-side canvas fallback using Strict TDD (Red -> Green -> Refactor).

- [x] **Task 2.1: [TDD-Red/Green] JellyfinTrickplayRepositoryImpl & BIF Parser** `[P:High]` `[Owner:@data]`
  - **Red**: Create `src/data/repositories/JellyfinTrickplayRepositoryImpl.test.ts` testing manifest fetching, BIF binary header extraction (`0x89 0x42 0x49 0x46`), tile coordinate calculation (column, row, background offsets `x`, `y`), interval index lookup, and boundary clamping (<0s, >duration).
  - **Green**: Implement `JellyfinTrickplayRepositoryImpl` in `src/data/repositories/JellyfinTrickplayRepositoryImpl.ts` satisfying all coordinate math and LRU memory caching (up to 5 spritesheets).
  - **Refactor**: Optimize tile math and memory eviction logic.

- [x] **Task 2.2: [TDD-Red/Green] JellyfinChapterRepositoryImpl** `[P:High]` `[Owner:@data]`
  - **Red**: Create `src/data/repositories/JellyfinChapterRepositoryImpl.test.ts` testing Jellyfin `/Items/{itemId}?Fields=Chapters` parsing, chapter categorization regex (`/intro|opening|op\b/i`, `/credit|ending|outro|ed\b/i`, `/recap|previously/i`), sequential start/end time alignment, and Jellyfin 10.9+ `IntroStart`/`CreditsStart` plugin tag prioritization.
  - **Green**: Implement `JellyfinChapterRepositoryImpl` in `src/data/repositories/JellyfinChapterRepositoryImpl.ts`.
  - **Refactor**: Simplify regex matcher and timestamp conversion helpers.

- [x] **Task 2.3: [TDD-Red/Green] CanvasThumbnailFallback Implementation** `[P:Medium]` `[Owner:@data]`
  - **Red**: Create `src/data/sources/CanvasThumbnailFallback.test.ts` testing off-screen video frame capture fallback, seek resolution, and snapshot canvas blob cache when server trickplay is unavailable (404).
  - **Green**: Implement `CanvasThumbnailFallback` in `src/data/sources/CanvasThumbnailFallback.ts`.
  - **Refactor**: Ensure clean resource disposal of off-screen video and canvas elements.

---

## Phase 3: Application Services & Hooks with TDD (`@application`)

Focus: Implement thumbnail lookup calculation, active chapter/marker detection, and reactive React hooks for video player integration.

- [x] **Task 3.1: [TDD-Red/Green] ThumbnailScrubService Implementation** `[P:High]` `[Owner:@application]`
  - **Red**: Create `src/application/services/thumbnail-scrub.service.test.ts` verifying time-to-tile coordinate resolution, fallback canvas triggering, tooltip $(x, y)$ boundary clamping relative to player width, and formatted timecode string generation.
  - **Green**: Implement `ThumbnailScrubService` in `src/application/services/thumbnail-scrub.service.ts`.
  - **Refactor**: Decouple tooltip DOM positioning logic into pure utility functions.

- [x] **Task 3.2: [TDD-Red/Green] ChapterMarkerService Implementation** `[P:High]` `[Owner:@application]`
  - **Red**: Create `src/application/services/chapter-marker.service.test.ts` testing active marker resolution for current playback time $T$, entry detection ($T_{start} \le T < T_{end}$), next chapter boundary target calculation ($T_{end}$), and exit dismiss.
  - **Green**: Implement `ChapterMarkerService` in `src/application/services/chapter-marker.service.ts`.
  - **Refactor**: Ensure zero-allocation checks during frequent `timeupdate` callbacks.

- [x] **Task 3.3: useThumbnailScrub Custom Hook** `[P:High]` `[Owner:@application]`
  - Implement `src/application/hooks/useThumbnailScrub.ts` listening to progress-bar pointer/touch hover/drag events with debounced position calculation and smooth tooltip coordinate transitions.
  - *Verification*: Hook test verifying hover coordinate conversion, scrub state updates, and dismissal on mouse leave.

- [x] **Task 3.4: useChapterMarkers Custom Hook** `[P:High]` `[Owner:@application]`
  - Implement `src/application/hooks/useChapterMarkers.ts` listening to `currentTime` updates, managing `activeSkipMarkerState`, and providing a direct `skipCurrentMarker()` action.
  - *Verification*: Hook test verifying marker state updates during simulated playback advancement.

---

## Phase 4: Presentation Tooltip, Button & VideoPlayer Integration (`@presentation`)

Focus: Build pixel-perfect visual components and wire them into `VideoPlayer.tsx`.

- [x] **Task 4.1: ThumbnailPreviewTooltip Component & Styles** `[P:High]` `[Owner:@presentation]`
  - Create `src/presentation/components/VideoPlayer/ThumbnailPreviewTooltip.tsx` and `ThumbnailPreviewTooltip.module.css` rendering a rounded card with sprite CSS background clipping (`background-position`, `background-size`), high-res drop-shadow, and readable timestamp badge.
  - *Verification*: Component test in `ThumbnailPreviewTooltip.test.tsx` verifying DOM render, background offsets, and fallback image rendering.

- [x] **Task 4.2: SkipMarkerButton Component & Styles** `[P:High]` `[Owner:@presentation]`
  - Create `src/presentation/components/VideoPlayer/SkipMarkerButton.tsx` and `SkipMarkerButton.module.css` with a glassmorphic pill button in the bottom-right corner, dynamic label ("Saltar Intro" / "Saltar Créditos"), and spatial navigation D-pad support.
  - *Verification*: Component test in `SkipMarkerButton.test.tsx` verifying visibility, click event emission with target skip time, and keyboard focusability.

- [x] **Task 4.3: VideoPlayer Timeline & Marker Integration** `[P:High]` `[Owner:@presentation]`
  - Wire `useThumbnailScrub` and `useChapterMarkers` into `src/presentation/components/VideoPlayer/VideoPlayer.tsx`.
  - Render `<ThumbnailPreviewTooltip>` over the timeline progress track during mouse hover / mobile touch scrub.
  - Render `<SkipMarkerButton>` overlay when entering intro/credits segments.
  - *Verification*: VideoPlayer renders tooltip on timeline interaction and executes one-tap skip when button is clicked.

---

## Phase 5: Verification & Quality Suite (`@all`)

Focus: Full automated regression verification, TypeScript compiler audit, and end-to-end integration tests.

- [x] **Task 5.1: Unit & Component Test Suite Execution** `[P:High]` `[Owner:@all]`
  - Run all Vitest suites for trickplay repositories, chapter services, and player presentation components.
  - Ensure 100% test pass rate with zero regressions in existing player features.

- [x] **Task 5.2: TypeScript & Static Analysis Verification** `[P:High]` `[Owner:@all]`
  - Run `npx tsc --noEmit` to guarantee zero type errors.
  - Verify clean architectural layer boundaries (`@domain` -> `@data` -> `@application` -> `@presentation`).Vitest unit and component tests:
    ```bash
    npm run test
    ```
  - Run strict TypeScript type check and linter:
    ```bash
    npm run type-check
    npm run lint
    ```
  - Verify zero TypeScript compiler errors or ESLint warnings.

- [x] **Task 5.3: End-to-End Playback & Accessibility Verification** `[P:Medium]` `[Owner:@all]`
  - Verify timeline scrubbing preview responsiveness (sub-16ms layout updates).
  - Verify intro/credits skip auto-appearance, auto-dismiss, and keyboard/TV remote D-pad focus flow.
  - Verify graceful fallback to canvas snapshot when trickplay spritesheet is missing.
