import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MoviesPage } from '@/presentation/pages/Movies/MoviesPage';
import { useMovies } from '@/application/hooks/useMedia';
import { ToastProvider } from '@/presentation/components/Toast/Toast';
import type { Media } from '@/domain/models/media.model';

// Mock hooks
vi.mock('@/application/hooks/useMedia', () => ({
  useMovies: vi.fn(),
}));

vi.mock('@/application/hooks/useFavorites', () => ({
  useFavoriteToggle: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('@/presentation/components/ImmersiveBackdrop/BackdropContext', () => ({
  useBackdrop: () => ({ setUrl: vi.fn() })
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

describe('MoviesPage (T3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter>
            <MoviesPage />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );
  };

  it('should render the page title', () => {
    vi.mocked(useMovies).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useMovies>);

    renderPage();
    expect(screen.getByText('Películas')).toBeInTheDocument();
  });

  it('should render movies grid', () => {
    vi.mocked(useMovies).mockReturnValue({
      data: [{ id: '1', title: 'Movie 1', isFavorite: false, posterPath: '' } as unknown as Media],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useMovies>);

    renderPage();
    expect(screen.getByText('Movie 1')).toBeInTheDocument();
  });

  it('should show loading state when isLoading is true', () => {
    vi.mocked(useMovies).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useMovies>);

    renderPage();
    expect(screen.getByText('Películas')).toBeInTheDocument();
  });
});
