import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/presentation/layouts/AppLayout';
import { HomePage, PlayerPage, LoginPage, MoviesPage, SeriesPage, SearchPage, FavoritesPage, DetailsPage } from './pages';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'movies',
        element: <MoviesPage />,
      },
      {
        path: 'series',
        element: <SeriesPage />,
      },
      {
        path: 'search',
        element: <SearchPage />,
      },
      {
        path: 'favorites',
        element: <FavoritesPage />,
      },
      {
        path: 'details/:id',
        element: <DetailsPage />,
      },
    ],
  },
  {
    path: '/play/:mediaId',
    element: <PlayerPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
