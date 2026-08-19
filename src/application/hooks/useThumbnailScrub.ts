import { useState, useCallback, useMemo } from 'react';
import type {
  ITrickplayRepository,
  ScrubPreviewState,
  TrickplayManifest,
} from '@/domain/models/trickplay.model';
import { ThumbnailScrubService } from '@/application/services/thumbnail-scrub.service';

interface UseThumbnailScrubProps {
  manifest?: TrickplayManifest | null;
  duration: number;
  trickplayRepo?: ITrickplayRepository;
}

export const useThumbnailScrub = ({
  manifest,
  duration,
  trickplayRepo,
}: UseThumbnailScrubProps) => {
  const scrubService = useMemo(
    () => new ThumbnailScrubService(trickplayRepo),
    [trickplayRepo]
  );

  const [previewState, setPreviewState] = useState<ScrubPreviewState>({
    visible: false,
    timestamp: 0,
    formattedTime: '0:00',
    percent: 0,
    pixelX: 0,
  });

  const handleHover = useCallback(
    ({
      pixelX,
      containerWidth,
    }: {
      pixelX: number;
      containerWidth: number;
    }) => {
      if (containerWidth <= 0 || duration <= 0) return;

      const ratio = Math.max(0, Math.min(1, pixelX / containerWidth));
      const timestamp = ratio * duration;

      const state = scrubService.computeScrubPreviewState({
        manifest,
        timestamp,
        totalDuration: duration,
        pointerPixelX: pixelX,
        containerWidth,
      });

      setPreviewState(state);
    },
    [duration, manifest, scrubService]
  );

  const handleLeave = useCallback(() => {
    setPreviewState((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    previewState,
    handleHover,
    handleLeave,
  };
};
