import type { OrientationLockType } from '@/domain/models/system-ui.model';

export interface ISystemUIController {
  // System bars
  hideStatusBar(): Promise<void>;
  showStatusBar(): Promise<void>;
  hideNavigationBar(): Promise<void>;
  showNavigationBar(): Promise<void>;
  setOverlaysWebView(overlay: boolean): Promise<void>;

  // Orientation
  lockOrientation(orientation: OrientationLockType): Promise<void>;
  unlockOrientation(): Promise<void>;

  // Fullscreen (Web / DOM)
  enterFullscreen(element?: HTMLElement): Promise<void>;
  exitFullscreen(): Promise<void>;
  isFullscreen(): boolean;

  // Wake Lock
  requestWakeLock(): Promise<boolean>;
  releaseWakeLock(): Promise<void>;
  isWakeLocked(): boolean;
}
