import { useState, useEffect, useMemo, Suspense, lazy, useRef } from 'react';
import { Hero } from '@/presentation/components/Hero/Hero';
import { MovieRow } from '@/presentation/components/MovieRow/MovieRow';
import { FilterBar, type FilterState } from '@/presentation/components/FilterBar/FilterBar';
import { Skeleton } from '@/presentation/components/Skeleton/Skeleton';
import { Navbar } from '@/presentation/components/Navbar/Navbar';
import { usePopular, useMovies, useSeries, useFiltered, useSearch } from '@/application/hooks/useMedia';
import { useContinueWatching, useFavoriteToggle } from '@/application/hooks/useFavorites';
import { MediaPlaybackService } from '@/application/services/media-playback.service';
import { useDpadNavigation } from '@/presentation/hooks/useDpadNavigation';
import type { Media } from '@/domain/models/media.model';
import styles from './Home.module.css';

// Lazy load heavy components
const VideoPlayer = lazy(() =>
  import('@/presentation/components/VideoPlayer/VideoPlayer').then((m) => ({ default: m.VideoPlayer })),
);
const MediaModal = lazy(() =>
  import('@/presentation/components/MediaModal/MediaModal').then((m) => ({ default: m.MediaModal })),
);

export function HomePage() {
  const userId = localStorage.getItem('movixy_user_id') || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [playingMedia, setPlayingMedia] = useState<Media | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState('');

  // ── Data Fetching ──
  const { data: popular = [], isLoading: isLoadingPopular } = usePopular(userId);
  const { data: movies = [] } = useMovies(userId);
  const { data: series = [] } = useSeries(userId);
  const { data: continueWatching = [] } = useContinueWatching(userId);
  const { data: filtered = [] } = useFiltered(userId, filters || undefined);
  const { data: searchResults = [] } = useSearch(userId, searchQuery);
  const { mutate: toggleFavorite } = useFavoriteToggle(userId);

  const heroMovie = useMemo(() => popular[0] || null, [popular]);

  // Pre-initialize playback service
  useEffect(() => {
    if (userId) {
      MediaPlaybackService.create(userId).catch(console.error);
    }
  }, [userId]);

  // ── Handlers ──
  const handlePlay = async (media: Media) => {
    // Open player immediately for instant feedback
    setPlayingMedia(media);
    setPlaybackUrl(''); // Clear previous URL
    
    try {
      const url = await MediaPlaybackService.resolvePlaybackUrl(media, userId);
      setPlaybackUrl(url);
    } catch (error) {
      console.error('Error starting playback:', error);
      setPlayingMedia(null); // Close player on error
    }
  };

  const handleSelect = (media: Media) => setSelectedMedia(media);
  const handleSearch = (query: string) => setSearchQuery(query);
  const handleFilterChange = (newFilters: FilterState) => setFilters(newFilters);
  const handleToggleFavorite = (media: Media) => toggleFavorite({ mediaId: media.id, isFavorite: !media.isFavorite });

  // ── Pre-resolution (Hover) ──
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleHover = useMemo(() => {
    return (media: Media) => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
      hoverTimeout.current = setTimeout(() => {
        MediaPlaybackService.preResolve(media, userId).catch(() => {});
      }, 300);
    };
  }, [userId]);

  // ── D-pad Navigation ──
  useDpadNavigation({
    enabled: !playingMedia && !selectedMedia,
    onBack: () => {
      if (searchQuery) setSearchQuery('');
      else if (filters) setFilters(null);
    }
  });

  if (isLoadingPopular && popular.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <Navbar onSearch={handleSearch} onSelectMedia={handleSelect} />
        <Skeleton type="hero" />
        <div className={styles.skeletonRow}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} type="card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.home}>
      {!searchQuery && !filters ? (
        <>
          <Hero 
            movie={heroMovie} 
            userId={userId}
            onPlay={() => handlePlay(heroMovie!)} 
            onMoreInfo={() => handleSelect(heroMovie!)} 
          />
          
          <div className={styles.rows}>
            {continueWatching.length > 0 && (
              <div data-section="continue-watching">
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
            
            <div data-section="trending">
              <MovieRow 
                title="Tendencias ahora" 
                movies={popular} 
                onSelect={handleSelect}
                onPlay={handlePlay}
                onToggleFavorite={handleToggleFavorite}
                onHover={handleHover}
              />
            </div>
            
            <div data-section="movies">
              <MovieRow 
                title="Películas para ti" 
                movies={movies} 
                onSelect={handleSelect}
                onPlay={handlePlay}
                onToggleFavorite={handleToggleFavorite}
                onHover={handleHover}
              />
            </div>
            
            <div data-section="series">
              <MovieRow 
                title="Series populares" 
                movies={series} 
                onSelect={handleSelect}
                onPlay={handlePlay}
                onToggleFavorite={handleToggleFavorite}
                onHover={handleHover}
              />
            </div>
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
      {playingMedia && (
        <Suspense fallback={null}>
          <VideoPlayer
            streamUrl={playbackUrl}
            title={playingMedia.title}
            media={playingMedia}
            onClose={() => setPlayingMedia(null)}
          />
        </Suspense>
      )}

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
