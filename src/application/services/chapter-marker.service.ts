import type {
  ActiveSkipMarkerState,
  ChapterMarker,
} from '@/domain/models/chapter-marker.model';

export class ChapterMarkerService {
  findActiveMarker(
    markers: ChapterMarker[],
    currentTimeSeconds: number
  ): ActiveSkipMarkerState {
    if (!markers || markers.length === 0) {
      return {
        marker: null,
        isVisible: false,
        label: '',
        targetTimeSeconds: 0,
      };
    }

    const active = markers.find(
      (m) =>
        currentTimeSeconds >= m.startPositionSeconds &&
        currentTimeSeconds < m.endPositionSeconds &&
        m.type !== 'chapter'
    );

    if (!active) {
      return {
        marker: null,
        isVisible: false,
        label: '',
        targetTimeSeconds: 0,
      };
    }

    let label = 'Skip';
    switch (active.type) {
      case 'intro':
        label = 'Skip Intro';
        break;
      case 'credits':
        label = 'Skip Credits';
        break;
      case 'recap':
        label = 'Skip Recap';
        break;
    }

    return {
      marker: active,
      isVisible: true,
      label,
      targetTimeSeconds: active.endPositionSeconds,
    };
  }
}
