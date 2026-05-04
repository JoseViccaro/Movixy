import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Login } from '@/presentation/components/Login/Login';
import { SplashScreen } from '@/presentation/components/SplashScreen/SplashScreen';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { secureStorage } from '@/core/utils/secure-storage';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  // Check if already authenticated
  const isAuth = secureStorage.isAuthenticated();
  const userId = localStorage.getItem('movixy_user_id');

  const handleSplashFinish = useCallback(() => {
    if (isAuth && userId) {
      navigate('/', { replace: true });
    } else {
      setShowSplash(false);
    }
  }, [isAuth, userId, navigate]);

  const handleLogin = async (_serverUrl: string, username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const client = new JellyfinApiClient();
      const response = await client.authenticate(username, password);

      secureStorage.setToken(response.AccessToken);
      localStorage.setItem('movixy_user_id', response.User.Id);
      localStorage.setItem('movixy_username', response.User.Name);

      navigate('/', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError('Credenciales incorrectas o servidor no disponible.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return <Login onLogin={handleLogin} isLoading={isLoading} error={error} />;
};

export default LoginPage;
