import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './core/router'
import { ToastProvider } from './presentation/components/Toast/Toast'
import { QueryProvider } from '@/core/providers/QueryProvider.tsx'
import { ErrorBoundary } from '@/presentation/components/ErrorBoundary/ErrorBoundary'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import './index.css'

// Registrar el listener del botón de atrás físico en Android/TV
if (Capacitor.isNativePlatform()) {
  App.addListener('backButton', ({ canGoBack }) => {
    const path = window.location.pathname;

    // 1. Si hay un botón de cerrar de algún overlay (reproductor, modal, trailer), lo clickeamos directamente para cerrarlo
    const closeButton = document.querySelector('[aria-label^="Cerrar"]') as HTMLButtonElement | null;
    if (closeButton) {
      closeButton.click();
      return;
    }

    // 2. Si hay un menú contextual abierto, lo cerramos simulando un click fuera (en el body)
    const contextMenu = document.querySelector('[role="menu"]');
    if (contextMenu) {
      document.body.click();
      return;
    }

    // 3. Si la búsqueda o filtros están activos en la home, simulamos Escape para limpiarlos
    const isSearchActive = document.querySelector('[data-section="results"]') !== null;
    if (isSearchActive) {
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(escEvent);
      return;
    }

    // 4. Navegación nativa de la app
    if (path === '/' || path === '/login') {
      App.exitApp();
    } else {
      if (canGoBack || window.history.length > 1) {
        window.history.back();
      } else {
        router.navigate('/');
      }
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Root-level boundary: catches crashes in providers and the router itself */}
    <ErrorBoundary>
      <QueryProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryProvider>
    </ErrorBoundary>
  </StrictMode>,
)
