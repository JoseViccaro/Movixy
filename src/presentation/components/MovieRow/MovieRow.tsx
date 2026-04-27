import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Info, Plus, Check, Heart } from 'lucide-react';
import { ContextMenu, type ContextMenuItem } from '@/presentation/components/ContextMenu/ContextMenu';
import { OptimizedImage } from '@/presentation/components/OptimizedImage/OptimizedImage';
import styles from './MovieRow.module.css';
import type { Media } from '@/domain/models/media.model';

interface MovieRowProps {
  title: string;
  movies: Media[];
  onSelect: (media: Media) => void;
  onPlay?: (media: Media) => void;
  onToggleFavorite?: (media: Media) => void;
}

export const MovieRow = ({ title, movies, onSelect, onPlay, onToggleFavorite }: MovieRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    media: Media;
  } | null>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, movie: Media) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPlay?.(movie);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, movie: Media) => {
    e.preventDefault();
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      media: movie,
    });
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  const getContextMenuItems = (media: Media): ContextMenuItem[] => [
    { label: 'Reproducir', icon: <Play size={16} />, onClick: () => onPlay?.(media) },
    { label: 'Ver detalles', icon: <Info size={16} />, onClick: () => onSelect(media) },
    ...(onToggleFavorite
      ? [{
          label: media.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos',
          icon: <Heart size={16} />,
          onClick: () => onToggleFavorite(media),
        }]
      : []),
  ];

  if (movies.length === 0) return null;

  return (
    <div className={styles.row} role="region" aria-label={title}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.container}>
        <button
          className={`${styles.sliderButton} ${styles.left}`}
          onClick={() => handleScroll('left')}
          aria-label={`Desplazar ${title} a la izquierda`}
        >
          <ChevronLeft size={40} aria-hidden="true" />
        </button>

        <div className={styles.slider} ref={rowRef} role="list">
          {movies.map((movie) => (
            <div
              key={movie.id}
              className={styles.card}
              onContextMenu={(e) => handleContextMenu(e, movie)}
              onKeyDown={(e) => handleKeyDown(e, movie)}
              onClick={() => onPlay?.(movie)}
              role="listitem"
              tabIndex={0}
              aria-label={`${movie.title}, calificación ${movie.voteAverage}`}
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
                  <div className={styles.progressBar} style={{ width: `${movie.watchedPercentage}%` }} />
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
          ))}
        </div>

        <button
          className={`${styles.sliderButton} ${styles.right}`}
          onClick={() => handleScroll('right')}
          aria-label={`Desplazar ${title} a la derecha`}
        >
          <ChevronRight size={40} aria-hidden="true" />
        </button>
      </div>

      {contextMenu && (
        <ContextMenu
          items={getContextMenuItems(contextMenu.media)}
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
};
