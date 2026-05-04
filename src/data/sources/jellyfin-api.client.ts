import { jellyfinConfig } from '@/core/config/jellyfin.config';
import { secureStorage } from '@/core/utils/secure-storage';

/**
 * JellyfinApiClient — Capa de infraestructura (Data Layer)
 * Se encarga de todas las llamadas HTTP al servidor Jellyfin.
 * Siguiendo Clean Architecture, la presentación NUNCA llama aquí directamente.
 */
export class JellyfinApiClient {
  private baseUrl: string;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    this.baseUrl = jellyfinConfig.baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit, retries = 0): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...jellyfinConfig.headers(),
          ...options?.headers,
        },
      });

      if (response.status === 401) {
        secureStorage.clearToken();
        localStorage.removeItem('movixy_user_id');
        localStorage.removeItem('movixy_username');
        window.location.reload();
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        if (retries < this.maxRetries && response.status >= 500) {
          await new Promise(r => setTimeout(r, this.retryDelay * (retries + 1)));
          return this.request<T>(endpoint, options, retries + 1);
        }
        throw new Error(`Jellyfin API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (retries < this.maxRetries) {
        await new Promise(r => setTimeout(r, this.retryDelay * (retries + 1)));
        return this.request<T>(endpoint, options, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Autenticarse con usuario y contraseña de Jellyfin.
   * Devuelve el token de acceso y la info del usuario.
   */
  async authenticate(username: string, password: string) {
    return this.request<JellyfinAuthResponse>('/Users/AuthenticateByName', {
      method: 'POST',
      headers: {
        'X-Emby-Authorization': `MediaBrowser Client="Movixy", Device="Browser", DeviceId="movixy-pwa", Version="1.0.0"`,
      },
      body: JSON.stringify({ Username: username, Pw: password }),
    });
  }

  /** Obtener todas las bibliotecas del usuario */
  async getLibraries(userId: string) {
    return this.request<JellyfinLibrariesResponse>(`/Users/${userId}/Views`);
  }

  /** Obtener items con filtros avanzados */
  async getItems(userId: string, options: { 
    parentId?: string, 
    limit?: number, 
    genres?: string[],
    includeItemTypes?: string[],
    sortBy?: string,
    sortOrder?: 'Ascending' | 'Descending'
  } = {}) {
    const { 
      parentId, 
      limit = 20, 
      genres, 
      includeItemTypes = ['Movie', 'Series'], 
      sortBy = 'DateCreated,SortName',
      sortOrder = 'Descending'
    } = options;

    const params = new URLSearchParams({
      SortBy: sortBy,
      SortOrder: sortOrder,
      IncludeItemTypes: includeItemTypes.join(','),
      Recursive: 'true',
      Fields: 'Overview,Genres,PrimaryImageAspectRatio',
      ImageTypeLimit: '1',
      Limit: limit.toString(),
    });

    if (parentId) params.set('ParentId', parentId);
    if (genres && genres.length > 0) params.set('Genres', genres.join('|'));

    return this.request<JellyfinItemsResponse>(`/Users/${userId}/Items?${params}`);
  }

  /** Obtener un item por ID */
  async getItemById(userId: string, itemId: string) {
    return this.request<JellyfinItem>(`/Users/${userId}/Items/${itemId}`);
  }

  /** Buscar contenido */
  async search(userId: string, query: string) {
    const params = new URLSearchParams({
      searchTerm: query,
      IncludeItemTypes: 'Movie,Series',
      Recursive: 'true',
      Limit: '20',
    });
    return this.request<JellyfinItemsResponse>(`/Users/${userId}/Items?${params}`);
  }

  /** Obtener items para "Continuar viendo" */
  async getResumableItems(userId: string) {
    const params = new URLSearchParams({
      Recursive: 'true',
      Fields: 'Overview,Genres,PrimaryImageAspectRatio',
      ImageTypeLimit: '1',
      Limit: '12',
    });
    return this.request<JellyfinItemsResponse>(`/Users/${userId}/Items/Resume?${params}`);
  }

  /** Forzar escaneo de la biblioteca */
  async refreshLibrary() {
    return fetch(`${this.baseUrl}/Library/Refresh`, {
      method: 'POST',
      headers: jellyfinConfig.headers(),
    });
  }

  /** Obtener episodios de una serie */
  async getEpisodes(userId: string, seriesId: string) {
    const params = new URLSearchParams({
      ParentId: seriesId,
      IncludeItemTypes: 'Episode',
      Recursive: 'true',
      Fields: 'Overview,PrimaryImageAspectRatio',
      ImageTypeLimit: '1',
    });
    return this.request<JellyfinItemsResponse>(`/Users/${userId}/Items?${params}`);
  }

  /** Obtener items favoritos del usuario */
  async getFavorites(userId: string) {
    const params = new URLSearchParams({
      Filters: 'IsFavorite',
      Recursive: 'true',
      Fields: 'Overview,PrimaryImageAspectRatio',
      ImageTypeLimit: '1',
      Limit: '50',
    });
    return this.request<JellyfinItemsResponse>(`/Users/${userId}/Items?${params}`);
  }

  /** Obtener perfil público del servidor (lista de usuarios) */
  async getPublicUsers() {
    return this.request<JellyfinPublicUser[]>('/Users/Public');
  }

  /** Obtener perfil completo del usuario actual */
  async getUserProfile(userId: string) {
    return this.request<JellyfinUser>(`/Users/${userId}`);
  }

  /** Obtener URL de imagen de usuario (avatar) */
  getUserImageUrl(userId: string): string {
    const token = secureStorage.getToken() || jellyfinConfig.apiKey;
    return `${this.baseUrl}/Users/${userId}/Images/Primary?size=200&quality=90&api_key=${token}`;
  }

  /** Obtener datos de usuario para un item (saber si es favorito) */
  async getItemUserData(userId: string, itemId: string) {
    return this.request<JellyfinUserItemData>(`/Users/${userId}/Items/${itemId}/UserData`);
  }

  /** Actualizar datos de usuario para un item (marcar favorito, progreso, etc) */
  async updateItemUserData(userId: string, itemId: string, data: Partial<JellyfinUserItemData>) {
    return this.request<void>(`/Users/${userId}/Items/${itemId}/UserData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  /** Obtener URL de la imagen de un item */
  getImageUrl(itemId: string, imageType: 'Primary' | 'Backdrop' = 'Primary', width = 400): string {
    const token = secureStorage.getToken() || jellyfinConfig.apiKey;
    return `${this.baseUrl}/Items/${itemId}/Images/${imageType}?maxWidth=${width}&quality=90&api_key=${token}`;
  }

  /** Obtener URL de streaming de un item */
  getStreamUrl(itemId: string): string {
    const token = secureStorage.getToken() || jellyfinConfig.apiKey;
    
    // URL con parámetros de transcodificación robustos para evitar stuttering y errores 500
    const params = new URLSearchParams({
      'api_key': token,
      'MediaSourceId': itemId, // Requerido por Jellyfin para transcoding
      'VideoCodec': 'h264',
      'AudioCodec': 'aac,mp3', // Fallback for audio
      'MaxStreamingBitrate': '14000000', // Limitar a 14 Mbps para 1080p estable
      'TranscodingMaxAudioChannels': '2', // Forzar estéreo para compatibilidad web
      'MaxWidth': '1920',
      'MaxHeight': '1080',
      'RequireAvc': 'true',
      'RequireNonAnamorphic': 'false',
      'PlaySessionId': `movixy-${Date.now()}`
    });

    return `${this.baseUrl}/Videos/${itemId}/master.m3u8?${params.toString()}`;
  }
}

// --- Tipos de respuesta de la API de Jellyfin ---

export interface JellyfinAuthResponse {
  User: {
    Id: string;
    Name: string;
  };
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
  Type: 'Movie' | 'Series' | 'Episode';
  ImageTags?: {
    Primary?: string;
  };
  BackdropImageTags?: string[];
  SeriesName?: string;
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
