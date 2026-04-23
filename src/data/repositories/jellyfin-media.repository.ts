import type { Media } from '@/domain/models/media.model';
import type { IMediaRepository } from '@/domain/repositories/media.repository';
import { JellyfinApiClient, type JellyfinItem } from '@/data/sources/jellyfin-api.client';

/**
 * JellyfinMediaRepository — Adaptador (Data Layer)
 * Implementa la interfaz del dominio usando el cliente de Jellyfin.
 * Mapea los DTOs de Jellyfin a nuestros modelos de dominio.
 */
export class JellyfinMediaRepository implements IMediaRepository {
  private client: JellyfinApiClient;
  private userId: string;

  constructor(client: JellyfinApiClient, userId: string) {
    this.client = client;
    this.userId = userId;
  }

  async getPopular(): Promise<Media[]> {
    const response = await this.client.getItems(this.userId, { limit: 20 });
    return response.Items.map((item) => this.mapToMedia(item));
  }

  async getMovies(): Promise<Media[]> {
    const response = await this.client.getItems(this.userId, { 
      includeItemTypes: ['Movie'],
      limit: 20 
    });
    return response.Items.map((item) => this.mapToMedia(item));
  }

  async getSeries(): Promise<Media[]> {
    const response = await this.client.getItems(this.userId, { 
      includeItemTypes: ['Series'],
      limit: 20 
    });
    return response.Items.map((item) => this.mapToMedia(item));
  }

  async getContinueWatching(): Promise<Media[]> {
    const response = await this.client.getResumableItems(this.userId);
    return response.Items.map((item) => this.mapToMedia(item));
  }

  async getById(id: string): Promise<Media> {
    const item = await this.client.getItemById(this.userId, id);
    return this.mapToMedia(item);
  }

  async getEpisodes(seriesId: string): Promise<Media[]> {
    const response = await this.client.getEpisodes(this.userId, seriesId);
    return response.Items.map((item) => this.mapToMedia(item));
  }

  async search(query: string): Promise<Media[]> {
    const response = await this.client.search(this.userId, query);
    return response.Items.map((item) => this.mapToMedia(item));
  }

  async getFirstEpisodeId(seriesId: string): Promise<string | null> {
    const response = await this.client.getItems(this.userId, { 
      parentId: seriesId, 
      includeItemTypes: ['Episode'],
      recursive: true,
      limit: 1 
    });
    return response.Items[0]?.Id || null;
  }

  /**
   * Mapper: JellyfinItem (DTO) → Media (Domain Model)
   * Toda la lógica de transformación vive aquí.
   */
  private mapToMedia(item: JellyfinItem): Media {
    const title = item.Type === 'Episode' && (item as any).SeriesName 
      ? `${(item as any).SeriesName}: ${item.Name}`
      : item.Name;

    return {
      id: item.Id,
      title: title,
      overview: item.Overview || '',
      posterPath: this.client.getImageUrl(item.Id, 'Primary', 400),
      backdropPath: item.BackdropImageTags && item.BackdropImageTags.length > 0
        ? this.client.getImageUrl(item.Id, 'Backdrop', 1280)
        : this.client.getImageUrl(item.Id, 'Primary', 1280),
      releaseDate: item.ProductionYear?.toString() || '',
      voteAverage: item.CommunityRating || 0,
      mediaType: item.Type === 'Movie' ? 'movie' : (item.Type === 'Episode' ? 'episode' : 'tv'),
    };
  }
}
