import { useState, lazy, Suspense } from 'react';
import { Navbar } from '@/presentation/components/Navbar/Navbar';
import { Hero } from '@/presentation/components/Hero/Hero';
import { MovieRow } from '@/presentation/components/MovieRow/MovieRow';
import { FilterBar } from '@/presentation/components/FilterBar/FilterBar';
import { Skeleton } from '@/presentation/components/Skeleton/Skeleton';
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

export const Home = () => {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const userId = localStorage.getItem('movixy_user_id');

  // ── UI State (lo único que queda en local state) ──────────────────────────
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [playingMedia, setPlayingMedia] = useState<Media | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [startPosition, setStartPosition] = useState<number | undefined>(undefined);
  const [currentSection, setCurrentSection] = useState('inicio');
  const [filters, setFilters] = useState<FilterOptions | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);

  // ── Queries (TanStack Query — con caché automático) ───────────────────────
  const { data: popular = [], isLoading: popularLoading } = usePopular(userId);
  const { data: moviesList = [], isLoading: moviesLoading } = useMovies(userId);
  const { data: seriesList = [], isLoading: seriesLoading } = useSeries(userId);
  const { data: continueWatching = [] } = useContinueWatching(userId);
  const { data: favorites = [] } = useFavorites(userId);
  const { data: searchResults = [] } = useSearch(userId, searchQuery);
  const { data: filteredResults = [], isLoading: isFiltering } = useFiltered(userId, filters);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: toggleFavorite } = useFavoriteToggle(userId);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNavigate = (section: string) => {
    setCurrentSection(section);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlay = async (media: Media) => {
    setIsPlayerLoading(true);
    setSelectedMedia(null);
    try {
      const client = new JellyfinApiClient();
      const repository = new JellyfinMediaRepository(client, userId!);

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
      setPlayingUrl(client.getStreamUrl(playableId));
      setPlayingMedia(media);
    } catch (error) {
      console.error('Playback error:', error);
    } finally {
      setIsPlayerLoading(false);
    }
  };

  const handleSelect = (media: Media) => setSelectedMedia(media);

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

  // ── Loading skeleton global (primera carga, sin datos en caché) ────────────
  const isInitialLoading = !userId || (popularLoading && moviesLoading && seriesLoading);
  if (isInitialLoading && !playingMedia && !selectedMedia) {
    return (
      <div style={{ backgroundColor: '#141414', minHeight: '100vh' }}>
        <Navbar onNavigate={handleNavigate} onSelectMedia={() => {}} currentSection={currentSection} />
        <Skeleton type="hero" />
        <div style={{ padding: '20px 4%', marginTop: '-100px', display: 'flex', gap: '15px', overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} type="card" />
          ))}
        </div>
        <div style={{ padding: '20px 4%', display: 'flex', gap: '15px', overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} type="card" />
          ))}
        </div>
      </div>
    );
  }

  const heroMovie = popular.length > 0 ? popular[0] : null;

  // ── Render Sections ───────────────────────────────────────────────────────
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
      <Navbar 
        onSearch={handleSearch} 
        onNavigate={handleNavigate} 
        onSelectMedia={handleSelect}
        currentSection={currentSection} 
      />

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
        <Suspense
          fallback={
            <div
              style={{
                backgroundColor: '#141414',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              Cargando...
            </div>
          }
        >
          <MediaModal
            media={selectedMedia}
            onClose={() => setSelectedMedia(null)}
            onPlay={handlePlay}
          />
        </Suspense>
      )}

      {(isPlayerLoading || (playingMedia && playingUrl)) && (
        <Suspense
          fallback={
            <div
              style={{
                backgroundColor: '#141414',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              Cargando reproductor...
            </div>
          }
        >
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
