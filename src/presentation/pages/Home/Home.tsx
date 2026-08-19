import { useState, useEffect, useMemo, useCallback, Suspense, lazy, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '@/presentation/components/Hero/Hero';
import { MovieRow } from '@/presentation/components/MovieRow/MovieRow';
import { FilterBar, type FilterState } from '@/presentation/components/FilterBar/FilterBar';
import type { FilterOptions } from '@/domain/repositories/media.repository';
import { Skeleton } from '@/presentation/components/Skeleton/Skeleton';
import { Navbar } from '@/presentation/components/Navbar/Navbar';
import { usePopular, useMovies, useSeries, useFiltered, useSearch } from '@/application/hooks/useMedia';
import { useContinueWatching, useFavoriteToggle } from '@/application/hooks/useFavorites';
import { MediaPlaybackService } from '@/application/services/media-playback.service';
import { useDpadNavigation } from '@/presentation/hooks/useDpadNavigation';
import type { Media } from '@/domain/models/media.model';
import styles from './Home.module.css';

// Lazy load heavy components
const MediaModal = lazy(() =>
  import('@/presentation/components/MediaModal/MediaModal').then((m) => ({ default: m.MediaModal })),
);

export function HomePage() {
  const userId = localStorage.getItem('movixy_user_id') || '';
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  // ── Data Fetching ──
  const { data: popular = [], isLoading: isLoadingPopular, error: popularError } = usePopular(userId);
  const { data: movies = [], error: moviesError } = useMovies(userId);
  const { data: series = [], error: seriesError } = useSeries(userId);
  const { data: continueWatching = [] } = useContinueWatching(userId);
  const { data: filtered = [] } = useFiltered(userId, filters as FilterOptions | null);
  const { data: searchResults = [] } = useSearch(userId, searchQuery);
  const { mutate: toggleFavorite } = useFavoriteToggle(userId);

  const fetchError = (popularError || moviesError || seriesError) as Error | null;

  const heroMovie = useMemo(() => popular[0] || null, [popular]);

  // Pre-initialize playback service
  useEffect(() => {
    if (userId) {
      MediaPlaybackService.create(userId).catch(console.error);
    }
  }, [userId]);

  // ── Handlers ──
  const handlePlay = (media: Media, startPositionSeconds?: number) => {
    if (typeof startPositionSeconds === 'number') {
      navigate(`/play/${media.id}?startPosition=${startPositionSeconds}`);
    } else {
      navigate(`/play/${media.id}`);
    }
  };

  const handleSelect = (media: Media) => setSelectedMedia(media);
  const handleFilterChange = (newFilters: FilterState) => setFilters(newFilters);
  const handleToggleFavorite = (media: Media) => toggleFavorite({ mediaId: media.id, isFavorite: !media.isFavorite });

  // ── Pre-resolution (Hover) ──
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleHover = useCallback((media: Media) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      MediaPlaybackService.preResolve(media, userId).catch(() => {});
    }, 300);
  }, [userId]);

  // D-pad navigation for home page
  useDpadNavigation({
    enabled: !selectedMedia,
  });

  return (
    <div className={styles.homeContainer}>
      <Navbar onSearch={setSearchQuery} onSelectMedia={handleSelect} />

      {fetchError && (
        <div className={styles.errorBanner}>
          <p>Error al cargar el contenido: {fetchError.message}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      )}

      {/* Hero Section */}
      <Hero
        movie={heroMovie}
        userId={userId}
        onMoreInfo={() => heroMovie && handleSelect(heroMovie)}
        onPlay={() => heroMovie && handlePlay(heroMovie)}
      />

      {/* Main Content Rows */}
      {!filters && !searchQuery ? (
        <>
          {continueWatching.length > 0 && (
            <div className={styles.rowSection} data-section="continue-watching">
              <MovieRow
                title="Continuar viendo"
                movies={continueWatching}
                onSelect={handleSelect}
                onPlay={handlePlay}
                onToggleFavorite={handleToggleFavorite}
                onHover={handleHover}
              />
            </div>
          )}

          <div className={styles.rowSection} data-section="popular">
            {isLoadingPopular ? (
              <div className={styles.skeletonRow}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} type="card" />
                ))}
              </div>
            ) : (
              <MovieRow
                title="Tendencias ahora"
                movies={popular}
                onSelect={handleSelect}
                onPlay={handlePlay}
                onToggleFavorite={handleToggleFavorite}
                onHover={handleHover}
              />
            )}
          </div>

          <div className={styles.rowSection} data-section="movies">
            <MovieRow
              title="Películas aclamadas"
              movies={movies}
              onSelect={handleSelect}
              onPlay={handlePlay}
              onToggleFavorite={handleToggleFavorite}
              onHover={handleHover}
            />
          </div>

          <div className={styles.rowSection} data-section="series">
            <MovieRow
              title="Series de televisión"
              movies={series}
              onSelect={handleSelect}
              onPlay={handlePlay}
              onToggleFavorite={handleToggleFavorite}
              onHover={handleHover}
            />
          </div>
        </>
      ) : (
        <div className={styles.searchResults} data-section="results">
          <FilterBar onFilterChange={handleFilterChange} />
          <MovieRow 
            title={searchQuery ? `Resultados para "${searchQuery}"` : "Contenido filtrado"} 
            movies={searchQuery ? searchResults : filtered} 
            onSelect={handleSelect}
            onPlay={handlePlay}
            onToggleFavorite={handleToggleFavorite}
            onHover={handleHover}
          />
        </div>
      )}

      {/* Modals and Overlays */}

      {selectedMedia && (
        <Suspense fallback={null}>
          <MediaModal
            media={selectedMedia}
            onClose={() => setSelectedMedia(null)}
            onPlay={handlePlay}
          />
        </Suspense>
      )}
    </div>
  );
}
