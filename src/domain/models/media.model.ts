export interface Season {
  number: number;
  name: string;
  episodeCount: number;
  posterPath: string;
}

export interface Episode {
  number: number;
  name: string;
  overview: string;
  runtime: number;
  stillPath: string;
}

export interface Subtitle {
  language: string;
  url: string;
  label: string;
}

export interface AudioTrack {
  language: string;
  url: string;
  label: string;
  isDefault: boolean;
}

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
  // Campos extendidos para TV Shows y reproducción premium
  seasons?: Season[];
  episodes?: Episode[];
  subtitles?: Subtitle[];
  audioTracks?: AudioTrack[];
}

export interface Movie extends Media {
  mediaType: 'movie';
}

export interface TVShow extends Media {
  mediaType: 'tv';
}
