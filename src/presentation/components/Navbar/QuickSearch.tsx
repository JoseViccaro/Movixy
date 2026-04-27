import { useSearch } from '@/application/hooks/useMedia';
import { OptimizedImage } from '@/presentation/components/OptimizedImage/OptimizedImage';
import styles from './QuickSearch.module.css';
import type { Media } from '@/domain/models/media.model';

interface QuickSearchProps {
  query: string;
  onSelect: (media: Media) => void;
}

export const QuickSearch = ({ query, onSelect }: QuickSearchProps) => {
  const userId = localStorage.getItem('movixy_user_id');
  const { data: results, isLoading } = useSearch(userId, query);

  if (!query || query.length < 2) return null;

  return (
    <div className={styles.dropdown}>
      {isLoading ? (
        <div className={styles.loading}>Buscando...</div>
      ) : results && results.length > 0 ? (
        <ul className={styles.resultsList}>
          {results.slice(0, 6).map((media) => (
            <li 
              key={media.id} 
              className={styles.resultItem}
              onClick={() => onSelect(media)}
            >
              <div className={styles.thumbnailWrapper}>
                <OptimizedImage 
                  src={media.posterPath} 
                  alt={media.title}
                  className={styles.thumbnail}
                />
              </div>
              <div className={styles.info}>
                <p className={styles.title}>{media.title}</p>
                <div className={styles.meta}>
                  <span className={styles.rating}>{media.voteAverage?.toFixed(1)} ★</span>
                  <span className={styles.year}>{media.releaseDate?.split('-')[0]}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.noResults}>No se encontraron resultados</div>
      )}
    </div>
  );
};
