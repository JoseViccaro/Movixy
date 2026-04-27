import { useEffect, useState, lazy, Suspense } from 'react';
import { Navbar } from '@/presentation/components/Navbar/Navbar';
import { Hero } from '@/presentation/components/Hero/Hero';
import { MovieRow } from '@/presentation/components/MovieRow/MovieRow';
import { FilterBar } from '@/presentation/components/FilterBar/FilterBar';
import { Skeleton } from '@/presentation/components/Skeleton/Skeleton';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { JellyfinMediaRepository } from '@/data/repositories/jellyfin-media.repository';
import type { Media } from '@/domain/models/media.model';
import type { FilterState } from '@/presentation/components/FilterBar/FilterBar';

const VideoPlayer = lazy(() => import('@/presentation/components/VideoPlayer/VideoPlayer').then(m => ({ default: m.VideoPlayer })));
const MediaModal = lazy(() => import('@/presentation/components/MediaModal/MediaModal').then(m => ({ default: m.MediaModal })));

export const Home = () => {
  const [popular, setPopular] = useState<Media[]>([]);
  const [moviesList, setMoviesList] = useState<Media[]>([]);
  const [seriesList, setSeriesList] = useState<Media[]>([]);
  const [continueWatching, setContinueWatching] = useState<Media[]>([]);
  const [favorites, setFavorites] = useState<Media[]>([]);
  const [searchResults, setSearchResults] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [playingMedia, setPlayingMedia] = useState<Media | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [startPosition, setStartPosition] = useState<number | undefined>(undefined);
  const [currentSection, setCurrentSection] = useState('inicio');
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [filteredResults, setFilteredResults] = useState<Media[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  const handleNavigate = (section: string) => {
    setCurrentSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const client = new JellyfinApiClient();
        const userId = localStorage.getItem('movixy_user_id');
        
        if (!userId) {
          window.location.reload();
          return;
        }

        const repository = new JellyfinMediaRepository(client, userId);
        
        const [popularData, moviesData, seriesData, continueData, favoritesData] = await Promise.all([
          repository.getPopular(),
          repository.getMovies(),
          repository.getSeries(),
          repository.getContinueWatching(),
          repository.getFavorites()
        ]);

        setPopular(popularData);
        setMoviesList(moviesData);
        setSeriesList(seriesData);
        setContinueWatching(continueData);
        setFavorites(favoritesData);
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
      
      // Calcular posición inicial desde playbackPositionTicks (ticks a segundos)
      const startPos = media.playbackPositionTicks 
        ? media.playbackPositionTicks / 10_000_000 
        : undefined;
      
      setStartPosition(startPos);
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

  const handleToggleFavorite = async (media: Media) => {
    try {
      const client = new JellyfinApiClient();
      const userId = localStorage.getItem('movixy_user_id')!;
      const repository = new JellyfinMediaRepository(client, userId);
      
      const newFavoriteStatus = !media.isFavorite;
      await repository.toggleFavorite(media.id, newFavoriteStatus);
      
      // Update local state
      const updateMediaList = (list: Media[]) =>
        list.map(m => m.id === media.id ? { ...m, isFavorite: newFavoriteStatus } : m);
      
      setPopular(updateMediaList);
      setMoviesList(updateMediaList);
      setSeriesList(updateMediaList);
      setFavorites(newFavoriteStatus 
        ? [...favorites, { ...media, isFavorite: true }]
        : favorites.filter(m => m.id !== media.id)
      );
      setContinueWatching(updateMediaList);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
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

  const handleFilterChange = async (newFilters: FilterState) => {
    setFilters(newFilters);
    
    const hasFilters = newFilters.genres.length > 0 || 
                      newFilters.years.length > 0 || 
                      newFilters.ratings.length > 0 || 
                      newFilters.languages.length > 0 || 
                      newFilters.mediaType !== 'all';
    
    if (!hasFilters) {
      setFilteredResults([]);
      setIsFiltering(false);
      return;
    }

    setIsFiltering(true);
    try {
      const client = new JellyfinApiClient();
      const userId = localStorage.getItem('movixy_user_id')!;
      const repository = new JellyfinMediaRepository(client, userId);
      const results = await repository.getFiltered(newFilters);
      setFilteredResults(results);
    } catch (error) {
      console.error('Filter error:', error);
    } finally {
      setIsFiltering(false);
    }
  };

  if (isLoading && !playingMedia && !selectedMedia) {
    return (
      <div style={{ backgroundColor: '#141414', minHeight: '100vh' }}>
        <Navbar onNavigate={handleNavigate} currentSection={currentSection} />
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

  const renderSections = () => {
    if (searchResults.length > 0) {
      return <MovieRow title="Resultados de búsqueda" movies={searchResults} onSelect={handleSelect} onPlay={handlePlay} onToggleFavorite={handleToggleFavorite} />;
    }

    if (filters && filteredResults.length > 0) {
      return <MovieRow title="Resultados filtrados" movies={filteredResults} onSelect={handleSelect} onPlay={handlePlay} onToggleFavorite={handleToggleFavorite} />;
    }

    if (isFiltering) {
      return (
        <div style={{ color: 'white', textAlign: 'center', padding: '50px' }}>
          <p>Buscando...</p>
        </div>
      );
    }

    switch (currentSection) {
      case 'inicio':
        return (
          <>
            {continueWatching.length > 0 && <MovieRow title="Continuar viendo" movies={continueWatching} onSelect={handleSelect} onPlay={handlePlay} onToggleFavorite={handleToggleFavorite} />}
            <MovieRow title="Tendencias" movies={popular} onSelect={handleSelect} onPlay={handlePlay} onToggleFavorite={handleToggleFavorite} />
            {moviesList.length > 0 && <MovieRow title="Películas" movies={moviesList} onSelect={handleSelect} onPlay={handlePlay} onToggleFavorite={handleToggleFavorite} />}
            {seriesList.length > 0 && <MovieRow title="Series" movies={seriesList} onSelect={handleSelect} onPlay={handlePlay} onToggleFavorite={handleToggleFavorite} />}
          </>
        );
      case 'movies':
        return moviesList.length > 0 ? (
          <MovieRow title="Todas las Películas" movies={moviesList} onSelect={handleSelect} onPlay={handlePlay} onToggleFavorite={handleToggleFavorite} />
        ) : (
          <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>
            <h2>No hay películas</h2>
          </div>
        );
      case 'series':
        return seriesList.length > 0 ? (
          <MovieRow title="Todas las Series" movies={seriesList} onSelect={handleSelect} onPlay={handlePlay} onToggleFavorite={handleToggleFavorite} />
        ) : (
          <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>
            <h2>No hay series</h2>
          </div>
        );
      case 'novedades':
        return popular.length > 0 ? (
          <MovieRow title="Novedades" movies={popular} onSelect={handleSelect} onPlay={handlePlay} onToggleFavorite={handleToggleFavorite} />
        ) : (
          <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>
            <h2>No hay novedades</h2>
          </div>
        );
      case 'mylist':
        return favorites.length > 0 ? (
          <MovieRow title="Mi Lista" movies={favorites} onSelect={handleSelect} onPlay={handlePlay} onToggleFavorite={handleToggleFavorite} />
        ) : (
          <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>
            <h2>Tu lista está vacía</h2>
            <p>Agrega contenido desde el botón + en los detalles de cada título</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ paddingBottom: '50px' }}>
      <Navbar onSearch={handleSearch} onNavigate={handleNavigate} currentSection={currentSection} />
      
      {currentSection === 'inicio' && (
        <FilterBar onFilterChange={handleFilterChange} />
      )}
      
      {heroMovie && currentSection === 'inicio' && !filters && (
        <Hero 
          movie={heroMovie} 
          onPlay={() => handlePlay(heroMovie)} 
          onMoreInfo={() => handleSelect(heroMovie)}
        />
      )}
      
      <div style={{ 
        marginTop: heroMovie && currentSection === 'inicio' && !filters ? '-100px' : '20px', 
        padding: '0 4%', 
        zIndex: 10, 
        position: 'relative' 
      }}>
        {renderSections()}
      </div>

      {selectedMedia && (
        <Suspense fallback={<div style={{ backgroundColor: '#141414', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Cargando...</div>}>
          <MediaModal 
            media={selectedMedia} 
            onClose={() => setSelectedMedia(null)} 
            onPlay={handlePlay}
          />
        </Suspense>
      )}

      {playingMedia && playingUrl && (
        <Suspense fallback={<div style={{ backgroundColor: '#141414', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Cargando reproductor...</div>}>
          <VideoPlayer 
            key={playingUrl}
            title={playingMedia.title}
            streamUrl={playingUrl}
            startPosition={startPosition}
            onClose={() => {
              setPlayingMedia(null);
              setPlayingUrl(null);
              setStartPosition(undefined);
            }}
          />
        </Suspense>
      )}
    </div>
  );
};
