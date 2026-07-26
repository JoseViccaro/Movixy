import React, { useState, Suspense, lazy, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites, useFavoriteToggle } from '@/application/hooks/useFavorites';
import { MovieCard } from '@/presentation/components/MovieRow/MovieCard';
import { Skeleton } from '@/presentation/components/Skeleton/Skeleton';
import { MediaPlaybackService } from '@/application/services/media-playback.service';
import type { Media } from '@/domain/models/media.model';
import styles from '../Movies/Gallery.module.css';

// Lazy load heavy components
const MediaModal = lazy(() =>
  import('@/presentation/components/MediaModal/MediaModal').then((m) => ({ default: m.MediaModal })),
);

export const FavoritesPage: React.FC = () => {
  const userId = localStorage.getItem('movixy_user_id') || '';
  const navigate = useNavigate();
  const { data: favorites = [], isLoading } = useFavorites(userId);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const { mutate: toggleFavorite } = useFavoriteToggle(userId);

  const handlePlay = (media: Media) => {
    navigate(`/play/${media.id}`);
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

  if (isLoading && favorites.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Mi lista</h1>
        <div className={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} type="card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mi lista</h1>
      {favorites.length === 0 ? (
        <p style={{ color: '#aaa', fontSize: '1.2rem', marginTop: '20px' }}>
          Aún no has añadido nada a tu lista.
        </p>
      ) : (
        <div className={styles.grid}>
          {favorites.map((item) => (
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
};

export default FavoritesPage;
