import { jellyfinConfig } from '@/core/config/jellyfin.config';

/**
 * JellyfinApiClient — Capa de infraestructura (Data Layer)
 * Se encarga de todas las llamadas HTTP al servidor Jellyfin.
 * Siguiendo Clean Architecture, la presentación NUNCA llama aquí directamente.
 */
export class JellyfinApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = jellyfinConfig.baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...jellyfinConfig.headers(),
        ...options?.headers,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem('movixy_token');
      localStorage.removeItem('movixy_user_id');
      window.location.reload(); // Force redirect via App.tsx logic
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw new Error(`Jellyfin API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
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

  /** Obtener URL de la imagen de un item */
  getImageUrl(itemId: string, imageType: 'Primary' | 'Backdrop' = 'Primary', width = 400): string {
    return `${this.baseUrl}/Items/${itemId}/Images/${imageType}?maxWidth=${width}&quality=90`;
  }

  /** Obtener URL de streaming de un item */
  getStreamUrl(itemId: string): string {
    const token = localStorage.getItem('movixy_token') || jellyfinConfig.apiKey;
    
    const userId = localStorage.getItem('movixy_user_id') || '';
    
    // URL ultra-simplificada
    const params = new URLSearchParams({
      'api_key': token,
      'VideoCodec': 'h264',
      'AudioCodec': 'aac',
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
}
