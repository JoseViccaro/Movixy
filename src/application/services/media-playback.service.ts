import { JellyfinApiClient } from "@/data/sources/jellyfin-api.client";
import { JellyfinMediaRepository } from "@/data/repositories/jellyfin-media.repository";
import type { Media } from "@/domain/models/media.model";
import { PlaybackEngineService } from "./playback-engine.service";
import type { PlaybackStreamPlan } from "@/domain/models/media-profile.model";

export interface PlayableContent {
  url: string;
  startPosition?: number;
  streamPlan?: PlaybackStreamPlan;
}

/**
 * MediaPlaybackService — Application layer service to resolve playable content.
 * Integrates dynamic DeviceProfile and direct play stream plans via PlaybackEngineService.
 */
export class MediaPlaybackService {
  private static instance: MediaPlaybackService | null = null;

  private readonly client: JellyfinApiClient;
  private readonly repository: JellyfinMediaRepository;
  private readonly playbackEngine: PlaybackEngineService;
  private static playbackCache = new Map<string, string>();

  /** Cache key scoped by user to prevent cross-user token leakage. */
  private static cacheKey(userId: string, mediaId: string): string {
    return `${userId}:${mediaId}`;
  }

  constructor(
    client: JellyfinApiClient,
    repository: JellyfinMediaRepository,
    playbackEngine?: PlaybackEngineService
  ) {
    this.client = client;
    this.repository = repository;
    this.playbackEngine = playbackEngine ?? new PlaybackEngineService(undefined, undefined, client);
  }

  /**
   * Resolves the playable URL and start position for a given media item.
   * For TV shows, it automatically finds the first episode.
   */
  async getPlayableContent(media: Media): Promise<PlayableContent> {
    let playableId = media.id;

    // Resolve episode if needed
    if (media.mediaType === "tv") {
      const episodeId = await this.repository.getFirstEpisodeId(media.id);
      if (!episodeId) throw new Error("No se encontraron episodios.");
      playableId = episodeId;
    }

    const userId = this.repository.getUserId();
    const startPosition = media.playbackPositionTicks
      ? media.playbackPositionTicks / 10_000_000
      : undefined;

    try {
      const streamPlan = await this.playbackEngine.resolveStreamPlan(
        playableId,
        userId,
        undefined,
        startPosition
      );

      return {
        url: streamPlan.streamUrl,
        startPosition,
        streamPlan,
      };
    } catch {
      // Direct stream fallback
      const cleanPlayableId = playableId.replace(/-/g, "");
      const url = this.client.getStreamUrl(cleanPlayableId);
      const separator = url.includes("?") ? "&" : "?";
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
    const key = this.cacheKey(userId, media.id);
    const cached = this.playbackCache.get(key);
    if (cached) return cached;

    const service = await MediaPlaybackService.create(userId);
    const content = await service.getPlayableContent(media);

    // Save to cache for future use
    this.playbackCache.set(key, content.url);

    return content.url;
  }

  /**
   * Pre-resolves the playback URL in the background.
   * Call this when a media item is focused or hovered.
   */
  static async preResolve(media: Media, userId: string): Promise<void> {
    const key = this.cacheKey(userId, media.id);
    if (this.playbackCache.has(key)) return;

    try {
      const url = await this.resolvePlaybackUrl(media, userId);
      this.playbackCache.set(key, url);
    } catch {
      // Silently fail pre-resolution
    }
  }
}
