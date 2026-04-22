import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './MovieRow.module.css';
import type { Media } from '@/domain/models/media.model';

interface MovieRowProps {
  title: string;
  movies: Media[];
  onPlay: (media: Media) => void;
}

export const MovieRow = ({ title, movies, onPlay }: MovieRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.row}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.container}>
        <button 
          className={`${styles.sliderButton} ${styles.left}`} 
          onClick={() => handleScroll('left')}
        >
          <ChevronLeft size={40} />
        </button>

        <div className={styles.slider} ref={rowRef}>
          {movies.map((movie) => (
            <div key={movie.id} className={styles.card} onClick={() => onPlay(movie)}>
              <img 
                src={movie.posterPath} 
                alt={movie.title} 
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
        >
          <ChevronRight size={40} />
        </button>
      </div>
    </div>
  );
};
