import { describe, it, expect, beforeEach } from 'vitest';
import { ThumbnailScrubService } from './thumbnail-scrub.service';
import type { TrickplayManifest } from '@/domain/models/trickplay.model';

describe('ThumbnailScrubService', () => {
  let service: ThumbnailScrubService;

  const mockManifest: TrickplayManifest = {
    itemId: 'test-item',
    intervalSeconds: 10,
    tileWidth: 160,
    tileHeight: 90,
    tilesPerSheet: 100,
    columns: 10,
    rows: 10,
    sheets: ['https://example.com/sheet0.jpg'],
    totalDurationSeconds: 3600,
  };

  const mockRepo = {
    getTrickplayManifest: async () => mockManifest,
    getFrameForTime: (_m: any, _t: number) => ({
      url: 'https://example.com/sheet0.jpg',
      x: 0,
      y: 0,
      width: 160,
      height: 90,
      sheetWidth: 1600,
      sheetHeight: 900,
    }),
  };

  beforeEach(() => {
    service = new ThumbnailScrubService(mockRepo as any);
  });

  describe('formatTimecode', () => {
    it('formats time < 1 hour as m:ss', () => {
      expect(service.formatTimecode(65)).toBe('1:05');
      expect(service.formatTimecode(0)).toBe('0:00');
      expect(service.formatTimecode(599)).toBe('9:59');
    });

    it('formats time >= 1 hour as h:mm:ss', () => {
      expect(service.formatTimecode(3665)).toBe('1:01:05');
      expect(service.formatTimecode(7200)).toBe('2:00:00');
    });
  });

  describe('computeScrubPreviewState', () => {
    it('assembles complete ScrubPreviewState with tile and clamped bounds', () => {
      const state = service.computeScrubPreviewState({
        manifest: mockManifest,
        timestamp: 125,
        totalDuration: 3600,
        pointerPixelX: 500,
        containerWidth: 1000,
        cardWidth: 160,
      });

      expect(state.visible).toBe(true);
      expect(state.timestamp).toBe(125);
      expect(state.formattedTime).toBe('2:05');
      expect(state.percent).toBeCloseTo((125 / 3600) * 100);
      expect(state.tile).toBeDefined();
      expect(state.pixelX).toBe(500);
    });

    it('clamps pixel position near the left container edge with >= 12px margin', () => {
      const state = service.computeScrubPreviewState({
        manifest: mockManifest,
        timestamp: 10,
        totalDuration: 3600,
        pointerPixelX: 20, // Too close to left: half card is 80, 20 - 80 < 12
        containerWidth: 1000,
        cardWidth: 160,
      });

      // Left edge of card should be >= 12px, so card center pixelX >= 12 + 80 = 92px
      expect(state.pixelX).toBeGreaterThanOrEqual(92);
    });

    it('clamps pixel position near the right container edge with >= 12px margin', () => {
      const state = service.computeScrubPreviewState({
        manifest: mockManifest,
        timestamp: 3590,
        totalDuration: 3600,
        pointerPixelX: 980, // Too close to right: 980 + 80 > 1000 - 12
        containerWidth: 1000,
        cardWidth: 160,
      });

      // Right edge of card should be <= 1000 - 12 = 988, so card center pixelX <= 988 - 80 = 908px
      expect(state.pixelX).toBeLessThanOrEqual(908);
    });
  });
});
