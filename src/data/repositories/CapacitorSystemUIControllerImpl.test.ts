import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CapacitorSystemUIControllerImpl } from './CapacitorSystemUIControllerImpl';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';

vi.mock('@capacitor/screen-orientation', () => ({
  ScreenOrientation: {
    lock: vi.fn(),
    unlock: vi.fn(),
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isPluginAvailable: vi.fn(),
    getPlatform: vi.fn(() => 'web'),
  },
}));

describe('CapacitorSystemUIControllerImpl', () => {
  let controller: CapacitorSystemUIControllerImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new CapacitorSystemUIControllerImpl();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Status Bar Control', () => {
    it('should hide status bar when StatusBar plugin is available', async () => {
      const mockHide = vi.fn().mockResolvedValue(undefined);
      (Capacitor.isPluginAvailable as any).mockReturnValue(true);
      (Capacitor as any).Plugins = {
        StatusBar: {
          hide: mockHide,
          show: vi.fn(),
          setOverlaysWebView: vi.fn(),
        },
      };

      await controller.hideStatusBar();
      expect(mockHide).toHaveBeenCalledTimes(1);
    });

    it('should show status bar when StatusBar plugin is available', async () => {
      const mockShow = vi.fn().mockResolvedValue(undefined);
      (Capacitor.isPluginAvailable as any).mockReturnValue(true);
      (Capacitor as any).Plugins = {
        StatusBar: {
          hide: vi.fn(),
          show: mockShow,
          setOverlaysWebView: vi.fn(),
        },
      };

      await controller.showStatusBar();
      expect(mockShow).toHaveBeenCalledTimes(1);
    });

    it('should set status bar overlay when StatusBar plugin is available', async () => {
      const mockOverlay = vi.fn().mockResolvedValue(undefined);
      (Capacitor.isPluginAvailable as any).mockReturnValue(true);
      (Capacitor as any).Plugins = {
        StatusBar: {
          hide: vi.fn(),
          show: vi.fn(),
          setOverlaysWebView: mockOverlay,
        },
      };

      await controller.setOverlaysWebView(true);
      expect(mockOverlay).toHaveBeenCalledWith({ overlay: true });
    });

    it('should not throw if StatusBar plugin is not available', async () => {
      (Capacitor.isPluginAvailable as any).mockReturnValue(false);
      (Capacitor as any).Plugins = {};

      await expect(controller.hideStatusBar()).resolves.toBeUndefined();
      await expect(controller.showStatusBar()).resolves.toBeUndefined();
      await expect(controller.setOverlaysWebView(true)).resolves.toBeUndefined();
    });
  });

  describe('Navigation Bar Control', () => {
    it('should hide navigation bar when NavigationBar plugin is available', async () => {
      const mockHide = vi.fn().mockResolvedValue(undefined);
      (Capacitor.isPluginAvailable as any).mockImplementation((pluginName: string) => pluginName === 'NavigationBar');
      (Capacitor as any).Plugins = {
        NavigationBar: {
          hide: mockHide,
          show: vi.fn(),
        },
      };

      await controller.hideNavigationBar();
      expect(mockHide).toHaveBeenCalledTimes(1);
    });

    it('should show navigation bar when NavigationBar plugin is available', async () => {
      const mockShow = vi.fn().mockResolvedValue(undefined);
      (Capacitor.isPluginAvailable as any).mockImplementation((pluginName: string) => pluginName === 'NavigationBar');
      (Capacitor as any).Plugins = {
        NavigationBar: {
          hide: vi.fn(),
          show: mockShow,
        },
      };

      await controller.showNavigationBar();
      expect(mockShow).toHaveBeenCalledTimes(1);
    });

    it('should not throw if NavigationBar plugin is not available', async () => {
      (Capacitor.isPluginAvailable as any).mockReturnValue(false);
      (Capacitor as any).Plugins = {};

      await expect(controller.hideNavigationBar()).resolves.toBeUndefined();
      await expect(controller.showNavigationBar()).resolves.toBeUndefined();
    });
  });

  describe('Orientation Control', () => {
    it('should lock orientation using Capacitor ScreenOrientation if available', async () => {
      (Capacitor.isPluginAvailable as any).mockImplementation((name: string) => name === 'ScreenOrientation');
      (ScreenOrientation.lock as any).mockResolvedValue(undefined);

      await controller.lockOrientation('landscape');
      expect(ScreenOrientation.lock).toHaveBeenCalledWith({ orientation: 'landscape' });
    });

    it('should unlock orientation using Capacitor ScreenOrientation if available', async () => {
      (Capacitor.isPluginAvailable as any).mockImplementation((name: string) => name === 'ScreenOrientation');
      (ScreenOrientation.unlock as any).mockResolvedValue(undefined);

      await controller.unlockOrientation();
      expect(ScreenOrientation.unlock).toHaveBeenCalledTimes(1);
    });

    it('should fallback to screen.orientation.lock if Capacitor ScreenOrientation throws or is not available', async () => {
      (Capacitor.isPluginAvailable as any).mockReturnValue(false);
      const mockWebLock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window, 'screen', {
        value: {
          orientation: {
            lock: mockWebLock,
            unlock: vi.fn(),
          },
        },
        writable: true,
        configurable: true,
      });

      await controller.lockOrientation('landscape');
      expect(mockWebLock).toHaveBeenCalledWith('landscape');
    });

    it('should fallback to screen.orientation.unlock if Capacitor ScreenOrientation throws or is not available', async () => {
      (Capacitor.isPluginAvailable as any).mockReturnValue(false);
      const mockWebUnlock = vi.fn();
      Object.defineProperty(window, 'screen', {
        value: {
          orientation: {
            lock: vi.fn(),
            unlock: mockWebUnlock,
          },
        },
        writable: true,
        configurable: true,
      });

      await controller.unlockOrientation();
      expect(mockWebUnlock).toHaveBeenCalledTimes(1);
    });

    it('should handle orientation errors gracefully without crashing', async () => {
      (Capacitor.isPluginAvailable as any).mockReturnValue(true);
      (ScreenOrientation.lock as any).mockRejectedValue(new Error('Not supported on this platform'));

      await expect(controller.lockOrientation('landscape')).resolves.toBeUndefined();
    });
  });

  describe('Fullscreen API Control', () => {
    it('should request standard fullscreen on target element', async () => {
      const mockElem = document.createElement('div');
      mockElem.requestFullscreen = vi.fn().mockResolvedValue(undefined);

      await controller.enterFullscreen(mockElem);
      expect(mockElem.requestFullscreen).toHaveBeenCalledTimes(1);
    });

    it('should fallback to document.documentElement when element not provided', async () => {
      const mockRequestFs = vi.fn().mockResolvedValue(undefined);
      document.documentElement.requestFullscreen = mockRequestFs;

      await controller.enterFullscreen();
      expect(mockRequestFs).toHaveBeenCalledTimes(1);
    });

    it('should support webkitRequestFullscreen prefix fallback', async () => {
      const mockElem: any = document.createElement('div');
      delete mockElem.requestFullscreen;
      mockElem.webkitRequestFullscreen = vi.fn().mockResolvedValue(undefined);

      await controller.enterFullscreen(mockElem);
      expect(mockElem.webkitRequestFullscreen).toHaveBeenCalledTimes(1);
    });

    it('should exit standard fullscreen if active', async () => {
      const mockExit = vi.fn().mockResolvedValue(undefined);
      document.exitFullscreen = mockExit;
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });

      await controller.exitFullscreen();
      expect(mockExit).toHaveBeenCalledTimes(1);
      expect(controller.isFullscreen()).toBe(true);
    });

    it('should correctly report isFullscreen false when no fullscreenElement', () => {
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        writable: true,
        configurable: true,
      });
      (document as any).webkitFullscreenElement = null;

      expect(controller.isFullscreen()).toBe(false);
    });

    it('should handle fullscreen errors gracefully without throwing', async () => {
      document.documentElement.requestFullscreen = vi.fn().mockRejectedValue(new Error('Fullscreen denied'));
      await expect(controller.enterFullscreen()).resolves.toBeUndefined();
    });
  });

  describe('Screen Wake Lock Control', () => {
    it('should request screen wake lock and track state', async () => {
      const mockSentinel = {
        released: false,
        release: vi.fn().mockImplementation(async () => {
          mockSentinel.released = true;
          mockSentinel.onrelease?.();
        }),
        onrelease: null as any,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      const mockRequest = vi.fn().mockResolvedValue(mockSentinel);
      Object.defineProperty(navigator, 'wakeLock', {
        value: {
          request: mockRequest,
        },
        writable: true,
        configurable: true,
      });

      const success = await controller.requestWakeLock();
      expect(success).toBe(true);
      expect(mockRequest).toHaveBeenCalledWith('screen');
      expect(controller.isWakeLocked()).toBe(true);

      await controller.releaseWakeLock();
      expect(mockSentinel.release).toHaveBeenCalledTimes(1);
      expect(controller.isWakeLocked()).toBe(false);
    });

    it('should return false if wake lock is unsupported or fails', async () => {
      Object.defineProperty(navigator, 'wakeLock', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const success = await controller.requestWakeLock();
      expect(success).toBe(false);
      expect(controller.isWakeLocked()).toBe(false);
    });

    it('should handle wake lock rejection gracefully', async () => {
      Object.defineProperty(navigator, 'wakeLock', {
        value: {
          request: vi.fn().mockRejectedValue(new Error('WakeLock denied')),
        },
        writable: true,
        configurable: true,
      });

      const success = await controller.requestWakeLock();
      expect(success).toBe(false);
      expect(controller.isWakeLocked()).toBe(false);
    });
  });
});
