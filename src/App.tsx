import { useState } from 'react';
import { Login } from './presentation/components/Login/Login';
import { Home } from './presentation/pages/Home/Home';
import { ErrorBoundary } from './presentation/components/ErrorBoundary/ErrorBoundary';
import { OfflineIndicator } from './presentation/components/OfflineIndicator/OfflineIndicator';
import { ToastProvider } from './presentation/components/Toast/Toast';
import { JellyfinApiClient } from './data/sources/jellyfin-api.client';
import './index.css';

type AppState = 'login' | 'home';

function App() {
  const [appState, setAppState] = useState<AppState>(() => {
    const token = localStorage.getItem('movixy_token');
    const userId = localStorage.getItem('movixy_user_id');
    return token && userId ? 'home' : 'login';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (_serverUrl: string, username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const client = new JellyfinApiClient();
      const response = await client.authenticate(username, password);
      
      localStorage.setItem('movixy_token', response.AccessToken);
      localStorage.setItem('movixy_user_id', response.User.Id);
      localStorage.setItem('movixy_username', response.User.Name);
      
      setAppState('home');
    } catch (err) {
      console.error('Login error:', err);
      setError('Credenciales incorrectas o servidor no disponible.');
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
