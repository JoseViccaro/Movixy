import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useResumePlayback } from './useResumePlayback';
import type { Media } from '@/domain/models/media.model';
import { TICKS_PER_SECOND } from '@/domain/models/resume-playback.model';

describe('useResumePlayback', () => {

  const sampleNonResumableMedia: Media = {
    id: 'media-1',
    title: 'Inception',
    overview: 'Dream in a dream',
    posterPath: '/poster.jpg',
    backdropPath: '/backdrop.jpg',
    releaseDate: '2010-07-16',
    voteAverage: 8.8,
    mediaType: 'movie',
    playbackPositionTicks: 0,
    runtimeTicks: 120 * 60 * TICKS_PER_SECOND,
  };

  const sampleResumableMedia: Media = {
    id: 'media-2',
    title: 'Interstellar',
    overview: 'Space journey',
    posterPath: '/interstellar.jpg',
    backdropPath: '/interstellar-bg.jpg',
    releaseDate: '2014-11-07',
    voteAverage: 8.6,
    mediaType: 'movie',
    playbackPositionTicks: 2500 * TICKS_PER_SECOND, // ~41m 40s
    runtimeTicks: 6000 * TICKS_PER_SECOND, // 100m
  };

  it('directly triggers onStartPlayback(media, 0) when item is not resumable', () => {
    const onStartPlayback = vi.fn();
    const { result } = renderHook(() =>
      useResumePlayback({ onStartPlayback })
    );

    act(() => {
      result.current.requestPlay(sampleNonResumableMedia);
    });

    expect(result.current.isDialogOpen).toBe(false);
    expect(result.current.pendingMedia).toBeNull();
    expect(onStartPlayback).toHaveBeenCalledTimes(1);
    expect(onStartPlayback).toHaveBeenCalledWith(sampleNonResumableMedia, 0);
  });

  it('opens dialog with computed eligibility when item is resumable', () => {
    const onStartPlayback = vi.fn();
    const { result } = renderHook(() =>
      useResumePlayback({ onStartPlayback })
    );

    act(() => {
      result.current.requestPlay(sampleResumableMedia);
    });

    expect(result.current.isDialogOpen).toBe(true);
    expect(result.current.pendingMedia).toEqual(sampleResumableMedia);
    expect(result.current.eligibility).toBeDefined();
    expect(result.current.eligibility?.isResumable).toBe(true);
    expect(result.current.eligibility?.savedPositionSeconds).toBe(2500);
    expect(onStartPlayback).not.toHaveBeenCalled();
  });

  it('handleResume invokes onStartPlayback with savedPositionSeconds and closes dialog', () => {
    const onStartPlayback = vi.fn();
    const { result } = renderHook(() =>
      useResumePlayback({ onStartPlayback })
    );

    act(() => {
      result.current.requestPlay(sampleResumableMedia);
    });

    act(() => {
      result.current.handleResume();
    });

    expect(onStartPlayback).toHaveBeenCalledTimes(1);
    expect(onStartPlayback).toHaveBeenCalledWith(sampleResumableMedia, 2500);
    expect(result.current.isDialogOpen).toBe(false);
    expect(result.current.pendingMedia).toBeNull();
  });

  it('handleRestart invokes onStartPlayback with 0 and closes dialog', () => {
    const onStartPlayback = vi.fn();
    const { result } = renderHook(() =>
      useResumePlayback({ onStartPlayback })
    );

    act(() => {
      result.current.requestPlay(sampleResumableMedia);
    });

    act(() => {
      result.current.handleRestart();
    });

    expect(onStartPlayback).toHaveBeenCalledTimes(1);
    expect(onStartPlayback).toHaveBeenCalledWith(sampleResumableMedia, 0);
    expect(result.current.isDialogOpen).toBe(false);
    expect(result.current.pendingMedia).toBeNull();
  });

  it('handleCancel dismisses dialog without triggering onStartPlayback', () => {
    const onStartPlayback = vi.fn();
    const { result } = renderHook(() =>
      useResumePlayback({ onStartPlayback })
    );

    act(() => {
      result.current.requestPlay(sampleResumableMedia);
    });

    act(() => {
      result.current.handleCancel();
    });

    expect(onStartPlayback).not.toHaveBeenCalled();
    expect(result.current.isDialogOpen).toBe(false);
    expect(result.current.pendingMedia).toBeNull();
  });
});
