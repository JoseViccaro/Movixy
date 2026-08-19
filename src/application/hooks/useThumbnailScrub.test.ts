import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThumbnailScrub } from './useThumbnailScrub';
import type { TrickplayManifest } from '@/domain/models/trickplay.model';

describe('useThumbnailScrub', () => {
  const mockManifest: TrickplayManifest = {
    itemId: 'item-1',
    intervalSeconds: 10,
    tileWidth: 160,
    tileHeight: 90,
    tilesPerSheet: 10,
    columns: 10,
    rows: 1,
    sheets: ['https://example.com/sheet0.jpg'],
    totalDurationSeconds: 100,
  };

  it('initializes with preview not visible', () => {
    const { result } = renderHook(() =>
      useThumbnailScrub({
        manifest: mockManifest,
        duration: 100,
      })
    );

    expect(result.current.previewState.visible).toBe(false);
  });

  it('updates preview state on handleHover with proper calculations', () => {
    const { result } = renderHook(() =>
      useThumbnailScrub({
        manifest: mockManifest,
        duration: 100,
      })
    );

    act(() => {
      result.current.handleHover({
        pixelX: 200,
        containerWidth: 800,
      });
    });

    expect(result.current.previewState.visible).toBe(true);
    expect(result.current.previewState.timestamp).toBe(25);
    expect(result.current.previewState.formattedTime).toBe('0:25');
  });

  it('hides preview on handleLeave', () => {
    const { result } = renderHook(() =>
      useThumbnailScrub({
        manifest: mockManifest,
        duration: 100,
      })
    );

    act(() => {
      result.current.handleHover({
        pixelX: 200,
        containerWidth: 800,
      });
    });
    expect(result.current.previewState.visible).toBe(true);

    act(() => {
      result.current.handleLeave();
    });
    expect(result.current.previewState.visible).toBe(false);
  });
});
