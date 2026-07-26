import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MovieRow } from '@/presentation/components/MovieRow/MovieRow';
import type { Media } from '@/domain/models/media.model';

import { BackdropProvider } from '@/presentation/components/ImmersiveBackdrop/BackdropProvider';

// Mock data
const mockMovies: Media[] = Array.from({ length: 100 }, (_, i) => ({
  id: `movie-${i}`,
  title: `Movie ${i}`,
  overview: '',
  posterPath: '/poster.jpg',
  backdropPath: '',
  releaseDate: '2024',
  voteAverage: 8.5,
  mediaType: 'movie' as const,
  isFavorite: false,
}));

describe('MovieRow Virtualization (T7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render react-window VirtualList for large lists', () => {
    render(
      <BackdropProvider>
        <MovieRow 
          title="Many Movies" 
          movies={mockMovies} 
          onSelect={() => {}} 
        />
      </BackdropProvider>
    );
    
    // Should use VirtualList from react-window
    const virtualList = screen.queryByTestId('virtual-list');
    expect(virtualList).toBeInTheDocument();
  });

  it('should render only visible items (not all 100)', () => {
    render(
      <BackdropProvider>
        <MovieRow 
          title="Many Movies" 
          movies={mockMovies} 
          onSelect={() => {}} 
        />
      </BackdropProvider>
    );
    
    // Should NOT render all 100 movie cards
    // The MovieCard component should have data-testid="movie-card"
    const cards = screen.queryAllByTestId('movie-card');
    expect(cards.length).toBeLessThan(100);
    expect(cards.length).toBeGreaterThan(0);
  });
});
