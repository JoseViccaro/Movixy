export const MIN_RESUME_PERCENTAGE = 0.02;
export const MAX_RESUME_PERCENTAGE = 0.95;
export const MIN_RESUME_SECONDS = 10;
export const TICKS_PER_SECOND = 10_000_000;

export interface ResumeEligibilityInput {
  playbackPositionTicks?: number | null;
  runtimeTicks?: number | null;
}

export interface ResumeEligibility {
  isResumable: boolean;
  savedPositionSeconds: number;
  runtimeSeconds: number;
  progressPercentage: number;
  formattedPosition: string;
  formattedRuntime: string;
}

export interface PlaybackStartPositionConfig {
  startPositionSeconds: number;
  isResumed: boolean;
}
