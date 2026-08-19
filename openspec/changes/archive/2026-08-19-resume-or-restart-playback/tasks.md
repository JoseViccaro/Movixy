# Tasks: Resume or Restart Playback

This document defines the strict TDD task breakdown for prompting users to resume or restart playback when launching media in Movixy (`MediaModal` and direct navigation in `PlayerPage`).

---

## Review Workload Forecast

| Metric | Estimate |
|---|---|
| **Total Tasks** | 7 |
| **New Domain Model Files** | 1 (`src/domain/models/resume-playback.model.ts`) |
| **New Application Files** | 2 (`playback-resume.service.ts`, `useResumePlayback.ts`) |
| **New Presentation Files** | 2 (`ResumeChoiceDialog.tsx`, `ResumeChoiceDialog.module.css`) |
| **Modified Files** | 2 (`MediaModal.tsx`, `PlayerPage.tsx`) |
| **New Unit & Component Test Files** | 3 (`playback-resume.service.test.ts`, `useResumePlayback.test.ts`, `ResumeChoiceDialog.test.tsx`) |
| **Estimated Review Time** | ~30 - 45 minutes |

---

## Phase 1: Domain Entities (`@domain`)

Focus: Define pure TypeScript domain models, resume eligibility types, playback start configuration interfaces, and threshold calculation constants.

- [x] **Task 1.1: Playback Resume Domain Models & Types** `[P:High]` `[Owner:@domain]`
  - Define `ResumeEligibility`, `PlaybackStartPositionConfig`, and resume threshold constants (`MIN_RESUME_PERCENTAGE = 0.02`, `MAX_RESUME_PERCENTAGE = 0.95`, `MIN_RESUME_SECONDS = 10`, `TICKS_PER_SECOND = 10_000_000`) in `src/domain/models/resume-playback.model.ts`.
  - Define utility/contract types for resume evaluation input (`playbackPositionTicks?: number`, `runtimeTicks?: number`).
  - *Verification*: Pure type definitions; passes `npx tsc --noEmit`.

---

## Phase 2: Application Services & Hooks with Strict TDD (`@application`)

Focus: Implement core resume calculation logic and custom state hook using Strict TDD (Red -> Green -> Refactor).

- [x] **Task 2.1: [TDD-Red/Green] PlaybackResumeService Implementation** `[P:High]` `[Owner:@application]`
  - **Red**: Create `src/application/services/playback-resume.service.test.ts` testing:
    - Return `isResumable = false` for missing or 0 `playbackPositionTicks`.
    - Return `isResumable = false` for progress <= 2% or < 10 seconds.
    - Return `isResumable = true` with converted seconds and formatted timestamp (`mm:ss`, `h:mm:ss`) for progress between 2% and 95%.
    - Return `isResumable = false` for completed progress >= 95%.
    - Correct start position configuration generation (`getResumeConfig` vs `getRestartConfig`).
  - **Green**: Implement `PlaybackResumeService` in `src/application/services/playback-resume.service.ts` satisfying all test cases.
  - **Refactor**: Optimize timestamp formatting logic and threshold validation helpers.

- [x] **Task 2.2: [TDD-Red/Green] useResumePlayback Custom Hook** `[P:High]` `[Owner:@application]`
  - **Red**: Create `src/application/hooks/useResumePlayback.test.ts` testing:
    - Direct invocation of `onStartPlayback(media, 0)` when item is not resumable.
    - Dialog opening with computed eligibility when item is resumable.
    - `handleResume()` invoking `onStartPlayback(media, savedPositionSeconds)` and closing dialog.
    - `handleRestart()` invoking `onStartPlayback(media, 0)` and closing dialog.
    - `handleCancel()` dismissing dialog without triggering playback.
  - **Green**: Implement `useResumePlayback` in `src/application/hooks/useResumePlayback.ts`.
  - **Refactor**: Clean up state management and callback memoization with `useCallback`.

---

## Phase 3: Presentation Component & Integrations (`@presentation`)

Focus: Build accessible glassmorphic dialog with TV D-pad / keyboard navigation and wire into `MediaModal` and `PlayerPage`.

- [x] **Task 3.1: [TDD-Red/Green] ResumeChoiceDialog Component & Styles** `[P:High]` `[Owner:@presentation]`
  - **Red**: Create `src/presentation/components/ResumeChoiceDialog/ResumeChoiceDialog.test.tsx` testing:
    - Render dialog title, media title, formatted time badge ("Reanudar en 42:15"), and percentage progress bar.
    - Trigger `onResume` on primary button click or `Enter`/`Space` keydown.
    - Trigger `onRestart` on secondary button click.
    - Trigger `onCancel` on close icon click or `Esc` keydown.
    - D-pad spatial focus between buttons.
  - **Green**: Implement `ResumeChoiceDialog.tsx` and `ResumeChoiceDialog.module.css` in `src/presentation/components/ResumeChoiceDialog/`.
  - **Refactor**: Polish glassmorphic theme styling and responsive mobile layout.

- [x] **Task 3.2: MediaModal Integration** `[P:High]` `[Owner:@presentation]`
  - Wire `useResumePlayback` into `src/presentation/components/MediaModal/MediaModal.tsx`.
  - Mount `<ResumeChoiceDialog>` inside `MediaModal`.
  - Intercept the Play button click (`onPlay`) so that clicking "Reproducir" prompts the user if the item is in-progress, or directly launches if not.
  - *Verification*: Component test verifying dialog triggers and invokes playback correctly.

- [x] **Task 3.3: PlayerPage Integration** `[P:High]` `[Owner:@presentation]`
  - Wire `useResumePlayback` into `src/presentation/pages/Player/PlayerPage.tsx` for direct route navigation (`/watch/:mediaId`).
  - Intercept initial video play start if the resolved media item is in-progress and prompt the user before un-muting / playing.
  - *Verification*: Manual / component verification that entering player page with in-progress movie offers resume options.

---

## Phase 4: Verification Suite & Quality Assurance (`@all`)

Focus: Verify complete end-to-end integration, run TypeScript audit, and ensure 100% test pass rate with zero regression.

- [x] **Task 4.1: Automated Unit & Component Test Suite Execution** `[P:High]` `[Owner:@all]`
  - Run all Vitest suites:
    ```bash
    npm run test
    ```
  - Confirm 100% test passing across services, hooks, and presentation components.

- [x] **Task 4.2: TypeScript & Static Analysis Verification** `[P:High]` `[Owner:@all]`
  - Run TypeScript compiler check:
    ```bash
    npx tsc --noEmit
    ```
  - Verify 0 type errors and strict compliance with Clean Architecture boundaries. across domain, application, and presentation layers.
