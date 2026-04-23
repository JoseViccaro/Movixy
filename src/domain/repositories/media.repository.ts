import type { Media } from '../models/media.model';

export interface IMediaRepository {
  getPopular(): Promise<Media[]>;
  getMovies(): Promise<Media[]>;
  getSeries(): Promise<Media[]>;
  getContinueWatching(): Promise<Media[]>;
  getById(id: string): Promise<Media>;
  getEpisodes(id: string): Promise<Media[]>;
  search(query: string): Promise<Media[]>;
}
