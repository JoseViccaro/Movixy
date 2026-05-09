import { Play, Info, Star } from 'lucide-react';
import styles from './Hero.module.css';
import { OptimizedImage } from '@/presentation/components/OptimizedImage/OptimizedImage';
import { useBackdrop } from '@/presentation/components/ImmersiveBackdrop/BackdropContext';
import { useEffect } from 'react';
import type { Media } from '@/domain/models/media.model';

import { MediaPlaybackService } from '@/application/services/media-playback.service';

interface HeroProps {
  movie: Media | null;
  userId: string;
  onPlay: () => void;
  onMoreInfo: () => void;
}

export const Hero = ({ movie, userId, onPlay, onMoreInfo }: HeroProps) => {
  const { setUrl } = useBackdrop();

  useEffect(() => {
    if (movie?.backdropPath) {
      setUrl(movie.backdropPath);
    }
    // Pre-resolve the hero movie for instant start
    if (movie && userId) {
      MediaPlaybackService.preResolve(movie, userId).catch(() => {});
    }
  }, [movie, userId, setUrl]);

  if (!movie) return <div className={styles.heroSkeleton}></div>;

  return (
    <div className={styles.hero}>
      <div className={styles.imageContainer}>
        <OptimizedImage 
          src={movie.backdropPath} 
          alt={movie.title} 
          className={styles.image} 
          priority={true}
        />
        <div className={styles.vignette}></div>
        <div className={styles.bottomFade}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.badge}>
          <Star size={12} fill="#f5c518" stroke="#f5c518" />
          <span>{movie.voteAverage?.toFixed(1)}</span>
        </div>
        <h1 className={styles.title}>{movie.title}</h1>
        <p className={styles.overview}>
          {movie.overview?.length > 180
            ? `${movie.overview.substring(0, 180)}...`
            : movie.overview}
        </p>

        <div className={styles.buttons}>
          <button className={styles.playButton} onClick={onPlay} data-focusable="true">
            <Play fill="black" size={22} />
            <span>Reproducir</span>
          </button>
          <button className={styles.infoButton} onClick={onMoreInfo} data-focusable="true">
            <Info size={22} />
            <span>Más info</span>
          </button>
        </div>
      </div>
    </div>
  );
};
