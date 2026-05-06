import { lazy } from 'react';

// Lazy-loaded pages for code splitting
// These are exported as components, so this file satisfies the 'only-export-components' rule.
export const HomePage = lazy(() => import('@/presentation/pages/Home/Home'));
export const PlayerPage = lazy(() => import('@/presentation/pages/Player/PlayerPage'));
export const LoginPage = lazy(() => import('@/presentation/pages/Login/LoginPage'));
export const MoviesPage = lazy(() => import('@/presentation/pages/Movies/MoviesPage'));
export const SeriesPage = lazy(() => import('@/presentation/pages/Series/SeriesPage'));
export const SearchPage = lazy(() => import('@/presentation/pages/Search/SearchPage'));
export const FavoritesPage = lazy(() => import('@/presentation/pages/Favorites/FavoritesPage'));
export const DetailsPage = lazy(() => import('@/presentation/pages/Details/DetailsPage'));
