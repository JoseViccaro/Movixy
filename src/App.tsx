import { useState } from 'react';
import { Login } from './presentation/components/Login/Login';
import { Home } from './presentation/pages/Home/Home';
import { ErrorBoundary } from './presentation/components/ErrorBoundary/ErrorBoundary';
import { OfflineIndicator } from './presentation/components/OfflineIndicator/OfflineIndicator';
import { ToastProvider } from './presentation/components/Toast/Toast';
import { JellyfinApiClient } from './data/sources/jellyfin-api.client';
import { secureStorage } from './core/utils/secure-storage';
import './index.css';

type AppState = 'login' | 'home';

function App() {
  const [appState, setAppState] = useState<AppState>(() => {
    const isAuth = secureStorage.isAuthenticated();
    const userId = localStorage.getItem('movixy_user_id');
    return isAuth && userId ? 'home' : 'login';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (serverUrl: string, username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Normalizamos la URL por si el usuario se olvidó el http://
      let formattedUrl = serverUrl.trim();
      if (!formattedUrl.startsWith('http') && !formattedUrl.startsWith('/')) {
        formattedUrl = `http://${formattedUrl}`;
      }
      // Quitamos la barra final si existe para evitar URLs dobles
      if (formattedUrl.endsWith('/')) {
        formattedUrl = formattedUrl.slice(0, -1);
      }

      // TRUCO MAESTRO: Si la URL es la de nuestro Jellyfin local, usamos el PROXY
      // Esto evita problemas de CORS en la TV.
      const currentHost = window.location.hostname;
      if (formattedUrl.includes(currentHost) && formattedUrl.includes(':8096')) {
        formattedUrl = '/jellyfin';
      }

      localStorage.setItem('movixy_server_url', formattedUrl);
      
      const client = new JellyfinApiClient();
      const response = await client.authenticate(username, password);
      
      secureStorage.setToken(response.AccessToken);
      localStorage.setItem('movixy_user_id', response.User.Id);
      localStorage.setItem('movixy_username', response.User.Name);
      
      setAppState('home');
    } catch (err: unknown) {
      console.error('Login error:', err);
      if (err instanceof Error && err.message.includes('401')) {
        setError('Contraseña o usuario incorrectos. Verificalos e intentá de nuevo.');
      } else {
        setError('No se pudo conectar al servidor. Verificá que la URL sea correcta y que el servidor esté encendido.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToastProvider>
      <div className="app">
        {appState === 'login' && (
          <Login onLogin={handleLogin} isLoading={isLoading} error={error} />
        )}
        {appState === 'home' && (
          <ErrorBoundary>
            <Home />
          </ErrorBoundary>
        )}
        <OfflineIndicator />
      </div>
    </ToastProvider>
  );
}

export default App;