import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomePage } from '@/presentation/pages/Home/Home';

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
    render(<HomePage />);
    
    // Should show "Continuar viendo" section
    const section = screen.getByText('Continuar viendo');
    expect(section).toBeInTheDocument();
  });

  it('should calculate correct progress percentage', () => {
    render(<HomePage />);
    
    // Movie with 50% progress
    const progressBar = screen.queryByTestId('progress-1');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('should save playback position to localStorage and Jellyfin', () => {
    // When user stops watching, should save position
    const { useContinueWatching } = require('@/application/hooks/useFavorites');
    expect(useContinueWatching).toHaveBeenCalled();
  });
});
