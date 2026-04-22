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

  /** Obtener items de una biblioteca */
  async getItems(userId: string, parentId?: string, limit = 20) {
    const params = new URLSearchParams({
      SortBy: 'DateCreated,SortName',
      SortOrder: 'Descending',
      IncludeItemTypes: 'Movie,Series',
      Recursive: 'true',
      Fields: 'Overview,Genres,PrimaryImageAspectRatio',
      ImageTypeLimit: '1',
      Limit: limit.toString(),
    });
    if (parentId) params.set('ParentId', parentId);

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

  /** Obtener URL de la imagen de un item */
  getImageUrl(itemId: string, imageType: 'Primary' | 'Backdrop' = 'Primary', width = 400): string {
    return `${this.baseUrl}/Items/${itemId}/Images/${imageType}?maxWidth=${width}&quality=90`;
  }

  /** Obtener URL de streaming de un item */
  getStreamUrl(itemId: string): string {
    // Forzamos transcodificación de audio a AAC y seleccionamos la pista 1 (Español)
    // El video se copia (remux) para evitar carga de CPU innecesaria
    return `${this.baseUrl}/Videos/${itemId}/stream.mp4?api_key=${jellyfinConfig.apiKey}&Static=false&AudioCodec=aac&AudioStreamIndex=1&allowVideoStreamCopy=true&allowAudioStreamCopy=false`;
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
