export type MarkerType = 'intro' | 'credits' | 'recap' | 'chapter';

export interface ChapterMarker {
  id: string;
  name: string;
  type: MarkerType;
  startPositionSeconds: number;
  endPositionSeconds: number;
}

export interface ActiveSkipMarkerState {
  marker: ChapterMarker | null;
  isVisible: boolean;
  label: string; // e.g. "Skip Intro" | "Skip Credits" | "Skip Recap"
  targetTimeSeconds: number;
}

export interface IChapterRepository {
  getChapterMarkers(itemId: string): Promise<ChapterMarker[]>;
}
