import { describe, it, expect, beforeEach } from 'vitest';
import { ChapterMarkerService } from './chapter-marker.service';
import type { ChapterMarker } from '@/domain/models/chapter-marker.model';

describe('ChapterMarkerService', () => {
  let service: ChapterMarkerService;

  const mockMarkers: ChapterMarker[] = [
    {
      id: 'm1',
      name: 'Previously on Movixy',
      type: 'recap',
      startPositionSeconds: 0,
      endPositionSeconds: 30,
    },
    {
      id: 'm2',
      name: 'Opening Theme',
      type: 'intro',
      startPositionSeconds: 90,
      endPositionSeconds: 180,
    },
    {
      id: 'm3',
      name: 'Main Episode Part 1',
      type: 'chapter',
      startPositionSeconds: 180,
      endPositionSeconds: 600,
    },
    {
      id: 'm4',
      name: 'Ending & Credits',
      type: 'credits',
      startPositionSeconds: 1100,
      endPositionSeconds: 1200,
    },
  ];

  beforeEach(() => {
    service = new ChapterMarkerService();
  });

  describe('findActiveMarker', () => {
    it('detects active intro marker and returns Skip Intro state', () => {
      const state = service.findActiveMarker(mockMarkers, 100);
      expect(state.isVisible).toBe(true);
      expect(state.label).toBe('Skip Intro');
      expect(state.targetTimeSeconds).toBe(180);
      expect(state.marker?.id).toBe('m2');
    });

    it('detects active recap marker and returns Skip Recap state', () => {
      const state = service.findActiveMarker(mockMarkers, 15);
      expect(state.isVisible).toBe(true);
      expect(state.label).toBe('Skip Recap');
      expect(state.targetTimeSeconds).toBe(30);
      expect(state.marker?.id).toBe('m1');
    });

    it('detects active credits marker and returns Skip Credits state', () => {
      const state = service.findActiveMarker(mockMarkers, 1150);
      expect(state.isVisible).toBe(true);
      expect(state.label).toBe('Skip Credits');
      expect(state.targetTimeSeconds).toBe(1200);
      expect(state.marker?.id).toBe('m4');
    });

    it('does not display skip button for standard chapter types', () => {
      const state = service.findActiveMarker(mockMarkers, 300);
      expect(state.isVisible).toBe(false);
      expect(state.marker).toBeNull();
    });

    it('returns isVisible: false when outside any marker window', () => {
      const state = service.findActiveMarker(mockMarkers, 50);
      expect(state.isVisible).toBe(false);
      expect(state.marker).toBeNull();
    });
  });
});
