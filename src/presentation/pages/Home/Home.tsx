import { useEffect, useState } from 'react';
import { Navbar } from '@/presentation/components/Navbar/Navbar';
import { Hero } from '@/presentation/components/Hero/Hero';
import { MovieRow } from '@/presentation/components/MovieRow/MovieRow';
import { VideoPlayer } from '@/presentation/components/VideoPlayer/VideoPlayer';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { JellyfinMediaRepository } from '@/data/repositories/jellyfin-media.repository';
import type { Media } from '@/domain/models/media.model';

export const Home = () => {
  const [movies, setMovies] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingMedia, setPlayingMedia] = useState<Media | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const client = new JellyfinApiClient();
        const userId = import.meta.env.VITE_JELLYFIN_USER_ID;
        const repository = new JellyfinMediaRepository(client, userId);
        
        const data = await repository.getPopular();
        setMovies(data);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const handlePlay = async (media: Media) => {
    setIsLoading(true);
    try {
      const client = new JellyfinApiClient();
      const userId = import.meta.env.VITE_JELLYFIN_USER_ID;
      const repository = new JellyfinMediaRepository(client, userId);
      
      let playableId = media.id;
      
      // If it's a series, we need to find the first episode
      if (media.mediaType === 'tv') {
        const episodeId = await repository.getFirstEpisodeId(media.id);
        if (episodeId) {
          playableId = episodeId;
        }
      }
      
      setPlayingUrl(client.getStreamUrl(playableId));
      setPlayingMedia(media);
    } catch (error) {
      console.error('Playback error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !playingMedia) {
    return <div style={{ color: 'white', padding: '20px' }}>Loading your library...</div>;
  }

  const heroMovie = movies.length > 0 ? movies[0] : null;

  return (
    <div style={{ paddingBottom: '50px' }}>
      <Navbar />
      {heroMovie && <Hero movie={heroMovie} onPlay={() => handlePlay(heroMovie)} />}
      
      <div style={{ marginTop: heroMovie ? '-100px' : '20px', zIndex: 10, position: 'relative' }}>
        {movies.length > 0 ? (
          <>
            <MovieRow title="Tu Biblioteca" movies={movies} onPlay={handlePlay} />
            <MovieRow title="Recientes" movies={[...movies].reverse()} onPlay={handlePlay} />
          </>
        ) : (
          <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>
            <h2>Tu biblioteca está vacía</h2>
            <p>Asegúrate de que Jellyfin haya escaneado tus archivos en la carpeta /media.</p>
          </div>
        )}
      </div>

      {playingMedia && playingUrl && (
        <VideoPlayer 
          title={playingMedia.title}
          streamUrl={playingUrl}
          onClose={() => {
            setPlayingMedia(null);
            setPlayingUrl(null);
          }}
        />
      )}
    </div>
  );
};
