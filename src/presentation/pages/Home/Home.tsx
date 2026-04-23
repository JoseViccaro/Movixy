import { useEffect, useState } from 'react';
import { Navbar } from '@/presentation/components/Navbar/Navbar';
import { Hero } from '@/presentation/components/Hero/Hero';
import { MovieRow } from '@/presentation/components/MovieRow/MovieRow';
import { VideoPlayer } from '@/presentation/components/VideoPlayer/VideoPlayer';
import { MediaModal } from '@/presentation/components/MediaModal/MediaModal';
import { Skeleton } from '@/presentation/components/Skeleton/Skeleton';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { JellyfinMediaRepository } from '@/data/repositories/jellyfin-media.repository';
import type { Media } from '@/domain/models/media.model';

export const Home = () => {
  const [popular, setPopular] = useState<Media[]>([]);
  const [moviesList, setMoviesList] = useState<Media[]>([]);
  const [seriesList, setSeriesList] = useState<Media[]>([]);
  const [continueWatching, setContinueWatching] = useState<Media[]>([]);
  const [searchResults, setSearchResults] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [playingMedia, setPlayingMedia] = useState<Media | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const client = new JellyfinApiClient();
        const userId = localStorage.getItem('movixy_user_id');
        
        if (!userId) {
          window.location.reload(); // Force check in App.tsx
          return;
        }

        const repository = new JellyfinMediaRepository(client, userId);
        
        const [popularData, moviesData, seriesData, continueData] = await Promise.all([
          repository.getPopular(),
          repository.getMovies(),
          repository.getSeries(),
          repository.getContinueWatching()
        ]);

        setPopular(popularData);
        setMoviesList(moviesData);
        setSeriesList(seriesData);
        setContinueWatching(continueData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePlay = async (media: Media) => {
    setIsLoading(true);
    setSelectedMedia(null); // Close modal when starting playback
    try {
      const client = new JellyfinApiClient();
      const userId = localStorage.getItem('movixy_user_id')!;
      const repository = new JellyfinMediaRepository(client, userId);
      
      let playableId = media.id;
      
      if (media.mediaType === 'tv') {
        const episodeId = await repository.getFirstEpisodeId(media.id);
        if (episodeId) {
          playableId = episodeId;
        } else {
          // If no episodes found, we can't play it
          throw new Error('No se encontraron episodios para esta serie.');
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

  const handleSelect = (media: Media) => {
    setSelectedMedia(media);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const client = new JellyfinApiClient();
      const userId = localStorage.getItem('movixy_user_id')!;
      const repository = new JellyfinMediaRepository(client, userId);
      const results = await repository.search(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  if (isLoading && !playingMedia && !selectedMedia) {
    return (
      <div style={{ backgroundColor: '#141414', minHeight: '100vh' }}>
        <Navbar />
        <Skeleton type="hero" />
        <div style={{ padding: '20px 4%', marginTop: '-100px', display: 'flex', gap: '15px', overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} type="card" />)}
        </div>
        <div style={{ padding: '20px 4%', display: 'flex', gap: '15px', overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} type="card" />)}
        </div>
      </div>
    );
  }

  const heroMovie = popular.length > 0 ? popular[0] : null;

  return (
    <div style={{ paddingBottom: '50px' }}>
      <Navbar onSearch={handleSearch} />
      {heroMovie && (
        <Hero 
          movie={heroMovie} 
          onPlay={() => handlePlay(heroMovie)} 
          onMoreInfo={() => handleSelect(heroMovie)}
        />
      )}
      
      <div style={{ marginTop: heroMovie ? '-100px' : '20px', zIndex: 10, position: 'relative' }}>
        {popular.length > 0 ? (
          <>
            {searchResults.length > 0 && <MovieRow title="Resultados de búsqueda" movies={searchResults} onSelect={handleSelect} />}
            {continueWatching.length > 0 && <MovieRow title="Continuar viendo" movies={continueWatching} onSelect={handleSelect} />}
            <MovieRow title="Tendencias" movies={popular} onSelect={handleSelect} />
            {moviesList.length > 0 && <MovieRow title="Películas" movies={moviesList} onSelect={handleSelect} />}
            {seriesList.length > 0 && <MovieRow title="Series" movies={seriesList} onSelect={handleSelect} />}
          </>
        ) : (
          <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>
            <h2>Tu biblioteca está vacía</h2>
            <p>Asegúrate de que Jellyfin haya escaneado tus archivos en la carpeta /media.</p>
          </div>
        )}
      </div>

      {selectedMedia && (
        <MediaModal 
          media={selectedMedia} 
          onClose={() => setSelectedMedia(null)} 
          onPlay={handlePlay}
        />
      )}

      {playingMedia && playingUrl && (
        <VideoPlayer 
          key={playingUrl}
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
