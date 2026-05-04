import { lazy } from 'react';

// Lazy-loaded pages for code splitting
// These are exported as components, so this file satisfies the 'only-export-components' rule.
export const HomePage = lazy(() => import('@/presentation/pages/Home/Home').then(m => ({ default: m.Home })));
export const PlayerPage = lazy(() => import('@/presentation/pages/Player/PlayerPage'));
export const LoginPage = lazy(() => import('@/presentation/pages/Login/LoginPage'));
