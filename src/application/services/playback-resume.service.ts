import {
  MIN_RESUME_PERCENTAGE,
  MAX_RESUME_PERCENTAGE,
  MIN_RESUME_SECONDS,
  TICKS_PER_SECOND,
} from '@/domain/models/resume-playback.model';
import type {
  ResumeEligibility,
  ResumeEligibilityInput,
  PlaybackStartPositionConfig,
} from '@/domain/models/resume-playback.model';

export class PlaybackResumeService {
  /**
   * Evaluates whether a media item is eligible for playback resumption.
   */
  public evaluateEligibility(input: ResumeEligibilityInput): ResumeEligibility {
    const ticks = input.playbackPositionTicks;
    const runtimeTicks = input.runtimeTicks;

    if (ticks == null || ticks <= 0) {
      return {
        isResumable: false,
        savedPositionSeconds: 0,
        runtimeSeconds: runtimeTicks ? Math.floor(runtimeTicks / TICKS_PER_SECOND) : 0,
        progressPercentage: 0,
        formattedPosition: '00:00',
        formattedRuntime: runtimeTicks ? this.formatTime(Math.floor(runtimeTicks / TICKS_PER_SECOND)) : '00:00',
      };
    }

    const savedPositionSeconds = Math.floor(ticks / TICKS_PER_SECOND);
    const runtimeSeconds = runtimeTicks && runtimeTicks > 0 ? Math.floor(runtimeTicks / TICKS_PER_SECOND) : 0;

    const progressPercentage = runtimeSeconds > 0
      ? (savedPositionSeconds / runtimeSeconds) * 100
      : 0;

    let isResumable = false;

    if (savedPositionSeconds >= MIN_RESUME_SECONDS) {
      if (runtimeSeconds > 0) {
        const ratio = savedPositionSeconds / runtimeSeconds;
        isResumable = ratio > MIN_RESUME_PERCENTAGE && ratio < MAX_RESUME_PERCENTAGE;
      } else {
        isResumable = true;
      }
    }

    return {
      isResumable,
      savedPositionSeconds,
      runtimeSeconds,
      progressPercentage,
      formattedPosition: this.formatTime(savedPositionSeconds),
      formattedRuntime: this.formatTime(runtimeSeconds),
    };
  }

  /**
   * Generates resume start configuration.
   */
  public getResumeConfig(savedPositionSeconds: number): PlaybackStartPositionConfig {
    return {
      startPositionSeconds: savedPositionSeconds,
      isResumed: true,
    };
  }

  /**
   * Generates restart start configuration.
   */
  public getRestartConfig(): PlaybackStartPositionConfig {
    return {
      startPositionSeconds: 0,
      isResumed: false,
    };
  }

  /**
   * Formats duration in seconds to mm:ss or h:mm:ss string.
   */
  public formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return '00:00';
    }

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const pad = (n: number) => String(n).padStart(2, '0');

    if (h > 0) {
      return `${h}:${pad(m)}:${pad(s)}`;
    }

    return `${pad(m)}:${pad(s)}`;
  }
}
