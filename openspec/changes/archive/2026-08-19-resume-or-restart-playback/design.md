# Technical Design: Resume or Restart Playback

## 1. Overview & Architecture Goals

This technical design defines the architecture for intelligent resume and restart playback handling across Movixy.

The primary goals are:
1. **Accurate Resume Evaluation**: Evaluate playback position ticks and total runtime to identify resumable media (between 2% and 95% completion or > 10 seconds).
2. **Accessible & Responsive UX**: Provide `ResumeChoiceDialog` with dual actions ("Reanudar en mm:ss" vs "Empezar desde el principio") supporting TV Remote D-Pad spatial navigation, focus sound effects, and keyboard shortcuts (`Enter`, `Esc`, `Space`).
3. **Clean Architecture Adherence**: Decouple domain policies (`PlaybackResumePolicy`), application services (`PlaybackResumeService`, `useResumePlayback`), and presentation components (`ResumeChoiceDialog`, `MediaModal`, `PlayerPage`).
4. **Strict TDD Coverage**: Unit and component tests across domain, application services, custom hooks, and presentation UI.

---

## 2. Clean Architecture Layer Breakdown

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           @presentation Layer                           │
│  - ResumeChoiceDialog.tsx, ResumeChoiceDialog.module.css               │
│  - MediaModal.tsx (Resume prompt interception on play)                  │
│  - PlayerPage.tsx (Direct navigation resume check & startPosition)     │
├─────────────────────────────────────────────────────────────────────────┤
│                           @application Layer                            │
│  - PlaybackResumeService.ts (Resume calculation & decision logic)       │
│  - useResumePlayback.ts (Hook managing dialog state & playback intent)  │
├─────────────────────────────────────────────────────────────────────────┤
│                              @domain Layer                              │
│  - Models: ResumeEligibility, PlaybackStartPositionConfig               │
│  - Policies: PlaybackResumePolicy (2%-95% threshold rules)             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Interface Contracts & Domain Definitions

### 3.1 `@domain/models/playback-resume.model.ts`
```typescript
export interface ResumeEligibility {
  isResumable: boolean;
  savedPositionSeconds: number;
  formattedTime: string;
  percentage: number;
}

export interface PlaybackStartPositionConfig {
  startPositionSeconds: number;
  isResumed: boolean;
}

export interface IPlaybackResumePolicy {
  evaluateEligibility(playbackPositionTicks?: number, runtimeTicks?: number): ResumeEligibility;
  formatTimestamp(seconds: number): string;
}
```

### 3.2 `@domain/policies/PlaybackResumePolicy.ts`
- **Constants**:
  - `TICKS_PER_SECOND = 10_000_000`
  - `MIN_RESUME_PERCENTAGE = 0.02` (2%)
  - `MAX_RESUME_PERCENTAGE = 0.95` (95%)
  - `MIN_RESUME_SECONDS = 10`
- **Logic**:
  - If `!playbackPositionTicks || playbackPositionTicks <= 0`, return `{ isResumable: false, savedPositionSeconds: 0, formattedTime: '0:00', percentage: 0 }`.
  - Convert ticks to seconds: `savedSeconds = Math.floor(playbackPositionTicks / TICKS_PER_SECOND)`.
  - Calculate percentage if `runtimeTicks > 0`: `pct = playbackPositionTicks / runtimeTicks`.
  - If `runtimeTicks` is known:
    - Resumable when `pct >= MIN_RESUME_PERCENTAGE` AND `pct <= MAX_RESUME_PERCENTAGE` AND `savedSeconds >= MIN_RESUME_SECONDS`.
  - If `runtimeTicks` is not available:
    - Resumable if `savedSeconds >= MIN_RESUME_SECONDS`.
  - Return formatted timestamp string (`mm:ss` or `h:mm:ss`).

---

## 4. Application Layer Design

### 4.1 `@application/services/PlaybackResumeService.ts`
```typescript
import { PlaybackResumePolicy } from '@/domain/policies/PlaybackResumePolicy';
import type { ResumeEligibility, PlaybackStartPositionConfig } from '@/domain/models/playback-resume.model';
import type { Media } from '@/domain/models/media.model';

export class PlaybackResumeService {
  constructor(private readonly policy: PlaybackResumePolicy = new PlaybackResumePolicy()) {}

  checkEligibility(media: Media): ResumeEligibility {
    return this.policy.evaluateEligibility(media.playbackPositionTicks, media.runtimeTicks);
  }

  getResumeConfig(eligibility: ResumeEligibility): PlaybackStartPositionConfig {
    return {
      startPositionSeconds: eligibility.isResumable ? eligibility.savedPositionSeconds : 0,
      isResumed: eligibility.isResumable,
    };
  }

  getRestartConfig(): PlaybackStartPositionConfig {
    return {
      startPositionSeconds: 0,
      isResumed: false,
    };
  }
}
```

### 4.2 `@application/hooks/useResumePlayback.ts`
```typescript
export interface UseResumePlaybackOptions {
  onStartPlayback: (media: Media, startPositionSeconds: number) => void;
}

export function useResumePlayback({ onStartPlayback }: UseResumePlaybackOptions) {
  // State for pending media and eligibility info
  const [pendingMedia, setPendingMedia] = useState<Media | null>(null);
  const [eligibility, setEligibility] = useState<ResumeEligibility | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const requestPlayback = (media: Media) => { ... };
  const handleResume = () => { ... };
  const handleRestart = () => { ... };
  const handleCancel = () => { ... };

  return {
    isDialogOpen,
    pendingMedia,
    eligibility,
    requestPlayback,
    handleResume,
    handleRestart,
    handleCancel,
  };
}
```

