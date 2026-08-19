import React, { useState, Suspense, lazy, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeries } from '@/application/hooks/useMedia';
import { MovieCard } from '@/presentation/components/MovieRow/MovieCard';
import { Skeleton } from '@/presentation/components/Skeleton/Skeleton';
import { MediaPlaybackService } from '@/application/services/media-playback.service';
import { useFavoriteToggle } from '@/application/hooks/useFavorites';
import type { Media } from '@/domain/models/media.model';
import styles from '../Movies/Gallery.module.css';

// Lazy load heavy components
const MediaModal = lazy(() =>
  import('@/presentation/components/MediaModal/MediaModal').then((m) => ({ default: m.MediaModal })),
);

export const SeriesPage: React.FC = () => {
  const userId = localStorage.getItem('movixy_user_id') || '';
  const navigate = useNavigate();
  const { data: series = [], isLoading } = useSeries(userId);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const { mutate: toggleFavorite } = useFavoriteToggle(userId);

  const handlePlay = (media: Media, startPositionSeconds?: number) => {
    if (typeof startPositionSeconds === 'number') {
      navigate(`/play/${media.id}?startPosition=${startPositionSeconds}`);
    } else {
      navigate(`/play/${media.id}`);
    }
  };

  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleHover = React.useCallback((media: Media) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      MediaPlaybackService.preResolve(media, userId).catch(() => {});
    }, 300);
  }, [userId]);

  const handleToggleFavorite = (media: Media) => {
    toggleFavorite({ mediaId: media.id, isFavorite: !media.isFavorite });
  };

  if (isLoading && series.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Series</h1>
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <Skeleton key={i} type="card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Series</h1>
      <div className={styles.grid}>
        {series.map((item) => (
          <MovieCard 
            key={item.id} 
            movie={item} 
            onSelect={setSelectedMedia}
            onPlay={handlePlay}
            onToggleFavorite={handleToggleFavorite}
            onHover={handleHover}
          />
        ))}
      </div>

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
};

export default SeriesPage;
