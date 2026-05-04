import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { AppLayout } from '@/presentation/layouts/AppLayout';

// Lazy-loaded pages for code splitting
const HomePage = lazy(() => import('@/presentation/pages/Home/Home').then(m => ({ default: m.Home })));
const PlayerPage = lazy(() => import('@/presentation/pages/Player/PlayerPage'));
const LoginPage = lazy(() => import('@/presentation/pages/Login/LoginPage'));

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
        element: <HomePage />,
      },
      {
        path: 'series',
        element: <HomePage />,
      },
      {
        path: 'new',
        element: <HomePage />,
      },
      {
        path: 'mylist',
        element: <HomePage />,
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
