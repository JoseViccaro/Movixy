# Tasks: Zero-Friction Connection and Playback

This task breakdown organizes implementation across Clean Architecture layers with Strict Test-Driven Development (Red -> Green -> Refactor) and end-to-end integration verification.

---

## Review Workload Forecast

| Metric | Estimate |
|---|---|
| **Total Tasks** | 18 |
| **New Test Files** | 6 |
| **New Source Files** | 11 |
| **Modified Source Files** | 3 |
| **Estimated Review Time** | ~45 - 60 minutes |

---

## Phase 1: Domain Entities & Repository Contracts (@domain)

Focus: Define pure TypeScript domain models, playback types, gesture definitions, and abstract service/repository interfaces.

- [x] **Task 1.1: Discovery & Connection Domain Models** `[P:High]` `[Owner:@domain]`
  - Define `DiscoveredServer`, `ServerEndpointPingResult`, and `ServerConnectionConfig` in `src/domain/models/discovery.model.ts`.
  - Define `IServerDiscoveryRepository` interface.
  - *Verification*: Pure type definitions; passes TypeScript typecheck.

- [x] **Task 1.2: Media Profiler & Playback Domain Models** `[P:High]` `[Owner:@domain]`
  - Define `ClientMediaCapabilities`, `PlaybackDeliveryMethod`, and `PlaybackStreamPlan` in `src/domain/models/media-profile.model.ts`.
  - Define `IMediaProfileService` and `IPlaybackEngineService` interfaces.
  - *Verification*: Pure type definitions; passes TypeScript typecheck.

- [x] **Task 1.3: Gesture Engine Domain Models** `[P:Medium]` `[Owner:@domain]`
  - Define `GestureType`, `GestureHUDState`, `TouchPosition`, and `GestureAction` in `src/domain/models/gesture.model.ts`.
  - *Verification*: Pure type definitions; passes TypeScript typecheck.

---

## Phase 2: Data Sources & Dynamic Profiler (@data)

Focus: Implement subnet HTTP sweeping, media capability profiler, and Jellyfin DeviceProfile builder using strict TDD.

- [x] **Task 2.1: [TDD-Red/Green] SubnetProber Implementation** `[P:High]` `[Owner:@data]`
  - Red: Write unit tests in `src/data/sources/SubnetProber.test.ts` testing subnet ranges, ping timeouts (AbortController), and error handling.
  - Green: Implement `SubnetProber` in `src/data/sources/SubnetProber.ts` executing bounded concurrent HTTP ping checks against `/System/Info/Public`.
  - Refactor: Optimize concurrency limit and abort signal cleanup.

- [x] **Task 2.2: [TDD-Red/Green] MediaCapabilitiesProfiler Implementation** `[P:High]` `[Owner:@data]`
  - Red: Write unit tests in `src/data/sources/MediaCapabilitiesProfiler.test.ts` mocking `navigator.mediaCapabilities.decodingInfo` and fallback to `HTMLMediaElement.canPlayType`.
  - Green: Implement `MediaCapabilitiesProfiler` in `src/data/sources/MediaCapabilitiesProfiler.ts` evaluating H.264, HEVC, AV1, VP9, AAC, Opus, FLAC, AC3 support and display dimensions.
  - Refactor: Add caching to prevent redundant decoding queries.

- [x] **Task 2.3: [TDD-Red/Green] DeviceProfileBuilder Implementation** `[P:High]` `[Owner:@data]`
  - Red: Write unit tests in `src/data/repositories/DeviceProfileBuilder.test.ts` validating Jellyfin `DeviceProfile` JSON payload structure.
  - Green: Implement `DeviceProfileBuilder` in `src/data/repositories/DeviceProfileBuilder.ts` constructing `DirectPlayProfiles`, `CodecProfiles`, and fallback `TranscodingProfiles`.
  - Refactor: Ensure clean mappings from `ClientMediaCapabilities`.

- [x] **Task 2.4: [TDD-Red/Green] ServerDiscoveryRepositoryImpl** `[P:High]` `[Owner:@data]`
  - Red: Write unit tests in `src/data/repositories/server-discovery.repository.test.ts` testing `discoverLocalServers`, `pingEndpoint`, and `raceDualUrls`.
  - Green: Implement `ServerDiscoveryRepositoryImpl` in `src/data/repositories/server-discovery.repository.ts`.
  - Refactor: Extract shared endpoint parsing logic.

---

## Phase 3: Application Services & Dual-URL Connection Manager (@application)

Focus: Implement dual-URL latency racing, stream plan negotiation, Direct Play stream resolver, and React Query discovery hook.

