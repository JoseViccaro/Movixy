import { useState, useMemo, useEffect, useCallback } from 'react';
import type {
  ActiveSkipMarkerState,
  ChapterMarker,
} from '@/domain/models/chapter-marker.model';
import { ChapterMarkerService } from '@/application/services/chapter-marker.service';

interface UseChapterMarkersProps {
  markers: ChapterMarker[];
  currentTime: number;
}

export const useChapterMarkers = ({
  markers,
  currentTime,
}: UseChapterMarkersProps) => {
  const service = useMemo(() => new ChapterMarkerService(), []);
  const [dismissedMarkerIds, setDismissedMarkerIds] = useState<Set<string>>(
    () => new Set()
  );

  const rawActiveState = useMemo(() => {
    return service.findActiveMarker(markers, currentTime);
  }, [markers, currentTime, service]);

  const activeSkipState: ActiveSkipMarkerState = useMemo(() => {
    if (
      !rawActiveState.isVisible ||
      !rawActiveState.marker ||
      dismissedMarkerIds.has(rawActiveState.marker.id)
    ) {
      return {
        marker: null,
        isVisible: false,
        label: '',
        targetTimeSeconds: 0,
      };
    }
    return rawActiveState;
  }, [rawActiveState, dismissedMarkerIds]);

  const dismissMarker = useCallback(() => {
    if (rawActiveState.marker) {
      setDismissedMarkerIds((prev) => new Set(prev).add(rawActiveState.marker!.id));
    }
  }, [rawActiveState.marker]);

  // Reset dismissed markers when playback moves completely outside their range
  useEffect(() => {
    if (dismissedMarkerIds.size === 0) return;
    const currentActive = markers.find(
      (m) =>
        currentTime >= m.startPositionSeconds &&
        currentTime < m.endPositionSeconds &&
        m.type !== 'chapter'
    );

    setDismissedMarkerIds((prev) => {
      let changed = false;
      const updated = new Set(prev);
      prev.forEach((id) => {
        if (currentActive?.id !== id) {
          // If playback is not in this marker anymore, we can reset dismissal
          const m = markers.find((item) => item.id === id);
          if (m && (currentTime < m.startPositionSeconds || currentTime >= m.endPositionSeconds)) {
            updated.delete(id);
            changed = true;
          }
        }
      });
      return changed ? updated : prev;
    });
  }, [currentTime, markers, dismissedMarkerIds]);

  return {
    activeSkipState,
    dismissMarker,
  };
};
