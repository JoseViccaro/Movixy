import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/presentation/layouts/AppLayout';
import { HomePage, PlayerPage, LoginPage } from './pages';

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
