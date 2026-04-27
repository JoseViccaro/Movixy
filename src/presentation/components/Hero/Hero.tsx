import { Play, Info, Star } from 'lucide-react';
import styles from './Hero.module.css';
import type { Media } from '@/domain/models/media.model';

interface HeroProps {
  movie: Media | null;
  onPlay: () => void;
  onMoreInfo: () => void;
}

export const Hero = ({ movie, onPlay, onMoreInfo }: HeroProps) => {
  if (!movie) return <div className={styles.heroSkeleton}></div>;

  return (
    <div className={styles.hero}>
      <div className={styles.imageContainer}>
        <img src={movie.backdropPath} alt={movie.title} className={styles.image} />
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
          <button className={styles.playButton} onClick={onPlay}>
            <Play fill="black" size={22} />
            <span>Reproducir</span>
          </button>
          <button className={styles.infoButton} onClick={onMoreInfo}>
            <Info size={22} />
            <span>Más info</span>
          </button>
        </div>
      </div>
    </div>
  );
};
