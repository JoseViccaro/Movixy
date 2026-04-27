import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './MovieRow.module.css';
import type { Media } from '@/domain/models/media.model';

interface MovieRowProps {
  title: string;
  movies: Media[];
  onSelect: (media: Media) => void;
}

export const MovieRow = ({ title, movies, onSelect }: MovieRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);

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
    </div>
  );
};