---

## 5. Presentation Layer Components

### 5.1 `@presentation/components/ResumeChoiceDialog/ResumeChoiceDialog.tsx`
- **Props**:
  - `isOpen: boolean`
  - `mediaTitle: string`
  - `savedPositionFormatted: string`
  - `percentage?: number`
  - `onResume: () => void`
  - `onRestart: () => void`
  - `onClose: () => void`
- **Features**:
  - Glassmorphic modal overlay with accessible dialog semantics (`role="dialog"`, `aria-modal="true"`).
  - Highlights saved timestamp and progress bar preview.
  - Buttons:
    1. Primary button: `"Reanudar en {savedPositionFormatted}"` (with `data-focusable="true"`, auto-focused by default).
    2. Secondary button: `"Empezar desde el principio"` (with `data-focusable="true"`).
    3. Close button (`X` icon).
  - Uses `useDpadNavigation` for TV remote support.
  - Key listeners for `Escape` and `Enter`.

### 5.2 `@presentation/components/MediaModal/MediaModal.tsx` Integration
- Uses `useResumePlayback` when user clicks primary "Reproducir" button or clicks an episode row.
- If item is resumable, opens `ResumeChoiceDialog`.
- Once choice is made, calls `onPlay(media, startPositionSeconds)` or navigates with state/query param.

### 5.3 `@presentation/pages/Player/PlayerPage.tsx` Integration
- On direct URL navigation (`/player/:mediaId`), loads media details.
- Checks resume eligibility before starting video stream playback.
- If eligible, prompts user with `ResumeChoiceDialog` before unpausing/seeking video.
- Supports `?startPosition=0` query parameter override to bypass prompt if already chosen in `MediaModal`.

---

## 6. File Changes & Project Structure

| File Path | Layer | Action | Description |
|-----------|-------|--------|-------------|
| `src/domain/models/playback-resume.model.ts` | `@domain` | Create | Domain models for resume eligibility and start configuration |
| `src/domain/policies/PlaybackResumePolicy.ts` | `@domain` | Create | Domain logic enforcing 2%-95% thresholds and time formatting |
| `src/domain/policies/PlaybackResumePolicy.test.ts` | `@domain` | Create | Unit tests for threshold and edge cases (0 ticks, 1%, 50%, 96%, 100%) |
| `src/application/services/PlaybackResumeService.ts` | `@application` | Create | Application service determining resume state |
| `src/application/services/PlaybackResumeService.test.ts` | `@application` | Create | Unit tests for PlaybackResumeService |
| `src/application/hooks/useResumePlayback.ts` | `@application` | Create | Custom hook for orchestrating resume dialog and playback choices |
| `src/application/hooks/useResumePlayback.test.ts` | `@application` | Create | Tests for resume hook state transitions |
| `src/presentation/components/ResumeChoiceDialog/ResumeChoiceDialog.tsx` | `@presentation` | Create | Modal dialog offering resume vs restart choices with D-pad |
| `src/presentation/components/ResumeChoiceDialog/ResumeChoiceDialog.module.css` | `@presentation` | Create | Styling for modal, glassmorphism, buttons, progress bar, focus styles |
| `src/presentation/components/ResumeChoiceDialog/ResumeChoiceDialog.test.tsx` | `@presentation` | Create | RTL component tests for dialog rendering, clicks, and keyboard events |
| `src/presentation/components/MediaModal/MediaModal.tsx` | `@presentation` | Modify | Intercept playback triggers with resume modal |
| `src/presentation/pages/Player/PlayerPage.tsx` | `@presentation` | Modify | Handle startPositionSeconds and resume prompt on direct loads |

---

## 7. Strict TDD Testing Strategy (Vitest + React Testing Library)

### 7.1 Domain Policy Tests (`PlaybackResumePolicy.test.ts`)
- `should return isResumable = false when playbackPositionTicks is 0 or undefined`
- `should return isResumable = false when progress is <= 2% (e.g. 10s of 2h movie)`
- `should return isResumable = true when progress is between 2% and 95% (e.g. 30m of 2h movie)`
- `should return isResumable = false when progress is >= 95% (credits stage)`
- `should correctly format timestamps into mm:ss and hh:mm:ss formats`

### 7.2 Application Service & Hook Tests
- `PlaybackResumeService.test.ts`:
  - `checkEligibility` delegates properly to domain policy.
  - `getResumeConfig` returns saved position seconds.
  - `getRestartConfig` returns startPosition 0.
- `useResumePlayback.test.ts`:
  - `requestPlayback` opens dialog if media is resumable.
  - `requestPlayback` directly invokes `onStartPlayback` with 0 if not resumable.
  - `handleResume` calls `onStartPlayback` with saved timestamp and closes dialog.
  - `handleRestart` calls `onStartPlayback` with 0 and closes dialog.

### 7.3 Presentation Component Tests (`ResumeChoiceDialog.test.tsx`)
- Renders media title and formatted resume time.
- Clicking "Reanudar" executes `onResume`.
- Clicking "Empezar desde el principio" executes `onRestart`.
- Pressing `Escape` triggers `onClose`.
- Focuses initial "Reanudar" button by default with `data-focusable="true"`.
