import type {
  ITrickplayRepository,
  ScrubPreviewState,
  TrickplayManifest,
} from '@/domain/models/trickplay.model';

export interface ComputeScrubParams {
  manifest?: TrickplayManifest | null;
  timestamp: number;
  totalDuration: number;
  pointerPixelX: number;
  containerWidth: number;
  cardWidth?: number;
}

export class ThumbnailScrubService {
  private trickplayRepo?: ITrickplayRepository;

  constructor(trickplayRepo?: ITrickplayRepository) {
    this.trickplayRepo = trickplayRepo;
  }

  formatTimecode(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  computeScrubPreviewState(params: ComputeScrubParams): ScrubPreviewState {
    const {
      manifest,
      timestamp,
      totalDuration,
      pointerPixelX,
      containerWidth,
      cardWidth = 160,
    } = params;

    const clampedTime = Math.max(0, Math.min(totalDuration, timestamp));
    const percent = totalDuration > 0 ? (clampedTime / totalDuration) * 100 : 0;
    const formattedTime = this.formatTimecode(clampedTime);

    // Compute horizontal clamping (min 12px margin from edge)
    const margin = 12;
    const halfCard = cardWidth / 2;
    const minX = margin + halfCard;
    const maxX = containerWidth - margin - halfCard;

    let clampedPixelX = pointerPixelX;
    if (containerWidth > cardWidth + margin * 2) {
      clampedPixelX = Math.max(minX, Math.min(maxX, pointerPixelX));
    }

    const tile =
      manifest && this.trickplayRepo
        ? this.trickplayRepo.getFrameForTime(manifest, clampedTime) ?? undefined
        : undefined;

    return {
      visible: true,
      timestamp: clampedTime,
      formattedTime,
      percent,
      pixelX: clampedPixelX,
      tile,
    };
  }
}
