import { Play, Plus, Check, Info } from 'lucide-react';
import { OptimizedImage } from '@/presentation/components/OptimizedImage/OptimizedImage';
import styles from './MovieRow.module.css';
import { useBackdrop } from '@/presentation/components/ImmersiveBackdrop/BackdropContext';
import type { Media } from '@/domain/models/media.model';

interface MovieCardProps {
  movie: Media;
  onSelect: (media: Media) => void;
  onPlay?: (media: Media) => void;
  onToggleFavorite?: (media: Media) => void;
  onHover?: (media: Media) => void;
  handleContextMenu?: (e: React.MouseEvent, movie: Media) => void;
  handleKeyDown?: (e: React.KeyboardEvent, movie: Media) => void;
}

export const MovieCard = ({ 
  movie, 
  onSelect, 
  onPlay, 
  onToggleFavorite, 
  onHover,
  handleContextMenu = () => {}, 
  handleKeyDown = () => {} 
}: MovieCardProps) => {
  const { setUrl } = useBackdrop();

  const handleMouseEnter = () => {
    setUrl(movie.backdropPath);
    onHover?.(movie);
  };

  return (
    <div
      className={styles.card}
      onContextMenu={(e) => handleContextMenu(e, movie)}
      onKeyDown={(e) => handleKeyDown(e, movie)}
      onMouseEnter={handleMouseEnter}
      onFocus={handleMouseEnter}
      onClick={() => onPlay?.(movie)}
      role="listitem"
      tabIndex={0}
      data-focusable="true"
      data-card="true"
      aria-label={`${movie.title}, calificación ${movie.voteAverage}`}
      data-testid="movie-card"
    >
      {/* Poster Image */}
      <OptimizedImage
        src={movie.posterPath}
        alt={`Póster de ${movie.title}`}
        className={styles.poster}
      />

      {/* Watched progress bar */}
      {movie.watchedPercentage !== undefined && movie.watchedPercentage > 0 && movie.watchedPercentage < 100 && (
        <div className={styles.progressBarContainer}>
          <div 
            className={styles.progressBar} 
            style={{ width: `${movie.watchedPercentage}%` }} 
            data-testid={`progress-${movie.id}`}
          />
        </div>
      )}

      {/* ── Hover Overlay ── */}
      <div className={styles.hoverOverlay}>
        {/* Quick action buttons */}
        <div className={styles.quickActions}>
          <button
            className={styles.playBtn}
            onClick={(e) => { e.stopPropagation(); onPlay?.(movie); }}
            aria-label={`Reproducir ${movie.title}`}
          >
            <Play size={18} fill="black" />
          </button>

          {onToggleFavorite && (
            <button
              className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(movie); }}
              aria-label={movie.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              {movie.isFavorite ? <Check size={16} /> : <Plus size={16} />}
            </button>
          )}

          <button
            className={styles.actionBtn}
            onClick={(e) => { e.stopPropagation(); onSelect(movie); }}
            aria-label={`Más info de ${movie.title}`}
          >
            <Info size={16} />
          </button>
        </div>

        {/* Card info */}
        <div className={styles.cardMeta} onClick={() => onSelect(movie)}>
          <p className={styles.cardTitle}>{movie.title}</p>
          <div className={styles.metaRow}>
            <span className={styles.rating}>{movie.voteAverage?.toFixed(1)} ★</span>
            <span className={styles.year}>{movie.releaseDate?.split('-')[0]}</span>
            <span className={styles.badge}>
              {movie.mediaType === 'tv' ? 'Serie' : 'Película'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
