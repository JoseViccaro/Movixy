import type { ISystemUIController } from '@/domain/repositories/ISystemUIController';
import type { SystemUIConfig, SystemUIState, OrientationLockType } from '@/domain/models/system-ui.model';

export class ImmersiveModeService {
  private isImmersive: boolean = false;
  private currentConfig: SystemUIConfig = {};
  private boundVisibilityHandler: () => void;

  private currentState: SystemUIState = {
    isStatusBarHidden: false,
    isNavigationBarHidden: false,
    isOrientationLocked: false,
    isFullscreen: false,
    isWakeLocked: false,
  };

  private readonly controller: ISystemUIController;

  constructor(controller: ISystemUIController) {
    this.controller = controller;
    this.boundVisibilityHandler = this.handleVisibilityChange.bind(this);
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', this.boundVisibilityHandler);
    }
  }

  async enterImmersiveMode(
    config: SystemUIConfig = {},
    targetElement?: HTMLElement
  ): Promise<SystemUIState> {
    const effectiveConfig: Required<SystemUIConfig> = {
      hideStatusBar: config.hideStatusBar ?? true,
      hideNavigationBar: config.hideNavigationBar ?? true,
      lockOrientation: config.lockOrientation ?? 'landscape',
      requestWakeLock: config.requestWakeLock ?? true,
      requestFullscreen: config.requestFullscreen ?? true,
      overlayWebView: config.overlayWebView ?? true,
    };

    this.currentConfig = effectiveConfig;
    this.isImmersive = true;

    // Status Bar & WebView Overlay
    if (effectiveConfig.hideStatusBar) {
      if (effectiveConfig.overlayWebView) {
        await this.controller.setOverlaysWebView(true);
      }
      await this.controller.hideStatusBar();
      this.currentState.isStatusBarHidden = true;
    }

    // Navigation Bar
    if (effectiveConfig.hideNavigationBar) {
      await this.controller.hideNavigationBar();
      this.currentState.isNavigationBarHidden = true;
    }

    // Orientation Lock
    if (effectiveConfig.lockOrientation) {
      const orientation: OrientationLockType =
        typeof effectiveConfig.lockOrientation === 'string'
          ? effectiveConfig.lockOrientation
          : 'landscape';
      await this.controller.lockOrientation(orientation);
      this.currentState.isOrientationLocked = true;
    }

    // Fullscreen API
    if (effectiveConfig.requestFullscreen) {
      await this.controller.enterFullscreen(targetElement);
      this.currentState.isFullscreen = true;
    }

    // Screen Wake Lock
    if (effectiveConfig.requestWakeLock) {
      const acquired = await this.controller.requestWakeLock();
      this.currentState.isWakeLocked = acquired;
    }

    return { ...this.currentState };
  }

  async exitImmersiveMode(): Promise<SystemUIState> {
    this.isImmersive = false;

    await Promise.all([
      this.controller.showStatusBar(),
      this.controller.setOverlaysWebView(false),
      this.controller.showNavigationBar(),
      this.controller.unlockOrientation(),
      this.controller.releaseWakeLock(),
      this.controller.exitFullscreen(),
    ]);

    this.currentState.isStatusBarHidden = false;
    this.currentState.isNavigationBarHidden = false;
    this.currentState.isOrientationLocked = false;
    this.currentState.isWakeLocked = false;
    this.currentState.isFullscreen = false;

    return { ...this.currentState };
  }

  private async handleVisibilityChange(): Promise<void> {
    if (
      this.isImmersive &&
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible' &&
      this.currentConfig.requestWakeLock !== false
    ) {
      const acquired = await this.controller.requestWakeLock();
      this.currentState.isWakeLocked = acquired;
    }
  }

  isImmersiveActive(): boolean {
    return this.isImmersive;
  }

  getState(): Readonly<SystemUIState> {
    return { ...this.currentState };
  }

  dispose(): void {
    if (typeof document !== 'undefined' && document.removeEventListener) {
      document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
    }
  }
}
