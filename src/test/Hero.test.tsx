import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Hero } from '@/presentation/components/Hero/Hero';
import type { Media } from '@/domain/models/media.model';

vi.mock('@/presentation/components/ImmersiveBackdrop/BackdropContext', () => ({
  useBackdrop: () => ({ setUrl: vi.fn() })
}));

const mockMovie: Media = {
  id: '1',
  title: 'Cinematic Movie',
  overview: 'This is a premium cinematic movie overview.',
  posterPath: '/poster.jpg',
  backdropPath: '/backdrop.jpg',
  releaseDate: '2026-01-01',
  voteAverage: 9.3,
  mediaType: 'movie',
};

describe('Hero Component', () => {
  it('renders movie title and overview', () => {
    render(
      <Hero 
        movie={mockMovie} 
        userId="user1" 
        onPlay={vi.fn()} 
        onMoreInfo={vi.fn()} 
      />
    );

    expect(screen.getByText('Cinematic Movie')).toBeInTheDocument();
    expect(screen.getByText('This is a premium cinematic movie overview.')).toBeInTheDocument();
  });

  it('triggers onPlay and onMoreInfo callbacks', () => {
    const handlePlay = vi.fn();
    const handleMoreInfo = vi.fn();

    render(
      <Hero 
        movie={mockMovie} 
        userId="user1" 
        onPlay={handlePlay} 
        onMoreInfo={handleMoreInfo} 
      />
    );

    const playBtn = screen.getByRole('button', { name: /reproducir/i });
    const infoBtn = screen.getByRole('button', { name: /más info/i });

    fireEvent.click(playBtn);
    expect(handlePlay).toHaveBeenCalledTimes(1);

    fireEvent.click(infoBtn);
    expect(handleMoreInfo).toHaveBeenCalledTimes(1);
  });
});