- [x] **Task 3.1: [TDD-Red/Green] ServerConnectionService Implementation** `[P:High]` `[Owner:@application]`
  - Red: Write unit tests in `src/application/services/server-connection.service.test.ts` verifying LAN priority, WAN/Tailscale fallback on LAN timeout (>2000ms), and storage persistence.
  - Green: Implement `ServerConnectionService` in `src/application/services/server-connection.service.ts`.
  - Refactor: Structure reactive endpoint state.

- [x] **Task 3.2: [TDD-Red/Green] PlaybackEngineService Implementation** `[P:High]` `[Owner:@application]`
  - Red: Write unit tests in `src/application/services/playback-engine.service.test.ts` verifying Direct Play URL generation (`/Videos/{id}/stream.{container}?static=true`), Direct Stream (video copy), and HLS Transcode fallback on playback error.
  - Green: Implement `PlaybackEngineService` in `src/application/services/playback-engine.service.ts`.
  - Refactor: Integrate with `MediaCapabilitiesProfiler` and `DeviceProfileBuilder`.

- [x] **Task 3.3: Integration into MediaPlaybackService** `[P:Medium]` `[Owner:@application]`
  - Update `src/application/services/media-playback.service.ts` to delegate profile generation and stream resolution to `PlaybackEngineService`.
  - *Verification*: Existing and updated playback service tests pass.

- [x] **Task 3.4: useServerDiscovery React Hook** `[P:Medium]` `[Owner:@application]`
  - Implement `useServerDiscovery.ts` in `src/application/hooks/useServerDiscovery.ts` utilizing React Query with stale-time caching and background refresh.
  - *Verification*: Hook test verifying scan triggers and server list updates.

---

## Phase 4: Presentation Components & Gesture Engine Hook (@presentation)

Focus: Build touch gesture engine, HUD overlays, server chip selector, and integrate into Login & VideoPlayer.

- [x] **Task 4.1: [TDD-Red/Green] usePlayerGestures Custom Hook** `[P:High]` `[Owner:@presentation]`
  - Red: Write unit tests in `src/presentation/hooks/usePlayerGestures.test.ts` verifying left vertical swipe (brightness), right vertical swipe (volume), double-tap seek (-10s / +10s), and horizontal scrub (>15px delta).
  - Green: Implement `usePlayerGestures` in `src/presentation/hooks/usePlayerGestures.ts` with 60fps lightweight state updates.
  - Refactor: Guard event targets to ignore interactive control clicks.

- [x] **Task 4.2: GestureHUD Presentation Component** `[P:Medium]` `[Owner:@presentation]`
  - Create `GestureHUD.tsx` and `GestureHUD.module.css` in `src/presentation/components/VideoPlayer/` rendering high-contrast brightness, volume, and scrub HUD badges with smooth fade transitions.
  - *Verification*: Component test in `GestureHUD.test.tsx` verifying DOM render for each gesture state.

- [x] **Task 4.3: ServerPickerSheet & ServerChip Components** `[P:Medium]` `[Owner:@presentation]`
  - Create `ServerPickerSheet.tsx`, `ServerChip.tsx`, and `ServerPickerSheet.module.css` in `src/presentation/components/ServerPicker/`.
  - Support TV D-pad / keyboard spatial navigation and latency badge indicators.
  - *Verification*: Component test in `ServerPickerSheet.test.tsx` verifying chip selection and click dispatch.

- [x] **Task 4.4: Login View Integration** `[P:Medium]` `[Owner:@presentation]`
  - Update `src/presentation/components/Login/Login.tsx` (or `src/presentation/pages/Login/`) to render discovered server chips and trigger auto-discovery on mount.
  - *Verification*: User can pick an auto-discovered server chip or type a manual URL.

- [x] **Task 4.5: VideoPlayer Integration with Gesture Engine & Direct Play** `[P:High]` `[Owner:@presentation]`
  - Update `src/presentation/components/VideoPlayer/VideoPlayer.tsx` to attach `usePlayerGestures`, render `GestureHUD`, apply brightness CSS filter, and handle playback error transcode fallback.
  - *Verification*: VideoPlayer renders HUD during gestures and seamlessly plays Direct Play stream.

---

## Phase 5: End-to-End Verification & Integration Suite

Focus: Full regression testing, type checking, linting, and acceptance validation against user stories.

- [x] **Task 5.1: Integration Test Suite for Connection & Playback** `[P:High]` `[Owner:@all]`
  - Run all Vitest suites (`npm run test`) across domain, data, application, and presentation layers.
  - Ensure zero regressions in existing media browsing and favorite features.

- [x] **Task 5.2: TypeScript Check & Code Quality Verification** `[P:High]` `[Owner:@all]`
  - Run `npx tsc --noEmit` and verify 0 type errors.
  - Run linter/formatter to confirm Clean Architecture boundaries.
