import type { Media } from '../models/media.model';

export interface IMediaRepository {
  getPopular(): Promise<Media[]>;
  getById(id: string): Promise<Media>;
  search(query: string): Promise<Media[]>;
}
