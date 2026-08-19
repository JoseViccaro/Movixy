# Proposal: Resume or Restart Playback

## Intent

Provide users with an intuitive choice to either resume playback from their last saved position or start from the beginning when selecting partially watched media in `MediaModal` and upon direct navigation in `PlayerPage`.

## Scope

### In Scope
- **Domain Resume Policy**: Define playback progress thresholds (between 2% and 95% or valid `playbackPositionTicks > 0`) and resume decision contracts.
- **Application Services & Hooks**: Implement `PlaybackResumeService` and `useResumePlayback` orchestrating start position calculations (`startPosition = resumeSeconds` vs `startPosition = 0`) and progress resets.
- **Presentation Integration**:
  - `ResumeChoiceDialog.tsx`: Dialog prompting "Reanudar en mm:ss" vs "Empezar desde el principio".
  - `MediaModal.tsx`: Dual action buttons or modal prompt when launching playback.
  - `PlayerPage.tsx`: Resume prompt handling on direct URL navigation.

### Out of Scope
- Modifying Jellyfin server-side playback reporting protocol.
- Offline playback position caching.

## Approach & Clean Architecture

1. **`@domain` (`src/domain/playback/`)**:
   - Define `PlaybackResumePolicy` (thresholds: 2%–95%, tick-to-second conversion) and `PlaybackResumeOptions` interface.
2. **`@application` (`src/application/playback/` / `src/presentation/hooks/`)**:
   - `PlaybackResumeService`: Determine if media is resumable and calculate target timestamps.
   - `useResumePlayback`: Hook managing resume prompt state and triggering playback with selected start position.
3. **`@presentation` (`src/presentation/components/` & `src/presentation/pages/`)**:
   - `ResumeChoiceDialog`: Accessible modal offering resume/restart choices.
   - Integrate choice handling into `MediaModal` (details view) and `PlayerPage` (route query / direct link).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/playback/` | New / Modified | Resume calculation policy and types |
| `src/application/playback/` | New | `PlaybackResumeService` for resume decisions |
| `src/presentation/hooks/useResumePlayback.ts` | New | Hook managing resume state & actions |
| `src/presentation/components/ResumeChoiceDialog/` | New | Choice dialog component |
| `src/presentation/components/MediaModal/` | Modified | Integrate resume vs restart actions |
| `src/presentation/pages/PlayerPage.tsx` | Modified | Handle resume prompt on direct URL load |

## Risks & Mitigation

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Inaccurate position ticks from API | Low | Validate ticks > 0 and cap within bounds (2%–95%). |
| Route transition glitch on auto-prompt | Low | Manage dialog state before mounting VideoPlayer. |

## Success Criteria

- [ ] Partially watched media (2%–95%) prompts user with formatted timestamp (mm:ss).
- [ ] Users can resume at saved time or restart from 0:00.
- [ ] Supported in both `MediaModal` and direct `PlayerPage` access.
- [ ] Clean Architecture separation across domain, application, and presentation layers.
