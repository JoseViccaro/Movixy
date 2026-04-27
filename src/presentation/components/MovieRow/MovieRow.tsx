import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Info, Heart, HeartOff } from 'lucide-react';
import { ContextMenu, type ContextMenuItem } from '@/presentation/components/ContextMenu/ContextMenu';
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
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, movie: Media) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onSelect(movie);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, movie: Media) => {
    e.preventDefault();
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      media: movie,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const getContextMenuItems = (media: Media): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [
      {
        label: 'Reproducir',
        icon: <Play size={16} />,
        onClick: () => onPlay?.(media),
      },
      {
        label: 'Ver detalles',
        icon: <Info size={16} />,
        onClick: () => onSelect(media),
      },
    ];

    if (onToggleFavorite) {
      items.push({
        label: media.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos',
        icon: media.isFavorite ? <HeartOff size={16} /> : <Heart size={16} />,
        onClick: () => onToggleFavorite(media),
      });
    }

    return items;
  };

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

        <div className={styles.slider} ref={rowRef} role="list" aria-label={`Películas en ${title}`}>
          {movies.map((movie) => (
            <div 
              key={movie.id} 
              className={styles.card} 
              onClick={() => onSelect(movie)}
              onContextMenu={(e) => handleContextMenu(e, movie)}
              onKeyDown={(e) => handleKeyDown(e, movie)}
              role="listitem"
              tabIndex={0}
              aria-label={`${movie.title}, calificación ${movie.voteAverage} estrellas`}
            >
              <img 
                src={movie.posterPath} 
                alt={`Póster de ${movie.title}`}
                className={styles.poster}
                loading="lazy"
              />
              {movie.watchedPercentage !== undefined && movie.watchedPercentage > 0 && movie.watchedPercentage < 100 && (
                <div className={styles.progressBarContainer}>
                  <div 
                    className={styles.progressBar} 
                    style={{ width: `${movie.watchedPercentage}%` }}
                  />
                </div>
              )}
              <div className={styles.cardInfo}>
                <p className={styles.cardTitle}>{movie.title}</p>
                <div className={styles.meta}>
                  <span className={styles.rating}>{movie.voteAverage} ★</span>
                  <span className={styles.date}>{movie.releaseDate?.split('-')[0]}</span>
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
