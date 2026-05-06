import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MoviesPage } from '@/presentation/pages/Movies/MoviesPage';
import { useMovies } from '@/application/hooks/useMedia';

// Mock useMedia hook
vi.mock('@/application/hooks/useMedia', () => ({
  useMovies: vi.fn(),
}));

describe('MoviesPage (T3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useMovies as any).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
  });

  it('should render the page title', () => {
    render(<MoviesPage />);
    expect(screen.getByText('Películas')).toBeInTheDocument();
  });

  it('should render movies grid', () => {
    (useMovies as any).mockReturnValue({
      data: [{ id: '1', title: 'Movie 1' }],
      isLoading: false,
      isError: false,
    });
    render(<MoviesPage />);
    expect(screen.getByTestId('movies-grid')).toBeInTheDocument();
  });

  it('should show loading state when isLoading is true', () => {
    (useMovies as any).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
    });

    render(<MoviesPage />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
});
