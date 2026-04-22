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
    const response = await this.client.getItems(this.userId, undefined, 20);
    return response.Items.map((item) => this.mapToMedia(item));
  }

  async getById(id: string): Promise<Media> {
    const item = await this.client.getItemById(this.userId, id);
    return this.mapToMedia(item);
  }

  async search(query: string): Promise<Media[]> {
    const response = await this.client.search(this.userId, query);
    return response.Items.map((item) => this.mapToMedia(item));
  }

  async getFirstEpisodeId(seriesId: string): Promise<string | null> {
    const response = await this.client.getItems(this.userId, seriesId, 1);
    const firstItem = response.Items[0];
    if (!firstItem) return null;
    
    if (firstItem.Type === 'Episode') {
      return firstItem.Id;
    }
    
    // If it's a Season, go deeper
    if (firstItem.Type === 'Series' || (firstItem as any).Type === 'Season') {
       const subResponse = await this.client.getItems(this.userId, firstItem.Id, 1);
       return subResponse.Items[0]?.Id || null;
    }

    return firstItem.Id;
  }

  /**
   * Mapper: JellyfinItem (DTO) → Media (Domain Model)
   * Toda la lógica de transformación vive aquí.
   */
  private mapToMedia(item: JellyfinItem): Media {
    return {
      id: item.Id,
      title: item.Name,
      overview: item.Overview || '',
      posterPath: this.client.getImageUrl(item.Id, 'Primary', 400),
      backdropPath: this.client.getImageUrl(item.Id, 'Backdrop', 1280),
      releaseDate: item.ProductionYear?.toString() || '',
      voteAverage: item.CommunityRating || 0,
      mediaType: item.Type === 'Movie' ? 'movie' : 'tv',
    };
  }
}
