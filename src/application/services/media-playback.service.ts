import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { JellyfinMediaRepository } from '@/data/repositories/jellyfin-media.repository';
import type { Media } from '@/domain/models/media.model';

export interface PlayableContent {
  url: string;
  startPosition?: number;
}

/**
 * MediaPlaybackService — Application layer service to resolve playable content.
 * Centralizes the logic for movies and TV series (episode resolution).
 */
export class MediaPlaybackService {
  private static instance: MediaPlaybackService | null = null;

  private readonly client: JellyfinApiClient;
  private readonly repository: JellyfinMediaRepository;
  private static playbackCache = new Map<string, string>();

  constructor(
    client: JellyfinApiClient,
    repository: JellyfinMediaRepository,
  ) {
    this.client = client;
    this.repository = repository;
  }

  /**
   * Resolves the playable URL and start position for a given media item.
   * For TV shows, it automatically finds the first episode.
   */
  async getPlayableContent(media: Media): Promise<PlayableContent> {
    let playableId = media.id;

    // Resolve episode if needed
    if (media.mediaType === 'tv') {
      const episodeId = await this.repository.getFirstEpisodeId(media.id);
      if (!episodeId) throw new Error('No se encontraron episodios.');
      playableId = episodeId;
    }

    // Professional Playback Negotiation
    const userId = this.repository.getUserId();
    const cleanPlayableId = playableId.replace(/-/g, '');
    const playbackInfo = await this.client.getPlaybackInfo(userId, cleanPlayableId, {
      MaxStaticBitrate: 20000000,
      MaxStreamingBitrate: 20000000,
      MusicStreamingTranscodingBitrate: 192000,
    });
    const source = playbackInfo.MediaSources[0];

    if (!source) throw new Error('No se encontraron fuentes de medios.');

    // Convert ticks to seconds
    const startPosition = media.playbackPositionTicks
      ? media.playbackPositionTicks / 10_000_000
      : undefined;

    // If Jellyfin suggests a TranscodingUrl, use it (relative to base)
    if (source.TranscodingUrl) {
      const base = this.client.baseUrl.replace(/\/$/, '');
      const transcodingPath = source.TranscodingUrl.startsWith('/') 
        ? source.TranscodingUrl 
        : `/${source.TranscodingUrl}`;
      const url = source.TranscodingUrl.startsWith('http') 
        ? source.TranscodingUrl 
        : `${base}${transcodingPath}`;
      
      // Transcoding URLs already have tags and complex params
      // We fix potential malformations (lowercase 'videos' and '?&' issue)
      return {
        url: url.replace(/\/videos\//, '/Videos/').replace('?&', '?'),
        startPosition,
      };
    } else {
      // Fallback to our builder which is already tuned for 8Mbps/H264
      const url = this.client.getStreamUrl(cleanPlayableId);
      
      // Append cache buster only to our custom stream URLs
      const separator = url.includes('?') ? '&' : '?';
      return {
        url: `${url}${separator}_t=${Date.now()}`,
        startPosition,
      };
    }
  }

  /**
   * Factory method to create an instance with initialized client (Singleton).
   */
  static async create(userId: string): Promise<MediaPlaybackService> {
    if (this.instance) return this.instance;

    const client = await JellyfinApiClient.create();
    const repository = new JellyfinMediaRepository(client, userId);
    this.instance = new MediaPlaybackService(client, repository);
    return this.instance;
  }

  /**
   * Static convenience method to resolve playback URL in one go.
   * Uses cache if available for instant startup.
   */
  static async resolvePlaybackUrl(media: Media, userId: string): Promise<string> {
    const cached = this.playbackCache.get(media.id);
    if (cached) return cached;

    const service = await MediaPlaybackService.create(userId);
    const content = await service.getPlayableContent(media);
    
    // Save to cache for future use
    this.playbackCache.set(media.id, content.url);
    
    return content.url;
  }

  /**
   * Pre-resolves the playback URL in the background.
   * Call this when a media item is focused or hovered.
   */
  static async preResolve(media: Media, userId: string): Promise<void> {
    if (this.playbackCache.has(media.id)) return;
    
    try {
      const url = await this.resolvePlaybackUrl(media, userId);
      this.playbackCache.set(media.id, url);
    } catch {
      // Silently fail pre-resolution
    }
  }
}
