import { useState } from 'react';
import { Login } from './presentation/components/Login/Login';
import { Home } from './presentation/pages/Home/Home';
import './index.css';

type AppState = 'login' | 'home';

function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (serverUrl: string, username: string, _password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // For now, store the server URL and go to home
      // When Jellyfin is running, this will authenticate via API
      localStorage.setItem('movixy_server', serverUrl);
      localStorage.setItem('movixy_user', username);
      
      // Simulating auth delay for UX feedback
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setAppState('home');
    } catch {
      setError('Could not connect to server. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      {appState === 'login' && (
        <Login onLogin={handleLogin} isLoading={isLoading} error={error} />
      )}
      {appState === 'home' && <Home />}
    </div>
  );
}

export default App;
