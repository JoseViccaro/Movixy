import React, { useState, Suspense, lazy, useRef } from 'react';
import { usePopular } from '@/application/hooks/useMedia';
import { MovieCard } from '@/presentation/components/MovieRow/MovieCard';
import { Skeleton } from '@/presentation/components/Skeleton/Skeleton';
import { MediaPlaybackService } from '@/application/services/media-playback.service';
import { useFavoriteToggle } from '@/application/hooks/useFavorites';
import type { Media } from '@/domain/models/media.model';
import styles from '../Movies/Gallery.module.css';

const VideoPlayer = lazy(() =>
  import('@/presentation/components/VideoPlayer/VideoPlayer').then((m) => ({ default: m.VideoPlayer })),
);
const MediaModal = lazy(() =>
  import('@/presentation/components/MediaModal/MediaModal').then((m) => ({ default: m.MediaModal })),
);

export const NewPage: React.FC = () => {
  const userId = localStorage.getItem('movixy_user_id') || '';
  const { data: popular = [], isLoading } = usePopular(userId);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [playingMedia, setPlayingMedia] = useState<Media | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState('');
  const { mutate: toggleFavorite } = useFavoriteToggle(userId);

  const handlePlay = async (media: Media) => {
    setPlayingMedia(media);
    setPlaybackUrl('');
    try {
      const url = await MediaPlaybackService.resolvePlaybackUrl(media, userId);
      setPlaybackUrl(url);
    } catch (error) {
      console.error('Error starting playback:', error);
      setPlayingMedia(null);
    }
  };

  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleHover = React.useMemo(() => {
    return (media: Media) => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
      hoverTimeout.current = setTimeout(() => {
        MediaPlaybackService.preResolve(media, userId).catch(() => {});
      }, 300);
    };
  }, [userId]);

  const handleToggleFavorite = (media: Media) => {
    toggleFavorite({ mediaId: media.id, isFavorite: !media.isFavorite });
  };

  if (isLoading && popular.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Novedades</h1>
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} type="card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Novedades</h1>
      <div className={styles.grid}>
        {popular.map((item) => (
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
};

export default NewPage;
