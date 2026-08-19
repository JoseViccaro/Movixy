import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaModal } from '@/presentation/components/MediaModal/MediaModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Media } from '@/domain/models/media.model';
import { TICKS_PER_SECOND } from '@/domain/models/resume-playback.model';

// Mock TanStack Hooks
vi.mock('@/application/hooks/useMedia', () => ({
  useSeasons: vi.fn(() => ({ data: [] })),
  useEpisodes: vi.fn(() => ({ data: [], isLoading: false, error: null })),
}));

vi.mock('@/application/hooks/useFavorites', () => ({
  useFavoriteToggle: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

const mockMedia: Media = {
  id: '1',
  title: 'Modal Movie Title',
  overview: 'This is a description of the modal movie.',
  posterPath: '/poster.jpg',
  backdropPath: '/backdrop.jpg',
  releaseDate: '2025-10-10',
  voteAverage: 8.9,
  mediaType: 'movie',
};

const mockResumableMedia: Media = {
  id: '2',
  title: 'Resumable Movie',
  overview: 'Partially watched movie.',
  posterPath: '/poster2.jpg',
  backdropPath: '/backdrop2.jpg',
  releaseDate: '2025-10-10',
  voteAverage: 8.5,
  mediaType: 'movie',
  playbackPositionTicks: 1800 * TICKS_PER_SECOND, // 30 mins
  runtimeTicks: 6000 * TICKS_PER_SECOND, // 100 mins (30% progress)
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

describe('MediaModal Component', () => {
  it('renders modal content correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MediaModal media={mockMedia} onClose={vi.fn()} onPlay={vi.fn()} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Modal Movie Title')).toBeInTheDocument();
    expect(screen.getByText('This is a description of the modal movie.')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <MediaModal media={mockMedia} onClose={handleClose} onPlay={vi.fn()} />
      </QueryClientProvider>
    );

    const closeBtn = screen.getByRole('button', { name: /cerrar modal/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('directly starts playback at position 0 when media is not resumable', () => {
    const handlePlay = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <MediaModal media={mockMedia} onClose={vi.fn()} onPlay={handlePlay} />
      </QueryClientProvider>
    );

    const playBtn = screen.getByRole('button', { name: /Reproducir Modal Movie Title/i });
    fireEvent.click(playBtn);

    expect(handlePlay).toHaveBeenCalledWith(mockMedia, 0);
  });

  it('opens resume choice dialog when clicking play on resumable media and handles resume/restart', () => {
    const handlePlay = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <MediaModal media={mockResumableMedia} onClose={vi.fn()} onPlay={handlePlay} />
      </QueryClientProvider>
    );

    const playBtn = screen.getByRole('button', { name: /Reproducir Resumable Movie/i });
    fireEvent.click(playBtn);

    // Dialog should open
    expect(screen.getByText('Continuar viendo')).toBeInTheDocument();
    expect(screen.getByText('En 30:00')).toBeInTheDocument();
    expect(handlePlay).not.toHaveBeenCalled();

    // Click resume
    const resumeBtn = screen.getByRole('button', { name: /Reanudar/i });
    fireEvent.click(resumeBtn);

    expect(handlePlay).toHaveBeenCalledWith(mockResumableMedia, 1800);
  });
});
