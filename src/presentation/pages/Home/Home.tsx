import { useState, lazy, Suspense, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Hero } from '@/presentation/components/Hero/Hero';
import { MovieRow } from '@/presentation/components/MovieRow/MovieRow';
import { FilterBar } from '@/presentation/components/FilterBar/FilterBar';
import { Skeleton } from '@/presentation/components/Skeleton/Skeleton';
import { Navbar } from '@/presentation/components/Navbar/Navbar';
import { useDpadNavigation } from '@/presentation/hooks/useDpadNavigation';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { JellyfinMediaRepository } from '@/data/repositories/jellyfin-media.repository';
import { usePopular, useMovies, useSeries, useSearch, useFiltered } from '@/application/hooks/useMedia';
import { useContinueWatching, useFavorites, useFavoriteToggle } from '@/application/hooks/useFavorites';
import type { Media } from '@/domain/models/media.model';
import type { FilterState } from '@/presentation/components/FilterBar/FilterBar';
import type { FilterOptions } from '@/domain/repositories/media.repository';

const VideoPlayer = lazy(() =>
  import('@/presentation/components/VideoPlayer/VideoPlayer').then((m) => ({ default: m.VideoPlayer })),
);
const MediaModal = lazy(() =>
  import('@/presentation/components/MediaModal/MediaModal').then((m) => ({ default: m.MediaModal })),
);

/**
 * Route-to-section mapping for content filtering (Windows logic)
 */
const ROUTE_SECTION_MAP: Record<string, string> = {
  '/': 'inicio',
  '/series': 'series',
  '/movies': 'movies',
  '/new': 'novedades',
  '/mylist': 'mylist',
};

