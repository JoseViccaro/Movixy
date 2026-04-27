import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';

vi.mock('@/core/config/jellyfin.config', () => ({
  jellyfinConfig: {
    baseUrl: 'http://localhost:8096',
    headers: () => ({ 'X-Emby-Token': 'test-token' }),
    apiKey: 'test-api-key',
  },
}));

describe('JellyfinApiClient', () => {
  let client: JellyfinApiClient;

  beforeEach(() => {
    client = new JellyfinApiClient();
  });

  describe('getImageUrl', () => {
    it('returns correct image URL with default width', () => {
      const url = client.getImageUrl('item123', 'Primary');
      expect(url).toBe('http://localhost:8096/Items/item123/Images/Primary?maxWidth=400&quality=90');
    });

    it('returns correct image URL with custom width', () => {
      const url = client.getImageUrl('item456', 'Backdrop', 1280);
      expect(url).toBe('http://localhost:8096/Items/item456/Images/Backdrop?maxWidth=1280&quality=90');
    });
  });

  describe('getStreamUrl', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('returns stream URL with token from localStorage', () => {
      localStorage.setItem('movixy_token', 'local-token');
      const url = client.getStreamUrl('item789');
      expect(url).toContain('Videos/item789/master.m3u8');
      expect(url).toContain('api_key=local-token');
    });

    it('falls back to config API key when no local token', () => {
      const url = client.getStreamUrl('item789');
      expect(url).toContain('api_key=test-api-key');
    });

    it('includes video codec parameters', () => {
      const url = client.getStreamUrl('item789');
      expect(url).toContain('VideoCodec=h264');
      expect(url).toContain('AudioCodec=aac%2Cmp3');
    });

    it('includes resolution limits', () => {
      const url = client.getStreamUrl('item789');
      expect(url).toContain('MaxWidth=1920');
      expect(url).toContain('MaxHeight=1080');
    });
  });
});