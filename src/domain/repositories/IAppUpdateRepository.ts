import type { ReleaseInfo, UpdateProgress } from '@domain/models/app-update.model';

export interface IAppUpdateRepository {
  fetchLatestRelease(owner: string, repo: string): Promise<ReleaseInfo | null>;
  getCurrentVersion(): Promise<string>;
  downloadAndInstall(
    assetUrl: string,
    onProgress?: (progress: UpdateProgress) => void,
  ): Promise<void>;
}
