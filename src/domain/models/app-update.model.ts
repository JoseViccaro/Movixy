export const UpdateStatus = {
  IDLE: 'IDLE',
  CHECKING: 'CHECKING',
  UP_TO_DATE: 'UP_TO_DATE',
  UPDATE_AVAILABLE: 'UPDATE_AVAILABLE',
  DOWNLOADING: 'DOWNLOADING',
  READY_TO_INSTALL: 'READY_TO_INSTALL',
  ERROR: 'ERROR',
} as const;

export type UpdateStatus = (typeof UpdateStatus)[keyof typeof UpdateStatus];

export interface ReleaseAsset {
  name: string;
  downloadUrl: string;
  size: number;
  contentType: string;
}

export interface ReleaseInfo {
  version: string;
  tagName: string;
  name: string;
  body: string;
  publishedAt: string;
  htmlUrl: string;
  assets: ReleaseAsset[];
  apkAsset?: ReleaseAsset;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestRelease: ReleaseInfo | null;
}

export interface UpdateProgress {
  receivedBytes: number;
  totalBytes: number;
  percentage: number;
}
