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
import { BackdropProvider } from '@/presentation/components/ImmersiveBackdrop/BackdropProvider';
import { ImmersiveBackdrop } from '@/presentation/components/ImmersiveBackdrop/ImmersiveBackdrop';
import { Navbar } from '@/presentation/components/Navbar/Navbar';
import { useAppUpdate } from '@/application/hooks/useAppUpdate';
import { UpdateAvailableModal } from '@/presentation/components/UpdateAvailableModal/UpdateAvailableModal';

export const AppLayout = () => {
  const [authState, setAuthState] = useState<'pending' | 'ok' | 'denied'>(
    'pending',
  );

  const {
    status: updateStatus,
    isModalOpen: isUpdateModalOpen,
    currentVersion,
    latestRelease,
    progress: updateProgress,
    error: updateError,
    startUpdate,
    dismissModal: dismissUpdateModal,
  } = useAppUpdate({
    autoCheck: true,
    checkDelayMs: 3000,
    owner:
      (typeof import.meta !== 'undefined' &&
        import.meta.env &&
        import.meta.env.VITE_GITHUB_REPO_OWNER) ||
      'JoseViccaro',
    repo:
      (typeof import.meta !== 'undefined' &&
        import.meta.env &&
        import.meta.env.VITE_GITHUB_REPO_NAME) ||
      'Movixy',
  });

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
      <BackdropProvider>
        <div className="app-layout">
          <ImmersiveBackdrop />
          <Navbar />
          <main style={{ paddingTop: '70px', minHeight: '100vh' }}>
            <Suspense fallback={<SplashScreen />}>
              <Outlet />
            </Suspense>
          </main>
          <OfflineIndicator />
          <UpdateAvailableModal
            isOpen={isUpdateModalOpen}
            status={updateStatus}
            currentVersion={currentVersion}
            release={latestRelease}
            progress={updateProgress}
            error={updateError}
            onUpdate={startUpdate}
            onDismiss={dismissUpdateModal}
          />
        </div>
      </BackdropProvider>
    </ErrorBoundary>
  );
};

