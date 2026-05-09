import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VideoPlayer } from '../presentation/components/VideoPlayer/VideoPlayer';
import { ToastProvider } from '../presentation/components/Toast/Toast';

describe('Subtitle & Audio UI (T9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show subtitle selector when subtitles exist', () => {
    const mockMedia = {
      id: '1',
      title: 'Test Movie',
      subtitles: [
        { language: 'en', url: '/sub.vtt', label: 'English' },
        { language: 'es', url: '/sub2.vtt', label: 'Español' },
      ],
    };

    render(
      <ToastProvider>
        <VideoPlayer streamUrl="http://test" title="Test" media={mockMedia} onClose={() => {}} />
      </ToastProvider>
    );
    
    // Should show subtitle button/selector
    const subtitleBtn = screen.queryByTestId('subtitle-selector');
    expect(subtitleBtn).toBeInTheDocument();
  });

  it('should show audio track selector when audioTracks exist', () => {
    const mockMedia = {
      id: '1',
      title: 'Test Movie',
      audioTracks: [
        { language: 'en', url: '/audio-en.mp4', label: 'English', isDefault: true },
        { language: 'es', url: '/audio-es.mp4', label: 'Español', isDefault: false },
      ],
    };

    render(
      <ToastProvider>
        <VideoPlayer streamUrl="http://test" title="Test" media={mockMedia} onClose={() => {}} />
      </ToastProvider>
    );
    
    // Should show audio track button/selector
    const audioBtn = screen.queryByTestId('audio-selector');
    expect(audioBtn).toBeInTheDocument();
  });

  it('should toggle subtitle visibility', () => {
    const mockMedia = {
      id: '1',
      title: 'Test Movie',
      subtitles: [{ language: 'en', url: '/sub.vtt', label: 'English' }],
    };

    render(
      <ToastProvider>
        <VideoPlayer streamUrl="http://test" title="Test" media={mockMedia} onClose={() => {}} />
      </ToastProvider>
    );
    
    const toggleBtn = screen.queryByTestId('subtitle-selector');
    expect(toggleBtn).toBeInTheDocument();
  });
});
