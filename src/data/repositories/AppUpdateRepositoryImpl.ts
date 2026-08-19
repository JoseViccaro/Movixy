import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { App } from '@capacitor/app';
import type { IAppUpdateRepository } from '@domain/repositories/IAppUpdateRepository';
import type { ReleaseAsset, ReleaseInfo, UpdateProgress } from '@domain/models/app-update.model';
import { SemverComparator } from '@domain/policies/SemverComparator';

interface GitHubAssetRaw {
  name: string;
  browser_download_url: string;
  size: number;
  content_type: string;
}

interface GitHubReleaseRaw {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: GitHubAssetRaw[];
}

export class AppUpdateRepositoryImpl implements IAppUpdateRepository {
  public async fetchLatestRelease(owner: string, repo: string): Promise<ReleaseInfo | null> {
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/latest`;

    const response = await CapacitorHttp.get({
      url,
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (response.status !== 200) {
      throw new Error(`GitHub API error (status: ${response.status})`);
    }

    const data = response.data as GitHubReleaseRaw;
    const assets: ReleaseAsset[] = (data.assets || []).map((a) => ({
      name: a.name,
      downloadUrl: a.browser_download_url,
      size: a.size,
      contentType: a.content_type,
    }));

    // Detect .apk asset for Android TV / Android Mobile
    const apkAsset = assets.find((a) => a.name.endsWith('.apk') || a.contentType === 'application/vnd.android.package-archive');

    return {
      version: SemverComparator.normalize(data.tag_name),
      tagName: data.tag_name,
      name: data.name || data.tag_name,
      body: data.body || '',
      publishedAt: data.published_at,
      htmlUrl: data.html_url,
      assets,
      apkAsset,
    };
  }

  public async getCurrentVersion(): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      try {
        const info = await App.getInfo();
        return info.version;
      } catch (err) {
        console.warn('[AppUpdateRepository] Failed to get native app version:', err);
      }
    }

    // Web or fallback
    return (
      (typeof import.meta !== 'undefined' &&
        import.meta.env &&
        import.meta.env.VITE_APP_VERSION) ||
      '1.0.0'
    );
  }

  public async downloadAndInstall(
    assetUrl: string,
    onProgress?: (progress: UpdateProgress) => void,
  ): Promise<void> {
    if (onProgress) {
      onProgress({
        receivedBytes: 100,
        totalBytes: 100,
        percentage: 100,
      });
    }

    // On Web and Capacitor basic fallback, opening the browser downloads the APK or takes to release
    window.open(assetUrl, '_blank');
  }
}
