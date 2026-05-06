import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { secureStorage } from '@/core/utils/secure-storage';

vi.mock('@/core/config/jellyfin.config', () => ({
  jellyfinConfig: {
    baseUrl: 'http://localhost:8096',
    staticHeaders: () => ({ 'Content-Type': 'application/json' }),
    apiKey: 'test-api-key',
  },
}));

// Web Crypto is available in jsdom via vitest — no polyfill needed.

describe('JellyfinApiClient', () => {
  let client: JellyfinApiClient;

  beforeEach(() => {
    // Use the sync constructor with an explicit token for URL-builder tests
    client = new JellyfinApiClient('test-token');
    localStorage.clear();
  });

  describe('getImageUrl', () => {
    it('returns correct image URL with default width', () => {
      const url = client.getImageUrl('item123', 'Primary');
      expect(url).toContain('/Items/item123/Images/Primary');
      expect(url).toContain('maxWidth=400');
      expect(url).toContain('api_key=test-token');
    });

    it('returns correct image URL with custom width', () => {
      const url = client.getImageUrl('item456', 'Backdrop', 1280);
      expect(url).toContain('/Items/item456/Images/Backdrop');
      expect(url).toContain('maxWidth=1280');
    });
  });

  describe('getStreamUrl', () => {
    it('returns stream URL with the token passed to constructor', () => {
      const url = client.getStreamUrl('item789');
      expect(url).toContain('Videos/item789/master.m3u8');
      expect(url).toContain('api_key=test-token');
    });

    it('falls back to config API key when no token in constructor', () => {
      const noTokenClient = new JellyfinApiClient();
      const url = noTokenClient.getStreamUrl('item789');
      expect(url).toContain('api_key=test-api-key');
    });

    it('includes required video codec parameters', () => {
      const url = client.getStreamUrl('item789');
      expect(url).toContain('VideoCodec=h264');
      expect(url).toContain('AudioCodec=aac');
    });
  });
});

describe('secureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    secureStorage.clearToken();
  });

  it('encrypts and decrypts a token correctly', async () => {
    await secureStorage.setToken('my-secret-token');
    const retrieved = await secureStorage.getToken();
    expect(retrieved).toBe('my-secret-token');
  });

  it('isAuthenticated returns true after setToken', async () => {
    await secureStorage.setToken('some-token');
    expect(await secureStorage.isAuthenticated()).toBe(true);
  });

  it('isAuthenticated returns false after clearToken', async () => {
    await secureStorage.setToken('some-token');
    secureStorage.clearToken();
    expect(await secureStorage.isAuthenticated()).toBe(false);
  });

  it('getToken returns null when nothing is stored', async () => {
    expect(await secureStorage.getToken()).toBeNull();
  });

  it('getToken returns null for tampered ciphertext', async () => {
    await secureStorage.setToken('valid-token');
    // Corrupt the stored value
    localStorage.setItem('movixy_token_v2', 'not-valid-base64-aes-data!!');
    expect(await secureStorage.getToken()).toBeNull();
  });

  it('migrates a legacy v1 token on first read', async () => {
    // Write a legacy obfuscated token manually
    const legacyToken = 'legacy-token-value';
    const encoded = btoa(legacyToken);
    const scrambled = encoded.split('').reverse().join('');
    localStorage.setItem('movixy_secure_token_v1', scrambled);

    // Give the migration (fire-and-forget) a tick to complete
    await new Promise((r) => setTimeout(r, 50));

    // The new key should now hold the migrated token
    const retrieved = await secureStorage.getToken();
    expect(retrieved).toBe(legacyToken);
    // And the legacy key should be gone
    expect(localStorage.getItem('movixy_secure_token_v1')).toBeNull();
  });
});
