import { describe, it, expect } from 'vitest';
import type { Media, Movie, TVShow } from '@/domain/models/media.model';

describe('Media Model', () => {
  describe('Media type guard', () => {
    it('should accept valid movie media type', () => {
      const movie: Media = {
        id: '1',
        title: 'Test Movie',
        overview: 'A test movie',
        posterPath: '/poster.jpg',
        backdropPath: '/backdrop.jpg',
        releaseDate: '2024',
        voteAverage: 8.5,
        mediaType: 'movie',
      };
      expect(movie.mediaType).toBe('movie');
    });

    it('should accept valid tv media type', () => {
      const tvShow: Media = {
        id: '2',
        title: 'Test TV Show',
        overview: 'A test TV show',
        posterPath: '/poster.jpg',
        backdropPath: '/backdrop.jpg',
        releaseDate: '2024',
        voteAverage: 8.5,
        mediaType: 'tv',
      };
      expect(tvShow.mediaType).toBe('tv');
    });

    it('should accept episode media type with episode info', () => {
      const episode: Media = {
        id: '3',
        title: 'S01 E01: The Beginning',
        overview: 'First episode',
        posterPath: '/poster.jpg',
        backdropPath: '/backdrop.jpg',
        releaseDate: '2024',
        voteAverage: 8.0,
        mediaType: 'episode',
        seasonNumber: 1,
        episodeNumber: 1,
      };
      expect(episode.mediaType).toBe('episode');
      expect(episode.seasonNumber).toBe(1);
      expect(episode.episodeNumber).toBe(1);
    });
  });

  describe('Movie extends Media', () => {
    it('should have movie mediaType', () => {
      const movie: Movie = {
        id: '1',
        title: 'Test Movie',
        overview: 'A test movie',
        posterPath: '/poster.jpg',
        backdropPath: '/backdrop.jpg',
        releaseDate: '2024',
        voteAverage: 8.5,
        mediaType: 'movie',
      };
      expect(movie.mediaType).toBe('movie');
    });
  });

  describe('TVShow extends Media', () => {
    it('should have tv mediaType', () => {
      const tvShow: TVShow = {
        id: '2',
        title: 'Test TV Show',
        overview: 'A test TV show',
        posterPath: '/poster.jpg',
        backdropPath: '/backdrop.jpg',
        releaseDate: '2024',
        voteAverage: 8.5,
        mediaType: 'tv',
      };
      expect(tvShow.mediaType).toBe('tv');
    });
  });
});