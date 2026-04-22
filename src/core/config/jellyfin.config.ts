const JELLYFIN_BASE_URL = import.meta.env.VITE_JELLYFIN_URL || 'http://localhost:8096';
const JELLYFIN_API_KEY = import.meta.env.VITE_JELLYFIN_API_KEY || '';

export const jellyfinConfig = {
  baseUrl: JELLYFIN_BASE_URL,
  apiKey: JELLYFIN_API_KEY,
  headers: () => ({
    'Content-Type': 'application/json',
    ...(JELLYFIN_API_KEY ? { 'X-Emby-Token': JELLYFIN_API_KEY } : {}),
  }),
};
