import { useState, useCallback, useMemo } from 'react';
import type { Media } from '@/domain/models/media.model';
import type { ResumeEligibility } from '@/domain/models/resume-playback.model';
import { PlaybackResumeService } from '@/application/services/playback-resume.service';

interface UseResumePlaybackOptions {
  onStartPlayback: (media: Media, startPositionSeconds: number) => void;
  service?: PlaybackResumeService;
}

export interface UseResumePlaybackResult {
  isDialogOpen: boolean;
  pendingMedia: Media | null;
  eligibility: ResumeEligibility | null;
  requestPlay: (media: Media) => void;
  handleResume: () => void;
  handleRestart: () => void;
  handleCancel: () => void;
}

export function useResumePlayback({
  onStartPlayback,
  service: customService,
}: UseResumePlaybackOptions): UseResumePlaybackResult {
  const service = useMemo(() => customService || new PlaybackResumeService(), [customService]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<Media | null>(null);
  const [eligibility, setEligibility] = useState<ResumeEligibility | null>(null);

  const requestPlay = useCallback(
    (media: Media) => {
      const evaluation = service.evaluateEligibility({
        playbackPositionTicks: media.playbackPositionTicks,
        runtimeTicks: media.runtimeTicks,
      });

      if (evaluation.isResumable) {
        setPendingMedia(media);
        setEligibility(evaluation);
        setIsDialogOpen(true);
      } else {
        setIsDialogOpen(false);
        setPendingMedia(null);
        setEligibility(null);
        onStartPlayback(media, 0);
      }
    },
    [service, onStartPlayback]
  );

  const handleResume = useCallback(() => {
    if (!pendingMedia || !eligibility) return;
    const startPos = eligibility.savedPositionSeconds;
    const currentMedia = pendingMedia;
    setIsDialogOpen(false);
    setPendingMedia(null);
    setEligibility(null);
    onStartPlayback(currentMedia, startPos);
  }, [pendingMedia, eligibility, onStartPlayback]);

  const handleRestart = useCallback(() => {
    if (!pendingMedia) return;
    const currentMedia = pendingMedia;
    setIsDialogOpen(false);
    setPendingMedia(null);
    setEligibility(null);
    onStartPlayback(currentMedia, 0);
  }, [pendingMedia, onStartPlayback]);

  const handleCancel = useCallback(() => {
    setIsDialogOpen(false);
    setPendingMedia(null);
    setEligibility(null);
  }, []);

  return {
    isDialogOpen,
    pendingMedia,
    eligibility,
    requestPlay,
    handleResume,
    handleRestart,
    handleCancel,
  };
}
