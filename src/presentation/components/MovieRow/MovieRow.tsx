import { useRef, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ChevronLeft, ChevronRight, Play, Info, Heart } from 'lucide-react';
import { ContextMenu, type ContextMenuItem } from '@/presentation/components/ContextMenu/ContextMenu';
import { MovieCard } from './MovieCard';
import styles from './MovieRow.module.css';
import type { Media } from '@/domain/models/media.model';

interface MovieRowProps {
  title: string;
  movies: Media[];
  onSelect: (media: Media) => void;
  onPlay?: (media: Media) => void;
  onToggleFavorite?: (media: Media) => void;
  onHover?: (media: Media) => void;
}

export const MovieRow = ({ title, movies, onSelect, onPlay, onToggleFavorite, onHover }: MovieRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    media: Media;
  } | null>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    } else if (listRef.current) {
      // Manual scroll for virtual list
      const scrollAmount = 800; // Approx 4 cards
      const currentScroll = (listRef.current as unknown as { _outerRef?: { scrollLeft: number } })._outerRef?.scrollLeft ?? 0;
      const scrollTo = direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;
      listRef.current.scrollTo(scrollTo);
    }
  };

  useEffect(() => {
    // Pre-fetch images for smoother scrolling (Windows improvement)
    if (movies.length > 0) {
      const preloadCount = 5;
      movies.slice(0, preloadCount).forEach(movie => {
        const img = new Image();
        img.src = movie.posterPath;
      });
    }
  }, [movies]);

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
          data-focusable="true"
        >
          <ChevronLeft size={40} aria-hidden="true" />
        </button>

        {movies.length > 20 ? (
          <div data-testid="virtual-list">
            <List
              ref={listRef}
              height={450}
              itemCount={movies.length}
              itemSize={208} // 200px card + 8px gap
              layout="horizontal"
              width={window.innerWidth}
              className={styles.slider}
              style={{ overflowY: 'visible' }}
            >
              {({ index, style }) => {
                const movie = movies[index];
                return (
                  <div style={{ ...style, paddingRight: '8px', overflow: 'visible' }}>
                    <MovieCard 
                      movie={movie} 
                      onSelect={onSelect} 
                      onPlay={onPlay} 
                      onToggleFavorite={onToggleFavorite}
                      onHover={onHover}
                      handleContextMenu={handleContextMenu}
                      handleKeyDown={handleKeyDown}
                    />
                  </div>
                );
              }}
            </List>
          </div>
        ) : (
          <div className={styles.slider} ref={rowRef} role="list">
            {movies.map((movie) => (
              <MovieCard 
                key={movie.id}
                movie={movie} 
                onSelect={onSelect} 
                onPlay={onPlay} 
                onToggleFavorite={onToggleFavorite}
                onHover={onHover}
                handleContextMenu={handleContextMenu}
                handleKeyDown={handleKeyDown}
              />
            ))}
          </div>
        )}

        <button
          className={`${styles.sliderButton} ${styles.right}`}
          onClick={() => handleScroll('right')}
          aria-label={`Desplazar ${title} a la derecha`}
          data-focusable="true"
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
