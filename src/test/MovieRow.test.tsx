import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MovieRow } from '../presentation/components/MovieRow/MovieRow';
import type { Media } from '../domain/models/media.model';

vi.mock('@/presentation/components/Toast/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('@/presentation/components/ImmersiveBackdrop/BackdropContext', () => ({
  useBackdrop: () => ({ setUrl: vi.fn() })
}));

const mockMovies: Media[] = [
  {
    id: '1',
    title: 'Test Movie 1',
    overview: 'Overview 1',
    posterPath: '/poster1.jpg',
    backdropPath: '/backdrop1.jpg',
    releaseDate: '2024-01-15',
    voteAverage: 8.5,
    mediaType: 'movie',
  },
  {
    id: '2',
    title: 'Test Movie 2',
    overview: 'Overview 2',
    posterPath: '/poster2.jpg',
    backdropPath: '/backdrop2.jpg',
    releaseDate: '2023-06-20',
    voteAverage: 7.2,
    mediaType: 'movie',
  },
];

vi.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="chevron-left">←</span>,
  ChevronRight: () => <span data-testid="chevron-right">→</span>,
  Play: () => <span data-testid="play">▶</span>,
  Plus: () => <span data-testid="plus">+</span>,
  Check: () => <span data-testid="check">✓</span>,
  Info: () => <span data-testid="info">i</span>,
}));

describe('MovieRow', () => {
  it('renders title correctly', () => {
    const handleSelect = vi.fn();
    render(<MovieRow title="Popular Movies" movies={mockMovies} onSelect={handleSelect} />);
    
    expect(screen.getByText('Popular Movies')).toBeInTheDocument();
  });

  it('renders all movies in the list', () => {
    const handleSelect = vi.fn();
    render(<MovieRow title="Popular Movies" movies={mockMovies} onSelect={handleSelect} />);
    
    expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
    expect(screen.getByText('Test Movie 2')).toBeInTheDocument();
  });

  it('calls onSelect with correct movie when clicked', () => {
    const handleSelect = vi.fn();
    render(<MovieRow title="Popular Movies" movies={mockMovies} onSelect={handleSelect} />);
    
    const firstCard = screen.getByText('Test Movie 1').closest('div');
    fireEvent.click(firstCard!);
    
    expect(handleSelect).toHaveBeenCalledWith(mockMovies[0]);
  });

  it('renders rating and year correctly', () => {
    const handleSelect = vi.fn();
    render(<MovieRow title="Popular Movies" movies={mockMovies} onSelect={handleSelect} />);
    
    expect(screen.getByText('8.5 ★')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('should not render when no movies', () => {
    const handleSelect = vi.fn();
    const { container } = render(<MovieRow title="Empty List" movies={[]} onSelect={handleSelect} />);
    
    expect(container.firstChild).toBeNull();
  });
});