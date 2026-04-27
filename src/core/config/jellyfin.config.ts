import { secureStorage } from '@/core/utils/secure-storage';

const JELLYFIN_API_KEY = import.meta.env.VITE_JELLYFIN_API_KEY || '';

export const jellyfinConfig = {
  get baseUrl() { 
    return localStorage.getItem('movixy_server_url') || import.meta.env.VITE_JELLYFIN_URL || 'http://localhost:8096'; 
  },
  apiKey: JELLYFIN_API_KEY,
  headers: () => {
    const token = secureStorage.getToken() || JELLYFIN_API_KEY;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Emby-Token': token } : {}),
    };
  },
};