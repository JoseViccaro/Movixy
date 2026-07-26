import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VideoPlayer } from '../presentation/components/VideoPlayer/VideoPlayer';
import { ToastProvider } from '../presentation/components/Toast/Toast';

vi.mock('@/data/sources/jellyfin-api.client', () => {
  const mockClientInstance = {
    updateItemUserData: vi.fn(),
  };
  return {
    JellyfinApiClient: {
      create: vi.fn().mockResolvedValue(mockClientInstance),
    },
    mockClientInstance,
  };
});

const mockUpdatePlaybackPosition = vi.fn();
vi.mock('@/data/repositories/jellyfin-media.repository', () => {
  return {
    JellyfinMediaRepository: class {
      updatePlaybackPosition = mockUpdatePlaybackPosition;
    },
  };
});

describe('VideoPlayer Playback Sync', () => {
  const mockMedia = {
    id: 'test-media-123',
    title: 'Test Movie',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.setItem('movixy_user_id', 'test-user-456');

    // Mock HTMLMediaElement.prototype.play and pause
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should periodically report playback progress every 10 seconds of active playback', async () => {
    render(
      <ToastProvider>
        <VideoPlayer
          streamUrl="http://test.m3u8"
          title="Test Movie"
          media={mockMedia}
          onClose={() => {}}
        />
      </ToastProvider>
    );

    // Simulate play/playing state
    const video = document.querySelector('video') as HTMLVideoElement;
    Object.defineProperty(video, 'currentTime', { value: 15, writable: true });
    
    // Trigger play
    fireEvent.play(video);

    // Advance time by 10s
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockUpdatePlaybackPosition).toHaveBeenCalledWith('test-media-123', 150000000);
  });

  it('should report progress immediately on close click', async () => {
    const handleClose = vi.fn();
    render(
      <ToastProvider>
        <VideoPlayer
          streamUrl="http://test.m3u8"
          title="Test Movie"
          media={mockMedia}
          onClose={handleClose}
        />
      </ToastProvider>
    );

    const video = document.querySelector('video') as HTMLVideoElement;
    Object.defineProperty(video, 'currentTime', { value: 25, writable: true });

    // Click close button
    const closeBtn = screen.getByLabelText('Cerrar');
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    expect(mockUpdatePlaybackPosition).toHaveBeenCalledWith('test-media-123', 250000000);
    expect(handleClose).toHaveBeenCalled();
  });
});
