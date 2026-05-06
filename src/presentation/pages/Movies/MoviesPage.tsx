import React from 'react';

import { useMovies } from '@/application/hooks/useMedia';
import { Skeleton } from '@/presentation/components/Skeleton/Skeleton';

export const MoviesPage: React.FC = () => {
  const userId = localStorage.getItem('movixy_user_id') || '';
  const { data: movies = [], isLoading, isError } = useMovies(userId);

  if (isLoading) {
    return (
      <div data-testid="loading-skeleton" style={{ padding: '20px 4%' }}>
        <h1>Películas</h1>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} type="card" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <div data-testid="error-state">Error al cargar películas.</div>;
  }

  return (
    <div data-testid="movies-page" style={{ padding: '20px 4%' }}>
      <h1>Películas</h1>
      <div data-testid="movies-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {movies.map((movie) => (
          <div key={movie.id} data-testid="movie-card">
            {movie.title}
          </div>
        ))}
      </div>
    </div>
  );
};
