import { useState, type ChangeEvent } from 'react';
import styles from './FilterBar.module.css';

export interface FilterState {
  genres: string[];
  years: number[];
  ratings: string[];
  languages: string[];
  mediaType: 'all' | 'movie' | 'tv';
}

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
}

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
  'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'
];

const YEARS = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => 2026 - i);

const RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'];

const LANGUAGES = [
  { code: 'en', name: 'Inglés' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Francés' },
  { code: 'de', name: 'Alemán' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: 'Japonés' },
  { code: 'ko', name: 'Coreano' },
  { code: 'zh', name: 'Chino' },
];

export const FilterBar = ({ onFilterChange }: FilterBarProps) => {
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    years: [],
    ratings: [],
    languages: [],
    mediaType: 'all',
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleFilter = (key: 'genres' | 'years' | 'ratings' | 'languages', value: string | number) => {
    setFilters(prev => {
      const current = prev[key] as (string | number)[];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      const newFilters = { ...prev, [key]: updated };
      onFilterChange(newFilters);
      return newFilters;
    });
  };

  const handleMediaTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as FilterState['mediaType'];
    setFilters(prev => {
      const newFilters = { ...prev, mediaType: value };
      onFilterChange(newFilters);
      return newFilters;
    });
  };

  const clearFilters = () => {
    const cleared = {
      genres: [],
      years: [],
      ratings: [],
      languages: [],
      mediaType: 'all' as const,
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters = filters.genres.length > 0 || 
                          filters.years.length > 0 || 
                          filters.ratings.length > 0 || 
                          filters.languages.length > 0 || 
                          filters.mediaType !== 'all';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.mediaTypeSelector}>
          <select 
            value={filters.mediaType} 
            onChange={handleMediaTypeChange}
            className={styles.select}
            aria-label="Tipo de contenido"
          >
            <option value="all">Todo</option>
            <option value="movie">Películas</option>
            <option value="tv">Series</option>
          </select>
        </div>

        <button 
          className={styles.toggleButton}
          onClick={() => setExpanded(expanded ? null : 'filters')}
          aria-expanded={expanded === 'filters'}
          aria-controls="filter-options"
        >
          Filtros {hasActiveFilters && <span className={styles.badge}>●</span>}
        </button>

        {hasActiveFilters && (
          <button className={styles.clearButton} onClick={clearFilters}>
            Limpiar
          </button>
        )}
      </div>

      {expanded === 'filters' && (
        <div id="filter-options" className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Géneros</h3>
            <div className={styles.options}>
              {GENRES.map(genre => (
                <button
                  key={genre}
                  className={`${styles.option} ${filters.genres.includes(genre) ? styles.active : ''}`}
                  onClick={() => toggleFilter('genres', genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Año</h3>
            <div className={`${styles.options} ${styles.yearsGrid}`}>
              {YEARS.map(year => (
                <button
                  key={year}
                  className={`${styles.option} ${filters.years.includes(year) ? styles.active : ''}`}
                  onClick={() => toggleFilter('years', year)}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Clasificación</h3>
            <div className={styles.options}>
              {RATINGS.map(rating => (
                <button
                  key={rating}
                  className={`${styles.option} ${filters.ratings.includes(rating) ? styles.active : ''}`}
                  onClick={() => toggleFilter('ratings', rating)}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Idioma</h3>
            <div className={styles.options}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  className={`${styles.option} ${filters.languages.includes(lang.code) ? styles.active : ''}`}
                  onClick={() => toggleFilter('languages', lang.code)}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
