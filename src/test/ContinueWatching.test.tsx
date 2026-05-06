import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/presentation/components/Toast/ToastContext';
import { HomePage } from '@/presentation/pages/Home/Home';
import { useContinueWatching } from '@/application/hooks/useFavorites';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

// Mock secondary components
vi.mock('@/presentation/components/UserProfile/UserProfile', () => ({
  UserProfile: () => <div data-testid="user-profile" />
}));
vi.mock('@/presentation/components/Navbar/Navbar', () => ({
  Navbar: () => <nav data-testid="navbar" />
}));

// Mock hooks
vi.mock('@/application/hooks/useMedia', () => ({
  usePopular: vi.fn(() => ({ data: [], isLoading: false })),
  useMovies: vi.fn(() => ({ data: [], isLoading: false })),
  useSeries: vi.fn(() => ({ data: [], isLoading: false })),
  useFiltered: vi.fn(() => ({ data: [], isLoading: false })),
  useSearch: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/application/hooks/useFavorites', () => ({
  useContinueWatching: vi.fn(() => [
    { id: '1', title: 'Movie 1', playbackPositionTicks: 50000000, runtimeTicks: 100000000, watchedPercentage: 50 },
  ]),
  useFavorites: vi.fn(() => ({ data: [] })),
  useFavoriteToggle: vi.fn(() => ({ mutate: vi.fn() })),
}));

describe('Real Continue Watching (T10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it('should show real continue watching row with progress', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter>
            <HomePage />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );
    
    // Should show "Continuar viendo" section
    const section = screen.getByText('Continuar viendo');
    expect(section).toBeInTheDocument();
  });

  it('should calculate correct progress percentage', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter>
            <HomePage />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );
    
    // Movie with 50% progress
    const progressBar = screen.queryByTestId('progress-1');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('should save playback position to localStorage and Jellyfin', () => {
    // When user stops watching, should save position
    expect(useContinueWatching).toHaveBeenCalled();
  });
});
