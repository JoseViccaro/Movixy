import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppUpdateService } from './AppUpdateService';
import type { IAppUpdateRepository } from '@domain/repositories/IAppUpdateRepository';
import type { ReleaseInfo } from '@domain/models/app-update.model';

describe('AppUpdateService', () => {
  let mockRepository: IAppUpdateRepository;
  let service: AppUpdateService;

  const mockRelease: ReleaseInfo = {
    version: '2.0.0',
    tagName: 'v2.0.0',
    name: 'Version 2.0.0',
    body: 'Awesome new features',
    publishedAt: '2026-08-19T10:00:00Z',
    htmlUrl: 'https://github.com/JoseViccaro/Movixy/releases/tag/v2.0.0',
    assets: [],
    apkAsset: {
      name: 'movixy-2.0.0.apk',
      downloadUrl: 'https://github.com/JoseViccaro/Movixy/releases/download/v2.0.0/movixy-2.0.0.apk',
      size: 15000000,
      contentType: 'application/vnd.android.package-archive',
    },
  };

  beforeEach(() => {
    mockRepository = {
      fetchLatestRelease: vi.fn(),
      getCurrentVersion: vi.fn(),
      downloadAndInstall: vi.fn(),
    };
    service = new AppUpdateService(mockRepository, {
      owner: 'JoseViccaro',
      repo: 'Movixy',
    });
  });

  describe('checkForUpdate', () => {
    it('returns hasUpdate: true with latestRelease when remote version is newer than current', async () => {
      vi.mocked(mockRepository.getCurrentVersion).mockResolvedValue('1.5.0');
      vi.mocked(mockRepository.fetchLatestRelease).mockResolvedValue(mockRelease);

      const result = await service.checkForUpdate();

      expect(result).toEqual({
        hasUpdate: true,
        currentVersion: '1.5.0',
        latestRelease: mockRelease,
      });
      expect(mockRepository.fetchLatestRelease).toHaveBeenCalledWith('JoseViccaro', 'Movixy');
    });

    it('returns hasUpdate: false when remote version is equal or older than current', async () => {
      vi.mocked(mockRepository.getCurrentVersion).mockResolvedValue('2.0.0');
      vi.mocked(mockRepository.fetchLatestRelease).mockResolvedValue(mockRelease);

      const result = await service.checkForUpdate();

      expect(result).toEqual({
        hasUpdate: false,
        currentVersion: '2.0.0',
        latestRelease: mockRelease,
      });
    });

    it('returns hasUpdate: false when remote release is null', async () => {
      vi.mocked(mockRepository.getCurrentVersion).mockResolvedValue('1.0.0');
      vi.mocked(mockRepository.fetchLatestRelease).mockResolvedValue(null);

      const result = await service.checkForUpdate();

      expect(result).toEqual({
        hasUpdate: false,
        currentVersion: '1.0.0',
        latestRelease: null,
      });
    });

    it('propagates repository error when check fails', async () => {
      vi.mocked(mockRepository.getCurrentVersion).mockResolvedValue('1.0.0');
      vi.mocked(mockRepository.fetchLatestRelease).mockRejectedValue(new Error('Network error'));

      await expect(service.checkForUpdate()).rejects.toThrow('Network error');
    });
  });

  describe('performUpdate', () => {
    it('delegates to repository downloadAndInstall using apkAsset downloadUrl when available', async () => {
      const onProgress = vi.fn();
      await service.performUpdate(mockRelease, onProgress);

      expect(mockRepository.downloadAndInstall).toHaveBeenCalledWith(
        'https://github.com/JoseViccaro/Movixy/releases/download/v2.0.0/movixy-2.0.0.apk',
        onProgress,
      );
    });

    it('delegates to repository downloadAndInstall using htmlUrl when no apkAsset is available', async () => {
      const releaseWithoutApk: ReleaseInfo = {
        ...mockRelease,
        apkAsset: undefined,
      };

      await service.performUpdate(releaseWithoutApk);

      expect(mockRepository.downloadAndInstall).toHaveBeenCalledWith(
        'https://github.com/JoseViccaro/Movixy/releases/tag/v2.0.0',
        undefined,
      );
    });
  });
});
