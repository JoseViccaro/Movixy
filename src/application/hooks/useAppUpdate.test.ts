import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppUpdate } from './useAppUpdate';
import { UpdateStatus, type ReleaseInfo } from '@domain/models/app-update.model';
import type { AppUpdateService } from '@application/services/AppUpdateService';

describe('useAppUpdate', () => {
  let mockService: AppUpdateService;

  const mockRelease: ReleaseInfo = {
    version: '2.0.0',
    tagName: 'v2.0.0',
    name: 'Version 2.0.0',
    body: 'Awesome update notes',
    publishedAt: '2026-08-19T10:00:00Z',
    htmlUrl: 'https://github.com/JoseViccaro/Movixy/releases/tag/v2.0.0',
    assets: [],
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockService = {
      checkForUpdate: vi.fn(),
      performUpdate: vi.fn(),
    } as unknown as AppUpdateService;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes with IDLE status and closed modal when autoCheck is false', () => {
    const { result } = renderHook(() =>
      useAppUpdate({ service: mockService, autoCheck: false }),
    );

    expect(result.current.status).toBe(UpdateStatus.IDLE);
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.currentVersion).toBe('');
    expect(result.current.latestRelease).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('runs check on mount after delay when autoCheck is true and opens modal on update available', async () => {
    vi.mocked(mockService.checkForUpdate).mockResolvedValue({
      hasUpdate: true,
      currentVersion: '1.0.0',
      latestRelease: mockRelease,
    });

    const { result } = renderHook(() =>
      useAppUpdate({ service: mockService, autoCheck: true, checkDelayMs: 1000 }),
    );

    // Fast-forward delay timer
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.status).toBe(UpdateStatus.UPDATE_AVAILABLE);
    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.currentVersion).toBe('1.0.0');
    expect(result.current.latestRelease).toEqual(mockRelease);
  });

  it('sets UP_TO_DATE and keeps modal closed when no update is available', async () => {
    vi.mocked(mockService.checkForUpdate).mockResolvedValue({
      hasUpdate: false,
      currentVersion: '2.0.0',
      latestRelease: mockRelease,
    });

    const { result } = renderHook(() =>
      useAppUpdate({ service: mockService, autoCheck: true, checkDelayMs: 500 }),
    );

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.status).toBe(UpdateStatus.UP_TO_DATE);
    expect(result.current.isModalOpen).toBe(false);
  });

  it('handles error gracefully when checkForUpdate fails', async () => {
    vi.mocked(mockService.checkForUpdate).mockRejectedValue(
      new Error('Rate limit exceeded'),
    );

    const { result } = renderHook(() =>
      useAppUpdate({ service: mockService, autoCheck: true, checkDelayMs: 100 }),
    );

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.status).toBe(UpdateStatus.ERROR);
    expect(result.current.error).toBe('Rate limit exceeded');
    expect(result.current.isModalOpen).toBe(false);
  });

  it('allows dismissing modal and remembers dismissal for session', async () => {
    vi.mocked(mockService.checkForUpdate).mockResolvedValue({
      hasUpdate: true,
      currentVersion: '1.0.0',
      latestRelease: mockRelease,
    });

    const { result } = renderHook(() =>
      useAppUpdate({ service: mockService, autoCheck: false }),
    );

    await act(async () => {
      await result.current.checkForUpdate();
    });

    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.dismissModal();
    });

    expect(result.current.isModalOpen).toBe(false);
  });

  it('performs update, updates progress, and transitions to READY_TO_INSTALL', async () => {
    vi.mocked(mockService.performUpdate).mockImplementation(async (_release, onProgress) => {
      if (onProgress) {
        onProgress({ receivedBytes: 50, totalBytes: 100, percentage: 50 });
        onProgress({ receivedBytes: 100, totalBytes: 100, percentage: 100 });
      }
    });

    const { result } = renderHook(() =>
      useAppUpdate({ service: mockService, autoCheck: false }),
    );

    // Seed update state
    vi.mocked(mockService.checkForUpdate).mockResolvedValue({
      hasUpdate: true,
      currentVersion: '1.0.0',
      latestRelease: mockRelease,
    });

    await act(async () => {
      await result.current.checkForUpdate();
    });

    await act(async () => {
      await result.current.startUpdate();
    });

    expect(result.current.status).toBe(UpdateStatus.READY_TO_INSTALL);
    expect(result.current.progress?.percentage).toBe(100);
    expect(mockService.performUpdate).toHaveBeenCalledWith(
      mockRelease,
      expect.any(Function),
    );
  });

  it('captures error during startUpdate and sets status to ERROR', async () => {
    vi.mocked(mockService.performUpdate).mockRejectedValue(
      new Error('Download failed'),
    );

    const { result } = renderHook(() =>
      useAppUpdate({ service: mockService, autoCheck: false }),
    );

    vi.mocked(mockService.checkForUpdate).mockResolvedValue({
      hasUpdate: true,
      currentVersion: '1.0.0',
      latestRelease: mockRelease,
    });

    await act(async () => {
      await result.current.checkForUpdate();
    });

    await act(async () => {
      await result.current.startUpdate();
    });

    expect(result.current.status).toBe(UpdateStatus.ERROR);
    expect(result.current.error).toBe('Download failed');
  });
});
