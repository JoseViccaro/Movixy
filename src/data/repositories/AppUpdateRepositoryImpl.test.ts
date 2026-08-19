import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppUpdateRepositoryImpl } from './AppUpdateRepositoryImpl';
import { CapacitorHttp, Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

vi.mock('@capacitor/core', () => ({
  CapacitorHttp: {
    get: vi.fn(),
    request: vi.fn(),
  },
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    getInfo: vi.fn(),
  },
}));

describe('AppUpdateRepositoryImpl', () => {
  let repository: AppUpdateRepositoryImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new AppUpdateRepositoryImpl();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchLatestRelease', () => {
    it('fetches latest release from GitHub API and maps response to ReleaseInfo', async () => {
      const mockGitHubResponse = {
        status: 200,
        data: {
          tag_name: 'v1.4.0',
          name: 'Movixy 1.4.0 Release',
          body: '## Changelog\n- Added auto-updater\n- Improved playback',
          published_at: '2026-08-19T10:00:00Z',
          html_url: 'https://github.com/JoseViccaro/Movixy/releases/tag/v1.4.0',
          assets: [
            {
              name: 'movixy-1.4.0.apk',
              browser_download_url: 'https://github.com/JoseViccaro/Movixy/releases/download/v1.4.0/movixy-1.4.0.apk',
              size: 25000000,
              content_type: 'application/vnd.android.package-archive',
            },
            {
              name: 'source.zip',
              browser_download_url: 'https://github.com/JoseViccaro/Movixy/releases/download/v1.4.0/source.zip',
              size: 5000000,
              content_type: 'application/zip',
            },
          ],
        },
      };

      vi.mocked(CapacitorHttp.get).mockResolvedValue(mockGitHubResponse as any);

      const release = await repository.fetchLatestRelease('JoseViccaro', 'Movixy');

      expect(CapacitorHttp.get).toHaveBeenCalledWith({
        url: 'https://api.github.com/repos/JoseViccaro/Movixy/releases/latest',
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      expect(release).toEqual({
        version: '1.4.0',
        tagName: 'v1.4.0',
        name: 'Movixy 1.4.0 Release',
        body: '## Changelog\n- Added auto-updater\n- Improved playback',
        publishedAt: '2026-08-19T10:00:00Z',
        htmlUrl: 'https://github.com/JoseViccaro/Movixy/releases/tag/v1.4.0',
        assets: [
          {
            name: 'movixy-1.4.0.apk',
            downloadUrl: 'https://github.com/JoseViccaro/Movixy/releases/download/v1.4.0/movixy-1.4.0.apk',
            size: 25000000,
            contentType: 'application/vnd.android.package-archive',
          },
          {
            name: 'source.zip',
            downloadUrl: 'https://github.com/JoseViccaro/Movixy/releases/download/v1.4.0/source.zip',
            size: 5000000,
            contentType: 'application/zip',
          },
        ],
        apkAsset: {
          name: 'movixy-1.4.0.apk',
          downloadUrl: 'https://github.com/JoseViccaro/Movixy/releases/download/v1.4.0/movixy-1.4.0.apk',
          size: 25000000,
          contentType: 'application/vnd.android.package-archive',
        },
      });
    });

    it('returns null when GitHub returns 404 (no releases found)', async () => {
      vi.mocked(CapacitorHttp.get).mockResolvedValue({
        status: 404,
        data: { message: 'Not Found' },
      } as any);

      const release = await repository.fetchLatestRelease('JoseViccaro', 'Movixy');
      expect(release).toBeNull();
    });

    it('throws error when GitHub returns non-200 / non-404 status code', async () => {
      vi.mocked(CapacitorHttp.get).mockResolvedValue({
        status: 500,
        data: { message: 'Internal Server Error' },
      } as any);

      await expect(repository.fetchLatestRelease('JoseViccaro', 'Movixy')).rejects.toThrow(
        'GitHub API error (status: 500)',
      );
    });

    it('throws error when network fails', async () => {
      vi.mocked(CapacitorHttp.get).mockRejectedValue(new Error('Network offline'));

      await expect(repository.fetchLatestRelease('JoseViccaro', 'Movixy')).rejects.toThrow(
        'Network offline',
      );
    });
  });

  describe('getCurrentVersion', () => {
    it('returns version from Capacitor App.getInfo on native platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(App.getInfo).mockResolvedValue({
        version: '1.2.0',
        build: '12',
        id: 'com.movixy.app',
        name: 'Movixy',
      });

      const version = await repository.getCurrentVersion();
      expect(version).toBe('1.2.0');
      expect(App.getInfo).toHaveBeenCalled();
    });

    it('returns import.meta.env.VITE_APP_VERSION or package fallback on Web', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

      const version = await repository.getCurrentVersion();
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });
  });

  describe('downloadAndInstall', () => {
    it('opens downloadUrl in new window / tab on Web platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      await repository.downloadAndInstall('https://github.com/JoseViccaro/Movixy/releases/download/v1.4.0/movixy-1.4.0.apk');

      expect(openSpy).toHaveBeenCalledWith(
        'https://github.com/JoseViccaro/Movixy/releases/download/v1.4.0/movixy-1.4.0.apk',
        '_blank',
      );
    });

    it('simulates progress callback before completion when onProgress is provided', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      vi.spyOn(window, 'open').mockImplementation(() => null);

      const progressCallback = vi.fn();
      await repository.downloadAndInstall(
        'https://github.com/JoseViccaro/Movixy/releases/download/v1.4.0/movixy-1.4.0.apk',
        progressCallback,
      );

      expect(progressCallback).toHaveBeenCalledWith({
        receivedBytes: 100,
        totalBytes: 100,
        percentage: 100,
      });
    });
  });
});
