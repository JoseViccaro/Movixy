export interface Media {
  id: string;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseDate: string;
  voteAverage: number;
  mediaType: 'movie' | 'tv' | 'episode';
  seasonNumber?: number;
  episodeNumber?: number;
  isFavorite?: boolean;
  // Campos para historial de visionado
  playbackPositionTicks?: number;
  runtimeTicks?: number;
  watchedPercentage?: number;
}

export interface Movie extends Media {
  mediaType: 'movie';
}

export interface TVShow extends Media {
  mediaType: 'tv';
}
