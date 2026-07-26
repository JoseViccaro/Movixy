import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaModal } from '@/presentation/components/MediaModal/MediaModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Media } from '@/domain/models/media.model';

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
});
