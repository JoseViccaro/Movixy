import type { Media } from '../models/media.model';

export interface FilterOptions {
  genres?: string[];
  years?: number[];
  ratings?: string[];
  languages?: string[];
  mediaType?: 'movie' | 'tv' | 'all';
}

export interface PagedResult {
  items: Media[];
  totalCount: number;
  nextStartIndex: number | null;
}

export interface IMediaRepository {
  getPopular(limit?: number, startIndex?: number): Promise<PagedResult>;
  getMovies(limit?: number, startIndex?: number): Promise<PagedResult>;
  getSeries(limit?: number, startIndex?: number): Promise<PagedResult>;
  getContinueWatching(): Promise<Media[]>;
  getById(id: string): Promise<Media>;
  getEpisodes(id: string, seasonId?: string): Promise<Media[]>;
  getSeasons(id: string): Promise<Media[]>;
  search(query: string): Promise<Media[]>;
  getFiltered(options: FilterOptions): Promise<Media[]>;
}
