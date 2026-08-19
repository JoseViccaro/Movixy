export type OrientationLockType =
  | 'landscape'
  | 'portrait'
  | 'landscape-primary'
  | 'landscape-secondary'
  | 'any';

export interface SystemUIConfig {
  hideStatusBar?: boolean;
  hideNavigationBar?: boolean;
  lockOrientation?: OrientationLockType | boolean;
  requestWakeLock?: boolean;
  requestFullscreen?: boolean;
  overlayWebView?: boolean;
}

export interface SystemUIState {
  isStatusBarHidden: boolean;
  isNavigationBarHidden: boolean;
  isOrientationLocked: boolean;
  isFullscreen: boolean;
  isWakeLocked: boolean;
}
