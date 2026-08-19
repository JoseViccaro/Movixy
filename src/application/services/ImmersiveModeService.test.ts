import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ImmersiveModeService } from './ImmersiveModeService';
import type { ISystemUIController } from '@/domain/repositories/ISystemUIController';

describe('ImmersiveModeService', () => {
  let mockController: ISystemUIController;
  let service: ImmersiveModeService;

  beforeEach(() => {
    mockController = {
      hideStatusBar: vi.fn().mockResolvedValue(undefined),
      showStatusBar: vi.fn().mockResolvedValue(undefined),
      hideNavigationBar: vi.fn().mockResolvedValue(undefined),
      showNavigationBar: vi.fn().mockResolvedValue(undefined),
      setOverlaysWebView: vi.fn().mockResolvedValue(undefined),
      lockOrientation: vi.fn().mockResolvedValue(undefined),
      unlockOrientation: vi.fn().mockResolvedValue(undefined),
      enterFullscreen: vi.fn().mockResolvedValue(undefined),
      exitFullscreen: vi.fn().mockResolvedValue(undefined),
      isFullscreen: vi.fn().mockReturnValue(false),
      requestWakeLock: vi.fn().mockResolvedValue(true),
      releaseWakeLock: vi.fn().mockResolvedValue(undefined),
      isWakeLocked: vi.fn().mockReturnValue(false),
    };

    service = new ImmersiveModeService(mockController);
  });

  afterEach(() => {
    service.dispose();
    vi.restoreAllMocks();
  });

  describe('enterImmersiveMode', () => {
    it('should coordinate all system UI hiding with defaults (bars, landscape lock, wake lock, fullscreen)', async () => {
      const state = await service.enterImmersiveMode();

      expect(mockController.setOverlaysWebView).toHaveBeenCalledWith(true);
      expect(mockController.hideStatusBar).toHaveBeenCalledTimes(1);
      expect(mockController.hideNavigationBar).toHaveBeenCalledTimes(1);
      expect(mockController.lockOrientation).toHaveBeenCalledWith('landscape');
      expect(mockController.enterFullscreen).toHaveBeenCalledTimes(1);
      expect(mockController.requestWakeLock).toHaveBeenCalledTimes(1);

      expect(state).toEqual({
        isStatusBarHidden: true,
        isNavigationBarHidden: true,
        isOrientationLocked: true,
        isFullscreen: true,
        isWakeLocked: true,
      });
    });

    it('should respect custom config overrides', async () => {
      const state = await service.enterImmersiveMode({
        hideStatusBar: false,
        hideNavigationBar: false,
        lockOrientation: false,
        requestWakeLock: false,
        requestFullscreen: false,
      });

      expect(mockController.hideStatusBar).not.toHaveBeenCalled();
      expect(mockController.hideNavigationBar).not.toHaveBeenCalled();
      expect(mockController.lockOrientation).not.toHaveBeenCalled();
      expect(mockController.enterFullscreen).not.toHaveBeenCalled();
      expect(mockController.requestWakeLock).not.toHaveBeenCalled();

      expect(state).toEqual({
        isStatusBarHidden: false,
        isNavigationBarHidden: false,
        isOrientationLocked: false,
        isFullscreen: false,
        isWakeLocked: false,
      });
    });

    it('should support specific orientation lock types', async () => {
      await service.enterImmersiveMode({
        lockOrientation: 'landscape-primary',
      });

      expect(mockController.lockOrientation).toHaveBeenCalledWith('landscape-primary');
    });

    it('should target specific HTML element for fullscreen when provided', async () => {
      const targetElement = document.createElement('div');
      await service.enterImmersiveMode({ requestFullscreen: true }, targetElement);

      expect(mockController.enterFullscreen).toHaveBeenCalledWith(targetElement);
    });
  });

  describe('exitImmersiveMode', () => {
    it('should restore all system UI states, unlock orientation, and release wake lock', async () => {
      await service.enterImmersiveMode();
      vi.clearAllMocks();

      const state = await service.exitImmersiveMode();

      expect(mockController.showStatusBar).toHaveBeenCalledTimes(1);
      expect(mockController.showNavigationBar).toHaveBeenCalledTimes(1);
      expect(mockController.setOverlaysWebView).toHaveBeenCalledWith(false);
      expect(mockController.unlockOrientation).toHaveBeenCalledTimes(1);
      expect(mockController.releaseWakeLock).toHaveBeenCalledTimes(1);
      expect(mockController.exitFullscreen).toHaveBeenCalledTimes(1);

      expect(state).toEqual({
        isStatusBarHidden: false,
        isNavigationBarHidden: false,
        isOrientationLocked: false,
        isFullscreen: false,
        isWakeLocked: false,
      });
    });
  });

  describe('Visibility Change & Wake Lock Re-acquisition', () => {
    it('should re-acquire wake lock on visibilitychange when becoming visible if immersive mode is active', async () => {
      await service.enterImmersiveMode({ requestWakeLock: true });
      expect(mockController.requestWakeLock).toHaveBeenCalledTimes(1);

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockController.requestWakeLock).toHaveBeenCalledTimes(2);
    });

    it('should not re-acquire wake lock if immersive mode is inactive', async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockController.requestWakeLock).not.toHaveBeenCalled();
    });

    it('should not re-acquire wake lock if page is hidden', async () => {
      await service.enterImmersiveMode({ requestWakeLock: true });
      expect(mockController.requestWakeLock).toHaveBeenCalledTimes(1);

      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockController.requestWakeLock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getState & isImmersive', () => {
    it('should return correct immutable state and active flag', async () => {
      expect(service.isImmersiveActive()).toBe(false);
      await service.enterImmersiveMode();
      expect(service.isImmersiveActive()).toBe(true);
      expect(service.getState().isStatusBarHidden).toBe(true);
      await service.exitImmersiveMode();
      expect(service.isImmersiveActive()).toBe(false);
      expect(service.getState().isStatusBarHidden).toBe(false);
    });
  });
});
