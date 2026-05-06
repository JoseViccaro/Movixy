import { describe, it, expect } from 'vitest';
import type { 
  Season, 
  Episode, 
  Subtitle, 
  AudioTrack, 
  Media, 
} from '@/domain/models/media.model';

describe('Extended Media Model (T1)', () => {
  describe('Season interface', () => {
    it('should create a valid Season object', () => {
      const season: Season = {
        number: 1,
        name: 'Season 1',
        episodeCount: 10,
        posterPath: '/path/to/poster.jpg'
      };
      
      expect(season.number).toBe(1);
      expect(season.name).toBe('Season 1');
      expect(season.episodeCount).toBe(10);
      expect(season.posterPath).toBe('/path/to/poster.jpg');
    });
  });

  describe('Episode interface', () => {
    it('should create a valid Episode object', () => {
      const episode: Episode = {
        number: 1,
        name: 'Pilot',
        overview: 'The beginning',
        runtime: 45,
        stillPath: '/path/to/still.jpg'
      };
      
      expect(episode.number).toBe(1);
      expect(episode.name).toBe('Pilot');
      expect(episode.runtime).toBe(45);
    });
  });

  describe('Subtitle interface', () => {
    it('should create a valid Subtitle object', () => {
      const subtitle: Subtitle = {
        language: 'en',
        url: '/path/to/subtitles/en.vtt',
        label: 'English'
      };
      
      expect(subtitle.language).toBe('en');
      expect(subtitle.url).toBe('/path/to/subtitles/en.vtt');
      expect(subtitle.label).toBe('English');
    });
  });

  describe('AudioTrack interface', () => {
    it('should create a valid AudioTrack object with isDefault false', () => {
      const track: AudioTrack = {
        language: 'en',
        url: '/path/to/audio/en.mp4',
        label: 'English',
        isDefault: false
      };
      
      expect(track.language).toBe('en');
      expect(track.isDefault).toBe(false);
    });

    it('should create a valid AudioTrack object with isDefault true', () => {
      const track: AudioTrack = {
        language: 'es',
        url: '/path/to/audio/es.mp4',
        label: 'Español',
        isDefault: true
      };
      
      expect(track.isDefault).toBe(true);
    });
  });

  describe('Extended Media interface', () => {
    it('should allow Media with seasons array', () => {
      const season: Season = { number: 1, name: 'S1', episodeCount: 10, posterPath: '' };
      
      const media: Media = {
        id: '1',
        title: 'Test Show',
        overview: 'Test',
        posterPath: '/poster.jpg',
        backdropPath: '/backdrop.jpg',
        releaseDate: '2024',
        voteAverage: 8.5,
        mediaType: 'tv',
        seasons: [season]
      };
      
      expect(media.seasons).toHaveLength(1);
      expect(media.seasons?.[0].number).toBe(1);
    });

    it('should allow Media with episodes array', () => {
      const episode: Episode = { number: 1, name: 'Ep1', overview: '', runtime: 45, stillPath: '' };
      
      const media: Media = {
        id: '1',
        title: 'Test Show',
        overview: 'Test',
        posterPath: '/poster.jpg',
        backdropPath: '/backdrop.jpg',
        releaseDate: '2024',
        voteAverage: 8.5,
        mediaType: 'tv',
        episodes: [episode]
      };
      
      expect(media.episodes).toHaveLength(1);
    });

    it('should allow Media with subtitles and audioTracks arrays', () => {
      const subtitle: Subtitle = { language: 'en', url: '/sub.vtt', label: 'EN' };
      const audioTrack: AudioTrack = { language: 'en', url: '/audio.mp4', label: 'EN', isDefault: true };
      
      const media: Media = {
        id: '1',
        title: 'Test Movie',
        overview: 'Test',
        posterPath: '/poster.jpg',
        backdropPath: '/backdrop.jpg',
        releaseDate: '2024',
        voteAverage: 8.5,
        mediaType: 'movie',
        subtitles: [subtitle],
        audioTracks: [audioTrack]
      };
      
      expect(media.subtitles).toHaveLength(1);
      expect(media.audioTracks).toHaveLength(1);
    });
  });
});
