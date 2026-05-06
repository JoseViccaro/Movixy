/**
 * jellyfin.config.ts
 *
 * Provides base URL and static headers for the Jellyfin API client.
 * Token-bearing headers are built async via getAuthHeaders() in secure-storage.ts —
 * this file only handles the non-secret parts (Content-Type, base URL).
 */

export const jellyfinConfig = {
  get baseUrl(): string {
    return (
      localStorage.getItem('movixy_server_url') ||
      import.meta.env.VITE_JELLYFIN_URL ||
      'http://172.18.0.2:8096' // IP real del servidor Jellyfin
    );
  },

  /** API key from env — used as fallback when no user token is present (e.g. image URLs). */
  get apiKey(): string {
    return import.meta.env.VITE_JELLYFIN_API_KEY || '';
  },

  /** Static headers that don't require the user token. */
  staticHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json' };
  },
};
