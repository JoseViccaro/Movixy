import { jellyfinConfig } from '@/core/config/jellyfin.config';
import { secureStorage } from '@/core/utils/secure-storage';

const PLAY_SESSION_ID = `movixy-${Math.random().toString(36).substring(2, 11)}`;

/**
 * JellyfinApiClient — Data Layer infrastructure.
 *
 * Instantiate via JellyfinApiClient.create() to get a client with the
 * decrypted token already loaded. The sync constructor is kept for cases
 * where the token is not yet needed (e.g. the authenticate() call itself).
 */
export class JellyfinApiClient {
  private baseUrl: string;
  private token: string;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(token = '', baseUrl?: string) {
    this.baseUrl = baseUrl || jellyfinConfig.baseUrl;
    this.token = token;
  }

  /** Preferred factory — resolves the stored token before returning the client. */
  static async create(): Promise<JellyfinApiClient> {
    const token = (await secureStorage.getToken()) ?? jellyfinConfig.apiKey;
    return new JellyfinApiClient(token);
  }

  /** Update the in-memory token (called after a successful login). */
  setToken(token: string): void {
    this.token = token;
  }

  private authHeaders(): Record<string, string> {
    if (!this.token) return {};
    return { 'X-Emby-Token': this.token };
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
    retries = 0,
  ): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...jellyfinConfig.staticHeaders(),
          ...this.authHeaders(),
          ...options?.headers,
        },
      });

      if (response.status === 401) {
        secureStorage.clearToken();
        localStorage.removeItem('movixy_user_id');
        localStorage.removeItem('movixy_username');
        // Do NOT retry on 401 — the token is invalid, retrying won't help
        throw Object.assign(new Error('Unauthorized'), { status: 401 });
      }

      if (!response.ok) {
        if (retries < this.maxRetries && response.status >= 500) {
          await new Promise((r) =>
            setTimeout(r, this.retryDelay * (retries + 1)),
          );
          return this.request<T>(endpoint, options, retries + 1);
        }
        throw new Error(
          `Jellyfin API error: ${response.status} ${response.statusText}`,
        );
      }

      return response.json() as Promise<T>;
    } catch (error) {
      // Don't retry auth errors — they won't resolve with more attempts
      if (error instanceof Error && 'status' in error && (error as Error & { status: number }).status === 401) {
        throw error;
      }
      if (retries < this.maxRetries) {
        await new Promise((r) =>
          setTimeout(r, this.retryDelay * (retries + 1)),
        );
        return this.request<T>(endpoint, options, retries + 1);
      }
      throw error;
    }
  }

  /** Authenticate with username + password. Returns token and user info. */
  async authenticate(username: string, password: string) {
    return this.request<JellyfinAuthResponse>('/Users/AuthenticateByName', {
      method: 'POST',
      headers: {
        'X-Emby-Authorization': `MediaBrowser Client="Movixy", Device="Browser", DeviceId="movixy-pwa", Version="1.0.0"`,
      },
      body: JSON.stringify({ Username: username, Pw: password }),
    });
  }

  async getLibraries(userId: string) {
    return this.request<JellyfinLibrariesResponse>(`/Users/${userId}/Views`);
  }

  async getItems(
    userId: string,
    options: {
      parentId?: string;
      limit?: number;
      startIndex?: number;
      genres?: string[];
      years?: number[];
      ratings?: string[];
      languages?: string[];
      includeItemTypes?: string[];
      sortBy?: string;
      sortOrder?: 'Ascending' | 'Descending';
    } = {},
  ) {
    const {
      parentId,
      limit = 20,
      startIndex = 0,
      genres,
      years,
      ratings,
      languages,
      includeItemTypes = ['Movie', 'Series'],
      sortBy = 'DateCreated,SortName',
      sortOrder = 'Descending',
    } = options;

    const params = new URLSearchParams({
      SortBy: sortBy,
      SortOrder: sortOrder,
      IncludeItemTypes: includeItemTypes.join(','),
      Recursive: 'true',
      Fields: 'Overview,Genres,PrimaryImageAspectRatio',
      ImageTypeLimit: '1',
      Limit: limit.toString(),
      StartIndex: startIndex.toString(),
    });

    if (parentId) params.set('ParentId', parentId);
    if (genres?.length) params.set('Genres', genres.join('|'));
    if (years?.length) params.set('Years', years.join(','));
    if (ratings?.length) params.set('OfficialRatings', ratings.join(','));
    if (languages?.length) params.set('Languages', languages.join(','));

    return this.request<JellyfinItemsResponse>(
      `/Users/${userId}/Items?${params}`,
    );
  }

  async getItemById(userId: string, itemId: string) {
    return this.request<JellyfinItem>(`/Users/${userId}/Items/${itemId}`);
  }

  async search(userId: string, query: string) {
    const params = new URLSearchParams({
      searchTerm: query,
      IncludeItemTypes: 'Movie,Series',
      Recursive: 'true',
      Limit: '20',
    });
    return this.request<JellyfinItemsResponse>(
      `/Users/${userId}/Items?${params}`,
    );
  }

  async getResumableItems(userId: string) {
    const params = new URLSearchParams({
      Recursive: 'true',
      Fields: 'Overview,Genres,PrimaryImageAspectRatio',
      ImageTypeLimit: '1',
      Limit: '12',
    });
    return this.request<JellyfinItemsResponse>(
      `/Users/${userId}/Items/Resume?${params}`,
    );
  }

  async refreshLibrary() {
    return fetch(`${this.baseUrl}/Library/Refresh`, {
      method: 'POST',
      headers: {
        ...jellyfinConfig.staticHeaders(),
        ...this.authHeaders(),
      },
    });
  }

  async getEpisodes(userId: string, seriesId: string, seasonId?: string) {
    const params = new URLSearchParams({
      ParentId: seasonId || seriesId,
      IncludeItemTypes: 'Episode',
      Recursive: seasonId ? 'false' : 'true',
      Fields: 'Overview,PrimaryImageAspectRatio',
      ImageTypeLimit: '1',
    });
    return this.request<JellyfinItemsResponse>(
      `/Users/${userId}/Items?${params}`,
    );
  }

  async getSeasons(userId: string, seriesId: string) {
    const params = new URLSearchParams({
      ParentId: seriesId,
      IncludeItemTypes: 'Season,Folder',
      Fields: 'Overview,PrimaryImageAspectRatio',
      ImageTypeLimit: '1',
    });
    return this.request<JellyfinItemsResponse>(
      `/Users/${userId}/Items?${params}`,
    );
  }

  async getFavorites(userId: string) {
    const params = new URLSearchParams({
      Filters: 'IsFavorite',
      Recursive: 'true',
      Fields: 'Overview,PrimaryImageAspectRatio',
      ImageTypeLimit: '1',
      Limit: '50',
    });
    return this.request<JellyfinItemsResponse>(
      `/Users/${userId}/Items?${params}`,
    );
  }

  async getPublicUsers() {
    return this.request<JellyfinPublicUser[]>('/Users/Public');
  }

  async getUserProfile(userId: string) {
    return this.request<JellyfinUser>(`/Users/${userId}`);
  }

  async getItemUserData(userId: string, itemId: string) {
    return this.request<JellyfinUserItemData>(
      `/Users/${userId}/Items/${itemId}/UserData`,
    );
  }

  async updateItemUserData(
    userId: string,
    itemId: string,
    data: Partial<JellyfinUserItemData>,
  ) {
    return this.request<void>(`/Users/${userId}/Items/${itemId}/UserData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  // --- Sync URL builders (token already in memory from constructor) ---

  getUserImageUrl(userId: string): string {
    const t = this.token || jellyfinConfig.apiKey;
    return `${this.baseUrl}/Users/${userId}/Images/Primary?size=200&quality=90&api_key=${t}`;
  }

  getImageUrl(
    itemId: string,
    imageType: 'Primary' | 'Backdrop' = 'Primary',
    width = 400,
  ): string {
    const t = this.token || jellyfinConfig.apiKey;
    return `${this.baseUrl}/Items/${itemId}/Images/${imageType}?maxWidth=${width}&quality=90&api_key=${t}`;
  }

  getStreamUrl(itemId: string): string {
    const t = this.token || jellyfinConfig.apiKey;
    const params = new URLSearchParams({
      api_key: t,
      MediaSourceId: itemId,
      VideoCodec: 'h264',
      AudioCodec: 'aac',
      AudioSampleRate: '44100',
      TranscodingMaxAudioChannels: '2',
      MaxStreamingBitrate: '10000000',
      RequireAvc: 'true',
      RequireNonAnamorphic: 'true',
      DeInterlace: 'true',
      PlaySessionId: PLAY_SESSION_ID,
    });
    const base =
      this.baseUrl === '/jellyfin' ? '/jellyfin' : this.baseUrl;
    return `${base}/Videos/${itemId}/master.m3u8?${params.toString()}`;
  }
}

// --- Jellyfin API response types ---

export interface JellyfinAuthResponse {
  User: { Id: string; Name: string };
  AccessToken: string;
}

export interface JellyfinLibrariesResponse {
  Items: JellyfinLibrary[];
}

export interface JellyfinLibrary {
  Id: string;
  Name: string;
  CollectionType: string;
}

export interface JellyfinItemsResponse {
  Items: JellyfinItem[];
  TotalRecordCount: number;
}

export interface JellyfinItem {
  Id: string;
  Name: string;
  Overview?: string;
  ProductionYear?: number;
  CommunityRating?: number;
  Type: 'Movie' | 'Series' | 'Episode' | 'Season' | 'Folder' | 'BoxSet';
  RunTimeTicks?: number;
  ImageTags?: { Primary?: string };
  BackdropImageTags?: string[];
  SeriesName?: string;
  UserData?: {
    PlaybackPositionTicks?: number;
    Played?: boolean;
    IsFavorite?: boolean;
  };
  IndexNumber?: number;
  ParentIndexNumber?: number;
  ChildCount?: number;
}

export interface JellyfinUserItemData {
  Rating: number;
  IsFavorite: boolean;
  Played: boolean;
  PlaybackPositionTicks: number;
  PlayCount: number;
}

export interface JellyfinPublicUser {
  Id: string;
  Name: string;
  HasPassword: boolean;
  HasConfiguredPassword: boolean;
}

export interface JellyfinUser {
  Id: string;
  Name: string;
  ServerName?: string;
  PrimaryImageAspectRatio?: number;
  SyncPlayAccess: string;
  HasPassword: boolean;
  HasConfiguredPassword: boolean;
  LastLoginDate?: string;
  LastActivityDate?: string;
}
