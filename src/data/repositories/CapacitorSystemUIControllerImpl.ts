import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import type { ISystemUIController } from '@/domain/repositories/ISystemUIController';
import type { OrientationLockType } from '@/domain/models/system-ui.model';

export class CapacitorSystemUIControllerImpl implements ISystemUIController {
  private wakeLockSentinel: WakeLockSentinel | null = null;

  async hideStatusBar(): Promise<void> {
    try {
      if (Capacitor.isPluginAvailable('StatusBar')) {
        const statusBarPlugin = (Capacitor as any).Plugins?.StatusBar;
        if (statusBarPlugin?.hide) {
          await statusBarPlugin.hide();
        }
      }
    } catch (err) {
      console.warn('[CapacitorSystemUIController] hideStatusBar failed:', err);
    }
  }

  async showStatusBar(): Promise<void> {
    try {
      if (Capacitor.isPluginAvailable('StatusBar')) {
        const statusBarPlugin = (Capacitor as any).Plugins?.StatusBar;
        if (statusBarPlugin?.show) {
          await statusBarPlugin.show();
        }
      }
    } catch (err) {
      console.warn('[CapacitorSystemUIController] showStatusBar failed:', err);
    }
  }

  async hideNavigationBar(): Promise<void> {
    try {
      if (Capacitor.isPluginAvailable('NavigationBar')) {
        const navBarPlugin = (Capacitor as any).Plugins?.NavigationBar;
        if (navBarPlugin?.hide) {
          await navBarPlugin.hide();
        }
      }
    } catch (err) {
      console.warn('[CapacitorSystemUIController] hideNavigationBar failed:', err);
    }
  }

  async showNavigationBar(): Promise<void> {
    try {
      if (Capacitor.isPluginAvailable('NavigationBar')) {
        const navBarPlugin = (Capacitor as any).Plugins?.NavigationBar;
        if (navBarPlugin?.show) {
          await navBarPlugin.show();
        }
      }
    } catch (err) {
      console.warn('[CapacitorSystemUIController] showNavigationBar failed:', err);
    }
  }

  async setOverlaysWebView(overlay: boolean): Promise<void> {
    try {
      if (Capacitor.isPluginAvailable('StatusBar')) {
        const statusBarPlugin = (Capacitor as any).Plugins?.StatusBar;
        if (statusBarPlugin?.setOverlaysWebView) {
          await statusBarPlugin.setOverlaysWebView({ overlay });
        }
      }
    } catch (err) {
      console.warn('[CapacitorSystemUIController] setOverlaysWebView failed:', err);
    }
  }

  async lockOrientation(orientation: OrientationLockType): Promise<void> {
    try {
      if (Capacitor.isPluginAvailable('ScreenOrientation')) {
        await ScreenOrientation.lock({ orientation: orientation as any });
        return;
      }
    } catch (err) {
      console.warn('[CapacitorSystemUIController] Capacitor ScreenOrientation lock failed:', err);
    }

    // Web fallback
    try {
      const screenOrientation = (window.screen as any)?.orientation;
      if (screenOrientation && typeof screenOrientation.lock === 'function') {
        await screenOrientation.lock(orientation);
      } else if (typeof (window.screen as any)?.lockOrientation === 'function') {
        (window.screen as any).lockOrientation(orientation);
      }
    } catch (err) {
      console.warn('[CapacitorSystemUIController] Web screen orientation lock failed:', err);
    }
  }

  async unlockOrientation(): Promise<void> {
    try {
      if (Capacitor.isPluginAvailable('ScreenOrientation')) {
        await ScreenOrientation.unlock();
        return;
      }
    } catch (err) {
      console.warn('[CapacitorSystemUIController] Capacitor ScreenOrientation unlock failed:', err);
    }

    // Web fallback
    try {
      const screenOrientation = (window.screen as any)?.orientation;
      if (screenOrientation && typeof screenOrientation.unlock === 'function') {
        screenOrientation.unlock();
      } else if (typeof (window.screen as any)?.unlockOrientation === 'function') {
        (window.screen as any).unlockOrientation();
      }
    } catch (err) {
      console.warn('[CapacitorSystemUIController] Web screen orientation unlock failed:', err);
    }
  }

  async enterFullscreen(element?: HTMLElement): Promise<void> {
    const target = element || document.documentElement;
    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if ((target as any).webkitRequestFullscreen) {
        await (target as any).webkitRequestFullscreen();
      }
    } catch (err) {
      console.warn('[CapacitorSystemUIController] Fullscreen request failed:', err);
    }
  }

  async exitFullscreen(): Promise<void> {
    try {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      if (isFs) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('[CapacitorSystemUIController] Exit fullscreen failed:', err);
    }
  }

  isFullscreen(): boolean {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement
    );
  }

  async requestWakeLock(): Promise<boolean> {
    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock?.request) {
        const sentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel = sentinel;
        sentinel.addEventListener?.('release', () => {
          if (this.wakeLockSentinel === sentinel) {
            this.wakeLockSentinel = null;
          }
        });
        return true;
      }
    } catch (err) {
      console.warn('[CapacitorSystemUIController] Wake Lock request failed:', err);
    }
    return false;
  }

  async releaseWakeLock(): Promise<void> {
    try {
      if (this.wakeLockSentinel && !this.wakeLockSentinel.released) {
        await this.wakeLockSentinel.release();
      }
    } catch (err) {
      console.warn('[CapacitorSystemUIController] Wake Lock release failed:', err);
    } finally {
      this.wakeLockSentinel = null;
    }
  }

  isWakeLocked(): boolean {
    return !!(this.wakeLockSentinel && !this.wakeLockSentinel.released);
  }
}
