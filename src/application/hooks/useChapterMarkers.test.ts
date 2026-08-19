import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChapterMarkers } from './useChapterMarkers';
import type { ChapterMarker } from '@/domain/models/chapter-marker.model';

describe('useChapterMarkers', () => {
  const mockMarkers: ChapterMarker[] = [
    {
      id: 'intro-1',
      name: 'Opening',
      type: 'intro',
      startPositionSeconds: 10,
      endPositionSeconds: 30,
    },
    {
      id: 'credits-1',
      name: 'Ending',
      type: 'credits',
      startPositionSeconds: 90,
      endPositionSeconds: 100,
    },
  ];

  it('identifies active marker accurately when playback reaches timestamp', () => {
    const { result, rerender } = renderHook(
      ({ currentTime }) =>
        useChapterMarkers({
          markers: mockMarkers,
          currentTime,
        }),
      {
        initialProps: { currentTime: 0 },
      }
    );

    expect(result.current.activeSkipState.isVisible).toBe(false);

    rerender({ currentTime: 15 });
    expect(result.current.activeSkipState.isVisible).toBe(true);
    expect(result.current.activeSkipState.label).toBe('Skip Intro');
    expect(result.current.activeSkipState.targetTimeSeconds).toBe(30);

    rerender({ currentTime: 35 });
    expect(result.current.activeSkipState.isVisible).toBe(false);
  });

  it('triggers onDismissed when user manually dismisses', () => {
    const { result } = renderHook(() =>
      useChapterMarkers({
        markers: mockMarkers,
        currentTime: 15,
      })
    );

    expect(result.current.activeSkipState.isVisible).toBe(true);

    act(() => {
      result.current.dismissMarker();
    });
    expect(result.current.activeSkipState.isVisible).toBe(false);
  });
});
