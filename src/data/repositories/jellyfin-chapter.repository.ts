import type {
  ChapterMarker,
  IChapterRepository,
  MarkerType,
} from '@/domain/models/chapter-marker.model';
import type { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';

interface JellyfinChapterDto {
  Name?: string;
  StartPositionTicks?: number;
  MarkerType?: string;
}

export class JellyfinChapterRepositoryImpl implements IChapterRepository {
  private apiClient: JellyfinApiClient;
  private userId: string;

  constructor(apiClient: JellyfinApiClient, userId: string) {
    this.apiClient = apiClient;
    this.userId = userId;
  }

  async getChapterMarkers(itemId: string): Promise<ChapterMarker[]> {
    try {
      const item: any = await this.apiClient.getItemById(this.userId, itemId);
      if (!item) return [];

      const totalDurationSeconds = item.RunTimeTicks
        ? Math.round(item.RunTimeTicks / 10000000)
        : 0;

      const chapters: JellyfinChapterDto[] = item.Chapters || [];
      if (chapters.length === 0) {
        return [];
      }

      const sorted = [...chapters].sort(
        (a, b) => (a.StartPositionTicks || 0) - (b.StartPositionTicks || 0)
      );

      const markers: ChapterMarker[] = [];

      for (let i = 0; i < sorted.length; i++) {
        const ch = sorted[i];
        const startSec = Math.round((ch.StartPositionTicks || 0) / 10000000);
        
        let endSec = totalDurationSeconds > startSec ? totalDurationSeconds : startSec + 30;
        if (i < sorted.length - 1) {
          const nextStartSec = Math.round((sorted[i + 1].StartPositionTicks || 0) / 10000000);
          endSec = nextStartSec;
        }

        const markerType = this.resolveMarkerType(ch);

        markers.push({
          id: `${itemId}-ch-${i}`,
          name: ch.Name || `Chapter ${i + 1}`,
          type: markerType,
          startPositionSeconds: startSec,
          endPositionSeconds: endSec,
        });
      }

      return markers;
    } catch {
      return [];
    }
  }

  private resolveMarkerType(ch: JellyfinChapterDto): MarkerType {
    if (ch.MarkerType) {
      const mt = ch.MarkerType.toLowerCase();
      if (mt.includes('intro')) return 'intro';
      if (mt.includes('credit') || mt.includes('outro')) return 'credits';
      if (mt.includes('recap')) return 'recap';
    }

    const name = (ch.Name || '').toLowerCase();
    if (/\b(intro|opening|op)\b/i.test(name)) {
      return 'intro';
    }
    if (/\b(credit|credits|ending|outro|ed)\b/i.test(name)) {
      return 'credits';
    }
    if (/\b(recap|previously)\b/i.test(name)) {
      return 'recap';
    }

    return 'chapter';
  }
}
