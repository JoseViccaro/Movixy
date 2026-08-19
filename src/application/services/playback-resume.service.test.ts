import { describe, it, expect } from 'vitest';
import { PlaybackResumeService } from './playback-resume.service';
import { TICKS_PER_SECOND } from '@/domain/models/resume-playback.model';

describe('PlaybackResumeService', () => {
  const service = new PlaybackResumeService();

  describe('evaluateEligibility', () => {
    it('returns isResumable = false for missing or zero playbackPositionTicks', () => {
      const resultNull = service.evaluateEligibility({
        playbackPositionTicks: null,
        runtimeTicks: 120 * 60 * TICKS_PER_SECOND,
      });
      expect(resultNull.isResumable).toBe(false);
      expect(resultNull.savedPositionSeconds).toBe(0);

      const resultUndefined = service.evaluateEligibility({
        playbackPositionTicks: undefined,
        runtimeTicks: 120 * 60 * TICKS_PER_SECOND,
      });
      expect(resultUndefined.isResumable).toBe(false);

      const resultZero = service.evaluateEligibility({
        playbackPositionTicks: 0,
        runtimeTicks: 120 * 60 * TICKS_PER_SECOND,
      });
      expect(resultZero.isResumable).toBe(false);
    });

    it('returns isResumable = false for progress < 10 seconds', () => {
      // 9 seconds into a 120 minute movie
      const result = service.evaluateEligibility({
        playbackPositionTicks: 9 * TICKS_PER_SECOND,
        runtimeTicks: 120 * 60 * TICKS_PER_SECOND,
      });
      expect(result.isResumable).toBe(false);
      expect(result.savedPositionSeconds).toBe(9);
    });

    it('returns isResumable = false for progress <= 2% even if >= 10s', () => {
      // 100 seconds into a 10,000 second runtime (1% progress)
      const result = service.evaluateEligibility({
        playbackPositionTicks: 100 * TICKS_PER_SECOND,
        runtimeTicks: 10000 * TICKS_PER_SECOND,
      });
      expect(result.isResumable).toBe(false);
      expect(result.progressPercentage).toBeCloseTo(1, 1);
    });

    it('returns isResumable = false for completed progress >= 95%', () => {
      // 96% into runtime
      const result = service.evaluateEligibility({
        playbackPositionTicks: 960 * TICKS_PER_SECOND,
        runtimeTicks: 1000 * TICKS_PER_SECOND,
      });
      expect(result.isResumable).toBe(false);
      expect(result.progressPercentage).toBeCloseTo(96, 1);
    });

    it('returns isResumable = true for progress between 2% and 95% and >= 10 seconds', () => {
      // 45 minutes into a 100 minute movie (45%)
      const positionSeconds = 45 * 60 + 20; // 45m 20s = 2720s
      const runtimeSeconds = 100 * 60; // 6000s
      const result = service.evaluateEligibility({
        playbackPositionTicks: positionSeconds * TICKS_PER_SECOND,
        runtimeTicks: runtimeSeconds * TICKS_PER_SECOND,
      });

      expect(result.isResumable).toBe(true);
      expect(result.savedPositionSeconds).toBe(positionSeconds);
      expect(result.runtimeSeconds).toBe(runtimeSeconds);
      expect(result.progressPercentage).toBeCloseTo(45.33, 1);
      expect(result.formattedPosition).toBe('45:20');
      expect(result.formattedRuntime).toBe('1:40:00');
    });

    it('handles formatted timestamp correctly for short and long durations (mm:ss and h:mm:ss)', () => {
      // 1 hour, 5 minutes, 3 seconds
      const resultHours = service.evaluateEligibility({
        playbackPositionTicks: (1 * 3600 + 5 * 60 + 3) * TICKS_PER_SECOND,
        runtimeTicks: (2 * 3600) * TICKS_PER_SECOND,
      });
      expect(resultHours.formattedPosition).toBe('1:05:03');
      expect(resultHours.formattedRuntime).toBe('2:00:00');

      // 8 minutes, 5 seconds
      const resultMins = service.evaluateEligibility({
        playbackPositionTicks: (8 * 60 + 5) * TICKS_PER_SECOND,
        runtimeTicks: (25 * 60) * TICKS_PER_SECOND,
      });
      expect(resultMins.formattedPosition).toBe('08:05');
      expect(resultMins.formattedRuntime).toBe('25:00');
    });

    it('handles unknown/missing runtimeTicks gracefully when position is >= 10s', () => {
      const result = service.evaluateEligibility({
        playbackPositionTicks: 120 * TICKS_PER_SECOND,
        runtimeTicks: undefined,
      });
      expect(result.isResumable).toBe(true);
      expect(result.savedPositionSeconds).toBe(120);
      expect(result.formattedPosition).toBe('02:00');
      expect(result.progressPercentage).toBe(0);
    });
  });

  describe('configuration helpers', () => {
    it('returns resume config with saved position and isResumed = true', () => {
      const config = service.getResumeConfig(1540);
      expect(config).toEqual({
        startPositionSeconds: 1540,
        isResumed: true,
      });
    });

    it('returns restart config with 0 position and isResumed = false', () => {
      const config = service.getRestartConfig();
      expect(config).toEqual({
        startPositionSeconds: 0,
        isResumed: false,
      });
    });
  });
});
