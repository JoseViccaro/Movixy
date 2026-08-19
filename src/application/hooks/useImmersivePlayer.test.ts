import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImmersivePlayer } from './useImmersivePlayer';
import type { ISystemUIController } from '@/domain/repositories/ISystemUIController';

describe('useImmersivePlayer', () => {
  let mockController: ISystemUIController;

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should automatically enter immersive mode on mount when autoEnterOnMount is true', async () => {
    const { result } = renderHook(() =>
      useImmersivePlayer({
        autoEnterOnMount: true,
        controller: mockController,
      })
    );

    // Give microtasks time to resolve
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockController.hideStatusBar).toHaveBeenCalledTimes(1);
    expect(mockController.hideNavigationBar).toHaveBeenCalledTimes(1);
    expect(mockController.lockOrientation).toHaveBeenCalledWith('landscape');
    expect(result.current.isImmersive).toBe(true);
    expect(result.current.state.isStatusBarHidden).toBe(true);
  });

  it('should not automatically enter immersive mode when autoEnterOnMount is false', async () => {
    const { result } = renderHook(() =>
      useImmersivePlayer({
        autoEnterOnMount: false,
        controller: mockController,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockController.hideStatusBar).not.toHaveBeenCalled();
    expect(result.current.isImmersive).toBe(false);
  });

  it('should exit immersive mode and clean up on unmount', async () => {
    const { unmount } = renderHook(() =>
      useImmersivePlayer({
        autoEnterOnMount: true,
        controller: mockController,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    unmount();

    expect(mockController.showStatusBar).toHaveBeenCalledTimes(1);
    expect(mockController.showNavigationBar).toHaveBeenCalledTimes(1);
    expect(mockController.unlockOrientation).toHaveBeenCalledTimes(1);
    expect(mockController.releaseWakeLock).toHaveBeenCalledTimes(1);
  });

  it('should support manual enter and exit calls', async () => {
    const { result } = renderHook(() =>
      useImmersivePlayer({
        autoEnterOnMount: false,
        controller: mockController,
      })
    );

    expect(result.current.isImmersive).toBe(false);

    await act(async () => {
      await result.current.enter();
    });

    expect(result.current.isImmersive).toBe(true);
    expect(mockController.hideStatusBar).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.exit();
    });

    expect(result.current.isImmersive).toBe(false);
    expect(mockController.showStatusBar).toHaveBeenCalledTimes(1);
  });
});
