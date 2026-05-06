import { Suspense, useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/presentation/components/ErrorBoundary/ErrorBoundary';
import { OfflineIndicator } from '@/presentation/components/OfflineIndicator/OfflineIndicator';
import { SplashScreen } from '@/presentation/components/SplashScreen/SplashScreen';
import { secureStorage } from '@/core/utils/secure-storage';

/**
 * AppLayout — Shared layout for authenticated pages.
 *
 * Auth check is async (AES-GCM decryption) so we defer rendering
 * until the token is resolved. This avoids a flash-redirect to /login
 * on every page load.
 */
export const AppLayout = () => {
  const [authState, setAuthState] = useState<'pending' | 'ok' | 'denied'>(
    'pending',
  );

  useEffect(() => {
    secureStorage.isAuthenticated().then((authenticated) => {
      const userId = localStorage.getItem('movixy_user_id');
      setAuthState(authenticated && !!userId ? 'ok' : 'denied');
    });
  }, []);

  if (authState === 'pending') return <SplashScreen />;
  if (authState === 'denied') return <Navigate to="/login" replace />;

  return (
    <ErrorBoundary>
      <div className="app-layout">
        <main>
          <Suspense fallback={<SplashScreen />}>
            <Outlet />
          </Suspense>
        </main>
        <OfflineIndicator />
      </div>
    </ErrorBoundary>
  );
};
