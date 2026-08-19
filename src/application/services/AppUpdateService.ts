import type { IAppUpdateRepository } from '@domain/repositories/IAppUpdateRepository';
import type {
  ReleaseInfo,
  UpdateCheckResult,
  UpdateProgress,
} from '@domain/models/app-update.model';
import { SemverComparator } from '@domain/policies/SemverComparator';

export interface AppUpdateConfig {
  owner: string;
  repo: string;
}

export class AppUpdateService {
  private readonly repository: IAppUpdateRepository;
  private readonly config: AppUpdateConfig;

  constructor(
    repository: IAppUpdateRepository,
    config: AppUpdateConfig,
  ) {
    this.repository = repository;
    this.config = config;
  }

  public async checkForUpdate(): Promise<UpdateCheckResult> {
    const currentVersion = await this.repository.getCurrentVersion();
    const latestRelease = await this.repository.fetchLatestRelease(
      this.config.owner,
      this.config.repo,
    );

    if (!latestRelease) {
      return {
        hasUpdate: false,
        currentVersion,
        latestRelease: null,
      };
    }

    const hasUpdate = SemverComparator.isNewer(
      currentVersion,
      latestRelease.version,
    );

    return {
      hasUpdate,
      currentVersion,
      latestRelease,
    };
  }

  public async performUpdate(
    release: ReleaseInfo,
    onProgress?: (progress: UpdateProgress) => void,
  ): Promise<void> {
    const targetUrl = release.apkAsset ? release.apkAsset.downloadUrl : release.htmlUrl;
    await this.repository.downloadAndInstall(targetUrl, onProgress);
  }
}
