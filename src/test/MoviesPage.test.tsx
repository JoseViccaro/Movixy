import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MoviesPage } from '@/presentation/pages/Movies/MoviesPage';

// Mock useMedia hook
vi.mock('@/application/hooks/useMedia', () => ({
  useMedia: vi.fn(() => ({
    movies: [],
    isLoading: false,
    isError: false,
  })),
}));

describe('MoviesPage (T3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the page title', () => {
    render(<MoviesPage />);
    expect(screen.getByText('Películas')).toBeInTheDocument();
  });

  it('should render movies grid', () => {
    render(<MoviesPage />);
    expect(screen.getByTestId('movies-grid')).toBeInTheDocument();
  });

  it('should show loading state when isLoading is true', () => {
    const { useMedia } = require('@/application/hooks/useMedia');
    (useMedia as any).mockReturnValue({
      movies: [],
      isLoading: true,
      isError: false,
    });

    render(<MoviesPage />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
});
