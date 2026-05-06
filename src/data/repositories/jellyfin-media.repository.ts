import type { Media } from '@/domain/models/media.model';
import type {
  IMediaRepository,
  FilterOptions,
  PagedResult,
} from '@/domain/repositories/media.repository';
import {
  JellyfinApiClient,
  type JellyfinItem,
} from '@/data/sources/jellyfin-api.client';

const PAGE_SIZE = 40;

/**
 * JellyfinMediaRepository — Data Layer adapter.
 * Implements the domain interface using the Jellyfin API client.
 * Maps Jellyfin DTOs to domain models.
 */
export class JellyfinMediaRepository implements IMediaRepository {
  private client: JellyfinApiClient;
  private userId: string;

  constructor(client: JellyfinApiClient, userId: string) {
    this.client = client;
    this.userId = userId;
  }

  async getPopular(
    limit = PAGE_SIZE,
    startIndex = 0,
  ): Promise<PagedResult> {
    const response = await this.client.getItems(this.userId, {
      limit,
      startIndex,
    });
    return this.toPagedResult(response, startIndex);
  }

  async getMovies(
    limit = PAGE_SIZE,
    startIndex = 0,
  ): Promise<PagedResult> {
    const response = await this.client.getItems(this.userId, {
      includeItemTypes: ['Movie'],
      limit,
      startIndex,
    });
    return this.toPagedResult(response, startIndex);
  }

  async getSeries(
    limit = PAGE_SIZE,
    startIndex = 0,
  ): Promise<PagedResult> {
    const response = await this.client.getItems(this.userId, {
      includeItemTypes: ['Series'],
      limit,
      startIndex,
    });
    return this.toPagedResult(response, startIndex);
  }

  async getContinueWatching(): Promise<Media[]> {
    const response = await this.client.getResumableItems(this.userId);
    const items = response.Items.map((item) => this.mapToMedia(item));
    return this.deduplicate(items);
  }

  async getById(id: string): Promise<Media> {
    const item = await this.client.getItemById(this.userId, id);
    return this.mapToMedia(item);
  }

  async getEpisodes(seriesId: string, seasonId?: string): Promise<Media[]> {
    const response = await this.client.getEpisodes(this.userId, seriesId, seasonId);
    return response.Items.map((item) => this.mapToMedia(item));
  }

  async getSeasons(seriesId: string): Promise<Media[]> {
    const response = await this.client.getSeasons(this.userId, seriesId);
    return response.Items.map((item) => this.mapToMedia(item));
  }

  async search(query: string): Promise<Media[]> {
    const response = await this.client.search(this.userId, query);
    const items = response.Items.map((item) => this.mapToMedia(item));
    return this.deduplicate(items);
  }

  async getFiltered(options: FilterOptions): Promise<Media[]> {
    const { genres, years, ratings, languages, mediaType } = options;
    const includeItemTypes =
      mediaType === 'movie'
        ? ['Movie']
        : mediaType === 'tv'
          ? ['Series']
          : ['Movie', 'Series'];

    const response = await this.client.getItems(this.userId, {
      genres,
      years,
      ratings,
      languages,
      includeItemTypes: includeItemTypes as ('Movie' | 'Series')[],
      limit: 50,
    });
    const items = response.Items.map((item) => this.mapToMedia(item));
    return this.deduplicate(items);
  }

  async getFirstEpisodeId(seriesId: string): Promise<string | null> {
    const response = await this.client.getItems(this.userId, {
      parentId: seriesId,
      includeItemTypes: ['Episode'],
      limit: 1,
    });
    return response.Items[0]?.Id ?? null;
  }

  async getFavorites(): Promise<Media[]> {
    const response = await this.client.getFavorites(this.userId);
    const items = response.Items.map((item) => this.mapToMedia(item));
    return this.deduplicate(items);
  }

  async toggleFavorite(itemId: string, isFavorite: boolean): Promise<void> {
    await this.client.updateItemUserData(this.userId, itemId, {
      IsFavorite: isFavorite,
    });
  }

  async isFavorite(itemId: string): Promise<boolean> {
    try {
      const data = await this.client.getItemUserData(this.userId, itemId);
      return data.IsFavorite;
    } catch {
      return false;
    }
  }

  // --- Private helpers ---

  private deduplicate(items: Media[]): Media[] {
    // Group by title
    const groups = items.reduce(
      (acc, item) => {
        if (!acc[item.title]) acc[item.title] = [];
        acc[item.title].push(item);
        return acc;
      },
      {} as Record<string, Media[]>,
    );

    // For each group, pick the best candidate
    return Object.values(groups).map((group) => {
      if (group.length === 1) return group[0];

      // 1. Prefer items that are explicitly 'tv' (Series) over 'movie' (Folders)
      const seriesCandidate = group.find((m) => m.mediaType === 'tv');
      if (seriesCandidate) return seriesCandidate;

      // 2. Default to the first one
      return group[0];
    });
  }

  private toPagedResult(
    response: { Items: JellyfinItem[]; TotalRecordCount: number },
    startIndex: number,
  ): PagedResult {
    const allItems = response.Items.map((item) => this.mapToMedia(item));

    const items = this.deduplicate(allItems);

    const fetched = startIndex + allItems.length;
    const nextStartIndex =
      fetched < response.TotalRecordCount ? fetched : null;
    return { items, totalCount: response.TotalRecordCount, nextStartIndex };
  }

  /**
   * Mapper: JellyfinItem (DTO) → Media (Domain Model).
   * All transformation logic lives here — no leaking into the presentation layer.
   */
  private mapToMedia(item: JellyfinItem): Media {
    const title =
      item.Type === 'Episode' && item.SeriesName
        ? `${item.SeriesName}: ${item.Name}`
        : item.Name;

    const runtimeTicks = item.RunTimeTicks ?? 0;
    const playbackPositionTicks = item.UserData?.PlaybackPositionTicks ?? 0;
    const watchedPercentage =
      runtimeTicks > 0
        ? Math.round((playbackPositionTicks / runtimeTicks) * 100)
        : 0;

    let mediaType: 'movie' | 'tv' | 'episode' = 'movie';
    if (item.Type === 'Series' || item.Type === 'Folder' || item.Type === 'BoxSet' || item.Type === 'Season') {
      mediaType = 'tv';
    } else if (item.Type === 'Episode') {
      mediaType = 'episode';
    }

    const hasPrimary = !!item.ImageTags?.Primary;
    const hasBackdrop = !!item.BackdropImageTags?.length;

    // Map season/episode numbers from Jellyfin's IndexNumber
    const seasonNumber = item.Type === 'Season' 
      ? item.IndexNumber 
      : item.Type === 'Episode' 
        ? item.ParentIndexNumber ?? item.IndexNumber // Use ParentIndexNumber for episode's season if available
        : undefined;
        
    const episodeNumber = item.Type === 'Episode' 
      ? item.IndexNumber 
      : undefined;

    return {
      id: item.Id,
      title,
      overview: item.Overview ?? '',
      posterPath: hasPrimary
        ? this.client.getImageUrl(item.Id, 'Primary', 400)
        : '',
      backdropPath: hasBackdrop
        ? this.client.getImageUrl(item.Id, 'Backdrop', 1280)
        : hasPrimary
          ? this.client.getImageUrl(item.Id, 'Primary', 1280)
          : '',
      releaseDate: item.ProductionYear?.toString() ?? '',
      voteAverage: item.CommunityRating ?? 0,
      mediaType,
      seasonNumber,
      episodeNumber,
      playbackPositionTicks,
      runtimeTicks,
      watchedPercentage,
    };
  }
}