export function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = localStorage.getItem('movixy_user_id') || '';
  
  // Section derived from URL
  const currentSection = ROUTE_SECTION_MAP[location.pathname] || 'inicio';

  // ── Queries (TanStack Query — Mac logic) ───────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions | null>(null);
  
  // Only fetch if user is logged in
  const shouldFetch = userId !== '';
  
  const { data: popular = [], isLoading: popularLoading } = usePopular(shouldFetch ? userId : '');
  const { data: moviesList = [], isLoading: moviesLoading } = useMovies(shouldFetch ? userId : '');
  const { data: seriesList = [], isLoading: seriesLoading } = useSeries(shouldFetch ? userId : '');
  const { data: continueWatching = [] } = useContinueWatching(shouldFetch ? userId : '');
  const { data: favorites = [] } = useFavorites(userId);
  const { data: searchResults = [] } = useSearch(userId, searchQuery);
  const { data: filteredResults = [], isLoading: isFiltering } = useFiltered(userId, filters);

  // ── UI State ──────────────────────────────────────────────────
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [playingMedia, setPlayingMedia] = useState<Media | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [startPosition, setStartPosition] = useState<number | undefined>(undefined);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);

  // ── Mutations ─────────────────────────────────────────────────
  const { mutate: toggleFavorite } = useFavoriteToggle(userId);

  // ── D-pad navigation (Windows addition) ───────────────────────
  const dpadEnabled = !selectedMedia && !playingMedia;
  useDpadNavigation({
    enabled: dpadEnabled,
    onBack: () => {
      if (location.pathname !== '/') {
        navigate('/');
      }
    },
  });

  // ── Handlers ──────────────────────────────────────────────────
  const handlePlay = async (media: Media) => {
    setIsPlayerLoading(true);
    setSelectedMedia(null);
    try {
      const client = await JellyfinApiClient.create();
      const repository = new JellyfinMediaRepository(client, userId);

      let playableId = media.id;

      if (media.mediaType === 'tv') {
        const episodeId = await repository.getFirstEpisodeId(media.id);
        if (episodeId) {
          playableId = episodeId;
        } else {
          throw new Error('No se encontraron episodios para esta serie.');
        }
      }

      const startPos = media.playbackPositionTicks
        ? media.playbackPositionTicks / 10_000_000
        : undefined;

      setStartPosition(startPos);
      const url = client.getStreamUrl(playableId);
      // Add a timestamp to avoid cache issues
      const cleanUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
      
      console.log(`[Playback] Playing: ${media.title} (ID: ${playableId})`);
      console.log(`[Playback] URL: ${cleanUrl}`);
      
      setPlayingUrl(cleanUrl);
      setPlayingMedia(media);
     } catch (error: unknown) {
      console.error('Playback error:', error);
      const message = error instanceof Error ? error.message : 'Error al intentar reproducir este contenido.';
      alert(message);
    } finally {
      setIsPlayerLoading(false);
    }
  };

  const handleSelect = useCallback((media: Media) => {
    setSelectedMedia(media);
  }, []);

  const handleToggleFavorite = (media: Media) => {
    toggleFavorite({ mediaId: media.id, isFavorite: !media.isFavorite });
  };

  const handleSearch = (query: string) => setSearchQuery(query);

  const handleFilterChange = (newFilters: FilterState) => {
    const hasFilters =
      newFilters.genres.length > 0 ||
      newFilters.years.length > 0 ||
      newFilters.ratings.length > 0 ||
      newFilters.languages.length > 0 ||
      newFilters.mediaType !== 'all';

    setFilters(hasFilters ? newFilters : null);
  };

  // ── Loading skeleton global ──────────────────────────────────
  const isInitialLoading = !userId || (popularLoading && moviesLoading && seriesLoading);
  if (isInitialLoading && !playingMedia && !selectedMedia) {
    return (
      <div style={{ backgroundColor: '#141414', minHeight: '100vh' }}>
        <Navbar onSearch={handleSearch} onSelectMedia={handleSelect} />
        <Skeleton type="hero" />
        <div style={{ padding: '20px 4%', marginTop: '-100px', display: 'flex', gap: '15px', overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} type="card" />
          ))}
        </div>
      </div>
    );
  }

  const heroMovie = popular.length > 0 ? popular[0] : null;

  // ── Render Sections ──────────────────────────────────────────
  const renderSections = () => {
    if (searchQuery.length > 2 && searchResults.length > 0) {
      return (
        <MovieRow
          title="Resultados de búsqueda"
          movies={searchResults}
          onSelect={handleSelect}
          onPlay={handlePlay}
          onToggleFavorite={handleToggleFavorite}
        />
      );
    }

    if (filters && filteredResults.length > 0) {
      return (
        <MovieRow
          title="Resultados filtrados"
          movies={filteredResults}
          onSelect={handleSelect}
          onPlay={handlePlay}
          onToggleFavorite={handleToggleFavorite}
        />
      );
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
            {continueWatching.length > 0 && (
              <MovieRow
                title="Continuar viendo"
                movies={continueWatching}
                onSelect={handleSelect}
                onPlay={handlePlay}
                onToggleFavorite={handleToggleFavorite}
              />
            )}
            <MovieRow
              title="Tendencias"
              movies={popular}
              onSelect={handleSelect}
              onPlay={handlePlay}
              onToggleFavorite={handleToggleFavorite}
            />
            <MovieRow
              title="Películas"
              movies={moviesList}
              onSelect={handleSelect}
              onPlay={handlePlay}
              onToggleFavorite={handleToggleFavorite}
            />
            <MovieRow
              title="Series"
              movies={seriesList}
              onSelect={handleSelect}
              onPlay={handlePlay}
              onToggleFavorite={handleToggleFavorite}
            />
          </>
        );
      case 'movies':
        return moviesList.length > 0 ? (
          <MovieRow
            title="Todas las Películas"
            movies={moviesList}
            onSelect={handleSelect}
            onPlay={handlePlay}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>
            <h2>No hay películas</h2>
          </div>
        );
      case 'series':
        return seriesList.length > 0 ? (
          <MovieRow
            title="Todas las Series"
            movies={seriesList}
            onSelect={handleSelect}
            onPlay={handlePlay}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>
            <h2>No hay series</h2>
          </div>
        );
      case 'novedades':
        return popular.length > 0 ? (
          <MovieRow
            title="Novedades"
            movies={popular}
            onSelect={handleSelect}
            onPlay={handlePlay}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>
            <h2>No hay novedades</h2>
          </div>
        );
      case 'mylist':
        return favorites.length > 0 ? (
          <MovieRow
            title="Mi Lista"
            movies={favorites}
            onSelect={handleSelect}
            onPlay={handlePlay}
            onToggleFavorite={handleToggleFavorite}
          />
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
      <Navbar onSearch={handleSearch} onSelectMedia={handleSelect} />

      {currentSection === 'inicio' && <FilterBar onFilterChange={handleFilterChange} />}

      {heroMovie && currentSection === 'inicio' && !filters && (
        <Hero
          movie={heroMovie}
          onPlay={() => handlePlay(heroMovie)}
          onMoreInfo={() => handleSelect(heroMovie)}
        />
      )}

      <div
        style={{
          marginTop: heroMovie && currentSection === 'inicio' && !filters ? '-100px' : '20px',
          padding: '0 4%',
          zIndex: 10,
          position: 'relative',
        }}
      >
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

      {(isPlayerLoading || (playingMedia && playingUrl)) && (
        <Suspense fallback={<div style={{ backgroundColor: '#141414', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Cargando reproductor...</div>}>
          {playingMedia && playingUrl && (
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
          )}
        </Suspense>
      )}
    </div>
  );
};
