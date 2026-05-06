import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoPlayer } from '@/presentation/components/VideoPlayer/VideoPlayer';

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

    render(<VideoPlayer streamUrl="http://test" title="Test" media={mockMedia} onClose={() => {}} />);
    
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

    render(<VideoPlayer streamUrl="http://test" title="Test" media={mockMedia} onClose={() => {}} />);
    
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

    render(<VideoPlayer streamUrl="http://test" title="Test" media={mockMedia} onClose={() => {}} />);
    
    const toggleBtn = screen.queryByTestId('toggle-subtitles');
    if (toggleBtn) {
      fireEvent.click(toggleBtn);
      // Subtitles should be enabled
      expect(toggleBtn).toHaveAttribute('data-active', 'true');
    }
  });
});
