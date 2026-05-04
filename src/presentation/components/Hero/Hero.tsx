import { Play, Info } from 'lucide-react';
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
        <div className={styles.overlay}></div>
      </div>
      
      <div className={styles.content}>
        <h1 className={styles.title}>{movie.title}</h1>
        <p className={styles.overview}>
          {movie.overview?.length > 150 
            ? `${movie.overview.substring(0, 150)}...` 
            : movie.overview}
        </p>
        
        <div className={styles.buttons}>
          <button className={styles.playButton} onClick={onPlay} data-focusable="true">
            <Play fill="black" size={20} />
            <span>Play</span>
          </button>
          <button className={styles.infoButton} onClick={onMoreInfo} data-focusable="true">
            <Info size={20} />
            <span>More Info</span>
          </button>
        </div>
      </div>
    </div>
  );
};
